#!/bin/bash
set -e

REGION="ap-northeast-2"
PROJECT_NAME="say2-6team"

CLUSTER_ARN="arn:aws:rds:ap-northeast-2:666803869796:cluster:say2-6team-aurora-cluster"
SECRET_ARN="arn:aws:secretsmanager:ap-northeast-2:666803869796:secret:say2-6team/aurora-credentials-9yLhmd"
DATABASE="central_db"

echo "=========================================="
echo "Aurora DB Schema & Migrations Setup"
echo "Using RDS Data API (no psql required)"
echo "=========================================="

# RDS Data API helper — SQL 한 줄씩 실행
run_sql() {
  local sql="$1"
  local desc="$2"
  aws rds-data execute-statement \
    --resource-arn "$CLUSTER_ARN" \
    --secret-arn "$SECRET_ARN" \
    --database "$DATABASE" \
    --sql "$sql" \
    --region "$REGION" \
    --output text > /dev/null
  echo "[OK] $desc"
}

echo ""
echo "[WARN] WARNING: This will execute SQL migrations on Aurora database '${DATABASE}'"
echo "   Cluster: ${CLUSTER_ARN}"
echo ""
read -p "Continue? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "Aborted."
  exit 0
fi

echo ""
echo "Running migrations..."
echo ""

# ── 001: encounters ──────────────────────────────────────────
run_sql "CREATE TABLE IF NOT EXISTS encounters (
    encounter_id       TEXT PRIMARY KEY,
    patient_id         TEXT NOT NULL,
    subject_id         VARCHAR(20),
    chief_complaint    TEXT,
    patient_name       VARCHAR(128),
    patient_age        INTEGER,
    patient_gender     VARCHAR(16),
    started_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    closed_at          TIMESTAMPTZ,
    status             VARCHAR(20) NOT NULL DEFAULT 'active',
    metadata           JSONB DEFAULT '{}'::jsonb
)" "001 encounters table"

run_sql "CREATE INDEX IF NOT EXISTS idx_enc_patient ON encounters(patient_id)" "001 idx_enc_patient"
run_sql "CREATE INDEX IF NOT EXISTS idx_enc_subject ON encounters(subject_id)" "001 idx_enc_subject"
run_sql "CREATE INDEX IF NOT EXISTS idx_enc_status_start ON encounters(status, started_at DESC)" "001 idx_enc_status_start"

# ── 002: modal_results ───────────────────────────────────────
run_sql "CREATE TABLE IF NOT EXISTS modal_results (
    id                 BIGSERIAL PRIMARY KEY,
    encounter_id       TEXT REFERENCES encounters(encounter_id) ON DELETE CASCADE,
    session_id         VARCHAR(64),
    subject_id         VARCHAR(20),
    modality           VARCHAR(16) NOT NULL,
    service_request_id VARCHAR(64),
    raw_response       JSONB NOT NULL,
    risk_level         VARCHAR(20),
    summary            TEXT,
    synced_to_fhir     BOOLEAN NOT NULL DEFAULT FALSE,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT modal_results_must_have_key CHECK (encounter_id IS NOT NULL OR session_id IS NOT NULL)
)" "002 modal_results table"

run_sql "CREATE UNIQUE INDEX IF NOT EXISTS modal_results_enc_modality_unique ON modal_results (encounter_id, modality) NULLS NOT DISTINCT" "002 unique enc+modality"
run_sql "CREATE UNIQUE INDEX IF NOT EXISTS modal_results_session_modality_unique ON modal_results (session_id, modality) NULLS NOT DISTINCT" "002 unique session+modality"
run_sql "CREATE INDEX IF NOT EXISTS idx_mr_enc     ON modal_results(encounter_id)" "002 idx_mr_enc"
run_sql "CREATE INDEX IF NOT EXISTS idx_mr_subject ON modal_results(subject_id)" "002 idx_mr_subject"
run_sql "CREATE INDEX IF NOT EXISTS idx_mr_risk    ON modal_results(risk_level)" "002 idx_mr_risk"
run_sql "CREATE INDEX IF NOT EXISTS idx_mr_created ON modal_results(created_at DESC)" "002 idx_mr_created"
run_sql "CREATE INDEX IF NOT EXISTS idx_mr_sr      ON modal_results(service_request_id)" "002 idx_mr_sr"
run_sql "CREATE INDEX IF NOT EXISTS idx_mr_raw_gin ON modal_results USING GIN (raw_response)" "002 idx_mr_raw_gin"
run_sql "CREATE INDEX IF NOT EXISTS idx_mr_session ON modal_results(session_id) WHERE session_id IS NOT NULL" "002 idx_mr_session"

