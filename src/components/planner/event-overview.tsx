"use client";

import { Ban, CalendarDays, CalendarRange, CircleCheck } from "@/components/ui/icons";

import type { PlannerEvent } from "@/lib/planner-events";
import { cn } from "@/lib/utils/cn";

type EventTab = "all" | "completed" | "upcoming" | "cancelled";

export function EventOverview({ events, upcoming, completed, cancelled, selected, onSelect }: { events: readonly PlannerEvent[]; upcoming: readonly PlannerEvent[]; completed: readonly PlannerEvent[]; cancelled: readonly PlannerEvent[]; selected: EventTab; onSelect: (tab: EventTab) => void }) {
  const metrics = [
    { id: "all" as const, label: "All events", value: events.length, detail: "Every event in your workspace", icon: CalendarRange, surface: "border-[#dce8df] bg-[#edf5ef]", iconSurface: "text-[#37634a]" },
    { id: "upcoming" as const, label: "Upcoming", value: upcoming.length, detail: "Today and on the horizon", icon: CalendarDays, surface: "border-[#e3e8f5] bg-[#f0f2fa]", iconSurface: "text-[#596b99]" },
    { id: "completed" as const, label: "Completed", value: completed.length, detail: "Event dates that have passed", icon: CircleCheck, surface: "border-[#f0e6d8] bg-[#fbf4ea]", iconSurface: "text-[#967047]" },
    { id: "cancelled" as const, label: "Cancelled", value: cancelled.length, detail: "Plans kept for your records", icon: Ban, surface: "border-[#f3e1e1] bg-[#fcf2f2]", iconSurface: "text-[#a34c4c]" },
  ];

  return <section className="space-y-4" aria-labelledby="events-overview-title">
    <h2 id="events-overview-title" className="text-lg font-semibold tracking-tight">Overview</h2>
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{metrics.map((metric) => { const Icon = metric.icon; return <button key={metric.id} type="button" onClick={() => onSelect(metric.id)} aria-label={`Show ${metric.label.toLowerCase()}`} className={cn("group rounded-xl border p-4 text-left transition-[box-shadow,transform] hover:-translate-y-0.5 hover:shadow-[var(--shadow-sm)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary sm:p-5", metric.surface, selected === metric.id && "ring-1 ring-brand-primary/20")}><span className={cn("flex size-9 items-center justify-center rounded-lg bg-white/80", metric.iconSurface)}><Icon className="size-[18px]" weight="bold" aria-hidden="true" /></span><span className="mt-4 flex items-end gap-2"><strong className="text-[1.8rem] font-semibold leading-none tracking-[-0.05em] text-text-primary">{metric.value}</strong><span className="pb-0.5 text-xs font-semibold text-text-secondary">{metric.label}</span></span><span className="mt-2 block text-[0.6875rem] text-text-secondary">{metric.detail}</span></button>; })}</div>
  </section>;
}
