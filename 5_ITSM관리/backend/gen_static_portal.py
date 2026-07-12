#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""GitHub Pages용 정적 포털 생성 (좌측 메뉴 + 대시보드 + 도메인 조회)."""

from __future__ import annotations

import json
import re
import shutil
from datetime import datetime
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parent.parent.parent
DOCS = ROOT / "docs"
BASE = "/ITSM_CURSOR"  # GitHub Pages project site

# domains.py 와 동일 메타
DOMAINS = [
    {"key": "change", "title": "변경관리", "csv": "1_변경관리/CHANGE.csv"},
    {"key": "incident", "title": "장애관리", "csv": "2_장애관리/INCIDENT.csv"},
    {"key": "config", "title": "구성관리", "csv": "3_구성관리/CI.csv"},
    {"key": "problem", "title": "문제관리", "csv": "6_문제관리/PROBLEM.csv"},
    {"key": "deploy", "title": "배포관리", "csv": "7_배포관리/DEPLOY.csv"},
    {"key": "request", "title": "요청관리", "csv": "8_요청관리/REQUEST.csv"},
    {"key": "sla", "title": "서비스수준관리", "csv": "9_서비스수준관리/SLA.csv"},
    {"key": "baseline", "title": "형상관리", "csv": "10_형상관리/BASELINE.csv"},
    {"key": "ops", "title": "운영상태관리", "csv": "11_운영상태관리/OPS_STATUS.csv"},
    {"key": "event", "title": "이벤트관리", "csv": "12_이벤트관리/EVENT.csv"},
    {"key": "test", "title": "테스트관리", "csv": "13_테스트관리/TEST_CASE.csv"},
    {"key": "interface", "title": "연계관리", "csv": "14_연계관리/INTERFACE.csv"},
    {"key": "backup", "title": "백업관리", "csv": "15_백업관리/BACKUP.csv"},
]

CATEGORY_LABELS_KO = {
    "HR": "인력", "APP": "응용", "SERVER": "서버", "NETWORK": "네트워크",
    "STORAGE": "스토리지", "DB": "DB", "SECURITY": "보안", "ETC": "기타",
    "INFRA": "인프라", "SW": "소프트웨어", "HW": "하드웨어",
}

# 최소 한글 라벨 (없으면 컬럼명 그대로)
try:
    import sys
    sys.path.insert(0, str(ROOT / "5_ITSM관리" / "backend"))
    from domains import COLUMN_LABELS_KO  # type: ignore
except Exception:
    COLUMN_LABELS_KO = {}


def esc(s) -> str:
    return (
        str(s)
        .replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
    )


def load_csv(rel: str) -> pd.DataFrame:
    p = ROOT / rel
    if not p.exists():
        return pd.DataFrame()
    return pd.read_csv(p, dtype=str, keep_default_na=False)


def ko(col: str) -> str:
    return COLUMN_LABELS_KO.get(col, col)


def href(path: str) -> str:
    if not path.startswith("/"):
        path = "/" + path
    return BASE + path


def layout(title: str, active: str, body: str, domain_counts: dict[str, int], wbs_pct: int, extra_script: str = "") -> str:
    return f"""<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>{esc(title)} · AI활성화진흥공단</title>
  <link rel="icon" href="{href('/assets/logo-mark.png')}" />
  <link rel="stylesheet" href="{href('/assets/portal.css')}" />
  <script>
    (function () {{
      try {{
        if (localStorage.getItem('itsm_dashboard_dark') === '1') {{
          document.documentElement.classList.add('theme-ops');
        }}
      }} catch (e) {{}}
    }})();
  </script>
</head>
<body>
  <div class="app">
    {shell(active, domain_counts, wbs_pct)}
    <div class="main-wrap">
      <header class="topbar">
        <button type="button" class="menu-btn" onclick="document.getElementById('sidebar').classList.toggle('open')">☰</button>
        <a class="topbar-title" href="{href('/')}">AI활성화진흥공단</a>
        <button type="button" class="btn-theme" id="theme-toggle-mobile" aria-pressed="false">다크</button>
      </header>
      <main class="content" id="main-content">
        {body}
      </main>
    </div>
  </div>
  <div class="backdrop" onclick="document.getElementById('sidebar').classList.remove('open')"></div>
  {DARK_SCRIPT}
  {extra_script}
</body>
</html>
"""


