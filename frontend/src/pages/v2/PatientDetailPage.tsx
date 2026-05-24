import { Fragment, useMemo, useState, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  Activity, FlaskConical, Image as ImageIcon, ChevronRight,
  CheckCircle2, Loader2, Sparkles, Stethoscope, PenLine, Wifi, WifiOff, X,
} from "lucide-react";
import { AppShell } from "../../components/v2/AppShell";
import { ConfidenceBadge } from "../../components/v2/ConfidenceBadge";
import { PatientInfoSidebar } from "../../components/v2/PatientInfoSidebar";
import { findPatient, type DemoPatient } from "../../lib/v2/demoStore";
import { approveOrder, requestOrder, type AIRec, type ModalKey } from "../../lib/v2/api";
import { LiveBadge } from "../../components/v2/LiveBadge";
import { useEncounterData } from "../../lib/v2/useEncounterData";
import { cn } from "../../lib/cn";

/* ─────────────────────────────────────────────────────────
   AI 분석 — "결정" 화면
   좌: 환자정보 / 중: AI 검사 권고(1·2·3차) / 우: 의사 직접 호출
   검사 결과·AI 판독은 'AI 결과' 페이지로 분리됨.
   ───────────────────────────────────────────────────────── */
export default function PatientDetailPage() {
  const { id = "" } = useParams();
  const [searchParams] = useSearchParams();
  const encounterId = searchParams.get("encounter_id");
  const nav = useNavigate();
  const patient = useMemo(() => findPatient(id), [id]);

  const { recs, wsStatus, poll } = useEncounterData(encounterId);
  const [approving, setApproving] = useState<Set<string>>(new Set());

  async function handleApprove(srId: string) {
    setApproving((s) => new Set(s).add(srId));
    await approveOrder(srId);
    setTimeout(poll, 500);
    setTimeout(() => {
      setApproving((s) => { const n = new Set(s); n.delete(srId); return n; });
    }, 5000);
  }

  // 의사 직접 지시 — AI 권고와 무관하게 모달 검사 추가 실행
  const [requesting, setRequesting] = useState<Set<ModalKey>>(new Set());
  const [requested, setRequested] = useState<Set<ModalKey>>(new Set());
  async function handleRequestOrder(modality: ModalKey) {
    if (!encounterId) return;
    setRequested((s) => new Set(s).add(modality));
    setRequesting((s) => new Set(s).add(modality));
    await requestOrder(encounterId, patient?.fhirPatientId ?? encounterId, modality);
    setTimeout(poll, 500);
    setTimeout(() => {
      setRequesting((s) => { const n = new Set(s); n.delete(modality); return n; });
    }, 5000);
  }

  // 모달 추론 서버 ON/OFF (목업 — 배포 후 /ops/health 연동). 칩 클릭으로 데모 토글.
  const [servers, setServers] = useState<Record<ModalKey, boolean>>({ ECG: true, CXR: true, LAB: true });
  const [manualOpen, setManualOpen] = useState<ModalKey | null>(null);
  const [manualDone, setManualDone] = useState<Set<ModalKey>>(new Set());

  const resultsHref = encounterId
    ? `/demo/patient/${id}/results?encounter_id=${encounterId}`
    : `/demo/patient/${id}/results`;

  if (!patient) {
    return (
      <AppShell>
        <div className="max-w-md mx-auto py-20 text-center">
          <p className="text-slate-500 dark:text-vuno-muted">환자를 찾을 수 없습니다.</p>
        </div>
      </AppShell>
    );
  }

  const doneCount = recs.filter((r) => r.status === "completed").length;

  return (
    <AppShell notifications={3}>
      <div className="bg-slate-100 text-slate-900 dark:bg-vuno-bg dark:text-white min-h-[calc(100vh-3.5rem)] lg:grid lg:grid-cols-[390px_minmax(0,1fr)] lg:items-start">
        {/* ── 좌: 환자 정보 사이드바 (sticky 고정 — 옆 컨텐츠만 스크롤) ── */}
        <PatientInfoSidebar patient={patient} allowEdit className="lg:sticky lg:top-14 lg:h-[calc(100vh-3.5rem)] lg:overflow-y-auto" />

        {/* ── 우측 컨텐츠: 검사 진행 흐름 + (좌 의사오더/메모 · 우 AI 1·2차) — 아래까지 채움 ── */}
        <div className="px-5 py-5 flex flex-col lg:min-h-[calc(100vh-3.5rem)]">
          <div className="flex flex-col gap-4 min-w-0 flex-1">
            {/* 상단: LIVE 검사 진행 흐름 바 (전체 폭 · 도킹 아님) */}
            <ExamFlowBar patient={patient} recs={recs} wsStatus={wsStatus} requested={requested} manualDone={manualDone} />
            {/* 양분: 좌 의사 직접 오더 · 우 AI 검사 권고 (현재 크기에 맞춰 채움) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch flex-1">
              <div className="flex flex-col min-w-0">
                <ManualOrderPanel
                  encounterId={encounterId}
                  recs={recs}
                  requesting={requesting}
                  requested={requested}
                  servers={servers}
                  manualDone={manualDone}
                  onRequestOrder={handleRequestOrder}
                  onToggleServer={(m) => setServers((s) => ({ ...s, [m]: !s[m] }))}
                  onManualOpen={(m) => setManualOpen(m)}
                />
              </div>
              <div className="flex flex-col min-w-0">
                <AIRecPanel
                  patient={patient}
                  encounterId={encounterId}
                  recs={recs}
                  wsStatus={wsStatus}
                  approving={approving}
                  doneCount={doneCount}
                  onApprove={handleApprove}
                  onOpenResults={() => nav(resultsHref)}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 직접 입력 팝업 모달 */}
      {manualOpen && (
        <ManualInputModal
          modality={manualOpen}
          onClose={() => setManualOpen(null)}
          onSave={() => {
            setManualDone((s) => new Set(s).add(manualOpen));
            setManualOpen(null);
          }}
        />
      )}
    </AppShell>
  );
}

