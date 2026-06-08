import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Cpu, Database, Network, Shield, Server, Bell,
  GitBranch, ArrowUpRight, CheckCircle2, Sparkles,
  Lock, Globe, HardDrive, Activity, Eye, Key, Boxes,
  Zap, Cloud, PiggyBank, TrendingDown, Maximize2,
} from "lucide-react";
import { BrandShell } from "../../components/brand/BrandShell";
import { ModalityExplorer } from "../../components/brand/ModalityExplorer";
import { CountUp } from "../../components/brand/anim/CountUp";
import { Lightbox } from "../../components/brand/Lightbox";

export default function TechnologyPage() {
  return (
    <BrandShell>
      <Hero />
      <DataSection />
      <ModalityExplorer />
      <CoreTechSection />
      <ArchitectureSection />
      <AWSSection />
      <ComputingDetail />
      <SecurityDetail />
      <NetworkDetail />
      <DatabaseDetail />
      <MonitoringDetail />
      <SystemFlowSection />
      <CostOptimizationSection />
      <BottomCTA />
    </BrandShell>
  );
}

function Hero() {
  return (
    <section className="border-b border-vuno-divider bg-vuno-surface/30">
      <div className="max-w-[1400px] mx-auto px-6 py-20 md:py-28">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-5 py-2.5 border border-vuno-cyan/40 text-vuno-cyan text-base md:text-lg font-bold uppercase tracking-[0.2em] mb-7">
            Technology
          </div>
          <h1 className="text-5xl md:text-7xl font-bold leading-tight text-white">
            의료 표준 위에 쌓은 <br />
            <span className="text-vuno-cyan">검증 가능한 AI</span>
          </h1>
        </div>
        <p className="mt-8 text-xl md:text-2xl text-vuno-muted leading-relaxed whitespace-nowrap">
          FHIR R4 · MIMIC-IV · AWS Multi-AZ. 의료 도메인의 신뢰성과 현대 AI 인프라의 확장성을 동시에.
        </p>
      </div>
    </section>
  );
}

function ArchitectureSection() {
  const [zoom, setZoom] = useState(false);
  const src = "/아키텍처확대.png";
  const alt = "EMON Med® 시스템 아키텍처 — 트리아지부터 AI 추론·소견서 생성까지";

  return (
    <section className="py-10 md:py-12">
      <div className="max-w-[1900px] mx-auto px-6">
        {/* 헤더 + 확대 버튼 한 줄 배치 */}
        <div className="flex items-end justify-between gap-4 mb-6 md:mb-8 flex-wrap">
          <div className="text-center flex-1">
            <h2 className="text-3xl md:text-5xl font-bold text-white">System Architecture</h2>
            <p className="mt-3 text-base md:text-xl text-vuno-muted">의사 브라우저부터 AI 추론까지 — 전체 시스템 구성도</p>
          </div>
        </div>

        {/* 아키텍처 다이어그램 — 클릭하면 풀스크린 */}
        <div className="relative group">
          <button
            type="button"
            onClick={() => setZoom(true)}
            className="block w-full cursor-zoom-in"
            aria-label="아키텍처 다이어그램 확대 보기"
          >
            <img
              src={src}
              alt={alt}
              className="block mx-auto w-auto max-w-full max-h-[calc(100vh-260px)] object-contain"
              loading="lazy"
            />
          </button>

          {/* 우상단 플로팅 확대 버튼 */}
          <button
            type="button"
            onClick={() => setZoom(true)}
            className="absolute top-3 right-3 inline-flex items-center gap-2 h-11 px-4 bg-vuno-bg/90 backdrop-blur border border-vuno-cyan/60 text-vuno-cyan hover:bg-vuno-cyan hover:text-vuno-bg transition-colors font-bold text-sm md:text-base tracking-wider uppercase shadow-lg"
          >
            <Maximize2 className="h-4 w-4" />
            확대해서 보기
          </button>
        </div>

        {/* 안내 문구 */}
        <div className="mt-4 text-center text-sm md:text-base text-vuno-dim">
          이미지를 클릭하거나 우상단 버튼을 누르면 전체 화면으로 볼 수 있습니다 · ESC로 닫기
        </div>
      </div>

      {/* 풀스크린 라이트박스 */}
      {zoom && (
        <Lightbox
          src={src}
          alt={alt}
          caption="EMON Med® System Architecture — AWS Multi-AZ 풀스택 구성도"
          onClose={() => setZoom(false)}
        />
      )}
    </section>
  );
}

/* ───────────────────────────────────────────────────────
   System Flow — 2단계 데이터 흐름 (모달 추론 → Aurora → 소견서)
   Bedrock은 RAG-svc가 호출. 중앙은 직접 호출 안 함.
   ─────────────────────────────────────────────────────── */