DARK_SCRIPT = """
<script>
(function () {
  var KEY = 'itsm_dashboard_dark';
  var btns = [
    document.getElementById('theme-toggle'),
    document.getElementById('theme-toggle-mobile')
  ].filter(Boolean);
  function apply(dark) {
    document.documentElement.classList.toggle('theme-ops', dark);
    document.body.classList.toggle('theme-ops', dark);
    btns.forEach(function (btn) {
      btn.textContent = dark ? '라이트' : '다크';
      btn.setAttribute('aria-pressed', dark ? 'true' : 'false');
    });
    try { localStorage.setItem(KEY, dark ? '1' : '0'); } catch (e) {}
  }
  var dark = false;
  try { dark = localStorage.getItem(KEY) === '1'; } catch (e) {}
  apply(dark);
  btns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      apply(!document.documentElement.classList.contains('theme-ops'));
    });
  });
})();
</script>
"""


def shell(active: str, domain_counts: dict[str, int], wbs_pct: int) -> str:
    def nav(path: str, label: str, key: str, badge: str | None = None) -> str:
        cls = "nav-link active" if active == key else "nav-link"
        b = f'<span class="badge">{esc(badge)}</span>' if badge is not None else ""
        return f'<a class="{cls}" href="{href(path)}"><span>{esc(label)}</span>{b}</a>'

    domain_links = []
    for d in DOMAINS:
        c = domain_counts.get(d["key"], 0)
        domain_links.append(nav(f"/d/{d['key']}.html", d["title"], d["key"], str(c)))

    # 홈은 trailing slash로 고정 → 클릭 시 스크롤/좌표 튀는 index.html 중복 로드 방지
    home = href("/")
    return f"""
<aside class="sidebar" id="sidebar">
  <a class="brand" href="{home}" title="대시보드로 이동">
    <img src="{href('/assets/logo-mark.png')}" alt="logo" />
    <div>
      <div class="brand-title">AI활성화진흥공단</div>
      <div class="brand-sub">표준운영관리 대시보드</div>
    </div>
  </a>
  <nav class="nav">
    {nav('/', '대시보드', 'home')}
    {nav('/wbs.html', 'WBS 진척', 'wbs', f'{wbs_pct}%')}
    <div class="nav-section">운영 도메인</div>
    {''.join(domain_links)}
    <div class="nav-section">기타</div>
    {nav('/erd.html', 'ERD', 'erd')}
    {nav('/management.html', '경영관리', 'management')}
  </nav>
  <div class="sidebar-foot">
    <button type="button" class="btn-theme btn-theme-block" id="theme-toggle" aria-pressed="false">다크</button>
    <div class="sidebar-foot-note">대한민국 공공기관 표준운영관리 · ITIL v4 기반</div>
  </div>
</aside>
"""


