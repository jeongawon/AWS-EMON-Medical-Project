import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity, AlertTriangle, ArrowLeft, ArrowRight, Brain,
  CheckCircle2, ChevronLeft, ChevronRight, Clock, Database,
  FileStack, FileText, Layers, Search, ShieldCheck, Split,
  Scissors, BrainCircuit, FileSearch, GitMerge, Workflow,
} from "lucide-react";
import { BrandShell } from "../../components/brand/BrandShell";
import { Reveal } from "../../components/brand/anim/Reveal";

/* ───────────────────────────────────────────────────────
   MIMIC-IV Note RAG 전처리 파이프라인 — 인터랙티브 Deep Dive
   /technology/rag/pipeline
   ─────────────────────────────────────────────────────── */

type Stage = {
  id: string;
  title: string;
  subtitle: string;
  icon: typeof FileStack;
  goal: string;
  codeFocus: string[];
  risks: string[];
};

const STAGES: Stage[] = [
  {
    id: "sectioning",
    title: "Sectioning",
    subtitle: "step1_sectioning.py · 구조적 섹셔닝",
    icon: Scissors,
    goal:
      "긴 서술형 의사 소견과 비교적 구조화된 영상 판독문을 같은 방식으로 자르지 않고, 문서 성격에 맞춰 각각 전처리한다.",
    codeFocus: [
      "Discharge Summary: 긴 임상 서술을 평탄화하고 주요 임상 흐름을 보존",
      "Radiology: EXAM / FINDINGS / IMPRESSION 중심으로 섹션 분리",
      "문서 유형별로 embedding_text 구성 방식과 metadata를 다르게 설계",
    ],
    risks: ["긴 텍스트의 맥락 손실", "영상 소견 중심으로만 치우침", "문서 유형별 정보 밀도 차이"],
  },
  {
    id: "bedrock",
    title: "Bedrock 의미 추출",
    subtitle: "step2_bedrock_processor.py · 검색 가능한 임상 의미 단위로 변환",
    icon: BrainCircuit,
    goal:
      "원문을 그대로 임베딩하지 않고, 검사 종류·임상 상태·양성/음성 소견·시간 맥락 등 검색에 필요한 필드를 분리한다.",
    codeFocus: [
      "Claude Haiku 기반 구조화 추출로 free-text를 JSON 필드로 변환",
      "positive findings, negative findings, clinical_status, modality를 분리",
      "수치·시간·비교 표현이 손실되지 않도록 프롬프트를 조정",
    ],
    risks: ["환각", "수치 오류", "부정어 해석 오류", "주요 소견 누락"],
  },
  {
    id: "qc",
    title: "QC + 보강",
    subtitle: "step3_chunking.py · LLM 전처리 결과 검증·보정",
    icon: FileSearch,
    goal:
      "LLM 추출 결과를 그대로 신뢰하지 않고, 규칙 기반 탐지와 보강 절차를 통해 의료 텍스트 전처리에서 발생한 오류를 줄인다.",
    codeFocus: [
      "no evidence, without, normal 등 부정 표현 패턴 탐지",
      "positive/negative 중복 및 정상 소견 과잉 포함 제거",
      "기존 결과를 덮어쓰기보다 supplement 형태로 보강해 추적 가능성 유지",
    ],
    risks: ["negation leak", "중복 청크", "정상 소견 과잉 검색", "보강 과정의 원본 훼손"],
  },
  {
    id: "temporal-join",
    title: "Temporal Join",
    subtitle: "step4_merger.py · 환자 단위 통합 지식 구성",
    icon: GitMerge,
    goal:
      "정제된 radiology history와 discharge summary를 subject/hadm 기준으로 연결해, 단일 문장이 아니라 환자 맥락이 살아 있는 근거 문서로 만든다.",
    codeFocus: [
      "subject_id 기준으로 radiology 청크를 그룹화",
      "radiology charttime ≤ discharge charttime 조건으로 temporal join 수행",
      "퇴원 요약지와 과거 영상 기록을 하나의 integrated knowledge로 병합",
    ],
    risks: ["미래 정보 누수", "같은 환자의 시간 순서 왜곡", "discharge와 radiology 근거 분리"],
  },
  {
    id: "embedding",
    title: "Titan v2 임베딩 + ChromaDB",
    subtitle: "step5_local_embedding_ingestion.py · 벡터 DB 적재",
    icon: Layers,
    goal:
      "최종 정제 문서를 Titan Embed v2로 임베딩하고 ChromaDB에 적재해, 검색 가능한 벡터 DB로 만든다.",
    codeFocus: [
      "Titan Embed Text v2, 512차원 임베딩으로 통일",
      "ChromaDB medical_rag_collection에 문서와 metadata 동시 저장",
      "discharge → {hadm_id}_discharge / radiology → {hadm_id}_rad_{index} 청크 ID 부여",
    ],
    risks: ["임베딩 실패", "중복 적재", "벡터 차원 불일치"],
  },
  {
    id: "orchestration",
    title: "RAG Orchestration",
    subtitle: "step6_rag_orchestrator.py · 검색 + 응답 생성",
    icon: Workflow,
    goal:
      "환자 쿼리를 Titan으로 임베딩하고 ChromaDB에서 유사 사례를 검색해, Claude 기반 최종 응답을 생성한다.",
    codeFocus: [
      "검색 시 Top-20 후보를 가져온 뒤 문서 유형 다양성을 고려해 Top-3 근거 구성",
      "유사도 0.15 미만이면 fallback 응답 (\"유사 사례 없음\")",
      "어려운 케이스는 Claude Sonnet 모델로 라우팅",
    ],
    risks: ["검색 편향", "낮은 유사도 근거의 과신", "환각"],
  },
];

