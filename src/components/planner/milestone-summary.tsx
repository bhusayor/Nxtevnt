"use client";

import { AlertCircle, CheckCircle2, CircleDashed, Milestone } from "@/components/ui/icons";
import { OverviewMetricCard } from "./overview-metric-card";
import { milestoneSummary } from "@/lib/task-summary";
import type { EventItem, EventTaskGroup } from "@/lib/planner-events";

export function MilestoneSummary({ groups, tasks, today, compact = false }: { groups: readonly EventTaskGroup[]; tasks: readonly EventItem[]; today: string; compact?: boolean }) {
  const summary = milestoneSummary(groups, tasks, today);
  const shortDetail = (text: string) => <span className="whitespace-nowrap">{text}</span>;
  if (compact) return <dl aria-label="Milestone counts" className="space-y-2">{[
    { label: "Total milestones", value: summary.total, tone: "border-[#dce6f1] bg-[#f2f6fc] text-[#446d8b]" },
    { label: "Overdue", value: summary.overdue, tone: "border-[#efc1ca] bg-[#fbe5e8] text-[#963e4e]" },
    { label: "Open", value: summary.open, tone: "border-[#eddfc9] bg-[#fdf8ef] text-[#8a6537]" },
    { label: "Completed", value: summary.completed, tone: "border-[#d6e7dc] bg-[#f0f7f2] text-[#37634a]" },
  ].map((entry) => <div key={entry.label} className={`flex min-h-11 flex-wrap items-center justify-between gap-2 rounded-xl border px-3 py-2 ${entry.tone}`}><dt className="text-sm font-medium">{entry.label}</dt><dd className="text-lg font-semibold tabular-nums">{entry.value}</dd></div>)}</dl>;

  return <section aria-label="Milestone counts" className="@container">
    <div className="grid gap-3 @sm:grid-cols-2 @3xl:grid-cols-4">
      <OverviewMetricCard animate={false} readable label="Total milestones" value={summary.total} detail={shortDetail("Event stages")} icon={Milestone} tone="blue" />
      <OverviewMetricCard animate={false} readable label="Overdue" value={summary.overdue} detail={shortDetail(summary.overdue ? "Past due" : "Nothing overdue")} icon={AlertCircle} tone="rose" detailClassName="border border-[#efc1ca] bg-[#fbe5e8] text-[#963e4e]" className="border-[#e7c6c3] bg-[#fff8f7] [&_strong]:text-error" />
      <OverviewMetricCard animate={false} readable label="Open" value={summary.open} detail={shortDetail("Work remaining")} icon={CircleDashed} tone="amber" />
      <OverviewMetricCard animate={false} readable label="Completed" value={summary.completed} detail={shortDetail("All done")} icon={CheckCircle2} tone="sage" />
    </div>
  </section>;
}