/* ═══════════════════════════════════════════════════════════
   중앙 — AI 권고 1·2·3차 패널
   ═══════════════════════════════════════════════════════════ */
const RANK_META: Record<1 | 2 | 3, { ko: string; badge: string; bar: string }> = {
  1: { ko: "1차 권고", badge: "bg-purple-600", bar: "bg-purple-50 border-purple-300 dark:bg-purple-500/15 dark:border-purple-500/40" },
  2: { ko: "2차 권고", badge: "bg-blue-600", bar: "bg-blue-50 border-blue-300 dark:bg-blue-500/15 dark:border-blue-500/40" },
  3: { ko: "3차 권고", badge: "bg-emerald-600", bar: "bg-emerald-50 border-emerald-300 dark:bg-emerald-500/15 dark:border-emerald-500/40" },
};

const MODAL_LABEL: Record<ModalKey, string> = {
  ECG: "심전도 12-Lead",
  CXR: "흉부 X-ray",
  LAB: "혈액 검사",
};

// 연동 전 데모용 AI 신뢰도 — srId 기반 안정적 값(1차 권고일수록 높음).
// 실연동 시 ServiceRequest의 confidence extension 값으로 대체.
function demoConfidence(rec: AIRec): number {
  let h = 0;
  for (const c of rec.srId) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const base = rec.rank === 1 ? 90 : rec.rank === 2 ? 83 : 76;
  return base + (h % 8);
}

/* ═══════════════════════════════════════════════════════════
   상단 — LIVE 검사 진행 흐름 바 (ECG·CXR·LAB 스텝, 진행중 강조)
   ═══════════════════════════════════════════════════════════ */
type FlowStatus = "completed" | "active" | "draft" | "none";

function ExamFlowBar({ patient, recs, wsStatus, requested, manualDone }: {
  patient: DemoPatient;
  recs: AIRec[];
  wsStatus: "open" | "close" | "error" | null;
  requested: Set<ModalKey>;
  manualDone: Set<ModalKey>;
}) {
  const ALL: ModalKey[] = ["ECG", "CXR", "LAB"];

  const statusOf = (m: ModalKey): FlowStatus => {
    const rs = recs.filter((r) => r.modality === m);
    if (rs.length > 0) {
      if (rs.some((r) => r.status === "active")) return "active";
      if (rs.every((r) => r.status === "completed")) return "completed";
      if (rs.some((r) => r.status === "draft")) return "draft";
    }
    if (manualDone.has(m)) return "completed";       // 수기 입력 완료
    if (requested.has(m)) return "active";           // 의사 직접 지시 → 분석 중 (정적 완료보다 우선)
    // 폴백: 백엔드 미연동(showcase) 환자만 정적 데모 플래그 사용.
    // 백엔드 연동(recs 존재) 환자는 정적 done 무시 — 실제 오더/결과만 반영
    // (안 그러면 데모 환자의 cxr/lab="done"이 오더 안 했는데도 검사완료로 뜸).
    if (recs.length === 0) {
      const ps = patient[m.toLowerCase() as "ecg" | "cxr" | "lab"];
      if (ps === "done") return "completed";
    }
    return rs.length > 0 ? "draft" : "none";
  };

  const states = ALL.map((m) => ({ m, st: statusOf(m) }));
  const doneCount = states.filter((s) => s.st === "completed").length;
  const activeModal = states.find((s) => s.st === "active")?.m ?? null;

  const phase =
    doneCount === ALL.length ? "모든 검사 완료 — 종합소견 생성 단계" :
    activeModal ? `${activeModal} 분석 진행 중…` :
    states.some((s) => s.st === "draft") ? "검사 승인 대기 중" :
    "AI 검사 권고 검토 단계";

  return (
    <div className="flex-shrink-0 rounded-xl border border-slate-200 dark:border-vuno-border bg-white dark:bg-vuno-surface shadow-sm px-5 py-4">
      <div className="flex items-center gap-2.5 mb-4">
        <span className="h-9 w-9 grid place-items-center rounded-lg bg-gradient-to-br from-brand-500 to-ai-accent text-white">
          <Activity className="h-5 w-5" />
        </span>
        <span className="text-[16px] font-bold text-slate-900 dark:text-white leading-none">검사 진행 상황</span>
        <span className="text-[12px] text-slate-500 dark:text-vuno-muted leading-none truncate">· {phase}</span>
        <LiveBadge status={wsStatus} className="ml-auto flex-shrink-0" />
        <span className="text-[14px] font-bold font-numeric text-slate-500 dark:text-vuno-muted flex-shrink-0">{doneCount}/{ALL.length}</span>
      </div>
      <div className="flex items-start">
        {states.map(({ m, st }, i) => (
          <Fragment key={m}>
            <FlowStep modality={m} status={st} />
            {i < ALL.length - 1 && (
              <div className={cn(
                "flex-1 h-1 mt-[27px] rounded-full transition-colors",
                st === "completed" ? "bg-emerald-400 dark:bg-emerald-500/60" : "bg-slate-200 dark:bg-vuno-border",
              )} />
            )}
          </Fragment>
        ))}
      </div>
    </div>
  );
}

