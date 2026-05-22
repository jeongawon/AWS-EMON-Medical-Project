"""
chest-svc-v2 설정 — 순수 이미지 분석 엔진.
RAG/Bedrock 관련 설정 전부 제거. MODEL_DIR + LOG_LEVEL + PORT만.
"""

import os
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    model_dir: str = "/models"      # K8s subPath 마운트 경로 통일
    log_level: str = "INFO"
    port: int = 8002

    # Aurora DB — Secrets Manager에서 주입된 환경변수로 DSN 조립
    ops_db_url: str = ""
    ops_db_pool_min: int = 1
    ops_db_pool_max: int = 3

    model_config = {"env_file": ".env", "case_sensitive": False}


settings = Settings()
