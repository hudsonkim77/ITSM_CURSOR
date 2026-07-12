"""ITSM_CURSOR FastAPI 백엔드.

역할: 프론트(React)가 화면을 담당하고, 이 백엔드는 데이터(각 도메인 CSV) 읽기/쓰기와
폴더별 이력 파일(_HISTORY.csv) 기록, 대시보드 집계, 경영관리 비밀번호 게이트/PDF 제공,
ERD(기존 mermaid 정의 차용)를 담당한다.

데이터 정합성: wiki에서 그대로 복사한 CSV를 사용하며(테이블 재생성 불필요),
CRUD 변경은 (1) 마스터 CSV 갱신 + (2) 같은 폴더 _HISTORY.csv에 이력 append 로 반영한다.
"""

import os
import re
from datetime import datetime
from pathlib import Path

import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from domains import (
    CATEGORY_LABELS_KO,
    DOMAINS,
    DOMAINS_BY_KEY,
    fks_for,
    ko_label,
    map_by_key,
    maps_for,
)

# backend/app.py -> 5_ITSM관리 -> ITSM_CURSOR (데이터 루트)
ROOT = Path(__file__).resolve().parent.parent.parent
APP_DIR = Path(__file__).resolve().parent.parent
ERD_HTML = APP_DIR / "ERD.html"
FRONTEND_DIST = APP_DIR / "frontend" / "dist"

HISTORY_HEADER = ["HISTORY_ID", "ACTION", "TARGET_ID", "ACTION_DT", "ACTION_BY", "NOTE"]

