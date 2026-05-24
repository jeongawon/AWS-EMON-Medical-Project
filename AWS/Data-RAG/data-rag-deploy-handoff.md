# Data-RAG 서비스 배포 Handoff

> 배포일: 2026-05-22  
> 스택: `say2-6team-data-rag`  
> 담당: yji  
> 상태: ✅ 서비스 가동 중 (DB 저장 미활성)

---

## 1. 배포된 서비스 정보

| 항목 | 값 |
|------|-----|
| ECS Cluster | `say2-6team-ecs-cluster` |
| ECS Service | `say2-6team-rag-svc` |
| Cloud Map DNS | `rag-svc.say2-6team.local` |
| 포트 | 8000 |
| 이미지 | `666803869796.dkr.ecr.ap-northeast-2.amazonaws.com/say2-6team-rag-api:v2.1.0` |
| Task CPU/Memory | 512 (0.5 vCPU) / 1024 MB |
| S3 (ChromaDB) | `say2-6team-rag-db-666803869796` |
| ECR Repository | `say2-6team-rag-api` |

---

## 2. API 엔드포인트

### GET /health
ECS health check용. DB 상태와 무관하게 app alive 확인.
```json
{"status": "ok", "documents": 49743}
```

### GET /ready
운영 모니터링용. DB/Bedrock 상태 포함.
```json
{
  "status": "ok",
  "chroma_documents": 49743,
  "bedrock_client": true,
  "db_ready": false,
  "db_required": false
}
```

### POST /query
RAG 검색만 수행. Top-K 유사 사례 반환.
```json
// Request
{"query": "발열, 호흡곤란, WBC 18500, CXR consolidation"}

// Response
{
  "results": [
    {"id": "...", "document": "...", "metadata": {...}, "similarity": 0.86}
  ],
  "fallback": false
}
```

### POST /generate
검색 + 프롬프팅 + Bedrock Claude 호출 + 최종 소견 반환.
```json
// Request
{
  "patient_info": {
    "age": 65,
    "gender": "M",
    "chief_complaint": "fever, dyspnea",
    "vitals": {"HR": "110", "BP": "95/60", "SpO2": "91%"}
  },
  "modal_results": {
    "ecg": {"study_id": "ecg-1", "text": "Sinus tachycardia 110 bpm"},
    "cxr": [{"study_id": "cxr-1", "text": "RLL consolidation"}],
    "lab": {"WBC": "18500", "Lactate": "3.2 mmol/L"}
  },
  "encounter_id": "enc-001"
}

// Response
{
  "narrative": "...(병원 소견서 양식)...",
  "model_used": "Haiku",
  "rag_fallback": false,
  "similar_cases": [...],
  "stored": false,
  "warnings": ["save skipped: DB is not ready (data-stack pending)"]
}
```

---

## 3. 호출 경로

### 정상 경로 (Orchestrator 정상)
```
사용자 → ALB → Orchestrator → RAG /generate → 소견 반환
                             → ECG/CXR/LAB (Cloud Map)
```

### 폴백 경로 (Orchestrator 장애)
```
사용자 → ALB → Router → RAG /generate → 소견 반환
                      → ECG/CXR/LAB (Cloud Map)
```

---

## 4. 파트별 참고사항

### Orchestrator / Central 담당
- RAG 호출: `http://rag-svc.say2-6team.local:8000/generate`
- `encounter_id`를 포함해서 호출하면 향후 DB 저장 시 사용됨
- `encounter_id` 없으면 저장 skip (router 폴백 경로)
- 응답의 `stored` 필드로 저장 여부 확인 가능

### Router 담당
- RAG 호출 경로 동일: `http://rag-svc.say2-6team.local:8000/generate`
- `encounter_id`를 null로 보내면 저장 skip
- Router는 판단/DB 쓰기 하지 않음 — RAG가 소견 생성까지 담당

### 모달 서비스 (ECG/CXR/LAB) 담당
- RAG와 직접 통신 없음
- 모달 결과는 Orchestrator/Router가 취합해서 RAG에 전달
- 모달 서비스는 자체 추론 결과를 Aurora에 직접 저장 (별도 구현 필요)

### 프론트엔드 담당
- RAG 서비스에 직접 호출하지 않음 (ALB → Orchestrator/Router 경유)
- 최종 소견은 Orchestrator/Router 응답에 포함되어 전달됨

### 인프라/보안 담당
- SG: `say2-6team-rag-sg` (Central/Router에서 8000 인바운드 허용)
- IAM: `say2-6team-rag-task-role` (Bedrock InvokeModel + S3 + Secrets Manager + KMS)
- Aurora 접근: SG 열림 (`RAGEgressToAurora` + `AuroraIngressFromRAG`)

