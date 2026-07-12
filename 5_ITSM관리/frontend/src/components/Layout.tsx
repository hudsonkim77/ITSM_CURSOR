import { NavLink, Outlet, useLocation } from "react-router-dom";
import { LayoutDashboard, Network, Lock, ListTodo, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { getDomains, type DomainSummary } from "../api";
import { ICONS } from "../lib/ui";
import { overallProgress } from "../data/wbs";

export default function Layout() {
  const [domains, setDomains] = useState<DomainSummary[]>([]);
  const [navOpen, setNavOpen] = useState(false);
  const location = useLocation();
  const wbsPct = overallProgress();

  useEffect(() => {
    getDomains().then(setDomains).catch(() => setDomains([]));
  }, []);

  useEffect(() => {
    setNavOpen(false);
  }, [location.pathname]);

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition ${
      isActive
        ? "bg-brand-500 text-white shadow-sm"
        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
    }`;

  const aside = (
    <aside
      className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform duration-200 lg:translate-x-0 ${
        navOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <div className="flex items-center gap-2 px-5 py-5">
        <img src="/logo-mark.png" alt="logo" className="h-9 w-9 shrink-0 rounded-lg object-contain" />
        <div className="min-w-0 flex-1 leading-tight">
          <div className="truncate text-sm font-bold text-slate-900">AI활성화진흥공단</div>
          <div className="text-[11px] text-slate-400">표준운영관리 대시보드</div>
        </div>
        <button
          type="button"
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 lg:hidden"
          onClick={() => setNavOpen(false)}
          aria-label="메뉴 닫기"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-6">
        <NavLink to="/" end className={linkClass}>
          <LayoutDashboard className="h-4 w-4" /> 대시보드
        </NavLink>
        <NavLink to="/wbs" className={linkClass}>
          <ListTodo className="h-4 w-4" />
          <span className="flex-1">WBS 진척</span>
          <span className="rounded-full bg-slate-100 px-2 text-[11px] text-slate-500">{wbsPct}%</span>
        </NavLink>

        <div className="px-3 pt-4 pb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
          운영 도메인
        </div>
        {domains.map((d) => {
          const Icon = ICONS[d.icon] ?? Network;
          return (
            <NavLink key={d.key} to={`/d/${d.key}`} className={linkClass}>
              <Icon className="h-4 w-4 shrink-0" />
              <span className="flex-1 truncate">{d.title}</span>
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
  );

  return (
    <div className="flex min-h-screen">
      {navOpen && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-slate-900/40 lg:hidden"
          aria-label="메뉴 배경"
          onClick={() => setNavOpen(false)}
        />
      )}
      {aside}

      <main className="min-w-0 flex-1 lg:ml-64">
        <div className="sticky top-0 z-20 flex items-center gap-3 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur lg:hidden">
          <button
            type="button"
            className="rounded-xl bg-slate-100 p-2 text-slate-700"
            onClick={() => setNavOpen(true)}
            aria-label="메뉴 열기"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="min-w-0 truncate text-sm font-bold text-slate-900">AI활성화진흥공단</div>
        </div>
        <div
          key={location.pathname}
          className={`mx-auto px-4 py-6 sm:px-8 sm:py-8 ${location.pathname === "/erd" ? "max-w-none" : "max-w-7xl"}`}
        >
          <Outlet />
        </div>
      </main>
    </div>
  );
}