def build_dashboard(domain_counts: dict[str, int]) -> str:
    ci = load_csv("3_구성관리/CI.csv")
    total = len(ci)
    category = []
    if not ci.empty and "CI_CATEGORY" in ci.columns:
        vc = ci["CI_CATEGORY"].replace("", "미지정").value_counts()
        category = [(CATEGORY_LABELS_KO.get(k, k), int(v)) for k, v in vc.items()]
    status = []
    labels = {"OPERATIONAL": "운영중", "Active": "활성", "STANDBY": "대기", "미지정": "미지정"}
    if not ci.empty and "STATUS" in ci.columns:
        sc = ci["STATUS"].replace("", "미지정").value_counts()
        status = [(labels.get(k, k), int(v)) for k, v in sc.items()]

    ch = load_csv("1_변경관리/CHANGE.csv")
    recent_rows = ""
    if not ch.empty:
        cols = [c for c in ["CHG_TICKET_ID", "CHG_TITLE", "CHG_TYPE", "CHG_STATUS", "APPLIED_DT"] if c in ch.columns]
        for _, r in ch[cols].tail(8).iloc[::-1].iterrows():
            recent_rows += (
                "<tr>"
                f'<td class="mono"><a href="{href("/d/change.html")}">{esc(r.get("CHG_TICKET_ID",""))}</a></td>'
                f'<td>{esc(r.get("CHG_TITLE",""))}</td>'
                f'<td>{esc(r.get("CHG_TYPE") or "—")}</td>'
                f'<td>{esc(r.get("CHG_STATUS") or "미정")}</td>'
                f'<td>{esc(r.get("APPLIED_DT") or "—")}</td>'
                "</tr>"
            )
    if not recent_rows:
        recent_rows = '<tr><td colspan="5" class="empty">변경 이력이 없습니다.</td></tr>'

    hist = load_csv("3_구성관리/구성이력/CI_HISTORY.csv")
    added = removed = 0
    if not hist.empty and "ACTION" in hist.columns:
        added = int((hist["ACTION"] == "ADDED").sum())
        removed = int((hist["ACTION"] == "REMOVED").sum())

    kpis = [
        ("총 자산 수", total),
        ("변경 건수", domain_counts.get("change", 0)),
        ("장애 건수", domain_counts.get("incident", 0)),
        ("문제 건수", domain_counts.get("problem", 0)),
    ]
    kpi_html = "".join(
        f'<div class="card kpi"><label>{esc(l)}</label><div class="v">{v:,}</div></div>' for l, v in kpis
    )
    cat_html = "".join(
        f'<li><span>{esc(l)}</span><b>{c}</b></li>' for l, c in sorted(category, key=lambda x: -x[1])[:15]
    )
    st_html = "".join(f'<li><span>{esc(l)}</span><b>{c}</b></li>' for l, c in status)
    dom_html = "".join(
        f'<a class="card dom" href="{href("/d/" + d["key"] + ".html")}"><div class="t">{esc(d["title"])}</div>'
        f'<div class="c">{domain_counts.get(d["key"], 0)}</div></a>'
        for d in DOMAINS
    )

    return f"""
<div id="dash-root" class="dashboard-scope">
<header class="page-head">
  <div>
    <h1>ITSM 통합관리 대시보드</h1>
    <p class="sub">구성·변경·장애·문제 현황을 한눈에 관제합니다.</p>
  </div>
  <div class="head-actions">
    <span class="chip ok">● 온라인 CSV 스냅샷</span>
  </div>
</header>
<section class="kpis">{kpi_html}</section>
<section class="grid2">
  <div class="card"><h2>카테고리별 자산 현황</h2><ul class="lists">{cat_html}</ul></div>
  <div class="card"><h2>자산 상태 분포</h2><ul class="lists">{st_html}</ul>
    <div class="move">
      <div class="mini ok"><span>자산 추가</span><b>{added}</b></div>
      <div class="mini bad"><span>자산 삭제</span><b>{removed}</b></div>
    </div>
  </div>
</section>
<h2 class="sec-title">운영 도메인 바로가기</h2>
<section class="domains">{dom_html}</section>
<section class="card table-card">
  <div class="card-head"><h2>최근 변경 이력</h2><a href="{href('/d/change.html')}">전체 보기 →</a></div>
  <div class="table-wrap"><table>
    <thead><tr><th>변경 티켓 ID</th><th>변경 제목</th><th>유형</th><th>상태</th><th>적용 일시</th></tr></thead>
    <tbody>{recent_rows}</tbody>
  </table></div>
</section>
<p class="foot">생성: {esc(datetime.now().strftime("%Y-%m-%d %H:%M"))} · 읽기 전용 공개 뷰 · CRUD는 로컬 서버에서 이용</p>
</div>
"""


