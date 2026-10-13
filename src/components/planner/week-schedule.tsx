"use client";

import { useState } from "react";
import Link from "next/link";
import { CalendarDays, ChevronLeft, ChevronRight } from "@/components/ui/icons";

import { Button } from "@/components/ui/button";
import { formatEventDate, isEventCancelled, useBrowserReady, usePlannerEvents } from "@/lib/planner-events";
import { cn } from "@/lib/utils/cn";

const weekday = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function WeekSchedule() {
  const events = usePlannerEvents();
  const ready = useBrowserReady();
  const [offset, setOffset] = useState(0);
  if (!ready) return <div className="h-52 animate-pulse rounded-xl bg-white" aria-label="Loading week schedule" />;
  const now = new Date();
  const today = now.toLocaleDateString("sv-SE");
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - ((now.getDay() + 6) % 7) + offset * 7);
  const days = weekday.map((label, index) => {
    const date = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + index);
    const key = date.toLocaleDateString("sv-SE");
    return { label, key, day: date.getDate(), events: events.filter((event) => !isEventCancelled(event) && event.date === key) };
  });
  const scheduled = days.flatMap((day) => day.events.map((event) => ({ ...event, displayDate: day.key })));
  const range = `${formatEventDate(days[0].key, { month: "short", day: "numeric" })} – ${formatEventDate(days[6].key, { month: "short", day: "numeric" })}`;

  return <section className="overflow-hidden rounded-xl border border-border-subtle bg-white" aria-labelledby="week-title">
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle px-5 py-4"><div><h2 id="week-title" className="text-base font-semibold tracking-[-0.02em] text-text-primary">The week ahead</h2><p className="mt-1 text-xs text-text-tertiary" aria-live="polite">{range}</p></div><div className="flex items-center gap-1"><Button size="sm" variant="ghost" onClick={() => setOffset((value) => value - 1)} aria-label="Previous week" className="w-8 px-0"><ChevronLeft className="size-4" aria-hidden="true" /></Button><Button size="sm" variant="outline" onClick={() => setOffset(0)}>This week</Button><Button size="sm" variant="ghost" onClick={() => setOffset((value) => value + 1)} aria-label="Next week" className="w-8 px-0"><ChevronRight className="size-4" aria-hidden="true" /></Button></div></div>
    {scheduled.length ? <><div className="hidden grid-cols-7 divide-x divide-border-subtle md:grid">{days.map((day) => <div key={day.key} className={cn("min-h-36 min-w-0 px-2.5 py-3", day.key === today && "bg-[#f7faf8]")}><div className="flex items-center justify-between gap-1"><span className="text-[0.625rem] font-medium uppercase tracking-wider text-text-tertiary">{day.label}</span><span className={cn("flex size-6 items-center justify-center rounded-full text-xs font-semibold", day.key === today ? "bg-brand-primary text-white" : "text-text-secondary")}>{day.day}</span></div><div className="mt-5 space-y-1.5">{day.events.map((event) => <Link key={event.id} href={`/planner/events/${event.id}`} className="block truncate rounded-md bg-[#eaf3ed] px-2 py-2 text-[0.625rem] font-semibold text-[#40654e] hover:bg-[#dfece2]" title={event.name}>{event.name}</Link>)}</div></div>)}</div><div className="divide-y divide-border-subtle md:hidden">{scheduled.map((event) => <Link href={`/planner/events/${event.id}`} key={event.id} className="flex items-center gap-3 px-5 py-3"><span className="flex size-9 shrink-0 flex-col items-center justify-center rounded-lg bg-[#eaf3ed] text-brand-primary"><span className="text-[0.5625rem] font-semibold uppercase leading-none">{formatEventDate(event.displayDate, { weekday: "short" })}</span><span className="mt-0.5 text-sm font-bold leading-none">{formatEventDate(event.displayDate, { day: "numeric" })}</span></span><span className="min-w-0 flex-1 truncate text-xs font-semibold">{event.name}</span><ChevronRight className="size-4 text-text-tertiary" aria-hidden="true" /></Link>)}</div></> : <div className="flex items-start gap-3 px-5 py-7"><span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#edf3f9] text-[#527996]"><CalendarDays className="size-[18px]" aria-hidden="true" /></span><div><p className="text-sm font-semibold">No events this week</p><p className="mt-1 text-xs leading-5 text-text-secondary">You can use the arrows to look at another week.</p></div></div>}
  </section>;
}
