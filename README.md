# EMON — 응급실 AI 진단 보조 시스템

> **Emergency · Multimodal · Orchestrated · Network**  
> 응급실 병목 현상 해소 및 의료진 간 경험·경력 차이를 줄이기 위한 데이터 기반 진단 보조 플랫폼

[![AWS ECS Fargate](https://img.shields.io/badge/AWS-ECS%20Fargate-orange)](https://aws.amazon.com/ecs/)
[![Aurora Serverless v2](https://img.shields.io/badge/DB-Aurora%20Serverless%20v2-teal)](https://aws.amazon.com/rds/aurora/serverless/)
[![Python 3.12](https://img.shields.io/badge/Python-3.12-blue)](https://www.python.org/)
[![Flutter](https://img.shields.io/badge/Mobile-Flutter-blue)](https://flutter.dev/)

---

## 기획 의도

응급실에는 두 가지 구조적 문제가 있습니다.

**① 병목 현상**: 중증 환자 급증 시 ECG·흉부 X-ray·혈액검사를 순차적으로 판독하면 골든타임을 놓칩니다.  
**② 경험 편차**: 숙련 전문의와 초년차 의사 간 판단 격차가 환자 예후에 직접 영향을 미칩니다.

EMON는 이 두 문제를 동시에 해결합니다.

- **병렬 멀티모달 추론**: ECG·CXR·LAB 3개 모달을 동시에 분석해 직렬 대비 약 2.4배 빠른 결과 제공 (12s → 5s)
- **데이터 기반 의사결정 지원**: MIMIC-IV 기반 ML 모델 8개가 검사 우선순위를 자동 제안
- **유사 사례 검색(RAG)**: 49,743건 임상 노트에서 유사 환자 사례를 실시간 검색해 판단 근거 제공
- **자동 종합 소견 생성**: RAG 결과 + Bedrock Claude가 한국어 임상 소견서 초안을 자동 작성
- **실시간 알림**: WebSocket(웹) + FCM(모바일) 이중 채널로 critical 이벤트 즉시 전달


---

## 시스템 흐름

```
의사 (트리아지 입력)
        │
        ▼
  CloudFront + WAF
        │
        ▼
     ALB (HTTPS)
        │
        ├─ /api/*  ──────────────────────────────────────────────────────┐
        │                                                                │
        ▼                                                                │
  [orchestrator-svc]  ← 중앙 오케스트레이터 (FastAPI)                    │
        │                                                                │
        ├─ 1. HAPI FHIR에 Patient/Encounter 등록                         │
        ├─ 2. ML Decision Engine (LightGBM 8개) → 검사 우선순위 결정      │
        ├─ 3. 3개 모달 병렬 호출 (asyncio.gather)                         │
        │       ├─► ecg-svc.say2-6team.local:8001  (ECG 24개 질환 분류)  │
        │       ├─► cxr-svc.say2-6team.local:8002  (CXR 6개 소견 분류)  │
        │       └─► lab-svc.say2-6team.local:8003  (혈액검사 + 6h 예측)  │
        ├─ 4. 모달 결과 → Aurora central_db 저장                          │
        ├─ 5. RAG 검색 (rag-svc.say2-6team.local:8000)                  │
        │       └─► ChromaDB (MIMIC-IV 노트 49,743건, Titan v2 임베딩)   │
        ├─ 6. Bedrock Claude → 한국어 종합 소견서 생성                    │
        └─ 7. WebSocket broadcast + FCM push (critical 시)              │
                                                                        │
        └─ /route/* ─────────────────────────────────────────────────────┘
                │
                ▼
        [router-svc]  ← 폴백 라우터 (orchestrator 장애 시)
                │
                ├─► ecg-svc / cxr-svc / lab-svc (단일 모달 직접 호출)
                └─► RAG /generate 또는 Bedrock 직접 호출 (소견 생성)
```


---

## 서비스 구성

| 서비스 | 역할 | 포트 | 접근 방식 |
|--------|------|------|-----------|
| **orchestrator** | 중앙 오케스트레이터. 트리아지 수신 → ML 의사결정 → 모달 병렬 호출 → Bedrock 소견 생성 → WebSocket/FCM 푸시 | 8000 | ALB 외부 노출 (`/api/*`) |
| **ecg-svc** | 12-Lead ECG 24개 질환 다중 분류 (ONNX, Mamba S6 아키텍처) | 8001 | Cloud Map 내부 전용 |
| **cxr-svc** | 흉부 X-ray 6개 소견 분류 + UNet 세그멘테이션 | 8002 | Cloud Map 내부 전용 |
| **lab-svc** | 혈액검사 룰 기반 해석 + 6시간 악화 예측 (LightGBM) | 8003 | Cloud Map 내부 전용 |
| **rag-svc** | MIMIC-IV 임상 노트 유사 사례 검색 (ChromaDB + Bedrock Titan v2) | 8000 | Cloud Map 내부 전용 |
| **router-svc** | orchestrator 장애 시 폴백 라우터. Stateless, DB 연결 없음 | 8004 | ALB 외부 노출 (`/route/*`) |

### Cloud Map 내부 DNS (say2-6team.local)

```
orchestrator.say2-6team.local:8000
ecg-svc.say2-6team.local:8001
cxr-svc.say2-6team.local:8002
lab-svc.say2-6team.local:8003
rag-svc.say2-6team.local:8000
router-svc.say2-6team.local:8004
```

---

## AI 컴포넌트

### ML Decision Engine (LightGBM 8개)

| 모델 | 그룹 | 목적 |
|------|------|------|
| order_ecg / order_cxr / order_lab | initial | 첫 검사 우선순위 결정 |
| order_ecg / order_cxr / order_lab | followup | 추가 검사 필요 여부 |
| stop | followup | 검사 충분 — 종료 판단 |
| need_reasoning | followup | 복잡 케이스 → Bedrock 호출 |

학습 데이터: MIMIC-IV ED (응급실 첫 방문 데이터)

### 3개 진단 모달

| 모달 | 모델 | 입력 | 핵심 출력 |
|------|------|------|-----------|
| **ECG** | Mamba S6 ONNX (PTB-XL pretrained) | 12-Lead 파형 (.hea/.dat) | 24개 질환 확률 + ECG vitals (HR, 리듬) |
| **CXR** | DenseNet (분류) + UNet (세그) | 흉부 X-ray 이미지 | 6개 소견 + CTR 측정 + 세그멘테이션 마스크 |
| **LAB** | 룰 엔진 + LightGBM | 혈액검사 수치 JSON | 즉시 소견 + 6시간 악화 예측 |

### RAG + Bedrock 소견 생성

- **ChromaDB**: MIMIC-IV-NOTE 49,743건 (discharge 9,998 + radiology 39,745)
- **임베딩**: Bedrock Titan Embeddings v2 (512차원, 코사인 유사도)
- **소견 생성**: Claude Haiku 4.5 (기본) / Claude Sonnet 4.6 (critical·고난도 케이스 자동 전환)


---

## AWS 인프라 구성

### 배포 스택 순서

```
network-stack → security-stack → aurora-stack → compute-stack
```

### 컴퓨팅 (ECS Fargate)

| 서비스 | vCPU | 메모리 | Tasks | Auto Scaling |
|--------|------|--------|-------|--------------|
| orchestrator | 0.5 | 1GB | 2 (Multi-AZ) | min 2 / max 4 |
| ecg-svc | 1 | 2GB | 2 (Multi-AZ) | min 2 / max 6 |
| cxr-svc | 2 | 8GB | 2 (Multi-AZ) | min 2 / max 6 |
| lab-svc | 1 | 2GB | 2 (Multi-AZ) | min 2 / max 4 |
| router-svc | 0.25 | 0.5GB | 2 (Multi-AZ) | — |
| HAPI FHIR | EC2 t4g.medium | — | 1 | Graceful Queue 안전망 |

### 네트워크 (VPC 10.0.0.0/16)

```
Public Subnet (ALB)          10.0.0.0/24, 10.0.2.0/24
Private App Subnet (ECS)     10.0.11.0/24, 10.0.12.0/24
Private Data Subnet (DB)     10.0.21.0/24, 10.0.22.0/24
VPC Endpoints Subnet         10.0.31.0/24
```

- NAT Gateway 미사용 → VPC Endpoint 6개로 대체 (비용 절감 + 보안 강화)
- Bedrock, S3, ECR, Secrets Manager, CloudWatch Logs 모두 PrivateLink 경유

### 데이터베이스

```
Aurora Serverless v2 클러스터 (PostgreSQL, ACU 0.5~4)
├─ central_db  — 운영 DB (encounters, modal_results, diagnostic_reports, modal_events, fhir_sync_queue, device_tokens)
└─ hapi        — FHIR R4 표준 DB (HAPI 자동 관리)

ChromaDB — RAG 벡터 DB (EC2 + EFS, S3 백업)
S3       — MIMIC 원본 데이터 (ECG 파형, CXR 이미지, Lab 수치)
```

### Graceful Degradation

HAPI FHIR 장애 시 `fhir_sync_queue`에 자동 적재 → 5분 주기 Retry Worker가 복구 후 자동 백필.  
임상 플로우 무중단 보장 (TEST 1/2/3 검증 완료).

---

## 고가용성 설계

| 항목 | 설계 |
|------|------|
| ECS 서비스 | 모든 서비스 Multi-AZ (AZ-a + AZ-c), desiredCount ≥ 2 |
| ALB | Public Subnet 2 AZ 배치, 헬스체크 자동 Task 교체 |
| Aurora | 3 AZ × 6복사, Failover 30초 이내, PITR 35일 |
| HAPI FHIR | EC2 단일 인스턴스 + fhir_sync_queue 안전망 |
| router-svc | orchestrator 장애 시 의사 직접 action 우회 경로 |
| 모달 장애 격리 | 모달 1개 다운 시 나머지 모달 정상 진행 |

---

## 실시간 알림 구조

```
임상 알림 (의사·간호사)          운영 알림 (DevOps)
─────────────────────────        ─────────────────────────
WebSocket /ws/encounter/{id}     CloudWatch Alarms
  → 모든 이벤트 실시간 push         → SNS Topic (Critical/Warning)
                                     → Lambda → Slack Webhook
FCM (Firebase Cloud Messaging)       → Email (당직 운영자)
  → critical 이벤트만 모바일 push
```

---

## 프로젝트 구조

```
say2-finalfinal/
├── AWS/                          # AWS 인프라 설계 문서 및 IaC
│   ├── AWS_Compute_Design_v1.md  # ECS Fargate 컴퓨팅 설계
│   ├── AWS_DB_Design_v3.md       # Aurora + ChromaDB 설계
│   ├── AWS_Network_Design_v1.md  # VPC, ALB, Cloud Map
│   ├── AWS_Security_Design_v1.md # Cognito, IAM, KMS
│   ├── AWS_Observability_Design_v1.md  # CloudWatch, X-Ray, 알람
│   ├── AWS_Implementation_Guide.md     # 배포 가이드
│   ├── Data-RAG/                 # RAG 서비스 CloudFormation 스택
│   ├── database/                 # Aurora 스택 (aurora/, hapi/)
│   ├── infra/                    # compute-stack.yaml, 배포 스크립트
│   ├── monitoring/               # CloudWatch 알람 스택
│   ├── network/                  # network-stack.yaml
│   └── Security/                 # IAM 정책 JSON
│
├── final/central/                # 중앙 백엔드 (orchestrator)
│   └── backend/app/
│       ├── agent/                # ML Decision Engine + RAG + Bedrock
│       ├── api/                  # 라우터 (triage, orders, reports, ws, devices)
│       ├── clients/              # fcm.py, s3_downloader.py, modal_http.py
│       ├── db/                   # asyncpg 풀, fhir_sync_queue
│       └── fhir/                 # HAPI FHIR 호출
│
├── ecg-svc/                      # ECG 모달 (ONNX, Mamba S6)
├── chest-svc/                    # CXR 모달 (DenseNet + UNet)
├── Lab-svc/                      # LAB 모달 (룰 엔진 + LightGBM)
├── rag-svc/                      # RAG 서비스 (ChromaDB + Bedrock Titan)
├── router-svc/                   # 폴백 라우터 (Stateless FastAPI)
├── frontend/                     # React 웹 프론트엔드 (의사 데스크탑)
├── mobile/                       # Flutter 모바일 앱 (의사 모바일)
└── docs/                         # 강의 자료 및 아키텍처 문서
```


---

## 로컬 개발 환경

```bash
# 백엔드 + DB + HAPI 실행
cd final/central/infra
docker compose up -d --build

# 프론트엔드
cd frontend
npm install && npm run dev   # → http://localhost:3000
```

접속 URL:
- Backend API: http://localhost:8000/docs
- Frontend: http://localhost:3000
- HAPI FHIR: http://localhost:8080/fhir

---

## 운영 배포 (ECS Fargate)

```bash
# 1. 네트워크 스택 배포
aws cloudformation deploy --stack-name say2-6team-network \
  --template-file AWS/network/network-stack.yaml

# 2. Aurora 스택 배포
aws cloudformation deploy --stack-name say2-6team-aurora \
  --template-file AWS/database/aurora/aurora-stack.yaml --capabilities CAPABILITY_IAM

# 3. ECR 이미지 빌드 & 푸시
bash AWS/infra/build-and-push.sh

# 4. 컴퓨팅 스택 배포 (ECS 클러스터 + 서비스 5종)
bash AWS/infra/deploy-compute.sh

# 5. RAG 서비스 배포
bash AWS/infra/deploy-rag.sh

# 6. 모니터링 알람 배포
aws cloudformation deploy --stack-name say2-6team-monitoring \
  --template-file AWS/monitoring/monitoring-alarms-stack.yaml \
  --parameter-overrides CriticalAlertEmail=oncall@example.com
```

자세한 배포 절차는 [`AWS/AWS_Implementation_Guide.md`](AWS/AWS_Implementation_Guide.md) 참조.

---

## 팀

| 이름 | 담당 영역 |
|------|-----------|
| **원정아 👑 (팀장)** | **프로젝트 총괄 · 기획 · 설계 · AWS 전체 1차 설계안 · 역할 분담 · 문서 정리** · ECG 모달 개발 · LAB 모달 개발 · 프론트엔드 (React) · 모바일 (Flutter) |
| 홍경태 | 데이터베이스 설계 · 모니터링 |
| 양정인 | RAG 구축 · 보안 설계 · 네트워크 설계 |
| 이정인 | 오케스트레이터 개발 · ECS 인프라 |
| 박현우 | CXR 모달 개발 |

> **팀장 역할 (원정아)**
> - **프로젝트 기획·설계 전반 주도** — 아이템 선정부터 시스템 아키텍처 1차 설계까지
> - **AWS 전체 인프라 1차 설계안 작성** — 컴퓨팅·네트워크·DB·보안·모니터링 5개 영역 설계 문서 초안 정립
> - **팀원 역할 분담 및 작업 일정 조율**
> - **전체 설계 문서·README·발표 자료 정리**
> - **ECG·LAB 모달 직접 개발** + **프론트엔드(React) 및 모바일(Flutter) 구현**

---

## 설계 문서 인덱스

| 문서 | 위치 |
|------|------|
| 컴퓨팅 설계 (ECS Fargate) | [`AWS/AWS_Compute_Design_v1.md`](AWS/AWS_Compute_Design_v1.md) |
| DB 설계 (Aurora + ChromaDB) | [`AWS/AWS_DB_Design_v3.md`](AWS/AWS_DB_Design_v3.md) |
| 네트워크 설계 (VPC, ALB, Cloud Map) | [`AWS/AWS_Network_Design_v1.md`](AWS/AWS_Network_Design_v1.md) |
| 보안 설계 (Cognito, IAM, KMS) | [`AWS/AWS_Security_Design_v1.md`](AWS/AWS_Security_Design_v1.md) |
| 모니터링 설계 (CloudWatch, SNS) | [`AWS/AWS_Observability_Design_v1.md`](AWS/AWS_Observability_Design_v1.md) |
| 배포 가이드 | [`AWS/AWS_Implementation_Guide.md`](AWS/AWS_Implementation_Guide.md) |
| RAG 핸드오프 | [`rag-svc/central_handoff_guide.md`](rag-svc/central_handoff_guide.md) |
| router-svc 설계 | [`router-svc/README.md`](router-svc/README.md) |

---

**Last Updated**: 2026-05-22  
**Version**: 2.1.0  
**Status**: ✅ ECS Fargate 배포 완료 (compute-stack 포함 전체 스택 운영 중)