function FlowStep({ modality, status }: { modality: ModalKey; status: FlowStatus }) {
  const Icon = modality === "ECG" ? Activity : modality === "CXR" ? ImageIcon : FlaskConical;
  const statusText =
    status === "completed" ? "검사 완료" :
    status === "active" ? "분석 중" :
    status === "draft" ? "승인 대기" : "미요청";
  return (
    <div className="flex flex-col items-center gap-2 w-20 flex-shrink-0">
      <div className={cn(
        "relative h-14 w-14 grid place-items-center rounded-full border-2 transition-all",
        status === "completed" ? "bg-emerald-500 border-emerald-500 text-white" :
        status === "active" ? "bg-amber-400 border-amber-400 text-white shadow-[0_0_0_5px_rgba(251,191,36,0.30)] scale-105 animate-pulse" :
        status === "draft" ? "bg-purple-100 border-purple-400 text-purple-600 dark:bg-purple-500/20 dark:border-purple-500/60 dark:text-purple-300 animate-pulse" :
        "bg-slate-50 border-slate-200 text-slate-300 dark:bg-vuno-bg dark:border-vuno-border dark:text-vuno-dim",
      )}>
        {status === "active" && <span className="absolute inset-0 rounded-full bg-amber-400/40 animate-ping" />}
        {status === "completed" ? <CheckCircle2 className="h-7 w-7 relative" /> :
         status === "active" ? <Loader2 className="h-6 w-6 animate-spin relative" /> :
         <Icon className="h-6 w-6 relative" />}
      </div>
      <div className="text-center leading-none">
        <div className={cn("text-[15px] font-bold leading-none", status === "none" ? "text-slate-400 dark:text-vuno-dim" : "text-slate-800 dark:text-white")}>{modality}</div>
        <div className={cn(
          "text-[11px] mt-1.5 font-bold leading-none",
          status === "completed" ? "text-emerald-600 dark:text-emerald-300" :
          status === "active" ? "text-amber-600 dark:text-amber-300" :
          status === "draft" ? "text-purple-600 dark:text-purple-300" :
          "text-slate-400 dark:text-vuno-dim",
        )}>{statusText}</div>
      </div>
    </div>
  );
}

