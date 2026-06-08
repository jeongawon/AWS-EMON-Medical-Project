import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft, ArrowUpRight, ArrowRight, Database, Sparkles, AlertTriangle, ShieldCheck,
  Filter, Layers, Workflow, Boxes, BrainCircuit, X, Check, CheckCircle2,
  Scissors, FileSearch, GitMerge, FileCheck2, Stethoscope,
} from "lucide-react";
import { BrandShell } from "../../components/brand/BrandShell";
import { Reveal } from "../../components/brand/anim/Reveal";
import { CountUp } from "../../components/brand/anim/CountUp";

export default function TechnologyRagPage() {
  return (
    <BrandShell>
      <Hero />
      <KeyStats />
      <BeforeAfter />
      <Pipeline />
      <DiversityFilter />
      <FlowDiagram />
      <SpecTable />
      <BottomCTA />
    </BrandShell>
  );
}

/* ───────────────────────────────────────────────────────
   01 · Hero
   ─────────────────────────────────────────────────────── */
function Hero() {
  return (
    <section className="border-b border-vuno-divider bg-vuno-surface/30">
      <div className="max-w-[1400px] mx-auto px-6 py-20 md:py-28">
        <Link to="/technology" className="inline-flex items-center gap-1.5 text-base md:text-lg text-vuno-muted hover:text-white mb-7">
          <ArrowLeft className="h-5 w-5" /> Technology
        </Link>

        <Reveal>
          <div className="text-sm md:text-base text-vuno-muted mb-4">
            <Link to="/" className="hover:text-white">Home</Link>
            <span className="mx-2">/</span>
            <Link to="/technology" className="hover:text-white">Technology</Link>
            <span className="mx-2">/</span>
            <span className="text-vuno-cyan">RAG / ChromaDB</span>
          </div>

          <div className="inline-flex items-center gap-2 px-5 py-2.5 border border-vuno-cyan/40 text-vuno-cyan text-lg md:text-xl font-bold uppercase tracking-[0.2em] mb-7">
            <Database className="h-5 w-5 md:h-6 md:w-6" />
            Deep Dive · RAG Pipeline
          </div>

          <h1 className="text-6xl md:text-8xl font-bold leading-tight text-white">
            단순 임베딩은<br />
            <span className="text-vuno-cyan">의료에서 위험합니다.</span>
          </h1>

          <p className="mt-10 text-2xl md:text-3xl text-vuno-muted leading-relaxed max-w-6xl break-keep">
            원문을 그대로 벡터화하면 양성/음성 소견이 한 벡터에 섞이고, 시간 순서가 무너지며,
            "정상"이 "존재"처럼 검색됩니다. EMON은 6단계 정제 파이프라인으로 임상적 의미와
            시간적 맥락을 보존한 검색 지식베이스를 구축했습니다.
          </p>

          <div className="mt-10 flex flex-wrap gap-3">
            {["MIMIC-IV Note", "Bedrock Claude Haiku", "Titan Embed v2 · 512d", "ChromaDB PersistentClient"].map((t) => (
              <span key={t} className="px-5 py-2.5 border border-vuno-border text-lg md:text-xl text-vuno-cyan font-medium font-numeric">
                {t}
              </span>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ───────────────────────────────────────────────────────
   02 · Key Stats — CountUp 동적
   ─────────────────────────────────────────────────────── */
function KeyStats() {
  const stats: Array<{
    end: number; suffix?: string; comma?: boolean; label: string; sub: string;
  }> = [
    { end: 49743, comma: true, label: "총 청크",          sub: "discharge + radiology" },
    { end: 9998,  comma: true, label: "퇴원요약 청크",     sub: "입원 단위 임상 맥락" },
    { end: 39745, comma: true, label: "영상의학 청크",     sub: "검사별 세부 소견" },
    { end: 512,                label: "임베딩 차원 (d)",   sub: "Titan v2 · cosine" },
  ];
  return (
    <section className="border-b border-vuno-divider bg-vuno-bg">
      <div className="max-w-[1400px] mx-auto px-6 py-20 grid grid-cols-2 md:grid-cols-4 gap-8">
        {stats.map((s, i) => (
          <Reveal key={s.label} delay={i * 120} className="text-center">
            <div className="text-6xl md:text-8xl font-bold text-vuno-cyan font-numeric tracking-tight tabular-nums">
              <CountUp end={s.end} suffix={s.suffix} comma={s.comma} delay={i * 120} duration={1800} />
            </div>
            <div className="text-xl md:text-2xl text-white mt-4 font-semibold">{s.label}</div>
            <div className="text-base md:text-lg text-vuno-muted mt-2">{s.sub}</div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ───────────────────────────────────────────────────────
   03 · Before vs After — 동적 비교 (핵심 섹션)
   ─────────────────────────────────────────────────────── */
function BeforeAfter() {
  const before = [
    { icon: X, text: "양성 소견(rib fracture)과 음성 소견(no acute findings)이 한 벡터에 섞임" },
    { icon: X, text: '"정상" 표현이 "존재" 검색에 함께 잡혀 임상 오해석 위험' },
    { icon: X, text: "검사 시간 순서 무시 — 과거 baseline과 최근 worsening 구분 불가" },
    { icon: X, text: "환자 단위(hadm_id) 메타데이터 없음 → 환자 간 사례 혼합" },
    { icon: X, text: "원문 통째 임베딩 → 검색 품질·해석 가능성 모두 저하" },
  ];
  const after = [
    { icon: Check, text: "양성/음성 소견 분리 — positive_findings, negative_findings 별도 필드" },
    { icon: Check, text: "Negation leak 방지 — normalcy filter + fuzzy dedup으로 정상 표현 격리" },
    { icon: Check, text: "시간 상태 명시 — baseline · stable · worsening · improving · resolved" },
    { icon: Check, text: "subject_id · hadm_id · event_sequence 메타데이터로 환자 단위 추적" },
    { icon: Check, text: "Step1~6 정제 청킹 → 검색 결과의 근거성과 설명 가능성 보강" },
  ];

  return (
    <section className="py-28 border-b border-vuno-divider bg-vuno-bg">
      <div className="max-w-[1400px] mx-auto px-6">
        <Reveal className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-5 py-2.5 border border-vuno-cyan/40 text-vuno-cyan text-base md:text-lg font-bold uppercase tracking-[0.2em] mb-7">
            Before · After
          </div>
          <h2 className="text-5xl md:text-7xl font-bold text-white leading-tight">
            같은 원문, <span className="text-vuno-cyan">완전히 다른 검색 품질</span>
          </h2>
          <p className="mt-8 text-2xl md:text-3xl text-vuno-muted max-w-5xl mx-auto break-keep">
            MIMIC-IV 영상의학 보고서 한 줄을 두 방식으로 인덱싱했을 때의 차이입니다.
          </p>
        </Reveal>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Before */}
          <Reveal delay={100}>
            <div className="h-full border border-rose-500/40 bg-rose-500/[0.04] p-9 md:p-11">
              <div className="flex items-center gap-4 mb-7">
                <div className="h-16 w-16 bg-rose-500/15 border border-rose-500/50 grid place-items-center text-rose-400">
                  <AlertTriangle className="h-8 w-8" />
                </div>
                <div>
                  <div className="text-base md:text-lg text-rose-400 font-bold uppercase tracking-[0.2em]">Before</div>
                  <div className="text-3xl md:text-4xl font-bold text-white">원문 그대로 임베딩</div>
                </div>
              </div>

              <div className="border border-rose-500/30 bg-vuno-bg p-6 font-mono text-base md:text-lg text-vuno-muted leading-relaxed mb-7">
                <span className="text-vuno-dim">// 원문 한 줄, 한 벡터</span>
                <br />
                "Chest pain. <span className="text-rose-300 underline decoration-rose-500/60">No acute pulmonary findings.</span> {" "}
                <span className="text-rose-300 underline decoration-rose-500/60">Old left rib fracture, stable</span>{" "}
                compared to prior."
              </div>

              <ul className="space-y-4">
                {before.map((b) => (
                  <li key={b.text} className="flex items-start gap-3.5 text-lg md:text-xl text-white/90 leading-relaxed">
                    <span className="mt-1 h-7 w-7 rounded-full bg-rose-500/15 border border-rose-500/50 grid place-items-center flex-shrink-0">
                      <b.icon className="h-4 w-4 text-rose-400" />
                    </span>
                    <span className="break-keep">{b.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          {/* After */}
          <Reveal delay={250}>
            <div className="h-full border border-vuno-cyan/60 bg-vuno-cyan/[0.04] p-9 md:p-11 shadow-[0_0_0_1px_rgba(67,224,212,0.2)]">
              <div className="flex items-center gap-4 mb-7">
                <div className="h-16 w-16 bg-vuno-cyan/15 border border-vuno-cyan/60 grid place-items-center text-vuno-cyan">
                  <ShieldCheck className="h-8 w-8" />
                </div>
                <div>
                  <div className="text-base md:text-lg text-vuno-cyan font-bold uppercase tracking-[0.2em]">After</div>
                  <div className="text-3xl md:text-4xl font-bold text-white">6단계 정제 파이프라인</div>
                </div>
              </div>

              <div className="border border-vuno-cyan/30 bg-vuno-bg p-6 font-mono text-base md:text-lg text-vuno-muted leading-relaxed mb-7 overflow-x-auto">
                <span className="text-vuno-dim">// 청크 한 건 = 구조화된 JSON</span>
                <br />
                {`{`}<br />
                {"  "}<span className="text-vuno-cyan">"chunk_type"</span>: "radiology",<br />
                {"  "}<span className="text-vuno-cyan">"modality"</span>: "CXR",<br />
                {"  "}<span className="text-vuno-cyan">"clinical_status"</span>: "stable",<br />
                {"  "}<span className="text-emerald-400">"positive_findings"</span>: [<br />
                {"    "}"old left rib fracture"<br />
                {"  "}],<br />
                {"  "}<span className="text-amber-300">"negative_findings"</span>: [<br />
                {"    "}"no acute pulmonary findings"<br />
                {"  "}],<br />
                {"  "}<span className="text-vuno-cyan">"hadm_id"</span>: "20415283",<br />
                {"  "}<span className="text-vuno-cyan">"event_sequence"</span>: 3<br />
                {`}`}
              </div>

              <ul className="space-y-4">
                {after.map((a) => (
                  <li key={a.text} className="flex items-start gap-3.5 text-lg md:text-xl text-white/90 leading-relaxed">
                    <span className="mt-1 h-7 w-7 rounded-full bg-vuno-cyan/15 border border-vuno-cyan/60 grid place-items-center flex-shrink-0">
                      <a.icon className="h-4 w-4 text-vuno-cyan" />
                    </span>
                    <span className="break-keep">{a.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────────────────────────────────────
   04 · 6단계 Pipeline — 순차 reveal
   ─────────────────────────────────────────────────────── */
function Pipeline() {
  const steps = [
    {
      num: "STEP 1",
      icon: Scissors,
      title: "Sectioning",
      sub: "step1_sectioning.py",
      desc: "Radiology 원문을 EXAM_TECH · FINDINGS · IMPRESSION 섹션으로 분리. longest-match-first 정규식으로 임상 의미가 다른 부분 구분.",
      kpis: ["타겟 hadm_id 필터", "딕셔너리 기반 정규식", "raw_findings/impression/exam_tech 라우팅"],
    },
    {
      num: "STEP 2",
      icon: BrainCircuit,
      title: "Bedrock 의미 추출",
      sub: "step2_bedrock_processor.py",
      desc: "Claude Haiku로 환자별 시간순 처리. modality · clinical_status · positive/negative findings를 JSON으로 추출하고 시간 상태(baseline/stable/worsening/improving/resolved) 부여.",
      kpis: ["시간순 처리 + Prior Context", "positive vs negative 분리", "체크포인트 + 재시도 로직"],
    },
    {
      num: "STEP 3",
      icon: FileSearch,
      title: "QC + 보강",
      sub: "step3_chunking.py",
      desc: "qc_supplement 병합 + negation correction(positive → negative) + normalcy filter(정상 표현 제거) + fuzzy dedup(중복 제거) 적용. embedding_text · metadata 생성.",
      kpis: ["Negation leak 방지", "Fuzzy dedup", "Exam·Status·Findings 구조 통일"],
    },
    {
      num: "STEP 4",
      icon: GitMerge,
      title: "Temporal Join",
      sub: "step4_merger.py",
      desc: "Discharge summary + radiology를 subject_id 기준으로 병합. radiology_charttime ≤ discharge_charttime 조건을 강제해 미래 정보 누수 차단.",
      kpis: ["환자 단위 입원 통합", "시간 조건 join", "radiology_history 필드 부착"],
    },
    {
      num: "STEP 5",
      icon: Layers,
      title: "Titan v2 임베딩 + ChromaDB",
      sub: "step5_local_embedding_ingestion.py",
      desc: "ml_features 재귀 평탄화 후 Titan Embed v2로 512차원 임베딩 생성. BATCH 100 단위 upsert, 8,000자 truncation, hadm_id 체크포인트.",
      kpis: ["Titan Embed Text v2 · 512d", "ChromaDB PersistentClient", "BaseVectorDB 추상 인터페이스"],
    },
    {
      num: "STEP 6",
      icon: Workflow,
      title: "RAG Orchestration",
      sub: "step6_rag_orchestrator.py",
      desc: "사용자 입력 → Titan 임베딩 → ChromaDB Top-20 검색 → discharge + radiology 균형 다양성 필터링 → Top-3 → Claude 응답. MIN_SIMILARITY 미달 시 fallback.",
      kpis: ["임베딩 캐시", "다양성 필터링 Top-20→3", "Fallback 응답"],
    },
  ];

  return (
    <section className="py-28 border-b border-vuno-divider bg-vuno-surface/30">
      <div className="max-w-[1400px] mx-auto px-6">
        <Reveal className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-5 py-2.5 border border-vuno-cyan/40 text-vuno-cyan text-base md:text-lg font-bold uppercase tracking-[0.2em] mb-7">
            6-Step Pipeline
          </div>
          <h2 className="text-5xl md:text-7xl font-bold text-white leading-tight">
            원문에서 <span className="text-vuno-cyan">근거 기반 응답</span>까지
          </h2>
          <p className="mt-8 text-2xl md:text-3xl text-vuno-muted max-w-5xl mx-auto break-keep">
            의료 RAG에서 가장 위험한 네 가지 오류 — <span className="text-vuno-cyan font-bold">환각 · 부정어 오류 · 누락 · 수치 오류</span> — 를
            단계별로 차단하는 6개의 모듈로 구성했습니다.
          </p>
        </Reveal>

        {/* 인터랙티브 파이프라인으로 이동 — CTA */}
        <Reveal>
          <Link
            to="/technology/rag/pipeline"
            className="group block max-w-6xl mx-auto mb-8 border border-vuno-cyan/40 bg-vuno-cyan/[0.04] hover:bg-vuno-cyan/[0.08] hover:border-vuno-cyan transition-colors p-6 md:p-7"
          >
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <div className="text-base md:text-lg font-bold text-vuno-cyan uppercase tracking-[0.2em] mb-1.5">
                  Interactive Deep Dive
                </div>
                <div className="text-xl md:text-2xl font-bold text-white">
                  6단계를 클릭하며 자세히 보기 →
                </div>
                <div className="text-base md:text-lg text-vuno-muted mt-1.5">
                  Dual Preprocessing Lanes · 단계별 위험·코드 포커스·시각자료 모두 제공
                </div>
              </div>
              <ArrowUpRight className="h-7 w-7 text-vuno-cyan group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            </div>
          </Link>
        </Reveal>

        <div className="space-y-6 max-w-6xl mx-auto">
          {steps.map((s, i) => (
            <Reveal key={s.num} delay={i * 100}>
              <div className="relative border border-vuno-border bg-vuno-bg p-9 md:p-10 hover:border-vuno-cyan transition-colors">
                {/* 좌측 세로 강조선 */}
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-vuno-cyan" />
                <div className="flex gap-7 items-start">
                  <div className="h-18 w-18 md:h-20 md:w-20 bg-vuno-surface border border-vuno-cyan/40 grid place-items-center text-vuno-cyan flex-shrink-0" style={{height: '5rem', width: '5rem'}}>
                    <s.icon className="h-9 w-9 md:h-10 md:w-10" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-baseline gap-4 mb-3">
                      <span className="text-base md:text-lg font-bold text-vuno-cyan font-numeric tracking-[0.25em] uppercase">{s.num}</span>
                      <h3 className="text-3xl md:text-4xl font-bold text-white">{s.title}</h3>
                      <span className="text-base md:text-lg text-vuno-dim font-numeric">{s.sub}</span>
                    </div>
                    <p className="text-lg md:text-xl text-vuno-muted leading-relaxed mb-5 break-keep">{s.desc}</p>
                    <div className="flex flex-wrap gap-2.5">
                      {s.kpis.map((k) => (
                        <span key={k} className="px-4 py-2 border border-vuno-border text-base md:text-lg text-vuno-cyan font-numeric break-keep">
                          {k}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────────────────────────────────────
   05 · Diversity Filter — Top-20 → 균형 → Top-3
   ─────────────────────────────────────────────────────── */
function DiversityFilter() {
  // 가짜 후보 — discharge(D) vs radiology(R) 표시
  const top20 = Array.from({ length: 20 }, (_, i) => {
    const type: "D" | "R" = i % 3 === 0 ? "D" : "R";
    return { type, sim: (0.92 - i * 0.012).toFixed(2) };
  });
  const top3 = [
    { type: "R" as const, sim: "0.92", note: "유사 영상 소견 #1" },
    { type: "R" as const, sim: "0.89", note: "유사 영상 소견 #2" },
    { type: "D" as const, sim: "0.84", note: "유사 입원 요약 #1" },
  ];

  return (
    <section className="py-28 border-b border-vuno-divider bg-vuno-bg">
      <div className="max-w-[1400px] mx-auto px-6">
        <Reveal className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-5 py-2.5 border border-vuno-cyan/40 text-vuno-cyan text-base md:text-lg font-bold uppercase tracking-[0.2em] mb-7">
            Retrieval Diversity
          </div>
          <h2 className="text-5xl md:text-7xl font-bold text-white leading-tight">
            Top-20에서 <span className="text-vuno-cyan">균형 잡힌 Top-3</span>로
          </h2>
          <p className="mt-8 text-2xl md:text-3xl text-vuno-muted max-w-5xl mx-auto break-keep">
            단순 유사도 상위만 쓰면 한 문서 유형으로 편향됩니다. EMON은 퇴원요약과 영상의학을
            모두 최소 1건씩 포함해 임상 맥락과 영상 근거를 균형 있게 묶습니다.
          </p>
          <p className="mt-5 text-base md:text-lg text-vuno-dim max-w-5xl mx-auto break-keep">
            <span className="text-vuno-cyan font-bold">R</span> = radiology(영상의학 판독문, 39,745건) ·
            <span className="text-amber-300 font-bold"> D</span> = discharge_summary(퇴원 요약지, 9,998건)
          </p>
        </Reveal>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-8 items-center">
          {/* Top-20 후보 */}
          <Reveal>
            <div className="border border-vuno-border bg-vuno-surface p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="text-base md:text-lg font-bold text-vuno-cyan uppercase tracking-wider">Top-20 후보</div>
                <span className="text-base md:text-lg text-vuno-muted font-numeric">Titan + cosine</span>
              </div>
              <div className="grid grid-cols-4 gap-2.5">
                {top20.map((c, i) => (
                  <div
                    key={i}
                    className={`aspect-square grid place-items-center border text-lg md:text-xl font-bold font-numeric ${
                      c.type === "R"
                        ? "border-vuno-cyan/40 bg-vuno-cyan/[0.06] text-vuno-cyan"
                        : "border-amber-400/40 bg-amber-400/[0.06] text-amber-300"
                    }`}
                  >
                    {c.type}
                  </div>
                ))}
              </div>
              <div className="mt-6 flex gap-6 text-base md:text-lg">
                <span className="flex items-center gap-2 text-vuno-cyan">
                  <span className="h-3.5 w-3.5 border border-vuno-cyan bg-vuno-cyan/20" /> R · radiology
                </span>
                <span className="flex items-center gap-2 text-amber-300">
                  <span className="h-3.5 w-3.5 border border-amber-400 bg-amber-400/20" /> D · discharge
                </span>
              </div>
            </div>
          </Reveal>

          {/* 화살표 + 필터 */}
          <div className="flex flex-col items-center text-center">
            <div className="h-20 w-20 bg-vuno-cyan/10 border border-vuno-cyan grid place-items-center text-vuno-cyan mb-4">
              <Filter className="h-10 w-10" />
            </div>
            <div className="text-lg md:text-xl font-bold text-white">Diversity Filter</div>
            <div className="text-base md:text-lg text-vuno-muted mt-2 break-keep">D · R 각 최소 1건</div>
          </div>

          {/* Top-3 */}
          <Reveal delay={200}>
            <div className="border border-vuno-cyan/60 bg-vuno-cyan/[0.04] p-8 shadow-[0_0_0_1px_rgba(67,224,212,0.2)]">
              <div className="flex items-center justify-between mb-6">
                <div className="text-base md:text-lg font-bold text-vuno-cyan uppercase tracking-wider">Top-3 최종</div>
                <span className="text-base md:text-lg text-vuno-muted">→ Claude 프롬프트</span>
              </div>
              <div className="space-y-3.5">
                {top3.map((t, i) => (
                  <div key={i} className="flex items-center gap-4 border border-vuno-border bg-vuno-bg px-5 py-4">
                    <div className={`h-12 w-12 grid place-items-center border text-lg font-bold font-numeric ${
                      t.type === "R" ? "border-vuno-cyan text-vuno-cyan" : "border-amber-400 text-amber-300"
                    }`}>
                      {t.type}
                    </div>
                    <div className="flex-1">
                      <div className="text-lg md:text-xl text-white">{t.note}</div>
                      <div className="text-base md:text-lg text-vuno-muted font-numeric">cos = {t.sim}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 space-y-3.5">
                <div className="px-5 py-4 border border-rose-500/30 bg-rose-500/[0.05] text-base md:text-lg text-rose-300 break-keep leading-relaxed">
                  <span className="font-bold">Fallback</span> — 최고 유사도가 임계값 <span className="font-numeric font-bold">0.15</span> 미만이면
                  "유사 사례 없음" 응답을 반환해 낮은 근거 품질로 인한 과추론을 차단합니다.
                </div>
                <div className="px-5 py-4 border border-amber-400/40 bg-amber-400/[0.05] text-base md:text-lg text-amber-300 break-keep leading-relaxed">
                  <span className="font-bold">Sonnet 라우팅</span> — 0.15 이상이지만 유사도가 낮은 어려운 케이스는
                  <span className="font-bold"> Claude Sonnet 모델</span>로 라우팅해 더 정교한 판단을 위임합니다.
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────────────────────────────────────
   06 · Flow Diagram — 환자 쿼리 → RAG 통합 → 의사 소견서
   VUNO 영상 스타일 3-블록 흐름 (단순·직관)
   ─────────────────────────────────────────────────────── */
function FlowDiagram() {
  return (
    <section className="py-28 border-b border-vuno-divider bg-vuno-bg">
      <div className="max-w-[1400px] mx-auto px-6">
        {/* Header — Live Flow 배지 제거, 본문만 */}
        <Reveal className="text-center mb-14">
          <h2 className="text-5xl md:text-7xl font-bold text-white leading-tight">
            환자 쿼리 → <span className="text-vuno-cyan">RAG 통합</span> → 의사 소견서
          </h2>
          <p className="mt-8 text-xl md:text-2xl text-vuno-muted max-w-5xl mx-auto break-keep">
            ChromaDB Top-K 검색과 Bedrock Claude 응답이 어떻게 결합되는지 한눈에.
          </p>
        </Reveal>

        {/* 흐름도 — Step 1은 상단 가로 풀폭, Step 2·3은 아래 좌우 */}
        <div className="max-w-6xl mx-auto">

          {/* ── STEP 1: 환자 쿼리 (상단 풀폭 가로) ── */}
          <Reveal>
            <div className="rounded-3xl border-2 border-vuno-cyan/50 bg-vuno-surface p-8 md:p-10 mb-3 shadow-[0_0_30px_-10px_rgba(45,212,191,0.3)]">
              {/* 헤더 + 라이브 인디케이터 */}
              <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                <div className="text-base md:text-lg font-bold text-vuno-cyan uppercase tracking-[0.2em]">
                  Step 1 · 환자 쿼리 (의사 입력)
                </div>
                <div className="flex items-center gap-2 text-sm md:text-base text-vuno-muted">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                  </span>
                  Triage Workstation · 입력 중
                </div>
              </div>

              {/* 한 문장 인용 — JS 타이핑 (한 글자씩 누적, 줄바꿈 허용) */}
              <div className="relative px-2 md:px-6 py-4">
                <div className="absolute top-0 left-0 text-6xl md:text-7xl text-vuno-cyan/40 font-serif leading-none select-none">"</div>
                <div className="relative px-6 md:px-10">
                  <TypingQuery />
                </div>
                <div className="absolute bottom-0 right-0 text-6xl md:text-7xl text-vuno-cyan/40 font-serif leading-none select-none">"</div>
              </div>

              {/* 입력 메타 */}
              <div className="mt-6 pt-5 border-t border-vuno-border flex flex-wrap items-center gap-x-8 gap-y-2 text-sm md:text-base text-vuno-muted">
                <div className="flex items-center gap-2">
                  <Stethoscope className="h-4 w-4 text-emerald-400" />
                  ECG · CXR · LAB · 주증상 통합
                </div>
                <div className="flex items-center gap-2">
                  <ArrowRight className="h-4 w-4 text-vuno-cyan" />
                  POST /reports/&lt;encounter_id&gt;/generate
                </div>
              </div>
            </div>
          </Reveal>

          {/* 세로 화살표 — Titan Embed v2 */}
          <Reveal delay={300}>
            <div className="flex flex-col items-center my-6">
              <div className="text-base md:text-lg text-vuno-cyan font-bold tracking-wider mb-2">
                ↓ Titan Embed v2 (512차원)
              </div>
              <div className="h-12 w-0.5 bg-gradient-to-b from-vuno-cyan via-vuno-cyan to-transparent relative">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-2.5 w-2.5 rounded-full bg-vuno-cyan shadow-[0_0_10px_rgba(45,212,191,1)] animate-pulse" />
              </div>
            </div>
          </Reveal>

          {/* ── STEP 2 + STEP 3 (가로 2개) ── */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] items-stretch gap-6">

            {/* ── STEP 2 · RAG 통합 ── */}
            <Reveal>
              <div className="h-full rounded-3xl border-2 border-vuno-cyan bg-vuno-cyan/[0.06] p-8 md:p-9 shadow-[0_0_40px_-10px_rgba(45,212,191,0.4)] flex flex-col">
                <div className="text-sm md:text-base font-bold text-vuno-cyan uppercase tracking-[0.2em] mb-5 text-center">
                  Step 2 · RAG 통합 (3초 내)
                </div>
                <div className="flex-1 flex flex-col justify-center gap-4">
                  <div className="rounded-2xl border border-vuno-cyan/50 bg-vuno-bg px-5 py-4 flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-vuno-cyan/15 border border-vuno-cyan/60 grid place-items-center text-vuno-cyan flex-shrink-0">
                      <Database className="h-6 w-6" strokeWidth={1.5} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-lg md:text-xl font-bold text-white">ChromaDB</div>
                      <div className="text-sm md:text-base text-vuno-cyan">49,743건 → Top-3 검색</div>
                    </div>
                  </div>
                  <div className="flex justify-center">
                    <div className="h-6 w-0.5 bg-vuno-cyan/60 relative">
                      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[5px] border-r-[5px] border-t-[6px] border-l-transparent border-r-transparent border-t-vuno-cyan" />
                    </div>
                  </div>
                  <div className="rounded-2xl border-2 border-vuno-cyan bg-vuno-cyan/[0.12] px-5 py-4 flex items-center gap-4 shadow-[0_0_20px_-5px_rgba(45,212,191,0.5)]">
                    <div className="h-12 w-12 rounded-full bg-vuno-cyan/25 border-2 border-vuno-cyan grid place-items-center text-vuno-cyan flex-shrink-0">
                      <Sparkles className="h-6 w-6" strokeWidth={1.5} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-lg md:text-xl font-bold text-vuno-cyan">Bedrock Claude</div>
                      <div className="text-sm md:text-base text-white">Top-3 + 환자 컨텍스트 종합</div>
                    </div>
                  </div>
                </div>
                <div className="mt-7 pt-5 border-t border-vuno-cyan/30 text-center text-base md:text-lg text-vuno-cyan font-semibold">
                  ChromaDB · Bedrock 통합 엔진
                </div>
              </div>
            </Reveal>

            <FlowConnector label="7섹션 소견서" />

            {/* ── STEP 3 · 의사 소견서 ── */}
            <Reveal delay={300}>
              <div className="h-full rounded-3xl border-2 border-emerald-400/50 bg-emerald-400/[0.04] p-8 md:p-9 flex flex-col">
                <div className="text-sm md:text-base font-bold text-emerald-300 uppercase tracking-[0.2em] mb-5 text-center">
                  Step 3 · 통합 소견서
                </div>
                <div className="flex-1 flex flex-col items-center justify-center gap-5 text-center">
                  <div className="h-16 w-16 rounded-full bg-emerald-400 grid place-items-center shadow-[0_0_24px_rgba(52,211,153,0.6)]">
                    <CheckCircle2 className="h-10 w-10 text-vuno-bg" strokeWidth={2.5} />
                  </div>
                  <div>
                    <div className="text-2xl md:text-3xl font-bold text-white">한국어 통합 소견서</div>
                    <div className="text-base md:text-lg text-emerald-300 mt-1.5 break-keep">
                      7섹션 임상 표준
                    </div>
                    <div className="text-sm md:text-base text-emerald-300/70 mt-1 break-keep">
                      주증상 · 현병력 · 과거력 · 진찰 · 검사 · 진단 · 치료 계획
                    </div>
                  </div>
                  <div className="flex items-center gap-4 pt-2">
                    <div className="h-14 w-12 rounded bg-white grid place-items-center shadow">
                      <FileCheck2 className="h-7 w-7 text-vuno-bg" strokeWidth={1.5} />
                    </div>
                    <ArrowRight className="h-6 w-6 text-emerald-400" />
                    <div className="h-14 w-14 rounded-full bg-vuno-surface border-2 border-emerald-400/60 grid place-items-center">
                      <Stethoscope className="h-7 w-7 text-emerald-300" strokeWidth={1.5} />
                    </div>
                  </div>
                </div>
                <div className="mt-7 pt-5 border-t border-emerald-400/30 text-center text-base md:text-lg text-emerald-300 font-semibold">
                  응급실 의사 진료 보조
                </div>
              </div>
            </Reveal>
          </div>
        </div>

        {/* 타이핑 키프레임 */}
        <style>{`
          @keyframes rag-typing {
            0%   { width: 0; }
            85%  { width: 100%; }
            100% { width: 100%; }
          }
        `}</style>

        {/* 하단 캡션 */}
        <Reveal>
          <div className="mt-12 px-7 py-5 border border-vuno-cyan/30 bg-vuno-cyan/[0.04] text-center text-base md:text-lg text-vuno-cyan break-keep max-w-5xl mx-auto leading-relaxed">
            ▸ 환자 데이터(ECG·CXR·LAB) → 49,743건 ChromaDB Top-3 검색 → Bedrock Claude 종합 → 한국어 7섹션 임상 소견서 자동 생성
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* 환자 쿼리 타이핑 컴포넌트 — JS 한 글자씩 누적, cyan 키워드 강조 유지, 끝나면 3초 정지 후 처음부터 반복 */
function TypingQuery() {
  // 토큰별 분해 (cyan 강조 여부 포함) — 누적 길이 기반으로 부분 표시
  const tokens: { text: string; cyan: boolean }[] = [
    { text: "61세 남성, ",          cyan: false },
    { text: "흉통 30분 전 발생",     cyan: true  },
    { text: ", HR 114, BP 158/95, ", cyan: false },
    { text: "BUN 172",              cyan: true  },
    { text: ", K⁺ 6.6, ",            cyan: false },
    { text: "Troponin 5.4 ng/mL",   cyan: true  },
    { text: " — ECG: ",             cyan: false },
    { text: "A-fib + ST 변화",       cyan: true  },
  ];
  const fullLen = tokens.reduce((s, t) => s + t.text.length, 0);
  const pauseFrames = 45; // 끝나고 약 3초(45×70ms) 정지 후 재시작

  const [chars, setChars] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setChars((c) => (c >= fullLen + pauseFrames ? 0 : c + 1));
    }, 70);
    return () => window.clearInterval(id);
  }, [fullLen]);

  // 누적 처리 — 각 토큰의 보일 글자 수 계산
  let consumed = 0;
  const visibleParts = tokens.map((tok) => {
    const remaining = Math.max(0, chars - consumed);
    const visible = Math.min(tok.text.length, remaining);
    consumed += tok.text.length;
    return { text: tok.text.slice(0, visible), cyan: tok.cyan };
  });

  const done = chars >= fullLen;

  return (
    <p className="text-lg md:text-2xl text-white leading-relaxed break-keep min-h-[5rem]">
      {visibleParts.map((p, i) =>
        p.text ? (
          <span key={i} className={p.cyan ? "text-vuno-cyan font-bold" : ""}>
            {p.text}
          </span>
        ) : null,
      )}
      <span
        className={`inline-block w-[3px] h-[1.1em] bg-vuno-cyan align-middle ml-0.5 translate-y-[0.1em] ${
          done ? "opacity-50" : "animate-pulse"
        }`}
        aria-hidden
      />
    </p>
  );
}

/* 단계 사이 가로 화살표 (cyan 펄스 dot + 라벨) */
function FlowConnector({ label }: { label: string }) {
  return (
    <div className="hidden lg:flex flex-col items-center justify-center gap-3 px-2">
      <div className="relative w-16 h-0.5 bg-gradient-to-r from-transparent via-vuno-cyan to-transparent">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-2.5 w-2.5 rounded-full bg-vuno-cyan shadow-[0_0_10px_rgba(45,212,191,1)] animate-pulse" />
      </div>
      <div className="text-sm md:text-base text-vuno-cyan font-bold tracking-wider whitespace-nowrap">
        {label} →
      </div>
    </div>
  );
}

/* ───────────────────────────────────────────────────────
   07 · Spec Table
   ─────────────────────────────────────────────────────── */
function SpecTable() {
  const specs = [
    { label: "벡터 DB",       value: "local_rag_db · ChromaDB PersistentClient (로컬 재현 가능)" },
    { label: "컬렉션명",       value: "medical_rag_collection (단일 컬렉션)" },
    { label: "총 문서 수",     value: "49,743건 — discharge_summary 9,998 + radiology 39,745" },
    { label: "hadm_id 커버리지", value: "9,999 / 10,000 (99.99% — 타겟 입원 단위 대부분 포함)" },
    { label: "임베딩 모델",     value: "Amazon Titan Embed Text v2 (AWS Bedrock)" },
    { label: "임베딩 차원",     value: "512차원 — 검색 품질과 저장 효율 균형" },
    { label: "유사도 메트릭",   value: "cosine — 의미 기반 텍스트 검색에 적합" },
    { label: "DB 용량",         value: "약 372 MB (컨테이너 시작 시 S3에서 다운로드)" },
    { label: "보조 모델",       value: "Claude Haiku (Step 2 의미 추출) · Claude Sonnet (Step 6 응답 생성)" },
    { label: "QC 판정",         value: "PASS — 무결성·검색 품질·환자 단위 커버리지 모두 통과" },
  ];

  return (
    <section className="py-28 border-b border-vuno-divider">
      <div className="max-w-[1400px] mx-auto px-6">
        <Reveal className="mb-14">
          <div className="inline-flex items-center gap-2 px-5 py-2.5 border border-vuno-cyan/40 text-vuno-cyan text-base md:text-lg font-bold uppercase tracking-[0.2em] mb-7">
            Specifications
          </div>
          <h2 className="text-5xl md:text-7xl font-bold text-white">RAG 구축 결과</h2>
        </Reveal>

        <div className="border border-vuno-border">
          {specs.map((s) => (
            <Reveal key={s.label}>
              <div className="grid grid-cols-1 md:grid-cols-[360px_1fr] gap-7 px-8 py-7 border-b border-vuno-border last:border-0 hover:bg-vuno-surface/40 transition-colors">
                <div className="text-lg md:text-xl font-bold text-vuno-cyan uppercase tracking-wider">{s.label}</div>
                <div className="text-xl md:text-2xl text-white break-keep">{s.value}</div>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal>
          <a
            href="/MIMIC-IV_Note_RAG_데이터_구축_보고서.pdf"
            target="_blank"
            rel="noreferrer"
            className="mt-10 inline-flex items-center gap-2 h-16 px-9 border border-vuno-border text-white hover:border-vuno-cyan hover:text-vuno-cyan transition-colors font-bold tracking-wider uppercase text-lg md:text-xl"
          >
            전체 보고서 PDF 보기 <ArrowUpRight className="h-6 w-6" />
          </a>
        </Reveal>
      </div>
    </section>
  );
}

/* ───────────────────────────────────────────────────────
   08 · Bottom CTA
   ─────────────────────────────────────────────────────── */
function BottomCTA() {
  return (
    <section className="py-24">
      <div className="max-w-[1200px] mx-auto px-6 text-center">
        <h2 className="text-5xl md:text-6xl font-bold text-white leading-tight">
          ECG · CXR · LAB 결과에 <br />
          <span className="text-vuno-cyan">과거 유사 사례 근거를 더하세요</span>
        </h2>
        <p className="mt-8 text-xl md:text-2xl text-vuno-muted break-keep">
          멀티모달 분석 결과를 그대로 RAG 쿼리로 변환 → 49,743건에서 유사 사례 검색 → Claude 근거 기반 통합 소견.
        </p>
        <div className="mt-10 flex items-center justify-center gap-3 flex-wrap">
          <Link
            to="/demo/triage"
            className="inline-flex items-center gap-2 h-16 px-10 bg-vuno-cyan text-vuno-bg hover:bg-vuno-cyanGlow font-bold tracking-wider uppercase text-lg md:text-xl"
          >
            라이브 데모 보기 <ArrowUpRight className="h-6 w-6" />
          </Link>
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 h-16 px-10 border border-vuno-border text-white hover:bg-vuno-surface font-bold tracking-wider uppercase text-lg md:text-xl"
          >
            문의하기
          </Link>
        </div>
      </div>
    </section>
  );
}
