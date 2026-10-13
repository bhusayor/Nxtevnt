"use client";

import Link from "next/link";
import { ArrowUpRight, CalendarDays, Clock3 } from "@/components/ui/icons";

import { formatEventDate, isEventCancelled, useBrowserReady, usePlannerEvents } from "@/lib/planner-events";

export function UpNextTimeline() {
  const events = usePlannerEvents();
  const ready = useBrowserReady();
  const today = ready ? new Date().toLocaleDateString("sv-SE") : "";
  const upcoming = [...events].filter((event) => !isEventCancelled(event) && event.date >= today).sort((first, second) => first.date.localeCompare(second.date)).slice(0, 3);
  return <section className="overflow-hidden rounded-xl border border-[#e1e9e3] bg-white" aria-labelledby="up-next-title">
    <div className="flex items-center justify-between border-b border-[#e1e9e3] bg-[#f0f5f1] px-5 py-4"><div><h2 id="up-next-title" className="text-base font-semibold tracking-[-0.02em] text-text-primary">Coming up next</h2><p className="mt-1 text-xs text-text-secondary">{upcoming.length ? `${upcoming.length} ${upcoming.length === 1 ? "event" : "events"} on the horizon` : "A little room to dream"}</p></div><span className="flex size-9 items-center justify-center rounded-lg border border-white bg-white/75 text-brand-primary"><CalendarDays aria-hidden="true" className="size-4" /></span></div>
    {upcoming.length ? <div className="divide-y divide-border-subtle px-5">{upcoming.map((event) => <Link key={event.id} href={`/planner/events/${event.id}`} className="group flex items-start gap-3 py-4"><span className="flex size-10 shrink-0 flex-col items-center justify-center rounded-lg bg-[#edf3f9] text-[#527996]"><span className="text-[0.5625rem] font-semibold uppercase leading-none">{formatEventDate(event.date, { month: "short" })}</span><span className="mt-0.5 text-sm font-bold leading-none">{formatEventDate(event.date, { day: "numeric" })}</span></span><span className="min-w-0 flex-1"><span className="block truncate text-xs font-semibold text-text-primary group-hover:text-brand-primary">{event.name}</span><span className="mt-1 block text-[0.6875rem] text-text-secondary">{event.type}</span><span className="mt-1 flex items-center gap-1 text-[0.625rem] text-text-tertiary"><Clock3 className="size-3" aria-hidden="true" />{event.startTime || "Time to be confirmed"}</span></span><ArrowUpRight className="mt-1 size-4 text-text-tertiary group-hover:text-brand-primary" aria-hidden="true" /></Link>)}</div> : <div className="flex items-start gap-3 px-5 py-7"><span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#eaf3ed] text-brand-primary"><CalendarDays className="size-[18px]" aria-hidden="true" /></span><p className="text-xs leading-5 text-text-secondary">Create an event to start filling your calendar with what&apos;s next.</p></div>}
  </section>;
}
