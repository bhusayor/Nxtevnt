"use client";

import { useState, type ReactNode } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Check, ChevronDown, ChevronLeft, ChevronRight, X } from "lucide-react";

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
  return <Dialog.Trigger asChild><button id={id} type="button" aria-describedby={error ? `${id}-message` : undefined} data-invalid={Boolean(error)} className={cn(fieldControlStyles, "flex min-h-12 min-w-0 items-center justify-between gap-3 text-left text-base sm:text-sm", error && "border-error focus:border-error focus:ring-error/15", !value && "text-text-tertiary")}><span className="min-w-0 truncate">{value || placeholder}</span><ChevronDown className="size-4 shrink-0 text-text-tertiary" aria-hidden="true" /></button></Dialog.Trigger>;
}

export function EventDatePicker({ id, value, onChange, error }: { id: string; value: string; onChange: (value: string) => void; error?: string }) {
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(() => { const now = new Date(); return new Date(now.getFullYear(), now.getMonth(), 1); });
  const today = dateValue(new Date());
  const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
  const offset = (monthStart.getDay() + 6) % 7;
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells = Array.from({ length: Math.ceil((offset + days) / 7) * 7 }, (_, index) => index - offset + 1);
  const display = value ? localDate(value).toLocaleDateString("en-NG", { weekday: "short", day: "numeric", month: "long", year: "numeric" }) : "Choose a date";
  return <FormField id={id} label="Event date" required error={error}><Dialog.Root open={open} onOpenChange={(next) => { if (next) { const selected = value ? localDate(value) : new Date(); setMonth(new Date(selected.getFullYear(), selected.getMonth(), 1)); } setOpen(next); }}><Trigger id={id} value={value ? display : ""} placeholder="Choose a date" error={error} /><PickerFrame title="Choose your event date" description="Pick today or a date in the future.">
    <div className="flex items-center justify-between gap-3"><button type="button" aria-label="Previous month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} className="flex size-10 items-center justify-center rounded-full border border-border-subtle hover:bg-background-subtle"><ChevronLeft className="size-4" /></button><p className="text-sm font-semibold text-text-primary" aria-live="polite">{month.toLocaleDateString("en-NG", { month: "long", year: "numeric" })}</p><button type="button" aria-label="Next month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} className="flex size-10 items-center justify-center rounded-full border border-border-subtle hover:bg-background-subtle"><ChevronRight className="size-4" /></button></div>
    <div className="mt-5 grid grid-cols-7 gap-1 text-center">{weekdays.map((day) => <span key={day} className="py-2 text-[0.6875rem] font-semibold text-text-tertiary">{day}</span>)}{cells.map((day, index) => { const valid = day > 0 && day <= days; const candidate = valid ? dateValue(new Date(month.getFullYear(), month.getMonth(), day)) : ""; const selected = candidate === value; return valid ? <button key={index} type="button" disabled={candidate < today} aria-label={new Date(month.getFullYear(), month.getMonth(), day).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" })} aria-pressed={selected} onClick={() => { onChange(candidate); setOpen(false); }} className={cn("mx-auto flex aspect-square w-full max-w-10 items-center justify-center rounded-full text-sm font-medium transition-colors", selected ? "bg-brand-primary text-white" : candidate === today ? "border border-brand-primary text-brand-primary" : "text-text-primary hover:bg-[#eaf3ed]", "disabled:cursor-not-allowed disabled:text-text-disabled disabled:hover:bg-transparent")}>{day}</button> : <span key={index} />; })}</div>
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
    <div className="grid grid-cols-[1fr_1fr_1fr] gap-3"><div><label htmlFor={`${id}-hour`} className="mb-2 block text-xs font-semibold text-text-secondary">Hour</label><select id={`${id}-hour`} value={hour} onChange={(event) => setHour(Number(event.target.value))} className={cn(fieldControlStyles, "h-14 text-center text-lg font-semibold")}>{Array.from({ length: 12 }, (_, index) => <option key={index + 1} value={index + 1}>{String(index + 1).padStart(2, "0")}</option>)}</select></div><div><label htmlFor={`${id}-minute`} className="mb-2 block text-xs font-semibold text-text-secondary">Minute</label><select id={`${id}-minute`} value={minute} onChange={(event) => setMinute(Number(event.target.value))} className={cn(fieldControlStyles, "h-14 text-center text-lg font-semibold")}>{Array.from({ length: 60 }, (_, index) => <option key={index} value={index}>{String(index).padStart(2, "0")}</option>)}</select></div><div><label htmlFor={`${id}-period`} className="mb-2 block text-xs font-semibold text-text-secondary">Period</label><select id={`${id}-period`} value={period} onChange={(event) => setPeriod(event.target.value as "AM" | "PM")} className={cn(fieldControlStyles, "h-14 text-center text-lg font-semibold")}><option>AM</option><option>PM</option></select></div></div>
    <button type="button" onClick={confirm} className="mt-6 flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-brand-primary px-4 text-sm font-semibold text-white hover:opacity-90"><Check className="size-4" aria-hidden="true" />Set time</button>
  </PickerFrame></Dialog.Root></FormField>;
}
