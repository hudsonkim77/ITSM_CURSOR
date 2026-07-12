import type { LucideIcon } from "lucide-react";
import {
  Activity, AlertTriangle, Bell, Boxes, Cable, DatabaseBackup, FlaskConical,
  GitBranch, Inbox, Layers, Rocket, Search,
} from "lucide-react";

export const ICONS: Record<string, LucideIcon> = {
  GitBranch, AlertTriangle, Boxes, Search, Rocket, Inbox, Gauge: Activity,
  Layers, Activity, Bell, FlaskConical, Cable, DatabaseBackup,
};

// 상태/심각도 문자열 -> chip 색상. 값이 다양해도 키워드로 분류한다.
export function statusChip(value: string): string {
  const v = (value || "").toLowerCase();
  if (!v.trim()) return "bg-slate-100 text-slate-500";
  if (/(완료|승인|정상|해결|성공|pass|closed|resolved|active|ok)/.test(v))
    return "bg-emerald-100 text-emerald-700";
  if (/(진행|검토|접수|등록|계획|open|검사|측정)/.test(v))
    return "bg-brand-100 text-brand-700";
  if (/(높음|긴급|위반|실패|장애|fail|critical|breach|롤백|보류)/.test(v))
    return "bg-rose-100 text-rose-700";
  if (/(중간|경고|대기|warn|hold)/.test(v))
    return "bg-amber-100 text-amber-700";
  return "bg-slate-100 text-slate-600";
}

// 어떤 컬럼을 "상태처럼" 칩으로 표시할지
export function isStatusColumn(name: string): boolean {
  return /(STATUS|SEVERITY|IMPACT_LEVEL|TEST_RESULT|BREACH_YN|ROLLBACK_YN)/.test(name);
}
