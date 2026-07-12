import { CheckCircle2, Circle, Clock3, PauseCircle, ListTodo, ArrowRight } from "lucide-react";
import {
  WBS_META,
  WBS_PHASES,
  overallProgress,
  phaseProgress,
  statusCounts,
  nextTasks,
  type TaskStatus,
  type WbsTask,
} from "../data/wbs";

const STATUS: Record<
  TaskStatus,
  { label: string; chip: string; Icon: typeof CheckCircle2 }
> = {
  done: { label: "완료", chip: "bg-emerald-100 text-emerald-700", Icon: CheckCircle2 },
  in_progress: { label: "진행중", chip: "bg-amber-100 text-amber-800", Icon: Clock3 },
  pending: { label: "대기", chip: "bg-slate-100 text-slate-600", Icon: Circle },
  deferred: { label: "보류", chip: "bg-violet-100 text-violet-700", Icon: PauseCircle },
};

function ProgressBar({ value, tone = "brand" }: { value: number; tone?: "brand" | "emerald" }) {
  const bar = tone === "emerald" ? "bg-emerald-500" : "bg-brand-500";
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
      <div className={`h-full rounded-full transition-all ${bar}`} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}

function TaskRow({ task }: { task: WbsTask }) {
  const s = STATUS[task.status];
  const Icon = s.Icon;
  return (
    <tr className="hover:bg-slate-50/80">
      <td className="whitespace-nowrap px-4 py-3 font-mono text-xs font-semibold text-brand-600">{task.id}</td>
      <td className="px-4 py-3 text-sm text-slate-800">
        <div className="font-medium">{task.name}</div>
        {task.note && <div className="mt-0.5 text-xs text-slate-400">{task.note}</div>}
      </td>
      <td className="px-4 py-3">
        <span className={`chip gap-1 ${s.chip}`}>
          <Icon className="h-3.5 w-3.5" /> {s.label}
        </span>
      </td>
      <td className="w-44 px-4 py-3">
        <div className="flex items-center gap-2">
          <ProgressBar value={task.progress} tone={task.progress >= 100 ? "emerald" : "brand"} />
          <span className="w-10 text-right text-xs font-semibold tabular-nums text-slate-600">{task.progress}%</span>
        </div>
      </td>
    </tr>
  );
}

export default function WbsPage() {
  const overall = overallProgress();
  const counts = statusCounts();
  const next = nextTasks();

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{WBS_META.title}</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">{WBS_META.strategy}</p>
        </div>
        <span className="chip bg-slate-100 text-slate-600">갱신 {WBS_META.updatedAt}</span>
      </header>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="card p-6 lg:col-span-1">
          <div className="text-sm font-medium text-slate-500">전체 진척률</div>
          <div className="mt-2 flex items-end gap-2">
            <span className="text-4xl font-bold tabular-nums text-slate-900">{overall}</span>
            <span className="mb-1 text-lg text-slate-400">%</span>
          </div>
          <div className="mt-4">
            <ProgressBar value={overall} />
          </div>
          <div className="mt-5 grid grid-cols-2 gap-2 text-xs">
            {(
              [
                ["done", "완료"],
                ["in_progress", "진행중"],
                ["pending", "대기"],
                ["deferred", "보류"],
              ] as const
            ).map(([key, label]) => (
              <div key={key} className="rounded-xl bg-slate-50 px-3 py-2">
                <div className="text-slate-400">{label}</div>
                <div className="mt-0.5 text-base font-semibold tabular-nums text-slate-800">
                  {counts[key]}
                  <span className="text-xs font-normal text-slate-400"> / {counts.total}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-6 lg:col-span-2">
          <div className="mb-4 flex items-center gap-2">
            <ListTodo className="h-4 w-4 text-brand-500" />
            <h2 className="font-semibold text-slate-900">다음에 손댈 과업</h2>
          </div>
          <ul className="space-y-2">
            {next.map((t) => {
              const s = STATUS[t.status];
              return (
                <li key={t.id} className="flex items-center gap-3 rounded-xl border border-slate-200/80 px-4 py-3">
                  <span className="font-mono text-xs font-semibold text-brand-600">{t.id}</span>
                  <span className="flex-1 text-sm font-medium text-slate-800">{t.name}</span>
                  <span className={`chip ${s.chip}`}>{s.label}</span>
                  <span className="text-xs font-semibold tabular-nums text-slate-500">{t.progress}%</span>
                  <ArrowRight className="h-4 w-4 text-slate-300" />
                </li>
              );
            })}
            {next.length === 0 && (
              <li className="rounded-xl bg-emerald-50 px-4 py-8 text-center text-sm text-emerald-700">
                대기/진행중 과업이 없습니다.
              </li>
            )}
          </ul>
          <p className="mt-4 text-xs text-slate-400">
            과업을 끝낼 때마다 <code className="rounded bg-slate-100 px-1">src/data/wbs.ts</code> 의 progress·status 를 갱신합니다.
          </p>
        </div>
      </section>

      <section className="space-y-6">
        {WBS_PHASES.map((phase) => {
          const pct = phaseProgress(phase);
          return (
            <div key={phase.id} className="card overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/60 px-6 py-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="chip bg-brand-100 text-brand-700">{phase.id}</span>
                    <h2 className="font-semibold text-slate-900">{phase.name}</h2>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{phase.goal}</p>
                </div>
                <div className="flex w-48 items-center gap-2">
                  <ProgressBar value={pct} tone={pct >= 100 ? "emerald" : "brand"} />
                  <span className="w-10 text-right text-sm font-bold tabular-nums text-slate-700">{pct}%</span>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-white text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                    <tr>
                      <th className="px-4 py-3">ID</th>
                      <th className="px-4 py-3">과업</th>
                      <th className="px-4 py-3">상태</th>
                      <th className="px-4 py-3">진척</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {phase.tasks.map((t) => (
                      <TaskRow key={t.id} task={t} />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
}
