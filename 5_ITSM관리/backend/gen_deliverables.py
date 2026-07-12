#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""CURSOR 구축산출물 PDF 생성 (P5.2)."""

from pathlib import Path
from datetime import datetime

from fpdf import FPDF

ROOT = Path(__file__).resolve().parent.parent.parent
OUT_DIR = ROOT / "4_경영관리" / "구축산출물"
# Apple SD Gothic Neo — TTC face index 0
FONT = "/System/Library/Fonts/AppleSDGothicNeo.ttc"

# 관리영역 → 공단 공통 양식 문서 (테일러링)
DOMAIN_DOCS = [
    ("변경관리", "change", "변경기능명세서", "등록 후·목록 출력"),
    ("장애관리", "incident", "장애보고서", "등록 후·목록 출력"),
    ("구성관리", "config", "신규자산등록명세서", "등록 후·목록 출력"),
    ("문제관리", "problem", "문제보고서", "등록 후·목록 출력"),
    ("배포관리", "deploy", "배포관리명세서", "등록 후·목록 출력"),
    ("요청관리", "request", "요청명세서", "등록 후·목록 출력"),
    ("서비스수준관리", "sla", "SLA 명세서", "등록 후·목록 출력"),
    ("형상관리", "baseline", "형상등록명세서", "등록 후·목록 출력"),
    ("테스트관리", "test", "테스트결과보고서", "등록 후·목록 출력"),
    ("운영상태관리", "ops", "(관리명) 명세서", "목록만(폴백)"),
    ("이벤트관리", "event", "(관리명) 명세서", "목록만(폴백)"),
    ("연계관리", "interface", "(관리명) 명세서", "목록만(폴백)"),
    ("백업관리", "backup", "(관리명) 명세서", "목록만(폴백)"),
]


class Doc(FPDF):
    def __init__(self):
        super().__init__(format="A4")
        self.set_margins(18, 20, 18)
        self.set_auto_page_break(auto=True, margin=20)

    def header(self):
        self.set_xy(18, 12)
        self.set_font("KR", size=9)
        self.set_text_color(100, 110, 125)
        self.cell(0, 6, "ITSM_CURSOR / Build Artifacts", align="L", new_x="LMARGIN", new_y="NEXT")
        self.set_draw_color(58, 94, 239)
        self.set_line_width(0.5)
        y = self.get_y() + 1
        self.line(18, y, 192, y)
        self.set_y(y + 6)

    def footer(self):
        self.set_y(-16)
        self.set_font("KR", size=8)
        self.set_text_color(140, 140, 140)
        self.cell(0, 8, str(self.page_no()), align="C")


def body(pdf: Doc, text: str, size=10, color=(30, 40, 55), h=6):
    pdf.set_font("KR", size=size)
    pdf.set_text_color(*color)
    pdf.multi_cell(w=0, h=h, text=text)
    pdf.ln(1)


def table_row(pdf: Doc, cols, widths, *, header=False, h=8):
    """단순 고정 높이 행 (한글 문서용)."""
    pdf.set_font("KR", size=8.5)
    if header:
        pdf.set_fill_color(230, 235, 245)
    else:
        pdf.set_fill_color(255, 255, 255)
    pdf.set_text_color(30, 40, 55)
    if pdf.get_y() + h > pdf.page_break_trigger:
        pdf.add_page()
    for text, w in zip(cols, widths):
        pdf.cell(w, h, str(text), border=1, fill=True, align="L")
    pdf.ln(h)


def make_pdf(filename: str, title: str, doc_no: str, sections):
    pdf = Doc()
    pdf.add_font("KR", fname=FONT)
    pdf.add_page()

    body(pdf, title, size=16, color=(16, 24, 40), h=9)
    body(pdf, f"Doc No: {doc_no}", size=11, color=(70, 80, 95))
    body(pdf, f"Date: {datetime.now().strftime('%Y-%m-%d')}", size=11, color=(70, 80, 95))
    body(pdf, "System: ITSM_CURSOR (React + FastAPI)", size=11, color=(70, 80, 95))
    pdf.ln(3)

    for heading, paras in sections:
        body(pdf, heading, size=12, color=(39, 67, 212), h=8)
        for p in paras:
            body(pdf, f"- {p}", size=10, color=(30, 40, 55), h=6)
        pdf.ln(2)

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    path = OUT_DIR / filename
    pdf.output(str(path))
    print("wrote", path)
    return path