export default function RagPipelinePage() {
  return (
    <BrandShell>
      <PageHero />
      <DualLaneOverview />
      <InteractivePipeline />
      <BottomCTA />
    </BrandShell>
  );
}

/* ───────────────────────────────────────────────────────
   Hero
   ─────────────────────────────────────────────────────── */
function PageHero() {
  return (
    <section className="border-b border-vuno-divider bg-vuno-surface/30">
      <div className="max-w-[1400px] mx-auto px-6 py-16 md:py-20">
        <Link to="/technology/rag" className="inline-flex items-center gap-1.5 text-base md:text-lg text-vuno-muted hover:text-white mb-7">
          <ArrowLeft className="h-5 w-5" /> RAG / ChromaDB
        </Link>

        <Reveal>
          <div className="text-sm md:text-base text-vuno-muted mb-4">
            <Link to="/" className="hover:text-white">Home</Link>
            <span className="mx-2">/</span>
            <Link to="/technology" className="hover:text-white">Technology</Link>
            <span className="mx-2">/</span>
            <Link to="/technology/rag" className="hover:text-white">RAG / ChromaDB</Link>
            <span className="mx-2">/</span>
            <span className="text-vuno-cyan">Pipeline</span>
          </div>

          <div className="inline-flex items-center gap-2 px-5 py-2.5 border border-vuno-cyan/40 text-vuno-cyan text-base md:text-lg font-bold uppercase tracking-[0.2em] mb-7">
            <Activity className="h-5 w-5 md:h-6 md:w-6" />
            Interactive Deep Dive
          </div>

          <h1 className="text-5xl md:text-7xl font-bold leading-tight text-white">
            MIMIC-IV Note 기반<br />
            <span className="text-vuno-cyan">RAG 전처리 구조</span>
          </h1>

          <p className="mt-7 text-xl md:text-2xl text-vuno-muted leading-relaxed max-w-5xl break-keep">
            핵심은 영상 판독문만 정제한 것이 아니라, <span className="text-white font-bold">긴 의사 소견과 퇴원 요약지까지 포함한 비정형 임상 텍스트</span>를
            환자 단위 검색 근거로 재구성한 점입니다.
          </p>

          <div className="mt-8 grid grid-cols-3 gap-3 max-w-md">
            <Metric label="Total docs" value="49,743" />
            <Metric label="Discharge" value="9,998" />
            <Metric label="Radiology" value="39,745" />
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-vuno-border bg-vuno-bg p-4">
      <div className="text-xs uppercase tracking-wider text-vuno-muted">{label}</div>
      <div className="text-xl md:text-2xl font-bold text-white font-numeric tabular-nums mt-1">{value}</div>
    </div>
  );
}