function SystemFlowSection() {
  return (
    <section id="flow" className="py-28 border-t border-vuno-divider bg-vuno-surface/30">
      <div className="max-w-[1400px] mx-auto px-6">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-5 py-2.5 border border-vuno-cyan/40 text-vuno-cyan text-base md:text-lg font-bold uppercase tracking-[0.2em] mb-7">
            Data & Inference Flow
          </div>
          <h2 className="text-5xl md:text-7xl font-bold text-white leading-tight">
            모달 추론 → Aurora 저장 →<br />
            <span className="text-vuno-cyan">RAG-svc가 Bedrock 호출</span>해 소견서 생성
          </h2>
          <p className="mt-8 text-2xl md:text-3xl text-vuno-muted max-w-6xl mx-auto break-keep">
            모달 추론과 소견서 생성은 별개 단계. 중앙은 HTTP로 모달을 호출해 Aurora에 저장하고,
            의사가 소견서를 요청하면 다시 Aurora에서 읽어 RAG-svc에 전달합니다.
          </p>
        </div>

        <div className="border border-vuno-cyan/40 bg-vuno-bg p-9 md:p-11 max-w-6xl mx-auto">
          {/* STEP 1 — 모달 추론 (실시간) */}
          <div className="mb-7">
            <div className="inline-flex items-center gap-2 px-4 py-2 border border-vuno-cyan bg-vuno-cyan/10 text-vuno-cyan text-lg md:text-xl font-bold mb-6">
              STEP 1 · 모달 추론 (실시간)
            </div>
            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr_auto_1fr] gap-5 items-center text-center">
              <div className="space-y-3">
                {["ECG svc", "CXR svc", "LAB svc"].map((m) => (
                  <div key={m} className="border border-vuno-cyan/50 bg-vuno-surface px-4 py-3">
                    <div className="text-lg md:text-xl font-bold text-white font-numeric">{m}</div>
                  </div>
                ))}
                <div className="text-base md:text-lg text-vuno-muted pt-2 break-keep">독립 ECS 컨테이너 (Plug-and-Play)</div>
              </div>

              <div className="hidden md:flex flex-col items-center">
                <ArrowUpRight className="h-8 w-8 text-vuno-cyan -rotate-45" />
                <div className="text-base md:text-lg text-vuno-muted mt-2 break-keep font-numeric">POST /predict</div>
              </div>

              <div>
                <div className="border border-vuno-cyan/50 bg-vuno-surface px-5 py-5">
                  <div className="text-xl md:text-2xl font-bold text-white">중앙 Orchestrator</div>
                  <div className="text-base md:text-lg text-vuno-muted mt-2">HTTP 응답 수집</div>
                </div>
              </div>

              <div className="hidden md:flex flex-col items-center">
                <ArrowUpRight className="h-8 w-8 text-vuno-cyan -rotate-45" />
                <div className="text-base md:text-lg text-vuno-muted mt-2 break-keep font-numeric">UPSERT</div>
              </div>

              <div className="border-2 border-amber-400/60 bg-amber-400/[0.08] px-5 py-5">
                <div className="text-xl md:text-2xl font-bold text-amber-300">Aurora</div>
                <div className="text-base md:text-lg text-amber-300/80 mt-2 font-numeric">modal_results</div>
                <div className="text-base md:text-lg text-amber-300/80">+ encounters 환자정보</div>
              </div>
            </div>
          </div>

          {/* 구분선 + 시간차 메시지 */}
          <div className="flex items-center gap-3 my-9">
            <div className="flex-1 border-t border-dashed border-vuno-cyan/30" />
            <div className="text-base md:text-lg text-vuno-dim break-keep px-3">의사가 "소견서 생성" 클릭 (1초 ~ 10분 뒤)</div>
            <div className="flex-1 border-t border-dashed border-vuno-cyan/30" />
          </div>

          {/* STEP 2 — 소견서 생성 (RAG-svc가 Bedrock 호출) */}
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 border border-vuno-cyan bg-vuno-cyan/10 text-vuno-cyan text-lg md:text-xl font-bold mb-6">
              STEP 2 · 소견서 생성 (RAG-svc가 Bedrock 호출)
            </div>
            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_2fr_auto_1fr] gap-5 items-center text-center">
              <div className="border-2 border-amber-400/60 bg-amber-400/[0.08] px-5 py-5">
                <div className="text-xl md:text-2xl font-bold text-amber-300">Aurora</div>
                <div className="text-base md:text-lg text-amber-300/80 mt-2 font-numeric">SELECT modal_results</div>
                <div className="text-base md:text-lg text-amber-300/80">+ encounters</div>
              </div>

              <div className="hidden md:flex flex-col items-center">
                <ArrowUpRight className="h-8 w-8 text-vuno-cyan -rotate-45" />
                <div className="text-base md:text-lg text-vuno-muted mt-2 break-keep">중앙이 context 조립</div>
              </div>

              <div className="border-2 border-vuno-cyan bg-vuno-cyan/15 px-6 py-6 shadow-[0_0_0_1px_rgba(67,224,212,0.3)]">
                <div className="text-2xl md:text-3xl font-bold text-vuno-cyan mb-1">RAG-svc</div>
                <div className="text-base md:text-lg text-vuno-muted">(소견서 생성 전담)</div>
                <div className="mt-4 space-y-2.5 text-left">
                  <div className="text-base md:text-lg text-white whitespace-nowrap">① ChromaDB 검색 (유사사례 Top-3)</div>
                  <div className="text-base md:text-lg text-white whitespace-nowrap">② 프롬프트 조립 (context + 사례)</div>
                  <div className="text-base md:text-lg text-vuno-cyan font-bold whitespace-nowrap">③ Bedrock Claude 호출 ⭐</div>
                  <div className="text-base md:text-lg text-white whitespace-nowrap">④ Aurora diagnostic_reports 저장</div>
                </div>
              </div>

              <div className="hidden md:flex flex-col items-center">
                <ArrowUpRight className="h-8 w-8 text-vuno-cyan -rotate-45" />
                <div className="text-base md:text-lg text-vuno-muted mt-2 break-keep">narrative 반환</div>
              </div>

              <div className="space-y-3">
                <div className="border border-vuno-cyan/50 bg-vuno-surface px-4 py-3.5">
                  <div className="text-lg md:text-xl font-bold text-white">한국어 소견서</div>
                  <div className="text-base md:text-lg text-vuno-muted mt-1">근거 + heatmap</div>
                </div>
                <div className="border border-emerald-400/40 bg-emerald-400/[0.06] px-4 py-3.5">
                  <div className="text-lg md:text-xl font-bold text-emerald-300">의사 검토·서명</div>
                  <div className="text-base md:text-lg text-emerald-300/80 mt-1">FHIR EMR 기록</div>
                </div>
              </div>
            </div>
          </div>

          {/* Key insight — 한 줄로 */}
          <div className="mt-10 px-7 py-6 border border-vuno-cyan/30 bg-vuno-surface text-center text-base md:text-lg text-vuno-cyan leading-relaxed overflow-hidden">
            <span className="whitespace-nowrap">
              <span className="font-bold">▸ 핵심</span> — Bedrock 호출은 <span className="font-bold">RAG-svc가 전담</span>.
              중앙은 데이터 수집·전달만, 모든 모달은 ECS 독립 컨테이너라 <span className="font-bold">Plug-and-Play 구조</span>.
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