def build_domain_page(d: dict, domain_counts: dict[str, int]) -> str:
    df = load_csv(d["csv"])
    total = len(df)
    show = df.head(80) if not df.empty else df
    if df.empty:
        table = '<p class="empty">데이터가 없습니다.</p>'
    else:
        cols = list(show.columns)[:12]
        thead = "".join(f"<th>{esc(ko(c))}</th>" for c in cols)
        rows = []
        for _, r in show.iterrows():
            rows.append("<tr>" + "".join(f"<td>{esc(r.get(c, '') or '—')}</td>" for c in cols) + "</tr>")
        table = f'<div class="table-wrap"><table><thead><tr>{thead}</tr></thead><tbody>{"".join(rows)}</tbody></table></div>'
        if total > 80:
            table += f'<p class="note">전체 {total}건 중 상위 80건 표시 (온라인 스냅샷)</p>'

    return f"""
<header class="page-head">
  <div>
    <h1>{esc(d["title"])}</h1>
    <p class="sub">온라인 조회 뷰 · 전체 {total}건</p>
  </div>
  <span class="chip">읽기 전용</span>
</header>
<section class="card table-card">{table}</section>
"""


def build_wbs() -> str:
    # 간단 고정 요약 (프론트 wbs.ts 반영)
    phases = [
        ("P1", "기반 환경", 100),
        ("P2", "데이터·백엔드", 100),
        ("P3", "React 화면", 99),
        ("P4", "고도화", 100),
        ("P5", "품질·산출물·배포", 100),
    ]
    cards = "".join(
        f'<div class="card"><div class="t">{esc(pid)} · {esc(name)}</div>'
        f'<div class="bar"><i style="width:{pct}%"></i></div><div class="c">{pct}%</div></div>'
        for pid, name, pct in phases
    )
    return f"""
<header class="page-head"><div><h1>ITSM_CURSOR 구축 WBS</h1>
<p class="sub">로컬 구축·검증 완료 · GitHub Pages 공개</p></div></header>
<section class="wbs-grid">{cards}</section>
"""


def build_erd() -> str:
    erd_html = ROOT / "5_ITSM관리" / "ERD.html"
    logical = ""
    if erd_html.exists():
        m = re.search(r'id="erd-diagram-logical"[^>]*>(.*?)</div>', erd_html.read_text(encoding="utf-8"), re.S)
        if m:
            logical = m.group(1).strip()
    if not logical:
        logical = "erDiagram\n  CHANGE ||--o{ INCIDENT : related"
    # escape for embedding in pre/code then mermaid
    return f"""
<header class="page-head"><div><h1>ERD</h1><p class="sub">논리 모델 (Mermaid)</p></div></header>
<section class="card"><pre class="mermaid">\n{logical}\n</pre></section>
<script type="module">
  import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.esm.min.mjs';
  mermaid.initialize({{ startOnLoad: true, theme: 'neutral' }});
</script>
"""


def build_management() -> str:
    arts = sorted((ROOT / "4_경영관리" / "구축산출물").glob("*.pdf")) if (ROOT / "4_경영관리" / "구축산출물").exists() else []
    reps = sorted((ROOT / "4_경영관리" / "_업무보고").glob("*.pdf")) if (ROOT / "4_경영관리" / "_업무보고").exists() else []
    # GitHub raw links for PDFs
    def items(files, sub):
        if not files:
            return "<li>파일 없음</li>"
        out = []
        for f in files[:30]:
            url = f"https://github.com/hudsonkim77/ITSM_CURSOR/blob/main/4_경영관리/{sub}/{f.name}"
            out.append(f'<li><a href="{esc(url)}" target="_blank" rel="noopener">{esc(f.name)}</a></li>')
        return "".join(out)

    return f"""
<header class="page-head"><div><h1>경영관리</h1>
<p class="sub">온라인에서는 GitHub 문서 링크로 열람합니다. (비밀번호 게이트는 로컬 포털)</p></div></header>
<section class="grid2">
  <div class="card"><h2>구축산출물</h2><ul class="filelist">{items(arts, '구축산출물')}</ul></div>
  <div class="card"><h2>업무보고</h2><ul class="filelist">{items(reps, '_업무보고')}</ul></div>
</section>
"""


