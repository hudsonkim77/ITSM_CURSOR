/**
 * ITSM_CURSOR 로컬 개발 WBS.
 * 과업을 끝낼 때마다 status / progress 를 갱신한다.
 * overall 은 하위 task progress 단순 평균.
 */

export type TaskStatus = "done" | "in_progress" | "pending" | "deferred";

export interface WbsTask {
  id: string;
  name: string;
  progress: number; // 0–100
  status: TaskStatus;
  note?: string;
}

export interface WbsPhase {
  id: string;
  name: string;
  goal: string;
  tasks: WbsTask[];
}

export const WBS_META = {
  title: "ITSM_CURSOR 구축 WBS",
  updatedAt: "2026-07-12",
  strategy: "로컬 구축·검증 완료. 프로덕션 단일포트 배포 스크립트와 GitHub main 형상을 최종 반영한다.",
};

export const WBS_PHASES: WbsPhase[] = [
  {
    id: "P1",
    name: "기반 환경",
    goal: "로컬에서 개발·실행이 가능한 토대",
    tasks: [
      { id: "P1.1", name: "프로젝트 골격·README·폴더 구조", progress: 100, status: "done" },
      { id: "P1.2", name: "로컬 실행 (FastAPI :8000 + Vite :5173)", progress: 100, status: "done" },
      { id: "P1.3", name: "GitHub 저장소 초기화·first push", progress: 100, status: "done", note: "hudsonkim77/ITSM_CURSOR" },
      { id: "P1.4", name: "일상 형상관리(커밋/푸시 루틴)", progress: 100, status: "done", note: "최종 main push" },
    ],
  },
  {
    id: "P2",
    name: "데이터·백엔드",
    goal: "wiki CSV 정합성을 유지한 API",
    tasks: [
      { id: "P2.1", name: "도메인 CSV·_HISTORY 이관", progress: 100, status: "done" },
      { id: "P2.2", name: "도메인 목록/조회 API", progress: 100, status: "done" },
      { id: "P2.3", name: "행 등록·삭제 + 이력 append", progress: 100, status: "done" },
      { id: "P2.4", name: "행 수정(Update) API", progress: 100, status: "done", note: "PUT /rows/{id} + UPDATED 이력" },
      { id: "P2.5", name: "대시보드 집계 API", progress: 100, status: "done" },
      { id: "P2.6", name: "경영관리 비밀번호·PDF API", progress: 100, status: "done" },
      { id: "P2.7", name: "ERD mermaid API", progress: 100, status: "done" },
    ],
  },
  {
    id: "P3",
    name: "React 화면 (wiki 동등)",
    goal: "Streamlit 기능을 React로 재구현",
    tasks: [
      { id: "P3.1", name: "레이아웃·사이드바 네비게이션", progress: 100, status: "done" },
      { id: "P3.2", name: "통합 대시보드(KPI·차트)", progress: 95, status: "done" },
      { id: "P3.3", name: "도메인 조회·검색·등록·수정·삭제", progress: 100, status: "done" },
      { id: "P3.4", name: "도메인 이력 드로어", progress: 100, status: "done" },
      { id: "P3.5", name: "경영관리 PDF 열람", progress: 100, status: "done" },
      { id: "P3.6", name: "ERD 화면", progress: 100, status: "done", note: "줌/팬·도메인 outline·한글 테이블명" },
      { id: "P3.7", name: "WBS 진척 화면", progress: 100, status: "done", note: "본 화면" },
    ],
  },
  {
    id: "P4",
    name: "고도화",
    goal: "실무 편의·관계 데이터·입력 UX",
    tasks: [
      { id: "P4.1", name: "행 수정(Edit) UI", progress: 100, status: "done" },
      { id: "P4.2", name: "상태/유형 필터", progress: 100, status: "done" },
      { id: "P4.3", name: "N:M 매핑 테이블 UI (CI_MAP 등)", progress: 100, status: "done", note: "행 선택→연결 패널 CRUD" },
      { id: "P4.4", name: "FK 셀렉트 입력 (장애→변경 등)", progress: 100, status: "done", note: "등록/수정 모달 FK 드롭다운" },
      { id: "P4.5", name: "도메인별 맞춤 등록 폼", progress: 100, status: "done", note: "상태·유형·YN·날짜 컨트롤" },
      { id: "P4.6", name: "UI/UX 폴리시·반응형", progress: 100, status: "done", note: "모바일 햄버거 내비" },
      { id: "P4.7", name: "공단 공통 양식 문서 출력", progress: 100, status: "done", note: "전자결재란·기안자·9종 문서 + 테일러링결과서" },
    ],
  },
  {
    id: "P5",
    name: "품질·산출물·배포",
    goal: "검증·문서·배포 가능 상태",
    tasks: [
      { id: "P5.1", name: "기능 테스트·시나리오 검증", progress: 100, status: "done", note: "smoke 27/27 PASS" },
      { id: "P5.2", name: "구축산출물/업무보고 갱신", progress: 100, status: "done", note: "TST/ARC/PGM/TLR/ADM + 6주차 보고" },
      { id: "P5.3", name: "프론트+백엔드 배포", progress: 100, status: "done", note: "prod.sh·FastAPI SPA 서빙 :8000" },
      { id: "P5.4", name: "정리 후 GitHub 형상 갱신", progress: 100, status: "done", note: "최종 main push" },
    ],
  },
];

export function phaseProgress(phase: WbsPhase): number {
  if (!phase.tasks.length) return 0;
  const sum = phase.tasks.reduce((a, t) => a + t.progress, 0);
  return Math.round(sum / phase.tasks.length);
}

export function overallProgress(phases: WbsPhase[] = WBS_PHASES): number {
  const tasks = phases.flatMap((p) => p.tasks);
  if (!tasks.length) return 0;
  return Math.round(tasks.reduce((a, t) => a + t.progress, 0) / tasks.length);
}

export function statusCounts(phases: WbsPhase[] = WBS_PHASES) {
  const counts = { done: 0, in_progress: 0, pending: 0, deferred: 0, total: 0 };
  for (const t of phases.flatMap((p) => p.tasks)) {
    counts[t.status] += 1;
    counts.total += 1;
  }
  return counts;
}

/** 다음에 손댈 추천 과업 (pending/in_progress, deferred 제외, id 순) */
export function nextTasks(phases: WbsPhase[] = WBS_PHASES, limit = 5): WbsTask[] {
  return phases
    .flatMap((p) => p.tasks)
    .filter((t) => t.status === "in_progress" || t.status === "pending")
    .sort((a, b) => {
      if (a.status !== b.status) return a.status === "in_progress" ? -1 : 1;
      return a.id.localeCompare(b.id, "en");
    })
    .slice(0, limit);
}
