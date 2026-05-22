"""
종합 진단 소견서 생성기 — RAG-svc HTTP 위임 방식.

[역할 분리]
- 중앙 백엔드(여기): 환자 컨텍스트 + 모달 원본 조립 → RAG-svc에 전달
- RAG-svc: 유사 사례 검색 + 프롬프팅 + Bedrock 호출 + 소견서 생성 + Aurora 저장

[호출 흐름]
POST /reports/{encounter_id}/generate
  → generate_integrated_report(encounter_id)
     ├─ 1. 운영 DB에서 환자 컨텍스트 조회 (ops_encounters)
     ├─ 2. 운영 DB에서 모달 원본 조회 (ops_modal_results: ECG/CXR/LAB)
     ├─ 3. context 조립 → RAG-svc POST /generate 호출
     └─ 4. RAG-svc 응답(narrative, model_used, similar_cases) 반환

[주의]
Bedrock 호출은 RAG-svc가 전담. 중앙 백엔드는 Bedrock을 직접 호출하지 않는다.
"""
from __future__ import annotations

import json
import logging
from typing import Any

import httpx

from app.config import RAG_SVC_URL, MODAL_HTTP_TIMEOUT
from app.db import encounters as ops_encounters
from app.db import modal_results as ops_modal_results

logger = logging.getLogger(__name__)


def _build_patient_info(encounter: dict[str, Any]) -> dict[str, Any]:
    """encounters row → RAG-svc PatientInfo 포맷 변환."""
    meta = encounter.get("metadata") or {}
    if isinstance(meta, str):
        meta = json.loads(meta)

    return {
        "age": encounter.get("patient_age"),
        "gender": encounter.get("patient_gender"),
        "chief_complaint": encounter.get("chief_complaint"),
        "vitals": meta.get("vitals"),
        "past_history": meta.get("past_history"),
    }


async def generate_integrated_report(encounter_id: str) -> dict[str, Any]:
    """
    운영 DB에서 환자 컨텍스트 + 모달 원본을 읽어 RAG-svc에 소견서 생성 위임.

    Returns:
        {
          "narrative": str,        # RAG-svc가 생성한 소견서
          "model_used": str,       # RAG-svc가 사용한 모델 (Haiku / Sonnet)
          "similar_cases": list,   # RAG 검색 결과 메타데이터
          "stored": bool,          # RAG-svc의 Aurora 저장 여부
        }
    """
    # 1. 환자 컨텍스트 조회
    encounter = await ops_encounters.get_encounter(encounter_id)
    if encounter is None:
        raise ValueError(f"Encounter not found in ops DB: {encounter_id}")

    # 2. 모달 원본 조회 (ECG/CXR/LAB)
    modal_results = await ops_modal_results.get_all_modal_results(encounter_id)

    # 3. RAG-svc POST /generate 호출
    #    encounter_id 전달 → RAG-svc가 diagnostic_reports에 직접 저장
    payload = {
        "patient_info": _build_patient_info(encounter),
        "modal_results": modal_results,
        "encounter_id": encounter_id,
    }

    logger.info(
        "[report_generator] → RAG-svc /generate (enc=%s, modals=%s)",
        encounter_id, list(modal_results.keys()),
    )

    try:
        async with httpx.AsyncClient(timeout=MODAL_HTTP_TIMEOUT) as client:
            resp = await client.post(
                f"{RAG_SVC_URL.rstrip('/')}/generate",
                json=payload,
            )
            resp.raise_for_status()
            result = resp.json()
    except httpx.TimeoutException as e:
        raise RuntimeError(f"RAG-svc timeout: {e}") from e
    except httpx.HTTPStatusError as e:
        raise RuntimeError(
            f"RAG-svc HTTP {e.response.status_code}: {e.response.text[:300]}"
        ) from e
    except httpx.RequestError as e:
        raise RuntimeError(f"RAG-svc connection error: {e}") from e

    logger.info(
        "[report_generator] ← RAG-svc /generate OK (enc=%s, model=%s, stored=%s)",
        encounter_id, result.get("model_used"), result.get("stored"),
    )

    return {
        "narrative": result.get("narrative", ""),
        "model_used": result.get("model_used", "unknown"),
        "similar_cases": result.get("similar_cases", []),
        "stored": result.get("stored", False),
        "rag_fallback": result.get("rag_fallback", False),
    }
