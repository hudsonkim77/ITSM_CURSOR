import { useCallback, useEffect, useRef, useState } from "react";
import mermaid from "mermaid";
import {
  Minus, Plus, RotateCcw, Network, Maximize2,
} from "lucide-react";
import { getDomains, getErd, type DomainSummary } from "../api";
import { ICONS } from "../lib/ui";
import { filterErdByDomain } from "../lib/erdFilter";

mermaid.initialize({
  startOnLoad: false,
  theme: "neutral",
  er: { useMaxWidth: false },
  securityLevel: "loose",
});

const MIN_SCALE = 0.2;
const MAX_SCALE = 3;
const ZOOM_STEP = 1.15;

export default function ErdPage() {
  const [mode, setMode] = useState<"logical" | "physical">("logical");
  const [defs, setDefs] = useState<{ logical: string; physical: string } | null>(null);
  const [domains, setDomains] = useState<DomainSummary[]>([]);
  const [selected, setSelected] = useState<string | null>(null); // null = 전체
  const [err, setErr] = useState("");
  const [rendering, setRendering] = useState(false);

  const viewportRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const svgHostRef = useRef<HTMLDivElement>(null);

  const scaleRef = useRef(1);
  const panRef = useRef({ x: 0, y: 0 });
  const [scaleUi, setScaleUi] = useState(100);
  const dragRef = useRef<{ active: boolean; sx: number; sy: number; px: number; py: number }>({
    active: false, sx: 0, sy: 0, px: 0, py: 0,
  });

  const applyTransform = useCallback(() => {
    const el = contentRef.current;
    if (!el) return;
    const { x, y } = panRef.current;
    const s = scaleRef.current;
    el.style.transform = `translate(${x}px, ${y}px) scale(${s})`;
    setScaleUi(Math.round(s * 100));
  }, []);

  const setZoom = useCallback((next: number) => {
    scaleRef.current = Math.min(MAX_SCALE, Math.max(MIN_SCALE, next));
    applyTransform();
  }, [applyTransform]);

  const zoomBy = useCallback((factor: number) => {
    setZoom(scaleRef.current * factor);
  }, [setZoom]);

  const resetView = useCallback(() => {
    scaleRef.current = 1;
    panRef.current = { x: 0, y: 0 };
    applyTransform();
  }, [applyTransform]);

  useEffect(() => {
    Promise.all([getErd(), getDomains()])
      .then(([e, d]) => { setDefs(e); setDomains(d); })
      .catch((e) => setErr(String(e)));
  }, []);

  // Mermaid render
  useEffect(() => {
    if (!defs || !svgHostRef.current) return;
    const host = svgHostRef.current;
    const code = filterErdByDomain(defs[mode], selected);
    let cancelled = false;
    setRendering(true);
    host.innerHTML = "";

    mermaid
      .render(`erd-${mode}-${selected || "all"}-${Date.now()}`, code)
      .then(({ svg }) => {
        if (cancelled) return;
        host.innerHTML = svg;
        const svgEl = host.querySelector("svg");
        if (svgEl) {
          const vb = svgEl.viewBox?.baseVal;
          if (vb?.width) {
            svgEl.style.width = `${vb.width}px`;
            svgEl.style.height = `${vb.height}px`;
          }
          svgEl.style.maxWidth = "none";
        }
        resetView();
      })
      .catch((e) => {
        console.error("ERD render failed", e, code.slice(0, 400));
        if (!cancelled) {
          host.innerHTML = `<pre class="whitespace-pre-wrap p-4 text-xs text-rose-600">${String(e)}\n\n${code}</pre>`;
        }
      })
      .finally(() => { if (!cancelled) setRendering(false); });

    return () => { cancelled = true; };
  }, [defs, mode, selected, resetView]);

  // Wheel zoom + drag pan + keyboard
  useEffect(() => {
    const vp = viewportRef.current;
    if (!vp) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      zoomBy(e.deltaY < 0 ? ZOOM_STEP : 1 / ZOOM_STEP);
    };

    const onDown = (e: MouseEvent) => {
      if (e.button !== 0) return;
      dragRef.current = {
        active: true,
        sx: e.clientX,
        sy: e.clientY,
        px: panRef.current.x,
        py: panRef.current.y,
      };
      vp.classList.add("cursor-grabbing");
      e.preventDefault();
    };
    const onMove = (e: MouseEvent) => {
      if (!dragRef.current.active) return;
      panRef.current = {
        x: dragRef.current.px + (e.clientX - dragRef.current.sx),
        y: dragRef.current.py + (e.clientY - dragRef.current.sy),
      };
      applyTransform();
    };
    const onUp = () => {
      dragRef.current.active = false;
      vp.classList.remove("cursor-grabbing");
    };

    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.key === "+" || e.key === "=") { e.preventDefault(); zoomBy(ZOOM_STEP); }
      else if (e.key === "-" || e.key === "_") { e.preventDefault(); zoomBy(1 / ZOOM_STEP); }
      else if (e.key === "0") { e.preventDefault(); resetView(); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); panRef.current.x += 40; applyTransform(); }
      else if (e.key === "ArrowRight") { e.preventDefault(); panRef.current.x -= 40; applyTransform(); }
      else if (e.key === "ArrowUp") { e.preventDefault(); panRef.current.y += 40; applyTransform(); }
      else if (e.key === "ArrowDown") { e.preventDefault(); panRef.current.y -= 40; applyTransform(); }
    };

    vp.addEventListener("wheel", onWheel, { passive: false });
    vp.addEventListener("mousedown", onDown);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("keydown", onKey);

    return () => {
      vp.removeEventListener("wheel", onWheel);
      vp.removeEventListener("mousedown", onDown);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("keydown", onKey);
    };
  }, [applyTransform, zoomBy, resetView]);

  const caption = selected
    ? `${domains.find((d) => d.key === selected)?.title || selected} outline · ${mode === "logical" ? "논리" : "물리"} 모델`
    : mode === "logical"
      ? "전체 논리 모델 · 13개 도메인 핵심 엔티티/관계"
      : "전체 물리 모델 · 마스터·매핑·이력 테이블";

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">통합 데이터 모델 ERD</h1>
          <p className="mt-1 text-sm text-slate-500">{caption}</p>
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

      <div className="flex gap-4" style={{ minHeight: "calc(100vh - 11rem)" }}>
        {/* 관리 목록 */}
        <aside className="card flex w-56 shrink-0 flex-col overflow-hidden">
          <div className="border-b border-slate-100 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
            관리 목록
          </div>
          <nav className="flex-1 space-y-0.5 overflow-y-auto p-2">
            <button
              type="button"
              onClick={() => setSelected(null)}
              className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium transition ${
                selected === null
                  ? "bg-brand-500 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Maximize2 className="h-4 w-4 shrink-0" />
              전체 ERD
            </button>
            {domains.map((d) => {
              const Icon = ICONS[d.icon] ?? Network;
              const active = selected === d.key;
              return (
                <button
                  key={d.key}
                  type="button"
                  onClick={() => setSelected(d.key)}
                  className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium transition ${
                    active
                      ? "bg-brand-500 text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="flex-1 truncate">{d.title}</span>
                </button>
              );
            })}
          </nav>
          <div className="border-t border-slate-100 px-3 py-2 text-[11px] leading-relaxed text-slate-400">
            선택 시 해당 관리 엔티티·직접 관계만 outline으로 표시
          </div>
        </aside>

        {/* 뷰포트 */}
        <div className="card relative flex min-w-0 flex-1 flex-col overflow-hidden">
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 px-3 py-2">
            <button type="button" className="btn-ghost !px-2.5 !py-1.5" onClick={() => zoomBy(ZOOM_STEP)} title="확대 (+)">
              <Plus className="h-4 w-4" />
            </button>
            <button type="button" className="btn-ghost !px-2.5 !py-1.5" onClick={() => zoomBy(1 / ZOOM_STEP)} title="축소 (-)">
              <Minus className="h-4 w-4" />
            </button>
            <button type="button" className="btn-ghost !px-2.5 !py-1.5" onClick={resetView} title="리셋 (0)">
              <RotateCcw className="h-4 w-4" />
              <span className="text-xs">{scaleUi}%</span>
            </button>
            <span className="ml-auto text-[11px] text-slate-400">
              휠 확대/축소 · 드래그 이동 · <kbd className="rounded bg-slate-100 px-1">+</kbd>/<kbd className="rounded bg-slate-100 px-1">-</kbd>/<kbd className="rounded bg-slate-100 px-1">0</kbd> · 방향키
            </span>
          </div>

          <div
            ref={viewportRef}
            tabIndex={0}
            className="relative flex-1 cursor-grab overflow-hidden bg-[#f8f9fc] outline-none focus:ring-2 focus:ring-inset focus:ring-brand-200"
            style={{ minHeight: 480 }}
          >
            {rendering && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/50 text-sm text-slate-400">
                렌더링 중…
              </div>
            )}
            <div
              ref={contentRef}
              className="origin-center will-change-transform"
              style={{ transform: "translate(0px, 0px) scale(1)", width: "max-content", margin: "2rem auto" }}
            >
              <div ref={svgHostRef} className="[&_svg]:block" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