def make_tailoring_pdf():
    """테일러링결과서 — 공단 공통 양식·관리별 문서 매핑."""
    pdf = Doc()
    pdf.add_font("KR", fname=FONT)
    pdf.add_page()

    body(pdf, "테일러링결과서 — ITSM_CURSOR 공단 공통 양식", size=15, color=(16, 24, 40), h=9)
    body(pdf, "Doc No: ITSM-TLR-2026-001", size=11, color=(70, 80, 95))
    body(pdf, f"Date: {datetime.now().strftime('%Y-%m-%d')}", size=11, color=(70, 80, 95))
    body(pdf, "System: ITSM_CURSOR (React + FastAPI)", size=11, color=(70, 80, 95))
    pdf.ln(2)

    body(pdf, "1. 목적", size=12, color=(39, 67, 212), h=8)
    for p in [
        "표준 ITIL 실무·공단 문서 관행에 맞춰 ITSM_CURSOR 운영 산출물(등록 문서)의 적용 범위를 확정한다.",
        "관리영역별로 출력되는 문서명·결재 요소·작성 시점을 명시하여 실무·감사 대응의 일관성을 확보한다.",
    ]:
        body(pdf, f"- {p}", size=10, color=(30, 40, 55), h=6)

    body(pdf, "2. 테일러링 원칙", size=12, color=(39, 67, 212), h=8)
    for p in [
        "공통 양식 1종을 전 관리영역에서 재사용한다(기관명·전자결재란·기안자·본문표·제출문).",
        "문서 제목만 관리영역별로 분기한다(변경기능명세서, 장애보고서 등).",
        "기안자는 등록 화면에서 입력하며, 전자결재 「기안」란·하단 서명란에 동시에 반영한다.",
        "결재 단계(검토·협조·승인)는 양식에 고정 란으로 두고, 실결재는 공단 전자결재/수기 날인에 위임한다.",
        "운영상태·이벤트·연계·백업은 1차 범위에서 전용 문서명을 두지 않고 「(관리명) 명세서」 폴백을 적용한다.",
    ]:
        body(pdf, f"- {p}", size=10, color=(30, 40, 55), h=6)

    body(pdf, "3. 공통 양식 구성", size=12, color=(39, 67, 212), h=8)
    for p in [
        "헤더(좌): 공단 / 정보시스템실·ITSM, 문서번호, 작성일자",
        "헤더(우): 전자결재 4칸(기안·검토·협조·승인) — 기안란에 성명·작성일 자동 기입",
        "중앙 제목: 관리영역별 문서명",
        "요약표: 문서번호·관리영역·기안자·작성일",
        "본문표: 해당 도메인 컬럼(항목/내용)",
        "특기사항란 · 제출문 · 기안자 서명(인)",
        "출력: 화면 미리보기 → 브라우저 인쇄/PDF 저장 (A4)",
    ]:
        body(pdf, f"- {p}", size=10, color=(30, 40, 55), h=6)

    body(pdf, "4. 관리영역별 출력 문서", size=12, color=(39, 67, 212), h=8)
    body(pdf, "등록(Create) 또는 목록의 출력 버튼으로 동일 양식이 열린다.", size=10, color=(70, 80, 95), h=6)
    pdf.ln(1)

    widths = [38, 28, 52, 56]  # total 174
    table_row(pdf, ["관리영역", "도메인키", "출력 문서명", "출력 시점"], widths, header=True, h=6)
    for title, key, doc, when in DOMAIN_DOCS:
        table_row(pdf, [title, key, doc, when], widths, h=6)

    pdf.ln(4)
    body(pdf, "5. 적용 범위·제외", size=12, color=(39, 67, 212), h=8)
    for p in [
        "적용: ITSM_CURSOR 도메인 등록·조회 화면의 공단 공통 양식 출력",
        "제외: 경영관리 PDF(업무보고·구축산출물), N:M 매핑 전용 출력, 외부 전자결재 시스템 API 연동",
        "향후: 운영상태·이벤트·연계·백업 전용 문서명 확정 시 본 결과서를 개정한다.",
    ]:
        body(pdf, f"- {p}", size=10, color=(30, 40, 55), h=6)

    body(pdf, "6. 구현 위치", size=12, color=(39, 67, 212), h=8)
    for p in [
        "frontend/src/lib/printDocs.ts — 문서명 매핑·기안자 localStorage",
        "frontend/src/components/OfficialDocPrint.tsx — 공통 양식 UI",
        "frontend/src/pages/DomainPage.tsx — 등록 후 미리보기·목록 출력",
        "frontend/src/index.css — 양식·인쇄 스타일",
    ]:
        body(pdf, f"- {p}", size=10, color=(30, 40, 55), h=6)

    body(pdf, "7. 판정", size=12, color=(39, 67, 212), h=8)
    for p in [
        "공단 공통 양식 1종 + 관리영역별 문서명 9종(핵심) / 폴백 4종으로 테일러링을 확정한다.",
        "문서번호 ITSM-TLR-2026-001 로 본 결과서를 구축산출물에 등록한다.",
    ]:
        body(pdf, f"- {p}", size=10, color=(30, 40, 55), h=6)

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    path = OUT_DIR / "20260712_CURSOR_테일러링결과서.pdf"
    pdf.output(str(path))
    print("wrote", path)
    return path


