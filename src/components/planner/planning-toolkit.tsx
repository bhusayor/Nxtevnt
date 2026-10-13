"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import * as Select from "@radix-ui/react-select";
import { ArrowUpRight, BookOpenText, Check, ChevronDown, ClipboardList, NotebookPen, Wallet } from "@/components/ui/icons";

import { eventCovers, formatEventDate, isCustomCover, isEventCancelled, usePlannerEvents, type PlannerEvent } from "@/lib/planner-events";

const actions = [
  { label: "Write a note", detail: "Capture an idea or update", icon: NotebookPen, section: "notes&action=write", tone: "bg-[#e7f1e9] text-[#416e50]" },
  { label: "Send a questionnaire", detail: "Gather the client’s details", icon: ClipboardList, section: "notes&tab=questionnaires&action=choose-template", tone: "bg-[#eeeafa] text-[#745a96]" },
  { label: "Open the budget", detail: "Organise costs and payments", icon: Wallet, section: "budget", tone: "bg-[#fbefde] text-[#966a3c]" },
] as const;

function EventCover({ event }: { event: PlannerEvent }) {
  const src = event.image || eventCovers[0].src;
  return <span className="relative size-10 shrink-0 overflow-hidden rounded-lg bg-[#dfe8e1]"><Image src={src} alt="" fill unoptimized={isCustomCover(src)} sizes="40px" className="object-cover" /></span>;
}

function EventPicker({ events, selected, onValueChange }: { events: PlannerEvent[]; selected: PlannerEvent; onValueChange: (id: string) => void }) {
  const detail = (event: PlannerEvent) => `${event.type} · ${formatEventDate(event.date, { day: "numeric", month: "short" })}`;

  if (events.length === 1) return <div className="flex min-h-14 items-center gap-3 rounded-xl border border-[#dbe5dc] bg-white/80 px-2.5 py-2"><EventCover event={selected} /><span className="min-w-0"><span className="block truncate text-xs font-semibold text-text-primary">{selected.name}</span><span className="mt-0.5 block truncate text-[0.6875rem] text-text-secondary">{detail(selected)}</span></span></div>;

  return <Select.Root value={selected.id} onValueChange={onValueChange}>
    <Select.Trigger aria-label="Choose an event for the planning toolkit" className="group flex min-h-14 w-full items-center gap-3 rounded-xl border border-[#dbe5dc] bg-white/85 px-2.5 py-2 text-left outline-none transition-[border-color,background-color,box-shadow] hover:border-[#a9c0ae] hover:bg-white data-[state=open]:border-brand-primary data-[state=open]:bg-white focus-visible:ring-2 focus-visible:ring-brand-primary/20">
      <EventCover event={selected} />
      <span className="min-w-0 flex-1"><span className="block truncate text-xs font-semibold text-text-primary"><Select.Value /></span><span className="mt-0.5 block truncate text-[0.6875rem] text-text-secondary">{detail(selected)}</span></span>
      <Select.Icon><ChevronDown className="size-4 shrink-0 text-text-secondary transition-transform group-data-[state=open]:rotate-180" aria-hidden="true" /></Select.Icon>
    </Select.Trigger>
    <Select.Portal>
      <Select.Content position="popper" align="start" sideOffset={8} className="z-50 w-[var(--radix-select-trigger-width)] max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-[#dce7df] bg-white p-1.5 shadow-[0_18px_44px_-18px_rgba(24,48,33,0.32)]">
        <Select.Viewport className="max-h-72 overflow-y-auto">
          <p className="px-2.5 pb-2 pt-1.5 text-[0.625rem] font-bold uppercase tracking-[0.12em] text-text-tertiary">Choose an event</p>
          {events.map((event) => <Select.Item key={event.id} value={event.id} className="relative flex cursor-pointer select-none items-center gap-3 rounded-lg px-2.5 py-2 pr-9 outline-none data-[highlighted]:bg-[#f0f6f1] data-[state=checked]:bg-[#f4f8f4]"><EventCover event={event} /><span className="min-w-0 flex-1"><span className="block truncate text-xs font-semibold text-text-primary"><Select.ItemText>{event.name}</Select.ItemText></span><span className="mt-0.5 block truncate text-[0.6875rem] text-text-secondary">{detail(event)}</span></span><Select.ItemIndicator className="absolute right-3 text-brand-primary"><Check className="size-4" weight="bold" aria-hidden="true" /></Select.ItemIndicator></Select.Item>)}
        </Select.Viewport>
      </Select.Content>
    </Select.Portal>
  </Select.Root>;
}

