"""
db.py — Aurora PostgreSQL 저장 모듈 (DDL 확정 전 준비형)

역할:
- DB_SECRET_ARN 환경변수로 Secrets Manager에서 자격증명 조회
- Connection Pool 생성 (graceful: 실패해도 서비스 죽지 않음)
- save_narrative_if_ready(): DDL 확정 전에는 저장 skip, 확정 후 SQL만 교체

사용 위치:
- app/main.py → startup에서 init_db_pool() 호출
- app/main.py → /generate에서 save_narrative_if_ready() 호출
"""

import os
import json
import logging
from typing import Any

import boto3
import psycopg2
from psycopg2.pool import SimpleConnectionPool

logger = logging.getLogger(__name__)

_pool: SimpleConnectionPool | None = None
_db_ready: bool = False


def init_db_pool() -> bool:
    """
    DB_SECRET_ARN이 있고 Secret 조회/Aurora 연결이 가능하면 pool 생성.
    data-stack 미배포 또는 Secret 미준비 상태에서는 False 반환.
    """
    global _pool, _db_ready

    secret_arn = os.environ.get("DB_SECRET_ARN")
    if not secret_arn or secret_arn == "PENDING-FROM-DATA-STACK":
        logger.warning("DB_SECRET_ARN not set or pending. DB save disabled.")
        _db_ready = False
        return False

    try:
        region = os.environ.get("AWS_REGION", os.environ.get("AWS_DEFAULT_REGION", "ap-northeast-2"))
        sm = boto3.client("secretsmanager", region_name=region)
        secret = json.loads(sm.get_secret_value(SecretId=secret_arn)["SecretString"])

        _pool = SimpleConnectionPool(
            minconn=1,
            maxconn=int(os.environ.get("DB_POOL_MAX_CONN", "5")),
            host=secret["host"],
            port=int(secret.get("port", 5432)),
            dbname=secret.get("dbname") or secret.get("database"),
            user=secret["username"],
            password=secret["password"],
            connect_timeout=5,
        )
        _db_ready = True
        logger.info("DB pool initialized successfully.")
        return True

    except Exception as exc:
        logger.warning("DB pool init failed. DB save disabled: %s", exc)
        _pool = None
        _db_ready = False
        return False


def is_db_ready() -> bool:
    """DB 연결 풀이 준비되었는지 확인."""
    return _db_ready and _pool is not None


def save_narrative_if_ready(
    *,
    encounter_id: str | None,
    narrative: str,
    model_used: str,
    model_reason: str = "",
    rag_fallback: bool,
    rag_results: dict | list | None = None,
    modal_summary: dict | None = None,
) -> dict[str, Any]:
    """
    최종 소견을 Aurora에 저장한다.

    DDL 확정 전에는 실제 저장을 하지 않고 graceful fallback.
    DDL 확정 후 아래 주석의 SQL을 활성화하면 됨.

    Returns:
        {"stored": bool, "record_id": str|None, "warnings": list[str]}
    """
    if not encounter_id:
        return {
            "stored": False,
            "record_id": None,
            "warnings": ["save skipped: encounter_id missing (router fallback path)"],
        }

    if not is_db_ready():
        return {
            "stored": False,
            "record_id": None,
            "warnings": ["save skipped: DB is not ready (data-stack pending)"],
        }

    # ──────────────────────────────────────────────────────────────────────
    # DDL 확정 후 아래 블록의 주석을 해제하고 테이블/컬럼명을 맞춰 교체
    # ──────────────────────────────────────────────────────────────────────
    # try:
    #     conn = _pool.getconn()
    #     try:
    #         with conn.cursor() as cur:
    #             cur.execute(
    #                 """
    #                 INSERT INTO clinical_narratives
    #                     (encounter_id, narrative, model_used, model_reason,
    #                      rag_fallback, rag_results, modal_summary, created_at)
    #                 VALUES (%s, %s, %s, %s, %s, %s, %s, NOW())
    #                 RETURNING id
    #                 """,
    #                 (
    #                     encounter_id,
    #                     narrative,
    #                     model_used,
    #                     model_reason,
    #                     rag_fallback,
    #                     json.dumps(rag_results, ensure_ascii=False) if rag_results else None,
    #                     json.dumps(modal_summary, ensure_ascii=False) if modal_summary else None,
    #                 ),
    #             )
    #             record_id = cur.fetchone()[0]
    #         conn.commit()
    #         return {
    #             "stored": True,
    #             "record_id": str(record_id),
    #             "warnings": [],
    #         }
    #     except Exception as exc:
    #         conn.rollback()
    #         logger.error("DB save failed: %s", exc)
    #         return {
    #             "stored": False,
    #             "record_id": None,
    #             "warnings": [f"save failed: {type(exc).__name__}: {exc}"],
    #         }
    #     finally:
    #         _pool.putconn(conn)
    # except Exception as exc:
    #     logger.error("DB connection failed: %s", exc)
    #     return {
    #         "stored": False,
    #         "record_id": None,
    #         "warnings": [f"DB connection failed: {type(exc).__name__}: {exc}"],
    #     }

    # DDL 미확정 상태 — 저장 skip
    return {
        "stored": False,
        "record_id": None,
        "warnings": ["save skipped: table DDL is not finalized"],
    }
