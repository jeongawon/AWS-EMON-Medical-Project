import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft, HelpCircle, Search, Cpu, Network, Database, ShieldCheck,
  Sparkles, Activity, Banknote, ChevronDown, FileText, Workflow,
} from "lucide-react";
import { BrandShell } from "../../components/brand/BrandShell";
import { Reveal } from "../../components/brand/anim/Reveal";

/* ───────────────────────────────────────────────────────
   AWS 아키텍처 Q&A — 사업계획서·AWS 설계 문서 분석 기반
   FINAL_보고서_기획서.md / AWS_Compute_Design_v1.md /
   AWS_Network_Design_v1.md / AWS_DB_Design_v3.md /
   AWS_Security_Design_v1.md / AWS_Observability_Design_v1.md
   ─────────────────────────────────────────────────────── */

type CategoryKey = "compute" | "network" | "data" | "security" | "ai" | "orchestrator" | "ops" | "cost";

const CATEGORIES: { key: CategoryKey; label: string; icon: typeof Cpu }[] = [
  { key: "compute",      label: "Compute",      icon: Cpu },
  { key: "network",      label: "Network",      icon: Network },
  { key: "data",         label: "Data",         icon: Database },
  { key: "security",     label: "Security",     icon: ShieldCheck },
  { key: "ai",           label: "AI / RAG",     icon: Sparkles },
  { key: "orchestrator", label: "Orchestrator", icon: Workflow },
  { key: "ops",          label: "Ops",          icon: Activity },
  { key: "cost",         label: "Cost",         icon: Banknote },
];

type QnAItem = {
  id: string;
  category: CategoryKey;
  q: string;
  tldr: string;
  detail: string;
  refs: string[];
};