CSS = """
:root {
  --bg: #f4f6fb;
  --card: #ffffff;
  --text: #101828;
  --muted: #667085;
  --line: #e5e9f2;
  --brand: #3a5eef;
  --sidebar: #ffffff;
  --glow: transparent;
  --accent: #3a5eef;
}
* { box-sizing: border-box; }
html, body { width: 100%; overflow-x: hidden; }
body {
  margin: 0;
  font-family: "Malgun Gothic", "Apple SD Gothic Neo", sans-serif;
  background: var(--bg);
  color: var(--text);
  transition: background .25s ease, color .25s ease;
}
.app { min-height: 100vh; position: relative; }
.sidebar {
  position: fixed; top: 0; left: 0; bottom: 0; width: 260px;
  background: var(--sidebar);
  border-right: 1px solid var(--line);
  display: flex; flex-direction: column; z-index: 40;
  transition: background .25s ease, border-color .25s ease, box-shadow .25s ease;
}
a.brand {
  display: flex; gap: 10px; align-items: center; padding: 18px 18px 14px;
  text-decoration: none; color: inherit; flex-shrink: 0;
}
a.brand:hover { background: rgba(58,94,239,.06); }
.brand img { width: 36px; height: 36px; border-radius: 10px; object-fit: contain; }
.brand-title { font-size: 14px; font-weight: 800; color: var(--text); }
.brand-sub { font-size: 11px; color: var(--muted); }
.nav { flex: 1; overflow: auto; padding: 0 10px 20px; }
.nav-section { padding: 14px 12px 6px; font-size: 11px; font-weight: 700; color: var(--muted); letter-spacing: .04em; }
.nav-link {
  display: flex; align-items: center; justify-content: space-between; gap: 8px;
  padding: 9px 12px; border-radius: 12px; color: var(--muted); text-decoration: none; font-size: 14px; font-weight: 600;
}
.nav-link:hover { background: rgba(58,94,239,.08); color: var(--text); }
.nav-link.active {
  background: var(--brand); color: #fff;
  box-shadow: 0 0 0 1px var(--glow), 0 0 18px var(--glow);
}
.nav-link .badge { background: rgba(15,23,42,.06); color: var(--muted); border-radius: 999px; padding: 1px 8px; font-size: 11px; }
.nav-link.active .badge { background: rgba(255,255,255,.2); color: #fff; }
.sidebar-foot { border-top: 1px solid var(--line); padding: 12px 18px; font-size: 11px; color: var(--muted); }

/* 폭 깨짐 방지: margin만 사용 (calc width 금지) */
.main-wrap {
  margin-left: 260px;
  min-height: 100vh;
  min-width: 0;
  width: auto;
  max-width: none;
}
.topbar {
  display: none; position: sticky; top: 0; z-index: 20;
  background: color-mix(in srgb, var(--card) 92%, transparent);
  backdrop-filter: blur(8px); border-bottom: 1px solid var(--line);
  padding: 10px 14px; align-items: center; gap: 10px;
}
.menu-btn { border: 0; background: rgba(15,23,42,.06); border-radius: 10px; padding: 8px 10px; font-size: 16px; color: var(--text); }
.topbar-title { font-weight: 800; font-size: 14px; flex: 1; color: var(--text); text-decoration: none; }
.content { width: 100%; max-width: none; margin: 0; padding: 28px 32px 48px; min-width: 0; }
.page-head { display: flex; justify-content: space-between; gap: 12px; align-items: flex-end; margin-bottom: 20px; flex-wrap: wrap; }
.head-actions { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.btn-theme {
  border: 1px solid var(--line); border-radius: 12px; padding: 8px 14px; font-size: 13px; font-weight: 700;
  background: var(--card); color: var(--text); cursor: pointer;
  box-shadow: 0 0 0 1px transparent;
}
.btn-theme:hover { border-color: var(--accent); box-shadow: 0 0 12px var(--glow); }
.btn-theme-block { width: 100%; margin-bottom: 10px; }
.sidebar-foot-note { font-size: 11px; color: var(--muted); line-height: 1.4; }
h1 { margin: 0; font-size: 26px; color: var(--text); }
h2 { margin: 0 0 12px; font-size: 16px; color: var(--text); }
.sub { margin: 6px 0 0; color: var(--muted); font-size: 14px; }
.chip {
  display: inline-flex; padding: 4px 10px; border-radius: 999px;
  background: rgba(58,94,239,.12); color: var(--brand); font-size: 12px; font-weight: 700;
}
.chip.ok { background: rgba(16,185,129,.15); color: #059669; }
.card {
  background: var(--card); border: 1px solid var(--line); border-radius: 16px; padding: 16px 18px;
  transition: background .25s ease, border-color .25s ease, box-shadow .25s ease;
}
.kpis { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; margin-bottom: 16px; }
.kpi label { font-size: 13px; color: var(--muted); }
.kpi .v { margin-top: 8px; font-size: 30px; font-weight: 800; color: var(--text); letter-spacing: -0.02em; }
.grid2 { display: grid; grid-template-columns: 1.4fr 1fr; gap: 14px; margin-bottom: 18px; }
.lists { list-style: none; margin: 0; padding: 0; }
.lists li { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid var(--line); font-size: 14px; color: var(--text); }
.domains { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 10px; margin-bottom: 18px; }
.dom { text-decoration: none; color: inherit; }
.dom:hover { border-color: var(--accent); box-shadow: 0 0 16px var(--glow); }
.dom .t { font-size: 13px; color: var(--muted); }
.dom .c { font-size: 22px; font-weight: 800; margin-top: 6px; color: var(--text); }
.sec-title { margin: 0 0 10px; font-size: 16px; color: var(--text); }
.table-card { padding: 0; overflow: hidden; }
.card-head { display: flex; justify-content: space-between; align-items: center; padding: 14px 18px; border-bottom: 1px solid var(--line); }
.card-head a { color: var(--accent); font-size: 12px; font-weight: 700; text-decoration: none; }
.table-wrap { overflow: auto; }
table { width: 100%; border-collapse: collapse; font-size: 13px; }
th, td { padding: 10px 12px; text-align: left; border-bottom: 1px solid var(--line); white-space: nowrap; color: var(--text); }
th { background: rgba(15,23,42,.03); color: var(--muted); font-size: 11px; }
.mono { font-family: ui-monospace, Consolas, monospace; font-weight: 700; color: var(--accent); }
.mono a { color: inherit; text-decoration: none; }
.empty, .note, .foot { color: var(--muted); font-size: 13px; }
.note, .foot { padding: 12px 18px; }
.move { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 10px; }
.mini { border-radius: 12px; padding: 10px 12px; border: 1px solid transparent; }
.mini span { display: block; font-size: 12px; }
.mini b { font-size: 18px; }
.mini.ok { background: rgba(16,185,129,.12); color: #059669; }
.mini.bad { background: rgba(244,63,94,.12); color: #e11d48; }
.wbs-grid { display: grid; gap: 12px; }
.bar { height: 8px; background: rgba(58,94,239,.12); border-radius: 999px; overflow: hidden; margin: 10px 0 6px; }
.bar i { display: block; height: 100%; background: var(--brand); box-shadow: 0 0 10px var(--glow); }
.filelist { margin: 0; padding-left: 18px; line-height: 1.8; font-size: 13px; }
.filelist a { color: var(--accent); }
.backdrop { display: none; }

/* ===== 관제실 다크 (전체 reverse + 형광) ===== */
html.theme-ops, html.theme-ops body, body.theme-ops {
  --bg: #060d18;
  --card: #0b1628;
  --text: #e8f7ff;
  --muted: #8fb4c9;
  --line: #16324a;
  --brand: #00e5ff;
  --sidebar: #07111f;
  --glow: rgba(0, 229, 255, 0.35);
  --accent: #39ff14;
}
html.theme-ops body, body.theme-ops {
  background:
    radial-gradient(1200px 500px at 80% -10%, rgba(0,229,255,.12), transparent 60%),
    radial-gradient(900px 400px at 0% 100%, rgba(57,255,20,.08), transparent 55%),
    var(--bg);
  color: var(--text);
}
html.theme-ops .sidebar, body.theme-ops .sidebar {
  background: linear-gradient(180deg, #07111f 0%, #050b14 100%);
  border-right-color: #0e3a4f;
  box-shadow: 4px 0 24px rgba(0,229,255,.08);
}
html.theme-ops a.brand:hover, body.theme-ops a.brand:hover { background: rgba(0,229,255,.08); }
html.theme-ops .nav-link:hover, body.theme-ops .nav-link:hover {
  background: rgba(0,229,255,.1); color: #b8f4ff;
}
html.theme-ops .nav-link.active, body.theme-ops .nav-link.active {
  background: linear-gradient(90deg, rgba(0,229,255,.25), rgba(57,255,20,.12));
  color: #e8ffff;
  border: 1px solid rgba(0,229,255,.45);
  box-shadow: 0 0 16px rgba(0,229,255,.25), inset 0 0 12px rgba(0,229,255,.08);
}
html.theme-ops .nav-link .badge, body.theme-ops .nav-link .badge {
  background: rgba(0,229,255,.12); color: #9be7ff;
}
html.theme-ops .card, body.theme-ops .card {
  background: linear-gradient(180deg, rgba(14,28,48,.95), rgba(8,16,30,.98));
  border-color: rgba(0,229,255,.22);
  box-shadow: 0 0 0 1px rgba(0,229,255,.06), 0 0 22px rgba(0,229,255,.08);
}
html.theme-ops .kpi .v, body.theme-ops .kpi .v {
  color: #7df9ff;
  text-shadow: 0 0 12px rgba(0,229,255,.55);
}
html.theme-ops .dom .c, body.theme-ops .dom .c {
  color: #9dff57;
  text-shadow: 0 0 10px rgba(57,255,20,.45);
}
html.theme-ops .mono, body.theme-ops .mono,
html.theme-ops .card-head a, body.theme-ops .card-head a,
html.theme-ops .filelist a, body.theme-ops .filelist a {
  color: #39ff14;
  text-shadow: 0 0 8px rgba(57,255,20,.35);
}
html.theme-ops th, body.theme-ops th { background: rgba(0,229,255,.06); color: #8fb4c9; }
html.theme-ops .btn-theme, body.theme-ops .btn-theme {
  background: rgba(0,229,255,.1);
  border-color: rgba(0,229,255,.4);
  color: #b8f4ff;
  box-shadow: 0 0 14px rgba(0,229,255,.2);
}
html.theme-ops .chip.ok, body.theme-ops .chip.ok {
  background: rgba(57,255,20,.12); color: #9dff57;
  box-shadow: 0 0 10px rgba(57,255,20,.2);
}
html.theme-ops .chip, body.theme-ops .chip {
  background: rgba(0,229,255,.12); color: #7df9ff;
  box-shadow: 0 0 10px rgba(0,229,255,.2);
}
html.theme-ops .mini.ok, body.theme-ops .mini.ok {
  background: rgba(57,255,20,.1); color: #9dff57; border-color: rgba(57,255,20,.3);
  box-shadow: 0 0 12px rgba(57,255,20,.15);
}
html.theme-ops .mini.bad, body.theme-ops .mini.bad {
  background: rgba(255,60,100,.1); color: #ff7a9a; border-color: rgba(255,60,100,.3);
  box-shadow: 0 0 12px rgba(255,60,100,.15);
}
html.theme-ops .bar, body.theme-ops .bar { background: rgba(0,229,255,.12); }
html.theme-ops .bar i, body.theme-ops .bar i {
  background: linear-gradient(90deg, #00e5ff, #39ff14);
  box-shadow: 0 0 12px rgba(0,229,255,.5);
}
html.theme-ops .topbar, body.theme-ops .topbar {
  background: rgba(7,17,31,.92); border-bottom-color: #0e3a4f;
}
html.theme-ops .menu-btn, body.theme-ops .menu-btn {
  background: rgba(0,229,255,.1); color: #b8f4ff;
}

@media (max-width: 1100px) {
  .kpis { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 960px) {
  .sidebar { transform: translateX(-105%); transition: transform .2s; }
  .sidebar.open { transform: translateX(0); }
  .main-wrap { margin-left: 0; }
  .topbar { display: flex; }
  .grid2 { grid-template-columns: 1fr 1fr; }
  .content { padding: 20px 16px 40px; }
  body:has(.sidebar.open) .backdrop {
    display: block; position: fixed; inset: 0; background: rgba(0,10,20,.55); z-index: 30;
  }
}
@media (max-width: 640px) {
  .kpis, .grid2 { grid-template-columns: 1fr; }
}
"""


