import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { Plus, Trash2, Search, History, X, Loader2 } from "lucide-react";
import {
  createRow, deleteRow, getDomain, getHistory,
  type DomainDetail, type HistoryData,
} from "../api";
import { isStatusColumn, statusChip } from "../lib/ui";

export default function DomainPage() {
  const { key = "" } = useParams();
  const [data, setData] = useState<DomainDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    getDomain(key)
      .then((d) => { setData(d); setError(""); })
      .catch((e) => setError(e?.response?.data?.detail || String(e)))
      .finally(() => setLoading(false));
  }, [key]);

  useEffect(() => { setQuery(""); load(); }, [load]);

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = query.trim().toLowerCase();
    if (!q) return data.rows;
    return data.rows.filter((r) => Object.values(r).some((v) => String(v).toLowerCase().includes(q)));
  }, [data, query]);

  if (loading && !data) return <div className="flex items-center gap-2 text-slate-400"><Loader2 className="h-4 w-4 animate-spin" /> 불러오는 중…</div>;
  if (error && !data) return <div className="card p-6 text-rose-600">{error}</div>;
  if (!data) return null;

  const idField = data.meta.idField;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{data.meta.title}</h1>
          <p className="mt-1 text-sm text-slate-500">{data.meta.folder} · 총 {data.rows.length}건</p>
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

      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          className="input pl-9"
          placeholder="검색 (모든 컬럼)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="card overflow-hidden">
        <div className="max-h-[62vh] overflow-auto">
          <table className="min-w-full text-sm">
            <thead className="sticky top-0 z-10 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                {data.columns.map((c) => (
                  <th key={c.name} className="whitespace-nowrap px-4 py-3">{c.label}</th>
                ))}
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((row, i) => (
                <tr key={row[idField] || i} className="hover:bg-slate-50/70">
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
                  <td className="px-4 py-3 text-right">
                    <button
                      className="rounded-lg p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                      title="삭제"
                      onClick={() => handleDelete(row[idField])}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={data.columns.length + 1} className="px-4 py-12 text-center text-slate-400">데이터가 없습니다.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showAdd && (
        <AddModal detail={data} onClose={() => setShowAdd(false)} onSaved={() => { setShowAdd(false); load(); }} />
      )}
      {showHistory && <HistoryDrawer domainKey={key} title={data.meta.title} onClose={() => setShowHistory(false)} />}
    </div>
  );

  async function handleDelete(id: string) {
    if (!id) return;
    if (!window.confirm(`${id} 항목을 삭제할까요? 되돌릴 수 없습니다.`)) return;
    await deleteRow(key, id);
    load();
  }
}

function AddModal({ detail, onClose, onSaved }: { detail: DomainDetail; onClose: () => void; onSaved: () => void }) {
  const idField = detail.meta.idField;
  const editable = detail.columns.filter((c) => c.name !== idField);
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const longFields = /(DESC|NOTE|SUMMARY|CAUSE|ACTION_TAKEN|WORKAROUND|PERMANENT_FIX|IMPACT_DESC|RELATED)/;

  async function submit() {
    setSaving(true); setErr("");
    try {
      await createRow(detail.meta.key, values);
      onSaved();
    } catch (e: any) {
      setErr(e?.response?.data?.detail || "저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 p-4" onClick={onClose}>
      <div className="card max-h-[85vh] w-full max-w-2xl overflow-hidden p-0" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h3 className="font-semibold text-slate-900">{detail.meta.title} 등록</h3>
          <button className="rounded-lg p-1 text-slate-400 hover:bg-slate-100" onClick={onClose}><X className="h-5 w-5" /></button>
        </div>
        <div className="max-h-[60vh] space-y-4 overflow-auto px-6 py-5">
          <p className="text-xs text-slate-400">
            <span className="font-mono">{idField}</span> 는 자동 채번됩니다. <span className="text-brand-600 font-medium">{detail.columns.find((c) => c.name === detail.meta.titleField)?.label}</span> 는 필수입니다.
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {editable.map((c) => {
              const isLong = longFields.test(c.name);
              return (
                <label key={c.name} className={isLong ? "sm:col-span-2" : ""}>
                  <span className="mb-1 block text-xs font-medium text-slate-600">
                    {c.label}
                    {c.name === detail.meta.titleField && <span className="text-rose-500"> *</span>}
                  </span>
                  {isLong ? (
                    <textarea className="input min-h-[72px]" value={values[c.name] || ""}
                      onChange={(e) => setValues((v) => ({ ...v, [c.name]: e.target.value }))} />
                  ) : (
                    <input className="input" value={values[c.name] || ""}
                      onChange={(e) => setValues((v) => ({ ...v, [c.name]: e.target.value }))} />
                  )}
                </label>
              );
            })}
          </div>
          {err && <div className="rounded-xl bg-rose-50 px-4 py-2 text-sm text-rose-600">{err}</div>}
        </div>
        <div className="flex justify-end gap-2 border-t border-slate-200 px-6 py-4">
          <button className="btn-ghost" onClick={onClose}>취소</button>
          <button className="btn-primary" onClick={submit} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />} 등록
          </button>
        </div>
      </div>
    </div>
  );
}

function HistoryDrawer({ domainKey, title, onClose }: { domainKey: string; title: string; onClose: () => void }) {
  const [hist, setHist] = useState<HistoryData | null>(null);
  useEffect(() => { getHistory(domainKey).then(setHist).catch(() => setHist({ columns: [], rows: [] })); }, [domainKey]);

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
            {[...hist.rows].reverse().map((r, i) => (
              <li key={i} className="rounded-xl border border-slate-200 p-3">
                <div className="flex items-center justify-between">
                  <span className={`chip ${r.ACTION === "ADDED" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
                    {r.ACTION === "ADDED" ? "등록" : "삭제"}
                  </span>
                  <span className="font-mono text-xs text-slate-400">{r.TARGET_ID}</span>
                </div>
                <div className="mt-2 text-sm text-slate-700">{r.NOTE}</div>
                <div className="mt-1 text-[11px] text-slate-400">{r.ACTION_DT} · {r.ACTION_BY}</div>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