/* ───────────────────────────────────────────────────────
   Dual Lane Overview (3-column flow)
   ─────────────────────────────────────────────────────── */
function DualLaneOverview() {
  return (
    <section className="py-20 md:py-24 border-b border-vuno-divider bg-vuno-bg">
      <div className="max-w-[1400px] mx-auto px-6">
        <Reveal className="mb-10">
          <div className="flex items-center gap-2 text-vuno-cyan/80 text-sm md:text-base">
            <Split className="h-4 w-4 md:h-5 md:w-5" />
            <span>문서 유형별로 다르게 전처리한 뒤, 환자 단위 지식으로 합치는 구조</span>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr_auto_1fr] gap-6 items-stretch">
          <Lane
            title="Discharge Summary"
            subtitle="긴 서술형 의사 소견"
            icon={FileText}
            items={[
              "5만 자 수준의 긴 임상 서술",
              "진단·입원 경과·처치·과거력 보존",
              "검색 가능한 임상 요약 근거로 평탄화",
            ]}
          />
          <Arrow />
          <Lane
            title="Radiology Report"
            subtitle="섹션 구조가 있는 판독문"
            icon={FileStack}
            items={[
              "EXAM / FINDINGS / IMPRESSION 분리",
              "양성·음성 소견과 시간 상태 구조화",
              "부정어·정상 소견 과잉 포함 보정",
            ]}
          />
          <Arrow />
          <Lane
            title="Integrated Knowledge"
            subtitle="환자 단위 RAG 근거"
            icon={Database}
            items={[
              "subject_id / hadm_id 기준 통합",
              "temporal join으로 미래 정보 누수 방지",
              "Titan v2 임베딩 후 ChromaDB 적재",
            ]}
          />
        </div>
      </div>
    </section>
  );
}

function Lane({
  title, subtitle, icon: Icon, items,
}: {
  title: string;
  subtitle: string;
  icon: typeof FileText;
  items: string[];
}) {
  return (
    <Reveal>
      <div className="h-full border border-vuno-border bg-vuno-surface p-7 hover:border-vuno-cyan/60 transition-colors">
        <div className="flex items-center gap-3 mb-5">
          <div className="rounded-none bg-vuno-bg border border-vuno-cyan/40 p-3 text-vuno-cyan">
            <Icon className="h-6 w-6" />
          </div>
          <div>
            <div className="font-bold text-lg md:text-xl text-white">{title}</div>
            <div className="text-sm md:text-base text-vuno-muted">{subtitle}</div>
          </div>
        </div>
        <ul className="space-y-2.5">
          {items.map((it) => (
            <li key={it} className="flex gap-2.5 text-base md:text-lg text-vuno-muted leading-relaxed break-keep">
              <CheckCircle2 className="h-5 w-5 mt-0.5 shrink-0 text-vuno-cyan/80" />
              <span>{it}</span>
            </li>
          ))}
        </ul>
      </div>
    </Reveal>
  );
}

function Arrow() {
  return (
    <div className="hidden lg:flex items-center justify-center text-vuno-cyan/60">
      <ArrowRight className="h-7 w-7" />
    </div>
  );
}