def main():
    if DOCS.exists():
        for p in DOCS.glob("*.html"):
            p.unlink()
        ddir = DOCS / "d"
        if ddir.exists():
            shutil.rmtree(ddir)
    DOCS.mkdir(parents=True, exist_ok=True)
    assets = DOCS / "assets"
    assets.mkdir(exist_ok=True)
    (assets / "portal.css").write_text(CSS, encoding="utf-8")
    logo_src = ROOT / "5_ITSM관리" / "frontend" / "public" / "logo-mark.png"
    if logo_src.exists():
        shutil.copy2(logo_src, assets / "logo-mark.png")

    domain_counts = {}
    for d in DOMAINS:
        domain_counts[d["key"]] = len(load_csv(d["csv"]))

    wbs_pct = 100
    (DOCS / "index.html").write_text(
        layout("대시보드", "home", build_dashboard(domain_counts), domain_counts, wbs_pct),
        encoding="utf-8",
    )
    ddir = DOCS / "d"
    ddir.mkdir(exist_ok=True)
    for d in DOMAINS:
        (ddir / f"{d['key']}.html").write_text(
            layout(d["title"], d["key"], build_domain_page(d, domain_counts), domain_counts, wbs_pct),
            encoding="utf-8",
        )
    (DOCS / "wbs.html").write_text(
        layout("WBS", "wbs", build_wbs(), domain_counts, wbs_pct), encoding="utf-8"
    )
    (DOCS / "erd.html").write_text(
        layout("ERD", "erd", build_erd(), domain_counts, wbs_pct), encoding="utf-8"
    )
    (DOCS / "management.html").write_text(
        layout("경영관리", "management", build_management(), domain_counts, wbs_pct), encoding="utf-8"
    )

    (ROOT / "제출용_바로가기" / "ITSM_CURSOR_대시보드_온라인.url").write_text(
        "[InternetShortcut]\nURL=https://hudsonkim77.github.io/ITSM_CURSOR/\n",
        encoding="utf-8",
    )
    print("generated", DOCS)
    print("pages", len(list(DOCS.rglob("*.html"))))
    print("counts", json.dumps(domain_counts, ensure_ascii=False))


if __name__ == "__main__":
    main()
