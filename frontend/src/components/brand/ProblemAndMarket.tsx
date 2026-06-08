import { Link } from "react-router-dom";
import {
  AlertTriangle, TrendingDown, UserCheck, Clock, Building2,
  ShieldCheck, Search, ArrowUpRight, ChevronDown, Newspaper, ExternalLink,
} from "lucide-react";
import { Reveal } from "./anim/Reveal";
import { CountUp } from "./anim/CountUp";

/* ───────────────────────────────────────────────────────
   문제 · 시장 — 발표용 슬라이드 한 컷 분량 섹션
   2024 응급의료 통계연보(제23호) 기준 정량 근거
   ─────────────────────────────────────────────────────── */

export function ProblemAndMarket() {
  return (
    <section id="problem-market" className="border-y border-vuno-divider bg-vuno-bg">
      <div className="max-w-[1400px] mx-auto px-6 py-24 md:py-28">
        <SectionHeader />
        <EvidenceGallery />
        <CrisisStats />
        <ProblemCards />
        <ValueProposition />
        <MarketStructure />

        {/* 섹션 마무리 CTA */}
        <Reveal>
          <div className="mt-16 text-center">
            <Link
              to="/technology"
              className="inline-flex items-center gap-2 h-14 px-9 font-bold border border-vuno-cyan text-vuno-cyan hover:bg-vuno-cyan hover:text-vuno-bg transition-colors tracking-wider uppercase text-base md:text-lg"
            >
              기술 아키텍처 자세히 보기 <ArrowUpRight className="h-5 w-5" />
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ── Header ─────────────────────────────────────────── */
function SectionHeader() {
  return (
    <Reveal className="text-center mb-14">
      <div className="inline-flex items-center gap-2 px-4 py-2 border border-rose-400/40 text-rose-300 text-sm md:text-base font-bold uppercase tracking-[0.2em] mb-6">
        <AlertTriangle className="h-4 w-4 md:h-5 md:w-5" />
        Problem · Market
      </div>
      <h2 className="text-4xl md:text-6xl font-bold leading-tight text-white">
        왜 지금 <span className="text-vuno-cyan">EMON</span>이 필요한가?
      </h2>
      <p className="mt-6 text-xl md:text-2xl text-vuno-muted max-w-4xl mx-auto break-keep">
        2024 의료대란 이후 한국 응급의료 전달체계는 구조적 위기에 놓였습니다.
        <br className="hidden md:block" />
        2024–2025 주요 언론 보도와 통계연보 제23호 근거로 문제를 정의하고, 414개 응급의료기관 시장을 겨냥합니다.
      </p>
    </Reveal>
  );
}

/* ── 위기 통계 4종 — CountUp 동적 ────────────────────── */
function CrisisStats() {
  type Stat = {
    end: number;
    suffix?: string;
    prefix?: string;
    label: string;
    sub: string;
    danger?: boolean;
  };
  // 모든 수치는 한국 언론 기사 직접 인용 — 출처는 ※ 캡션에 표기
  const stats: Stat[] = [
    { end: 34, suffix: "%", prefix: "+", danger: true,
      label: "응급실 뺑뺑이 재이송", sub: "4,227→5,657건 · 시사저널 단독 2025" },
    { end: 3,  suffix: ".6배", danger: true,
      label: "전문의 사직 급증", sub: "38→137명(2023→24) · 서울신문" },
    { end: 49, suffix: ".1%", danger: true,
      label: "골든타임 미도착", sub: "중증환자 71만명 누적 · 서울경제" },
    { end: 25, suffix: "곳",
      label: "야간 1인 당직 응급실", sub: "수도권 포함 전국 · MBC 뉴스투데이" },
  ];
  return (
    <Reveal>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-14">
        {stats.map((s, i) => (
          <Reveal key={s.label} delay={i * 100}>
            <div className={`border p-7 h-full ${
              s.danger
                ? "border-rose-500/30 bg-rose-500/[0.04]"
                : "border-vuno-cyan/40 bg-vuno-cyan/[0.04]"
            }`}>
              <div className={`text-4xl md:text-6xl font-bold font-numeric tracking-tight tabular-nums ${
                s.danger ? "text-rose-400" : "text-vuno-cyan"
              }`}>
                {s.prefix && <span className="mr-1">{s.prefix}</span>}
                <CountUp end={s.end} duration={1600} delay={i * 120} />
                {s.suffix && <span>{s.suffix}</span>}
              </div>
              <div className="mt-3 text-base md:text-lg font-bold text-white">{s.label}</div>
              <div className="mt-1 text-sm md:text-base text-vuno-muted break-keep">{s.sub}</div>
            </div>
          </Reveal>
        ))}
      </div>
    </Reveal>
  );
}

/* ── 핵심 문제 3가지 — 언론 보도 인용 ───────────────────── */
function ProblemCards() {
  const cards = [
    {
      icon: TrendingDown,
      no: "01",
      title: "응급실에 도달조차 어렵다",
      desc: '"응급실 뺑뺑이" 재이송이 2023년 4,227건 → 2024년 5,657건으로 +34% 폭증. 뇌졸중 환자의 52.1%가 첫 병원에서 거절돼 표류합니다.',
      kpi: "재이송 +34% · 뇌졸중 거절 52.1%",
      source: "시사저널 단독 · 의협신문 2025",
    },
    {
      icon: UserCheck,
      no: "02",
      title: "야간 당직, 전문의가 없다",
      desc: "전국 응급실 25곳이 야간 1인 당직 체제로 운영. 응급의학과 전문의 사직은 2023년 38명 → 2024년 137명으로 3.6배 급증했습니다.",
      kpi: "야간 1인 당직 25곳 · 전문의 사직 137명",
      source: "MBC 뉴스투데이 · 서울신문 2024",
    },
    {
      icon: Clock,
      no: "03",
      title: "골든타임 손실 — 5년간 71만 명",
      desc: '"중증환자 골든타임 미도착" 누적 71만 명, 미도착률 49.1%. 5대 중증 전원 사유 26.6%가 "전문응급의료 요함" — AI 개입 가능 영역입니다.',
      kpi: "미도착 49.1% · 연 AI 개입 가능 72,000건",
      source: "서울경제 · 통계연보 제23호",
    },
  ];
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
      {cards.map((c, i) => (
        <Reveal key={c.no} delay={i * 120}>
          <div className="relative border border-rose-500/30 bg-vuno-surface p-8 md:p-9 h-full hover:border-rose-400/70 transition-colors flex flex-col">
            {/* 좌측 빨간 strip */}
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-rose-500/70" />
            <div className="flex items-start gap-5 mb-6">
              <div className="h-16 w-16 bg-rose-500/10 border border-rose-500/40 grid place-items-center text-rose-400 flex-shrink-0">
                <c.icon className="h-8 w-8" />
              </div>
              <div className="text-base md:text-lg font-bold text-rose-300 font-numeric tracking-[0.25em] pt-4">{c.no}</div>
            </div>
            <h3 className="text-3xl md:text-4xl font-bold text-white leading-tight mb-4 break-keep">{c.title}</h3>
            <p className="text-lg md:text-xl text-vuno-muted leading-relaxed mb-6 break-keep flex-1">{c.desc}</p>
            <div className="px-4 py-3 border border-rose-500/30 bg-rose-500/[0.06] text-base md:text-lg text-rose-200 font-numeric break-keep">
              {c.kpi}
            </div>
            <div className="mt-3 flex items-center gap-2 text-sm md:text-base text-vuno-dim/80 break-keep">
              <Newspaper className="h-3.5 w-3.5 flex-shrink-0" />
              <span>{c.source}</span>
            </div>
          </div>
        </Reveal>
      ))}
    </div>
  );
}

/* ── 근거자료 갤러리 — 4장 언론 보도 캡쳐 (원본 기사 링크 연결) ───── */
function EvidenceGallery() {
  const items = [
    {
      src: "/기획 근거자료.png",
      title: "응급실 뺑뺑이 — 시사저널 단독",
      caption: "재이송 4,227→5,657건 (+34%) — 2023 vs 2024",
      url: "https://www.sisajournal.com/news/articleView.html?idxno=321607",
    },
    {
      src: "/기획근거자료 2.png",
      title: "전문의 사직 급증 — 서울신문",
      caption: "응급의학과 사직 38→137명 (3.6배) · 빅5 의사 36% 감소",
      url: "https://m.seoul.co.kr/news/society/2025/03/03/20250303012003",
    },
    {
      src: "/기획서 근거자료 3.png",
      title: "골든타임 미도착 — 서울경제",
      caption: "중증환자 5년간 71만 명 누적 · 미도착률 49.1%",
      url: "https://www.sedaily.com/NewsView/2H1K8XZISZ",
    },
    {
      src: "/기획서 근거자료 4.png",
      title: "야간 1인 당직 응급실 — MBC 뉴스투데이",
      caption: "전국 25곳 — 수도권 포함 야간 의료공백",
      url: "https://imnews.imbc.com/replay/2024/nwtoday/article/6633787_36523.html",
    },
  ];
  return (
    <Reveal>
      <div className="mb-20">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 border border-rose-400/40 text-rose-300 text-sm md:text-base font-bold uppercase tracking-[0.2em] mb-5">
            <Newspaper className="h-4 w-4 md:h-5 md:w-5" />
            Press Evidence
          </div>
          <h3 className="text-3xl md:text-5xl font-bold text-white leading-tight">
            언론이 증언하는 <span className="text-rose-300">응급의료 위기</span>
          </h3>
          <p className="mt-4 text-lg md:text-xl text-vuno-muted max-w-3xl mx-auto break-keep">
            2024–2025년 주요 일간지·시사지·방송 보도. 자체 추정이 아닌 사실 보도로 검증된 정량 근거입니다.
          </p>
          <div className="mt-4 text-sm md:text-base text-vuno-dim">
            카드를 클릭하면 원문 기사로 이동합니다
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {items.map((it, i) => (
            <Reveal key={it.src} delay={i * 100}>
              <a
                href={it.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group block border border-vuno-border bg-vuno-surface hover:border-rose-400/60 transition-colors h-full"
                aria-label={`${it.title} — 원문 기사로 이동 (새 창)`}
              >
                <figure className="h-full flex flex-col">
                  <div
                    className="relative bg-white border-b border-vuno-border p-3 flex items-center justify-center"
                    style={{ minHeight: 200, maxHeight: 280 }}
                  >
                    <img
                      src={it.src}
                      alt={it.title}
                      loading="lazy"
                      className="max-w-full max-h-[260px] object-contain"
                    />
                    <span className="absolute top-2 right-2 h-8 w-8 bg-vuno-bg/80 border border-vuno-border text-white opacity-0 group-hover:opacity-100 transition-opacity grid place-items-center">
                      <ExternalLink className="h-4 w-4" />
                    </span>
                  </div>
                  <figcaption className="p-5 flex-1 flex flex-col">
                    <div className="text-base md:text-lg font-bold text-white break-keep leading-snug group-hover:text-rose-300 transition-colors">{it.title}</div>
                    <div className="mt-2 text-sm md:text-base text-vuno-muted break-keep flex-1">{it.caption}</div>
                    <div className="mt-3 flex items-center gap-1.5 text-xs md:text-sm text-rose-300/80 font-bold uppercase tracking-wider">
                      원문 보기 <ExternalLink className="h-3.5 w-3.5" />
                    </div>
                  </figcaption>
                </figure>
              </a>
            </Reveal>
          ))}
        </div>
      </div>
    </Reveal>
  );
}

/* ── 시장 구조 — 응급의료기관 3-tier (우리 도입 타깃) ───── */
function MarketStructure() {
  // Phase = 도입 우선순위 (사업계획서 기준)
  //   Phase 1: 지역응급의료센터 주력 (전문의 7.0명/소, 야간 편차 보강 가치 최대)
  //   Phase 2: 권역응급의료센터 확장 (지역센터 검증 후 3차 최종치료)
  //   Phase 3: 지역응급의료기관 (전문의 1.9명/소, 임상 가치는 크지만 예산 작음)
  //   ※ 응급의료시설 114개는 응급의학 전문의 전담 배치가 의무 아닌 4단계 기관 → 도입 타깃 외 (제외)
  const tiers = [
    { name: "권역응급의료센터", count: 44,  phys: "10.1명", phase: "Phase 2", width: 33, accent: true },
    { name: "지역응급의료센터", count: 137, phys: "7.0명",  phase: "Phase 1", width: 64, accent: true },
    { name: "지역응급의료기관", count: 233, phys: "1.9명",  phase: "Phase 3", width: 100, accent: true },
  ];
  return (
    <Reveal>
      <div className="mt-24 md:mt-32 mb-20">
        {/* 헤더 — 다른 섹션들과 동일하게 중앙 정렬 */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-2 border border-vuno-cyan/40 text-vuno-cyan text-sm md:text-base font-bold uppercase tracking-[0.2em] mb-5">
            <Building2 className="h-4 w-4 md:h-5 md:w-5" />
            Total Addressable Market
          </div>
          <h3 className="text-4xl md:text-6xl font-bold text-white leading-tight">
            <span className="text-vuno-cyan">414</span>개 도입 타깃
          </h3>
          <p className="mt-6 text-xl md:text-2xl text-vuno-muted max-w-4xl mx-auto break-keep">
            권역(44) + 지역센터(137) + 지역기관(233) — <span className="text-vuno-cyan">도입 우선순위 추정</span>에 따라 단계별 진입.
          </p>
          <p className="mt-3 text-lg md:text-xl text-vuno-dim max-w-3xl mx-auto break-keep">
            <span className="text-vuno-cyan font-bold">Phase 1</span> 지역센터(주력) ·
            <span className="text-vuno-cyan font-bold"> Phase 2</span> 권역(확장) ·
            <span className="text-vuno-cyan font-bold"> Phase 3</span> 지역기관(잠재 확장)
          </p>
          <p className="mt-3 text-base md:text-lg text-vuno-dim/70 break-keep">
            ※ Phase 1·2는 사업계획서 ARR 추정에 명시 / Phase 3은 가격 정책 기반 추정치
          </p>
        </div>

        {/* 본문 — 막대 그래프 + KPI 2종 */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-10 items-start">
          {/* 좌측 — 막대 그래프 */}
          <div className="space-y-5">
            {tiers.map((t, i) => (
              <Reveal key={t.name} delay={i * 120}>
                <div className={`border ${
                  t.accent ? "border-vuno-cyan/40 bg-vuno-cyan/[0.04]" : "border-vuno-border bg-vuno-surface"
                } p-5 md:p-6`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`text-xl md:text-2xl font-bold ${t.accent ? "text-vuno-cyan" : "text-white"} truncate`}>
                        {t.name}
                      </div>
                      {t.phase !== "—" && (
                        <span className="px-2.5 py-1 border border-vuno-cyan text-vuno-cyan text-sm md:text-base font-bold font-numeric flex-shrink-0">
                          {t.phase}
                        </span>
                      )}
                    </div>
                    <div className="flex items-baseline gap-2 flex-shrink-0">
                      <span className={`text-4xl md:text-5xl font-bold font-numeric tabular-nums ${t.accent ? "text-vuno-cyan" : "text-white"}`}>
                        {t.count}
                      </span>
                      <span className="text-base md:text-lg text-vuno-muted">개소</span>
                    </div>
                  </div>
                  <div className="relative h-2.5 bg-vuno-bg border border-vuno-border overflow-hidden">
                    <div
                      className={`absolute inset-y-0 left-0 ${t.accent ? "bg-vuno-cyan" : "bg-vuno-muted/50"}`}
                      style={{ width: `${t.width}%` }}
                    />
                  </div>
                  <div className="mt-3 text-base md:text-lg text-vuno-muted">
                    1개소당 응급의학 전문의 <span className="font-numeric text-white">{t.phys}</span>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>

          {/* 우측 — 정량 시장 KPI 2종 (사업계획서 직접 인용 가능한 항목만) */}
          <div className="grid grid-cols-1 gap-5 self-center">
            <MarketKPI
              big="72,000"
              unit="건/년"
              label="정량 Transfer 시장"
              sub="전원 13.3만건 × 54.4% AI 개입 가능"
              highlight
            />
            <MarketKPI
              big="11B"
              unit="USD"
              label="글로벌 CDS 시장 (2030)"
              sub="Clinical Decision Support TAM · Grand View Research"
            />
          </div>
        </div>
      </div>
    </Reveal>
  );
}

function MarketKPI({
  big, unit, label, sub, highlight,
}: { big: string; unit: string; label: string; sub: string; highlight?: boolean }) {
  return (
    <div className={`border p-6 md:p-7 ${
      highlight ? "border-vuno-cyan bg-vuno-cyan/[0.06]" : "border-vuno-border bg-vuno-surface"
    }`}>
      <div className="flex items-baseline gap-2">
        <div className={`text-4xl md:text-5xl font-bold font-numeric tabular-nums ${
          highlight ? "text-vuno-cyan" : "text-white"
        }`}>
          {big}
        </div>
        {unit && <div className={`text-lg md:text-xl ${highlight ? "text-vuno-cyan/80" : "text-vuno-muted"}`}>{unit}</div>}
      </div>
      <div className="mt-3 text-lg md:text-xl font-bold text-white break-keep">{label}</div>
      <div className="mt-1.5 text-base md:text-lg text-vuno-muted break-keep">{sub}</div>
    </div>
  );
}

/* ── 우리의 답 — 2대 가치 ──────────────────────────── */
function ValueProposition() {
  const values = [
    {
      icon: Clock,
      title: "시간단축",
      sub: "Door-to-Decision 단축",
      from: "50분",
      to: "15분",
      desc: "주호소 입력 즉시 ECG·CXR·Lab 능동 호출 → 7섹션 한국어 임상 소견서 자동 생성",
      kpi: "D2B 90→60분 · 재실 2h 미만 48.8% 환자군",
    },
    {
      icon: Search,
      title: "놓침방지",
      sub: "필수 검사 누락 차단",
      from: "15~20%",
      to: "5%",
      desc: "Chief Complaint별 검사 프로파일 + Rule Engine + Negation Leak 차단",
      kpi: "전원 사유 26.6% \"전문응급요함\" 타깃",
    },
  ];
  return (
    <Reveal>
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-4 py-2 border border-vuno-cyan/40 text-vuno-cyan text-sm md:text-base font-bold uppercase tracking-[0.2em] mb-5">
          <ShieldCheck className="h-4 w-4 md:h-5 md:w-5" />
          Our Answer
        </div>
        <h3 className="text-3xl md:text-5xl font-bold text-white leading-tight">
          EMON의 <span className="text-vuno-cyan">핵심 가치</span>
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-5xl mx-auto">
        {values.map((v, i) => (
          <Reveal key={v.title} delay={i * 120}>
            <div className="border border-vuno-cyan/50 bg-vuno-surface p-7 md:p-8 h-full hover:border-vuno-cyan hover:bg-vuno-cyan/[0.04] transition-all shadow-[0_0_0_1px_rgba(67,224,212,0.15)]">
              <div className="flex items-start gap-4 mb-5">
                <div className="h-14 w-14 bg-vuno-cyan/10 border border-vuno-cyan/50 grid place-items-center text-vuno-cyan flex-shrink-0">
                  <v.icon className="h-7 w-7" />
                </div>
              </div>

              <h4 className="text-2xl md:text-3xl font-bold text-white mb-2">{v.title}</h4>
              <div className="text-base md:text-lg text-vuno-cyan/80 mb-5">{v.sub}</div>

              {/* Before → After */}
              <div className="flex items-center gap-3 mb-5 px-4 py-3 bg-vuno-bg border border-vuno-border">
                <span className="text-base md:text-lg text-rose-300 line-through font-numeric flex-shrink-0">
                  {v.from}
                </span>
                <ChevronDown className="h-5 w-5 -rotate-90 text-vuno-muted flex-shrink-0" />
                <span className="text-2xl md:text-3xl font-bold text-vuno-cyan font-numeric tabular-nums">
                  {v.to}
                </span>
              </div>

              <p className="text-base md:text-lg text-vuno-muted leading-relaxed mb-5 break-keep">
                {v.desc}
              </p>
              <div className="text-sm md:text-base text-vuno-cyan/80 font-numeric break-keep">
                ▸ {v.kpi}
              </div>
            </div>
          </Reveal>
        ))}
      </div>

    </Reveal>
  );
}
