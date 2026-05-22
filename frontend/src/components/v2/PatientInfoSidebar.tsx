// say-6 v2 — 환자 정보 좌측 사이드바 (환자 상세 / 소견서 / 트리아지 공용)
// 환자 헤더 · 기본정보 · 주증상 · 활력징후 · 과거력/알레르기 · 메모
// edit prop을 주면 동일한 스타일/크기 그대로 "입력 가능"한 폼이 됨 (환자정보입력 페이지용)

import { useEffect, useState } from "react";
import { KTAS_META, type KTAS, type Sex, PAST_HISTORY_LABELS, type PastHistoryCode } from "../../types/triage";
import type { DemoPatient } from "../../lib/v2/demoStore";
import { cn } from "../../lib/cn";

export function fmtTime(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleString("ko-KR", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

const PAST_HX_CODES: PastHistoryCode[] = ["HTN", "DM", "CAD", "CVA", "COPD", "ASTHMA", "CKD", "AFIB"];
type VitalKey = "hr" | "sbp" | "dbp" | "rr" | "spo2" | "bt";

/** edit prop — 주면 사이드바가 입력 폼이 됨 (스타일/크기는 읽기 전용과 동일) */
export interface SidebarEdit {
  admission: string; // datetime-local 값
  setKtas: (k: KTAS) => void;
  setName: (v: string) => void;
  setAge: (v: number | "") => void;
  setSex: (v: Sex) => void;
  setSubjectId: (v: string) => void;
  setAdmission: (v: string) => void;
  setChief: (v: string) => void;
  setVital: (key: VitalKey, v: number | "") => void;
  togglePastHx: (code: PastHistoryCode) => void;
  setAllergies: (v: string) => void;
  setMeds: (v: string) => void;
  setNotes: (v: string) => void;
}

export function PatientInfoSidebar({
  patient, edit, className = "h-full", footer,
}: {
  patient: DemoPatient;
  edit?: SidebarEdit;
  className?: string;
  footer?: React.ReactNode; // 하단 고정 액션 영역 (트리아지: 음성입력·초기화·AI 분석 시작)
}) {
  const meta = KTAS_META[patient.ktas as KTAS];
  const v = patient.vitals;
  // 메모 — 읽기 전용 모드의 로컬 편집 (데모 세션 한정)
  const [memo, setMemo] = useState(patient.notes ?? "");
  useEffect(() => { setMemo(patient.notes ?? ""); }, [patient.id, patient.notes]);

  const vitalRows: [string, number | null, string, boolean, VitalKey][] = [
    ["HR", v.hr, "bpm", !!v.hr && (v.hr < 50 || v.hr > 120), "hr"],
    ["SBP", v.sbp, "mmHg", !!v.sbp && (v.sbp < 90 || v.sbp > 160), "sbp"],
    ["DBP", v.dbp, "mmHg", false, "dbp"],
    ["RR", v.rr, "/min", !!v.rr && (v.rr < 10 || v.rr > 24), "rr"],
    ["SpO₂", v.spo2, "%", !!v.spo2 && v.spo2 < 95, "spo2"],
    ["BT", v.bt, "℃", !!v.bt && (v.bt < 36 || v.bt > 38), "bt"],
  ];

  const inlineInput =
    "bg-transparent focus:outline-none focus:bg-brand-50/60 dark:focus:bg-brand-500/10 rounded transition-colors";

  return (
    <aside className={className}>
      <div className="bg-white dark:bg-vuno-surface border border-slate-300 dark:border-vuno-border shadow-sm h-full flex flex-col overflow-y-auto">
        {/* 환자 헤더 */}
        <div className="px-4 py-3.5 border-b border-slate-200 dark:border-vuno-border">
          {edit ? (
            <div className="flex gap-1 mb-2">
              {([1, 2, 3, 4, 5] as KTAS[]).map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => edit.setKtas(k)}
                  className={cn(
                    "flex-1 h-6 rounded text-[10px] font-bold transition-colors",
                    patient.ktas === k ? cn(KTAS_META[k].bg, "text-white shadow-sm") : "bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-vuno-bg dark:text-vuno-muted",
                  )}
                >
                  K{k}
                </button>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2 mb-1.5">
              <span className={cn("inline-block px-2 py-0.5 text-[11px] font-bold text-white", meta.bg)}>
                KTAS {patient.ktas} · {meta.label}
              </span>
            </div>
          )}

          {edit ? (
            <input
              value={patient.name}
              onChange={(e) => edit.setName(e.target.value)}
              placeholder="환자명"
              className={cn("w-full text-2xl font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-vuno-border focus:border-brand-500 pb-0.5 placeholder:text-slate-300 dark:placeholder:text-vuno-dim", inlineInput)}
            />
          ) : (
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{patient.name}</div>
          )}

          {edit ? (
            <div className="flex items-center gap-2 mt-2">
              <div className="flex gap-1">
                {(["M", "F"] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => edit.setSex(s)}
                    className={cn(
                      "h-7 w-9 rounded border text-[12px] font-bold transition-colors",
                      patient.sex === s ? "bg-brand-600 border-transparent text-white" : "bg-slate-50 border-slate-200 text-slate-500 dark:bg-vuno-bg dark:border-vuno-border dark:text-vuno-muted",
                    )}
                  >
                    {s === "M" ? "남" : "여"}
                  </button>
                ))}
              </div>
              <input
                type="number"
                value={patient.age || ""}
                onChange={(e) => edit.setAge(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="나이"
                className={cn("w-14 text-[13px] font-numeric text-slate-700 dark:text-slate-200 border-b border-slate-200 dark:border-vuno-border focus:border-brand-500 text-right px-1", inlineInput)}
              />
              <span className="text-[13px] text-slate-500 dark:text-vuno-muted">세</span>
            </div>
          ) : (
            <div className="text-[13px] text-slate-500 dark:text-vuno-muted font-numeric mt-0.5">
              {patient.sex === "M" ? "남" : "여"} / {patient.age}세
            </div>
          )}
        </div>

        {/* 기본정보 */}
        <div className="px-4 py-3.5 border-b border-slate-200 dark:border-vuno-border">
          <SidebarLabel>기본정보</SidebarLabel>
          {edit ? (
            <>
              <InfoRow label="등록번호" value={
                <input
                  value={patient.mrn ?? ""}
                  onChange={(e) => edit.setSubjectId(e.target.value)}
                  placeholder="MRN"
                  className={cn("w-32 text-right font-numeric text-[13px] text-slate-800 dark:text-white border-b border-slate-200 dark:border-vuno-border focus:border-brand-500 placeholder:text-slate-300", inlineInput)}
                />
              } />
              <InfoRow label="내원 일시" value={
                <input
                  type="datetime-local"
                  value={edit.admission}
                  onChange={(e) => edit.setAdmission(e.target.value)}
                  className={cn("text-[12px] text-slate-800 dark:text-white dark:[color-scheme:dark]", inlineInput)}
                />
              } />
            </>
          ) : (
            <>
              <InfoRow label="등록번호" value={<span className="font-numeric break-all">{patient.mimic?.subject_id ?? patient.mrn ?? patient.id}</span>} />
              {patient.mimic?.subject_id && (
                <InfoRow label="데이터원" value={<span className="text-vuno-cyanDim font-bold">MIMIC-IV</span>} />
              )}
              <InfoRow label="도착시각" value={<span className="whitespace-nowrap">{fmtTime(patient.arrivedAt)}</span>} />
              <InfoRow label="등록시각" value={<span className="whitespace-nowrap">{fmtTime(patient.registeredAt)}</span>} />
            </>
          )}
        </div>

        {/* 주증상 */}
        <div className="px-4 py-3.5 border-b border-slate-200 dark:border-vuno-border">
          <SidebarLabel>주증상 (Chief Complaint){edit && <span className="text-brand-600 ml-0.5">*</span>}</SidebarLabel>
          {edit ? (
            <textarea
              value={patient.chief}
              onChange={(e) => edit.setChief(e.target.value)}
              rows={2}
              placeholder="예: 흉통, 호흡곤란 30분 전 발생"
              className={cn("w-full text-[13px] text-slate-700 dark:text-slate-200 leading-relaxed resize-none border border-slate-200 dark:border-vuno-border rounded-md px-2 py-1.5 focus:border-brand-500 placeholder:text-slate-300", inlineInput)}
            />
          ) : (
            <p className="text-[13px] text-slate-700 dark:text-slate-200 leading-relaxed">{patient.chief}</p>
          )}
        </div>

        {/* 활력징후 */}
        <div className="px-4 py-3.5 border-b border-slate-200 dark:border-vuno-border">
          <SidebarLabel>활력징후 (Vital Signs)</SidebarLabel>
          <div className="grid grid-cols-3 gap-1.5">
            {vitalRows.map(([label, val, unit, abn, key]) => (
              <div key={label} className={cn(
                "border px-2 py-1.5",
                abn ? "border-red-200 dark:border-red-500/40 bg-red-50 dark:bg-red-500/15" : "border-slate-200 dark:border-vuno-border bg-slate-50 dark:bg-vuno-bg",
              )}>
                <div className="text-[10px] text-slate-500 dark:text-vuno-muted whitespace-nowrap">{label}</div>
                {edit ? (
                  <div className="flex items-baseline">
                    <input
                      type="number"
                      value={val ?? ""}
                      onChange={(e) => edit.setVital(key, e.target.value === "" ? "" : Number(e.target.value))}
                      placeholder="—"
                      className={cn("w-full font-numeric font-bold text-[14px] focus:outline-none placeholder:text-slate-300 dark:placeholder:text-vuno-dim", abn ? "text-red-600 dark:text-red-300 bg-transparent" : "text-slate-900 dark:text-white bg-transparent")}
                    />
                    <span className="text-[9px] font-normal text-slate-400 dark:text-vuno-dim ml-0.5">{unit}</span>
                  </div>
                ) : (
                  <div className={cn("font-numeric font-bold text-[14px] whitespace-nowrap", abn ? "text-red-600 dark:text-red-300" : "text-slate-900 dark:text-white")}>
                    {val ?? "—"}<span className="text-[9px] font-normal text-slate-400 dark:text-vuno-dim ml-0.5">{unit}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 과거력 / 알레르기 */}
        <div className="px-4 py-3.5 border-b border-slate-200 dark:border-vuno-border">
          <SidebarLabel>과거력 / 알레르기</SidebarLabel>
          {edit ? (
            <div className="flex flex-wrap gap-1 mb-2">
              {PAST_HX_CODES.map((code) => {
                const on = (patient.pastHistory ?? []).includes(code);
                return (
                  <button
                    key={code}
                    type="button"
                    onClick={() => edit.togglePastHx(code)}
                    title={PAST_HISTORY_LABELS[code]}
                    className={cn(
                      "px-1.5 py-0.5 text-[11px] font-bold border transition-colors",
                      on ? "border-brand-600 bg-brand-600 text-white" : "border-slate-300 bg-slate-50 text-slate-600 hover:bg-white dark:border-vuno-border dark:bg-vuno-bg dark:text-vuno-muted",
                    )}
                  >
                    {code}
                  </button>
                );
              })}
            </div>
          ) : (patient.pastHistory && patient.pastHistory.length > 0 ? (
            <div className="flex flex-wrap gap-1 mb-2">
              {patient.pastHistory.map((h) => (
                <span key={h} className="px-1.5 py-0.5 text-[11px] font-bold bg-slate-100 dark:bg-vuno-bg dark:text-slate-200 border border-slate-300 dark:border-vuno-border" title={PAST_HISTORY_LABELS[h]}>
                  {h}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-[12px] text-slate-400 dark:text-vuno-dim mb-2">과거력 없음</p>
          ))}
          {edit ? (
            <>
              <div className="flex items-center gap-1 text-[12px] mb-1">
                <span className="text-slate-400 dark:text-vuno-dim flex-shrink-0">알레르기</span>
                <input value={patient.allergies ?? ""} onChange={(e) => edit.setAllergies(e.target.value)} placeholder="NKDA"
                  className={cn("flex-1 text-[12px] text-slate-600 dark:text-slate-200 border-b border-slate-200 dark:border-vuno-border focus:border-brand-500 placeholder:text-slate-300", inlineInput)} />
              </div>
              <div className="flex items-center gap-1 text-[12px]">
                <span className="text-slate-400 dark:text-vuno-dim flex-shrink-0">복용약</span>
                <input value={patient.medications ?? ""} onChange={(e) => edit.setMeds(e.target.value)} placeholder="없음"
                  className={cn("flex-1 text-[12px] text-slate-600 dark:text-slate-200 border-b border-slate-200 dark:border-vuno-border focus:border-brand-500 placeholder:text-slate-300", inlineInput)} />
              </div>
            </>
          ) : (
            <>
              <div className="text-[12px] text-slate-600 dark:text-vuno-muted">
                <span className="text-slate-400 dark:text-vuno-dim">알레르기 </span>{patient.allergies || "NKDA"}
              </div>
              {patient.medications && (
                <div className="text-[12px] text-slate-600 dark:text-vuno-muted mt-0.5 leading-relaxed">
                  <span className="text-slate-400 dark:text-vuno-dim">복용약 </span>{patient.medications}
                </div>
              )}
            </>
          )}
        </div>

        {/* 메모 — 남은 공간 채움 */}
        <div className="px-4 py-3.5 flex-1 flex flex-col">
          <SidebarLabel>메모 (Notes)</SidebarLabel>
          <textarea
            value={edit ? (patient.notes ?? "") : memo}
            onChange={(e) => (edit ? edit.setNotes(e.target.value) : setMemo(e.target.value))}
            placeholder="환자 특이사항 · 인계 메모를 입력하세요"
            className="flex-1 min-h-[100px] w-full px-2.5 py-2 text-[12px] leading-relaxed border border-slate-200 dark:border-vuno-border bg-slate-50 dark:bg-vuno-bg dark:text-white dark:placeholder:text-vuno-dim focus:outline-none focus:border-vuno-cyan focus:bg-white dark:focus:bg-vuno-bg resize-none"
          />
        </div>

        {/* 하단 액션 (트리아지 입력 모드에서만) */}
        {footer && (
          <div className="px-4 py-3 border-t border-slate-200 dark:border-vuno-border">{footer}</div>
        )}
      </div>
    </aside>
  );
}

function SidebarLabel({ children }: { children: React.ReactNode }) {
  return <div className="text-[11px] font-bold text-slate-500 dark:text-vuno-muted tracking-wide mb-1.5 whitespace-nowrap">{children}</div>;
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-2 text-[13px] py-0.5 items-center">
      <span className="text-slate-500 dark:text-vuno-muted flex-shrink-0">{label}</span>
      <span className="text-slate-800 dark:text-white font-medium text-right">{value}</span>
    </div>
  );
}
