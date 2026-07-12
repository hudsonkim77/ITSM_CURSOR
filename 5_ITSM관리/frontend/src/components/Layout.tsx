import { NavLink, Outlet, useLocation } from "react-router-dom";
import { LayoutDashboard, Network, Lock } from "lucide-react";
import { useEffect, useState } from "react";
import { getDomains, type DomainSummary } from "../api";
import { ICONS } from "../lib/ui";

export default function Layout() {
  const [domains, setDomains] = useState<DomainSummary[]>([]);
  const location = useLocation();

  useEffect(() => {
    getDomains().then(setDomains).catch(() => setDomains([]));
  }, []);

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition ${
      isActive
        ? "bg-brand-500 text-white shadow-sm"
        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
    }`;

  return (
    <div className="flex min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-20 flex w-64 flex-col border-r border-slate-200 bg-white">
        <div className="flex items-center gap-2 px-5 py-5">
          <img src="/logo-mark.png" alt="logo" className="h-9 w-9 rounded-lg object-contain" />
          <div className="leading-tight">
            <div className="text-sm font-bold text-slate-900">ITSM<span className="text-brand-500">·CURSOR</span></div>
            <div className="text-[11px] text-slate-400">표준운영관리 대시보드</div>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-6">
          <NavLink to="/" end className={linkClass}>
            <LayoutDashboard className="h-4 w-4" /> 대시보드
          </NavLink>

          <div className="px-3 pt-4 pb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            운영 도메인
          </div>
          {domains.map((d) => {
            const Icon = ICONS[d.icon] ?? Network;
            return (
              <NavLink key={d.key} to={`/d/${d.key}`} className={linkClass}>
                <Icon className="h-4 w-4" />
                <span className="flex-1">{d.title}</span>
                <span className="rounded-full bg-slate-100 px-2 text-[11px] text-slate-500">{d.count}</span>
              </NavLink>
            );
          })}

          <div className="px-3 pt-4 pb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            기타
          </div>
          <NavLink to="/erd" className={linkClass}>
            <Network className="h-4 w-4" /> ERD
          </NavLink>
          <NavLink to="/management" className={linkClass}>
            <Lock className="h-4 w-4" /> 경영관리
          </NavLink>
        </nav>

        <div className="border-t border-slate-200 px-5 py-3 text-[11px] text-slate-400">
          대한민국 공공기관 표준운영관리 · ITIL v4 기반
        </div>
      </aside>

      <main className="ml-64 flex-1">
        <div key={location.pathname} className="mx-auto max-w-7xl px-8 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
