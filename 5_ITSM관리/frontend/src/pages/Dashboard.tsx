import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import {
  Boxes, GitBranch, AlertTriangle, Search, TrendingUp, TrendingDown, Network, Moon, Sun,
} from "lucide-react";
import { getDashboard, type DashboardData } from "../api";
import { ICONS, statusChip } from "../lib/ui";

const DARK_KEY = "itsm_dashboard_dark";

function Kpi({ label, value, icon: Icon, tone }: { label: string; value: number; icon: any; tone: string }) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-500">{label}</span>
        <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${tone}`}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <div className="mt-3 text-3xl font-bold tabular-nums text-slate-900">{value.toLocaleString()}</div>
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [err, setErr] = useState("");
  const [dark, setDark] = useState(() => {
    try {
      return localStorage.getItem(DARK_KEY) === "1";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    getDashboard().then(setData).catch((e) => setErr(String(e)));
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(DARK_KEY, dark ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, [dark]);

  if (err) return <div className="card p-6 text-rose-600">대시보드 로드 실패: {err}</div>;
  if (!data) return <div className="text-slate-400">불러오는 중…</div>;

  const barData = [...data.category].sort((a, b) => b.count - a.count);
  const colors = ["#3a5eef", "#5b84fa", "#8fb0ff"];

  const STATUS_LABELS: Record<string, string> = {
    OPERATIONAL: "운영중", Active: "활성", STANDBY: "대기", 미지정: "미지정",
  };
  const donutColors = ["#3a5eef", "#22c3a6", "#f4a63b", "#8fb0ff", "#e5679a"];
  const donutData = data.statusDistribution.map((s) => ({
    name: STATUS_LABELS[s.status] || s.status,
    value: s.count,
  }));

  const axisFill = dark ? "#94a3b8" : "#98a2b3";
  const axisFillY = dark ? "#cbd5e1" : "#475467";
  const gridStroke = dark ? "#334155" : "#eef1f6";
  const tipBg = dark ? "#1e293b" : "#ffffff";
  const tipBorder = dark ? "#334155" : "#e5e9f2";
  const cursorFill = dark ? "#1e293b" : "#f4f6fb";

  return (
    <div className={`dashboard-scope space-y-8 ${dark ? "dashboard-dark" : ""}`}>
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">ITSM 통합관리 대시보드</h1>
          <p className="mt-1 text-sm text-slate-500">구성·변경·장애·문제 현황을 한눈에 관제합니다.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="chip bg-emerald-100 text-emerald-700">● 실시간 CSV 연동</span>
          <button
            type="button"
            className="btn-ghost !px-3"
            onClick={() => setDark((v) => !v)}
            aria-pressed={dark}
            title={dark ? "라이트 모드" : "다크 모드"}
          >
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            {dark ? "라이트" : "다크"}
          </button>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="총 자산 수" value={data.kpis.totalAssets} icon={Boxes} tone="bg-brand-100 text-brand-600" />
        <Kpi label="변경 건수" value={data.kpis.change} icon={GitBranch} tone="bg-indigo-100 text-indigo-600" />
        <Kpi label="장애 건수" value={data.kpis.incident} icon={AlertTriangle} tone="bg-rose-100 text-rose-600" />
        <Kpi label="문제 건수" value={data.kpis.problem} icon={Search} tone="bg-amber-100 text-amber-600" />
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="card p-6 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">카테고리별 자산 현황</h2>
            <span className="text-xs text-slate-400">3_구성관리 / CI.csv</span>
          </div>
          <ResponsiveContainer width="100%" height={360}>
            <BarChart data={barData} layout="vertical" margin={{ left: 24, right: 24 }}>
              <CartesianGrid horizontal={false} stroke={gridStroke} />
              <XAxis type="number" tick={{ fontSize: 12, fill: axisFill }} axisLine={false} tickLine={false} />
              <YAxis
                type="category" dataKey="label" width={110}
                tick={{ fontSize: 12, fill: axisFillY }} axisLine={false} tickLine={false}
              />
              <Tooltip
                cursor={{ fill: cursorFill }}
                formatter={(v) => [`${v}건`, "자산수"]}
                contentStyle={{ borderRadius: 12, border: `1px solid ${tipBorder}`, background: tipBg, color: dark ? "#e2e8f0" : "#101828", fontSize: 12 }}
              />
              <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={16}>
                {barData.map((_, i) => (
                  <Cell key={i} fill={colors[i % colors.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card flex flex-col p-6">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">자산 상태 분포</h2>
            <span className="text-xs text-slate-400">CI.STATUS</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={donutData} dataKey="value" nameKey="name"
                cx="50%" cy="50%" innerRadius={52} outerRadius={82} paddingAngle={2} stroke="none"
              >
                {donutData.map((_, i) => (
                  <Cell key={i} fill={donutColors[i % donutColors.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(v) => [`${v}건`, "자산수"]}
                contentStyle={{ borderRadius: 12, border: `1px solid ${tipBorder}`, background: tipBg, color: dark ? "#e2e8f0" : "#101828", fontSize: 12 }}
              />
              <Legend verticalAlign="bottom" height={24} iconType="circle" wrapperStyle={{ fontSize: 12, color: dark ? "#cbd5e1" : undefined }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <div className="flex items-center justify-between rounded-xl bg-emerald-50 px-3 py-2">
              <span className="flex items-center gap-1.5 text-xs text-emerald-700"><TrendingUp className="h-3.5 w-3.5" /> 자산 추가</span>
              <span className="text-sm font-bold text-emerald-700">{data.kpis.ciAdded}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-rose-50 px-3 py-2">
              <span className="flex items-center gap-1.5 text-xs text-rose-700"><TrendingDown className="h-3.5 w-3.5" /> 자산 삭제</span>
              <span className="text-sm font-bold text-rose-700">{data.kpis.ciRemoved}</span>
            </div>
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-semibold text-slate-900">운영 도메인 바로가기</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {data.domainCounts.map((d) => {
            const Icon = ICONS[d.icon] ?? Network;
            return (
              <Link key={d.key} to={`/d/${d.key}`} className="card group p-4 transition hover:shadow-pop">
                <div className="flex items-center gap-2 text-slate-500 group-hover:text-brand-600">
                  <Icon className="h-4 w-4" />
                  <span className="text-sm font-medium">{d.title}</span>
                </div>
                <div className="mt-2 text-2xl font-bold tabular-nums text-slate-900">{d.count}</div>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="font-semibold text-slate-900">최근 변경 이력</h2>
          <Link to="/d/change" className="text-xs font-medium text-brand-600 hover:underline">전체 보기 →</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-6 py-3">변경 티켓 ID</th>
                <th className="px-6 py-3">변경 제목</th>
                <th className="px-6 py-3">유형</th>
                <th className="px-6 py-3">상태</th>
                <th className="px-6 py-3">적용 일시</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.recentChanges.map((r, i) => (
                <tr key={r.CHG_TICKET_ID || i} className="hover:bg-slate-50/70">
                  <td className="whitespace-nowrap px-6 py-3 font-mono text-xs font-semibold text-brand-600">{r.CHG_TICKET_ID}</td>
                  <td className="px-6 py-3 text-slate-700"><span className="line-clamp-1 max-w-[420px]" title={r.CHG_TITLE}>{r.CHG_TITLE}</span></td>
                  <td className="whitespace-nowrap px-6 py-3 text-slate-500">{r.CHG_TYPE || "—"}</td>
                  <td className="whitespace-nowrap px-6 py-3">
                    <span className={`chip ${statusChip(r.CHG_STATUS)}`}>{r.CHG_STATUS || "미정"}</span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-3 text-slate-500">{r.APPLIED_DT || "—"}</td>
                </tr>
              ))}
              {data.recentChanges.length === 0 && (
                <tr><td colSpan={5} className="px-6 py-10 text-center text-slate-400">변경 이력이 없습니다.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
