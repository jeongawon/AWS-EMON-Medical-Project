"""
ECG 서비스 FastAPI 진입점

엔드포인트:
  POST /predict  — ECG 분석 요청
  GET  /health   — 헬스체크 (ALB / k8s probe)
  GET  /ready    — readiness probe (모델 로드 완료 여부)
"""

import logging
import sys
from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse

from config import HOST, PORT, LOG_LEVEL, OPS_DB_URL, OPS_DB_POOL_MIN, OPS_DB_POOL_MAX
from shared.schemas import PredictRequest, PredictResponse
from shared.db import init_pool, close_pool, save_modal_result
from pipeline import ECGPipeline

# ------------------------------------------------------------------
# 로깅 설정
# ------------------------------------------------------------------
logging.basicConfig(
    level=LOG_LEVEL.upper(),
    format="%(asctime)s %(levelname)s %(name)s — %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger("ecg-svc")

# ------------------------------------------------------------------
# 파이프라인 싱글톤
# ------------------------------------------------------------------
pipeline = ECGPipeline()


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("서비스 시작 — 모델 로드 중...")
    pipeline.load()
    logger.info("서비스 준비 완료")
    if OPS_DB_URL:
        await init_pool(OPS_DB_URL, OPS_DB_POOL_MIN, OPS_DB_POOL_MAX)
    else:
        logger.warning("OPS_DB_URL not set — Aurora write disabled")
    yield
    await close_pool()
    logger.info("서비스 종료")


# ------------------------------------------------------------------
# FastAPI 앱
# ------------------------------------------------------------------
app = FastAPI(
    title="ECG 분석 서비스",
    description="MIMIC-IV 기반 24개 질환 다중 분류 ECG 모달 서비스",
    version="1.0.0",
    lifespan=lifespan,
)


# ------------------------------------------------------------------
# 엔드포인트
# ------------------------------------------------------------------
@app.post("/predict", response_model=PredictResponse)
async def predict(req: PredictRequest) -> PredictResponse:
    """ECG 신호 분석 및 임상 해석 결과 반환"""
    if not pipeline.ready:
        raise HTTPException(status_code=503, detail="모델 로딩 중입니다. 잠시 후 다시 시도하세요.")

    response = pipeline.predict(req)

    if response.status == "error":
        code = 400 if "찾을 수 없습니다" in (response.error or "") else 500
        raise HTTPException(status_code=code, detail=response.error)

    # Aurora 저장 — encounter_id 또는 session_id 있을 때만
    await save_modal_result(
        modality="ECG",
        raw_response=response.model_dump(),
        encounter_id=req.encounter_id,
        session_id=req.session_id,
    )

    return response


@app.get("/health")
async def health():
    """ALB 헬스체크 — 항상 200"""
    return {"status": "healthy"}


@app.get("/ready")
async def ready():
    """Readiness probe — 모델 로드 완료 후 200"""
    if not pipeline.ready:
        return JSONResponse(status_code=503, content={"status": "not_ready"})
    return {"status": "ready"}


# ------------------------------------------------------------------
# 전역 예외 핸들러
# ------------------------------------------------------------------
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.exception("처리되지 않은 예외: %s", exc)
    return JSONResponse(
        status_code=500,
        content={"detail": f"내부 서버 오류: {type(exc).__name__}"},
    )


# ------------------------------------------------------------------
# 직접 실행
# ------------------------------------------------------------------
if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=HOST,
        port=PORT,
        log_level=LOG_LEVEL.lower(),
        reload=False,
    )