function CoreTechSection() {
  const items = [
    {
      icon: Cpu, title: "멀티모달 추론",
      desc: "ONNX Runtime (ECG · CXR) · XGBoost (LAB) — 각 모달 독립 ECS 서비스로 격리 배포",
      tags: ["ONNX Runtime", "XGBoost", "ECS"],
    },
    {
      icon: Sparkles, title: "Bedrock Claude (LLM)",
      desc: "검사 결과 + RAG 유사사례를 종합해 한국어 종합 소견서를 생성 — AWS Bedrock 기반 LLM",
      tags: ["AWS Bedrock", "Claude", "LLM"],
    },
    {
      icon: Database, title: "RAG / ChromaDB",
      desc: "MIMIC-IV 49,743건 Bedrock Titan v2 임베딩 · 512차원 코사인 유사도",
      tags: ["ChromaDB", "Bedrock Titan v2", "MIMIC-IV"],
      to: "/technology/rag",
    },
    {
      icon: GitBranch, title: "FHIR R4 표준",
      desc: "HAPI FHIR 서버 9 리소스 자동 관리 — Patient · Encounter · Observation · Condition 등",
      tags: ["FHIR R4", "HAPI", "HL7"],
    },
    {
      icon: Network, title: "WebSocket 실시간",
      desc: "modal_events 10종 이벤트를 fan-out — 새 권고·검사 결과·소견서를 의사 화면에 즉시 반영",
      tags: ["WebSocket", "fan-out", "실시간"],
    },
    {
      icon: Bell, title: "FCM Push 알림",
      desc: "Critical 환자·소견서 생성 완료를 의사 모바일 앱에 즉시 푸시 — 단말 토큰 등록 후 백그라운드 알림",
      tags: ["FCM", "firebase-admin", "Push"],
    },
    {
      icon: Shield, title: "Cognito 인증",
      desc: "사번 + 비밀번호 로그인 · JWT 토큰 인증 — 병원 SSO(SAML/OIDC) 연동 확장 가능 구조",
      tags: ["Cognito", "JWT", "SSO-ready"],
    },
  ];

  return (
    <section className="py-28 border-t border-vuno-divider bg-vuno-surface/30">
      <div className="max-w-[1400px] mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-white">Core Technology Stack</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((it) => {
            const card = (
              <>
                <div className="h-12 w-12 bg-vuno-surface border border-vuno-cyan/40 grid place-items-center text-vuno-cyan mb-5">
                  <it.icon className="h-6 w-6" />
                </div>
                <div className="flex items-start gap-2">
                  <h3 className="text-xl md:text-2xl font-bold text-white mb-2.5">{it.title}</h3>
                  {it.to && <ArrowUpRight className="h-5 w-5 text-vuno-cyan mt-1 ml-auto flex-shrink-0" />}
                </div>
                <p className="text-lg md:text-xl text-vuno-muted leading-relaxed">{it.desc}</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {it.tags.map((t) => (
                    <span key={t} className="px-2.5 py-1 border border-vuno-border text-sm text-vuno-cyan font-medium font-numeric">{t}</span>
                  ))}
                </div>
                {it.to && (
                  <div className="mt-5 pt-4 border-t border-vuno-border text-sm md:text-base text-vuno-cyan font-semibold uppercase tracking-wider">
                    자세히 보기 →
                  </div>
                )}
              </>
            );
            const cls = "block border bg-vuno-bg p-7 transition-colors " + (
              it.to
                ? "border-vuno-cyan/50 hover:border-vuno-cyan hover:bg-vuno-cyan/[0.03] cursor-pointer"
                : "border-vuno-border hover:border-vuno-cyan"
            );
            return it.to ? (
              <Link key={it.title} to={it.to} className={cls}>{card}</Link>
            ) : (
              <div key={it.title} className={cls}>{card}</div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function DataSection() {
  return (
    <section id="data" className="py-28">
      <div className="max-w-[1400px] mx-auto px-6">
        <div className="max-w-4xl">
          <div className="inline-flex items-center gap-2 px-4 py-2 border border-emerald-400/40 text-emerald-400 text-sm md:text-base font-bold uppercase tracking-[0.2em] mb-6">
            Open Medical Data
          </div>
          <h2 className="text-4xl md:text-6xl font-bold leading-tight text-white">
            <span className="text-vuno-cyan">MIMIC-IV</span><br />
            검증된 임상 데이터셋
          </h2>
          <p className="mt-7 text-xl md:text-2xl text-vuno-muted leading-relaxed">
            MIT Lab for Computational Physiology에서 공개한 ICU 환자 데이터.
            비식별화된 임상 노트·검사 결과·진단명·처방 정보를 학습·평가·RAG에 활용합니다.
          </p>
          <ul className="mt-7 space-y-3.5">
            {[
              "임상 노트 49,743건 임베딩",
              "비식별화 처리 완료 (HIPAA 호환)",
              "MIT 라이선스 (연구·교육 자유 사용)",
              "ICU 환자 380,000명 데이터",
            ].map((b) => (
              <li key={b} className="flex gap-3 text-lg md:text-xl text-vuno-muted">
                <CheckCircle2 className="h-6 w-6 text-vuno-cyan flex-shrink-0 mt-1" />
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function AWSSection() {
  const blocks = [
    { icon: Server,   title: "Computing",     desc: "ECS Fargate × 6 서비스(총 12 tasks) · HAPI EC2 t3.large · Multi-AZ" },
    { icon: Network,  title: "Network",       desc: "VPC 4-tier · Subnet 8 · VPC Endpoint 8 · CloudFront(S3 frontend)" },
    { icon: Shield,   title: "Security",      desc: "Cognito · KMS 2키 · AWS WAF(ALB) · VPC Endpoint Private Link" },
    { icon: Database, title: "Database",      desc: "Aurora Serverless v2(PG16) · S3 PACS · ChromaDB(S3) · HAPI FHIR" },
    { icon: Bell,     title: "Observability", desc: "CloudWatch Alarms × 23 · SNS 2 Topics · VPC Flow Logs · WebSocket + FCM" },
  ];
  return (
    <section id="aws" className="py-28 border-y border-vuno-divider bg-vuno-surface/30">
      <div className="max-w-[1400px] mx-auto px-6">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 border border-vuno-cyan/40 text-vuno-cyan text-sm md:text-base font-bold uppercase tracking-[0.2em] mb-6">
            AWS Multi-AZ Architecture
          </div>
          <h2 className="text-4xl md:text-6xl font-bold leading-tight text-white">
            응급실에 적합한 <br />
            <span className="text-vuno-cyan">무중단 인프라</span>
          </h2>
          <p className="mt-6 text-xl md:text-2xl text-vuno-muted">5개 영역 24/7 가용성 보장</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 max-w-6xl mx-auto">
          {blocks.map((b) => (
            <div key={b.title} className="border border-vuno-border bg-vuno-bg p-7 hover:border-vuno-cyan transition-colors">
              <div className="h-14 w-14 bg-vuno-surface border border-vuno-cyan/40 grid place-items-center text-vuno-cyan mb-5">
                <b.icon className="h-7 w-7" />
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-white">{b.title}</h3>
              <p className="text-base md:text-lg text-vuno-muted mt-3 leading-relaxed break-keep">{b.desc}</p>
            </div>
          ))}
        </div>

        <div className="text-center mt-12 text-lg md:text-xl text-vuno-dim break-keep">
          5개 영역 24/7 가용성 보장 — 자세한 비용 분해는
          <a href="#cost" className="ml-1 text-vuno-cyan hover:underline">하단 06 Cost Optimization</a>
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────────────────────────────────────
   AWS 5개 영역 상세 — 컴퓨팅·보안·네트워킹·데이터베이스·모니터링
   각 섹션은 4개의 상세 카드로 구성
   ─────────────────────────────────────────────────────── */
type DetailItem = { icon: typeof Shield; title: string; desc: string };

function DetailSection({
  badge, title, items, bg, anchor,
}: {
  badge: string;
  title: string;
  items: DetailItem[];
  bg?: string;
  anchor?: string;
}) {
  return (
    <section id={anchor} className={`py-28 ${bg ?? "border-t border-vuno-divider"}`}>
      <div className="max-w-[1400px] mx-auto px-6">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-2 border border-vuno-cyan/40 text-vuno-cyan text-sm md:text-base font-bold uppercase tracking-[0.2em] mb-5">
            {badge}
          </div>
          <h2 className="text-4xl md:text-6xl font-bold text-white">{title}</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {items.map((it) => (
            <div key={it.title} className="border border-vuno-border bg-vuno-surface p-8 hover:border-vuno-cyan transition-colors">
              <it.icon className="h-12 w-12 text-vuno-cyan mb-5" />
              <h3 className="text-xl md:text-2xl font-bold text-white leading-tight break-keep">{it.title}</h3>
              <p className="text-lg md:text-xl text-vuno-muted mt-4 leading-relaxed break-keep whitespace-pre-line">{it.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ComputingDetail() {
  return <DetailSection badge="01 · Computing" title="컴퓨팅" anchor="compute"
    items={[
      { icon: Boxes,    title: "ECS Fargate × 6 서비스", desc: "Orchestrator · ECG · CXR · LAB · Router · RAG. 각 2 tasks(총 12개)로 Multi-AZ 분산" },
      { icon: Server,   title: "HAPI FHIR EC2",        desc: "FHIR R4 9 리소스 전용 EC2 — JPA/Hibernate 자동 스키마, hapi_user 분리 인증" },
      { icon: Network,  title: "ALB + Multi-AZ",       desc: "Application Load Balancer가 두 AZ ECS 태스크에 트래픽 분산. 무중단 롤링 배포" },
      { icon: HardDrive,title: "ECR (컨테이너 레지스트리)", desc: "각 서비스 이미지 보관. ECS Task가 VPC Endpoint(ecr api/dkr)로 Private pull" },
    ]} />;
}

function SecurityDetail() {
  return <DetailSection badge="02 · Security" title="보안" anchor="security" bg="border-t border-vuno-divider bg-vuno-surface/30"
    items={[
      { icon: Lock,    title: "Cognito UserPool",          desc: "사번 + 비밀번호\nUSER_SRP_AUTH · JWT 토큰\nSSO(SAML/OIDC) 확장 가능 구조" },
      { icon: Key,     title: "KMS 암호화 키 × 2",          desc: "고객관리형 KMS 키 2개(aurora-kms · 공용) — Aurora 데이터 · 백업 · Performance Insights 암호화" },
      { icon: Shield,  title: "AWS WAF · ALB 연결",         desc: "REGIONAL Scope WebACL이 ALB에 연결. Common(OWASP) · BadInputs · IpReputation · RateLimit 4 룰 적용" },
      { icon: Globe,   title: "VPC Endpoint × 8 (Private)", desc: "S3(Gateway) + ECR(api/dkr) · KMS · Bedrock · SecretsManager · Logs · CloudWatch Metrics(Interface) — NAT 없이 직접 통신" },
    ]} />;
}

function NetworkDetail() {
  return <DetailSection badge="03 · Network" title="네트워킹" anchor="network"
    items={[
      { icon: Globe,    title: "VPC 4-tier 구성",        desc: "Public(ALB) · Endpoints(VPCE) · Private App(ECS) · Private Data(Aurora) — 계층 간 SG로 격리" },
      { icon: Boxes,    title: "Subnet × 8 · Multi-AZ",  desc: "AZ-a / AZ-c 두 영역에 각 4-tier 서브넷(10.0.0.0/16) — 한 AZ 장애에도 무중단" },
      { icon: Network,  title: "VPC Endpoint × 8",       desc: "S3(Gateway) + ECR(api/dkr) · KMS · Bedrock · SecretsManager · Logs · CloudWatch Metrics(Interface)" },
      { icon: Shield,   title: "CloudFront CDN + ALB WAF", desc: "S3 frontend 정적 자산은 CloudFront 배포 · API 트래픽은 ALB(WAF REGIONAL)에서 OWASP·Rate Limit 적용" },
    ]} />;
}

function DatabaseDetail() {
  return <DetailSection badge="04 · Database" title="데이터베이스" anchor="database" bg="border-t border-vuno-divider bg-vuno-surface/30"
    items={[
      { icon: Database,  title: "Aurora Serverless v2",    desc: "PostgreSQL 16.11 · ACU 0.5~4 자동 확장(idle ↔ peak) · 고객관리형 KMS 암호화 · Multi-AZ" },
      { icon: HardDrive, title: "S3 PACS · 원본 저장",      desc: "say2-6team 버킷 — MIMIC-CXR 의료영상(2.6 GB+) · ECG waveform · 원본 raw 데이터 보관" },
      { icon: Cpu,       title: "ChromaDB · S3 다운로드",   desc: "say2-6team-rag-db 버킷 · MIMIC-IV 49,743건 임베딩 — RAG 컨테이너가 받아 PersistentClient로 사용" },
      { icon: GitBranch, title: "HAPI FHIR R4 · t3.large", desc: "단독 EC2(t3.large, AZ-a) — Patient · Encounter · Observation · Condition 등 9 리소스 자동 관리" },
    ]} />;
}

function MonitoringDetail() {
  return <DetailSection badge="05 · Monitoring" title="모니터링" anchor="monitoring"
    items={[
      { icon: Activity, title: "CloudWatch Alarm × 23",  desc: "ECS 4서비스 CPU/Mem/Tasks(12) · Aurora ACU/연결/CPU/메모리(4) · ALB 5xx/지연/Unhealthy(4) · 모달 지연/오류 등 자동 감시" },
      { icon: Bell,     title: "SNS Topics × 2",         desc: "critical-alerts(긴급) · warning-alerts(경고) 2개 토픽으로 알람 라우팅 분리" },
      { icon: Eye,      title: "VPC Flow Logs",          desc: "vpc-flow-logs S3 버킷에 모든 네트워크 트래픽 저장 — 감사 추적 + 침해 분석" },
      { icon: Sparkles, title: "WebSocket + FCM",        desc: "의사 화면(WebSocket fan-out) · 모바일 앱(FCM Push) 즉시 임상 알림" },
    ]} />;
}

/* ───────────────────────────────────────────────────────
   06 · Cost Optimization — AWS 인프라 비용 최적화 한 슬라이드
   ─────────────────────────────────────────────────────── */
function CostOptimizationSection() {
  // 영역별 월 비용 (Phase 1 MVP 기준, 실제 배포 리소스 산정)
  const breakdown = [
    { label: "ECS Fargate",    sub: "12 tasks · 0.5 vCPU/1GB", cost: 150, color: "text-vuno-cyan" },
    { label: "Bedrock",        sub: "Claude H/S + Titan v2",   cost: 80,  color: "text-vuno-cyan" },
    { label: "VPC Endpoint × 8", sub: "Interface 7 + Gateway 1",  cost: 60,  color: "text-vuno-cyan" },
    { label: "Aurora SLv2",    sub: "0.5 ACU baseline + KMS",  cost: 45,  color: "text-vuno-cyan" },
    { label: "HAPI EC2",       sub: "t3.large · AZ-a",          cost: 30,  color: "text-vuno-cyan" },
    { label: "ALB",            sub: "Multi-AZ + 5 TG",          cost: 25,  color: "text-vuno-cyan" },
    { label: "S3",             sub: "PACS·RAG·Flow Logs",       cost: 20,  color: "text-vuno-cyan" },
    { label: "CloudFront",     sub: "S3 frontend",              cost: 15,  color: "text-vuno-cyan" },
    { label: "CloudWatch",     sub: "23 Alarms · SNS",          cost: 20,  color: "text-vuno-cyan" },
    { label: "WAF + KMS + 기타",sub: "Cognito Free Tier 포함",   cost: 40,  color: "text-vuno-cyan" },
    { label: "Data Transfer",  sub: "+ NAT + 잡비",             cost: 30,  color: "text-vuno-cyan" },
  ];
  const total = breakdown.reduce((sum, b) => sum + b.cost, 0);
  const maxCost = Math.max(...breakdown.map((b) => b.cost));

  const optimizations = [
    {
      icon: Cpu,
      title: "GPU-free 추론",
      saved: 1200,
      savedLabel: "GPU 인스턴스 0대",
      desc: "ECS Fargate CPU 위에서 ONNX Runtime(ECG · CXR) + XGBoost(LAB)로 동작. 일반적인 의료 AI에서 쓰는 g4dn.xlarge × 2(~$1,200/월) 같은 GPU 인스턴스를 채택하지 않은 설계 선택입니다.",
      kpis: ["ECG 평균 2초 추론", "CXR 150~300ms", "GPU 없음"],
    },
    {
      icon: Database,
      title: "Aurora Serverless v2",
      saved: 220,
      savedLabel: "Provisioned 대비 절감 여지",
      desc: "ACU 0.5~4 자동 확장 — idle 시 baseline 0.5 ACU(~$44/월)로 축소. 상시 Provisioned db.r6g.large(~$260/월)와 비교하면 시연·야간 시간대에 비용 절감 여지가 큽니다.",
      kpis: ["0.5 ~ 4 ACU 자동", "Idle 시 축소", "KMS 암호화 포함"],
    },
    {
      icon: HardDrive,
      title: "ChromaDB on S3",
      saved: 50,
      savedLabel: "EFS 대비 저렴",
      desc: "EFS(NAS)를 두지 않고 S3에서 372MB DB를 컨테이너 시작 시 다운로드 → PersistentClient로 인메모리 사용. EFS Standard(~$80/월) 대신 S3 Standard(~$25/월) 선택.",
      kpis: ["S3 Standard ~$25", "EFS 대비 약 70% 저렴", "재현 가능한 데모"],
    },
  ];

  return (
    <section id="cost" className="py-28 border-t border-vuno-divider bg-vuno-bg">
      <div className="max-w-[1400px] mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-5 py-2.5 border border-vuno-cyan/40 text-vuno-cyan text-base md:text-lg font-bold uppercase tracking-[0.2em] mb-7">
            <PiggyBank className="h-5 w-5 md:h-6 md:w-6" />
            06 · Design Choices for Low Cost
          </div>
          <h2 className="text-5xl md:text-7xl font-bold text-white leading-tight">
            <span className="text-vuno-cyan">GPU-free × Serverless</span>로<br />
            월 <span className="text-vuno-cyan font-numeric tabular-nums">
              ~$<CountUp end={total} duration={1800} />
            </span>
          </h2>
          <p className="mt-8 text-xl md:text-2xl text-vuno-muted max-w-5xl mx-auto break-keep">
            Phase 1 MVP 시연 기준 운영 비용 추정 — AWS 공식 가격표 + 우리 인프라 리소스 사양에서 산출.
            <span className="block mt-2 text-base md:text-lg text-vuno-dim">
              ※ 실측 청구서가 아닌 추정치. 데이터 전송·Bedrock 호출량에 따라 ±30% 변동 가능.
            </span>
          </p>
        </div>

        {/* 영역별 비용 분해 — 막대 그래프 (가운데 정렬) */}
        <div className="max-w-4xl mx-auto mb-20">
          <div className="border border-vuno-border bg-vuno-surface p-8 md:p-10">
            <div className="flex items-baseline justify-between mb-8">
              <div className="text-lg md:text-xl font-bold text-vuno-cyan uppercase tracking-wider">
                월 비용 분해 (추정)
              </div>
              <div className="text-base md:text-lg text-vuno-muted">단위: USD / 월</div>
            </div>
            <div className="space-y-3.5">
              {breakdown.map((b) => (
                <div key={b.label} className="grid grid-cols-[180px_1fr_80px] md:grid-cols-[280px_1fr_100px] items-center gap-4">
                  <div>
                    <div className="text-base md:text-lg font-semibold text-white">{b.label}</div>
                    <div className="text-sm md:text-base text-vuno-muted">{b.sub}</div>
                  </div>
                  <div className="relative h-3 bg-vuno-bg border border-vuno-border overflow-hidden">
                    <div
                      className="absolute inset-y-0 left-0 bg-vuno-cyan"
                      style={{ width: `${(b.cost / maxCost) * 100}%` }}
                    />
                  </div>
                  <div className={`text-right text-lg md:text-xl font-bold font-numeric tabular-nums ${b.color}`}>
                    ${b.cost}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-7 pt-6 border-t border-vuno-border grid grid-cols-[1fr_100px] md:grid-cols-[1fr_180px] items-center">
              <div className="text-xl md:text-2xl font-bold text-white">합계 (Phase 1 MVP)</div>
              <div className="text-right text-3xl md:text-4xl font-bold text-vuno-cyan font-numeric tabular-nums">
                ${total}
              </div>
            </div>
          </div>
        </div>

        {/* 3대 설계 선택 */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-5 py-2.5 border border-vuno-cyan/40 text-vuno-cyan text-base md:text-lg font-bold uppercase tracking-[0.2em] mb-7">
            <TrendingDown className="h-5 w-5 md:h-6 md:w-6" />
            Design Choices
          </div>
          <h3 className="text-4xl md:text-6xl font-bold text-white leading-tight">
            낮은 비용을 만드는 <span className="text-vuno-cyan">3가지 설계 선택</span>
          </h3>
          <p className="mt-6 text-lg md:text-xl text-vuno-muted max-w-4xl mx-auto break-keep">
            아래 절감 수치는 일반적인 비교 옵션의 AWS 공식 가격과 비교한 추정치입니다.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {optimizations.map((o, i) => (
            <div
              key={o.title}
              className="border border-vuno-cyan/50 bg-vuno-surface p-8 md:p-9 h-full hover:border-vuno-cyan hover:bg-vuno-cyan/[0.04] transition-all shadow-[0_0_0_1px_rgba(67,224,212,0.15)]"
            >
              <div className="flex items-start justify-between mb-5">
                <div className="h-16 w-16 bg-vuno-cyan/10 border border-vuno-cyan/50 grid place-items-center text-vuno-cyan flex-shrink-0">
                  <o.icon className="h-8 w-8" />
                </div>
                <div className="text-sm md:text-base font-bold text-vuno-cyan font-numeric tracking-[0.25em]">
                  0{i + 1}
                </div>
              </div>
              <h4 className="text-2xl md:text-3xl font-bold text-white mb-3">{o.title}</h4>
              <div className="text-base md:text-lg text-vuno-cyan/80 mb-5 break-keep">{o.savedLabel}</div>
              <p className="text-base md:text-lg text-vuno-muted leading-relaxed mb-5 break-keep">
                {o.desc}
              </p>
              <div className="flex flex-wrap gap-2">
                {o.kpis.map((k) => (
                  <span key={k} className="px-3 py-1.5 border border-vuno-border text-sm md:text-base text-vuno-cyan font-numeric break-keep">
                    {k}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ComplianceSection() {
  const items = [
    { title: "FHIR R4 표준",   desc: "HL7 국제 표준으로 병원 EMR과 즉시 호환" },
    { title: "VPC Flow Logs",  desc: "모든 네트워크 트래픽을 S3로 감사 로그 보존" },
    { title: "KMS 암호화",      desc: "Aurora · Performance Insights · 환자 데이터 암호화" },
    { title: "PHI 로깅 금지",   desc: "환자 이름·진단 본문 CloudWatch 적재 차단" },
  ];
  return (
    <section className="py-28">
      <div className="max-w-[1400px] mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-6xl font-bold text-white">Security · Compliance</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 max-w-5xl mx-auto">
          {items.map((it) => (
            <div key={it.title} className="border border-vuno-border bg-vuno-surface p-7 text-center">
              <Shield className="h-11 w-11 mx-auto text-vuno-cyan mb-4" />
              <h3 className="text-lg md:text-xl font-bold text-white">{it.title}</h3>
              <p className="text-sm md:text-base text-vuno-muted mt-2.5 leading-relaxed">{it.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function BottomCTA() {
  return (
    <section className="py-20 border-t border-vuno-divider">
      <div className="max-w-[900px] mx-auto px-6 text-center">
        <h2 className="text-4xl md:text-5xl font-bold text-white">
          기술 상세는 화이트페이퍼로
        </h2>
        <p className="mt-4 text-lg md:text-xl text-vuno-muted">아키텍처 다이어그램·DDL·IAM 정책 전체 설계 문서 제공</p>
        <Link
          to="/contact"
          className="inline-flex items-center gap-2 mt-8 h-14 px-9 font-bold border border-vuno-cyan text-vuno-cyan hover:bg-vuno-cyan hover:text-vuno-bg transition-colors tracking-wider uppercase text-base md:text-lg"
        >
          기술 문서 요청 <ArrowUpRight className="h-5 w-5" />
        </Link>
      </div>
    </section>
  );
}
