#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""ITSM_CURSOR API 스모크/시나리오 검증 스크립트 (P5.1).

사용:
  MGMT_PASSWORD=7587 python3 smoke_test.py
  (백엔드 http://127.0.0.1:8000 기동 상태)
"""

from __future__ import annotations

import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime
from pathlib import Path

BASE = os.environ.get("ITSM_API", "http://127.0.0.1:8000")
MGMT_PW = os.environ.get("MGMT_PASSWORD", "7587")
ROOT = Path(__file__).resolve().parent.parent.parent  # ITSM_CURSOR
OUT_MD = ROOT / "4_경영관리" / "구축산출물" / "20260712_CURSOR_기능테스트결과.md"
OUT_JSON = ROOT / "4_경영관리" / "구축산출물" / "20260712_CURSOR_기능테스트결과.json"


def req(method: str, path: str, body=None, expect=200):
    url = BASE + path
    data = None
    headers = {}
    if body is not None:
        data = json.dumps(body).encode("utf-8")
        headers["Content-Type"] = "application/json"
    r = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(r, timeout=30) as res:
            raw = res.read().decode("utf-8")
            code = res.status
            payload = json.loads(raw) if raw else None
    except urllib.error.HTTPError as e:
        code = e.code
        try:
            payload = json.loads(e.read().decode("utf-8"))
        except Exception:
            payload = {"detail": str(e)}
    ok = code == expect
    return ok, code, payload


def main():
    results = []
    started = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    def check(name, ok, detail=""):
        results.append({"name": name, "pass": bool(ok), "detail": detail})
        mark = "PASS" if ok else "FAIL"
        print(f"[{mark}] {name}" + (f" — {detail}" if detail else ""))

    ok, code, _ = req("GET", "/api/health")
    check("헬스체크 GET /api/health", ok, f"HTTP {code}")

    ok, code, domains = req("GET", "/api/domains")
    check("도메인 목록", ok and isinstance(domains, list) and len(domains) >= 13, f"count={len(domains) if isinstance(domains, list) else 0}")

    ok, code, dash = req("GET", "/api/dashboard")
    check("대시보드 집계", ok and isinstance(dash, dict) and "kpis" in (dash or {}), f"HTTP {code}")

    ok, code, erd = req("GET", "/api/erd")
    check("ERD 정의", ok and erd and "logical" in erd and "physical" in erd, f"HTTP {code}")

    # 변경관리 CRUD 왕복
    ok, code, change = req("GET", "/api/domains/change")
    check("변경관리 조회", ok and change and "rows" in change, f"rows={len(change.get('rows', [])) if change else 0}")

    ok, code, created = req("POST", "/api/domains/change/rows", {
        "values": {
            "CHG_TITLE": "SMOKE_TEST_CURSOR",
            "CHG_TYPE": "표준",
            "CHG_STATUS": "접수",
            "IMPACT_LEVEL": "낮음",
            "ROLLBACK_YN": "N",
            "WORK_NOTE": "P5.1 smoke",
        }
    }, expect=200)
    new_id = (created or {}).get("id", "")
    check("변경관리 등록", ok and bool(new_id), new_id)

    if new_id:
        ok, code, _ = req("PUT", f"/api/domains/change/rows/{urllib.parse.quote(new_id)}", {
            "values": {
                "CHG_TITLE": "SMOKE_TEST_CURSOR",
                "CHG_TYPE": "표준",
                "CHG_STATUS": "완료",
                "IMPACT_LEVEL": "낮음",
                "ROLLBACK_YN": "N",
                "WORK_NOTE": "P5.1 smoke updated",
            }
        })
        check("변경관리 수정", ok, f"HTTP {code}")

        # 매핑 추가/삭제 (CI 하나)
        ok, code, maps = req("GET", f"/api/domains/change/maps/change_ci?ownerId={urllib.parse.quote(new_id)}")
        related = ""
        if ok and maps:
            linked = {r.get("CI_ID") for r in maps.get("rows", [])}
            for o in maps.get("relatedOptions", []):
                if o["id"] not in linked:
                    related = o["id"]
                    break
        map_id = ""
        if related:
            ok, code, mrow = req("POST", "/api/domains/change/maps/change_ci/rows", {
                "ownerId": new_id, "relatedId": related, "values": {"WORK_NOTE": "smoke map"}
            })
            map_id = (mrow or {}).get("id", "")
            check("변경-구성 매핑 등록", ok and bool(map_id), f"{new_id}↔{related}")
            if map_id:
                ok, code, _ = req("DELETE", f"/api/domains/change/maps/change_ci/rows/{urllib.parse.quote(map_id)}")
                check("변경-구성 매핑 삭제", ok, map_id)
        else:
            check("변경-구성 매핑 등록", False, "연결 가능 CI 없음")

        ok, code, fko = req("GET", "/api/domains/change/fk-options")
        check("FK 옵션", ok and "TRIGGERED_BY_INCIDENT_ID" in (fko or {}), f"keys={list((fko or {}).keys())}")

        ok, code, hist = req("GET", "/api/domains/change/history")
        actions = {r.get("ACTION") for r in (hist or {}).get("rows", [])}
        check("이력 기록(ADDED/UPDATED)", "ADDED" in actions and "UPDATED" in actions, f"actions={sorted(actions)}")

        ok, code, _ = req("DELETE", f"/api/domains/change/rows/{urllib.parse.quote(new_id)}")
        check("변경관리 삭제(정리)", ok, new_id)

    # 다른 도메인 조회 스모크
    for key in ["incident", "config", "problem", "deploy", "request", "sla", "baseline", "ops", "event", "test", "interface", "backup"]:
        ok, code, d = req("GET", f"/api/domains/{key}")
        check(f"도메인 조회:{key}", ok and d and "rows" in d, f"rows={len(d.get('rows', [])) if d else 0}")

    ok, code, unlock = req("POST", "/api/management/unlock", {"password": MGMT_PW})
    check("경영관리 잠금해제", ok and unlock and unlock.get("ok"), f"HTTP {code}")
    if ok and unlock:
        check("업무보고 PDF 목록", isinstance(unlock.get("reports"), list) and len(unlock["reports"]) > 0, f"n={len(unlock.get('reports', []))}")
        check("구축산출물 PDF 목록", isinstance(unlock.get("artifacts"), list) and len(unlock["artifacts"]) > 0, f"n={len(unlock.get('artifacts', []))}")

    passed = sum(1 for r in results if r["pass"])
    failed = len(results) - passed
    ended = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    report = {
        "title": "ITSM_CURSOR 기능 테스트 결과",
        "docNo": "ITSM-TST-2026-002",
        "started": started,
        "ended": ended,
        "apiBase": BASE,
        "summary": {"total": len(results), "pass": passed, "fail": failed},
        "results": results,
    }

    OUT_JSON.parent.mkdir(parents=True, exist_ok=True)
    OUT_JSON.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")

    lines = [
        f"# {report['title']}",
        "",
        f"- 문서번호: **{report['docNo']}**",
        f"- 실행: {started} ~ {ended}",
        f"- API: `{BASE}`",
        f"- 결과: **{passed}/{len(results)} PASS** (FAIL {failed})",
        "",
        "| # | 시나리오 | 결과 | 상세 |",
        "|---|---|---|---|",
    ]
    for i, r in enumerate(results, 1):
        lines.append(f"| {i} | {r['name']} | {'PASS' if r['pass'] else 'FAIL'} | {r['detail']} |")
    lines += [
        "",
        "## 검증 범위",
        "- 헬스/도메인 목록/대시보드/ERD",
        "- 변경관리 등록·수정·삭제 왕복",
        "- N:M 매핑(변경↔구성) 등록·삭제",
        "- FK 옵션 API",
        "- `_HISTORY.csv` ADDED/UPDATED 기록",
        "- 13개 도메인 조회",
        "- 경영관리 비밀번호 게이트·PDF 목록",
        "",
        "## 비고",
        "- 본 검증은 로컬 FastAPI(:8000) 기준 자동 스모크입니다.",
        "- 프론트(Vite :5173) UI 클릭 검증은 수동 확인(등록 모달 FK/상태 셀렉트, ERD 줌, WBS)을 병행합니다.",
    ]
    OUT_MD.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"\nWrote {OUT_MD}")
    print(f"Wrote {OUT_JSON}")
    print(f"SUMMARY {passed}/{len(results)} PASS")
    return 0 if failed == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