const QNA: QnAItem[] = [
  /* ═══════════════ COMPUTE ═══════════════ */
  {
    id: "ecs-vs-eks",
    category: "compute",
    q: "왜 EKS가 아니라 ECS Fargate를 선택했나?",
    tldr: "마이크로서비스 4개 규모에 EKS의 control-plane 비용·운영 오버헤드 불필요. AWS native 통합 + 서버리스(Fargate) 조합으로 운영 부담 최소화.",
    detail:
      "ECS Fargate는 호스트 OS·패치·하드웨어를 AWS가 전담합니다. ECG·CXR·LAB·RAG·Router·Orchestrator 6개 컨테이너 규모에서는 K8s의 풀파워가 필요하지 않고, EKS control plane 비용 $73/월 + 노드 EC2 + add-on 운영 부담이 부담됩니다.\n\n" +
      "ECS는 IAM·CloudWatch·ALB·Cloud Map과 native하게 통합되어 IRSA·OIDC 같은 별도 설정 없이 Task Role만으로 권한 관리가 끝납니다. 추후 멀티 클라우드/온프레미스 호환이 필요해지면 Fargate 컨테이너 이미지를 그대로 EKS·온프레 K8s로 옮길 수 있어, 락인은 컨트롤 플레인 레벨만으로 한정됩니다.",
    refs: ["AWS_Compute_Design_v1.md §1, §11"],
  },
  {
    id: "fargate-vs-ec2",
    category: "compute",
    q: "왜 Fargate인가 — EC2 + Auto Scaling Group 아니라?",
    tldr: "Task별 격리(라이브러리 충돌 차단) + 사용한 vCPU·메모리만 과금. EC2 ASG의 인스턴스 buffer·AMI 관리 부담 회피.",
    detail:
      "모달별로 의존 라이브러리가 충돌합니다 — ECG는 PyTorch + Mamba, CXR는 ONNX Runtime + DenseNet, LAB는 XGBoost. EC2에서 한 호스트에 다 올리면 의존성 지옥, 분리하면 인스턴스 수가 늘어나 비용·운영이 폭증합니다. Fargate는 Task = Container 1:1이라 격리가 자연스럽습니다.\n\n" +
      "Auto Scaling도 다릅니다 — EC2 ASG는 인스턴스 단위 스케일링(분 단위)이고 buffer 인스턴스가 항상 필요합니다. Fargate는 Task 단위 즉시 기동(수십 초)이라 응급실 트래픽 폭주 대응에 유리합니다.",
    refs: ["AWS_Compute_Design_v1.md §4, §6"],
  },
  {
    id: "task-2-multi-az",
    category: "compute",
    q: "왜 모든 서비스가 Task 2개 × Multi-AZ인가?",
    tldr: "AZ 1곳 장애 시에도 무중단. 응급 의료 도메인 특성상 가용성 최우선.",
    detail:
      "Task 1개면 해당 AZ가 죽을 때 서비스 전체가 다운됩니다. Task 2개를 서로 다른 AZ(ap-northeast-2a / 2c)에 배치하면, AZ-a 장애 시 ALB가 자동으로 AZ-c Task로 라우팅하고, ECS Service가 AZ-a에 Task를 자동 재생성합니다.\n\n" +
      "응급실은 의사 의사결정 직결 시스템이라 분 단위 다운타임도 허용되지 않습니다. Task 2개 × 4 서비스 = baseline 8개, Auto Scaling 최대 20개로 설계했습니다.",
    refs: ["AWS_Compute_Design_v1.md §3"],
  },
  {
    id: "hapi-ec2-1대",
    category: "compute",
    q: "HAPI FHIR는 왜 ECS가 아닌 EC2 1대인가?",
    tldr: "JVM warmup 비용 + 트래픽 변동성 낮음 + Graceful Queue가 1차 안전망 → 가성비 5배(ECS $120 vs EC2 $25).",
    detail:
      "HAPI FHIR는 JVM 기반이라 cold start가 30~60초 걸려 Fargate Auto Scaling과 궁합이 나쁩니다. 장기 가동 EC2가 JIT 최적화를 유지해 안정적입니다.\n\n" +
      "HAPI 1대 다운 = 임상 영향 0인 이유: central_db의 fhir_sync_queue 테이블이 HAPI 장애를 흡수합니다. ECS Orchestrator는 항상 central_db에 먼저 INSERT한 뒤 HAPI에 비동기 POST하며, HAPI 실패 시 queue에 적재 → 5분마다 Retry Worker가 백필. HAPI 복구 시 자동 동기화 완료 (TEST 1~3 검증).",
    refs: ["AWS_Compute_Design_v1.md §5", "AWS_DB_Design_v3.md §4"],
  },
  {
    id: "gpu-free",
    category: "compute",
    q: "왜 GPU 인스턴스를 안 쓰는가? AI 추론이라면 보통 GPU가 답 아닌가?",
    tldr: "ONNX Runtime + XGBoost는 CPU에서 충분히 빠름(CXR 150~300ms). GPU는 비용·운영 복잡도만 추가.",
    detail:
      "우리 모달은 학습이 아닌 추론(inference)만 ECS에서 수행합니다. CXR(DenseNet-121 + UNet) 추론은 M1 Mac CPU 기준 150~300ms/장으로 응급실 SLA 충족. ECG(Mamba S6)도 ONNX 변환 후 CPU 1초 내 처리. LAB(XGBoost)은 µs 단위.\n\n" +
      "GPU(g4dn.xlarge $400/월/인스턴스) 도입 시: 비용 4~5배 증가, GPU 드라이버·CUDA 버전 관리, Fargate에선 직접 사용 불가(SageMaker 또는 EC2 GPU 필요). Phase 3 CT/Ultrasound 모달 확장 시점에 SageMaker Inference Endpoint로 GPU 부분 도입 예정.",
    refs: ["AWS_Compute_Design_v1.md §1", "FINAL §6.2"],
  },
  {
    id: "service-discovery",
    category: "compute",
    q: "왜 내부 통신을 ALB가 아니라 Cloud Map(서비스 디스커버리)으로 하나?",
    tldr: "Fargate Task IP는 재시작마다 변경 → 고정 DNS 이름 필요. 내부 통신에 ALB 거치면 외부 라운드트립 + 비용↑.",
    detail:
      "Cloud Map은 medical-ai.local Private DNS Namespace를 생성하고, ecg-svc.medical-ai.local 같은 고정 이름을 Task IP에 자동 매핑합니다. Task가 재기동돼도 DNS만 갱신되어 호출자(Orchestrator) 코드 변경 없음.\n\n" +
      "ALB를 내부 통신에 쓰면 VPC 외부로 나갔다 들어오는 라운드트립 + 시간당 ALB 비용 추가. Cloud Map은 무료에 가깝고(Route 53 resolver) 더 가볍습니다. ALB는 외부 진입(/api/*)에만 사용.",
    refs: ["AWS_Compute_Design_v1.md §7", "AWS_Network_Design_v1.md §8"],
  },
  {
    id: "rolling-vs-bluegreen",
    category: "compute",
    q: "왜 Blue/Green이 아니라 Rolling Update인가?",
    tldr: "Phase 1은 단순함 우선 — Rolling으로 다운타임 0 + 롤백 단순. Phase 2 트래픽 증가 시 CodeDeploy Blue/Green 도입 검토.",
    detail:
      "Rolling Update는 Min Healthy 50%, Max 200%로 설정해 기존 Task를 순차 교체하며 다운타임 0을 보장합니다. 롤백은 이전 Task Definition revision으로 복귀하면 끝.\n\n" +
      "Blue/Green은 ALB Target Group 2개를 운영하며 트래픽 비율을 점진 전환하는 방식인데, 인프라 비용 2배·CodeDeploy 설정 복잡도 추가. Phase 1은 의도적으로 단순화해 운영 부담을 낮춥니다.",
    refs: ["AWS_Compute_Design_v1.md §9"],
  },

  /* ═══════════════ NETWORK ═══════════════ */
  {
    id: "no-nat-gateway",
    category: "network",
    q: "왜 NAT Gateway를 안 쓰는가? Private Subnet은 보통 NAT 경유 아닌가?",
    tldr: "외부 인터넷이 필요한 통신이 전부 AWS 서비스(Bedrock/ECR/Secrets/Logs/Metrics/KMS/S3) → VPC Endpoint(PrivateLink)로 NAT 대체. 비용 $90/월 절감 + 인터넷 노출 0.",
    detail:
      "전통적 패턴은 ECS Task → NAT Gateway($45/월/AZ × 2 = $90/월) → IGW → 인터넷 → Bedrock입니다. 우리는 이 경로 자체를 제거했습니다.\n\n" +
      "Interface VPC Endpoint(PrivateLink) 7개 + Gateway Endpoint 1개 = 총 8개로 모든 AWS API 호출이 VPC 내부에서 끝납니다:\n" +
      "  • bedrock-runtime (Interface, $7) — Claude/Titan 호출\n" +
      "  • s3 (Gateway, $0!) — MIMIC 데이터 / 백업\n" +
      "  • ecr.api / ecr.dkr (Interface, $7×2) — Docker pull\n" +
      "  • kms (Interface, $7) — 암호화 키 호출\n" +
      "  • secretsmanager (Interface, $7) — DB 비밀번호\n" +
      "  • logs (Interface, $7) — CloudWatch Logs 전송\n" +
      "  • monitoring (Interface, $7) — CloudWatch Metrics (PutMetricData, Alarm 평가)\n\n" +
      "합계 월 $49 — NAT 대비 $41 절감 + 인터넷 경유 0으로 보안 향상. 외부 인터넷이 필요한 통신이 진짜로 없는지가 핵심 전제 조건이고, 우리 시스템은 그 조건을 만족합니다.",
    refs: ["AWS_Network_Design_v1.md §10", "AWS_Security_Design_v1.md §2.1"],
  },
  {
    id: "vpc-3-tier",
    category: "network",
    q: "왜 4단 Subnet 구조(Public / Private App / Private Data / Endpoints)인가?",
    tldr: "Defense-in-depth — 각 계층을 NACL/SG로 격리. Endpoints를 별도 Subnet으로 빼서 인터페이스 트래픽 분리.",
    detail:
      "VPC 10.0.0.0/16 안에 4종 × 2 AZ = 8 Subnet:\n" +
      "  • Public (10.0.0.0/24, 10.0.2.0/24) — ALB만\n" +
      "  • Private App (10.0.10.0/24, 10.0.12.0/24) — ECS Tasks\n" +
      "  • Private Data (10.0.20.0/24, 10.0.22.0/24) — Aurora / HAPI EC2 / Chroma EC2\n" +
      "  • Endpoints (10.0.31.0/24) — VPC Interface Endpoint ENI\n\n" +
      "Endpoints Subnet을 따로 두는 이유: NACL을 'VPC 내부 응답만 허용'으로 잠그면 ENI가 외부로 새는 경로를 차단. 운영 중 Subnet 추가/삭제 시 Endpoint 영향 격리.",
    refs: ["AWS_Network_Design_v1.md §3", "AWS_Security_Design_v1.md §2"],
  },
  {
    id: "single-region",
    category: "network",
    q: "왜 단일 리전(ap-northeast-2)인가? Multi-Region DR은 없나?",
    tldr: "Phase 1은 한국 응급실 한정 + 데이터 주권 → 서울 단일. Phase 2에 ap-northeast-1(도쿄) Active-Passive 페일오버 도입.",
    detail:
      "한국 의료 데이터는 개인정보보호법·의료법상 원칙적으로 국내 보관입니다. Multi-AZ(서울 a/c)만으로 단일 리전 가용성을 확보하고, Aurora 자동 백업 + Vault Lock S3 5년 보존으로 RPO 분 단위 보장.\n\n" +
      "Phase 2 SaMD Class II 인허가 + ICU 확장 시점에 도쿄 페일오버 도입 계획. 운영 데이터(central_db)와 HAPI FHIR는 Cross-Region 복제하되 PHI는 비식별화 후 이동. 글로벌 진출이 아닌 순수 DR 목적.",
    refs: ["AWS_Network_Design_v1.md §2", "FINAL Roadmap"],
  },
  {
    id: "cloudfront-waf",
    category: "network",
    q: "CloudFront + WAF를 굳이 의료 시스템에 쓰는 이유?",
    tldr: "ALB 앞 TLS 1.3 종료 + 한국 외 IP geo-blocking + AWS Managed Rules로 OWASP Top 10 차단. Edge 캐싱은 정적 자산에만.",
    detail:
      "ALB 직접 노출 시 매 요청이 ALB까지 도달해야 차단됩니다. CloudFront Edge에서 217 PoP 중 가까운 곳에서 TLS 종료 + WAF 검사를 먼저 수행해 악성 트래픽이 origin에 도달하지 않습니다.\n\n" +
      "WAF 룰: AWSManagedRulesCommonRuleSet(OWASP) + AWSManagedRulesKnownBadInputsRuleSet + Rate-based rule(IP당 분당 100req) + Geo-blocking(한국 외 차단 옵션). PHI를 다루는 시스템이라 외부 노출 면적을 최소화.",
    refs: ["AWS_Security_Design_v1.md §1", "AWS_Network_Design_v1.md §7"],
  },
  {
    id: "nacl-sg-둘다",
    category: "network",
    q: "NACL과 SG를 왜 둘 다 쓰나? SG만으로 충분하지 않나?",
    tldr: "Stateless NACL(Subnet 경계) + Stateful SG(인스턴스 경계) 이중 방어. Deny rule은 NACL만 가능.",
    detail:
      "Security Group은 Allow-only/Stateful이라 응답 트래픽이 자동 허용되고 명시적 차단(Deny)이 불가능합니다. NACL은 Stateless이고 Deny rule이 가능해, 특정 IP/포트 즉시 차단 같은 incident response에 유용.\n\n" +
      "우리 구성: NACL 4개(Subnet 경계, broad allow + deny capability), SG 5개(인스턴스 경계, fine-grained allow). 예) Endpoints-NACL은 Outbound를 VPC 내부로만 한정해 ENI가 외부로 새는 경로 자체를 봉쇄.",
    refs: ["AWS_Security_Design_v1.md §2.2, §2.3"],
  },

  /* ═══════════════ DATA ═══════════════ */
  {
    id: "aurora-slv2",
    category: "data",
    q: "왜 RDS PostgreSQL이 아니라 Aurora Serverless v2인가?",
    tldr: "응급실 트래픽 불규칙(주간 피크 vs 야간 저부하) → ACU 0.5~4 자동 스케일링. 야간 0.5 ACU = 월 $45, RDS는 항상 풀 사이즈.",
    detail:
      "RDS PostgreSQL은 인스턴스 사이즈 고정 — db.r6g.large($200/월)를 24/7 돌려야 함. 야간에도 비용 그대로.\n\n" +
      "Aurora Serverless v2는 ACU(Aurora Capacity Unit) 단위 초당 스케일링:\n" +
      "  • 야간 저트래픽: 0.5 ACU (~$45/월)\n" +
      "  • 주간 피크: 자동 4 ACU까지 확장\n" +
      "  • 평균 비용 ~$220/월\n\n" +
      "추가로 Aurora는 스토리지 엔진이 RDS와 다른 분산 스토리지(6 사본 × 3 AZ) → 99.99% durability + Read Replica 확장 용이. PostgreSQL 완전 호환이라 마이그레이션 비용 0.",
    refs: ["AWS_DB_Design_v3.md §2"],
  },
  {
    id: "postgres-vs-mysql",
    category: "data",
    q: "왜 PostgreSQL인가? MySQL도 Aurora가 지원하는데",
    tldr: "JSONB 컬럼(쿼리 가능 JSON) + HAPI FHIR가 PG 우선 지원 + 의료 도메인 표준.",
    detail:
      "HAPI FHIR JPA는 PostgreSQL을 1차 지원 DB로 권장합니다(MySQL도 가능하나 인덱싱·full-text 한계).\n\n" +
      "central_db에 ECG/CXR/LAB 분석 결과의 가변 스키마 JSON을 JSONB로 저장해 쿼리·인덱싱이 가능합니다. MySQL JSON 타입은 JSONB 같은 GIN 인덱스가 없어 성능 떨어짐.\n\n" +
      "FHIR R4 표준 자체가 PostgreSQL 기반 구현체가 다수(HAPI, Aidbox, Medplum). 의료 도메인 사실상 표준.",
    refs: ["AWS_DB_Design_v3.md §2.3"],
  },
  {
    id: "1-cluster-2-db",
    category: "data",
    q: "왜 클러스터 1개에 DB 2개(hapi + central_db) — 분리가 더 안전하지 않나?",
    tldr: "비용 절반($220 vs $440) + 운영 단일화. 데이터 격리는 DB 레벨 + IAM/SG로 충분.",
    detail:
      "Aurora 1 클러스터 안에서 PostgreSQL이 여러 database를 둘 수 있습니다. hapi DB(HAPI 자동 관리, FHIR 11종 리소스)와 central_db(우리가 직접 관리, 운영 데이터) 2개를 같은 클러스터에 두면:\n" +
      "  • 비용 절반 — 분리 시 $440, 통합 시 $220/월\n" +
      "  • 운영 단일화 — 백업/모니터링/VPC 설정 1세트\n" +
      "  • 장애 도메인은 클러스터 1개로 같지만, Multi-AZ + 자동 백업으로 커버\n\n" +
      "보안 격리: HAPI 사용자(hapi_user)는 hapi DB만, FastAPI 사용자(central_user)는 central_db만 접근. CONNECT 권한을 GRANT/REVOKE로 명시 차단.",
    refs: ["AWS_DB_Design_v3.md §3"],
  },
  {
    id: "fhir-sync-queue",
    category: "data",
    q: "fhir_sync_queue는 결국 Outbox Pattern인가? 왜 Eventbridge / SQS 안 쓰나?",
    tldr: "본질은 Outbox + Retry Worker. SQS/EventBridge는 운영 컴포넌트 추가 부담 — 한 테이블로 동일 효과 + 트랜잭션 일관성 보장.",
    detail:
      "central_db.fhir_sync_queue에 (resource_type, payload_jsonb, status, retry_count, last_error)를 적재합니다. ECS Orchestrator는 central_db에 INSERT와 동시에 같은 트랜잭션으로 queue에 INSERT(Outbox 원자성).\n\n" +
      "별도 Retry Worker(5분 주기, ECS Task 1개)가 status='pending' row를 읽어 HAPI POST → 성공 시 status='done', 실패 시 retry_count++. exponential backoff.\n\n" +
      "SQS 도입 시 장점: DLQ, 가시성 타임아웃, 무한 보존. 단점: 메시지 → DB 일관성 보장에 추가 코드 필요(이중 쓰기 문제). DB 한 테이블 + 워커가 가장 단순하고 트랜잭션 일관성이 자연스럽게 보장됨. 메시지가 100만 건 넘어가면 SQS 전환 검토.",
    refs: ["AWS_DB_Design_v3.md §4"],
  },
  {
    id: "jsonb-vs-relational",
    category: "data",
    q: "JSONB 컬럼 4개 — relational로 정규화 안 한 이유?",
    tldr: "ECG/CXR/LAB 분석 결과는 모달별 스키마가 자주 변경됨 → 정규화 시 매번 ALTER TABLE. JSONB로 schema-on-read.",
    detail:
      "정규화하면 각 모달의 24/6/11 질환별 컬럼이 필요하고, 모델 업데이트마다 스키마 변경. JSONB는 GIN 인덱스로 'WHERE result->>diagnosis = ?' 같은 쿼리도 빠르게 가능.\n\n" +
      "정규화한 부분: encounter, patient, modal_run 같은 강한 관계 데이터. JSONB로 유지: 모달 결과(probabilities, heatmap_base64, rule_flags). 보고서 본문은 별도 컬럼 + 인덱싱.",
    refs: ["AWS_DB_Design_v3.md §3.4"],
  },
  {
    id: "vault-lock-5y",
    category: "data",
    q: "백업 보존 5년 — 어떻게 보장하나?",
    tldr: "S3 Vault Lock + Glacier Deep Archive. WORM(Write-Once-Read-Many) 정책으로 운영자도 삭제 불가.",
    detail:
      "의료법상 진료기록 5년 보존 의무. Aurora 자동 백업은 35일 한계이므로 cross-account S3 Backup Vault에 export → Vault Lock으로 Compliance 모드 적용.\n\n" +
      "Lock 후에는 root 권한자도 삭제 불가. 5년 후 자동 만료. Glacier Deep Archive로 GB당 $0.00099/월 — 1TB 5년 보관 = $60.",
    refs: ["AWS_DB_Design_v3.md §9.2", "AWS_Security_Design_v1.md §5"],
  },

  /* ═══════════════ SECURITY ═══════════════ */
  {
    id: "kms-cmk",
    category: "security",
    q: "왜 AWS-managed key가 아닌 Customer Managed KMS Key?",
    tldr: "Key rotation 주기·정책을 우리가 통제 + audit log에 our-account 표시 + cross-account 차단.",
    detail:
      "AWS-managed key는 우리가 정책을 수정할 수 없습니다. CMK는:\n" +
      "  • Annual auto rotation 활성화\n" +
      "  • Key policy에서 ECS Task Role만 Decrypt 허용 (deny-by-default)\n" +
      "  • CloudTrail에 키 사용 모두 기록 → 비정상 호출 GuardDuty 탐지\n" +
      "  • Disable·Delete가 우리 통제 하 (incident response)\n\n" +
      "비용: CMK $1/월 + API call $0.03/10K. 의료 도메인 audit 요구에 비해 무시할 수준.",
    refs: ["AWS_Security_Design_v1.md §3.1"],
  },
  {
    id: "secrets-manager",
    category: "security",
    q: "Secrets Manager는 $0.40/secret로 비싼데 왜 Parameter Store 안 쓰나?",
    tldr: "자동 rotation 지원 + KMS 통합 + 멀티 리전 복제. Parameter Store는 rotation 없음.",
    detail:
      "DB 비밀번호 3종(Aurora master, central_user, hapi_user)을 Secrets Manager에 저장. Rotation Lambda가 30일마다 비밀번호 자동 교체 + Aurora 적용 → 운영자가 비밀번호 만질 일 0.\n\n" +
      "Parameter Store SecureString은 무료(첫 10K 기준)지만 rotation 미지원. 의료 시스템 audit에서 정기 교체가 요구되어 Secrets Manager가 필수. 비용 $0.40 × 3 + KMS = 월 ~$3 수준이라 무시 가능.\n\n" +
      "Slack Webhook 같은 rotation 불필요한 비밀은 Parameter Store에 저장해 비용 절감.",
    refs: ["AWS_Security_Design_v1.md §3.2"],
  },
  {
    id: "task-role-execution-role",
    category: "security",
    q: "Task Role과 Task Execution Role을 분리한 이유는?",
    tldr: "권한 최소화 — Execution Role(인프라용)과 Task Role(앱용)을 분리해 lateral movement 차단.",
    detail:
      "Task Execution Role: ECR pull, CloudWatch Logs write, Secrets Manager read(컨테이너 기동용). ECS Agent가 사용.\n\n" +
      "Task Role: Bedrock InvokeModel, S3 GetObject(앱 코드가 사용). 컨테이너 안 코드가 사용.\n\n" +
      "분리 안 하면 컨테이너 코드가 ECR 이미지를 변조하거나 Logs 설정을 변경 가능. 분리하면 컨테이너가 침해돼도 인프라 권한은 영향 없음(SOC2 통제).",
    refs: ["AWS_Security_Design_v1.md §4.2"],
  },
  {
    id: "phi-logging",
    category: "security",
    q: "CloudWatch Logs에 PHI(환자 정보)가 새는 걸 어떻게 막나?",
    tldr: "로그 필드 화이트리스트 + 환자 이름·수치·영상 절대 금지 정책. ID(UUID)·count·timestamp·status만 기록.",
    detail:
      "FastAPI logger middleware에서 PHI 필터링:\n" +
      "  • 허용: encounter_id, modal_name, request_id, latency_ms, status_code\n" +
      "  • 금지: patient_name, hr/bp/spo2 값, ecg waveform, cxr image, diagnosis text\n\n" +
      "Retention: ECS 30일 / HAPI 90일 → S3 export → Glacier (5년). CloudWatch Logs Insights로 검색해도 PHI 노출 X.\n\n" +
      "추가 통제: CloudTrail로 S3 export bucket 접근 전수 감사. GuardDuty(Phase 2)로 비정상 S3 GetObject 탐지.",
    refs: ["AWS_Security_Design_v1.md §5.2", "AWS_Observability_Design_v1.md §3.1"],
  },
  {
    id: "cognito",
    category: "security",
    q: "왜 Cognito인가 — 자체 JWT 발급도 가능한데",
    tldr: "MFA·SAML·OIDC 표준 + 가입/비밀번호 재설정 플로우 내장 + 의료기관 SSO 연동 대비.",
    detail:
      "Cognito User Pool로 의사·간호사 계정 관리. 자체 구현 시 MFA·비밀번호 정책·계정 잠금 등을 모두 작성해야 함.\n\n" +
      "Phase 2 의료기관 도입 시 기존 병원 AD/SSO와 SAML/OIDC 연동 필요 — Cognito Federation으로 즉시 가능.\n\n" +
      "JWT는 ALB Listener Rule 또는 ECS FastAPI Middleware에서 검증. 비용: MAU 50,000명까지 무료.",
    refs: ["AWS_Security_Design_v1.md §4.1"],
  },

  /* ═══════════════ AI / RAG ═══════════════ */
  {
    id: "bedrock-vs-openai",
    category: "ai",
    q: "왜 Bedrock인가? OpenAI API 또는 Anthropic 직접 호출 안 하는 이유?",
    tldr: "VPC Endpoint 내부 통신 + AWS IAM 권한 통합 + 데이터 학습 사용 금지(컴플라이언스).",
    detail:
      "OpenAI/Anthropic 공개 API는 public internet으로 나가야 함 → NAT Gateway 필요 + PHI가 외부망 통과. Bedrock은 PrivateLink로 VPC 내부에서 끝나고, 입력 데이터가 모델 학습에 사용되지 않음(AWS Bedrock 약관).\n\n" +
      "권한 관리: IAM Role(Task Role)로 InvokeModel 권한 부여 — API Key 관리 불필요. CloudTrail에 호출 전수 기록.\n\n" +
      "모델 선택권: Claude Haiku/Sonnet/Opus + Titan Embeddings + Llama 3 등을 단일 API로 호출. 모델 교체 시 코드 변경 최소.",
    refs: ["FINAL §6.4", "AWS_Security_Design_v1.md §4"],
  },
  {
    id: "haiku-sonnet-routing",
    category: "ai",
    q: "Claude Haiku/Sonnet 라우팅 정책은?",
    tldr: "기본 Haiku(85~90% 케이스, 비용 최소), Critical/복잡 케이스만 Sonnet. Sonnet 호출률을 cost dashboard로 모니터링.",
    detail:
      "rag-svc/router.py에서 케이스 복잡도 추정:\n" +
      "  • KTAS 1/2 (Critical) + 모달 critical flag 2개 이상 → Sonnet\n" +
      "  • Lateral CXR + ECG normal → Haiku\n" +
      "  • RAG fallback(검색 결과 N<3) → Sonnet(추론 의존도↑)\n\n" +
      "비용: Haiku $0.25/1M in + $1.25/1M out, Sonnet $3/1M in + $15/1M out. 평균 1 보고서 ≈ 2K in + 1K out, Haiku $0.0017, Sonnet $0.021.\n\n" +
      "Haiku 90% 비율 가정 시 월 10,000 보고서 = ~$28 (Haiku 9,000 × $0.0017 + Sonnet 1,000 × $0.021 ≈ $36).",
    refs: ["FINAL §C.4 (Haiku ↔ Sonnet 라우팅)"],
  },
  {
    id: "chromadb-on-ec2",
    category: "ai",
    q: "왜 ChromaDB on EC2인가 — OpenSearch / Aurora pgvector / Bedrock Knowledge Base 아니라?",
    tldr: "49,743 벡터 규모에서 ChromaDB CPU 노드가 가장 비용 효율적($25/월). OpenSearch는 $200~/월, pgvector는 Aurora CPU 부담.",
    detail:
      "벡터 수 49,743건(MIMIC discharge 9,998 + radiology 39,745), 임베딩 512차원(Bedrock Titan v2). 메모리 ~100MB.\n\n" +
      "비교:\n" +
      "  • ChromaDB EC2 t4g.medium $25/월 — 단일 노드로 충분, S3 백업\n" +
      "  • OpenSearch t3.small.search 2 노드 ~$200/월 + HNSW 인덱스 추가 비용\n" +
      "  • Aurora pgvector — 운영 DB에 임베딩 부하 추가, ACU↑\n" +
      "  • Bedrock Knowledge Base — 자동화 좋지만 청크 정책·메타데이터 커스터마이징 제한 + 데이터 거버넌스(MIMIC 약관) 검토 필요\n\n" +
      "Phase 2 200K+ 벡터·다중 모달 확장 시 OpenSearch 또는 Knowledge Base로 이관 예정.",
    refs: ["AWS_DB_Design_v3.md §8", "FINAL §C.4"],
  },
  {
    id: "titan-embeddings",
    category: "ai",
    q: "Titan Embeddings v2 — Cohere / OpenAI text-embedding-3 아닌 이유?",
    tldr: "Bedrock 내부 호출 + 512차원으로 ChromaDB 메모리 효율 + 다국어(한국어) 지원.",
    detail:
      "Titan v2: 512차원(또는 256/1024 가변), $0.02/1M token, Bedrock 내부 호출(NAT 불필요).\n\n" +
      "비교:\n" +
      "  • Cohere embed-multilingual-v3 — Bedrock에 있지만 1024차원으로 메모리 2배\n" +
      "  • OpenAI text-embedding-3-large — 3072차원, 공개망 호출 필요\n\n" +
      "한국어 임상 노트 검색 성능은 자체 골든셋(168 케이스)에서 Titan v2 cosine similarity P@5 = 0.78, Cohere 0.81. 차이 미세 + 비용·인프라 단순성으로 Titan 채택.",
    refs: ["AWS_DB_Design_v3.md §8"],
  },
  {
    id: "rag-fallback",
    category: "ai",
    q: "RAG 결과가 부실할 때(검색 결과 N<3) 어떻게 처리하나?",
    tldr: "Sonnet으로 escalation + 'RAG 근거 제한적임' 명시 + 의사 검토 강제 플래그.",
    detail:
      "rag-svc generator.py에서 Top-K 결과 score를 검사. 0.7 이상이 3건 미만이면:\n" +
      "  1. Sonnet 모델로 fallback (추론 의존도 높임)\n" +
      "  2. SYSTEM PROMPT에 'RAG 검색 근거가 제한적이므로 임상 판단 우선' 추가\n" +
      "  3. 출력 보고서 메타데이터에 rag_quality='low' 플래그\n" +
      "  4. 의사 UI에 경고 배지 표시 + 서명 시 추가 확인 다이얼로그\n\n" +
      "법적방어 차원에서 'AI가 강한 주장을 하지 못하게 막는' 게 핵심. 자신 있게 잘못 쓰는 것보다 'I don't know'가 안전.",
    refs: ["FINAL §C.4 (5번 라우팅, 4번 9원칙)"],
  },

  /* ═══════════════ OPS ═══════════════ */
  {
    id: "cloudwatch-only",
    category: "ops",
    q: "왜 Datadog / New Relic이 아니라 CloudWatch만?",
    tldr: "Phase 1 비용 최소화 + AWS native 통합. Container Insights / X-Ray는 Phase 2 도입.",
    detail:
      "Datadog $15~31/host/월 × 8 Task = $240~ → 우리 컴퓨팅 비용의 25%. New Relic 비슷. Phase 1 비용 압박이 크고, CloudWatch만으로 임계 지표는 모두 커버:\n" +
      "  • Logs(자동, 6 Log Group)\n" +
      "  • Metrics(자동, CPU/Mem/Task count)\n" +
      "  • Alarms(SNS fan-out)\n" +
      "  • Dashboard(실시간)\n\n" +
      "Phase 2 도입 검토: Container Insights($1.50/task/월), X-Ray($5/1M trace). 그래도 외부 APM 도입은 ROI가 명확해진 뒤 결정.",
    refs: ["AWS_Observability_Design_v1.md §3"],
  },
  {
    id: "alert-2-channels",
    category: "ops",
    q: "임상 알림과 운영 알림을 왜 분리하나?",
    tldr: "성격이 다름 — Clinical은 의사·간호사 즉시 화면(WebSocket), Operational은 DevOps Slack(CloudWatch→SNS→Lambda).",
    detail:
      "Clinical Alert (환자 critical, 모달 분석 완료, 미서명 보고서):\n" +
      "  • 채널: 앱 WebSocket + Push\n" +
      "  • Latency: 초 단위 (의사 즉시 대응)\n" +
      "  • 대상: 의사·간호사\n\n" +
      "Operational Alert (Aurora ACU 포화, Task 다운, Bedrock 5xx):\n" +
      "  • 채널: CloudWatch Alarm → SNS → Lambda → Slack Webhook\n" +
      "  • Latency: 분 단위\n" +
      "  • 대상: DevOps\n\n" +
      "두 채널을 섞으면 의사가 'Aurora ACU 포화' 같은 인프라 알림을 받게 되어 alarm fatigue. 명확히 분리.",
    refs: ["AWS_Observability_Design_v1.md §2"],
  },
  {
    id: "container-insights-phase2",
    category: "ops",
    q: "Container Insights를 Phase 2로 미룬 이유?",
    tldr: "비용($1.50/task/월) + Phase 1 8 task 규모에선 기본 Metric으로 충분. Auto Scaling 정밀도 필요해질 때 도입.",
    detail:
      "Container Insights는 Task별 CPU/Memory/Network/Disk를 세분화해 보여줍니다. 8 Task × $1.50 = $12/월 — 절대적 비용은 작지만 Phase 1 신호 잡음비가 낮음.\n\n" +
      "Auto Scaling이 평균 CPU 기반이라 Phase 1은 ECSServiceAverageCPUUtilization으로 충분. Phase 2에 Task가 20+ 늘어나면 task 단위 부하 분포가 중요해져 도입.",
    refs: ["AWS_Compute_Design_v1.md §6"],
  },
  {
    id: "websocket-vs-apigw",
    category: "ops",
    q: "WebSocket을 API Gateway WebSocket으로 안 하고 ECS FastAPI에 직접 둔 이유?",
    tldr: "API Gateway WebSocket은 stateful 연결당 과금($1.00/1M conn-min) + Lambda 통합 강제 → ECS native가 단순·저렴.",
    detail:
      "API Gateway WebSocket은 연결 시간 기반 과금이고 메시지 통합 대상이 Lambda(또는 HTTP 백엔드). 우리는 이미 ECS FastAPI가 있고 WebSocket 라이브러리(uvicorn + FastAPI WebSocket)가 native라 추가 인프라 0.\n\n" +
      "내부 동작: ECS Task가 환자별 채널 유지, Redis Pub/Sub(Phase 2)으로 multi-task 동기화. Phase 1은 단일 Task에 sticky session(ALB) 또는 환자별 모든 의사가 같은 Task로 라우팅.",
    refs: ["AWS_Observability_Design_v1.md §2.1"],
  },

  /* ═══════════════ COST ═══════════════ */
  {
    id: "monthly-510",
    category: "cost",
    q: "월 운영비 $510 / $971 — 둘 중 어느 게 정답인가?",
    tldr: "사이트 표기 $510은 사업계획서 추정치, AWS 설계 문서 $971은 실측 견적. 차이 = 비용 절감 옵션 적용 전후.",
    detail:
      "사업계획서 $510: Fargate Savings Plans 20% + CXR 모델 경량화(4→2 vCPU) + 야간 Aurora 0.5 ACU 가정. Phase 1 파일럿 시점 목표치.\n\n" +
      "AWS 설계 문서 $971: On-Demand baseline, Auto Scaling 평균 +25% 미포함, 최악 시나리오 계산. 실제 운영 진입 직후 첫 달 청구서 예상.\n\n" +
      "현실은 두 수치 사이($600~800). 사이트 표기는 '추정치 · 실측 청구서 아님'으로 disclaimer 명시.",
    refs: ["AWS_Compute_Design_v1.md §10", "FINAL §10.2"],
  },
  {
    id: "savings-plans",
    category: "cost",
    q: "Fargate Savings Plans 1년 약정으로 20% 절감 — 왜 안 쓰나?",
    tldr: "Phase 1 파일럿 단계라 트래픽 불확실 → 1년 lock-in 위험. Phase 2 진입 후 Auto Scaling 평균 안정화되면 도입.",
    detail:
      "Compute Savings Plans는 시간당 $ commitment 단위 — 약정 미만 사용해도 비용 발생. Phase 1은 베타 의료기관 1~3곳 트래픽이라 변동성이 큼.\n\n" +
      "Phase 2 진입 조건: 평균 baseline Task 수가 8개에서 안정되고, 월별 변동이 ±15% 이내일 때. 그 시점에 1년 약정 20% 절감 ~$185/월.",
    refs: ["AWS_Compute_Design_v1.md §10"],
  },
  {
    id: "data-egress",
    category: "cost",
    q: "데이터 송출(egress) 비용은 어떻게 통제하나?",
    tldr: "VPC Endpoint Gateway(S3)로 무료 + CloudFront Edge에서 응답 캐싱 + AZ 간 트래픽 최소화.",
    detail:
      "AWS egress 비용 = 인터넷 송출($0.126/GB) + Cross-AZ($0.01/GB).\n\n" +
      "최적화:\n" +
      "  • S3는 Gateway Endpoint로 데이터 송출 무료(Phase 1 MIMIC 데이터 풀 다운로드 비용 0)\n" +
      "  • CloudFront → ALB는 같은 리전 → Edge 캐싱 효과로 origin 트래픽↓\n" +
      "  • Task ↔ Aurora 같은 AZ 우선 배치(ALB Cross-Zone Load Balancing은 활성, but 짧은 latency)\n\n" +
      "예상 egress: 월 200GB(보고서 PDF + WebSocket) × $0.126 = $25/월 수준.",
    refs: ["AWS_Network_Design_v1.md §10"],
  },
  {
    id: "cost-vs-vuno-lunit",
    category: "cost",
    q: "VUNO·루닛 같은 회사는 어떻게 더 싸게 운영할 수 있을까?",
    tldr: "단일 모달은 추론 인프라 단순(단일 컨테이너). 우리는 통합 의사결정 엔진이라 6 컨테이너 + Bedrock + RAG로 비용 구조가 다름.",
    detail:
      "루닛 INSIGHT CXR은 CXR 1개 모달 → ECS Task 2~4개로 충분, Bedrock·RAG·Orchestrator 없음. 비용은 우리의 1/3 수준 추정.\n\n" +
      "우리는 의도적으로 '통합 의사결정 엔진'으로 포지셔닝 — 모달 단가 경쟁이 아니라 의사결정 통합 가치로 차별화. 비용은 절대적으로는 높지만 ARR per 병원이 크기에 단위 경제 성립.\n\n" +
      "Phase 2 모달 plug-and-play 시나리오: 병원이 루닛 CXR을 보유하면 그걸 plug-in해서 우리 CXR Task 제거(비용 절감). 이게 'Hospital BYO modal' 시나리오의 비용 이점.",
    refs: ["FINAL Roadmap (Pluggable Modals)", "FINAL §10.2"],
  },

  /* ═══════════════ ORCHESTRATOR ═══════════════ */
  {
    id: "orch-lightgbm",
    category: "orchestrator",
    q: "왜 LightGBM인가? XGBoost나 Deep Learning이 아닌 이유?",
    tldr: "tabular 의료 데이터 + 해석 가능성 + CPU 추론. XGBoost와 정확도 동급이지만 학습 2-3배 빠름. Deep Learning은 333K 샘플 + 80개 feature에서 우위 없음.",
    detail:
      "Orchestrator는 80여 개 binary/numeric feature(나이·성별·바이탈·모달 결과 49개 등) 기반 의사결정 — 전형적 tabular 문제.\n\n" +
      "모델 비교:\n" +
      "  • LightGBM ★ — leaf-wise growth, 학습 빠름, feature importance 명확, ONNX 변환 안정적\n" +
      "  • XGBoost — 정확도 동급이지만 학습 2-3배 느림\n" +
      "  • TabNet / FT-Transformer — 데이터 1M+ 필요, 의료 도메인 검증 부족\n" +
      "  • MLP — feature interaction 자동 학습 못함, 의료 feature는 비선형 + 상호작용 강함\n\n" +
      "추가 장점: feature importance를 그대로 의사에게 보여줄 수 있어 'AI가 왜 LAB을 권하는지' 설명 가능. SHAP value 통합도 native.\n\n" +
      "Initial 모델 91.33% 정확도 / Test 50,559 samples — XGBoost 동일 hyperparameter로 91.31% (차이 미미). 학습 시간 차이가 결정적.",
    refs: ["중앙_오케스트레이터_요약 §04", "build_datamarts.py"],
  },
  {
    id: "orch-8-binary",
    category: "orchestrator",
    q: "왜 8개 binary classifier? 1개 multi-class 모델이 더 단순하지 않나?",
    tldr: "각 action별 feature importance·threshold가 다름 → 독립 보정 가능. Multi-class는 'order_ecg vs order_cxr vs stop'을 동일 softmax로 강제 → 부적절한 trade-off.",
    detail:
      "Initial 모델 3개 (order_ecg, order_cxr, order_lab) + Follow-up 5개 (위 3개 + stop + need_reasoning) = 총 8개 binary classifier.\n\n" +
      "왜 분리:\n" +
      "  • feature importance가 action마다 다름 — order_ecg는 '흉통' weight↑, order_cxr는 '호흡곤란' weight↑\n" +
      "  • Class imbalance 보정을 action마다 다르게 — CXR 2.5%만 양성 → scale_pos_weight 별도 튜닝\n" +
      "  • 추가 action 도입 시 모델 1개 추가만 — multi-class는 전체 재학습\n" +
      "  • Threshold 독립 — order_ecg는 0.5, need_reasoning은 0.3 같은 비대칭 가능\n\n" +
      "최종 결정은 8개 binary score의 argmax — 한 시점에 하나의 다음 행동만 가능하다는 mutual exclusion 제약을 후처리로 부여.",
    refs: ["중앙_오케스트레이터_요약 §04"],
  },
  {
    id: "orch-imitation-vs-rl",
    category: "orchestrator",
    q: "왜 Imitation Learning인가? Reinforcement Learning이 더 강력하지 않나?",
    tldr: "응급실은 exploration 불가 — RL이 suboptimal action을 시도하면 환자 위험. IL은 '실제 의사의 좋은 패턴'을 그대로 학습 → 안전 + 즉시 배포 가능.",
    detail:
      "RL은 environment와 상호작용하며 보상 신호로 정책을 개선하는데, 의료에서 두 가지 문제:\n" +
      "  1. exploration 위험 — 'LAB 안 보고 퇴원' 같은 행동을 시도하다 사망 케이스 발생\n" +
      "  2. reward design — 'patient outcome'을 1주 후에야 알 수 있어 sparse reward, credit assignment 어려움\n\n" +
      "Imitation Learning(Behavioral Cloning) 채택:\n" +
      "  • 라벨 = 실제 MIMIC-IV 의사가 그 시점에 내린 오더\n" +
      "  • 모델 = 의사의 의사결정 패턴을 모방\n" +
      "  • Offline training → online 배포 시 exploration 0\n" +
      "  • 단점: 의사의 편향(systematic over-ordering 등)도 학습 → Rule 기반 LLM escalation으로 보정\n\n" +
      "후속 단계로 Offline RL(CQL, IQL) 검토 — 보상 신호 명확해지면 IL 위에 fine-tune.",
    refs: ["중앙_오케스트레이터_요약 §01 (Imitation Learning)"],
  },
  {
    id: "orch-subject-split",
    category: "orchestrator",
    q: "Train/Val/Test 분할이 왜 random이 아니라 subject_id 기반인가?",
    tldr: "Random split은 같은 환자의 다른 방문이 train·test 양쪽에 들어가 데이터 누수 발생. subject_id 분할은 한 환자의 모든 방문이 한 split에만 들어가도록 보장.",
    detail:
      "환자가 응급실에 여러 번 방문하는 케이스가 많음(만성질환·재발). MIMIC-IV에 환자당 평균 2.3회 방문 데이터 존재.\n\n" +
      "Random split 시 문제:\n" +
      "  • 같은 환자 A의 1회차 방문은 train, 2회차는 test\n" +
      "  • 환자 A의 만성질환(당뇨·고혈압) 패턴이 train에 노출됨\n" +
      "  • Test accuracy 부풀려짐(데이터 누수)\n\n" +
      "subject_id 기반 분할:\n" +
      "  • train_subjects, val_subjects, test_subjects 집합이 disjoint\n" +
      "  • 한 환자의 모든 방문은 한 split에만\n" +
      "  • 70/15/15 비율로 환자 수 분할(샘플 수 분할 아님) — Train 232K / Val 50K / Test 50K\n\n" +
      "결과: 91.33% accuracy는 'unseen patient' 기준 — 신규 환자에 일반화 성능을 직접 측정.",
    refs: ["중앙_오케스트레이터_요약 §01-③"],
  },
  {
    id: "orch-initial-vs-followup",
    category: "orchestrator",
    q: "Initial 모델과 Follow-up 모델을 왜 분리했나?",
    tldr: "Cold start vs hot state — 첫 결정은 모달 결과 0개, 이후 결정은 부분 결과 있음. Feature 분포·action space 다름 → 한 모델로는 underfit.",
    detail:
      "Initial 모델 (action_index = 1):\n" +
      "  • Feature: 나이·성별·주호소·바이탈·CC Prior\n" +
      "  • has_ecg/cxr/lab = 모두 0 (NOT_ORDERED)\n" +
      "  • Action: order_ecg / order_cxr / order_lab (3개)\n" +
      "  • stop·need_reasoning은 불가능(아직 결과 없으므로)\n\n" +
      "Follow-up 모델 (action_index ≥ 2):\n" +
      "  • Feature: 위 + 3-State has_ecg/cxr/lab + 모달 결과 49개(ECG 24 + CXR 14 + LAB 11)\n" +
      "  • 부분 정보 상태 — 0~3개 모달 완료\n" +
      "  • Action: order_xxx 3개 + stop + need_reasoning = 5개\n\n" +
      "한 모델로 통합 시:\n" +
      "  • Initial 시점에 모달 feature 49개가 모두 0 → 'sparse input' 학습 어려움\n" +
      "  • stop·need_reasoning을 Initial에서도 예측해야 → output 강제 0 처리, 학습 신호 노이즈\n\n" +
      "분리 학습이 정확도·해석성 모두 우위.",
    refs: ["중앙_오케스트레이터_요약 §04"],
  },
  {
    id: "orch-max-3-iter",
    category: "orchestrator",
    q: "왜 max 3회 반복인가? 더 많으면 더 정확하지 않나?",
    tldr: "ER 평균 체류 4시간 + 모달 3개(ECG/CXR/LAB) 모두 오더하면 임상 정보 포화. 4회+는 diminishing returns + 모델 분포 외(out-of-distribution) 위험.",
    detail:
      "응급실 워크플로 현실:\n" +
      "  • ECG 10분 + CXR 30분 + LAB 70분 = 누적 110분 (병렬 시)\n" +
      "  • 4시간 체류 한도 내 가능한 모달 오더는 사실상 3개\n" +
      "  • 4번째 반복은 같은 모달 재오더 → 임상적 가치 낮음\n\n" +
      "모델 관점:\n" +
      "  • action_index ≥ 4 샘플은 train data에서 6% 미만 — 학습 부족\n" +
      "  • out-of-distribution → 신뢰도 낮음 → 자동 need_reasoning escalation\n\n" +
      "3회로 제한 후 → Bedrock LLM에 종합 소견서 생성 위임. 그 시점에 RAG로 유사 사례 검색해 인용. 모델이 못 푼 케이스는 무리해서 풀지 않고 LLM·전문의에게 넘기는 게 안전.",
    refs: ["중앙_오케스트레이터_요약 §05"],
  },
  {
    id: "orch-argmax-vs-threshold",
    category: "orchestrator",
    q: "왜 argmax인가? 각 모달별 threshold(예: ECG ≥ 0.5면 오더)가 더 자연스럽지 않나?",
    tldr: "다음 행동은 mutual exclusive(한 시점에 하나만) → argmax가 자연스러움. Threshold 독립 시 'order_ecg=0.6 AND order_cxr=0.7 AND order_lab=0.55' 같은 충돌 발생.",
    detail:
      "Threshold 독립 사용 시:\n" +
      "  • 'ECG, CXR, LAB 모두 0.5 초과' → 의사가 동시에 3개 다 오더?\n" +
      "  • 응급실 워크플로상 한 번에 하나씩 결정해야(트리아지 우선순위)\n" +
      "  • Threshold 충돌 시 임시 규칙(가장 높은 거 선택) — 결국 argmax\n\n" +
      "Argmax + 신뢰도 검사:\n" +
      "  • 8개 binary score 중 최대값 선택 → 1개 action\n" +
      "  • 최대값 < 0.6 → escalate to LLM (불확실 → 전문의에 위임)\n" +
      "  • need_reasoning binary가 따로 있어 'AI도 판단 못 하겠다'를 명시 가능\n\n" +
      "장점: 의사가 '다음 검사 1개'를 받는 단순한 UI + 모델 출력 일관성.",
    refs: ["중앙_오케스트레이터_요약 §04, §05"],
  },
  {
    id: "orch-tat-values",
    category: "orchestrator",
    q: "ECG 10분·CXR 30분·LAB 70분 TAT — 어떻게 정했나?",
    tldr: "ECG·CXR은 임상 가이드라인, LAB은 MIMIC labevents 실측 중앙값. AHA/ACC 표준 + 데이터 기반 혼합.",
    detail:
      "TAT(Turn-Around Time) = 검사 오더 → 결과 확인 가능 시각까지의 시간. 스냅샷 타이밍의 기준이라 정확해야 학습 데이터 품질 보장됨.\n\n" +
      "ECG = 10분:\n" +
      "  • MIMIC-IV에 ECG 판독 완료 시각이 없음(noteevents에 판독문은 있지만 시각 없음)\n" +
      "  • AHA/ACC 가이드라인: STEMI 의심 시 'door-to-ECG 10분 이내'\n" +
      "  • 보수적 표준치 사용\n\n" +
      "CXR = 30분:\n" +
      "  • 응급 방사선 판독 실측 범위 20~48분(JACR 2019)\n" +
      "  • 중간값 30분 보수적 채택\n" +
      "  • CheXpert AI 판독으로 simulated(MIMIC-CXR 데이터셋)\n\n" +
      "LAB = 70분 (실증 기반):\n" +
      "  • MIMIC labevents 테이블에 storetime(저장) - charttime(채혈) 컬럼 존재\n" +
      "  • p50(중앙값) = 70분 — 실제 환자 데이터에서 계산\n" +
      "  • 가이드라인 60분 권고 대비 약간 김 → 실측이 더 신뢰됨\n\n" +
      "TAT 값 자체가 학습 라벨 생성에 직접 영향(스냅샷 타이밍) — 별도 sensitivity analysis로 ±20% 변동 시 정확도 영향 미미함을 검증.",
    refs: ["중앙_오케스트레이터_요약 §02"],
  },
  {
    id: "orch-u-zeros",
    category: "orchestrator",
    q: "CheXpert의 unclear(-1.0)를 U-Zeros로 처리한 이유?",
    tldr: "CheXpert는 0/1/-1 (negative/positive/uncertain). -1→0(U-Zeros)은 False Positive 억제, -1→1(U-Ones)은 Recall 우선. 응급 진단 보조에서는 FP 비용이 더 큼.",
    detail:
      "CheXpert 데이터셋(흉부 X-ray 판독 라벨)은 라디올로지스트가 'mentioned but uncertain'한 소견에 -1 표시. 모델 학습 시 처리 방식 4가지:\n" +
      "  • U-Ignore: -1 샘플 제외\n" +
      "  • U-Zeros: -1 → 0 (negative 취급)\n" +
      "  • U-Ones: -1 → 1 (positive 취급)\n" +
      "  • U-MultiClass: 3-class 학습\n\n" +
      "우리 채택: U-Zeros\n" +
      "이유:\n" +
      "  • Orchestrator는 'CXR 추가 오더할지 결정' — false positive(CXR 불필요한데 오더) 비용이 높음\n" +
      "  • U-Ones는 FP↑ → '없는 폐렴'으로 오인 → 불필요한 CT까지 escalate\n" +
      "  • U-Ignore는 학습 데이터 30% 손실\n\n" +
      "검증: Val set에서 U-Zeros vs U-Ones 비교 — U-Zeros가 precision 6%p 우위. 응급실은 specificity 중요.",
    refs: ["중앙_오케스트레이터_요약 §02 (CXR feature)"],
  },
  {
    id: "orch-cxr-0-percent",
    category: "orchestrator",
    q: "Initial 모델 CXR 정확도 0% — 이거 그냥 출시할 건가?",
    tldr: "CXR 클래스가 train data의 2.5%로 극심한 불균형 → Initial이 절대 CXR을 안 고름. 의도적 공개 — Follow-up 모델이 잘 잡으므로 production 영향 작음.",
    detail:
      "Initial 모델 출력 분포 (Test 50K):\n" +
      "  • order_ecg: 92.2% 정확도 (target 빈도 50%)\n" +
      "  • order_lab: 94.4% 정확도 (target 빈도 47%)\n" +
      "  • order_cxr: 0.0% 정확도 (target 빈도 2.5%) ← 문제\n\n" +
      "원인:\n" +
      "  • argmax 결정에서 CXR이 최고가 되는 케이스가 거의 없음\n" +
      "  • 모델이 'CXR을 first action으로 추천' 자체를 학습 못함\n" +
      "  • Train data에서 CXR을 첫 검사로 한 케이스가 1,300건/232K ≈ 0.6%\n\n" +
      "왜 production OK:\n" +
      "  • Follow-up 모델은 CXR target 빈도가 18%로 균형 잡힘 → 잘 잡음\n" +
      "  • 임상적으로 흉통/호흡곤란 환자도 ECG·LAB이 먼저 — CXR은 결과 확인 후 추가 오더 시점\n" +
      "  • 의사가 first action으로 CXR 우선해야 하는 케이스(외상 등)는 별도 KTAS 트리아지 룰에서 처리\n\n" +
      "개선 계획: SMOTE oversampling / focal loss / 2-stage classifier(stop-vs-continue → modal 선택) 검증 중.",
    refs: ["중앙_오케스트레이터_요약 §07 (Initial 성능)"],
  },
  {
    id: "orch-4-rules",
    category: "orchestrator",
    q: "need_reasoning escalation 4개 룰 — 학습으로 안 하고 왜 규칙 기반?",
    tldr: "각 룰이 rare event(전체 1~5%) → supervised model이 과소학습. 룰로 coverage 보장 + feature(input)이자 label(output)로 dual-use.",
    detail:
      "4개 룰(중앙_오케스트레이터_요약 §03):\n" +
      "  • Rule 1 — 고위험 단일 소견(AMI·심정지·폐색전·Troponin↑·기흉)\n" +
      "  • Rule 2 — 검사 결과 충돌(A-fib + Troponin 정상)\n" +
      "  • Rule 3 — KTAS 2 이상 + 모든 결과 정상(놓친 진단 가능성)\n" +
      "  • Rule 4 — 체류 > 4시간(복잡 케이스)\n\n" +
      "왜 학습이 아닌 룰:\n" +
      "  • 각 룰은 train data의 1~5%만 양성 → recall 보장 어려움\n" +
      "  • 'AMI 양성 → escalate'은 학습 불필요한 자명한 임상 규칙\n" +
      "  • 룰 위반 시 false negative(놓치면 환자 위험) > false positive(불필요 escalation) — 룰이 안전\n\n" +
      "Dual-use 트릭:\n" +
      "  • 룰 결과를 학습 시 'need_reasoning' label로 사용 → 모델도 동일 패턴 학습\n" +
      "  • 추론 시 룰 AND 모델 모두 활성 → 두 신호 OR로 escalation 결정\n" +
      "  • 룰은 floor, 모델은 ceiling — 룰이 못 잡은 미묘한 case를 모델이 추가로 잡음\n\n" +
      "Bedrock LLM은 escalation 받은 case만 처리 → 비용 절감 + 정확도 유지.",
    refs: ["중앙_오케스트레이터_요약 §03"],
  },
  {
    id: "orch-91-vs-48",
    category: "orchestrator",
    q: "Initial 91.33% vs CC Map 48.1% — CC Map이 뭐고 이 비교가 공정한가?",
    tldr: "CC Map은 '주호소→권장검사' 단순 매핑 테이블(현행 임상 가이드라인 컴퓨터화). EMON ML은 동일 입력에서 +43%p 정확도 — 공정한 baseline 비교.",
    detail:
      "CC Map (Chief Complaint Map):\n" +
      "  • Triage 주호소(예: '흉통') → 권장 검사(ECG + LAB) 매핑\n" +
      "  • 응급의학회 가이드라인 + 병원 자체 프로토콜 기반\n" +
      "  • 현재 한국 응급실의 사실상 표준\n" +
      "  • 단점: 환자별 맥락(나이·바이탈·기왕력) 무시\n\n" +
      "Test set(50,559 samples)에서:\n" +
      "  • CC Map 정확도 48.1% — '주호소만으로 다음 검사 정확히 맞히기'\n" +
      "  • Initial ML 91.33% — 동일 input(주호소+나이+바이탈+CC Prior)에서 ML이 +43%p\n\n" +
      "비교 공정성:\n" +
      "  • 동일 test set + 동일 input feature 사용\n" +
      "  • CC Map은 현행 임상 SoP의 단순 컴퓨터화 — 진짜 baseline\n" +
      "  • Random baseline은 33%(3-class), CC Map 48%는 의미 있는 baseline\n\n" +
      "ML 우위 원천:\n" +
      "  • CC Prior feature — 같은 '흉통'도 65세 vs 25세에서 검사 패턴 다름을 학습\n" +
      "  • 바이탈(HR/BP/SpO2) 조합 학습\n" +
      "  • 시간대(야간/주간) 영향 학습\n\n" +
      "이 비교는 EMON의 '단순 가이드라인 위에 ML이 의미 있는 추가 가치'를 정량 입증.",
    refs: ["중앙_오케스트레이터_요약 §07"],
  },
  {
    id: "orch-gcs-vs-aws",
    category: "orchestrator",
    q: "왜 학습은 GCS+Dataproc(GCP)이고 운영은 AWS인가? 하나로 통일하지 않는 이유?",
    tldr: "MIMIC-IV/CXR이 PhysioNet GCP에 hosted — GCS 학습 시 egress 0. AWS는 운영(Bedrock·HAPI·환자 데이터). 'data gravity' 원칙.",
    detail:
      "데이터 위치:\n" +
      "  • MIMIC-IV/CXR 31GB가 PhysioNet GCP bucket에 hosted\n" +
      "  • AWS로 옮기면 egress $0.12/GB × 31GB = $3.7 (1회) + 매 업데이트 시\n" +
      "  • GCS에서 학습 = data egress 0\n\n" +
      "GCP 학습 stack:\n" +
      "  • Dataproc(PySpark) — 5개 Data Mart 빌드, 2-4시간\n" +
      "  • GCS Parquet 저장 — 컬럼 압축으로 1/3 사이즈\n" +
      "  • Vertex AI(선택) 또는 단순 Compute Engine에서 LightGBM 학습\n\n" +
      "AWS 운영 stack:\n" +
      "  • ECS Fargate — ECG/CXR/LAB/Orchestrator/RAG/Router 6 컨테이너\n" +
      "  • Aurora — 환자 운영 데이터 + FHIR\n" +
      "  • Bedrock — Claude/Titan LLM 호출\n" +
      "  • 학습된 LightGBM 모델 파일(ONNX 변환)만 S3로 복사\n\n" +
      "통합 시 trade-off:\n" +
      "  • GCP 통일 시: Bedrock 못 씀(GCP는 Gemini), 한국 의료 컴플라이언스 비교 시 AWS Seoul 유리\n" +
      "  • AWS 통일 시: MIMIC 데이터 egress + Glue/EMR 운영 부담\n" +
      "  • 현재 분리: 학습 GCP / 운영 AWS — 각자 강점 활용, 모델 artifact만 S3 동기화\n\n" +
      "Phase 2 검토: AWS HealthLake로 MIMIC 자체 hosting → AWS 통일 가능.",
    refs: ["중앙_오케스트레이터_요약 header (처리 환경)", "AWS_Compute_Design_v1"],
  },
];