def make_admin_handbook():
    """관리자지침서(퀵 가이드) + 재기동절차서."""
    pdf = Doc()
    pdf.add_font("KR", fname=FONT)
    pdf.add_page()

    body(pdf, "관리자지침서 — ITSM_CURSOR 퀵 가이드", size=15, color=(16, 24, 40), h=9)
    body(pdf, "Doc No: ITSM-ADM-2026-001", size=11, color=(70, 80, 95))
    body(pdf, f"Date: {datetime.now().strftime('%Y-%m-%d')}", size=11, color=(70, 80, 95))
    body(pdf, "Audience: 로컬/운영 담당 관리자  ·  Format: Handbook (Quick Reference)", size=10, color=(70, 80, 95))
    pdf.ln(1)

    # ── 0. 한눈에 보기
    body(pdf, "0. 한눈에 보기", size=12, color=(39, 67, 212), h=8)
    widths = [42, 132]
    table_row(pdf, ["항목", "값"], widths, header=True, h=7)
    for row in [
        ("UI", "http://localhost:5173"),
        ("API", "http://localhost:8000  (/api 프록시 via Vite)"),
        ("헬스", "GET /api/health  →  {\"ok\": true}"),
        ("데이터", "프로젝트 루트 1_~15_ 폴더 CSV"),
        ("경영관리 PW", "환경변수 MGMT_PASSWORD"),
        ("백엔드 경로", "5_ITSM관리/backend"),
        ("프론트 경로", "5_ITSM관리/frontend"),
    ]:
        table_row(pdf, list(row), widths, h=7)
    pdf.ln(2)

    # ── 1. 최초 기동
    body(pdf, "1. 최초 기동 (Quick Start)", size=12, color=(39, 67, 212), h=8)
    for p in [
        "[터미널 A] cd 5_ITSM관리/backend && pip install -r requirements.txt",
        "  MGMT_PASSWORD=7587 uvicorn app:app --reload --port 8000",
        "[터미널 B] cd 5_ITSM관리/frontend && npm install && npm run dev",
        "브라우저에서 http://localhost:5173 접속 → 대시보드 확인",
    ]:
        body(pdf, f"- {p}", size=10, color=(30, 40, 55), h=5.5)

    # ── 2. 일상 운영
    body(pdf, "2. 일상 운영 체크리스트", size=12, color=(39, 67, 212), h=8)
    for p in [
        "대시보드 KPI·도메인 건수 정상 표시",
        "도메인 등록/수정/삭제 후 _HISTORY.csv 반영",
        "경영관리: 비밀번호 입력 → PDF 목록 열림",
        "문서 출력: 등록 시 기안자 입력 → 공단 양식 미리보기 → 인쇄/PDF",
        "이상 시 §4 재기동 → §5 장애 대응 순으로 조치",
    ]:
        body(pdf, f"- {p}", size=10, color=(30, 40, 55), h=5.5)

    # ── 3. 화면 바로가기
    body(pdf, "3. 화면·업무 바로가기", size=12, color=(39, 67, 212), h=8)
    w2 = [40, 50, 84]
    table_row(pdf, ["메뉴", "경로", "관리자 포인트"], w2, header=True, h=7)
    for row in [
        ("대시보드", "/", "KPI·최근 변경 확인"),
        ("도메인 관리", "/domain/:key", "CRUD·필터·매핑·문서출력"),
        ("ERD", "/erd", "줌/팬·도메인 outline"),
        ("경영관리", "/management", "MGMT_PASSWORD 게이트"),
        ("WBS", "/wbs", "구축 진척 확인"),
    ]:
        table_row(pdf, list(row), w2, h=7)
    pdf.ln(2)

    body(pdf, "문서 출력(공단 양식) — 핵심 9종", size=10, color=(39, 67, 212), h=6)
    for p in [
        "변경→변경기능명세서 / 장애→장애보고서 / 구성→신규자산등록명세서",
        "문제→문제보고서 / 배포→배포관리명세서 / 요청→요청명세서",
        "SLA→SLA 명세서 / 형상→형상등록명세서 / 테스트→테스트결과보고서",
        "목록 프린터 아이콘으로 기존 건 재출력 가능",
    ]:
        body(pdf, f"- {p}", size=9.5, color=(30, 40, 55), h=5)

    # ── 4. 재기동절차서
    pdf.add_page()
    body(pdf, "4. 재기동절차서 (Restart Handbook)", size=13, color=(39, 67, 212), h=8)
    body(pdf, "적용: UI 무응답, API 5xx, 포트 충돌, CSV 잠김 의심, 배포 후 반영 안 됨", size=9.5, color=(70, 80, 95), h=5.5)
    pdf.ln(1)

    body(pdf, "4.1 표준 재기동 (권장 순서)", size=11, color=(16, 24, 40), h=7)
    for i, p in enumerate([
        "프론트 중지: 터미널 B에서 Ctrl+C (vite 종료)",
        "백엔드 중지: 터미널 A에서 Ctrl+C (uvicorn 종료)",
        "포트 잔존 확인(macOS): lsof -iTCP:8000 -sTCP:LISTEN / lsof -iTCP:5173 -sTCP:LISTEN",
        "잔존 시: kill <PID>  (필요 시 kill -9 <PID>)",
        "백엔드 재기동: MGMT_PASSWORD=… uvicorn app:app --reload --port 8000",
        "프론트 재기동: npm run dev",
        "검증: curl -s http://127.0.0.1:8000/api/health 및 브라우저 하드 리프레시(Cmd+Shift+R)",
    ], 1):
        body(pdf, f"{i}. {p}", size=10, color=(30, 40, 55), h=5.5)

    body(pdf, "4.2 백엔드만 재기동", size=11, color=(16, 24, 40), h=7)
    for p in [
        "API 오류·CSV 저장 실패·경영관리 503(비밀번호 미설정) 시",
        "uvicorn만 재시작. 프론트는 Vite 프록시이므로 유지해도 됨",
        "MGMT_PASSWORD 미설정 시 경영관리 unlock이 503 → 환경변수 넣고 재기동",
    ]:
        body(pdf, f"- {p}", size=10, color=(30, 40, 55), h=5.5)

    body(pdf, "4.3 프론트만 재기동", size=11, color=(16, 24, 40), h=7)
    for p in [
        "화면 깨짐·HMR 정지·프록시 오류(ECONNREFUSED)인데 API는 정상일 때",
        "vite 종료 후 npm run dev. API :8000이 먼저 떠 있어야 /api 프록시 성공",
    ]:
        body(pdf, f"- {p}", size=10, color=(30, 40, 55), h=5.5)

    body(pdf, "4.4 강제 포트 정리 (충돌 시)", size=11, color=(16, 24, 40), h=7)
    for p in [
        "lsof -tiTCP:8000 -sTCP:LISTEN | xargs kill",
        "lsof -tiTCP:5173 -sTCP:LISTEN | xargs kill",
        "이후 §4.1 5~7단계로 재기동",
    ]:
        body(pdf, f"- {p}", size=10, color=(30, 40, 55), h=5.5)

    body(pdf, "4.5 재기동 후 확인 (Go/No-Go)", size=11, color=(16, 24, 40), h=7)
    w3 = [58, 58, 58]
    table_row(pdf, ["점검", "방법", "기대"], w3, header=True, h=7)
    for row in [
        ("API 헬스", "GET /api/health", "ok=true"),
        ("도메인 목록", "GET /api/domains", "13건"),
        ("UI", "localhost:5173", "대시보드 로드"),
        ("경영관리", "unlock + PDF목록", "artifacts 표시"),
    ]:
        table_row(pdf, list(row), w3, h=7)
    pdf.ln(2)

    # ── 5. 장애 대응
    body(pdf, "5. 장애 대응 (Quick Troubleshoot)", size=12, color=(39, 67, 212), h=8)
    w4 = [52, 122]
    table_row(pdf, ["증상", "조치"], w4, header=True, h=7)
    for row in [
        ("화면 데이터 안 뜸", "API 기동·프록시(:8000) 확인 → §4 재기동"),
        ("등록 실패", "필수 제목 필드·FK 선택 확인 / 터미널 에러 로그"),
        ("경영관리 열림 실패", "MGMT_PASSWORD 설정 후 백엔드 재기동"),
        ("포트 already in use", "§4.4 강제 포트 정리"),
        ("CSV 깨짐 의심", "해당 폴더 CSV 백업 복구 · HISTORY 대조"),
        ("문서 출력 안 됨", "기안자 입력·팝업/인쇄 차단 해제"),
    ]:
        table_row(pdf, list(row), w4, h=7)
    pdf.ln(2)

    # ── 6. 검증·백업
    body(pdf, "6. 검증·백업·산출물", size=12, color=(39, 67, 212), h=8)
    for p in [
        "스모크: (백엔드 기동 중) cd backend && MGMT_PASSWORD=… python3 smoke_test.py",
        "산출물 PDF 재생성: python3 gen_deliverables.py → 4_경영관리/구축산출물/",
        "데이터 백업: 1_~15_ 도메인 폴더 + 4_경영관리 를 주기적으로 복사",
        "형상: 정리 후 GitHub 반영 (P5.4). 평소엔 CSV 실데이터 백업 우선",
    ]:
        body(pdf, f"- {p}", size=10, color=(30, 40, 55), h=5.5)

    body(pdf, "7. 연락·참고", size=12, color=(39, 67, 212), h=8)
    for p in [
        "상세 매핑: 테일러링결과서 ITSM-TLR-2026-001",
        "아키텍처: ITSM-ARC-2026-002  ·  프로그램: ITSM-PGM-2026-002",
        "본 문서는 재기동절차서를 §4에 포함한다 (별도 문서번호 없음).",
    ]:
        body(pdf, f"- {p}", size=10, color=(30, 40, 55), h=5.5)

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    path = OUT_DIR / "20260712_CURSOR_관리자지침서.pdf"
    pdf.output(str(path))
    print("wrote", path)
    return path