function AIRecPanel({
  patient, encounterId, recs, wsStatus, approving, doneCount, onApprove, onOpenResults,
}: {
  patient: DemoPatient;
  encounterId: string | null;
  recs: AIRec[];
  wsStatus: "open" | "close" | "error" | null;
  approving: Set<string>;
  doneCount: number;
  onApprove: (srId: string) => void;
  onOpenResults: () => void;
}) {
  // "모든 권장 검사 완료"는 2차 재판단 깜빡임 방지를 위해 디바운스.
  // recs가 모두 완료로 2.5초 안정돼야 표시 → 그 사이 2차 권고(draft)가 추가되면
  // allDoneNow=false 가 되어 배너가 안 뜸. (새로고침에도 안전: 안정되면 표시됨)
  const allDoneNow = recs.length > 0 && recs.every((r) => r.status === "completed");
  const [allDone, setAllDone] = useState(false);
  useEffect(() => {
    if (!allDoneNow) { setAllDone(false); return; }
    const t = setTimeout(() => setAllDone(true), 2500);
    return () => clearTimeout(t);
  }, [allDoneNow]);
  // 백엔드 미연동 — 정적 demoStore recommendation 폴백
  if (!encounterId) {
    return (
      <div className="h-full flex flex-col bg-white dark:bg-vuno-surface border border-slate-200 dark:border-vuno-border rounded-xl shadow-sm overflow-hidden">
        <PanelHeader wsStatus={wsStatus} />
        <div className="flex-1 overflow-auto p-4">
          {patient.recommendation ? (
            <div className="space-y-2">
              <div className="text-xs text-slate-500 dark:text-vuno-muted bg-slate-50 dark:bg-vuno-bg border border-slate-200 dark:border-vuno-border rounded-lg px-2.5 py-2">
                데모 모드 — 백엔드 미연동. 실제 AI 권고 시계열은 트리아지 제출로 encounter를 생성하면 표시됩니다.
              </div>
              <div className="border border-slate-200 dark:border-vuno-border rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="text-[13px] font-bold text-slate-800 dark:text-white">
                    {patient.recommendation.diagnosis}
                  </div>
                  <ConfidenceBadge value={88 + (patient.recommendation.diagnosis.length % 9)} className="ml-auto" />
                </div>
                <div className="text-[9px] font-bold tracking-wide text-brand-600 dark:text-brand-300 mb-1">AI 근거</div>
                {patient.recommendation.reasons.map((r) => (
                  <div key={r} className="text-[12px] text-slate-600 dark:text-vuno-muted leading-relaxed">· {r}</div>
                ))}
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-[15px] font-medium text-slate-400 dark:text-vuno-dim">AI 권고 없음</div>
          )}
        </div>
        <PanelFooter onOpenResults={onOpenResults} disabled />
      </div>
    );
  }

  const aiRecs = recs.filter((r) => !r.isManual);
  const manualRecs = recs.filter((r) => r.isManual);

  // AI 권고 rank별 그룹
  const byRank = new Map<1 | 2 | 3, AIRec[]>();
  aiRecs.forEach((r) => {
    const arr = byRank.get(r.rank) ?? [];
    arr.push(r);
    byRank.set(r.rank, arr);
  });
  const ranks = [...byRank.keys()].sort();
  const allDraft = recs.filter((r) => r.status === "draft");
  // allDone 은 위에서 디바운스된 state (2차 재판단 깜빡임 방지)

  return (
    <div className="h-full flex flex-col bg-white dark:bg-vuno-surface border border-slate-200 dark:border-vuno-border rounded-xl shadow-sm overflow-hidden">
      <PanelHeader wsStatus={wsStatus} />

      {recs.length === 0 ? (
        <div className="flex-1 py-16 flex flex-col items-center justify-center text-center text-[15px] font-medium text-slate-400 dark:text-vuno-dim">
          <Loader2 className="h-7 w-7 mb-2.5 animate-spin text-slate-300 dark:text-vuno-dim" />
          AI 권고를 불러오는 중…
        </div>
      ) : (
        <div className="flex-1 overflow-auto p-3 space-y-3">
          {/* AI 1·2·3차 권고 — 세로로 차곡차곡 (폭 제한 컨텐츠) */}
          <div className="space-y-3">
          {ranks.map((rank) => {
            const rm = RANK_META[rank];
            return (
              <div key={rank} className={cn("border rounded-lg overflow-hidden", rm.bar)}>
                <div className="flex items-center gap-2 px-3.5 py-2.5 border-b border-black/5 dark:border-white/10">
                  <Sparkles className="h-4 w-4 text-brand-600 flex-shrink-0" />
                  <span className={cn("px-2.5 py-1 rounded text-[13px] font-bold text-white", rm.badge)}>
                    {rm.ko}
                  </span>
                  <span className="text-[12px] text-slate-500 dark:text-vuno-muted font-medium">
                    판단 근거 기반 · 검사 {byRank.get(rank)!.length}건
                  </span>
                  <ConfidenceBadge value={Math.max(...byRank.get(rank)!.map((r) => demoConfidence(r)))} className="ml-auto flex-shrink-0" />
                </div>
                <div className="p-3 space-y-2.5 bg-white dark:bg-vuno-surface">
                  {byRank.get(rank)!.map((rec) => (
                    <RecRow
                      key={rec.srId}
                      rec={rec}
                      approving={approving.has(rec.srId)}
                      onApprove={() => onApprove(rec.srId)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
          </div>

          {/* 의사 직접 오더 진행 상태 (우측 패널에서 호출한 검사) */}
          {manualRecs.length > 0 && (
            <div className="border border-slate-300 dark:border-vuno-border rounded-lg overflow-hidden bg-slate-50 dark:bg-vuno-bg">
              <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-300 dark:border-vuno-border">
                <Stethoscope className="h-3.5 w-3.5 text-slate-700 dark:text-slate-200" />
                <span className="px-2 py-0.5 rounded text-[11px] font-bold text-white bg-slate-700">
                  의사 직접 오더
                </span>
                <span className="text-[11px] text-slate-500 dark:text-vuno-muted font-medium">
                  의사 판단 · 검사 {manualRecs.length}건
                </span>
              </div>
              <div className="p-2.5 space-y-2 bg-white dark:bg-vuno-surface">
                {manualRecs.map((rec) => (
                  <RecRow
                    key={rec.srId}
                    rec={rec}
                    approving={approving.has(rec.srId)}
                    onApprove={() => onApprove(rec.srId)}
                    manual
                  />
                ))}
              </div>
            </div>
          )}

          {/* 모든 권고 완료 */}
          {allDone && (
            <div className="border border-emerald-300 bg-emerald-50 dark:bg-emerald-500/15 dark:border-emerald-500/40 rounded-lg px-3 py-2.5 flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-[12px] font-bold text-emerald-800 dark:text-emerald-300">모든 권장 검사 완료</div>
                <div className="text-[11px] text-emerald-700 dark:text-emerald-300 leading-snug mt-0.5">
                  AI 결과 페이지에서 판독을 확인하고 종합 소견서를 생성할 수 있습니다.
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <PanelFooter onOpenResults={onOpenResults} disabled={doneCount === 0} />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   좌측 — 의사 직접 지시 (AI 권고와 별개로 모달 검사 지시) + 의사 메모
   ═══════════════════════════════════════════════════════════ */
function ManualOrderPanel({
  encounterId, recs, requesting, requested, servers, manualDone, onRequestOrder, onToggleServer, onManualOpen,
}: {
  encounterId: string | null;
  recs: AIRec[];
  requesting: Set<ModalKey>;
  requested: Set<ModalKey>;
  servers: Record<ModalKey, boolean>;
  manualDone: Set<ModalKey>;
  onRequestOrder: (m: ModalKey) => void;
  onToggleServer: (m: ModalKey) => void;
  onManualOpen: (m: ModalKey) => void;
}) {
  const ALL: ModalKey[] = ["ECG", "CXR", "LAB"];
  const anyDown = ALL.some((m) => !servers[m]);
  const [memo, setMemo] = useState("");
  return (
    <div className="h-full flex flex-col bg-white dark:bg-vuno-surface border border-slate-200 dark:border-vuno-border rounded-xl shadow-sm overflow-hidden">
      <div className="px-5 py-3.5 border-b border-slate-200 dark:border-vuno-border bg-slate-50 dark:bg-vuno-bg flex items-center gap-2.5">
        <span className="h-9 w-9 grid place-items-center rounded-lg bg-slate-700 text-white">
          <Stethoscope className="h-5 w-5" />
        </span>
        <div>
          <div className="text-[16px] font-bold text-slate-900 dark:text-white leading-none">의사 직접 지시</div>
          <div className="text-[10px] text-slate-400 dark:text-vuno-dim tracking-wider uppercase mt-1">Manual Order</div>
        </div>
      </div>

      <div className="p-3.5 space-y-2.5">
        {anyDown && (
          <div className="flex items-center gap-1.5 text-[12px] font-medium text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-500/15 border border-amber-200 dark:border-amber-500/40 rounded-lg px-3 py-2">
            <WifiOff className="h-4 w-4 flex-shrink-0" /> 추론 서버가 꺼진 검사는 의사가 직접 입력할 수 있습니다.
          </div>
        )}
        {ALL.map((m) => (
          <ManualOrderRow
            key={m}
            modality={m}
            rec={recs.find((r) => r.modality === m)}
            loading={requesting.has(m)}
            requested={requested.has(m)}
            disabled={!encounterId}
            serverUp={servers[m]}
            manualDone={manualDone.has(m)}
            onOrder={() => onRequestOrder(m)}
            onToggleServer={() => onToggleServer(m)}
            onManualOpen={() => onManualOpen(m)}
          />
        ))}
      </div>

      {/* 의사 메모 — 남은 공간 채움 */}
      <div className="px-5 pt-3 pb-2 border-t border-slate-200 dark:border-vuno-border flex items-center gap-2">
        <PenLine className="h-4 w-4 text-slate-500 dark:text-vuno-muted" />
        <div className="text-[14px] font-bold text-slate-900 dark:text-white">의사 메모</div>
        <span className="ml-auto text-[11px] text-slate-400 dark:text-vuno-dim">자동 저장</span>
      </div>
      <textarea
        value={memo}
        onChange={(e) => setMemo(e.target.value)}
        placeholder="처치 경과 · 인계사항 · 환자 특이사항을 입력하세요"
        className="flex-1 min-h-[120px] w-full px-5 py-3 text-[14px] leading-relaxed bg-transparent text-slate-800 dark:text-white placeholder:text-slate-300 dark:placeholder:text-vuno-dim focus:outline-none resize-none"
      />
    </div>
  );
}

function ManualOrderRow({
  modality, rec, loading, requested, disabled, serverUp, manualDone, onOrder, onToggleServer, onManualOpen,
}: {
  modality: ModalKey;
  rec?: AIRec;
  loading: boolean;
  requested: boolean;
  disabled: boolean;
  serverUp: boolean;
  manualDone: boolean;
  onOrder: () => void;
  onToggleServer: () => void;
  onManualOpen: () => void;
}) {
  const Icon = modality === "ECG" ? Activity : modality === "CXR" ? ImageIcon : FlaskConical;
  const done = rec?.status === "completed";
  const running = rec?.status === "active";
  const requesting = loading || (requested && !rec);
  const ordered = !!rec || requested;

  return (
    <div className={cn(
      "border rounded-lg px-3.5 py-3 transition-colors",
      done ? "border-emerald-300 bg-emerald-100/80 dark:border-emerald-500/50 dark:bg-emerald-500/25" :
      (running || requesting) ? "border-amber-300 bg-amber-100/80 dark:border-amber-500/50 dark:bg-amber-500/25" :
      manualDone ? "border-emerald-200 bg-emerald-50/60 dark:border-emerald-500/40 dark:bg-emerald-500/15" :
      !serverUp ? "border-red-200 bg-red-50/50 dark:border-red-500/40 dark:bg-red-500/15" :
      "border-slate-200 dark:border-vuno-border bg-white dark:bg-vuno-surface",
    )}>
      {/* 상단: 아이콘 + 이름 + 서버 ON/OFF 칩 */}
      <div className="flex items-center gap-3">
        <span className={cn(
          "h-10 w-10 grid place-items-center rounded-lg flex-shrink-0",
          done ? "bg-emerald-200 text-emerald-700 dark:bg-emerald-500/25 dark:text-emerald-200" :
          (running || requesting) ? "bg-amber-200 text-amber-700 dark:bg-amber-500/25 dark:text-amber-200" :
          "bg-slate-100 text-slate-600 dark:bg-vuno-bg dark:text-vuno-muted",
        )}>
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-[15px] font-bold text-slate-800 dark:text-white leading-none">{modality}</div>
          <div className="text-[13px] text-slate-400 dark:text-vuno-dim mt-1">{MODAL_LABEL[modality]}</div>
        </div>
        <button
          onClick={onToggleServer}
          title="추론 서버 상태 (데모 — 클릭해서 ON/OFF 전환)"
          className={cn(
            "inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition-colors flex-shrink-0",
            serverUp
              ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/40"
              : "bg-slate-100 text-slate-500 border-slate-200 dark:bg-vuno-bg dark:text-vuno-muted dark:border-vuno-border",
          )}
        >
          {serverUp ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
          {serverUp ? "ON" : "OFF"}
        </button>
      </div>

      {/* 하단: 액션 */}
      <div className="mt-2.5 flex justify-end">
        {manualDone ? (
          <button
            onClick={onManualOpen}
            className="h-10 px-3.5 rounded-lg text-[13px] font-bold inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:hover:bg-emerald-500/25 transition-colors"
          >
            <CheckCircle2 className="h-4 w-4" /> 수기 입력 완료 · 수정
          </button>
        ) : !serverUp ? (
          <button
            onClick={onManualOpen}
            className="h-10 px-3.5 rounded-lg text-[13px] font-bold inline-flex items-center gap-1.5 bg-slate-800 text-white hover:bg-slate-900 dark:bg-brand-600 dark:hover:bg-brand-700 transition-colors"
          >
            <PenLine className="h-4 w-4" /> 직접 입력
          </button>
        ) : done ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-bold bg-emerald-200/70 text-emerald-800 dark:bg-emerald-500/25 dark:text-emerald-200">
            <CheckCircle2 className="h-4 w-4" /> 검사 완료
          </span>
        ) : running || requesting ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-bold bg-amber-200/70 text-amber-800 dark:bg-amber-500/25 dark:text-amber-200">
            <Loader2 className="h-4 w-4 animate-spin" /> 분석 중
          </span>
        ) : ordered ? (
          <span className="px-3 py-1.5 rounded-md text-[13px] font-bold bg-slate-100 text-slate-500 dark:bg-vuno-bg dark:text-vuno-muted">오더됨</span>
        ) : (
          <button
            onClick={onOrder}
            disabled={disabled}
            title={disabled ? "encounter 생성 후 지시 가능 (트리아지 제출)" : "AI 권고와 별개로 의사가 직접 검사를 지시합니다"}
            className="h-10 px-4 rounded-lg text-[13px] font-bold inline-flex items-center gap-1.5 bg-brand-600 text-white hover:bg-brand-700 disabled:bg-slate-200 disabled:text-slate-400 dark:disabled:bg-vuno-bg dark:disabled:text-vuno-dim disabled:cursor-not-allowed transition-colors"
          >
            <Stethoscope className="h-4 w-4" /> 검사 지시
          </button>
        )}
      </div>
    </div>
  );
}

/* ── 직접 입력 팝업 모달 (추론 서버 OFF 시 의사 수기 입력) ── */
function ManualInputModal({ modality, onClose, onSave }: {
  modality: ModalKey; onClose: () => void; onSave: () => void;
}) {
  const [findings, setFindings] = useState("");
  const [ecg, setEcg] = useState({ hr: "", pr: "", qrs: "", qt: "" });
  const inputCls = "w-full h-9 px-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 dark:bg-vuno-bg dark:border-vuno-border dark:text-white text-sm focus:outline-none focus:bg-white dark:focus:bg-vuno-bg focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15 transition-colors";

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="w-full max-w-md bg-white dark:bg-vuno-surface rounded-xl shadow-xl border border-slate-200 dark:border-vuno-border overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 py-3 bg-gradient-to-r from-brand-600 to-ai-accent text-white flex items-center gap-2">
          <PenLine className="h-4 w-4" />
          <div className="text-[15px] font-bold leading-none">{modality} 직접 입력</div>
          <span className="text-[11px] text-white/80">{MODAL_LABEL[modality]}</span>
          <button onClick={onClose} className="ml-auto h-7 w-7 grid place-items-center rounded-lg hover:bg-white/15 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-4 space-y-3">
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-500/15 border border-amber-200 dark:border-amber-500/40 rounded-lg px-2.5 py-2">
            <WifiOff className="h-3.5 w-3.5 flex-shrink-0" /> 추론 서버 OFF — 의사 수기 입력으로 기록됩니다.
          </div>

          {modality === "ECG" && (
            <div className="grid grid-cols-2 gap-2">
              {([["hr", "HR (bpm)"], ["pr", "PR int (ms)"], ["qrs", "QRS (ms)"], ["qt", "QT int (ms)"]] as const).map(([k, lbl]) => (
                <div key={k}>
                  <label className="text-[11px] font-medium text-slate-500 dark:text-vuno-muted">{lbl}</label>
                  <input
                    type="number" inputMode="decimal"
                    value={ecg[k]}
                    onChange={(e) => setEcg((s) => ({ ...s, [k]: e.target.value }))}
                    className={cn(inputCls, "mt-1 font-numeric")}
                  />
                </div>
              ))}
            </div>
          )}

          <div>
            <label className="text-[11px] font-medium text-slate-500 dark:text-vuno-muted">
              판독 소견 {modality === "LAB" ? "· 주요 수치" : ""}
            </label>
            <textarea
              value={findings}
              onChange={(e) => setFindings(e.target.value)}
              rows={4}
              placeholder={
                modality === "ECG" ? "예: 동율동, ST 변화 없음" :
                modality === "CXR" ? "예: 폐 침윤 없음, 심장 음영 정상" :
                "예: Troponin I 0.82 ↑↑, WBC 10.2"
              }
              className={cn(inputCls, "h-auto py-2 resize-none mt-1 placeholder:text-slate-300 dark:placeholder:text-vuno-dim")}
            />
          </div>
        </div>

        <div className="px-4 py-3 border-t border-slate-200 dark:border-vuno-border flex items-center justify-end gap-2">
          <button onClick={onClose} className="h-9 px-4 rounded-lg border border-slate-300 dark:border-vuno-border text-slate-600 dark:text-vuno-muted hover:bg-slate-50 dark:hover:bg-vuno-elevated text-[13px] font-bold transition-colors">
            취소
          </button>
          <button
            onClick={onSave}
            disabled={!findings.trim()}
            className="h-9 px-4 rounded-lg bg-brand-600 text-white hover:bg-brand-700 disabled:bg-slate-200 disabled:text-slate-400 dark:disabled:bg-vuno-bg dark:disabled:text-vuno-dim disabled:cursor-not-allowed text-[13px] font-bold inline-flex items-center gap-1.5 transition-colors"
          >
            <CheckCircle2 className="h-4 w-4" /> 저장
          </button>
        </div>
      </div>
    </div>
  );
}

function PanelHeader({ wsStatus }: { wsStatus: "open" | "close" | "error" | null }) {
  return (
    <div className="px-5 py-3.5 border-b border-slate-200 dark:border-vuno-border bg-brand-50 dark:bg-brand-500/15 flex items-center gap-2.5">
      <span className="h-9 w-9 grid place-items-center rounded-lg bg-gradient-to-br from-brand-500 to-ai-accent text-white">
        <Sparkles className="h-5 w-5" />
      </span>
      <div>
        <div className="text-[16px] font-bold text-slate-900 dark:text-white leading-none">AI 검사 권고</div>
        <div className="text-[10px] text-slate-400 dark:text-vuno-dim tracking-wider uppercase mt-1">AI Recommendations · 1·2·3차</div>
      </div>
      <LiveBadge status={wsStatus} className="ml-auto" />
    </div>
  );
}

function PanelFooter({ onOpenResults, disabled }: { onOpenResults: () => void; disabled?: boolean }) {
  return (
    <div className="p-3.5 border-t border-slate-200 dark:border-vuno-border space-y-1.5">
      <button
        onClick={onOpenResults}
        disabled={disabled}
        title={disabled ? "검사가 완료되면 결과를 볼 수 있습니다" : ""}
        className={cn(
          "w-full h-12 rounded-lg text-[15px] font-bold inline-flex items-center justify-center gap-2 transition-colors",
          disabled
            ? "bg-slate-200 dark:bg-vuno-bg text-slate-400 dark:text-vuno-dim cursor-not-allowed"
            : "bg-brand-600 text-white hover:bg-brand-700",
        )}
      >
        {disabled ? "검사 진행 중 — 결과 대기" : "AI 결과 보기"}
        {!disabled && <ChevronRight className="h-5 w-5" />}
      </button>
    </div>
  );
}

function RecRow({ rec, approving, onApprove, manual }: { rec: AIRec; approving: boolean; onApprove: () => void; manual?: boolean }) {
  const Icon = rec.modality === "ECG" ? Activity : rec.modality === "CXR" ? ImageIcon : FlaskConical;
  const isDraft = rec.status === "draft" && !approving;
  const isRunning = approving || rec.status === "active";
  const isDone = rec.status === "completed";

  return (
    <div className={cn(
      "border rounded-lg px-3.5 py-3",
      isDone ? "border-emerald-300 bg-emerald-100/80 dark:border-emerald-500/50 dark:bg-emerald-500/25" :
      isRunning ? "border-amber-300 bg-amber-100/80 dark:border-amber-500/50 dark:bg-amber-500/25" :
      manual ? "border-slate-300 bg-slate-50/60 dark:border-vuno-border dark:bg-vuno-bg" :
      "border-slate-200 dark:border-vuno-border",
    )}>
      <div className="flex items-center gap-2.5 mb-2.5">
        <span className={cn(
          "h-9 w-9 grid place-items-center rounded-lg flex-shrink-0",
          isDone ? "bg-emerald-200 text-emerald-700 dark:bg-emerald-500/25 dark:text-emerald-200" :
          isRunning ? "bg-amber-200 text-amber-700 dark:bg-amber-500/25 dark:text-amber-200" :
          manual ? "bg-slate-200 text-slate-700 dark:bg-vuno-bg dark:text-slate-200" :
          "bg-slate-100 text-slate-600 dark:bg-vuno-bg dark:text-vuno-muted",
        )}>
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <div className="text-[15px] font-bold text-slate-800 dark:text-white leading-none">{rec.modality}</div>
          <div className="text-[13px] text-slate-400 dark:text-vuno-dim mt-1">{MODAL_LABEL[rec.modality]}</div>
        </div>
        <span className="ml-auto">
          {isDone ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[12px] font-bold bg-emerald-200/70 text-emerald-800 dark:bg-emerald-500/25 dark:text-emerald-200">
              <CheckCircle2 className="h-4 w-4" /> 검사 완료
            </span>
          ) : isRunning ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[12px] font-bold bg-amber-200/70 text-amber-800 dark:bg-amber-500/25 dark:text-amber-200">
              <Loader2 className="h-4 w-4 animate-spin" /> 분석 중
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded-md text-[12px] font-bold bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-300 animate-pulse">
              승인 대기
            </span>
          )}
        </span>
      </div>
      {manual ? (
        rec.reason && (
          <div className="text-[12px] text-slate-600 dark:text-vuno-muted leading-relaxed mb-2.5">{rec.reason}</div>
        )
      ) : (
        <div className="mb-2.5">
          <div className="text-[11px] font-bold tracking-wide text-brand-600 dark:text-brand-300 mb-1.5">판단 근거</div>
          <div className="text-[13px] text-slate-700 dark:text-slate-200 leading-relaxed">
            {rec.reason || "환자 주호소·활력징후 분석 기반 권고"}
          </div>
        </div>
      )}
      {isDraft && (
        <button
          onClick={onApprove}
          className="w-full h-12 rounded-lg bg-slate-800 text-white text-[15px] font-bold hover:bg-slate-900 dark:bg-brand-600 dark:hover:bg-brand-700 inline-flex items-center justify-center gap-2 shadow-sm transition-colors"
        >
          <CheckCircle2 className="h-5 w-5" /> 검사 실행
        </button>
      )}
      {isDone && (
        <div className="text-[12px] text-emerald-600 dark:text-emerald-300 font-medium">→ AI 결과 페이지에서 판독 확인</div>
      )}
    </div>
  );
}
