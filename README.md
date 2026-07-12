# ITSM_CURSOR

기존 `wiki`(Streamlit) 프로젝트의 **데이터·도메인 구조는 그대로 계승**하되, 화면(프론트엔드)을
정적/Streamlit에서 **모던 동적 웹앱(React)** 으로 새로 구현한 ITSM 표준운영관리 대시보드입니다.

- **데이터**: 각 도메인 폴더(`1_변경관리` … `15_백업관리`, `3_구성관리` 등)의 CSV를 wiki에서 그대로 복사해 사용합니다(테이블 재계산/재생성 불필요, 데이터 정합성 유지).
- **이력**: 각 도메인 폴더에 `_HISTORY.csv`가 있으며, 앱에서 등록/삭제(CRUD)가 일어날 때마다 자동으로 이력이 append 됩니다.
- **경영관리 PDF**: `4_경영관리/_업무보고`, `4_경영관리/구축산출물`의 PDF를 그대로 사용합니다.
- **ERD**: 기존 `wiki`의 ERD(mermaid) 정의를 차용해 렌더링합니다.

## 구조

```
ITSM_CURSOR/
  1_변경관리/CHANGE.csv, _HISTORY.csv, 변경히스토리/...
  2_장애관리/ ... 15_백업관리/            # 도메인 데이터(CSV) + _HISTORY.csv
  4_경영관리/_업무보고/*.pdf, 구축산출물/*.pdf
  5_ITSM관리/
    backend/    # FastAPI — CSV 읽기/쓰기, 이력 기록, 대시보드 집계, 경영관리 게이트/PDF, ERD
    frontend/   # React + Vite + TypeScript + Tailwind (화면 전담)
    ERD.html, style.css, assets/          # ERD 정의·로고 차용
  RAW/ ...
```

## 실행 (개발)

두 개의 프로세스를 각각 띄웁니다.

```bash
# 1) 백엔드 (:8000). 경영관리 비밀번호는 MGMT_PASSWORD 환경변수로 주입
cd "ITSM_CURSOR/5_ITSM관리/backend"
MGMT_PASSWORD=7587 python3 -m uvicorn app:app --host 0.0.0.0 --port 8000 --reload

# 2) 프론트엔드 (:5173) — /api 요청을 :8000 백엔드로 프록시
cd "ITSM_CURSOR/5_ITSM관리/frontend"
npm install   # 최초 1회
npm run dev
```

브라우저에서 `http://localhost:5173/` 접속.

## API 요약

| 메서드 | 경로 | 설명 |
|---|---|---|
| GET | `/api/domains` | 도메인 목록 + 건수 |
| GET | `/api/domains/{key}` | 도메인 컬럼 + 행 |
| POST | `/api/domains/{key}/rows` | 행 등록(ID 자동 채번, CSV + `_HISTORY.csv` 기록) |
| DELETE | `/api/domains/{key}/rows/{id}` | 행 삭제(CSV + `_HISTORY.csv` 기록) |
| GET | `/api/domains/{key}/history` | 폴더 `_HISTORY.csv` |
| GET | `/api/dashboard` | KPI + 카테고리 분포 |
| GET | `/api/erd` | ERD mermaid(logical/physical) |
| POST | `/api/management/unlock` | 경영관리 비밀번호 확인 → PDF 목록 |
| GET | `/api/management/pdf?subdir=&name=` | PDF 다운로드 |
