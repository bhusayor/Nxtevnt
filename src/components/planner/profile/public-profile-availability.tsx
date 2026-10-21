"use client";

import { useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { dateKey } from "@/lib/planner-dashboard";
import { formatEventDate } from "@/lib/planner-events";
import { cn } from "@/lib/utils/cn";

export function PublicProfileAvailability({ busyDates, selected, onSelect, onInquire }: {
  busyDates: ReadonlySet<string>;
  selected: string;
  onSelect: (date: string) => void;
  onInquire: () => void;
}) {
  const [month, setMonth] = useState(() => { const today = new Date(); return new Date(today.getFullYear(), today.getMonth(), 1); });
  const today = dateKey(new Date());
  const firstDay = (month.getDay() + 6) % 7;
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const canGoBack = dateKey(month).slice(0, 7) > today.slice(0, 7);
  const selectable = selected && selected >= today && !busyDates.has(selected);
  const title = month.toLocaleDateString("en-GB", { month: "long", year: "numeric" });

  return <section id="availability" className="min-w-0 scroll-mt-24 rounded-2xl border border-border-subtle bg-white p-5 sm:p-6" aria-labelledby="availability-title">
    <div className="flex items-center gap-2"><CalendarDays className="size-5 text-brand-primary" aria-hidden="true" /><h2 id="availability-title" className="text-base font-semibold">Have a date in mind?</h2></div>
    <p className="mt-2 text-xs leading-6 text-text-secondary">Choose a date to ask about your event.</p>
    <div className="mt-5 flex items-center justify-between gap-2">
      <button type="button" aria-label="Previous month" disabled={!canGoBack} onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} className="flex size-9 items-center justify-center rounded-full border border-border-subtle hover:bg-[#f5f5f5] disabled:opacity-30"><ChevronLeft className="size-4" aria-hidden="true" /></button>
      <p aria-live="polite" className="text-sm font-semibold">{title}</p>
      <button type="button" aria-label="Next month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} className="flex size-9 items-center justify-center rounded-full border border-border-subtle hover:bg-[#f5f5f5]"><ChevronRight className="size-4" aria-hidden="true" /></button>
    </div>
    <table className="mt-3 w-full table-fixed border-separate border-spacing-y-1 text-center text-xs" aria-label={`Planner availability for ${title}`}>
      <thead><tr>{["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => <th key={day} scope="col" className="pb-2 text-[0.625rem] font-medium text-text-tertiary"><abbr title={day} className="no-underline">{day.slice(0, 1)}</abbr></th>)}</tr></thead>
      <tbody>{Array.from({ length: Math.ceil((firstDay + days) / 7) }, (_, week) => <tr key={week}>{Array.from({ length: 7 }, (_, weekday) => {
        const day = week * 7 + weekday - firstDay + 1;
        if (day < 1 || day > days) return <td key={weekday} />;
        const key = dateKey(new Date(month.getFullYear(), month.getMonth(), day));
        const past = key < today;
        const busy = busyDates.has(key);
        return <td key={weekday} className="p-0.5"><button type="button" disabled={past || busy} aria-pressed={selected === key} aria-label={`${formatEventDate(key)}, ${past ? "past date" : busy ? "unavailable" : "available to inquire"}`} onClick={() => onSelect(key)} className={cn("relative mx-auto flex size-9 max-w-full items-center justify-center rounded-full text-xs transition-colors", selected === key && !past && !busy ? "bg-brand-primary font-semibold text-white" : past ? "text-text-disabled/60" : busy ? "bg-[#f4f4f4] text-text-tertiary line-through decoration-text-tertiary/60" : "font-medium hover:bg-[#f0f2ef]", key === today && selected !== key && "ring-1 ring-inset ring-border-default")}>
          {day}{!past && !busy && selected !== key && <span aria-hidden="true" className="absolute bottom-1 size-0.75 rounded-full bg-brand-primary/50" />}
        </button></td>;
      })}</tr>)}</tbody>
    </table>
    <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-[0.625rem] text-text-secondary"><span className="inline-flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-brand-primary" />Open to inquiries</span><span className="inline-flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-[#c7ccc9]" />Unavailable</span></div>
    {selected && <p role="status" className="mt-4 text-xs leading-6 text-text-secondary">{selectable ? <><span className="font-semibold text-text-primary">{formatEventDate(selected)}</span><br />Let’s check if this date works for your plans.</> : "This date is no longer available. Please choose another."}</p>}
    <Button type="button" fullWidth className="mt-5 text-xs" disabled={!selectable} onClick={onInquire}>Ask about this date</Button>
    <p className="mt-3 text-center text-[0.625rem] leading-5 text-text-tertiary">A date is only reserved after the planner confirms.</p>
  </section>;
}
