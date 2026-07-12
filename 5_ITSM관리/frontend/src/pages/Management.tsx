import { useState } from "react";
import { Lock, FileText, Loader2 } from "lucide-react";
import { pdfUrl, unlockManagement } from "../api";

interface Pdf { name: string; subdir: string; }

export default function Management() {
  const [pw, setPw] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [reports, setReports] = useState<Pdf[]>([]);
  const [artifacts, setArtifacts] = useState<Pdf[]>([]);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr("");
    try {
      const res = await unlockManagement(pw);
      setReports(res.reports); setArtifacts(res.artifacts); setUnlocked(true);
    } catch (e: any) {
      setErr(e?.response?.data?.detail || "인증에 실패했습니다.");
    } finally {
      setBusy(false);
    }
  }

  if (!unlocked) {
    return (
      <div className="mx-auto max-w-md pt-16">
        <div className="card p-8">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-100 text-brand-600">
            <Lock className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">경영관리 접근 제한</h1>
          <p className="mt-1 text-sm text-slate-500">업무보고·구축산출물은 비밀번호 확인 후 열람할 수 있습니다.</p>
          <form onSubmit={submit} className="mt-6 space-y-3">
            <input
              type="password" className="input" placeholder="비밀번호"
              value={pw} onChange={(e) => setPw(e.target.value)} autoFocus
            />
            {err && <div className="rounded-xl bg-rose-50 px-4 py-2 text-sm text-rose-600">{err}</div>}
            <button className="btn-primary w-full justify-center" disabled={busy}>
              {busy && <Loader2 className="h-4 w-4 animate-spin" />} 확인
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">경영관리</h1>
        <p className="mt-1 text-sm text-slate-500">4_경영관리 · 업무보고 및 구축산출물</p>
      </header>
      <PdfList title="업무보고" items={reports} />
      <PdfList title="구축산출물" items={artifacts} />
    </div>
  );
}

function PdfList({ title, items }: { title: string; items: Pdf[] }) {
  return (
    <section>
      <h2 className="mb-3 font-semibold text-slate-900">{title}</h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {items.map((p) => (
          <a
            key={p.name} href={pdfUrl(p.subdir, p.name)} target="_blank" rel="noopener noreferrer"
            className="card flex items-center gap-3 p-4 transition hover:shadow-pop"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
              <FileText className="h-5 w-5" />
            </span>
            <span className="line-clamp-2 text-sm font-medium text-slate-700">{p.name.replace(/\.pdf$/i, "")}</span>
          </a>
        ))}
      </div>
    </section>
  );
}