app = FastAPI(title="ITSM_CURSOR API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------- CSV helpers (wiki crud_helpers 규칙 계승) ----------
def _csv_path(domain):
    return ROOT / domain["folder"] / domain["csv"]


def _history_path(domain):
    return ROOT / domain["folder"] / "_HISTORY.csv"


def load_df(csv_path):
    return pd.read_csv(csv_path, dtype=str, keep_default_na=False)


def save_df(df, csv_path):
    df.to_csv(csv_path, index=False)


def next_id(df, id_field, prefix):
    today = datetime.now().strftime("%Y%m%d")
    pattern = rf"^{re.escape(prefix)}_{today}_(\d+)$"
    if id_field in df.columns and len(df):
        existing = df[id_field].astype(str).str.extract(pattern)[0].dropna().astype(int)
        n = (existing.max() + 1) if len(existing) else 1
    else:
        n = 1
    return f"{prefix}_{today}_{n:03d}"


def append_history(domain, action, target_id, note, actor="CURSOR"):
    path = _history_path(domain)
    if path.exists():
        hist = pd.read_csv(path, dtype=str, keep_default_na=False)
    else:
        hist = pd.DataFrame(columns=HISTORY_HEADER)
    seq = len(hist) + 1
    row = {
        "HISTORY_ID": f"HIST_{seq:04d}",
        "ACTION": action,
        "TARGET_ID": target_id,
        "ACTION_DT": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "ACTION_BY": actor,
        "NOTE": note,
    }
    hist = pd.concat([hist, pd.DataFrame([row])], ignore_index=True)
    hist.to_csv(path, index=False)
    return row


def columns_meta(df):
    return [{"name": c, "label": ko_label(c)} for c in df.columns]


def _map_path(domain, map_def):
    return ROOT / domain["folder"] / map_def["rel_path"]


def next_map_id(df):
    if "MAP_ID" in df.columns and len(df):
        nums = df["MAP_ID"].astype(str).str.extract(r"MAP_(\d+)")[0].dropna().astype(int)
        n = int(nums.max()) + 1 if len(nums) else 1
    else:
        n = 1
    return f"MAP_{n:04d}"


def fk_option_list(ref_domain_key, exclude_id=None):
    """참조 도메인 옵션 [{id, label}] — wiki fk_options 계승."""
    ref = DOMAINS_BY_KEY.get(ref_domain_key)
    if not ref:
        return []
    path = _csv_path(ref)
    if not path.exists():
        return []
    df = load_df(path)
    id_f = ref["id_field"]
    title_f = ref["title_field"]
    out = []
    for _, r in df.iterrows():
        rid = str(r.get(id_f, ""))
        if not rid or (exclude_id and rid == str(exclude_id)):
            continue
        title = str(r.get(title_f, "")).strip()
        label = f"{rid} — {title}" if title else rid
        out.append({"id": rid, "label": label})
    return out


def maps_meta(domain_key):
    return [
        {
            "key": m["key"],
            "title": m["title"],
            "ownerField": m["owner_field"],
            "relatedField": m["related_field"],
            "relatedDomain": m["related_domain"],
            "extraFields": [
                {"name": f, "label": ko_label(f)} for f in m.get("extra_fields", [])
            ],
        }
        for m in maps_for(domain_key)
    ]


def fks_meta(domain_key):
    return [
        {
            "field": f["field"],
            "label": ko_label(f["field"]),
            "refDomain": f["ref_domain"],
            "optional": f.get("optional", True),
        }
        for f in fks_for(domain_key)
    ]


# ---------- models ----------
class RowCreate(BaseModel):
    values: dict


class RowUpdate(BaseModel):
    values: dict


class MapCreate(BaseModel):
    ownerId: str
    relatedId: str
    values: dict = {}


class AuthBody(BaseModel):
    password: str


# ---------- endpoints ----------
@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.get("/api/domains")
def list_domains():
    out = []
    for d in DOMAINS:
        path = _csv_path(d)
        count = 0
        if path.exists():
            count = len(load_df(path))
        out.append({
            "key": d["key"], "title": d["title"], "folder": d["folder"],
            "idField": d["id_field"], "titleField": d["title_field"],
            "icon": d["icon"], "count": count,
        })
    return out


@app.get("/api/domains/{key}")
def get_domain(key: str):
    d = DOMAINS_BY_KEY.get(key)
    if not d:
        raise HTTPException(404, "unknown domain")
    path = _csv_path(d)
    if not path.exists():
        raise HTTPException(404, f"csv not found: {path}")
    df = load_df(path)
    return {
        "meta": {
            "key": d["key"], "title": d["title"], "folder": d["folder"],
            "idField": d["id_field"], "titleField": d["title_field"], "icon": d["icon"],
        },
        "columns": columns_meta(df),
        "rows": df.to_dict(orient="records"),
        "fks": fks_meta(key),
        "maps": maps_meta(key),
    }


@app.get("/api/domains/{key}/fk-options")
def get_fk_options(key: str, excludeId: str = ""):
    """도메인 폼용 FK 셀렉트 옵션."""
    d = DOMAINS_BY_KEY.get(key)
    if not d:
        raise HTTPException(404, "unknown domain")
    out = {}
    for fk in fks_for(key):
        excl = excludeId if fk["ref_domain"] == key else ""
        out[fk["field"]] = fk_option_list(fk["ref_domain"], excl or None)
    return out


@app.get("/api/domains/{key}/maps/{map_key}")
def list_map_rows(key: str, map_key: str, ownerId: str = ""):
    d = DOMAINS_BY_KEY.get(key)
    if not d:
        raise HTTPException(404, "unknown domain")
    mdef = map_by_key(key, map_key)
    if not mdef:
        raise HTTPException(404, "unknown map")
    meta = next(x for x in maps_meta(key) if x["key"] == map_key)
    path = _map_path(d, mdef)
    if not path.exists():
        cols = ["MAP_ID", mdef["owner_field"], mdef["related_field"]] + mdef.get("extra_fields", [])
        empty = pd.DataFrame(columns=cols)
        return {
            "meta": meta,
            "columns": columns_meta(empty),
            "rows": [],
            "relatedOptions": fk_option_list(mdef["related_domain"]),
        }
    df = load_df(path)
    if ownerId and mdef["owner_field"] in df.columns:
        df = df[df[mdef["owner_field"]].astype(str) == str(ownerId)]
    return {
        "meta": meta,
        "columns": columns_meta(df),
        "rows": df.to_dict(orient="records"),
        "relatedOptions": fk_option_list(mdef["related_domain"]),
    }


@app.post("/api/domains/{key}/maps/{map_key}/rows")
def create_map_row(key: str, map_key: str, body: MapCreate):
    d = DOMAINS_BY_KEY.get(key)
    if not d:
        raise HTTPException(404, "unknown domain")
    mdef = map_by_key(key, map_key)
    if not mdef:
        raise HTTPException(404, "unknown map")
    if not str(body.ownerId).strip() or not str(body.relatedId).strip():
        raise HTTPException(400, "ownerId / relatedId 는 필수입니다.")

    path = _map_path(d, mdef)
    path.parent.mkdir(parents=True, exist_ok=True)
    if path.exists():
        df = load_df(path)
    else:
        cols = ["MAP_ID", mdef["owner_field"], mdef["related_field"]] + mdef.get("extra_fields", [])
        df = pd.DataFrame(columns=cols)

    # 중복 연결 방지
    if len(df) and mdef["owner_field"] in df.columns and mdef["related_field"] in df.columns:
        dup = df[
            (df[mdef["owner_field"]].astype(str) == str(body.ownerId))
            & (df[mdef["related_field"]].astype(str) == str(body.relatedId))
        ]
        if len(dup):
            raise HTTPException(400, "이미 연결된 항목입니다.")

    row = {c: "" for c in df.columns}
    row["MAP_ID"] = next_map_id(df)
    row[mdef["owner_field"]] = str(body.ownerId)
    row[mdef["related_field"]] = str(body.relatedId)
    for k, v in (body.values or {}).items():
        if k in row and k not in ("MAP_ID", mdef["owner_field"], mdef["related_field"]):
            row[k] = "" if v is None else str(v)

    df = pd.concat([df, pd.DataFrame([row])], ignore_index=True)
    save_df(df, path)
    append_history(
        d, "MAP_ADDED", row["MAP_ID"],
        f"{mdef['title']} 연결: {body.ownerId} ↔ {body.relatedId}",
    )
    return {"id": row["MAP_ID"], "row": row}


@app.delete("/api/domains/{key}/maps/{map_key}/rows/{map_id}")
def delete_map_row(key: str, map_key: str, map_id: str):
    d = DOMAINS_BY_KEY.get(key)
    if not d:
        raise HTTPException(404, "unknown domain")
    mdef = map_by_key(key, map_key)
    if not mdef:
        raise HTTPException(404, "unknown map")
    path = _map_path(d, mdef)
    if not path.exists():
        raise HTTPException(404, "map csv not found")
    df = load_df(path)
    if "MAP_ID" not in df.columns or map_id not in df["MAP_ID"].astype(str).values:
        raise HTTPException(404, "map row not found")
    target = df[df["MAP_ID"].astype(str) == map_id].iloc[0]
    note = f"{mdef['title']} 연결 해제: {target.get(mdef['owner_field'])} ↔ {target.get(mdef['related_field'])}"
    df = df[df["MAP_ID"].astype(str) != map_id]
    save_df(df, path)
    append_history(d, "MAP_REMOVED", map_id, note)
    return {"deleted": map_id}

@app.post("/api/domains/{key}/rows")
def create_row(key: str, body: RowCreate):
    d = DOMAINS_BY_KEY.get(key)
    if not d:
        raise HTTPException(404, "unknown domain")
    path = _csv_path(d)
    df = load_df(path)

    new_id = next_id(df, d["id_field"], d["prefix"])
    row = {c: "" for c in df.columns}
    for k, v in body.values.items():
        if k in row:
            row[k] = "" if v is None else str(v)
    row[d["id_field"]] = new_id

    title_val = row.get(d["title_field"], "")
    if not str(title_val).strip():
        raise HTTPException(400, f"{ko_label(d['title_field'])}은(는) 필수입니다.")

    df = pd.concat([df, pd.DataFrame([row])], ignore_index=True)
    save_df(df, path)
    append_history(d, "ADDED", new_id, f"{d['title']} 신규 등록: {title_val}")
    return {"id": new_id, "row": row}


@app.put("/api/domains/{key}/rows/{row_id}")
def update_row(key: str, row_id: str, body: RowUpdate):
    d = DOMAINS_BY_KEY.get(key)
    if not d:
        raise HTTPException(404, "unknown domain")
    path = _csv_path(d)
    df = load_df(path)
    id_field = d["id_field"]
    mask = df[id_field].astype(str) == str(row_id)
    if not mask.any():
        raise HTTPException(404, "row not found")

    idx = df.index[mask][0]
    for k, v in body.values.items():
        if k == id_field:
            continue  # PK 변경 불가
        if k in df.columns:
            df.at[idx, k] = "" if v is None else str(v)

    title_val = df.at[idx, d["title_field"]] if d["title_field"] in df.columns else ""
    if not str(title_val).strip():
        raise HTTPException(400, f"{ko_label(d['title_field'])}은(는) 필수입니다.")

    save_df(df, path)
    row = df.loc[idx].astype(str).to_dict()
    append_history(d, "UPDATED", row_id, f"{d['title']} 수정: {title_val}")
    return {"id": row_id, "row": row}


@app.delete("/api/domains/{key}/rows/{row_id}")
def delete_row(key: str, row_id: str):
    d = DOMAINS_BY_KEY.get(key)
    if not d:
        raise HTTPException(404, "unknown domain")
    path = _csv_path(d)
    df = load_df(path)
    if row_id not in df[d["id_field"]].astype(str).values:
        raise HTTPException(404, "row not found")
    target = df[df[d["id_field"]].astype(str) == row_id]
    title_val = target.iloc[0].get(d["title_field"], "") if len(target) else ""
    df = df[df[d["id_field"]].astype(str) != row_id]
    save_df(df, path)
    append_history(d, "REMOVED", row_id, f"{d['title']} 삭제: {title_val}")
    return {"deleted": row_id}


@app.get("/api/domains/{key}/history")
def get_history(key: str):
    d = DOMAINS_BY_KEY.get(key)
    if not d:
        raise HTTPException(404, "unknown domain")
    path = _history_path(d)
    if not path.exists():
        return {"columns": columns_meta(pd.DataFrame(columns=HISTORY_HEADER)), "rows": []}
    hist = pd.read_csv(path, dtype=str, keep_default_na=False)
    return {"columns": columns_meta(hist), "rows": hist.to_dict(orient="records")}


@app.get("/api/dashboard")
def dashboard():
    def count_of(key):
        d = DOMAINS_BY_KEY[key]
        p = _csv_path(d)
        return len(load_df(p)) if p.exists() else 0

    ci_path = _csv_path(DOMAINS_BY_KEY["config"])
    category = []
    status_dist = []
    total_assets = 0
    if ci_path.exists():
        ci = load_df(ci_path)
        total_assets = len(ci)
        vc = ci["CI_CATEGORY"].value_counts()
        category = [
            {"category": k, "label": CATEGORY_LABELS_KO.get(k, k), "count": int(v)}
            for k, v in vc.items()
        ]
        if "STATUS" in ci.columns:
            sc = ci["STATUS"].replace("", "미지정").value_counts()
            status_dist = [{"status": k, "count": int(v)} for k, v in sc.items()]

    # 대시보드 하단 테이블용 최근 변경 이력 (최신 8건)
    change_path = _csv_path(DOMAINS_BY_KEY["change"])
    recent_changes = []
    if change_path.exists():
        ch = load_df(change_path)
        cols = ["CHG_TICKET_ID", "CHG_TITLE", "CHG_TYPE", "CHG_STATUS", "APPLIED_DT"]
        cols = [c for c in cols if c in ch.columns]
        recent_changes = ch[cols].tail(8).iloc[::-1].to_dict(orient="records")

    # 도메인별 건수
    domain_counts = [
        {"key": d["key"], "title": d["title"], "icon": d["icon"], "count": count_of(d["key"])}
        for d in DOMAINS
    ]

    # CI 이력(추가/삭제) — wiki CI_HISTORY.csv 계승
    ci_hist_path = ROOT / "3_구성관리" / "구성이력" / "CI_HISTORY.csv"
    ci_added = ci_removed = 0
    if ci_hist_path.exists():
        h = load_df(ci_hist_path)
        if "ACTION" in h.columns:
            ci_added = int((h["ACTION"] == "ADDED").sum())
            ci_removed = int((h["ACTION"] == "REMOVED").sum())

    return {
        "kpis": {
            "totalAssets": total_assets,
            "change": count_of("change"),
            "incident": count_of("incident"),
            "problem": count_of("problem"),
            "ciAdded": ci_added,
            "ciRemoved": ci_removed,
        },
        "category": category,
        "statusDistribution": status_dist,
        "domainCounts": domain_counts,
        "recentChanges": recent_changes,
    }


def _extract_mermaid(html, elem_id):
    m = re.search(rf'id="{elem_id}"[^>]*>(.*?)</div>', html, re.DOTALL)
    return m.group(1).strip() if m else ""


@app.get("/api/erd")
def erd():
    if not ERD_HTML.exists():
        raise HTTPException(404, "ERD.html not found")
    html = ERD_HTML.read_text(encoding="utf-8")
    return {
        "logical": _extract_mermaid(html, "erd-diagram-logical"),
        "physical": _extract_mermaid(html, "erd-diagram-physical"),
    }


# ---------- 경영관리 (비밀번호 게이트 + PDF) ----------
def _expected_password():
    return os.environ.get("MGMT_PASSWORD")


def _list_pdfs(subdir):
    base = ROOT / "4_경영관리" / subdir
    if not base.exists():
        return []
    return sorted([{"name": p.name, "subdir": subdir} for p in base.glob("*.pdf")], key=lambda x: x["name"])


@app.post("/api/management/unlock")
def management_unlock(body: AuthBody):
    expected = _expected_password()
    if not expected:
        raise HTTPException(503, "관리자가 MGMT_PASSWORD를 설정하지 않았습니다.")
    if body.password != expected:
        raise HTTPException(401, "비밀번호가 올바르지 않습니다.")
    return {
        "ok": True,
        "reports": _list_pdfs("_업무보고"),
        "artifacts": _list_pdfs("구축산출물"),
    }


@app.get("/api/management/pdf")
def management_pdf(subdir: str, name: str):
    if subdir not in ("_업무보고", "구축산출물") or "/" in name or ".." in name:
        raise HTTPException(400, "invalid path")
    path = ROOT / "4_경영관리" / subdir / name
    if not path.exists() or path.suffix.lower() != ".pdf":
        raise HTTPException(404, "pdf not found")
    return FileResponse(str(path), media_type="application/pdf", filename=name)


# ---------- 프로덕션: 빌드된 React(SPA) 서빙 ----------
# frontend dist 가 있으면 API와 동일 포트(:8000)에서 UI 제공.
# 개발(Vite :5173) 시에는 dist 없이도 동작한다.
if FRONTEND_DIST.is_dir() and (FRONTEND_DIST / "index.html").exists():
    assets_dir = FRONTEND_DIST / "assets"
    if assets_dir.is_dir():
        app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="assets")

    @app.get("/")
    def spa_root():
        return FileResponse(FRONTEND_DIST / "index.html")

    @app.get("/{full_path:path}")
    def spa_fallback(full_path: str):
        if full_path.startswith("api/") or full_path == "api":
            raise HTTPException(404, "not found")
        candidate = FRONTEND_DIST / full_path
        if candidate.is_file():
            return FileResponse(str(candidate))
        return FileResponse(FRONTEND_DIST / "index.html")

