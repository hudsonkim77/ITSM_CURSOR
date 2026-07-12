import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { Plus, Trash2, Pencil, Search, History, X, Loader2, Link2, Printer } from "lucide-react";
import {
  createRow, updateRow, deleteRow, getDomain, getHistory, getFkOptions,
  getMapRows, createMapRow, deleteMapRow,
  type Column, type DomainDetail, type FkMeta, type FkOption, type HistoryData,
  type MapData, type MapMeta,
} from "../api";
import { isStatusColumn, statusChip } from "../lib/ui";
import { distinctByColumn, fieldHint } from "../lib/fieldHints";
import OfficialDocPrint, { type OfficialDocPayload } from "../components/OfficialDocPrint";
import {
  docTitleFor, getStoredDrafter, hasOfficialDoc, setStoredDrafter,
} from "../lib/printDocs";

const TYPE_COL = /(TYPE|CATEGORY|SEVERITY|IMPACT_LEVEL|METRIC_TYPE|PROTOCOL|ACTION_TYPE)/;

function isFilterStatusCol(name: string) {
  return isStatusColumn(name) || /_STATUS$/.test(name) || name === "STATUS";
}
function isFilterTypeCol(name: string) {
  return TYPE_COL.test(name);
}
function uniqueValues(rows: Record<string, string>[], col: string): string[] {
  const set = new Set<string>();
  for (const r of rows) {
    const v = (r[col] || "").trim();
    if (v) set.add(v);
  }
  return [...set].sort((a, b) => a.localeCompare(b, "ko"));
}

