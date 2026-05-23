# 실 저장소 검증 — subject 18230098 (양정인, NSTEMI)

> Aurora `central_db`에 실제 저장된 내용 (ECS 배포 컨테이너 E2E 결과).
> encounter_id = `fbc82472-c8e3-4553-ba4b-be4073acf134` / 조회는 `WHERE subject_id='18230098'`.

## 저장 위치 한눈에

| 데이터 | 테이블 | 저장 주체 | 식별 키 |
|---|---|---|---|
| 환자/방문 | `encounters` | orchestrator (트리아지 제출) | `encounter_id` (PK) + `subject_id` |
| 모달 판독(ECG/CXR/LAB) | `modal_results` | **이중**: 모달 서비스 + orchestrator UPSERT | `(encounter_id, modality)` UNIQUE |
| 6h 악화예측 | `modal_results.raw_response.prognosis_6h` | lab-svc `/predict_6h` 결과 병합 | 〃 |
| 소견서 | `diagnostic_reports` | **RAG-svc** (Bedrock 생성 후 직접 UPSERT) | `encounter_id` UNIQUE |
| 이벤트 타임라인 | `modal_events` | orchestrator (WebSocket broadcast 로그) | — |

- **RAG 벡터DB(ChromaDB)**: 런타임 쓰기 없음 — 유사사례 **검색(read-only)** 만. 소견서는 위 `diagnostic_reports`에 저장.
- `subject_id`는 `encounters`가 원천이고, 나머지 테이블엔 `_fill_subject_id()` **트리거가 encounter_id로 룩업해 자동 복제** → 환자 단위 조회 가능.

---

## 1) encounters
```
encounter_id : fbc82472-c8e3-4553-ba4b-be4073acf134
subject_id   : 18230098
patient_name : 양정인
patient_age  : 86
patient_gender: female
chief_complaint: Chest Pain
status       : active
started_at   : 2026-05-23 14:23:25
```

## 2) modal_results (모달 3종 — 실제 raw_response)

### ECG — risk=urgent
| finding | 신뢰도 | severity | 권고 |
|---|---|---|---|
| heart_failure | 77.2% | moderate | BNP/NT-proBNP 검사 및 이뇨제 |
| chronic_ihd | 67.6% | mild | 심장내과 협진 |
| hf_detail | 71.8% | moderate | BNP/NT-proBNP 검사 및 이뇨제 |
| acute_kidney_failure | 31.0% | mild | 신장내과 협진·전해질 모니터링 |
| (+ chronic_kidney) | … | … | … |

### CXR — risk=urgent
| finding | 근거 | 비고 |
|---|---|---|
| Cardiomegaly | CTR 0.5741(>0.5) + DenseNet 0.67 | UNet+DenseNet 교차검증, "Moderate cardiomegaly (CTR 0.57)" |
| Pleural_Effusion | DenseNet 0.54(>0.51) | detected=true |
| (+ Edema, Atelectasis 등 총 7) | … | impression: "Severe pulmonary edema…" |

### LAB — risk=critical
| finding | 값 | 해석 |
|---|---|---|
| critical_troponin_high | Troponin T 0.25 ng/mL | **급성 심근손상 → NSTEMI/STEMI 의심** |
| critical_ntprobnp_high | NT-proBNP 23,468 pg/mL (정상 ≤624) | 중증 심부전 악화 |
| cardiac_glucose_high | 266 mg/dL | MI 예후 불량 인자 |
| (+ creatinine/hemoglobin 등 총 7) | … | profile: CARDIAC |

### LAB.prognosis_6h (6시간 후 악화 예측, XGBoost)
```json
{
  "warnings": ["Hemoglobin 감소", "Creatinine 증가"],
  "creatinine_up": 0.9421,
  "hemoglobin_down": 0.7247,
  "lactate_up": 0.398,
  "potassium_worse": 0.3842,
  "troponin_up": 0.1244
}
```

## 3) diagnostic_reports (소견서)
```
status        : preliminary      (서명 전; signed_by = NULL)
ai_risk_level : routine
ai_diagnosis  : 2,506자 (주증상·현병력·검사소견·RAG 참고근거·5개 감별진단·치료계획)
encounter_id  : fbc82472…  / subject_id 18230098
```
- 진단: ① 급성 심부전 ② ACS/급성 심근손상(트로포닌↑) ③ AKI/CKD ④ 폐렴 vs 무기폐 ⑤ 빈혈
- RAG 참고: 유사 영상소견 사례 2건(유사도 0.5655 / 0.5649)과 공통점·차이점 기술

## 4) modal_events (타임라인)
```
encounter_created ×1 → initial_proposal ×1 → order_placed ×3
→ modal_started ×4 → modal_completed ×4 → next_proposal ×2
→ ready_for_report ×2 → report_generated ×1
```

---

## 핵심 검증 결론
- **1차 ECG → (ECG 결과 기반) 2차 LAB 자동 체인** 발화 (근거: "ECG만으론 ACS 확진 어려움 → 혈액검사로 확정")
- **3모달 전부 실 MIMIC 데이터 판독 + 이중 저장**(모달 서비스 + 중앙 UPSERT)
- **LAB 룰엔진 + 6h 예측** 둘 다 저장
- **RAG 유사사례 검색 → Bedrock 소견서** 생성·저장(diagnostic_reports)
- 전 구간 **ECS 배포 컨테이너** (CloudFront→ALB→orchestrator→모달→HAPI(EC2)→Aurora)
