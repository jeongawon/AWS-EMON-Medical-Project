#!/bin/bash
set -e

# Aurora DB URL 조립 (Secrets Manager에서 주입된 개별 환경변수 → DSN)
if [ -n "${DB_HOST}" ] && [ -n "${DB_USERNAME}" ] && [ -n "${DB_PASSWORD}" ]; then
    export OPS_DB_URL="postgresql://${DB_USERNAME}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT:-5432}/${DB_NAME:-central_db}"
    echo "[entrypoint] Aurora DB URL configured (host=${DB_HOST})"
else
    echo "[entrypoint] DB credentials not set — Aurora write disabled"
fi

exec uvicorn main:app --host 0.0.0.0 --port 8002 --workers 1
