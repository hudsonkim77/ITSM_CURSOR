# ITSM_CURSOR

기존 `wiki`(Streamlit)의 **데이터·도메인 구조는 그대로 계승**하고, 화면을 **React + FastAPI**로
재구현한 ITSM 표준운영관리 포털입니다.

| 구분 | 내용 |
|---|---|
| 데이터 | `1_변경관리` … `15_백업관리` CSV (wiki 이관, 정합성 유지) |
| 이력 | 도메인별 `_HISTORY.csv` — 등록/수정/삭제/매핑 시 자동 append |
| 문서출력 | 공단 공통 양식(전자결재·기안자) — 관리영역별 명세서/보고서 |
| 경영관리 | `4_경영관리` PDF (`MGMT_PASSWORD` 게이트) |
| 산출물 | 구축산출물·업무보고·관리자지침서(재기동절차 포함) |

저장소: [hudsonkim77/ITSM_CURSOR](https://github.com/hudsonkim77/ITSM_CURSOR)

## 구조

```
ITSM_CURSOR/
  1_~15_*/          # 도메인 CSV + _HISTORY + MAP
  4_경영관리/       # 업무보고 · 구축산출물 PDF
  5_ITSM관리/
    backend/        # FastAPI (CRUD, 매핑, 대시보드, ERD, PDF, SPA 서빙)
    frontend/       # React + Vite + TypeScript + Tailwind
    scripts/        # dev.sh / prod.sh
    ERD.html        # mermaid ERD 정의
  RAW/
```

## 실행 — 개발 (권장)

```bash
# 터미널 A — API :8000
cd "5_ITSM관리/backend"
pip install -r requirements.txt
MGMT_PASSWORD=7587 python3 -m uvicorn app:app --host 0.0.0.0 --port 8000 --reload

# 터미널 B — UI :5173 (/api → :8000 프록시)
cd "5_ITSM관리/frontend"
npm install
npm run dev
```

브라우저: `http://localhost:5173/`

한 줄 기동(백+프론트):

```bash
chmod +x "5_ITSM관리/scripts/"*.sh
MGMT_PASSWORD=7587 ./5_ITSM관리/scripts/dev.sh
```

## 실행 — 프로덕션 (단일 포트)

프론트를 빌드한 뒤 FastAPI가 `dist` SPA를 함께 제공합니다.

```bash
MGMT_PASSWORD=7587 ./5_ITSM관리/scripts/prod.sh
# → http://localhost:8000/
```

또는:

```bash
cd "5_ITSM관리/frontend" && npm run build
cd "../backend"
MGMT_PASSWORD=7587 python3 -m uvicorn app:app --host 0.0.0.0 --port 8000
```

## 주요 기능

- 통합 대시보드(KPI·분포·최근 변경)
- 13개 도메인 CRUD, 상태/유형 필터, FK 셀렉트, N:M 매핑
- 공단 공통 양식 문서 출력(등록 직후·목록 재출력)
- ERD(줌/팬·도메인 outline·한글 테이블명)
- 경영관리 PDF 열람, WBS 진척 화면
- 자동 스모크: `5_ITSM관리/backend/smoke_test.py`

## API 요약

| 메서드 | 경로 | 설명 |
|---|---|---|
| GET | `/api/health` | 헬스체크 |
| GET | `/api/domains` | 도메인 목록 + 건수 |
| GET/POST/PUT/DELETE | `/api/domains/{key}/rows…` | 행 조회·등록·수정·삭제 |
| GET | `/api/domains/{key}/history` | `_HISTORY.csv` |
| GET/POST/DELETE | `/api/domains/{key}/maps/…` | N:M 매핑 |
| GET | `/api/domains/{key}/fk-options` | FK 옵션 |
| GET | `/api/dashboard` | KPI·집계 |
| GET | `/api/erd` | mermaid ERD |
| POST | `/api/management/unlock` | 경영관리 비밀번호 |
| GET | `/api/management/pdf` | PDF 스트림 |

## 관리자 퀵 가이드

상세 핸드북·재기동절차: `4_경영관리/구축산출물/20260712_CURSOR_관리자지침서.pdf`  
(`ITSM-ADM-2026-001`)

| 점검 | 방법 |
|---|---|
| API | `curl -s http://127.0.0.1:8000/api/health` |
| 스모크 | `MGMT_PASSWORD=… python3 smoke_test.py` (backend 기동 중) |
| 재기동 | Ctrl+C → 포트 정리(`lsof`) → uvicorn / vite 재기동 |

## 구축산출물 (발췌)

| 문서 | 번호 |
|---|---|
| 기능테스트결과서 | ITSM-TST-2026-002 |
| 아키텍처결과서 | ITSM-ARC-2026-002 |
| 프로그램명세서 | ITSM-PGM-2026-002 |
| 테일러링결과서 | ITSM-TLR-2026-001 |
| 관리자지침서(+재기동) | ITSM-ADM-2026-001 |

목록: [`4_경영관리/구축산출물목록.md`](4_경영관리/구축산출물목록.md)

## 환경변수

| 변수 | 설명 | 기본(로컬) |
|---|---|---|
| `MGMT_PASSWORD` | 경영관리 PDF 게이트 | `7587` (로컬 예시) |
| `PORT` | prod.sh 포트 | `8000` |

> 운영 환경에서는 반드시 별도 비밀번호를 설정하세요. `.env`는 커밋하지 않습니다.

## 라이선스 / 형상

로컬 구축·공단 ITSM 운영 지원 목적. 형상 관리는 본 GitHub 저장소 `main` 브랜치를 기준으로 합니다.
