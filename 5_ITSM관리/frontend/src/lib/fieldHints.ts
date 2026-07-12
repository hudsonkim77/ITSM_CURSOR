/** 도메인 폼 필드 힌트 — 상태/유형/YN/날짜 입력 유형 */

export type FieldControl = "text" | "textarea" | "select" | "date" | "datetime";

export interface FieldHint {
  control: FieldControl;
  options?: string[];
}

const LONG = /(DESC|NOTE|SUMMARY|CAUSE|ACTION_TAKEN|WORKAROUND|PERMANENT_FIX|IMPACT_DESC|RELATED|WORK_NOTE|METRIC_SUMMARY)/;
const DATE = /(_DT|_DATE)$/;
const DATETIME_HINT = /(DETECTED_DT|RESOLVED_DT|PLANNED_DT|APPLIED_DT|DEPLOYED_DT|CREATED_DT|APPROVED_DT|BACKUP_DT|TESTED_DT|LAST_CHECK_DT|CHECK_DT|REQUESTED_DT|COMPLETED_DT|INST_DT)/;
const YN = /(_YN|BREACH_YN|ROLLBACK_YN)$/;
const ENUM_COL = /(STATUS|TYPE|SEVERITY|IMPACT_LEVEL|CATEGORY|PROTOCOL|ACTION_TYPE|METRIC_TYPE|TEST_RESULT|PERIOD)/;

/** 표준 선택값 (데이터에 없어도 폼에 제공) */
export const STANDARD_OPTIONS: Record<string, string[]> = {
  CHG_STATUS: ["접수", "검토", "승인", "진행", "완료", "반려", "취소"],
  CHG_TYPE: ["표준", "긴급", "일반"],
  INCIDENT_STATUS: ["접수", "분석", "조치중", "종료"],
  SEVERITY: ["SEV1", "SEV2", "SEV3", "SEV4"],
  IMPACT_LEVEL: ["낮음", "중간", "높음", "긴급"],
  PROBLEM_TYPE: ["근본원인", "알려진오류", "기타"],
  DEPLOY_STATUS: ["계획", "진행", "완료", "롤백"],
  DEPLOY_TYPE: ["정기", "긴급", "핫픽스"],
  REQ_TYPE: ["서비스요청", "정보요청", "접근요청", "기타"],
  EVENT_STATUS: ["신규", "인지", "확대", "종료"],
  EVENT_TYPE: ["경고", "장애징후", "정보"],
  TEST_RESULT: ["PASS", "FAIL", "SKIP", "BLOCKED"],
  TEST_TYPE: ["기능", "회귀", "통합", "성능"],
  PROTOCOL: ["HTTPS", "HTTP", "SFTP", "DB", "MQ", "기타"],
  ACTION_TYPE: ["FULL", "INCREMENTAL", "RESTORE"],
  STATUS: ["Active", "OPERATIONAL", "STANDBY", "Inactive", "Decommissioned"],
  BREACH_YN: ["Y", "N"],
  ROLLBACK_YN: ["Y", "N"],
};

export function fieldHint(column: string, distinctValues: string[] = []): FieldHint {
  if (LONG.test(column)) return { control: "textarea" };
  if (YN.test(column) || column === "BREACH_YN" || column === "ROLLBACK_YN") {
    return { control: "select", options: mergeOpts(column, ["Y", "N"], distinctValues) };
  }
  if (DATE.test(column)) {
    // 시분이 포함된 기존 값이 있으면 datetime, 아니면 date
    const hasTime = distinctValues.some((v) => /\d{1,2}:\d{2}/.test(v));
    return { control: hasTime || DATETIME_HINT.test(column) ? "datetime" : "date" };
  }
  if (ENUM_COL.test(column)) {
    return { control: "select", options: mergeOpts(column, STANDARD_OPTIONS[column] || [], distinctValues) };
  }
  return { control: "text" };
}

function mergeOpts(_column: string, base: string[], fromData: string[]): string[] {
  const set = new Set<string>([...base, ...fromData.filter(Boolean)]);
  // keep standard order first, then extras
  const ordered = [...base];
  for (const v of [...set].sort((a, b) => a.localeCompare(b, "ko"))) {
    if (!ordered.includes(v)) ordered.push(v);
  }
  return ordered;
}

/** 행 데이터에서 컬럼별 distinct 값 추출 */
export function distinctByColumn(rows: Record<string, string>[], columns: string[]): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const c of columns) {
    const s = new Set<string>();
    for (const r of rows) {
      const v = (r[c] || "").trim();
      if (v) s.add(v);
    }
    out[c] = [...s];
  }
  return out;
}
