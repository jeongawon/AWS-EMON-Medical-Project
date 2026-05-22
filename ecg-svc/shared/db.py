"""
modal_results DB 저장 헬퍼 — ecg/cxr/lab 공통 사용.

역할:
  - asyncpg 커넥션 풀 관리 (init_pool / close_pool)
  - modal_results 테이블 UPSERT (save_modal_result)

저장 조건:
  - encounter_id 있으면 → (encounter_id, modality) 기준 UPSERT  [정상 경로]
  - session_id만 있으면 → (session_id, modality) 기준 UPSERT    [폴백 경로]
  - 둘 다 없으면        → 저장 스킵
  - DB 풀 없으면        → 저장 스킵 (OPS_DB_URL 미설정 환경)
"""
from __future__ import annotations

import json
import logging
from typing import Any

import asyncpg

logger = logging.getLogger(__name__)

_pool: asyncpg.Pool | None = None


async def init_pool(dsn: str, min_size: int = 1, max_size: int = 3) -> None:
    """앱 startup 시 호출 — 커넥션 풀 생성."""
    global _pool
    if _pool is not None:
        return
    try:
        _pool = await asyncpg.create_pool(
            dsn=dsn,
            min_size=min_size,
            max_size=max_size,
            command_timeout=10,
        )
        logger.info("[db] Aurora pool ready")
    except Exception as e:
        logger.warning("[db] Aurora pool init failed (DB write disabled): %s", e)
        _pool = None


async def close_pool() -> None:
    """앱 shutdown 시 호출 — 커넥션 풀 정리."""
    global _pool
    if _pool:
        await _pool.close()
        _pool = None
        logger.info("[db] Aurora pool closed")


async def save_modal_result(
    *,
    modality: str,
    raw_response: dict[str, Any],
    encounter_id: str | None = None,
    session_id: str | None = None,
) -> bool:
    """
    modal_results 테이블에 UPSERT.

    Returns:
        True if saved, False if skipped or failed
    """
    if _pool is None:
        return False
    if not encounter_id and not session_id:
        return False

    risk_level = raw_response.get("risk_level", "routine")
    summary = raw_response.get("summary", "")
    raw_json = json.dumps(raw_response, ensure_ascii=False)

    try:
        async with _pool.acquire() as conn:
            if encounter_id:
                # 정상 경로: (encounter_id, modality) 기준 UPSERT
                await conn.execute(
                    """
                    INSERT INTO modal_results
                        (encounter_id, session_id, modality, raw_response, risk_level, summary)
                    VALUES ($1, $2, $3, $4::jsonb, $5, $6)
                    ON CONFLICT ON CONSTRAINT modal_results_enc_modality_unique DO UPDATE SET
                        session_id   = EXCLUDED.session_id,
                        raw_response = EXCLUDED.raw_response,
                        risk_level   = EXCLUDED.risk_level,
                        summary      = EXCLUDED.summary,
                        created_at   = NOW(),
                        synced_to_fhir = FALSE
                    """,
                    encounter_id, session_id,
                    modality.upper(), raw_json, risk_level, summary,
                )
            else:
                # 폴백 경로: (session_id, modality) 기준 UPSERT
                await conn.execute(
                    """
                    INSERT INTO modal_results
                        (session_id, modality, raw_response, risk_level, summary)
                    VALUES ($1, $2, $3::jsonb, $4, $5)
                    ON CONFLICT ON CONSTRAINT modal_results_session_modality_unique DO UPDATE SET
                        raw_response = EXCLUDED.raw_response,
                        risk_level   = EXCLUDED.risk_level,
                        summary      = EXCLUDED.summary,
                        created_at   = NOW(),
                        synced_to_fhir = FALSE
                    """,
                    session_id,
                    modality.upper(), raw_json, risk_level, summary,
                )

        logger.info(
            "[db] modal_result saved: modality=%s enc=%s session=%s risk=%s",
            modality, encounter_id, session_id, risk_level,
        )
        return True

    except Exception as e:
        # DB 저장 실패는 모달 응답 반환을 막지 않음 — 경고만 기록
        logger.warning(
            "[db] modal_result save failed (modality=%s enc=%s session=%s): %s",
            modality, encounter_id, session_id, e,
        )
        return False