export function PlanningToolkit() {
  const events = usePlannerEvents();
  const activeEvents = events.filter((event) => !isEventCancelled(event));
  const [selectedId, setSelectedId] = useState("");
  const selected = activeEvents.find((event) => event.id === selectedId) ?? activeEvents[0];

  return <section className="relative isolate overflow-hidden rounded-xl border border-[#dde8df] bg-gradient-to-br from-[#edf5ef] via-[#f6f7f2] to-[#f5eef8] p-5 shadow-[0_12px_32px_-28px_rgba(38,63,46,0.45)]" aria-labelledby="planning-toolkit-title">
    <div className="pointer-events-none absolute -right-16 -top-20 -z-10 size-48 rounded-full bg-white/50 blur-2xl" aria-hidden="true" />
    <div className="flex items-start justify-between gap-3"><div><p className="text-[0.625rem] font-bold uppercase tracking-[0.13em] text-[#62806a]">Keep things moving</p><h2 id="planning-toolkit-title" className="mt-1.5 text-lg font-semibold tracking-[-0.035em] text-text-primary">Planning toolkit</h2><p className="mt-1 text-xs leading-5 text-text-secondary">The little details that bring it all together.</p></div><span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-white/80 bg-white/75 text-brand-primary shadow-sm"><BookOpenText className="size-5" aria-hidden="true" /></span></div>
    {selected ? <>
      <div className="mt-5">
        <p className="mb-2 text-[0.625rem] font-bold uppercase tracking-[0.1em] text-text-tertiary">Working on</p>
        <EventPicker events={activeEvents} selected={selected} onValueChange={setSelectedId} />
      </div>
      <div className="mt-3 space-y-2">{actions.map((action) => { const Icon = action.icon; return <Link key={action.label} href={`/planner/events/${selected.id}?section=${action.section}`} className="group flex min-h-[68px] items-center gap-3 rounded-xl border border-white/90 bg-white/85 px-3 py-2.5 text-left shadow-[0_2px_8px_-7px_rgba(34,53,39,0.28)] transition-[background-color,border-color,transform,box-shadow] hover:-translate-y-0.5 hover:border-[#c9d9cd] hover:bg-white hover:shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary"><span className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${action.tone}`}><Icon className="size-[19px]" weight="bold" aria-hidden="true" /></span><span className="min-w-0 flex-1"><span className="block text-xs font-semibold text-text-primary">{action.label}</span><span className="mt-0.5 block text-[0.6875rem] leading-4 text-text-secondary">{action.detail}</span></span><ArrowUpRight className="size-4 shrink-0 text-text-tertiary transition-colors group-hover:text-brand-primary" aria-hidden="true" /></Link>; })}</div>
    </> : <div className="mt-5 rounded-xl border border-white/90 bg-white/80 p-4"><p className="text-sm font-semibold text-text-primary">No active event right now</p><p className="mt-1 text-xs leading-5 text-text-secondary">Reopen an event to use its notes, questionnaires and budget.</p><Link href="/planner/events" className="mt-3 inline-flex min-h-9 items-center gap-1 text-xs font-semibold text-brand-primary hover:underline">View events<ArrowUpRight className="size-3.5" aria-hidden="true" /></Link></div>}
  </section>;
}