def main():
    make_pdf(
        "20260712_CURSOR_기능테스트결과서.pdf",
        "테스트결과서 — ITSM_CURSOR 기능테스트",
        "ITSM-TST-2026-002",
        [
            ("1. 목적", [
                "wiki(Streamlit)에서 React+FastAPI로 재구현한 ITSM_CURSOR의 핵심 API·CRUD·매핑·경영관리 게이트가 정상 동작하는지 자동 스모크로 검증한다.",
            ]),
            ("2. 검증 환경", [
                "OS: macOS(local)",
                "Backend: FastAPI + uvicorn :8000",
                "Frontend: React + Vite :5173",
                "데이터: 도메인 CSV / _HISTORY.csv (wiki 이관본)",
                "실행 스크립트: 5_ITSM관리/backend/smoke_test.py",
            ]),
            ("3. 시나리오 요약", [
                "헬스체크, 도메인 목록(13), 대시보드 KPI, ERD(논리/물리)",
                "변경관리 등록→수정→삭제 왕복 및 HISTORY(ADDED/UPDATED/REMOVED)",
                "N:M 매핑(CHANGE_CI_MAP) 등록/삭제",
                "FK 옵션 API, 12개 추가 도메인 조회",
                "경영관리 비밀번호 게이트 및 PDF 목록",
            ]),
            ("4. 결과", [
                "자동 스모크 상세: 20260712_CURSOR_기능테스트결과.md / .json",
                "프론트 UI(상태·유형 셀렉트, FK, ERD 줌, WBS)는 로컬 수동 확인",
                "스모크 실행 결과: 27/27 PASS (2026-07-12)",
            ]),
            ("5. 판정", [
                "핵심 API·CRUD·매핑·경영관리 게이트 시나리오 PASS로 완료 판정한다.",
            ]),
        ],
    )

    make_pdf(
        "20260712_CURSOR_아키텍처결과서.pdf",
        "아키텍처결과서 — ITSM_CURSOR (React 전환)",
        "ITSM-ARC-2026-002",
        [
            ("1. 개요", [
                "기존 Streamlit wiki 포털을 동일 CSV 정합성 하에 React(Vite)+FastAPI 구조의 ITSM_CURSOR로 재구성했다.",
            ]),
            ("2. 논리 구성 (3계층)", [
                "표현: React + TypeScript + Tailwind. 라우트 — 대시보드/도메인/ERD/경영관리/WBS",
                "응용: FastAPI — CRUD, 이력, N:M 매핑, FK 옵션, 대시보드, ERD, PDF 게이트",
                "데이터: 마스터 CSV + _HISTORY.csv + *이력/*_MAP.csv",
            ]),
            ("3. 배포/실행", [
                "로컬: uvicorn :8000 + vite :5173 (/api 프록시)",
                "형상: GitHub hudsonkim77/ITSM_CURSOR (정리 후 push)",
                "wiki(Streamlit)와 데이터 모델 공유, UI/런타임은 분리",
            ]),
            ("4. 주요 확장", [
                "행 수정(PUT), 상태/유형 필터, FK·상태·날짜 맞춤 입력, N:M 매핑 UI",
                "ERD 줌/outline/한글 테이블명, WBS 진척, 반응형 사이드바",
                "공단 공통 양식 문서 출력(전자결재란·기안자·관리별 문서명)",
            ]),
            ("5. 향후 과제", [
                "프로덕션 배포, 인증 강화, 동시 편집 제어",
            ]),
        ],
    )

    make_pdf(
        "20260712_CURSOR_프로그램명세서.pdf",
        "프로그램명세서 — ITSM_CURSOR",
        "ITSM-PGM-2026-002",
        [
            ("1. 프론트엔드", [
                "main.tsx — 라우터",
                "Dashboard / DomainPage / ErdPage / Management / WbsPage",
                "OfficialDocPrint.tsx — 공단 공통 양식 미리보기·인쇄",
                "api.ts — Axios 클라이언트 (CRUD·maps·fk-options)",
                "fieldHints.ts / printDocs.ts — 입력 힌트·문서명 매핑",
            ]),
            ("2. 백엔드", [
                "app.py — domains/maps/fk-options/dashboard/erd/management",
                "domains.py — 도메인·FK·MAP 메타, 한글 라벨",
                "smoke_test.py / gen_deliverables.py — 품질·산출물",
            ]),
            ("3. 입출력", [
                "입력: CSV values, 매핑 ownerId/relatedId, 경영관리 password, 기안자(클라이언트)",
                "출력: JSON, PDF 스트림, mermaid 정의, 공단 양식 인쇄",
            ]),
        ],
    )

    make_tailoring_pdf()
    make_admin_handbook()

    make_pdf(
        "20260712_CURSOR_진척보고.pdf",
        "업무보고 — ITSM_CURSOR 구축 진척 (6주차)",
        "ITSM-RPT-2026-006",
        [
            ("1. 보고 요지", [
                "Streamlit wiki 데이터를 유지한 채 React 기반 ITSM_CURSOR 로컬 포털을 구축·검증했다.",
            ]),
            ("2. 완료 범위", [
                "백엔드 API(조회/등록/수정/삭제/이력/매핑/FK/대시보드/ERD/경영관리)",
                "React 화면(대시보드, 13 도메인, ERD, 경영관리, WBS)",
                "고도화(수정·필터·매핑·맞춤 입력·반응형·공단 양식 출력)",
                "품질: 스모크 27/27 PASS 및 산출물 개정(테일러링결과서 포함)",
            ]),
            ("3. 잔여", [
                "프로덕션 배포(P5.3), 정리 후 GitHub 형상 갱신(P5.4)",
            ]),
            ("4. 요청사항", [
                "배포 환경·공개범위 확정 후 P5.3~P5.4 진행",
            ]),
        ],
    )
    src = OUT_DIR / "20260712_CURSOR_진척보고.pdf"
    dst = ROOT / "4_경영관리" / "_업무보고" / "20260712_CURSOR_구축진척보고.pdf"
    dst.parent.mkdir(parents=True, exist_ok=True)
    if src.exists():
        src.replace(dst)
        print("moved", dst)


if __name__ == "__main__":
    main()
