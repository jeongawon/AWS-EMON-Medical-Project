#!/bin/bash
set -e

echo "=== RAG Service Starting ==="
echo "Downloading ChromaDB from S3..."
aws s3 sync "s3://${RAG_DB_BUCKET}/local_rag_db/" ./local_rag_db/ --quiet
echo "Download complete. DB size:"
du -sh ./local_rag_db/

# Aurora DB URL 조립 (Secrets Manager에서 주입된 개별 환경변수 → DSN)
if [ -n "${DB_HOST}" ] && [ -n "${DB_USERNAME}" ] && [ -n "${DB_PASSWORD}" ]; then
    export OPS_DB_URL="postgresql://${DB_USERNAME}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT:-5432}/${DB_NAME:-central_db}"
    echo "Aurora DB URL configured (host=${DB_HOST})"
else
    echo "[WARN] DB credentials not set — Aurora write disabled"
fi

echo "Starting RAG API server on port 8000..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000