export default function DomainPage() {
  const { key = "" } = useParams();
  const [data, setData] = useState<DomainDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editRow, setEditRow] = useState<Record<string, string> | null>(null);
  const [mapOwner, setMapOwner] = useState<Record<string, string> | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [printDoc, setPrintDoc] = useState<OfficialDocPayload | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    getDomain(key)
      .then((d) => { setData(d); setError(""); })
      .catch((e) => setError(e?.response?.data?.detail || String(e)))
      .finally(() => setLoading(false));
  }, [key]);

  useEffect(() => {
    setQuery("");
    setStatusFilter("");
    setTypeFilter("");
    setEditRow(null);
    setMapOwner(null);
    load();
  }, [load]);

  const statusCol = useMemo(
    () => data?.columns.find((c) => isFilterStatusCol(c.name))?.name || "",
    [data],
  );
  const typeCol = useMemo(
    () => data?.columns.find((c) => isFilterTypeCol(c.name) && c.name !== statusCol)?.name || "",
    [data, statusCol],
  );
  const statusOptions = useMemo(
    () => (data && statusCol ? uniqueValues(data.rows, statusCol) : []),
    [data, statusCol],
  );
  const typeOptions = useMemo(
    () => (data && typeCol ? uniqueValues(data.rows, typeCol) : []),
    [data, typeCol],
  );

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = query.trim().toLowerCase();
    return data.rows.filter((r) => {
      if (statusFilter && statusCol && (r[statusCol] || "") !== statusFilter) return false;
      if (typeFilter && typeCol && (r[typeCol] || "") !== typeFilter) return false;
      if (!q) return true;
      return Object.values(r).some((v) => String(v).toLowerCase().includes(q));
    });
  }, [data, query, statusFilter, typeFilter, statusCol, typeCol]);

  if (loading && !data) {
    return (
      <div className="flex items-center gap-2 text-slate-400">
        <Loader2 className="h-4 w-4 animate-spin" /> 불러오는 중…
      </div>
    );
  }
  if (error && !data) return <div className="card p-6 text-rose-600">{error}</div>;
  if (!data) return null;

  const idField = data.meta.idField;
  const hasMaps = (data.maps?.length || 0) > 0;
  const statusLabel = data.columns.find((c) => c.name === statusCol)?.label || "상태";
  const typeLabel = data.columns.find((c) => c.name === typeCol)?.label || "유형";

  async function handleDelete(id: string) {
    if (!id) return;
    if (!window.confirm(`${id} 항목을 삭제할까요? 되돌릴 수 없습니다.`)) return;
    await deleteRow(key, id);
    if (mapOwner?.[idField] === id) setMapOwner(null);
    load();
  }

  function openPrint(row: Record<string, string>, drafter?: string) {
    setPrintDoc({
      domainKey: key,
      domainTitle: data!.meta.title,
      columns: data!.columns,
      row,
      idField,
      drafter: (drafter ?? getStoredDrafter()).trim(),
    });
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{data.meta.title}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {data.meta.folder} · 전체 {data.rows.length}건
            {filtered.length !== data.rows.length && (
              <span className="text-brand-600"> · 표시 {filtered.length}건</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-ghost" onClick={() => setShowHistory(true)}>
            <History className="h-4 w-4" /> 이력
          </button>
          <button className="btn-primary" onClick={() => setShowAdd(true)}>
            <Plus className="h-4 w-4" /> 등록
          </button>
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] max-w-md flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            className="input pl-9"
            placeholder="검색 (모든 컬럼)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        {statusCol && statusOptions.length > 0 && (
          <select className="input w-auto min-w-[140px]" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">전체 {statusLabel}</option>
            {statusOptions.map((v) => <option key={v} value={v}>{v}</option>)}
          </select>
        )}
        {typeCol && typeOptions.length > 0 && (
          <select className="input w-auto min-w-[140px]" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="">전체 {typeLabel}</option>
            {typeOptions.map((v) => <option key={v} value={v}>{v}</option>)}
          </select>
        )}
        {(statusFilter || typeFilter || query) && (
          <button className="btn-ghost !py-2 text-xs" onClick={() => { setQuery(""); setStatusFilter(""); setTypeFilter(""); }}>
            필터 초기화
          </button>
        )}
      </div>

      <div className="card overflow-hidden">
        <div className="max-h-[52vh] overflow-auto">
          <table className="min-w-full text-sm">
            <thead className="sticky top-0 z-10 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                {data.columns.map((c) => (
                  <th key={c.name} className="whitespace-nowrap px-4 py-3">{c.label}</th>
                ))}
                <th className="px-4 py-3 text-right">작업</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((row, i) => {
                const selected = mapOwner?.[idField] === row[idField];
                return (
                  <tr key={row[idField] || i} className={`hover:bg-slate-50/70 ${selected ? "bg-brand-50/60" : ""}`}>
                    {data.columns.map((c) => (
                      <td key={c.name} className="whitespace-nowrap px-4 py-3 text-slate-700">
                        {c.name === idField ? (
                          <span className="font-mono text-xs font-semibold text-brand-600">{row[c.name]}</span>
                        ) : isStatusColumn(c.name) && row[c.name] ? (
                          <span className={`chip ${statusChip(row[c.name])}`}>{row[c.name]}</span>
                        ) : (
                          <span className="line-clamp-1 max-w-[280px]" title={row[c.name]}>{row[c.name] || "—"}</span>
                        )}
                      </td>
                    ))}
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      {hasMaps && (
                        <button
                          className={`rounded-lg p-1.5 transition ${selected ? "bg-brand-100 text-brand-700" : "text-slate-400 hover:bg-brand-50 hover:text-brand-600"}`}
                          title="연결(매핑)"
                          onClick={() => setMapOwner(selected ? null : row)}
                        >
                          <Link2 className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        className="rounded-lg p-1.5 text-slate-400 transition hover:bg-brand-50 hover:text-brand-600"
                        title={`${docTitleFor(key, data.meta.title)} 출력`}
                        onClick={() => openPrint(row)}
                      >
                        <Printer className="h-4 w-4" />
                      </button>
                      <button
                        className="rounded-lg p-1.5 text-slate-400 transition hover:bg-brand-50 hover:text-brand-600"
                        title="수정"
                        onClick={() => setEditRow(row)}
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        className="rounded-lg p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                        title="삭제"
                        onClick={() => handleDelete(row[idField])}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={data.columns.length + 1} className="px-4 py-12 text-center text-slate-400">
                    조건에 맞는 데이터가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {mapOwner && hasMaps && (
        <MapPanel
          domainKey={key}
          owner={mapOwner}
          idField={idField}
          titleField={data.meta.titleField}
          maps={data.maps || []}
          onClose={() => setMapOwner(null)}
        />
      )}

      {showAdd && (
        <RowModal
          mode="create"
          detail={data}
          onClose={() => setShowAdd(false)}
          onSaved={(created) => {
            setShowAdd(false);
            load();
            if (created && hasOfficialDoc(key)) openPrint(created.row, created.drafter);
          }}
        />
      )}
      {editRow && (
        <RowModal
          mode="edit"
          detail={data}
          initial={editRow}
          onClose={() => setEditRow(null)}
          onSaved={() => { setEditRow(null); load(); }}
        />
      )}
      {showHistory && <HistoryDrawer domainKey={key} title={data.meta.title} onClose={() => setShowHistory(false)} />}
      {printDoc && <OfficialDocPrint payload={printDoc} onClose={() => setPrintDoc(null)} />}
    </div>
  );
}

function MapPanel({
  domainKey, owner, idField, titleField, maps, onClose,
}: {
  domainKey: string;
  owner: Record<string, string>;
  idField: string;
  titleField: string;
  maps: MapMeta[];
  onClose: () => void;
}) {
  const [active, setActive] = useState(maps[0]?.key || "");
  const [data, setData] = useState<MapData | null>(null);
  const [relatedId, setRelatedId] = useState("");
  const [extras, setExtras] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const ownerId = owner[idField];

  const load = useCallback(() => {
    if (!active || !ownerId) return;
    getMapRows(domainKey, active, ownerId)
      .then((d) => { setData(d); setErr(""); })
      .catch((e) => setErr(e?.response?.data?.detail || String(e)));
  }, [domainKey, active, ownerId]);

  useEffect(() => { setRelatedId(""); setExtras({}); load(); }, [load]);

  const meta = maps.find((m) => m.key === active);

  async function addLink() {
    if (!relatedId) { setErr("연결 대상을 선택하세요."); return; }
    setBusy(true); setErr("");
    try {
      await createMapRow(domainKey, active, { ownerId, relatedId, values: extras });
      setRelatedId(""); setExtras({});
      load();
    } catch (e: any) {
      setErr(e?.response?.data?.detail || "연결에 실패했습니다.");
    } finally {
      setBusy(false);
    }
  }

  async function removeLink(mapId: string) {
    if (!window.confirm(`${mapId} 연결을 해제할까요?`)) return;
    await deleteMapRow(domainKey, active, mapId);
    load();
  }

  return (
    <div className="card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-3">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <Link2 className="h-4 w-4 text-brand-500" /> N:M 매핑
          </div>
          <p className="mt-0.5 text-xs text-slate-500">
            <span className="font-mono text-brand-600">{ownerId}</span>
            {owner[titleField] ? ` · ${owner[titleField]}` : ""}
          </p>
        </div>
        <button className="btn-ghost !py-1.5 text-xs" onClick={onClose}>닫기</button>
      </div>

      {maps.length > 1 && (
        <div className="flex gap-1 border-b border-slate-100 px-3 py-2">
          {maps.map((m) => (
            <button
              key={m.key}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium ${active === m.key ? "bg-brand-500 text-white" : "text-slate-600 hover:bg-slate-100"}`}
              onClick={() => setActive(m.key)}
            >
              {m.title}
            </button>
          ))}
        </div>
      )}

      <div className="space-y-4 p-5">
        <div className="flex flex-wrap items-end gap-3">
          <label className="min-w-[260px] flex-1">
            <span className="mb-1 block text-xs font-medium text-slate-600">
              {meta ? `${meta.title} · 연결 대상` : "연결 대상"}
            </span>
            <select className="input" value={relatedId} onChange={(e) => setRelatedId(e.target.value)}>
              <option value="">(선택)</option>
              {(data?.relatedOptions || []).map((o) => (
                <option key={o.id} value={o.id}>{o.label}</option>
              ))}
            </select>
          </label>
          {(meta?.extraFields || []).slice(0, 2).map((f) => (
            <label key={f.name} className="min-w-[140px]">
              <span className="mb-1 block text-xs font-medium text-slate-600">{f.label}</span>
              <input
                className="input"
                value={extras[f.name] || ""}
                onChange={(e) => setExtras((v) => ({ ...v, [f.name]: e.target.value }))}
              />
            </label>
          ))}
          <button className="btn-primary" onClick={addLink} disabled={busy}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" />} 연결 추가
          </button>
        </div>
        {err && <div className="rounded-xl bg-rose-50 px-4 py-2 text-sm text-rose-600">{err}</div>}

        <div className="overflow-auto rounded-xl border border-slate-200">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold text-slate-500">
              <tr>
                {(data?.columns || []).map((c) => (
                  <th key={c.name} className="px-3 py-2">{c.label}</th>
                ))}
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(data?.rows || []).map((r) => (
                <tr key={r.MAP_ID}>
                  {(data?.columns || []).map((c) => (
                    <td key={c.name} className="whitespace-nowrap px-3 py-2 text-slate-700">
                      {c.name === "MAP_ID" || c.name.endsWith("_ID") ? (
                        <span className="font-mono text-xs">{r[c.name] || "—"}</span>
                      ) : (r[c.name] || "—")}
                    </td>
                  ))}
                  <td className="px-3 py-2 text-right">
                    <button className="rounded-lg p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600" onClick={() => removeLink(r.MAP_ID)}>
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {(!data || data.rows.length === 0) && (
                <tr>
                  <td colSpan={(data?.columns.length || 1) + 1} className="px-3 py-8 text-center text-slate-400">
                    연결된 항목이 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function RowModal({
  mode, detail, initial, onClose, onSaved,
}: {
  mode: "create" | "edit";
  detail: DomainDetail;
  initial?: Record<string, string>;
  onClose: () => void;
  onSaved: (created?: { row: Record<string, string>; drafter: string }) => void;
}) {
  const idField = detail.meta.idField;
  const editable = detail.columns.filter((c) => c.name !== idField);
  const fks = detail.fks || [];
  const wantsDoc = hasOfficialDoc(detail.meta.key);
  const [values, setValues] = useState<Record<string, string>>(() => {
    if (mode === "edit" && initial) {
      const v: Record<string, string> = {};
      for (const c of editable) v[c.name] = initial[c.name] || "";
      return v;
    }
    return {};
  });
  const [drafter, setDrafter] = useState(() => getStoredDrafter());
  const [fkOptions, setFkOptions] = useState<Record<string, FkOption[]>>({});
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    const exclude = mode === "edit" ? initial?.[idField] || "" : "";
    getFkOptions(detail.meta.key, exclude).then(setFkOptions).catch(() => setFkOptions({}));
  }, [detail.meta.key, mode, initial, idField]);

  async function submit() {
    setSaving(true); setErr("");
    try {
      if (mode === "create") {
        const name = drafter.trim();
        if (wantsDoc && !name) {
          setErr("기안자 성명을 입력하세요. (문서 출력 시 전자결재란에 기입됩니다)");
          setSaving(false);
          return;
        }
        if (name) setStoredDrafter(name);
        const res = await createRow(detail.meta.key, values) as { id: string; row: Record<string, string> };
        onSaved({ row: res.row, drafter: name });
      } else {
        const id = initial?.[idField];
        if (!id) throw new Error("ID가 없습니다.");
        await updateRow(detail.meta.key, id, values);
        onSaved();
      }
    } catch (e: any) {
      setErr(e?.response?.data?.detail || e?.message || "저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 p-4" onClick={onClose}>
      <div className="card max-h-[85vh] w-full max-w-2xl overflow-hidden p-0" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h3 className="font-semibold text-slate-900">
              {detail.meta.title} {mode === "create" ? "등록" : "수정"}
            </h3>
            {mode === "create" && wantsDoc && (
              <p className="mt-0.5 text-xs text-slate-500">
                등록 후 <span className="font-medium text-brand-600">{docTitleFor(detail.meta.key, detail.meta.title)}</span> 출력이 이어집니다
              </p>
            )}
          </div>
          <button className="rounded-lg p-1 text-slate-400 hover:bg-slate-100" onClick={onClose}><X className="h-5 w-5" /></button>
        </div>
        <div className="max-h-[60vh] space-y-4 overflow-auto px-6 py-5">
          {mode === "create" ? (
            <p className="text-xs text-slate-400">
              <span className="font-mono">{idField}</span> 는 자동 채번됩니다.{" "}
              <span className="font-medium text-brand-600">
                {detail.columns.find((c) => c.name === detail.meta.titleField)?.label}
              </span>
              {" "}는 필수입니다.
            </p>
          ) : (
            <p className="text-xs text-slate-400">
              ID <span className="font-mono font-semibold text-brand-600">{initial?.[idField]}</span> · PK는 변경할 수 없습니다.
            </p>
          )}
          {mode === "create" && (
            <label className="block rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3">
              <span className="mb-1 block text-xs font-medium text-slate-700">
                기안자 성명{wantsDoc && <span className="text-rose-500"> *</span>}
              </span>
              <input
                className="input bg-white"
                placeholder="작성자 성명 (전자결재 기안란에 자동 기입)"
                value={drafter}
                onChange={(e) => setDrafter(e.target.value)}
                autoComplete="name"
              />
              <span className="mt-1 block text-[11px] text-slate-400">브라우저에 저장되어 다음 등록 시 자동 입력됩니다.</span>
            </label>
          )}
          <FieldGrid
            columns={editable}
            titleField={detail.meta.titleField}
            fks={fks}
            fkOptions={fkOptions}
            values={values}
            onChange={setValues}
            distinct={distinctByColumn(detail.rows, editable.map((c) => c.name))}
          />
          {err && <div className="rounded-xl bg-rose-50 px-4 py-2 text-sm text-rose-600">{err}</div>}
        </div>
        <div className="flex justify-end gap-2 border-t border-slate-200 px-6 py-4">
          <button className="btn-ghost" onClick={onClose}>취소</button>
          <button className="btn-primary" onClick={submit} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {mode === "create" ? "등록" : "저장"}
          </button>
        </div>
      </div>
    </div>
  );
}

function FieldGrid({
  columns, titleField, fks, fkOptions, values, onChange, distinct,
}: {
  columns: Column[];
  titleField: string;
  fks: FkMeta[];
  fkOptions: Record<string, FkOption[]>;
  values: Record<string, string>;
  onChange: (v: Record<string, string>) => void;
  distinct: Record<string, string[]>;
}) {
  const fkByField = useMemo(() => Object.fromEntries(fks.map((f) => [f.field, f])), [fks]);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {columns.map((c) => {
        const fk = fkByField[c.name];
        const hint = fieldHint(c.name, distinct[c.name] || []);
        return (
          <label key={c.name} className={hint.control === "textarea" ? "sm:col-span-2" : ""}>
            <span className="mb-1 block text-xs font-medium text-slate-600">
              {c.label}
              {c.name === titleField && <span className="text-rose-500"> *</span>}
              {fk && !fk.optional && <span className="text-rose-500"> *</span>}
              {fk && <span className="ml-1 text-[10px] font-normal text-slate-400">FK</span>}
            </span>
            {fk ? (
              <select
                className="input"
                value={values[c.name] || ""}
                onChange={(e) => onChange({ ...values, [c.name]: e.target.value })}
              >
                <option value="">{fk.optional ? "(없음)" : "(선택)"}</option>
                {(fkOptions[c.name] || []).map((o) => (
                  <option key={o.id} value={o.id}>{o.label}</option>
                ))}
              </select>
            ) : hint.control === "select" ? (
              <select
                className="input"
                value={values[c.name] || ""}
                onChange={(e) => onChange({ ...values, [c.name]: e.target.value })}
              >
                <option value="">(선택)</option>
                {(hint.options || []).map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            ) : hint.control === "textarea" ? (
              <textarea
                className="input min-h-[72px]"
                value={values[c.name] || ""}
                onChange={(e) => onChange({ ...values, [c.name]: e.target.value })}
              />
            ) : hint.control === "date" ? (
              <input
                type="date"
                className="input"
                value={(values[c.name] || "").slice(0, 10)}
                onChange={(e) => onChange({ ...values, [c.name]: e.target.value })}
              />
            ) : hint.control === "datetime" ? (
              <input
                type="datetime-local"
                className="input"
                value={toDatetimeLocal(values[c.name] || "")}
                onChange={(e) => onChange({ ...values, [c.name]: fromDatetimeLocal(e.target.value) })}
              />
            ) : (
              <input
                className="input"
                value={values[c.name] || ""}
                onChange={(e) => onChange({ ...values, [c.name]: e.target.value })}
              />
            )}
          </label>
        );
      })}
    </div>
  );
}

function toDatetimeLocal(v: string): string {
  if (!v) return "";
  const m = v.match(/^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2})/);
  if (m) return `${m[1]}T${m[2]}`;
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return `${v}T00:00`;
  return "";
}
function fromDatetimeLocal(v: string): string {
  if (!v) return "";
  return v.replace("T", " ") + (v.length === 16 ? ":00" : "");
}

function historyChip(action: string) {
  if (action === "ADDED" || action === "MAP_ADDED") return { label: action.startsWith("MAP") ? "연결" : "등록", cls: "bg-emerald-100 text-emerald-700" };
  if (action === "UPDATED") return { label: "수정", cls: "bg-amber-100 text-amber-800" };
  if (action === "MAP_REMOVED") return { label: "연결해제", cls: "bg-violet-100 text-violet-700" };
  return { label: "삭제", cls: "bg-rose-100 text-rose-700" };
}

function HistoryDrawer({ domainKey, title, onClose }: { domainKey: string; title: string; onClose: () => void }) {
  const [hist, setHist] = useState<HistoryData | null>(null);
  useEffect(() => {
    getHistory(domainKey).then(setHist).catch(() => setHist({ columns: [], rows: [] }));
  }, [domainKey]);

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-slate-900/40" onClick={onClose}>
      <div className="h-full w-full max-w-md overflow-auto bg-white p-6 shadow-pop" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold text-slate-900">{title} · 변경 이력</h3>
          <button className="rounded-lg p-1 text-slate-400 hover:bg-slate-100" onClick={onClose}><X className="h-5 w-5" /></button>
        </div>
        <p className="mb-4 text-xs text-slate-400">{domainKey} 폴더의 _HISTORY.csv</p>
        {!hist ? (
          <div className="text-slate-400">불러오는 중…</div>
        ) : hist.rows.length === 0 ? (
          <div className="rounded-xl bg-slate-50 px-4 py-8 text-center text-sm text-slate-400">기록된 이력이 없습니다.</div>
        ) : (
          <ol className="space-y-3">
            {[...hist.rows].reverse().map((r, i) => {
              const chip = historyChip(r.ACTION);
              return (
                <li key={i} className="rounded-xl border border-slate-200 p-3">
                  <div className="flex items-center justify-between">
                    <span className={`chip ${chip.cls}`}>{chip.label}</span>
                    <span className="font-mono text-xs text-slate-400">{r.TARGET_ID}</span>
                  </div>
                  <div className="mt-2 text-sm text-slate-700">{r.NOTE}</div>
                  <div className="mt-1 text-[11px] text-slate-400">{r.ACTION_DT} · {r.ACTION_BY}</div>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </div>
  );
}
