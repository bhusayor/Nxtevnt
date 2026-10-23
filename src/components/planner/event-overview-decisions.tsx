"use client";

import Link from "next/link";
import { ArrowRight, Scale } from "@/components/ui/icons";
import { DecisionRow } from "@/components/planner/event-decision-details";
import { currentEventDecisions } from "@/lib/event-decisions";
import type { PlannerEvent } from "@/lib/planner-events";

export function EventOverviewDecisions({ event, onOpenAll }: { event: PlannerEvent; onOpenAll?: () => void }) {
  const decisions = currentEventDecisions(event).slice().reverse();
  const actionClass = "inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-sm text-sm font-semibold text-brand-primary hover:underline focus-visible:outline-2 focus-visible:outline-brand-primary";
  return <section aria-labelledby="event-overview-decisions" className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-border-subtle bg-white">
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle p-5 sm:p-6"><div><h2 id="event-overview-decisions" className="text-lg font-semibold">Decisions</h2><p className="mt-1 text-sm text-text-secondary">The latest choices and client confirmations.</p></div>{onOpenAll ? <button type="button" onClick={onOpenAll} className={actionClass}>View decisions<ArrowRight className="size-3.5" aria-hidden="true" /></button> : <Link href={`/planner/events/${encodeURIComponent(event.id)}?section=decisions`} className={actionClass}>View decisions<ArrowRight className="size-3.5" aria-hidden="true" /></Link>}</header>
    {decisions.length ? <ul className="divide-y divide-border-subtle">{decisions.slice(0, 3).map((decision) => <DecisionRow key={decision.id} event={event} decision={decision} />)}</ul> : <div className="flex min-h-40 flex-1 flex-col items-center justify-center gap-3 p-6 text-center"><Scale className="size-7 text-text-tertiary" aria-hidden="true" /><p className="text-sm font-medium text-text-secondary">No decisions yet</p><p className="max-w-md text-sm leading-6 text-text-secondary">Record a choice in Notes and Decision, or approve an image from your mood board.</p></div>}
  </section>;
}