/* ───────────────────────────────────────────────────────
   Interactive 6-Step Pipeline
   ─────────────────────────────────────────────────────── */
function InteractivePipeline() {
  const [step, setStep] = useState(0);
  const stages = useMemo(() => STAGES, []);
  const current = stages[step];
  const Icon = current.icon;

  const next = () => setStep((p) => Math.min(p + 1, stages.length - 1));
  const prev = () => setStep((p) => Math.max(p - 1, 0));

  return (
    <section className="py-20 md:py-24 border-b border-vuno-divider bg-vuno-surface/30">
      <div className="max-w-[1400px] mx-auto px-6">
        <Reveal className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-5 py-2.5 border border-vuno-cyan/40 text-vuno-cyan text-base md:text-lg font-bold uppercase tracking-[0.2em] mb-6">
            6 Stages
          </div>
          <h2 className="text-4xl md:text-6xl font-bold text-white leading-tight">
            각 단계를 <span className="text-vuno-cyan">클릭해 자세히 보세요</span>
          </h2>
        </Reveal>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Step Selector */}
          <aside className="lg:col-span-4 border border-vuno-border bg-vuno-bg p-6">
            <h3 className="font-bold text-lg md:text-xl text-white mb-5">단계 선택</h3>
            <div className="space-y-2.5">
              {stages.map((stage, idx) => {
                const StageIcon = stage.icon;
                const selected = idx === step;
                return (
                  <button
                    key={stage.id}
                    onClick={() => setStep(idx)}
                    className={
                      "w-full text-left border p-4 transition-all " +
                      (selected
                        ? "border-vuno-cyan bg-vuno-cyan/[0.06] shadow-[0_0_0_1px_rgba(67,224,212,0.2)]"
                        : "border-vuno-border bg-vuno-surface hover:border-vuno-cyan/40 hover:bg-vuno-surface/70")
                    }
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={
                          "p-2 " +
                          (selected
                            ? "bg-vuno-cyan text-vuno-bg"
                            : "bg-vuno-bg text-vuno-muted border border-vuno-border")
                        }
                      >
                        <StageIcon className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="text-sm text-vuno-muted">Step {idx + 1}</div>
                        <div className="font-bold text-white text-base md:text-lg">{stage.title}</div>
                        <div className="text-sm md:text-base text-vuno-muted mt-1 break-keep">{stage.subtitle}</div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </aside>

          {/* Step Detail */}
          <section className="lg:col-span-8 border border-vuno-border bg-vuno-bg p-7 md:p-8 min-h-[560px]">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 border-b border-vuno-border pb-5 mb-6">
              <div className="flex items-start gap-4">
                <div className="bg-vuno-cyan/[0.08] border border-vuno-cyan/40 p-3 text-vuno-cyan">
                  <Icon className="h-7 w-7" />
                </div>
                <div>
                  <div className="text-sm md:text-base text-vuno-cyan font-bold tracking-[0.2em] uppercase">Step {step + 1}</div>
                  <h3 className="text-2xl md:text-3xl font-bold text-white mt-1">{current.title}</h3>
                  <p className="text-vuno-muted mt-1 text-base md:text-lg">{current.subtitle}</p>
                </div>
              </div>

              <div className="hidden md:flex items-center gap-2 text-sm md:text-base text-vuno-muted font-numeric">
                <span>{step + 1}</span>
                <span>/</span>
                <span>{stages.length}</span>
              </div>
            </div>

            {/* Goal + Risks */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
              <InfoCard title="이 단계의 목적" icon={CheckCircle2} tone="cyan">
                <p className="text-vuno-muted leading-relaxed text-base md:text-lg break-keep">{current.goal}</p>
              </InfoCard>

              <InfoCard title="왜 중요한가" icon={AlertTriangle} tone="rose">
                <div className="flex flex-wrap gap-2">
                  {current.risks.map((risk) => (
                    <span
                      key={risk}
                      className="border border-rose-400/40 bg-rose-500/[0.06] px-3 py-1.5 text-sm md:text-base text-rose-300"
                    >
                      {risk}
                    </span>
                  ))}
                </div>
              </InfoCard>
            </div>

            {/* Code Focus */}
            <div className="mt-5 border border-vuno-border bg-vuno-surface p-5 md:p-6">
              <div className="flex items-center gap-2 mb-4 text-white font-bold text-base md:text-lg">
                <FileText className="h-5 w-5" /> 코드에서 구현한 핵심 처리
              </div>
              <div className="space-y-2.5">
                {current.codeFocus.map((item, idx) => (
                  <div key={item} className="flex gap-3 border border-vuno-border bg-vuno-bg p-4">
                    <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center bg-vuno-cyan/[0.12] text-sm font-bold text-vuno-cyan font-numeric">
                      {idx + 1}
                    </div>
                    <p className="text-vuno-muted leading-relaxed text-base md:text-lg break-keep">{item}</p>
                  </div>
                ))}
              </div>
            </div>

            <StageVisual stageId={current.id} />

            {/* Nav */}
            <div className="mt-6 flex items-center justify-between border-t border-vuno-border pt-5">
              <button
                onClick={prev}
                disabled={step === 0}
                className={
                  "inline-flex items-center gap-2 px-5 py-3 text-base font-bold transition border " +
                  (step === 0
                    ? "border-vuno-border bg-vuno-bg text-vuno-dim cursor-not-allowed"
                    : "border-vuno-border bg-vuno-surface text-white hover:border-vuno-cyan/60")
                }
              >
                <ChevronLeft className="h-5 w-5" /> 이전
              </button>

              <div className="flex gap-1.5">
                {stages.map((stage, idx) => (
                  <button
                    key={stage.id}
                    onClick={() => setStep(idx)}
                    className={
                      "h-2.5 transition-all " +
                      (idx === step ? "w-8 bg-vuno-cyan" : "w-2.5 bg-vuno-border hover:bg-vuno-muted/60")
                    }
                    aria-label={`Step ${idx + 1}`}
                  />
                ))}
              </div>

              <button
                onClick={next}
                disabled={step === stages.length - 1}
                className={
                  "inline-flex items-center gap-2 px-5 py-3 text-base font-bold transition border " +
                  (step === stages.length - 1
                    ? "border-vuno-border bg-vuno-bg text-vuno-dim cursor-not-allowed"
                    : "border-vuno-cyan bg-vuno-cyan text-vuno-bg hover:bg-vuno-cyanGlow")
                }
              >
                다음 <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </section>
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────────────────────────────────────
   Sub-components — InfoCard, StageVisual
   ─────────────────────────────────────────────────────── */
function InfoCard({
  title, icon: Icon, tone, children,
}: {
  title: string;
  icon: typeof CheckCircle2;
  tone: "cyan" | "rose";
  children: React.ReactNode;
}) {
  const toneClass =
    tone === "rose"
      ? "border-rose-400/30 bg-rose-500/[0.04]"
      : "border-vuno-cyan/30 bg-vuno-cyan/[0.04]";

  return (
    <div className={`border p-5 md:p-6 ${toneClass}`}>
      <div className="flex items-center gap-2 mb-3 font-bold text-white text-base md:text-lg">
        <Icon className="h-5 w-5" /> {title}
      </div>
      {children}
    </div>
  );
}

function StageVisual({ stageId }: { stageId: string }) {
  if (stageId === "sectioning") {
    return (
      <VisualShell title="Two-lane preprocessing">
        <FlowRow left="Discharge text" middle="평탄화 + 맥락 보존" right="clinical_text chunk" />
        <FlowRow left="Radiology report" middle="섹션 분리 + 정규식" right="exam / findings / impression" />
      </VisualShell>
    );
  }

  if (stageId === "bedrock") {
    return (
      <VisualShell title="Structured clinical fields">
        <CodeBlock
          lines={[
            "{",
            '  "chunk_type": "radiology",',
            '  "modality": "CXR",',
            '  "clinical_status": "stable / worsening / baseline",',
            '  "positive_findings": ["pleural effusion", "consolidation"],',
            '  "negative_findings": ["no pneumothorax"],',
            '  "metadata": {"subject_id": "...", "hadm_id": "..."}',
            "}",
          ]}
        />
      </VisualShell>
    );
  }

  if (stageId === "qc") {
    return (
      <VisualShell title="Error-control checklist">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Guard label="부정어 오류" detail="no evidence / without / normal 표현 탐지" />
          <Guard label="수치 오류" detail="수치·단위·시간 표현 보존을 프롬프트에 명시" />
          <Guard label="누락" detail="QC 보강 결과를 supplement 필드로 추가" />
          <Guard label="중복" detail="fuzzy dedup으로 유사 문자열 제거" />
        </div>
      </VisualShell>
    );
  }

  if (stageId === "temporal-join") {
    return (
      <VisualShell title="Temporal patient-level merge">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-center">
          <MiniDoc label="Radiology" title="charttime" text="퇴원 이전 영상 기록" />
          <div className="flex flex-col items-center gap-2 text-vuno-cyan">
            <Clock className="h-6 w-6" />
            <span className="text-xs md:text-sm text-center break-keep">rad time ≤ discharge time</span>
          </div>
          <MiniDoc label="Discharge" title="charttime" text="입원 전체 경과 요약" />
          <div className="flex justify-center text-vuno-cyan/60">
            <ArrowRight className="h-6 w-6" />
          </div>
          <MiniDoc label="Output" title="Integrated JSONL" text="환자 단위 근거 문서" />
        </div>
      </VisualShell>
    );
  }

  if (stageId === "embedding") {
    return (
      <VisualShell title="Embedding and DB load">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center text-sm md:text-base">
          <Box icon={FileText} label="Final text + metadata" />
          <Box icon={Brain} label="Titan v2 · 512d" />
          <Box icon={Layers} label="BATCH 100 upsert" />
          <Box icon={Database} label="ChromaDB" />
        </div>
      </VisualShell>
    );
  }

  return (
    <VisualShell title="Retrieval + response generation">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-center text-sm md:text-base">
        <Box icon={Search} label="Query → Titan v2" />
        <Box icon={Database} label="ChromaDB Top-20" />
        <Box icon={Split} label="Diversity Filter" />
        <Box icon={Layers} label="Top-3 근거" />
        <Box icon={BrainCircuit} label="Claude 응답" />
      </div>
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="border border-rose-400/30 bg-rose-500/[0.06] p-4 text-base md:text-lg break-keep leading-relaxed">
          <div className="font-bold text-rose-300 mb-1">Fallback</div>
          <div className="text-vuno-muted">최고 유사도가 <span className="text-rose-300 font-bold">0.15 미만</span>이면 "유사 사례 없음" 응답</div>
        </div>
        <div className="border border-amber-400/30 bg-amber-500/[0.06] p-4 text-base md:text-lg break-keep leading-relaxed">
          <div className="font-bold text-amber-300 mb-1">Sonnet 라우팅</div>
          <div className="text-vuno-muted">어려운 케이스는 <span className="text-amber-300 font-bold">Claude Sonnet</span>으로 위임</div>
        </div>
      </div>
    </VisualShell>
  );
}

function VisualShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-5 border border-vuno-border bg-vuno-surface p-5 md:p-6">
      <div className="mb-4 text-sm md:text-base font-bold text-vuno-cyan uppercase tracking-wider">{title}</div>
      {children}
    </div>
  );
}

function MiniDoc({ label, title, text }: { label: string; title: string; text: string }) {
  return (
    <div className="border border-vuno-border bg-vuno-bg p-4">
      <div className="mb-2 inline-flex border border-vuno-cyan/40 bg-vuno-cyan/[0.06] px-2 py-0.5 text-xs md:text-sm text-vuno-cyan">{label}</div>
      <div className="font-bold text-white text-base md:text-lg">{title}</div>
      <p className="mt-2 text-sm md:text-base leading-relaxed text-vuno-muted break-keep">{text}</p>
    </div>
  );
}

function FlowRow({ left, middle, right }: { left: string; middle: string; right: string }) {
  return (
    <div className="mb-3 grid grid-cols-1 md:grid-cols-5 gap-3 items-center">
      <div className="border border-vuno-border bg-vuno-bg p-4 text-vuno-muted text-base">{left}</div>
      <div className="flex justify-center text-vuno-cyan/60">
        <ArrowRight className="h-5 w-5" />
      </div>
      <div className="border border-vuno-cyan/40 bg-vuno-cyan/[0.06] p-4 text-vuno-cyan text-center text-base">{middle}</div>
      <div className="flex justify-center text-vuno-cyan/60">
        <ArrowRight className="h-5 w-5" />
      </div>
      <div className="border border-vuno-border bg-vuno-bg p-4 text-vuno-muted text-base">{right}</div>
    </div>
  );
}

function Guard({ label, detail }: { label: string; detail: string }) {
  return (
    <div className="border border-vuno-border bg-vuno-bg p-4">
      <div className="flex items-center gap-2 font-bold text-white text-base md:text-lg">
        <ShieldCheck className="h-5 w-5 text-vuno-cyan" /> {label}
      </div>
      <p className="mt-2 text-sm md:text-base text-vuno-muted leading-relaxed break-keep">{detail}</p>
    </div>
  );
}

function CodeBlock({ lines }: { lines: string[] }) {
  return (
    <div className="border border-vuno-border bg-vuno-bg p-4 font-mono text-sm md:text-base text-vuno-muted overflow-x-auto">
      {lines.map((line) => (
        <div key={line} className="whitespace-pre">
          {line}
        </div>
      ))}
    </div>
  );
}

function Box({ icon: Icon, label }: { icon: typeof FileText; label: string }) {
  return (
    <div className="border border-vuno-border bg-vuno-bg p-4 text-center min-h-[100px] flex flex-col items-center justify-center gap-2">
      <Icon className="h-6 w-6 text-vuno-cyan" />
      <div className="text-vuno-muted font-medium text-sm md:text-base break-keep">{label}</div>
    </div>
  );
}

/* ───────────────────────────────────────────────────────
   Bottom CTA
   ─────────────────────────────────────────────────────── */
function BottomCTA() {
  return (
    <section className="py-16 md:py-20 border-t border-vuno-divider">
      <div className="max-w-[1100px] mx-auto px-6 text-center">
        <h2 className="text-3xl md:text-5xl font-bold text-white leading-tight">
          전체 RAG 페이지로 돌아가기
        </h2>
        <p className="mt-6 text-lg md:text-xl text-vuno-muted break-keep">
          이 페이지는 RAG 페이지의 6-Step Pipeline을 인터랙티브하게 풀어쓴 deep-dive입니다.
        </p>
        <div className="mt-9 flex items-center justify-center gap-3 flex-wrap">
          <Link
            to="/technology/rag"
            className="inline-flex items-center gap-2 h-14 px-9 border border-vuno-cyan text-vuno-cyan hover:bg-vuno-cyan hover:text-vuno-bg font-bold tracking-wider uppercase text-base md:text-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" /> RAG / ChromaDB
          </Link>
          <Link
            to="/technology"
            className="inline-flex items-center gap-2 h-14 px-9 border border-vuno-border text-white hover:bg-vuno-surface font-bold tracking-wider uppercase text-base md:text-lg"
          >
            Technology
          </Link>
        </div>
      </div>
    </section>
  );
}
