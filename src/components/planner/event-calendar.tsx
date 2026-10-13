"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "@/components/ui/icons";

import { isEventCancelled, type PlannerEvent } from "@/lib/planner-events";

const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function EventCalendar({ events, focusDate }: { events: readonly PlannerEvent[]; focusDate?: string }) {
  const [month, setMonth] = useState(() => { const focus = focusDate ? new Date(`${focusDate}T12:00:00`) : new Date(); const date = Number.isNaN(focus.getTime()) ? new Date() : focus; return new Date(date.getFullYear(), date.getMonth(), 1); });
  const days = useMemo(() => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1);
    const offset = (first.getDay() + 6) % 7;
    const count = Math.ceil((offset + new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()) / 7) * 7;
    return Array.from({ length: count }, (_, index) => new Date(month.getFullYear(), month.getMonth(), index - offset + 1));
  }, [month]);
  const byDate = useMemo(() => {
    const entries = new Map<string, PlannerEvent[]>();
    for (const event of events) entries.set(event.date, [...(entries.get(event.date) ?? []), event]);
    return entries;
  }, [events]);
  const todayKey = dateKey(new Date());

  function move(amount: number) { setMonth((current) => new Date(current.getFullYear(), current.getMonth() + amount, 1)); }

  return <section className="overflow-hidden rounded-xl border border-border-subtle bg-white" aria-label="Event calendar">
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle px-4 py-4 sm:px-5"><div><h2 className="text-lg font-semibold tracking-tight">{new Intl.DateTimeFormat("en-NG", { month: "long", year: "numeric" }).format(month)}</h2><p className="mt-0.5 text-xs text-text-secondary">Select an event to open its workspace.</p></div><div className="flex items-center gap-1"><button type="button" onClick={() => setMonth(new Date(new Date().getFullYear(), new Date().getMonth(), 1))} className="min-h-9 rounded-lg px-3 text-xs font-semibold text-text-secondary hover:bg-background-subtle">Today</button><button type="button" onClick={() => move(-1)} aria-label="Previous month" className="flex size-9 items-center justify-center rounded-lg text-text-secondary hover:bg-background-subtle"><ChevronLeft className="size-4" /></button><button type="button" onClick={() => move(1)} aria-label="Next month" className="flex size-9 items-center justify-center rounded-lg text-text-secondary hover:bg-background-subtle"><ChevronRight className="size-4" /></button></div></div>
    <div className="overflow-x-auto"><div className="min-w-[700px]"><div className="grid grid-cols-7 border-b border-border-subtle bg-[#fafbfa]">{weekdays.map((day) => <div key={day} className="px-3 py-2 text-[0.6875rem] font-semibold text-text-secondary">{day}</div>)}</div><div className="grid grid-cols-7">{days.map((date) => { const key = dateKey(date); const currentMonth = date.getMonth() === month.getMonth(); const dayEvents = byDate.get(key) ?? []; return <div key={key} className={`min-h-28 border-b border-r border-border-subtle p-2.5 ${currentMonth ? "bg-white" : "bg-[#fafbfa]"}`}><span className={`flex size-6 items-center justify-center rounded-full text-xs ${key === todayKey ? "bg-brand-primary font-semibold text-white" : currentMonth ? "text-text-primary" : "text-text-tertiary"}`}>{date.getDate()}</span><div className="mt-2 space-y-1">{dayEvents.map((event) => <Link key={event.id} href={`/planner/events/${event.id}`} title={`${event.name}${event.startTime ? ` · ${event.startTime}` : ""}`} className={`block rounded-md px-2 py-1.5 text-[0.6875rem] font-semibold focus-visible:outline-2 focus-visible:outline-brand-primary ${isEventCancelled(event) ? "bg-[#fcf2f2] text-[#a34c4c] hover:bg-[#f8e8e8]" : "bg-[#eaf3ed] text-brand-primary hover:bg-[#dcecdf]"}`}><span className="block truncate">{event.name}</span>{isEventCancelled(event) ? <span className="block text-[0.625rem] font-normal">Cancelled</span> : event.startTime && <span className="block text-[0.625rem] font-normal opacity-75">{event.startTime}</span>}</Link>)}</div></div>; })}</div></div></div>
  </section>;
}
