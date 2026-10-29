"use client";

import { useState, type ReactNode } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Check, ChevronDown, ChevronLeft, ChevronRight, Search, X } from "@/components/ui/icons";

import { FormField, fieldControlStyles } from "@/components/ui/form-field";
import { cn } from "@/lib/utils/cn";

const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function localDate(value: string) {
  const parts = value.split("-").map(Number);
  return parts.length === 3 && parts.every(Number.isFinite)
    ? new Date(parts[0], parts[1] - 1, parts[2], 12)
    : new Date();
}

function dateValue(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function PickerFrame({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return <Dialog.Portal>
    <Dialog.Overlay className="fixed inset-0 z-50 bg-[#10231a]/55 backdrop-blur-[2px]" />
    <Dialog.Content className="fixed inset-x-0 bottom-0 z-50 max-h-[min(90dvh,720px)] overflow-y-auto rounded-t-[1.5rem] bg-white p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-[var(--shadow-lg)] focus:outline-none sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:w-[min(26rem,calc(100vw-2rem))] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-[1.25rem] sm:p-6">
      <div className="mb-5 flex items-start justify-between gap-4"><div><Dialog.Title className="text-lg font-semibold tracking-tight text-text-primary">{title}</Dialog.Title><Dialog.Description className="mt-1 text-xs text-text-secondary">{description}</Dialog.Description></div><Dialog.Close asChild><button type="button" aria-label="Close picker" className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border-subtle text-text-secondary hover:bg-background-subtle"><X className="size-4" aria-hidden="true" /></button></Dialog.Close></div>
      {children}
    </Dialog.Content>
  </Dialog.Portal>;
}

function Trigger({ id, value, placeholder, error }: { id: string; value: string; placeholder: string; error?: string }) {
  return <Dialog.Trigger asChild><button id={id} type="button" aria-describedby={error ? `${id}-message` : undefined} data-invalid={Boolean(error)} className={cn(fieldControlStyles, "flex min-h-12 min-w-0 items-center justify-between gap-3 pl-3.5 pr-5 text-left text-base sm:text-sm", error && "border-error focus:border-error focus:ring-error/15", !value && "text-text-tertiary")}><span className="min-w-0 truncate">{value || placeholder}</span><ChevronDown className="mr-0.5 size-4 shrink-0 text-text-tertiary" aria-hidden="true" /></button></Dialog.Trigger>;
}

const suggestedTimeZones = ["Africa/Lagos", "Europe/London", "America/New_York", "America/Los_Angeles", "Asia/Dubai"];

function timeZoneName(zone: string) {
  const parts = zone.split("/");
  return parts.at(-1)?.replaceAll("_", " ") || zone;
}

export function EventTimeZonePicker({ id, value, onChange }: { id: string; value: string; onChange: (value: string) => void }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  let available = suggestedTimeZones;
  try { available = [...new Set([...suggestedTimeZones, ...Intl.supportedValuesOf("timeZone")])]; }
  catch { /* Keep the suggested zones when the runtime cannot enumerate IANA zones. */ }
  const search = query.trim().toLocaleLowerCase();
  const matches = available.filter((zone) => `${zone} ${timeZoneName(zone)}`.replaceAll("_", " ").toLocaleLowerCase().includes(search));
  return <FormField id={id} label="Time zone"><Dialog.Root open={open} onOpenChange={(next) => { if (next) setQuery(""); setOpen(next); }}><Trigger id={id} value={value ? timeZoneName(value) : ""} placeholder="Choose a time zone" /><PickerFrame title="Choose a time zone" description="Search by city or IANA time zone. Start and end times use this zone.">
    <div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-tertiary" aria-hidden="true" /><input autoFocus type="search" aria-label="Search time zones" placeholder="Search city or time zone" value={query} onChange={(event) => setQuery(event.target.value)} className={cn(fieldControlStyles, "h-11 pl-9 pr-3 text-sm")} /></div>
    <div className="mt-3 max-h-[min(48dvh,320px)] overflow-y-auto rounded-xl border border-border-subtle" aria-label="Time zones">{matches.slice(0, 100).map((zone) => <button key={zone} type="button" aria-pressed={value === zone} onClick={() => { onChange(zone); setOpen(false); }} className={cn("flex min-h-11 w-full items-center justify-between gap-3 border-b border-border-subtle px-3.5 py-2 text-left text-xs last:border-b-0 hover:bg-[#f2f7f3] focus-visible:outline-2 focus-visible:outline-brand-primary", value === zone && "bg-[#eaf3ed] font-semibold text-brand-primary")}><span className="min-w-0 truncate">{timeZoneName(zone)}</span><span className="max-w-[55%] truncate text-right text-[0.6875rem] text-text-tertiary">{zone}</span></button>)}{matches.length === 0 && <p className="px-4 py-8 text-center text-xs text-text-secondary">No matching time zones.</p>}</div>
    {matches.length > 100 && <p className="mt-2 text-xs text-text-tertiary">Keep typing to narrow the results.</p>}
  </PickerFrame></Dialog.Root></FormField>;
}

export function EventDatePicker({ id, value, onChange, error }: { id: string; value: string; onChange: (value: string) => void; error?: string }) {
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(() => { const now = new Date(); return new Date(now.getFullYear(), now.getMonth(), 1); });
  const [view, setView] = useState<"days" | "months" | "years">("days");
  const [yearPage, setYearPage] = useState(() => new Date().getFullYear());
  const now = new Date();
  const today = dateValue(now);
  const year = month.getFullYear();
  const monthNames = Array.from({ length: 12 }, (_, index) => new Date(2000, index, 1).toLocaleDateString("en-NG", { month: "short" }));
  const previousDisabled = view === "days" ? year < now.getFullYear() || year === now.getFullYear() && month.getMonth() <= now.getMonth() : view === "months" ? year <= now.getFullYear() : yearPage <= now.getFullYear();
  const nextDisabled = view === "days" ? year === 9999 && month.getMonth() === 11 : view === "months" ? year >= 9999 : yearPage + 12 > 9999;
  function navigate(direction: number) {
    if (view === "days") setMonth(new Date(year, month.getMonth() + direction, 1));
    else if (view === "months") setMonth(new Date(year + direction, month.getMonth(), 1));
    else setYearPage(Math.max(now.getFullYear(), yearPage + direction * 12));
  }
  function chooseYear() { setYearPage(now.getFullYear() + Math.floor(Math.max(0, year - now.getFullYear()) / 12) * 12); setView("years"); }
  const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
  const offset = (monthStart.getDay() + 6) % 7;
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells = Array.from({ length: Math.ceil((offset + days) / 7) * 7 }, (_, index) => index - offset + 1);
  const display = value ? localDate(value).toLocaleDateString("en-NG", { weekday: "short", day: "numeric", month: "long", year: "numeric" }) : "Choose a date";
  return <FormField id={id} label="Event date" required error={error}><Dialog.Root open={open} onOpenChange={(next) => { if (next) { const selected = value ? localDate(value) : new Date(); setMonth(new Date(selected.getFullYear(), selected.getMonth(), 1)); setView("days"); } setOpen(next); }}><Trigger id={id} value={value ? display : ""} placeholder="Choose a date" error={error} /><PickerFrame title="Choose your event date" description="Pick today or a date in the future.">
    <div className="min-h-[20rem]">
      <div className="flex items-center justify-between gap-3"><button type="button" aria-label={view === "days" ? "Previous month" : view === "months" ? "Previous year" : "Previous 12 years"} disabled={previousDisabled} onClick={() => navigate(-1)} className="flex size-10 items-center justify-center rounded-full border border-border-subtle hover:bg-background-subtle disabled:cursor-not-allowed disabled:opacity-30"><ChevronLeft className="size-4" aria-hidden="true" /></button><div className="flex items-center justify-center text-sm font-semibold text-text-primary" aria-live="polite">{view === "days" && <button type="button" aria-label="Choose month" onClick={() => setView("months")} className="min-h-10 rounded-lg px-2 hover:bg-background-subtle focus-visible:outline-2 focus-visible:outline-brand-primary">{month.toLocaleDateString("en-NG", { month: "long" })}</button>}{view !== "years" ? <button type="button" aria-label="Choose year" onClick={chooseYear} className="inline-flex min-h-10 items-center gap-1 rounded-lg px-2 hover:bg-background-subtle focus-visible:outline-2 focus-visible:outline-brand-primary">{year}<ChevronDown className="size-3.5" aria-hidden="true" /></button> : <span>{yearPage} – {Math.min(9999, yearPage + 11)}</span>}</div><button type="button" aria-label={view === "days" ? "Next month" : view === "months" ? "Next year" : "Next 12 years"} disabled={nextDisabled} onClick={() => navigate(1)} className="flex size-10 items-center justify-center rounded-full border border-border-subtle hover:bg-background-subtle disabled:cursor-not-allowed disabled:opacity-30"><ChevronRight className="size-4" aria-hidden="true" /></button></div>
      {view === "days" ? <div aria-label="Choose day" className="mt-5 grid grid-cols-7 gap-1 text-center">{weekdays.map((day) => <span key={day} className="py-2 text-[0.6875rem] font-semibold text-text-tertiary">{day}</span>)}{cells.map((day, index) => { const valid = day > 0 && day <= days; const candidate = valid ? dateValue(new Date(year, month.getMonth(), day)) : ""; const selected = candidate === value; return valid ? <button key={index} type="button" disabled={candidate < today} aria-label={new Date(year, month.getMonth(), day).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" })} aria-pressed={selected} onClick={() => { onChange(candidate); setOpen(false); }} className={cn("mx-auto flex aspect-square w-full max-w-10 items-center justify-center rounded-full text-sm font-medium transition-colors", selected ? "bg-brand-primary text-white" : candidate === today ? "border border-brand-primary text-brand-primary" : "text-text-primary hover:bg-[#eaf3ed]", "disabled:cursor-not-allowed disabled:text-text-disabled disabled:hover:bg-transparent")}>{day}</button> : <span key={index} />; })}</div> : view === "months" ? <div role="group" aria-label="Choose month of year" className="mt-5 grid grid-cols-3 gap-2">{monthNames.map((name, index) => <button key={name} type="button" aria-label={new Date(year, index, 1).toLocaleDateString("en-NG", { month: "long", year: "numeric" })} disabled={year < now.getFullYear() || year === now.getFullYear() && index < now.getMonth()} aria-pressed={month.getMonth() === index} onClick={() => { setMonth(new Date(year, index, 1)); setView("days"); }} className={cn("min-h-14 rounded-xl text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-brand-primary disabled:cursor-not-allowed disabled:text-text-disabled disabled:hover:bg-transparent", month.getMonth() === index ? "bg-[#eaf3ed] text-brand-primary" : "hover:bg-background-subtle")}>{name}</button>)}</div> : <div role="group" aria-label="Choose year from range" className="mt-5 grid grid-cols-3 gap-2">{Array.from({ length: 12 }, (_, index) => yearPage + index).map(candidate => <button key={candidate} type="button" disabled={candidate < now.getFullYear() || candidate > 9999} aria-pressed={candidate === year} onClick={() => { setMonth(new Date(candidate, month.getMonth(), 1)); setView("months"); }} className={cn("min-h-14 rounded-xl text-sm font-medium tabular-nums transition-colors focus-visible:outline-2 focus-visible:outline-brand-primary disabled:cursor-not-allowed disabled:text-text-disabled disabled:hover:bg-transparent", candidate === year ? "bg-[#eaf3ed] text-brand-primary" : "hover:bg-background-subtle")}>{candidate}</button>)}</div>}
    </div>
    <div className="mt-5 border-t border-border-subtle pt-4"><button type="button" onClick={() => { onChange(today); setOpen(false); }} className="min-h-11 w-full rounded-lg bg-[#eaf3ed] text-sm font-semibold text-brand-primary hover:bg-[#dcece0]">Choose today</button></div>
  </PickerFrame></Dialog.Root></FormField>;
}

export function EventTimePicker({ id, label, value, onChange }: { id: string; label: string; value: string; onChange: (value: string) => void }) {
  const [open, setOpen] = useState(false);
  const [hour, setHour] = useState(9);
  const [minute, setMinute] = useState(0);
  const [period, setPeriod] = useState<"AM" | "PM">("AM");
  const display = value ? new Date(`2000-01-01T${value}:00`).toLocaleTimeString("en-NG", { hour: "numeric", minute: "2-digit", hour12: true }) : "Choose a time";
  function openChange(next: boolean) {
    if (next) { const [h, m] = value ? value.split(":").map(Number) : [9, 0]; setHour(h % 12 || 12); setMinute(m); setPeriod(h >= 12 ? "PM" : "AM"); }
    setOpen(next);
  }
  function confirm() { const h = (hour % 12) + (period === "PM" ? 12 : 0); onChange(`${String(h).padStart(2, "0")}:${String(minute).padStart(2, "0")}`); setOpen(false); }
  return <FormField id={id} label={label} optional><Dialog.Root open={open} onOpenChange={openChange}><Trigger id={id} value={value ? display : ""} placeholder="Choose a time" /><PickerFrame title={`Choose ${label.toLowerCase()}`} description="Set the hour and minute for your event.">
    <div className="grid grid-cols-[1fr_1fr_1fr] gap-3"><div><label htmlFor={`${id}-hour`} className="mb-2 block text-xs font-semibold text-text-secondary">Hour</label><div className="relative"><select id={`${id}-hour`} value={hour} onChange={(event) => setHour(Number(event.target.value))} className={cn(fieldControlStyles, "h-14 appearance-none pl-3 pr-8 text-center text-lg font-semibold")}>{Array.from({ length: 12 }, (_, index) => <option key={index + 1} value={index + 1}>{String(index + 1).padStart(2, "0")}</option>)}</select><ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-3.5 -translate-y-1/2 text-text-tertiary" aria-hidden="true" /></div></div><div><label htmlFor={`${id}-minute`} className="mb-2 block text-xs font-semibold text-text-secondary">Minute</label><div className="relative"><select id={`${id}-minute`} value={minute} onChange={(event) => setMinute(Number(event.target.value))} className={cn(fieldControlStyles, "h-14 appearance-none pl-3 pr-8 text-center text-lg font-semibold")}>{Array.from({ length: 60 }, (_, index) => <option key={index} value={index}>{String(index).padStart(2, "0")}</option>)}</select><ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-3.5 -translate-y-1/2 text-text-tertiary" aria-hidden="true" /></div></div><div><label htmlFor={`${id}-period`} className="mb-2 block text-xs font-semibold text-text-secondary">Period</label><div className="relative"><select id={`${id}-period`} value={period} onChange={(event) => setPeriod(event.target.value as "AM" | "PM")} className={cn(fieldControlStyles, "h-14 appearance-none pl-3 pr-8 text-center text-lg font-semibold")}><option>AM</option><option>PM</option></select><ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-3.5 -translate-y-1/2 text-text-tertiary" aria-hidden="true" /></div></div></div>
    <button type="button" onClick={confirm} className="mt-6 flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-brand-primary bg-[image:var(--action-primary-gradient)] hover:bg-[image:var(--action-primary-gradient-hover)] active:bg-[image:var(--action-primary-gradient-active)] px-4 text-sm font-semibold text-white hover:opacity-90"><Check className="size-4" aria-hidden="true" />Set time</button>
  </PickerFrame></Dialog.Root></FormField>;
}
