"use client";

import { ChevronRight, ClipboardList, Milestone } from "@/components/ui/icons";
import { MilestoneSummary } from "./milestone-summary";
import { TaskSummary } from "./task-summary";
import { useSummaryMotion } from "./use-summary-motion";
import type { EventItem, EventTaskGroup } from "@/lib/planner-events";
import { cn } from "@/lib/utils/cn";

export function TaskPlanSummary({ groups, tasks, today }: { groups: readonly EventTaskGroup[]; tasks: readonly EventItem[]; today: string }) {
  const { frame: frameRef, grid: gridRef, ...motion } = useSummaryMotion();
  return <div ref={frameRef} aria-label="Milestone and task summaries" data-expanded-summary={motion.expanded} data-summary-phase={motion.phase} style={{ height: motion.height ?? undefined }} onTransitionEnd={motion.onFrameTransitionEnd} className={cn("min-w-0 motion-safe:transition-[height] motion-safe:duration-[240ms] motion-safe:ease-out", motion.phase !== "idle" && "overflow-hidden")}>
    <div ref={gridRef} data-summary-layout={motion.layout} onTransitionEnd={motion.onGridTransitionEnd} style={motion.isResizing && motion.height !== null ? { height: motion.height, gridTemplateRows: "minmax(0,1fr)" } : undefined} className={cn("grid grid-cols-1 items-stretch gap-4 motion-safe:transition-[grid-template-columns] motion-safe:duration-[320ms] motion-safe:ease-[cubic-bezier(0.2,0.7,0.2,1)]", motion.layout === "milestones" ? "xl:grid-cols-[minmax(0,3.25fr)_minmax(0,1fr)]" : "xl:grid-cols-[minmax(0,1.15fr)_minmax(0,3fr)]")}>
    {([{ id: "milestones", label: "Milestone", icon: Milestone }, { id: "tasks", label: "Task", icon: ClipboardList }] as const).map(({ id, label, icon: Icon }) => {
      const active = motion.expanded === id;
      return <section key={id} aria-labelledby={`${id}-summary-toggle`} className="flex min-h-0 min-w-0 flex-col overflow-hidden rounded-2xl border border-border-subtle bg-white p-4 shadow-[0_8px_26px_-23px_rgba(20,45,30,.35)] sm:p-5">
        <button id={`${id}-summary-toggle`} type="button" aria-label={`Expand ${label.toLowerCase()} summary`} aria-expanded={active} aria-controls={`${id}-summary-panel`} onClick={() => motion.select(id)} className="mb-4 flex min-h-11 w-full shrink-0 items-center gap-3 rounded-lg text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-primary">
          <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl", id === "milestones" ? "bg-[#faf0e2] text-[#90683b]" : "bg-[#f1edf8] text-[#705987]")}><Icon className="size-5" weight="duotone" aria-hidden="true" /></span><span className="min-w-0 flex-1 text-base font-semibold">{label}</span>{!active && <ChevronRight className="size-5 shrink-0 text-text-tertiary" aria-hidden="true" />}
        </button>
        <div id={`${id}-summary-panel`} data-summary-content={id} style={{ width: motion.contentWidths?.[id] }} className="min-h-0 min-w-0 shrink-0">
          {id === "milestones" ? <MilestoneSummary groups={groups} tasks={tasks} today={today} compact={!active} /> : <TaskSummary tasks={tasks} today={today} compact={!active} />}
        </div>
      </section>;
    })}
    </div>
  </div>;
}