---

## 5. 미구현 사항 (TODO)

### 🔴 차단됨 — 외부 의존

| # | 항목 | 차단 이유 | 담당 |
|---|------|-----------|------|
| 1 | Aurora 저장 활성화 | data-stack 미배포 (Aurora 인스턴스 없음) | data 담당 |
| 2 | 테이블 DDL 확정 | 팀 합의 필요 | 전체 |
| 3 | 모달 서비스 DB 저장 로직 | 모달 코드에 구현 여부 미확인 | lji |

### 🟡 내가 할 수 있는 것 — data-stack 배포 후

| # | 항목 | 작업 내용 | 파일 |
|---|------|-----------|------|
| 4 | DB 저장 SQL 활성화 | `app/db.py`의 INSERT 주석 해제 + 테이블/컬럼명 맞추기 | `docker/app/db.py` |
| 5 | `GenerateResponse`에 `model_reason` 추가 | Pydantic 모델 필드 추가 | `docker/app/main.py` |
| 6 | `/health`에서 `db_required: true` 전환 | 저장 검증 완료 후 | `docker/app/main.py` |
| 7 | 이미지 재빌드 + 푸시 + 서비스 업데이트 | 위 변경 후 | CLI |

### 🟢 개선 권장 (급하지 않음)

| # | 항목 | 설명 |
|---|------|------|
| 8 | JSON 구조화 로깅 | CloudWatch Logs Insights 검색 용이 |
| 9 | Bedrock 호출 latency 메트릭 | CloudWatch Custom Metric |
| 10 | ALB idle timeout 검토 | Claude Sonnet 호출 시 10~30초 소요 가능 |
| 11 | Connection Pool 스케일링 대비 | Task 수 증가 시 RDS Proxy 검토 |
| 12 | Secret rotation 대응 | 장기 운영 시 refresh 로직 또는 RDS Proxy |

---

## 6. DDL 참고안 (확정 아님 — 팀 합의 필요)

```sql
CREATE TABLE clinical_narratives (
    id              SERIAL PRIMARY KEY,
    encounter_id    VARCHAR(64) NOT NULL,
    narrative       TEXT NOT NULL,
    model_used      VARCHAR(128),
    model_reason    VARCHAR(256),
    rag_fallback    BOOLEAN DEFAULT FALSE,
    rag_results     JSONB,
    modal_summary   JSONB,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_narratives_encounter ON clinical_narratives(encounter_id);
CREATE INDEX idx_narratives_created ON clinical_narratives(created_at);
```

---

## 7. 빌드/배포 명령어 참고

```bash
# 1. 이미지 빌드 (반드시 --platform linux/amd64)
docker build --platform linux/amd64 -t say2-6team-rag-api:v2.x.x ./architect/Data-RAG/docker/

# 2. ECR 로그인
aws ecr get-login-password --region ap-northeast-2 --profile say2-6team | \
  docker login --username AWS --password-stdin 666803869796.dkr.ecr.ap-northeast-2.amazonaws.com

# 3. 태그 + 푸시
docker tag say2-6team-rag-api:v2.x.x 666803869796.dkr.ecr.ap-northeast-2.amazonaws.com/say2-6team-rag-api:v2.x.x
docker push 666803869796.dkr.ecr.ap-northeast-2.amazonaws.com/say2-6team-rag-api:v2.x.x

# 4. ECS 서비스 강제 재배포
aws ecs update-service --cluster say2-6team-ecs-cluster --service say2-6team-rag-svc \
  --force-new-deployment --profile say2-6team --region ap-northeast-2
```

---

## 관련 파일

| 파일 | 용도 |
|------|------|
| `Data-RAG/data-rag-stack.yaml` | CloudFormation 스택 템플릿 |
| `Data-RAG/docker/` | Docker 이미지 소스 (app/, Dockerfile, requirements.txt) |
| `Data-RAG/docker/app/main.py` | RAG API 서버 v2.1.0 |
| `Data-RAG/docker/app/db.py` | Aurora 저장 모듈 (DDL 확정 전 준비형) |
| `Data-RAG/docker/app/central_final_opinion_builder.py` | Bedrock 프롬프트 조립 + 호출 |
| `Data-RAG/docker/app/retrieval_query_builder.py` | RAG 검색 query 생성 |
| `Security/security-stack.yaml` | SG/IAM 권한 (RAG→Aurora 열림) |
