"use client";

import { AlertCircle, CheckCircle2, CircleDashed, Clock3 } from "@/components/ui/icons";
import { OverviewMetricCard } from "./overview-metric-card";
import { taskSummary } from "@/lib/task-summary";
import type { EventItem } from "@/lib/planner-events";

export function TaskSummary({ tasks, today, compact = false }: { tasks: readonly EventItem[]; today: string; compact?: boolean }) {
  const { counts, overdue, overdueByStatus } = taskSummary(tasks, today);
  const singleLine = (text: string, className = "") => <span className={`whitespace-nowrap ${className}`}>{text}</span>;
  const statusDetail = (count: number, fallback: string) => count
    ? singleLine(`${count} overdue`, "font-semibold text-error")
    : singleLine(fallback);

  if (compact) return <section aria-label="Task status summary">
    <dl className="space-y-2">{[
      { label: "To do", value: counts.todo, tone: "border-[#e0e5e3] bg-[#f5f7f6] text-[#52615b]" },
      { label: "In progress", value: counts["in-progress"], tone: "border-[#dce6f1] bg-[#f2f6fc] text-[#446d8b]" },
      { label: "Blocked", value: counts.blocked, tone: "border-[#eddfc9] bg-[#fdf8ef] text-[#8a6537]" },
      { label: "Completed", value: counts.completed, tone: "border-[#d6e7dc] bg-[#f0f7f2] text-[#37634a]" },
      { label: "Overdue", value: overdue, tone: "border-[#efc1ca] bg-[#fbe5e8] text-[#963e4e]" },
    ].map((entry) => <div key={entry.label} className={`flex min-h-11 flex-wrap items-center justify-between gap-x-2 gap-y-1 rounded-xl border px-3 py-2 ${entry.tone}`}><dt className="text-sm font-medium">{entry.label}</dt><dd className="text-lg font-semibold tabular-nums">{entry.value}</dd></div>)}</dl>
  </section>;

  return <section aria-label="Task status summary" className="@container">
    <div className="grid gap-3 @sm:grid-cols-2 @4xl:grid-cols-5">
      <OverviewMetricCard animate={false} readable label="To do" value={counts.todo} detail={statusDetail(overdueByStatus.todo, "Not started")} icon={CircleDashed} tone="neutral" />
      <OverviewMetricCard animate={false} readable label="In progress" value={counts["in-progress"]} detail={statusDetail(overdueByStatus["in-progress"], "Work underway")} icon={Clock3} tone="blue" />
      <OverviewMetricCard animate={false} readable label="Blocked" value={counts.blocked} detail={singleLine("Awaiting input")} icon={AlertCircle} tone="amber" />
      <OverviewMetricCard animate={false} readable label="Completed" value={counts.completed} detail={singleLine("All done")} icon={CheckCircle2} tone="sage" />
      <OverviewMetricCard animate={false} readable label="Overdue" value={overdue} detail={singleLine(overdue ? "Past due" : "Nothing overdue")} icon={AlertCircle} tone="rose" detailClassName="border border-[#efc1ca] bg-[#fbe5e8] text-[#963e4e]" className="border-[#e7c6c3] bg-[#fff8f7] @sm:col-span-2 @4xl:col-span-1 [&_strong]:text-error" />
    </div>
  </section>;
}