# ── 003: diagnostic_reports ──────────────────────────────────
run_sql "CREATE TABLE IF NOT EXISTS diagnostic_reports (
    id                 BIGSERIAL PRIMARY KEY,
    encounter_id       TEXT REFERENCES encounters(encounter_id) ON DELETE CASCADE,
    session_id         VARCHAR(64),
    subject_id         VARCHAR(20),
    fhir_report_id     VARCHAR(64),
    ai_diagnosis       TEXT,
    ai_recommendations JSONB DEFAULT '[]'::jsonb,
    ai_risk_level      VARCHAR(20),
    physician_edits    TEXT,
    status             VARCHAR(20) NOT NULL DEFAULT 'preliminary',
    signed_by          VARCHAR(64),
    signed_at          TIMESTAMPTZ,
    last_reminder_at   TIMESTAMPTZ,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT diagnostic_reports_must_have_key CHECK (encounter_id IS NOT NULL OR session_id IS NOT NULL)
)" "003 diagnostic_reports table"

run_sql "CREATE UNIQUE INDEX IF NOT EXISTS diagnostic_reports_enc_unique     ON diagnostic_reports (encounter_id) NULLS NOT DISTINCT" "003 unique encounter_id"
run_sql "CREATE UNIQUE INDEX IF NOT EXISTS diagnostic_reports_session_unique ON diagnostic_reports (session_id)    NULLS NOT DISTINCT" "003 unique session_id"
run_sql "CREATE INDEX IF NOT EXISTS idx_dr_enc     ON diagnostic_reports(encounter_id)" "003 idx_dr_enc"
run_sql "CREATE INDEX IF NOT EXISTS idx_dr_subject ON diagnostic_reports(subject_id)" "003 idx_dr_subject"
run_sql "CREATE INDEX IF NOT EXISTS idx_dr_status  ON diagnostic_reports(status, created_at DESC)" "003 idx_dr_status"
run_sql "CREATE INDEX IF NOT EXISTS idx_dr_unsigned_reminder ON diagnostic_reports(created_at, last_reminder_at) WHERE status <> 'signed'" "003 idx_dr_unsigned_reminder"
run_sql "CREATE INDEX IF NOT EXISTS idx_dr_session ON diagnostic_reports(session_id) WHERE session_id IS NOT NULL" "003 idx_dr_session"

# ── 004: modal_events ────────────────────────────────────────
run_sql "CREATE TABLE IF NOT EXISTS modal_events (
    id           BIGSERIAL PRIMARY KEY,
    encounter_id TEXT,
    subject_id   VARCHAR(20),
    event_type   VARCHAR(40) NOT NULL,
    payload      JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
)" "004 modal_events table"

run_sql "CREATE INDEX IF NOT EXISTS idx_me_enc_time ON modal_events(encounter_id, created_at DESC)" "004 idx_me_enc_time"
run_sql "CREATE INDEX IF NOT EXISTS idx_me_subject  ON modal_events(subject_id)" "004 idx_me_subject"
run_sql "CREATE INDEX IF NOT EXISTS idx_me_type     ON modal_events(event_type)" "004 idx_me_type"

# ── 005: updated_at trigger ──────────────────────────────────
run_sql "CREATE OR REPLACE FUNCTION _bump_updated_at() RETURNS TRIGGER AS \$\$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
\$\$ LANGUAGE plpgsql" "005 _bump_updated_at function"

run_sql "DROP TRIGGER IF EXISTS trg_dr_updated_at ON diagnostic_reports" "005 drop old trigger"
run_sql "CREATE TRIGGER trg_dr_updated_at BEFORE UPDATE ON diagnostic_reports FOR EACH ROW EXECUTE FUNCTION _bump_updated_at()" "005 trg_dr_updated_at"

