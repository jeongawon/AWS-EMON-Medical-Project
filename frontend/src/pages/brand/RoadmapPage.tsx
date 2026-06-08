import { Link } from "react-router-dom";
import {
  Map, ArrowLeft, ArrowUpRight, Sparkles,
  Activity, Stethoscope, Users, Cloud, Server, Cpu,
  ChevronRight, Newspaper, ExternalLink,
  Boxes, Plug, Workflow, Building,
} from "lucide-react";
import { BrandShell } from "../../components/brand/BrandShell";
import { Reveal } from "../../components/brand/anim/Reveal";
import { CountUp } from "../../components/brand/anim/CountUp";

export default function RoadmapPage() {
  return (
    <BrandShell>
      <Hero />
      <MarketEvidence />
      <KoreaHealthcareTAM />
      <DomainExpansion />
      <PluggableModals />
      <InfraExpansion />
      <BottomCTA />
    </BrandShell>
  );
}

/* ───────────────────────────────────────────────────────
   01.5 · Market Evidence — 언론 보도 기반 확장성 근거
   ─────────────────────────────────────────────────────── */
function MarketEvidence() {
  const items = [
    {
      src: "/확장성 근거자료.png",
      title: "한국 의료 AI 시장 — 정부 R&D 228억",
      caption: "응급실 특화 AI 임상지원시스템 · 2024~2028년 5년간 228억 투입",
      source: "보건복지부 보도자료",
      url: "https://www.mohw.go.kr/board.es?mid=a10503000000&bid=0027&list_no=1481209&act=view",
    },
    {
      src: "/확장성 근거자료2.png",
      title: "루닛 2025년 매출 831억 — 역대 최대",
      caption: "전년 대비 +53.4% · 해외 매출 비중 92% · 의료 AI 글로벌 매출 모델 검증",
      source: "루닛 공식 미디어허브",
      url: "https://www.lunit.io/ko/media-hub/%EB%A3%A8%EB%8B%9B-2025%EB%85%84-%EB%A7%A4%EC%B6%9C-831%EC%96%B5%EC%9B%90-%EC%97%AD%EB%8C%80-%EC%B5%9C%EB%8C%80-%EC%8B%A4%EC%A0%81",
    },
    {
      src: "/확장성 근거자료 3.png",
      title: "응급 AI 진단 정확도 88.6%",
      caption: "Beth Israel Deaconess · Harvard 공동연구 — 치료 의사결정 89점, 초기 AI 67% vs 전문의 50%",
      source: "YTN 사이언스",
      url: "https://m.science.ytn.co.kr/program/view_today.php?s_mcd=0082&key=202605041101598329",
    },
  ];
  const kpis = [
    { big: "108", unit: "건", label: "식약처 인증 의료 AI", sub: "2024년 누적 — 의료 AI 상용 단계 진입" },
    { big: "228", unit: "억원", label: "정부 의료 AI R&D 예산", sub: "2024년 보건복지부 — 신규 사업 8개" },
    { big: "831", unit: "억원", label: "루닛 INSIGHT CXR 매출", sub: "2024년 — 단일 모달도 시장 검증 완료" },
  ];
  return (
    <section className="py-24 md:py-28 bg-vuno-bg border-b border-vuno-divider">
      <div className="max-w-[1400px] mx-auto px-6">
        <Reveal className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-5 py-2.5 border border-vuno-cyan/40 text-vuno-cyan text-base md:text-lg font-bold uppercase tracking-[0.2em] mb-7">
            <Newspaper className="h-5 w-5 md:h-6 md:w-6" />
            Market Evidence
          </div>
          <h2 className="text-5xl md:text-7xl font-bold text-white leading-tight">
            한국 의료 AI 시장은 <span className="text-vuno-cyan">이미 상용 단계</span>
          </h2>
          <p className="mt-7 text-xl md:text-2xl text-vuno-muted max-w-5xl mx-auto break-keep">
            식약처 인증 108건 · 정부 R&D 228억 · 루닛 매출 831억 · 응급 AI 정확도 88.6% —
            <span className="text-vuno-cyan font-bold"> EMON은 검증된 시장의 통합 레이어</span>로 진입합니다.
          </p>
        </Reveal>

        {/* KPI Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-12 max-w-6xl mx-auto">
          {kpis.map((k, i) => (
            <Reveal key={k.label} delay={i * 100}>
              <div className="border border-vuno-cyan/40 bg-vuno-cyan/[0.04] p-7 md:p-8 h-full">
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl md:text-6xl font-bold text-vuno-cyan font-numeric tabular-nums">
                    <CountUp end={Number(k.big)} comma duration={1600} delay={i * 120} />
                  </span>
                  <span className="text-lg md:text-xl text-vuno-cyan/80">{k.unit}</span>
                </div>
                <div className="mt-3 text-lg md:text-xl font-bold text-white break-keep">{k.label}</div>
                <div className="mt-1 text-sm md:text-base text-vuno-muted break-keep">{k.sub}</div>
              </div>
            </Reveal>
          ))}
        </div>

        {/* Press Gallery — 자연 비율 + 원문 기사 링크 */}
        <div className="mb-4 text-sm md:text-base text-vuno-dim text-center">
          카드를 클릭하면 원문 기사로 이동합니다
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {items.map((it, i) => (
            <Reveal key={it.src} delay={i * 120}>
              <a
                href={it.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group block border border-vuno-border bg-vuno-surface hover:border-vuno-cyan/60 transition-colors h-full"
                aria-label={`${it.title} — 원문 기사로 이동 (새 창)`}
              >
                <figure className="h-full flex flex-col">
                  <div
                    className="relative bg-white border-b border-vuno-border p-3 flex items-center justify-center"
                    style={{ minHeight: 220, maxHeight: 360 }}
                  >
                    <img
                      src={it.src}
                      alt={it.title}
                      loading="lazy"
                      className="max-w-full max-h-[340px] object-contain"
                    />
                    <span className="absolute top-2 right-2 h-8 w-8 bg-vuno-bg/80 border border-vuno-border text-white opacity-0 group-hover:opacity-100 transition-opacity grid place-items-center">
                      <ExternalLink className="h-4 w-4" />
                    </span>
                  </div>
                  <figcaption className="p-6 flex-1 flex flex-col">
                    <div className="text-lg md:text-xl font-bold text-white break-keep leading-snug group-hover:text-vuno-cyan transition-colors">{it.title}</div>
                    <div className="mt-2 text-base md:text-lg text-vuno-muted break-keep flex-1">{it.caption}</div>
                    <div className="mt-3 flex items-center justify-between gap-2 text-sm md:text-base">
                      <div className="flex items-center gap-2 text-vuno-cyan/80 break-keep">
                        <Newspaper className="h-4 w-4 flex-shrink-0" />
                        <span>{it.source}</span>
                      </div>
                      <div className="flex items-center gap-1 text-vuno-cyan/80 font-bold uppercase tracking-wider text-xs md:text-sm">
                        원문 <ExternalLink className="h-3.5 w-3.5" />
                      </div>
                    </div>
                  </figcaption>
                </figure>
              </a>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────────────────────────────────────
   01 · Hero
   ─────────────────────────────────────────────────────── */
function Hero() {
  return (
    <section className="border-b border-vuno-divider bg-vuno-surface/30">
      <div className="max-w-[1400px] mx-auto px-6 py-20 md:py-28">
        <Link to="/" className="inline-flex items-center gap-1.5 text-base md:text-lg text-vuno-muted hover:text-white mb-7">
          <ArrowLeft className="h-5 w-5" /> Home
        </Link>

        <Reveal>
          <div className="inline-flex items-center gap-2 px-6 py-3 border border-vuno-cyan/40 text-vuno-cyan text-lg md:text-xl font-bold uppercase tracking-[0.2em] mb-8">
            <Map className="h-6 w-6 md:h-7 md:w-7" />
            Scale-Up Roadmap
          </div>

          <h1 className="text-6xl md:text-8xl font-bold leading-tight text-white">
            같은 AI 엔진,<br />
            <span className="text-vuno-cyan">다른 사용처</span>
          </h1>

          <p className="mt-10 text-2xl md:text-3xl text-vuno-muted leading-relaxed max-w-6xl break-keep">
            응급실 야간 당직이라는 가장 좁고 절박한 시작점에서 검증된 통합 의사결정 엔진을
            <span className="text-vuno-cyan font-bold"> ICU · 외래 · 일반병동</span>으로 단계적 확장.
            TAM이 단계마다 <span className="text-vuno-cyan font-bold">3~10배</span>씩 늘어납니다.
          </p>
        </Reveal>
      </div>
    </section>
  );
}

/* ───────────────────────────────────────────────────────
   02 · 한국 의료 체계 TAM
   ─────────────────────────────────────────────────────── */
function KoreaHealthcareTAM() {
  const tiers = [
    {
      label: "응급의료기관 (시작점)",
      number: 528,
      unit: "개소",
      phase: "Phase 1",
      meaning: "연 7.2만 건 AI 개입 가능 전원 — 가장 좁고 절박한 진입점",
      width: 25,
      accent: false,
    },
    {
      label: "상급종합병원 (제5기)",
      number: 47,
      unit: "개",
      phase: "Phase 2",
      meaning: "ICU 의무 보유 — 중환자실 진입 첫 타깃",
      width: 12,
      accent: true,
    },
    {
      label: "ICU 추정 병상 (47개 상급종합)",
      number: 3000,
      unit: "병상 (2,500~3,500)",
      phase: "Phase 2",
      meaning: "XGBoost 6시간 예후 모델 그대로 적용 가능",
      width: 45,
      accent: true,
    },
    {
      label: "종합병원 전체",
      number: 350,
      unit: "개",
      phase: "Phase 3",
      meaning: "일반병동 · 외래 도입 확산 타깃",
      width: 60,
      accent: false,
    },
    {
      label: "외래 환자 점유율 (의원)",
      number: 72.5,
      unit: "%",
      phase: "Phase 3",
      meaning: "의사 1인당 외래 7,080명 (OECD 평균 3.3배)",
      width: 100,
      accent: false,
    },
  ];
  return (
    <section className="py-28 bg-vuno-bg border-y border-vuno-divider">
      <div className="max-w-[1400px] mx-auto px-6">
        <Reveal className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-5 py-2.5 border border-vuno-cyan/40 text-vuno-cyan text-base md:text-lg font-bold uppercase tracking-[0.2em] mb-7">
            Korean Healthcare TAM
          </div>
          <h2 className="text-5xl md:text-7xl font-bold text-white leading-tight">
            우리가 <span className="text-vuno-cyan">어디까지</span> 갈 수 있는가
          </h2>
          <p className="mt-7 text-xl md:text-2xl text-vuno-muted max-w-5xl mx-auto break-keep">
            응급실에서 시작한 동일 의사결정 엔진이 ICU · 외래 · 일반병동으로 확장될 때
            시장 규모가 어떻게 증가하는지 정량 분석.
          </p>
          <p className="mt-3 text-base md:text-lg text-vuno-dim max-w-4xl mx-auto break-keep">
            ※ 응급의료기관 528 = 전수 (응급의료시설 114 포함) · <span className="text-vuno-cyan">도입 타깃 414</span> (권역+지역센터+지역기관)
          </p>
        </Reveal>

        <div className="space-y-6 max-w-6xl mx-auto">
          {tiers.map((t, i) => (
            <Reveal key={t.label} delay={i * 100}>
              <div className={`border p-8 md:p-9 ${
                t.accent
                  ? "border-vuno-cyan/50 bg-vuno-cyan/[0.04]"
                  : "border-vuno-border bg-vuno-surface"
              }`}>
                <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-6 items-center">
                  <div>
                    <div className="flex flex-wrap items-baseline gap-3 mb-3">
                      <span className="text-2xl md:text-3xl font-bold text-white break-keep">{t.label}</span>
                      <span className={`text-base md:text-lg font-bold px-3 py-1.5 border ${
                        t.accent ? "border-vuno-cyan text-vuno-cyan" : "border-vuno-border text-vuno-muted"
                      }`}>{t.phase}</span>
                    </div>
                    <p className="text-lg md:text-xl text-vuno-muted leading-relaxed break-keep">{t.meaning}</p>
                  </div>
                  <div className="lg:text-right">
                    <div className="flex items-baseline gap-2 lg:justify-end">
                      <span className={`text-5xl md:text-7xl font-bold font-numeric tabular-nums ${
                        t.accent ? "text-vuno-cyan" : "text-white"
                      }`}>
                        <CountUp end={t.number} comma duration={1600} delay={i * 100} />
                      </span>
                      <span className="text-xl md:text-2xl text-vuno-muted">{t.unit}</span>
                    </div>
                    <div className="mt-4 relative h-3 bg-vuno-bg border border-vuno-border overflow-hidden">
                      <div
                        className={`absolute inset-y-0 left-0 ${t.accent ? "bg-vuno-cyan" : "bg-vuno-muted/50"}`}
                        style={{ width: `${t.width}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal>
          <div className="mt-12 px-9 py-7 border border-vuno-cyan/40 bg-vuno-cyan/[0.06] text-center max-w-5xl mx-auto">
            <div className="text-lg md:text-xl font-bold text-vuno-cyan uppercase tracking-[0.15em] mb-4">Key Insight</div>
            <p className="text-2xl md:text-3xl text-white leading-relaxed break-keep">
              한국 의사는 OECD 평균의 <span className="text-vuno-cyan font-bold">3.3배 외래 환자</span>를 본다.<br />
              응급실은 진입점일 뿐, 본격 TAM은 <span className="text-vuno-cyan font-bold">외래·일반병동</span>에 있다.
            </p>
            <div className="mt-4 inline-flex items-center gap-2 text-sm md:text-base text-vuno-cyan/70">
              <Newspaper className="h-3.5 w-3.5" />
              <span>OECD Health Statistics 2024 · 의협신문 · 보건복지부 외래 통계</span>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ───────────────────────────────────────────────────────
   03 · Axis 1 — 고객 도메인 확장 (응급실 → ICU → 외래)
   ─────────────────────────────────────────────────────── */
function DomainExpansion() {
  const phases = [
    {
      phase: "Phase 1",
      period: "1~2년차",
      icon: Activity,
      title: "응급실 — Primary",
      target: "지역응급의료센터 137개 / 지역응급의료기관 233개",
      value: "Door-to-Decision 50→15분 · 전원 26.6% '전문응급요함' 대응",
      benchmark: [
        "응급실 AI 트리아지 정확도 88.6% (JAMA Network Open)",
        "Epic Sepsis Model — 패혈증 사망률 20.6~44% 감소",
        "COMPOSER (UCSD) — 응급실 사망률 17% 감소",
      ],
      market: "연 7.2만 건 AI 개입 가능 전원 (13.3만 건 × 54.4%)",
      tamGrowth: "기준",
      isPrimary: true,
    },
    {
      phase: "Phase 2",
      period: "3~5년차",
      icon: Stethoscope,
      title: "+ ICU 확장",
      target: "상급종합병원 47개 × ICU 평균 50~80병상 = 약 2,500~3,500 ICU 병상",
      value: "EMON LAB의 XGBoost 6시간 예후 모델 그대로 ICU 연속 모니터링에 적용",
      benchmark: [
        "뷰노 DeepCARS 110+ 병원 · 4.5만 병상 (입증된 모델)",
        "UCSD COMPOSER — ICU 사망률 17% 감소",
        "MDPI 2025 — 원내 사망률 39.5%↓ · 재원기간 32.3%↓",
      ],
      market: "Phase 1 대비 약 3~4배 TAM",
      tamGrowth: "×3~4",
      isPrimary: false,
    },
    {
      phase: "Phase 3",
      period: "5년차+",
      icon: Users,
      title: "+ 외래·일반병동 + 모달 확장",
      target: "의원 외래 점유율 72.5% — 일반 진단 보조 SaaS의 가장 큰 시장",
      value: "RAG 기반 의사결정 + ICD-10 자동 인용은 외래 진료 노트 작성에 그대로 적용",
      benchmark: [
        "추가 모달 — CT(영상) · Ultrasound · EMR(텍스트) 통합",
        "한국 의사 1인당 외래 7,080명 (OECD 3.3배) — OECD Health 2024",
        "정부 의료 AI R&D 228억 (2024) — 의료 AI 시장 정책 가속",
      ],
      market: "Phase 1 대비 10배 이상 (의원 + 종합병원 외래 통합)",
      tamGrowth: "×10+",
      isPrimary: false,
    },
  ];
  return (
    <section className="py-28 bg-vuno-surface/30">
      <div className="max-w-[1400px] mx-auto px-6">
        <Reveal className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-5 py-2.5 border border-vuno-cyan/40 text-vuno-cyan text-base md:text-lg font-bold uppercase tracking-[0.2em] mb-7">
            Axis 1 · Customer Domain
          </div>
          <h2 className="text-5xl md:text-7xl font-bold text-white leading-tight">
            <span className="text-vuno-cyan">응급실 → ICU → 외래</span><br />
            도메인 확장 3단계
          </h2>
        </Reveal>

        <div className="space-y-7 max-w-6xl mx-auto">
          {phases.map((p, i) => (
            <Reveal key={p.phase} delay={i * 150}>
              <div className={`relative border p-9 md:p-11 ${
                p.isPrimary
                  ? "border-vuno-cyan/60 bg-vuno-cyan/[0.04] shadow-[0_0_0_1px_rgba(67,224,212,0.2)]"
                  : "border-vuno-border bg-vuno-surface hover:border-vuno-cyan/50 transition-colors"
              }`}>
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-vuno-cyan" />

                {/* Header */}
                <div className="flex flex-wrap items-start gap-6 mb-7">
                  <div className="h-20 w-20 bg-vuno-cyan/10 border border-vuno-cyan/50 grid place-items-center text-vuno-cyan flex-shrink-0">
                    <p.icon className="h-10 w-10" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-baseline gap-4 mb-3">
                      <span className="text-lg md:text-xl font-bold text-vuno-cyan font-numeric tracking-[0.25em] uppercase">{p.phase}</span>
                      <span className="text-lg md:text-xl text-vuno-muted">{p.period}</span>
                    </div>
                    <h3 className="text-3xl md:text-4xl font-bold text-white break-keep">{p.title}</h3>
                  </div>
                  <div className="text-right">
                    <div className="text-4xl md:text-6xl font-bold text-vuno-cyan font-numeric tabular-nums">
                      {p.tamGrowth}
                    </div>
                    <div className="text-base md:text-lg text-vuno-cyan/80 mt-1">TAM 증가</div>
                  </div>
                </div>

                {/* Content */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-7">
                  <div className="space-y-5">
                    <div>
                      <div className="text-base md:text-lg font-bold text-vuno-cyan uppercase tracking-wider mb-3">타깃 시장</div>
                      <p className="text-lg md:text-xl text-white leading-relaxed break-keep">{p.target}</p>
                    </div>
                    <div>
                      <div className="text-base md:text-lg font-bold text-vuno-cyan uppercase tracking-wider mb-3">임상 가치</div>
                      <p className="text-lg md:text-xl text-vuno-muted leading-relaxed break-keep">{p.value}</p>
                    </div>
                  </div>
                  <div>
                    <div className="text-base md:text-lg font-bold text-vuno-cyan uppercase tracking-wider mb-4">벤치마크·근거</div>
                    <ul className="space-y-3">
                      {p.benchmark.map((b) => (
                        <li key={b} className="flex items-start gap-3 text-lg md:text-xl text-vuno-muted leading-relaxed">
                          <ChevronRight className="h-6 w-6 text-vuno-cyan flex-shrink-0 mt-0.5" />
                          <span className="break-keep">{b}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-6 px-5 py-4 border border-vuno-cyan/20 bg-vuno-bg text-lg md:text-xl text-vuno-cyan break-keep">
                  ▸ 정량 시장 — {p.market}
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
   04 · Pluggable Modals — 갈아 끼우는 모달, 빠른 의료체계 도입
   "우리는 새 모달이 아니라, 새 통합 의사결정을 만드는 회사"
   ─────────────────────────────────────────────────────── */
function PluggableModals() {
  const scenarios = [
    {
      letter: "A",
      title: "자체 모달 (현재)",
      sub: "100% in-house",
      desc: "우리가 학습·배포한 3개 모달(ECG · CXR · LAB) + RAG 근거자료 + Bedrock 통합 소견서. ONNX Runtime + XGBoost로 GPU-free, MIT 라이선스 데이터(MIMIC-IV)만 사용.",
      stack: ["ECG (Mamba S6)", "CXR (DenseNet+UNet)", "LAB (XGBoost)", "RAG · ChromaDB"],
      isCurrent: true,
    },
    {
      letter: "B",
      title: "시장 모달 채택",
      sub: "Best-in-class plug-in",
      desc: "병원이 이미 도입한 루닛 INSIGHT CXR · 뷰노 DeepCARS 등 검증된 단일 모달을 그대로 우리 시스템에 연결. 우리는 RAG 근거자료 + 중앙 오케스트레이터 + Bedrock 통합 소견서만 담당.",
      stack: ["루닛 CXR", "뷰노 ECG/생체신호", "우리 LAB", "RAG · Bedrock 통합"],
      isCurrent: false,
    },
    {
      letter: "C",
      title: "병원 맞춤 조합",
      sub: "Hospital BYO modal",
      desc: "병원이 보유 중인 식약처 인증 모달을 자유롭게 골라서 EMON 통합 엔진(RAG + Bedrock)과 결합. 기존 투자 보호 + 새 모달 추가 둘 다 가능 — 가장 빠른 의료체계 도입 경로.",
      stack: ["병원 보유 모달", "EMON RAG + Bedrock", "FHIR R4 표준", "Hot-Swap 가능"],
      isCurrent: false,
    },
  ];

  return (
    <section className="py-28 bg-vuno-bg border-y border-vuno-divider">
      <div className="max-w-[1400px] mx-auto px-6">
        {/* Header */}
        <Reveal className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-5 py-2.5 border border-vuno-cyan/40 text-vuno-cyan text-base md:text-lg font-bold uppercase tracking-[0.2em] mb-7">
            <Plug className="h-5 w-5 md:h-6 md:w-6" />
            Pluggable Modals · Modular Architecture
          </div>
          <h2 className="text-5xl md:text-7xl font-bold text-white leading-tight">
            우리는 <span className="text-vuno-cyan">새 모달</span>이 아니라,<br />
            <span className="text-vuno-cyan">새 통합 의사결정</span>을 만듭니다
          </h2>
          <p className="mt-8 text-2xl md:text-3xl text-vuno-muted max-w-5xl mx-auto break-keep">
            잘 만들어진 단일 모달은 이미 시장에 충분히 있습니다.
            컨테이너 기반 EMON 아키텍처는 어떤 모달이든 <span className="text-vuno-cyan font-bold">표준 인터페이스로 plug-and-play</span> —
            <span className="text-vuno-cyan font-bold"> 현실적인 의료체계 도입 가능성</span>을 만드는 핵심입니다.
          </p>
        </Reveal>

        {/* Why pluggable matters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20 max-w-6xl mx-auto">
          {[
            {
              icon: Building,
              title: "이미 시장에는 검증된 단일 모달이 있다",
              desc: "루닛 INSIGHT CXR (55개국·4,800병원) · 뷰노 DeepCARS (110+ 병원) · JLK 뇌졸중 AI (FDA 4종). 의사들에게 필요한 건 새 모달이 아니라 이걸 모두 종합해주는 시스템.",
            },
            {
              icon: Boxes,
              title: "EMON 6개 ECS 컨테이너 = Hot Swap",
              desc: "Orchestrator · ECG · CXR · LAB · RAG · Router 모두 독립 컨테이너. FHIR R4 + JSON 표준 인터페이스라 Docker tag만 바꾸면 모달 교체. 중앙 코드 변경 0.",
            },
            {
              icon: Workflow,
              title: "통합 의사결정 엔진 = ecosystem play",
              desc: "단일 모달 경쟁에서 빠져나와 의료 AI 생태계와 협력. 루닛·뷰노 등이 경쟁자가 아닌 파트너가 되는 zero-sum이 아닌 구조.",
            },
          ].map((c, i) => (
            <Reveal key={c.title} delay={i * 120}>
              <div className="h-full border border-vuno-border bg-vuno-surface p-8 md:p-9 hover:border-vuno-cyan transition-colors">
                <div className="h-16 w-16 bg-vuno-cyan/10 border border-vuno-cyan/50 grid place-items-center text-vuno-cyan mb-6">
                  <c.icon className="h-8 w-8" />
                </div>
                <h3 className="text-2xl md:text-3xl font-bold text-white mb-4 leading-tight break-keep">{c.title}</h3>
                <p className="text-lg md:text-xl text-vuno-muted leading-relaxed break-keep">{c.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>

        {/* Architecture Flow 다이어그램은 Technology 페이지로 이동 — 시스템 작동 원리는 그쪽이 자연스러움 */}

        {/* 3가지 도입 시나리오 */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-5 py-2.5 border border-vuno-cyan/40 text-vuno-cyan text-base md:text-lg font-bold uppercase tracking-[0.2em] mb-6">
            Deployment Scenarios
          </div>
          <h3 className="text-4xl md:text-6xl font-bold text-white leading-tight">
            병원이 선택하는 <span className="text-vuno-cyan">3가지 도입 방식</span>
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {scenarios.map((s, i) => (
            <Reveal key={s.letter} delay={i * 120}>
              <div className={`relative h-full border p-8 md:p-9 transition-all ${
                s.isCurrent
                  ? "border-vuno-cyan/60 bg-vuno-cyan/[0.04] shadow-[0_0_0_1px_rgba(67,224,212,0.2)]"
                  : "border-vuno-border bg-vuno-surface hover:border-vuno-cyan/50"
              }`}>
                <div className="flex items-start justify-between mb-6">
                  <div className="h-16 w-16 bg-vuno-cyan/10 border border-vuno-cyan/50 grid place-items-center text-vuno-cyan text-3xl font-bold font-numeric">
                    {s.letter}
                  </div>
                  {s.isCurrent && (
                    <span className="px-4 py-1.5 border border-vuno-cyan bg-vuno-cyan text-vuno-bg text-sm md:text-base font-bold tracking-wider">
                      현재 시연
                    </span>
                  )}
                </div>
                <h4 className="text-2xl md:text-3xl font-bold text-white mb-3">{s.title}</h4>
                <div className="text-lg md:text-xl text-vuno-cyan/80 mb-6">{s.sub}</div>
                <p className="text-lg md:text-xl text-vuno-muted leading-relaxed mb-6 break-keep">{s.desc}</p>
                <div className="flex flex-wrap gap-2.5">
                  {s.stack.map((t) => (
                    <span key={t} className="px-3.5 py-2 border border-vuno-border text-base md:text-lg text-vuno-cyan font-numeric break-keep">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        {/* Closing message */}
        <Reveal>
          <div className="mt-14 px-9 py-8 border border-vuno-cyan/40 bg-vuno-cyan/[0.06] text-center max-w-5xl mx-auto">
            <p className="text-2xl md:text-3xl text-white leading-relaxed break-keep">
              EMON Med®는 <span className="text-vuno-cyan font-bold">모달 정확도 경쟁</span>이 아니라
              <span className="text-vuno-cyan font-bold"> 통합 의사결정 엔진</span>으로 포지셔닝합니다.<br />
              <span className="text-lg md:text-xl text-vuno-muted">의료 AI 생태계와 협력 가능 — zero-sum이 아닌 ecosystem play.</span>
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ───────────────────────────────────────────────────────
   05 · Axis 2 — 인프라 확장 (Single → Multi-Region → 모달)
   ─────────────────────────────────────────────────────── */
function InfraExpansion() {
  const phases = [
    {
      phase: "Phase 1",
      icon: Cloud,
      title: "Single-Region",
      sub: "AWS ap-northeast-2 서울",
      points: [
        "Multi-AZ (서울 a/c 두 AZ) · Aurora Serverless v2 기본 가용성 SLA 기준",
        "ECS Fargate (GPU-free) + Aurora Serverless v2 + Bedrock + CloudFront 217 PoP",
        "월 운영비 $510 추정 · 414개 도입 타깃 + 전국 응급실 트래픽 커버 가능",
      ],
    },
    {
      phase: "Phase 2",
      icon: Server,
      title: "Multi-Region",
      sub: "+ ap-northeast-1 도쿄 페일오버 (DR)",
      points: [
        "Active-Passive 리전 페일오버 (DR 목적, 글로벌 진출 아님)",
        "Cross-Region Aurora 복제 · 재해 복구 시간 단축 (RTO 목표 분 단위)",
        "SaMD Class II 인허가 후 의료 데이터 가용성 요구 강화 대응",
        "ICU·일반병동 도입으로 24/7 연속 모니터링 트래픽 증가 대응",
      ],
    },
    {
      phase: "Phase 3",
      icon: Cpu,
      title: "모달 확장 인프라",
      sub: "CT / Ultrasound / EMR + GPU 부분 도입",
      points: [
        "CT 영상 처리 — GPU 인스턴스 부분 도입 (SageMaker Inference Endpoint)",
        "Ultrasound — 실시간 영상 스트리밍 · WebRTC 통합",
        "EMR 통합 — HAPI FHIR + 한국 보험 청구 시스템 연동",
        "한국 데이터 fine-tuning — Phase 1~2 누적 임상 데이터로 모델 재학습",
      ],
    },
  ];
  return (
    <section className="py-28 bg-vuno-bg border-y border-vuno-divider">
      <div className="max-w-[1400px] mx-auto px-6">
        <Reveal className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-6 py-3 border border-vuno-cyan/40 text-vuno-cyan text-lg md:text-xl font-bold uppercase tracking-[0.2em] mb-8">
            Axis 2 · Infrastructure
          </div>
          <h2 className="text-5xl md:text-7xl font-bold text-white leading-tight">
            Single-Region → <span className="text-vuno-cyan">Multi-Region</span> → 모달 확장
          </h2>
          <p className="mt-8 text-2xl md:text-3xl text-vuno-muted max-w-5xl mx-auto break-keep">
            의료 데이터 가용성 강화 + 모달 확장에 따른 GPU 인프라 단계적 도입
          </p>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {phases.map((p, i) => (
            <Reveal key={p.phase} delay={i * 150}>
              <div className="h-full border border-vuno-border bg-vuno-surface p-10 md:p-11 hover:border-vuno-cyan transition-colors">
                <div className="flex items-start justify-between mb-7">
                  <div className="h-20 w-20 bg-vuno-cyan/10 border border-vuno-cyan/50 grid place-items-center text-vuno-cyan">
                    <p.icon className="h-10 w-10" />
                  </div>
                  <div className="text-lg md:text-xl font-bold text-vuno-cyan font-numeric tracking-[0.25em]">
                    {p.phase}
                  </div>
                </div>
                <h3 className="text-3xl md:text-4xl font-bold text-white mb-4">{p.title}</h3>
                <div className="text-xl md:text-2xl text-vuno-cyan/80 mb-8 break-keep">{p.sub}</div>
                <ul className="space-y-5">
                  {p.points.map((pt) => (
                    <li key={pt} className="flex items-start gap-3 text-lg md:text-xl text-vuno-muted leading-relaxed">
                      <ChevronRight className="h-7 w-7 text-vuno-cyan flex-shrink-0 mt-0.5" />
                      <span className="break-keep">{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* Parallel Tracks 섹션 제거 — 발표 시간 효율을 위해. 임상검증·식약처·수가·보안 트랙은
   필요 시 별도 자료(보고서 11장)에서 다룬다. */

/* ───────────────────────────────────────────────────────
   05 · Bottom CTA
   ─────────────────────────────────────────────────────── */
function BottomCTA() {
  return (
    <section className="py-24 border-t border-vuno-divider">
      <div className="max-w-[1200px] mx-auto px-6 text-center">
        <h2 className="text-5xl md:text-6xl font-bold text-white leading-tight">
          확장 로드맵까지 봤으면<br />
          <span className="text-vuno-cyan">파일럿 협력 시작</span>
        </h2>
        <p className="mt-8 text-xl md:text-2xl text-vuno-muted break-keep">
          Phase 1 파일럿 병원 선정 중. 응급의학과·임상 자문·투자 협력 모두 환영합니다.
        </p>
        <div className="mt-10 flex items-center justify-center gap-3 flex-wrap">
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 h-16 px-10 bg-vuno-cyan text-vuno-bg hover:bg-vuno-cyanGlow font-bold tracking-wider uppercase text-lg md:text-xl"
          >
            협력 문의 <ArrowUpRight className="h-6 w-6" />
          </Link>
          <Link
            to="/technology"
            className="inline-flex items-center gap-2 h-16 px-10 border border-vuno-border text-white hover:bg-vuno-surface font-bold tracking-wider uppercase text-lg md:text-xl"
          >
            <Sparkles className="h-6 w-6" /> Technology 보기
          </Link>
        </div>
      </div>
    </section>
  );
}
