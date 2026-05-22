import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Rocket, RotateCcw, Mic, MicOff, Trash2, Wand2,
} from "lucide-react";
import { AppShell } from "../../components/v2/AppShell";
import { cn } from "../../lib/cn";
import { KTAS_META, type KTAS, type Sex, type PastHistoryCode } from "../../types/triage";
import {
  DEMO_PATIENTS, getAllPatients, isLivePatient, registerLivePatient,
  setCurrentPatientId, type DemoPatient,
} from "../../lib/v2/demoStore";
import { PatientInfoSidebar, type SidebarEdit } from "../../components/v2/PatientInfoSidebar";
import { submitTriage } from "../../lib/v2/api";
import { useSpeechRecognition } from "../../lib/v2/speech";
import { parseTriageSpeech } from "../../lib/v2/triageVoiceParse";

/* ─────────────────────────────────────────────────────────
   환자정보입력 (Triage) — 좌측 = 읽기 사이드바와 동일 스타일의 입력 폼(고정),
   우측 = 테스트 케이스 + 환자 목록
   ───────────────────────────────────────────────────────── */

const PAST_HX_CODES: PastHistoryCode[] = ["HTN", "DM", "CAD", "CVA", "COPD", "ASTHMA", "CKD", "AFIB"];

function regNo(p: DemoPatient): string {
  return p.mimic?.subject_id ?? p.mrn ?? p.id.slice(0, 8);
}
function examOf(p: DemoPatient): "done" | "analyzing" | "waiting" {
  return p.aiStatus === "done" ? "done" : p.aiStatus === "analyzing" ? "analyzing" : "waiting";
}
function patientHref(p: DemoPatient): string {
  const q = isLivePatient(p.id) ? `?encounter_id=${p.id}` : "";
  return examOf(p) === "done" ? `/demo/patient/${p.id}/report${q}` : `/demo/patient/${p.id}${q}`;
}

