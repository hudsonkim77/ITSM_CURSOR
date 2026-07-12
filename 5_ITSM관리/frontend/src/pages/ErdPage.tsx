import { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";
import { getErd } from "../api";

mermaid.initialize({ startOnLoad: false, theme: "neutral", er: { useMaxWidth: false } });

export default function ErdPage() {
  const [mode, setMode] = useState<"logical" | "physical">("logical");
  const [defs, setDefs] = useState<{ logical: string; physical: string } | null>(null);
  const [err, setErr] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => { getErd().then(setDefs).catch((e) => setErr(String(e))); }, []);

  useEffect(() => {
    if (!defs || !ref.current) return;
    const code = defs[mode];
    const el = ref.current;
    el.innerHTML = "";
    mermaid
      .render(`erd-${mode}-${Date.now()}`, code)
      .then(({ svg }) => { el.innerHTML = svg; })
      .catch(() => { el.innerHTML = `<pre class="text-xs text-slate-500">${code}</pre>`; });
  }, [defs, mode]);

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">통합 데이터 모델 ERD</h1>
          <p className="mt-1 text-sm text-slate-500">13개 도메인 엔티티/관계 · 기존 wiki ERD 정의 차용</p>
        </div>
        <div className="inline-flex rounded-xl bg-slate-100 p-1">
          {(["logical", "physical"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`rounded-lg px-4 py-1.5 text-sm font-medium transition ${
                mode === m ? "bg-white text-brand-600 shadow-sm" : "text-slate-500"
              }`}
            >
              {m === "logical" ? "논리 모델" : "물리 모델"}
            </button>
          ))}
        </div>
      </header>

      {err && <div className="card p-6 text-rose-600">ERD 로드 실패: {err}</div>}
      <div className="card overflow-auto p-6">
        <div ref={ref} className="min-h-[400px] [&_svg]:mx-auto" />
      </div>
    </div>
  );
}
