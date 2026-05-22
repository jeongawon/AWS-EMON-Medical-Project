import os

# 서버
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", 8000))
LOG_LEVEL = os.getenv("LOG_LEVEL", "info")

# Aurora DB — Secrets Manager에서 주입된 환경변수로 DSN 조립
OPS_DB_URL    = os.getenv("OPS_DB_URL")
OPS_DB_POOL_MIN = int(os.getenv("OPS_DB_POOL_MIN", "1"))
OPS_DB_POOL_MAX = int(os.getenv("OPS_DB_POOL_MAX", "3"))