# ── 006: subject_id auto-fill trigger ────────────────────────
run_sql "CREATE OR REPLACE FUNCTION _fill_subject_id() RETURNS TRIGGER AS \$\$
BEGIN
    IF NEW.subject_id IS NULL AND NEW.encounter_id IS NOT NULL THEN
        SELECT subject_id INTO NEW.subject_id FROM encounters WHERE encounter_id = NEW.encounter_id;
    END IF;
    RETURN NEW;
END;
\$\$ LANGUAGE plpgsql" "006 _fill_subject_id function"

run_sql "DROP TRIGGER IF EXISTS trg_mr_fill_subject ON modal_results" "006 drop mr trigger"
run_sql "CREATE TRIGGER trg_mr_fill_subject BEFORE INSERT OR UPDATE OF encounter_id ON modal_results FOR EACH ROW EXECUTE FUNCTION _fill_subject_id()" "006 trg_mr_fill_subject"
run_sql "DROP TRIGGER IF EXISTS trg_dr_fill_subject ON diagnostic_reports" "006 drop dr trigger"
run_sql "CREATE TRIGGER trg_dr_fill_subject BEFORE INSERT OR UPDATE OF encounter_id ON diagnostic_reports FOR EACH ROW EXECUTE FUNCTION _fill_subject_id()" "006 trg_dr_fill_subject"
run_sql "DROP TRIGGER IF EXISTS trg_me_fill_subject ON modal_events" "006 drop me trigger"
run_sql "CREATE TRIGGER trg_me_fill_subject BEFORE INSERT OR UPDATE OF encounter_id ON modal_events FOR EACH ROW EXECUTE FUNCTION _fill_subject_id()" "006 trg_me_fill_subject"

# ── 007: fhir_sync_queue ─────────────────────────────────────
run_sql "CREATE TABLE IF NOT EXISTS fhir_sync_queue (
    id            BIGSERIAL PRIMARY KEY,
    encounter_id  TEXT NOT NULL,
    patient_id    TEXT,
    resource_type VARCHAR(40) NOT NULL,
    resource_id   TEXT NOT NULL,
    payload       JSONB NOT NULL,
    status        VARCHAR(20) NOT NULL DEFAULT 'pending',
    retry_count   INTEGER NOT NULL DEFAULT 0,
    last_error    TEXT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    synced_at     TIMESTAMPTZ
)" "007 fhir_sync_queue table"

run_sql "CREATE INDEX IF NOT EXISTS idx_fsq_pending  ON fhir_sync_queue(status, created_at) WHERE status = 'pending'" "007 idx_fsq_pending"
run_sql "CREATE INDEX IF NOT EXISTS idx_fsq_encounter ON fhir_sync_queue(encounter_id)" "007 idx_fsq_encounter"

# ── 008: device_tokens ───────────────────────────────────────
run_sql "CREATE TABLE IF NOT EXISTS device_tokens (
    id           BIGSERIAL PRIMARY KEY,
    user_id      TEXT,
    token        TEXT NOT NULL UNIQUE,
    platform     VARCHAR(20) NOT NULL,
    app_version  VARCHAR(20),
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
)" "008 device_tokens table"

run_sql "CREATE INDEX IF NOT EXISTS idx_dt_user     ON device_tokens(user_id)" "008 idx_dt_user"
run_sql "CREATE INDEX IF NOT EXISTS idx_dt_platform ON device_tokens(platform)" "008 idx_dt_platform"
run_sql "CREATE INDEX IF NOT EXISTS idx_dt_active   ON device_tokens(last_seen_at DESC)" "008 idx_dt_active"

echo ""
echo "=========================================="
echo "[OK] All migrations completed successfully!"
echo "=========================================="
echo ""
echo "Database: ${DATABASE}"
echo "Tables created:"
echo "  - encounters"
echo "  - modal_results       (session_id 지원)"
echo "  - diagnostic_reports  (session_id 지원)"
echo "  - modal_events"
echo "  - fhir_sync_queue"
echo "  - device_tokens"
echo ""
echo "Verify:"
echo "  aws rds-data execute-statement \\"
echo "    --resource-arn \"${CLUSTER_ARN}\" \\"
echo "    --secret-arn \"${SECRET_ARN}\" \\"
echo "    --database \"${DATABASE}\" \\"
echo "    --sql \"SELECT table_name FROM information_schema.tables WHERE table_schema='public'\" \\"
echo "    --region ${REGION}"
