"use client";

import { useState } from "react";
import { CalendarDays, ChartBar, ChevronLeft, ChevronRight } from "@/components/ui/icons";
import { LineupDayEvents } from "@/components/planner/lineup-day-events";
import { Tooltip } from "@/components/ui/tooltip";
import { Select } from "@/components/ui/select";
import { dateKey, monthKey } from "@/lib/planner-dashboard";
import { formatEventDate, isEventCancelled, usePlannerEvents } from "@/lib/planner-events";
import { cn } from "@/lib/utils/cn";
import { overviewEventType, overviewEventTypes } from "@/lib/overview-event-types";

const types = overviewEventTypes;
const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const monthDate = (key: string) => new Date(`${key}-01T12:00:00`);
const monthLabel = (key: string) => new Intl.DateTimeFormat("en-NG", { month: "long", year: "numeric" }).format(monthDate(key));

export function EventLineup() {
  const events = usePlannerEvents().filter((event) => !isEventCancelled(event));
  const [from, setFrom] = useState(() => monthKey(new Date()));
  const [to, setTo] = useState(() => { const now = new Date(); return monthKey(new Date(now.getFullYear(), now.getMonth() + 5, 1)); });
  const [view, setView] = useState<"chart" | "calendar">("chart");
  const [focus, setFocus] = useState(from);
  const [selected, setSelected] = useState("");
  const first = monthDate(from);
  const last = monthDate(to);
  const count = (last.getFullYear() - first.getFullYear()) * 12 + last.getMonth() - first.getMonth() + 1;
  const valid = Number.isFinite(count) && count > 0 && count <= 120;
  const months = valid ? Array.from({ length: count }, (_, index) => monthKey(new Date(first.getFullYear(), first.getMonth() + index, 1))) : [];
  const lineup = events.filter((event) => event.date.slice(0, 7) >= from && event.date.slice(0, 7) <= to);
  const counts = months.map((month) => {
    const entries = lineup.filter((event) => event.date.startsWith(month));
    return { month, entries, values: types.map((type) => entries.filter((event) => overviewEventType(event.type).key === type.key).length) };
  });
  const max = Math.max(1, ...counts.map((entry) => entry.entries.length));
  const shownMonth = months.includes(focus) ? focus : from;
  const shownDate = monthDate(shownMonth);
  const monthIndex = months.indexOf(shownMonth);
  const monthEvents = lineup.filter((event) => event.date.startsWith(shownMonth));
  const today = dateKey(new Date());
  const nextScheduled = [...monthEvents].sort((a, b) => a.date.localeCompare(b.date)).find((event) => event.date >= today)?.date || [...monthEvents].sort((a, b) => a.date.localeCompare(b.date))[0]?.date;
  const selectedDate = selected.startsWith(shownMonth) ? selected : nextScheduled || (today.startsWith(shownMonth) ? today : `${shownMonth}-01`);
  const dayEvents = monthEvents.filter((event) => event.date === selectedDate).sort((a, b) => a.startTime.localeCompare(b.startTime));
  const offset = (shownDate.getDay() + 6) % 7;
  const daysInMonth = new Date(shownDate.getFullYear(), shownDate.getMonth() + 1, 0).getDate();
  const days = Array.from({ length: Math.ceil((offset + daysInMonth) / 7) * 7 }, (_, index) => index - offset + 1);
  function openMonth(month: string) { setFocus(month); setSelected(""); setView("calendar"); }

  return <section className="min-w-0 overflow-hidden rounded-2xl border border-border-subtle bg-white" aria-labelledby="lineup-title">
    <div className="flex flex-wrap items-start justify-between gap-4 px-5 pt-5 sm:px-6"><div><h2 id="lineup-title" className="text-lg font-semibold tracking-tight">Your event lineup</h2><p className="mt-1 text-sm leading-6 text-text-secondary">See the busy months and the moments you’re planning.</p></div><div className="inline-flex rounded-xl border border-border-subtle bg-[#f7f9f6] p-1" role="group" aria-label="Event lineup view">{([{ id: "chart", label: "Chart", icon: ChartBar }, { id: "calendar", label: "Calendar", icon: CalendarDays }] as const).map((option) => <button key={option.id} type="button" aria-pressed={view === option.id} onClick={() => setView(option.id)} className={cn("inline-flex min-h-8 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold", view === option.id ? "bg-white text-brand-primary shadow-sm" : "text-text-secondary hover:text-brand-primary")}><option.icon className="size-4" aria-hidden="true" />{option.label}</button>)}</div></div>
    <div className="mt-5 flex flex-col gap-4 border-b border-border-subtle px-5 pb-5 sm:flex-row sm:items-end sm:justify-between sm:px-6"><div aria-live="polite"><p className="text-2xl font-semibold tracking-tight tabular-nums">{valid ? lineup.length : "—"}<span className="ml-2 text-xs font-normal tracking-normal text-text-secondary">{lineup.length === 1 ? "event" : "events"} in this range</span></p></div><div className="grid grid-cols-2 gap-3 sm:w-[360px]"><label className="min-w-0 text-xs font-semibold uppercase tracking-wider text-text-tertiary">From<input type="month" aria-label="Event lineup start month" min="1900-01" max={to} value={from} onChange={(event) => { if (event.target.value) setFrom(event.target.value); }} className="mt-1.5 block h-10 w-full min-w-0 rounded-lg border border-border-default bg-white px-2.5 text-xs font-medium normal-case tracking-normal text-text-primary" /></label><label className="min-w-0 text-xs font-semibold uppercase tracking-wider text-text-tertiary">To<input type="month" aria-label="Event lineup end month" min={from} max="2200-12" value={to} onChange={(event) => { if (event.target.value) setTo(event.target.value); }} className="mt-1.5 block h-10 w-full min-w-0 rounded-lg border border-border-default bg-white px-2.5 text-xs font-medium normal-case tracking-normal text-text-primary" /></label></div></div>
    {!valid ? <p role="alert" className="px-6 py-10 text-sm text-error">Choose an end month on or after the start month, within a ten-year range.</p> : view === "chart" ? <div className="px-5 py-6 sm:px-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3"><div className="flex flex-wrap gap-x-4 gap-y-2">{types.map((type) => <span key={type.label} className="inline-flex items-center gap-1.5 text-sm text-text-secondary"><span className="size-2.5 rounded-full" style={{ backgroundColor: type.color }} />{type.label}</span>)}</div><p className="text-sm text-text-tertiary">Select a month to explore its dates</p></div>
      <div className="overflow-x-auto pb-2"><div className="relative" style={{ minWidth: Math.max(280, months.length * 58) }}><div className="pointer-events-none absolute inset-x-0 top-7 bottom-7 flex flex-col justify-between" aria-hidden="true">{[0, 1, 2, 3].map((line) => <div key={line} className="border-t border-dashed border-[#e9eee7]" />)}</div><div className="relative grid gap-3" style={{ gridTemplateColumns: `repeat(${months.length}, minmax(0, 1fr))` }}>{counts.map((entry) => <Tooltip key={entry.month} content={<div className="min-w-36 py-1"><p className="font-semibold">{monthLabel(entry.month)}</p><p className="mb-2 mt-1 text-white/80">{entry.entries.length} {entry.entries.length === 1 ? "event" : "events"}</p>{entry.values.map((value, index) => value > 0 && <p key={types[index].label} className="flex items-center justify-between gap-4 text-sm"><span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full" style={{ backgroundColor: types[index].color }} />{types[index].label}</span><span className="font-semibold tabular-nums">{value}</span></p>)}</div>}><button type="button" aria-label={`${monthLabel(entry.month)}: ${entry.entries.length} events. Open calendar.`} onClick={() => openMonth(entry.month)} className="group flex min-w-0 flex-col items-center rounded-xl px-1 pt-2 transition-colors hover:bg-[#f6f9f3] focus-visible:outline-2 focus-visible:outline-brand-primary"><span className="text-xs font-semibold tabular-nums text-[#536a57]">{entry.entries.length}</span><span className="mt-2 flex h-40 w-full max-w-16 items-end justify-center"><span className="flex w-full flex-col-reverse overflow-hidden rounded-t-lg bg-[#e8eee6] transition-[height] duration-500" style={{ height: `${Math.max(1, entry.entries.length / max * 100)}%` }}>{entry.values.map((value, index) => value > 0 && <span key={types[index].label} className="block w-full" style={{ backgroundColor: types[index].color, height: `${value / entry.entries.length * 100}%` }} />)}</span></span><span className="mt-3 text-xs text-text-secondary">{formatEventDate(`${entry.month}-01`, { month: "short", year: "2-digit" })}</span></button></Tooltip>)}</div></div></div>
      {lineup.length === 0 && <p className="mt-5 text-center text-xs text-text-tertiary">No events in this range. Choose another period or create an event to start filling your calendar.</p>}
    </div> : <div className="grid min-w-0 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div className="min-w-0 p-4 sm:p-6"><div className="mb-5 flex items-center justify-between gap-2"><div className="min-w-0 max-w-56 flex-1"><Select ariaLabel="Calendar month" value={shownMonth} onValueChange={(value) => { setFocus(value); setSelected(""); }} options={months.map((month) => ({ value: month, label: monthLabel(month) }))} className="h-9 border-transparent px-2 text-sm font-semibold" /></div><div className="flex gap-1"><button type="button" aria-label="Previous calendar month" disabled={monthIndex <= 0} onClick={() => { setFocus(months[monthIndex - 1]); setSelected(""); }} className="flex size-9 items-center justify-center rounded-lg border border-border-subtle text-text-secondary hover:bg-background-subtle disabled:opacity-30"><ChevronLeft className="size-4" aria-hidden="true" /></button><button type="button" aria-label="Next calendar month" disabled={monthIndex >= months.length - 1} onClick={() => { setFocus(months[monthIndex + 1]); setSelected(""); }} className="flex size-9 items-center justify-center rounded-lg border border-border-subtle text-text-secondary hover:bg-background-subtle disabled:opacity-30"><ChevronRight className="size-4" aria-hidden="true" /></button></div></div>
        <div className="grid grid-cols-7 gap-1">{weekdays.map((day) => <div key={day} className="pb-2 text-center text-xs font-semibold uppercase text-text-tertiary">{day}</div>)}{days.map((day, index) => { if (day < 1 || day > daysInMonth) return <span key={`empty-${index}`} />; const key = `${shownMonth}-${String(day).padStart(2, "0")}`; const entries = monthEvents.filter((event) => event.date === key); return <button key={key} type="button" aria-pressed={selectedDate === key} aria-current={key === today ? "date" : undefined} aria-label={`${formatEventDate(key, { day: "numeric", month: "long", year: "numeric" })}, ${entries.length} ${entries.length === 1 ? "event" : "events"}`} onClick={() => setSelected(key)} className={cn("flex min-h-12 min-w-0 flex-col items-center justify-center gap-1 rounded-xl border border-transparent text-xs transition-colors sm:min-h-14", selectedDate === key ? "bg-brand-primary font-semibold text-white shadow-sm" : entries.length ? "bg-[#edf5e8] font-semibold text-[#426c43] hover:border-[#c5d8b9]" : key === today ? "border-[#c5d8b9] text-brand-primary" : "text-text-secondary hover:bg-[#f5f7f2]")}><span>{day}</span><span className="flex h-1.5 items-center gap-0.5" aria-hidden="true">{entries.slice(0, 3).map((event) => <span key={event.id} className="size-1.5 rounded-full ring-1 ring-white/60" style={{ backgroundColor: overviewEventType(event.type).color }} />)}</span></button>; })}</div>
        <p className="mt-4 text-sm text-text-tertiary">Highlighted dates have events. Select a date to see the details.</p>
      </div>
      <aside className="min-w-0 border-t border-border-subtle bg-[#fafbf8] p-5 lg:border-l lg:border-t-0"><p className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">On this day</p><h3 className="mt-2 text-base font-semibold">{formatEventDate(selectedDate, { weekday: "short", day: "numeric", month: "long" })}</h3><p className="mt-1 text-xs text-text-secondary">{dayEvents.length} {dayEvents.length === 1 ? "event" : "events"} scheduled</p><LineupDayEvents key={selectedDate} events={dayEvents} /></aside>
    </div>}
  </section>;
}