export default function TriagePageV2() {
  const nav = useNavigate();

  /* ── 환자 식별 ── */
  const [subjectId, setSubjectId] = useState("");
  const [name, setName] = useState("");
  const [age, setAge]   = useState<number | "">("");
  const [sex, setSex]   = useState<Sex>("M");

  /* ── 활력징후 ── */
  const [hr, setHr]     = useState<number | "">("");
  const [sbp, setSbp]   = useState<number | "">("");
  const [dbp, setDbp]   = useState<number | "">("");
  const [rr, setRr]     = useState<number | "">("");
  const [spo2, setSpo2] = useState<number | "">("");
  const [bt, setBt]     = useState<number | "">("");

  /* ── 임상 ── */
  const [chief, setChief] = useState("");
  const [ktas, setKtas] = useState<KTAS>(3);
  const [admission, setAdmission] = useState(() => new Date().toISOString().slice(0, 16));
  const [allergies, setAllergies] = useState("");
  const [meds, setMeds] = useState("");
  const [notes, setNotes] = useState("");
  const [pastHx, setPastHx] = useState<Record<PastHistoryCode, boolean>>({
    HTN: false, DM: false, CAD: false, CVA: false, COPD: false,
    ASTHMA: false, CKD: false, AFIB: false,
    LIVER: false, CANCER: false, ALLERGY: false, PREGNANT: false,
  });

  const [toast, setToast] = useState<string | null>(null);

  /* ── 음성 입력 (Web Speech API, ko-KR) ── */
  const { supported: micSupported, listening, transcript, interim, start, stop, reset: resetVoice } = useSpeechRecognition("ko-KR");
  const appliedRef = useRef(false);
  // 테스트 케이스 선택 시 보존 (submit 시 라이브 환자에 그대로 전달)
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedMimic, setSelectedMimic] = useState<DemoPatient["mimic"]>(null);
  const [selectedRecommendation, setSelectedRecommendation] = useState<DemoPatient["recommendation"]>(undefined);
  const [selectedAiVerdict, setSelectedAiVerdict] = useState<DemoPatient["aiVerdict"]>(undefined);

  const caseList = useMemo(() => DEMO_PATIENTS.filter((p) => p.mimic?.subject_id), []);
  const allPatients = getAllPatients();

  const EMPTY_HX: Record<PastHistoryCode, boolean> = {
    HTN: false, DM: false, CAD: false, CVA: false, COPD: false,
    ASTHMA: false, CKD: false, AFIB: false,
    LIVER: false, CANCER: false, ALLERGY: false, PREGNANT: false,
  };

  function reset() {
    setSubjectId(""); setName(""); setAge(""); setSex("M");
    setHr(""); setSbp(""); setDbp(""); setRr(""); setSpo2(""); setBt("");
    setChief(""); setKtas(3); setAllergies(""); setMeds(""); setNotes("");
    setPastHx({ ...EMPTY_HX });
    setSelectedId(null);
    setSelectedMimic(null);
    setSelectedRecommendation(undefined);
    setSelectedAiVerdict(undefined);
  }

  // 테스트 케이스 클릭 → 폼 자동 채움
  function selectPatient(p: DemoPatient) {
    setSelectedId(p.id);
    setSelectedMimic(p.mimic ?? null);
    setSelectedRecommendation(p.recommendation);
    setSelectedAiVerdict(p.aiVerdict);
    setSubjectId(p.mimic?.subject_id ?? p.id);
    setName(p.name);
    setAge(p.age);
    setSex(p.sex);
    setHr(p.vitals.hr ?? "");
    setSbp(p.vitals.sbp ?? "");
    setDbp(p.vitals.dbp ?? "");
    setRr(p.vitals.rr ?? "");
    setSpo2(p.vitals.spo2 ?? "");
    setBt(p.vitals.bt ?? "");
    setChief(p.chief);
    setKtas(p.ktas);
    setAllergies(p.allergies ?? "");
    setMeds(p.medications ?? "");
    setNotes(p.notes ?? "");
    const hx = { ...EMPTY_HX };
    (p.pastHistory ?? []).forEach((code) => { hx[code] = true; });
    setPastHx(hx);
    setToast(`✓ ${p.name} 선택됨 — 폼이 채워졌습니다.`);
    setTimeout(() => setToast(null), 2500);
  }

  // 음성 받아쓰기 → 폼 필드 자동 채움
  function applyParsed(text: string) {
    const p = parseTriageSpeech(text);
    const filled: string[] = [];
    if (p.subjectId) { setSubjectId(p.subjectId); filled.push("등록번호"); }
    if (p.name)      { setName(p.name); filled.push("환자명"); }
    if (p.age !== undefined)  { setAge(p.age); filled.push("나이"); }
    if (p.sex)       { setSex(p.sex); filled.push("성별"); }
    if (p.hr !== undefined)   { setHr(p.hr); filled.push("HR"); }
    if (p.sbp !== undefined)  { setSbp(p.sbp); filled.push("SBP"); }
    if (p.dbp !== undefined)  { setDbp(p.dbp); filled.push("DBP"); }
    if (p.rr !== undefined)   { setRr(p.rr); filled.push("RR"); }
    if (p.spo2 !== undefined) { setSpo2(p.spo2); filled.push("SpO₂"); }
    if (p.bt !== undefined)   { setBt(p.bt); filled.push("체온"); }
    if (p.chief)     { setChief(p.chief); filled.push("주호소"); }
    if (p.ktas)      { setKtas(p.ktas); filled.push(`KTAS ${p.ktas}`); }
    if (p.pastHx?.length) {
      setPastHx((prev) => {
        const next = { ...prev };
        p.pastHx!.forEach((c) => { next[c] = true; });
        return next;
      });
      filled.push("과거력");
    }
    setToast(filled.length
      ? `🎤 음성 입력 적용 — ${filled.join(", ")}`
      : "인식된 항목이 없습니다. 더 또박또박 말씀해 주세요.");
    setTimeout(() => setToast(null), 4000);
  }

  function startVoice() {
    if (!micSupported) {
      alert("이 브라우저는 음성 인식을 지원하지 않습니다. Chrome 또는 Edge에서 사용해 주세요.");
      return;
    }
    appliedRef.current = false;
    start();
  }

  // 인식 종료 시점에 누적 transcript 자동 적용 (1회)
  useEffect(() => {
    if (!listening && transcript.trim() && !appliedRef.current) {
      appliedRef.current = true;
      applyParsed(transcript);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listening, transcript]);

  const [submitting, setSubmitting] = useState(false);
  const canSubmit = !!(subjectId.trim() && name.trim() && age !== "" && chief.trim());

  async function submit() {
    if (!subjectId || !age || !chief) {
      alert("환자 ID, 나이, 주증상은 필수입니다.");
      return;
    }
    setSubmitting(true);
    const vitalsInput = {
      hr: Number(hr) || 0, sbp: Number(sbp) || 0, dbp: Number(dbp) || 0,
      spo2: Number(spo2) || 0, rr: Number(rr) || 0, bt: Number(bt) || 36.5,
    };
    const pastHistory = PAST_HX_CODES.filter((c) => pastHx[c]);

    const result = await submitTriage({
      name: name || subjectId,
      age: Number(age),
      sex,
      vitals: vitalsInput,
      chief,
      pastHistory,
      allergies,
      medications: meds,
      notes,
      mimic: selectedMimic,
    });
    setSubmitting(false);

    if (result?.encounter_id) {
      const live: DemoPatient = {
        id: result.encounter_id,
        mrn: subjectId,
        fhirPatientId: result.patient_id,
        name: name || subjectId,
        age: Number(age),
        sex,
        ktas,
        chief,
        registeredAt: new Date().toISOString(),
        arrivedAt: new Date().toISOString(),
        ecg: selectedRecommendation ? "done" : "pending",
        cxr: selectedRecommendation ? "done" : "pending",
        lab: selectedRecommendation ? "done" : "pending",
        aiStatus: selectedRecommendation ? "done" : "analyzing",
        vitals: {
          hr: vitalsInput.hr || null, sbp: vitalsInput.sbp || null,
          dbp: vitalsInput.dbp || null, rr: vitalsInput.rr || null,
          spo2: vitalsInput.spo2 || null, bt: vitalsInput.bt || null,
        },
        pastHistory,
        allergies: allergies || undefined,
        medications: meds || undefined,
        notes: notes || undefined,
        mimic: selectedMimic,
        recommendation: selectedRecommendation,
        aiVerdict: selectedAiVerdict,
      };
      registerLivePatient(live);
      setCurrentPatientId(result.encounter_id);
      nav(`/demo/patient/${result.encounter_id}?encounter_id=${result.encounter_id}`);
      return;
    }

    setToast(`✓ 트리아지 등록 완료 (Subject ${subjectId}) · 백엔드 미연동 — 데모 모드`);
    reset();
    setTimeout(() => setToast(null), 3500);
  }

  // 폼 상태 → DemoPatient 형태 (공용 사이드바에 그대로 전달, 편집 모드)
  const formPatient: DemoPatient = {
    id: "triage-input",
    name,
    age: age === "" ? 0 : age,
    sex,
    ktas,
    chief,
    mrn: subjectId || undefined,
    registeredAt: new Date().toISOString(),
    arrivedAt: admission ? new Date(admission).toISOString() : new Date().toISOString(),
    ecg: "pending", cxr: "pending", lab: "pending",
    aiStatus: "pending",
    vitals: {
      hr: hr === "" ? null : hr,
      sbp: sbp === "" ? null : sbp,
      dbp: dbp === "" ? null : dbp,
      rr: rr === "" ? null : rr,
      spo2: spo2 === "" ? null : spo2,
      bt: bt === "" ? null : bt,
    },
    pastHistory: (Object.keys(pastHx) as PastHistoryCode[]).filter((k) => pastHx[k]),
    allergies: allergies || undefined,
    medications: meds || undefined,
    notes: notes || undefined,
  };

  const setVital = (key: "hr" | "sbp" | "dbp" | "rr" | "spo2" | "bt", val: number | "") => {
    if (key === "hr") setHr(val);
    else if (key === "sbp") setSbp(val);
    else if (key === "dbp") setDbp(val);
    else if (key === "rr") setRr(val);
    else if (key === "spo2") setSpo2(val);
    else setBt(val);
  };

  const editHandlers: SidebarEdit = {
    admission,
    setKtas, setName, setAge, setSex, setSubjectId, setAdmission, setChief,
    setVital,
    togglePastHx: (code) => setPastHx((prev) => ({ ...prev, [code]: !prev[code] })),
    setAllergies, setMeds, setNotes,
  };

  // 사이드바 하단 액션 (별도 툴바 없이 입력 사이드바 안에 통합)
  const sidebarFooter = (
    <div className="space-y-2">
      <div className="flex gap-2">
        <button
          onClick={listening ? stop : startVoice}
          disabled={!micSupported}
          title={micSupported ? "음성으로 환자정보 입력" : "이 브라우저는 음성 인식 미지원 (Chrome·Edge 권장)"}
          className={cn(
            "flex-1 inline-flex items-center justify-center gap-1.5 h-9 rounded-lg font-bold text-[12px] transition-colors",
            listening ? "bg-red-600 text-white hover:bg-red-700 animate-pulse" : "bg-gradient-to-br from-brand-500 to-ai-accent text-white hover:opacity-90",
            !micSupported && "opacity-50 cursor-not-allowed",
          )}
        >
          {listening ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
          {listening ? "음성 중지" : "음성 입력"}
        </button>
        <button
          onClick={reset}
          className="inline-flex items-center justify-center gap-1.5 h-9 px-3 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 dark:border-vuno-border dark:text-vuno-muted dark:hover:bg-vuno-elevated font-bold text-[12px] transition-colors"
        >
          <RotateCcw className="h-3.5 w-3.5" /> 초기화
        </button>
      </div>
      <button
        onClick={submit}
        disabled={submitting || !canSubmit}
        title={canSubmit ? "" : "필수: 등록번호 · 환자명 · 나이 · 주호소"}
        className="w-full inline-flex items-center justify-center gap-2 h-11 rounded-lg bg-brand-600 text-white hover:bg-brand-700 font-bold text-[15px] shadow-sm disabled:bg-slate-300 disabled:text-white/70 dark:disabled:bg-vuno-elevated disabled:cursor-not-allowed transition-colors"
      >
        <Rocket className="h-4 w-4" /> {submitting ? "전송 중…" : "AI 분석 시작"}
      </button>
      {!canSubmit && <div className="text-[11px] text-amber-600 dark:text-amber-400 text-center">필수: 등록번호 · 환자명 · 나이 · 주호소</div>}
    </div>
  );

  return (
    <AppShell>
      {/* 음성 인식 패널 */}
      {(listening || transcript || interim) && (
        <div className="border-b border-brand-200 bg-brand-50 dark:bg-brand-500/10 dark:border-brand-500/40 px-5 py-3">
          <div className="flex items-center gap-2 mb-1.5">
            {listening ? (
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75 animate-ping" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
              </span>
            ) : <Mic className="h-4 w-4 text-brand-600 dark:text-brand-300" />}
            <span className="text-[13px] font-bold text-brand-700 dark:text-brand-300">
              {listening ? "듣는 중… 또박또박 말씀해 주세요" : "음성 인식 결과"}
            </span>
            <div className="ml-auto flex items-center gap-2">
              {!listening && transcript && (
                <button onClick={() => applyParsed(transcript)} className="inline-flex items-center gap-1 h-7 px-2.5 rounded-lg bg-brand-600 text-white hover:bg-brand-700 font-bold text-[11px]">
                  <Wand2 className="h-3 w-3" /> 자동 채우기
                </button>
              )}
              <button onClick={() => { resetVoice(); appliedRef.current = false; }} className="inline-flex items-center gap-1 h-7 px-2.5 rounded-lg border border-brand-300 dark:border-brand-500/40 text-brand-700 dark:text-brand-300 hover:bg-brand-100/60 font-bold text-[11px]">
                <Trash2 className="h-3 w-3" /> 지우기
              </button>
            </div>
          </div>
          <p className="text-[13px] leading-relaxed text-slate-700 dark:text-slate-200 min-h-[1.25rem]">
            {transcript} <span className="text-slate-400 dark:text-vuno-dim">{interim}</span>
            {!transcript && !interim && (
              <span className="text-slate-400 dark:text-vuno-dim">예: “55세 남자, 등록번호 12345678, 혈압 140에 90, 맥박 100, KTAS 2, 주호소 흉통”</span>
            )}
          </p>
        </div>
      )}

      {/* 좌: 입력 사이드바(고정) / 우: 테스트케이스 + 환자목록 */}
      <div className="bg-slate-100 dark:bg-vuno-bg grid grid-cols-1 lg:grid-cols-[390px_1fr] lg:items-start">
        {/* 좌: 읽기 사이드바와 동일 스타일·크기, 편집 가능, 스크롤 고정 */}
        <PatientInfoSidebar
          patient={formPatient}
          edit={editHandlers}
          footer={sidebarFooter}
          className="h-full lg:self-start lg:sticky lg:top-14 lg:h-[calc(100vh-3.5rem)]"
        />

        {/* 우: 테스트 케이스 + 환자 목록 */}
        <div className="min-w-0 p-4 space-y-3">
          {/* 테스트 케이스 */}
          <div>
            <div className="text-[12px] font-bold text-slate-500 dark:text-vuno-muted mb-1.5">테스트 케이스 · 클릭하면 자동 입력</div>
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-2">
              {caseList.map((p) => {
                const meta = KTAS_META[p.ktas];
                const active = selectedId === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => selectPatient(p)}
                    className={cn(
                      "text-left rounded-lg border p-2 transition-colors",
                      active ? "border-brand-500 bg-brand-50 dark:bg-brand-500/15 dark:border-brand-500/50" : "border-slate-200 bg-white hover:border-slate-300 dark:border-vuno-border dark:bg-vuno-surface dark:hover:bg-vuno-elevated",
                    )}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="text-[13px] font-bold text-slate-900 dark:text-white">{p.name}</span>
                      <span className="text-[11px] text-slate-400">{p.age}/{p.sex === "M" ? "남" : "여"}</span>
                      <span className={cn("ml-auto px-1.5 py-0.5 rounded text-[9px] font-bold text-white", meta.bg)}>K{p.ktas}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-vuno-muted truncate mt-0.5">{p.chief}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 환자 목록 */}
          <div className="bg-white dark:bg-vuno-surface border border-slate-200 dark:border-vuno-border rounded-xl shadow-sm overflow-hidden">
            <div className="px-4 py-2.5 border-b border-slate-200 dark:border-vuno-border flex items-center gap-2">
              <span className="text-[14px] font-bold text-slate-900 dark:text-white">환자 목록</span>
              <span className="text-[12px] text-slate-400 dark:text-vuno-dim font-numeric">Total {allPatients.length}명</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="bg-slate-50 dark:bg-vuno-bg text-slate-500 dark:text-vuno-muted text-[12px] border-b border-slate-200 dark:border-vuno-border">
                    <th className="text-left px-3 py-2 font-semibold w-10">No.</th>
                    <th className="text-left px-3 py-2 font-semibold">등록번호</th>
                    <th className="text-left px-3 py-2 font-semibold">환자명</th>
                    <th className="text-left px-3 py-2 font-semibold w-20">나이/성별</th>
                    <th className="text-center px-3 py-2 font-semibold w-14">KTAS</th>
                    <th className="text-left px-3 py-2 font-semibold">주증상</th>
                    <th className="text-center px-3 py-2 font-semibold w-24">검사상태</th>
                  </tr>
                </thead>
                <tbody>
                  {allPatients.map((p, i) => {
                    const meta = KTAS_META[p.ktas];
                    const ex = examOf(p);
                    return (
                      <tr
                        key={p.id}
                        onClick={() => nav(patientHref(p))}
                        className="border-b border-slate-100 dark:border-vuno-divider hover:bg-slate-50 dark:hover:bg-vuno-elevated cursor-pointer"
                      >
                        <td className="px-3 py-2 text-slate-400 dark:text-vuno-dim font-numeric">{i + 1}</td>
                        <td className="px-3 py-2 font-numeric text-brand-600 underline">{regNo(p)}</td>
                        <td className="px-3 py-2 font-bold text-slate-900 dark:text-white">{p.name}</td>
                        <td className="px-3 py-2 text-slate-500 dark:text-vuno-muted font-numeric">{p.age}/{p.sex === "M" ? "남" : "여"}</td>
                        <td className="px-3 py-2 text-center">
                          <span className={cn("inline-block px-1.5 py-0.5 rounded text-[11px] font-bold text-white", meta.bg)}>{p.ktas}</span>
                        </td>
                        <td className="px-3 py-2 text-slate-600 dark:text-vuno-muted max-w-[220px] truncate">{p.chief}</td>
                        <td className="px-3 py-2 text-center">
                          <span className={cn(
                            "inline-block px-2 py-0.5 rounded text-[11px] font-bold border",
                            ex === "done" ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/40" :
                            ex === "analyzing" ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/40" :
                            "bg-slate-50 text-slate-500 border-slate-200 dark:bg-vuno-bg dark:text-vuno-muted dark:border-vuno-border",
                          )}>
                            {ex === "done" ? "검사 완료" : ex === "analyzing" ? "분석 중" : "검사 대기"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* 토스트 */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-md bg-slate-800 text-white text-base font-bold shadow-lg">
          {toast}
        </div>
      )}
    </AppShell>
  );
}
