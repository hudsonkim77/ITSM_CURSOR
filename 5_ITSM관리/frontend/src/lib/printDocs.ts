/** 도메인별 공단 공통 양식 문서명 */
export const DOMAIN_DOC_TITLES: Record<string, string> = {
  change: "변경기능명세서",
  incident: "장애보고서",
  config: "신규자산등록명세서",
  problem: "문제보고서",
  deploy: "배포관리명세서",
  request: "요청명세서",
  sla: "SLA 명세서",
  baseline: "형상등록명세서",
  test: "테스트결과보고서",
};

export const ORG_NAME = "AI활성화진흥공단";
export const ORG_DEPT = "정보시스템실";
export const DRAFTER_STORAGE_KEY = "itsm_drafter_name";

export function docTitleFor(domainKey: string, domainTitle: string): string {
  return DOMAIN_DOC_TITLES[domainKey] || `${domainTitle} 명세서`;
}

export function hasOfficialDoc(domainKey: string): boolean {
  return domainKey in DOMAIN_DOC_TITLES;
}

export function getStoredDrafter(): string {
  try {
    return localStorage.getItem(DRAFTER_STORAGE_KEY) || "";
  } catch {
    return "";
  }
}

export function setStoredDrafter(name: string): void {
  try {
    localStorage.setItem(DRAFTER_STORAGE_KEY, name.trim());
  } catch {
    /* ignore */
  }
}

export function todayKo(): string {
  const d = new Date();
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
}

export function todayIso(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
