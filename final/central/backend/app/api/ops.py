"""
운영 상태 API — 모달 서비스 개별 health check.

[엔드포인트]
  GET /ops/health  — ECG/CXR/LAB 각 서비스의 health 상태 반환

[사용처]
  프론트엔드 PatientDetailPage.tsx의 서버 ON/OFF 칩 — 15초 폴링
  모달 장애 시 의사 수기 입력 UI 자동 활성화
"""
from __future__ import annotations

import asyncio
import logging

from fastapi import APIRouter

from app.clients.modal_http import check_modal_health

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/health")
async def ops_health():
    """
    ECG / CXR / LAB 모달 서비스 개별 health 상태 반환.

    Response:
        {
          "ECG": true | false,
          "CXR": true | false,
          "LAB": true | false,
        }

    각 모달 서비스의 /health, /healthz, /ready, /readyz 순서로 시도.
    5초 타임아웃 내 200 OK면 true, 아니면 false.
    """
    ecg_ok, cxr_ok, lab_ok = await asyncio.gather(
        check_modal_health("ECG"),
        check_modal_health("CXR"),
        check_modal_health("LAB"),
    )

    result = {
        "ECG": ecg_ok,
        "CXR": cxr_ok,
        "LAB": lab_ok,
    }

    logger.info("[ops/health] %s", result)
    return result
