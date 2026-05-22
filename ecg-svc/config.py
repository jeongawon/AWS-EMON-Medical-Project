import os
from pathlib import Path

# S3
S3_BUCKET     = os.getenv("S3_BUCKET", "say2-6team")
S3_MODEL_KEY  = os.getenv("S3_MODEL_KEY", "mimic/ecg/ecg_s6.onnx")
S3_DATA_KEY   = os.getenv("S3_DATA_KEY",  "mimic/ecg/ecg_s6.onnx.data")

# 로컬 모델 캐시 경로
MODEL_DIR     = Path(os.getenv("MODEL_DIR", "/app/models"))
MODEL_PATH    = MODEL_DIR / "ecg_s6.onnx"

# 서버
HOST          = os.getenv("HOST", "0.0.0.0")
PORT          = int(os.getenv("PORT", 8000))
LOG_LEVEL     = os.getenv("LOG_LEVEL", "info")

# Aurora DB — Secrets Manager에서 주입된 환경변수로 DSN 조립
# Task Definition의 secrets 블록에서 DB_HOST/DB_USERNAME/DB_PASSWORD 주입
OPS_DB_URL    = os.getenv("OPS_DB_URL")  # entrypoint에서 조립되거나 직접 주입
OPS_DB_POOL_MIN = int(os.getenv("OPS_DB_POOL_MIN", "1"))
OPS_DB_POOL_MAX = int(os.getenv("OPS_DB_POOL_MAX", "3"))