/* ═════════════════════════════════════════════════════════
   Page Component
   ═════════════════════════════════════════════════════════ */
export default function QnAPage() {
  const [activeCat, setActiveCat] = useState<CategoryKey | "all">("all");
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return QNA.filter((item) => {
      if (activeCat !== "all" && item.category !== activeCat) return false;
      if (!q) return true;
      return (
        item.q.toLowerCase().includes(q) ||
        item.tldr.toLowerCase().includes(q) ||
        item.detail.toLowerCase().includes(q)
      );
    });
  }, [activeCat, query]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: QNA.length };
    CATEGORIES.forEach((cat) => {
      c[cat.key] = QNA.filter((i) => i.category === cat.key).length;
    });
    return c;
  }, []);

  return (
    <BrandShell>
      {/* Hero */}
      <section className="border-b border-vuno-divider bg-vuno-surface/30">
        <div className="max-w-[1400px] mx-auto px-6 py-20 md:py-24">
          <Link to="/" className="inline-flex items-center gap-1.5 text-base text-vuno-muted hover:text-white mb-6">
            <ArrowLeft className="h-5 w-5" /> Home
          </Link>
          <Reveal>
            <div className="inline-flex items-center gap-2 px-5 py-2.5 border border-vuno-cyan/40 text-vuno-cyan text-base md:text-lg font-bold uppercase tracking-[0.2em] mb-7">
              <HelpCircle className="h-5 w-5 md:h-6 md:w-6" />
              Architecture Q&amp;A
            </div>
            <h1 className="text-5xl md:text-7xl font-bold leading-tight text-white">
              AWS 아키텍트가 <br className="hidden md:block" />
              <span className="text-vuno-cyan">물어볼 수 있는 모든 질문</span>
            </h1>
            <p className="mt-8 text-xl md:text-2xl text-vuno-muted leading-relaxed max-w-5xl break-keep">
              "왜 ECS인가", "NAT 게이트웨이는 왜 안 썼는가", "Aurora Serverless v2 선택 근거는?" —
              사업계획서·AWS 설계 6개 문서 분석 기반,
              <span className="text-vuno-cyan font-bold"> {QNA.length}개 핵심 질문</span>에 대한 정량·정성 답변.
            </p>
            <div className="mt-6 flex flex-wrap gap-2 text-sm md:text-base text-vuno-dim">
              <span className="px-3 py-1 border border-vuno-border bg-vuno-bg">FINAL_보고서_기획서.md</span>
              <span className="px-3 py-1 border border-vuno-border bg-vuno-bg">AWS_Compute_Design_v1</span>
              <span className="px-3 py-1 border border-vuno-border bg-vuno-bg">AWS_Network_Design_v1</span>
              <span className="px-3 py-1 border border-vuno-border bg-vuno-bg">AWS_DB_Design_v3</span>
              <span className="px-3 py-1 border border-vuno-border bg-vuno-bg">AWS_Security_Design_v1</span>
              <span className="px-3 py-1 border border-vuno-border bg-vuno-bg">AWS_Observability_Design_v1</span>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Filter + Search */}
      <section className="sticky top-[72px] z-30 border-b border-vuno-divider bg-vuno-bg/95 backdrop-blur-xl">
        <div className="max-w-[1400px] mx-auto px-6 py-5">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
            {/* 카테고리 칩 */}
            <div className="flex flex-wrap gap-2 flex-1">
              <CatChip
                active={activeCat === "all"}
                onClick={() => setActiveCat("all")}
                label="All"
                count={counts.all}
              />
              {CATEGORIES.map((c) => (
                <CatChip
                  key={c.key}
                  active={activeCat === c.key}
                  onClick={() => setActiveCat(c.key)}
                  icon={c.icon}
                  label={c.label}
                  count={counts[c.key]}
                />
              ))}
            </div>

            {/* 검색 */}
            <div className="relative w-full lg:w-80 flex-shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-vuno-muted" />
              <input
                type="text"
                placeholder="질문/답변 검색…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full h-11 pl-10 pr-4 bg-vuno-surface border border-vuno-border text-white text-base focus:outline-none focus:border-vuno-cyan transition-colors"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Q&A List */}
      <section className="py-12 md:py-16 bg-vuno-bg">
        <div className="max-w-[1100px] mx-auto px-6">
          <div className="mb-6 text-base md:text-lg text-vuno-muted">
            <span className="text-vuno-cyan font-bold">{filtered.length}</span>개 질문
            {query && <span> · "<span className="text-white">{query}</span>" 검색 결과</span>}
          </div>

          {filtered.length === 0 ? (
            <div className="border border-vuno-border bg-vuno-surface p-10 text-center text-vuno-muted">
              검색 결과가 없습니다. 다른 키워드를 시도하거나 필터를 'All'로 변경하세요.
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((item) => (
                <QnACard
                  key={item.id}
                  item={item}
                  open={openId === item.id}
                  onToggle={() => setOpenId(openId === item.id ? null : item.id)}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-20 border-t border-vuno-divider bg-vuno-surface/30">
        <div className="max-w-[1100px] mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-5xl font-bold text-white leading-tight">
            여기에 없는 질문이 있나요?
          </h2>
          <p className="mt-6 text-lg md:text-xl text-vuno-muted break-keep">
            아키텍처·보안·비용·인허가 어떤 관점이든 환영합니다.
            <br className="hidden md:block" />
            기술 자문·파일럿 협력 문의는 Contact 페이지를 이용해주세요.
          </p>
          <div className="mt-10 flex items-center justify-center gap-3 flex-wrap">
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 h-14 px-9 bg-vuno-cyan text-vuno-bg hover:bg-vuno-cyanGlow font-bold tracking-wider uppercase text-base md:text-lg"
            >
              질문 보내기
            </Link>
            <Link
              to="/technology"
              className="inline-flex items-center gap-2 h-14 px-9 border border-vuno-border text-white hover:bg-vuno-surface font-bold tracking-wider uppercase text-base md:text-lg"
            >
              <FileText className="h-5 w-5" /> 기술 아키텍처
            </Link>
          </div>
        </div>
      </section>
    </BrandShell>
  );
}

/* ─────────────────────────────────────────────────────────
   Sub Components
   ───────────────────────────────────────────────────────── */
function CatChip({
  active, onClick, icon: Icon, label, count,
}: {
  active: boolean;
  onClick: () => void;
  icon?: typeof Cpu;
  label: string;
  count: number;
}) {
  return (
    <button
      onClick={onClick}
      className={
        "inline-flex items-center gap-2 px-4 py-2 text-sm md:text-base font-bold transition-colors border " +
        (active
          ? "border-vuno-cyan bg-vuno-cyan text-vuno-bg"
          : "border-vuno-border text-vuno-muted bg-vuno-surface hover:text-white hover:border-vuno-cyan/60")
      }
    >
      {Icon && <Icon className="h-4 w-4" />}
      {label}
      <span className={"text-xs font-numeric tabular-nums " + (active ? "opacity-80" : "text-vuno-dim")}>
        {count}
      </span>
    </button>
  );
}

function QnACard({
  item, open, onToggle,
}: {
  item: QnAItem;
  open: boolean;
  onToggle: () => void;
}) {
  const cat = CATEGORIES.find((c) => c.key === item.category);
  return (
    <div
      className={
        "border bg-vuno-surface transition-colors " +
        (open ? "border-vuno-cyan/60" : "border-vuno-border hover:border-vuno-cyan/40")
      }
    >
      <button
        onClick={onToggle}
        className="w-full text-left p-5 md:p-6 flex items-start gap-4"
      >
        <div className="flex-shrink-0 mt-1">
          {cat && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 border border-vuno-cyan/40 text-vuno-cyan text-xs md:text-sm font-bold uppercase tracking-wider">
              <cat.icon className="h-3.5 w-3.5" />
              {cat.label}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg md:text-xl font-bold text-white leading-snug break-keep">{item.q}</h3>
          {!open && (
            <p className="mt-2 text-base md:text-lg text-vuno-muted leading-relaxed break-keep line-clamp-2">
              {item.tldr}
            </p>
          )}
        </div>
        <ChevronDown
          className={
            "h-5 w-5 md:h-6 md:w-6 text-vuno-cyan flex-shrink-0 transition-transform " +
            (open ? "rotate-180" : "")
          }
        />
      </button>

      {open && (
        <div className="px-5 md:px-6 pb-6 md:pb-7 ml-0 md:ml-[120px]">
          {/* TL;DR */}
          <div className="px-4 py-3 border border-vuno-cyan/40 bg-vuno-cyan/[0.06] mb-5">
            <div className="text-xs font-bold text-vuno-cyan uppercase tracking-[0.2em] mb-1.5">TL;DR</div>
            <div className="text-base md:text-lg text-white leading-relaxed break-keep">{item.tldr}</div>
          </div>

          {/* Detail */}
          <div className="text-base md:text-lg text-vuno-muted leading-relaxed break-keep whitespace-pre-wrap">
            {item.detail}
          </div>

          {/* References */}
          {item.refs.length > 0 && (
            <div className="mt-5 flex flex-wrap items-center gap-2 text-sm md:text-base">
              <span className="text-vuno-cyan/80 font-bold uppercase tracking-wider">근거 문서</span>
              {item.refs.map((r) => (
                <span
                  key={r}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 border border-vuno-border bg-vuno-bg text-vuno-muted font-numeric"
                >
                  <FileText className="h-3.5 w-3.5" />
                  {r}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
