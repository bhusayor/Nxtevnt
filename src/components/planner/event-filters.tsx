"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Filter, X } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { EMPTY_EVENT_FILTERS, type EventFilters } from "@/lib/event-browsing";
import type { PlannerEvent } from "@/lib/planner-events";

export function EventFiltersControl({ events, value, onChange }: { events: readonly PlannerEvent[]; value: EventFilters; onChange: (value: EventFilters) => void }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);
  const count = Object.values(value).filter(Boolean).length;
  const choices = (field: "type" | "clientName") => [...new Set(events.map(event => event[field]).filter(Boolean))].sort().map(label => ({ label, value: JSON.stringify(label) }));
  const select = (field: keyof EventFilters, option: string) => {
    if (option === "all") { setDraft(current => ({ ...current, [field]: "" })); return; }
    try { const next: unknown = JSON.parse(option); if (typeof next === "string") setDraft(current => ({ ...current, [field]: next })); }
    catch { /* Ignore transient empty values from the select control. */ }
  };
  return <Dialog.Root open={open} onOpenChange={next => { if (next) setDraft(value); setOpen(next); }}>
    <Dialog.Trigger asChild><Button type="button" variant="outline" className="min-h-11 gap-2" leadingIcon={<Filter className="size-4" aria-hidden="true" />}><span className="inline-flex items-center gap-2">Filters{count > 0 && <span className="flex size-5 items-center justify-center rounded-full bg-brand-primary text-[0.625rem] text-white">{count}</span>}</span></Button></Dialog.Trigger>
    <Dialog.Portal><Dialog.Overlay className="fixed inset-0 z-50 bg-[#10231a]/45 backdrop-blur-[2px]" /><Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-[var(--shadow-lg)] focus:outline-none">
      <Dialog.Title className="text-lg font-semibold">Filter events</Dialog.Title><Dialog.Description className="mt-1 text-sm text-text-secondary">Narrow the events in your selected tab.</Dialog.Description>
      <div className="mt-6 space-y-5">
        <Select label="Event type" value={draft.type ? JSON.stringify(draft.type) : "all"} onValueChange={value => select("type", value)} options={[{ label: "All event types", value: "all" }, ...choices("type")]} />
        <Select label="Client" value={draft.client ? JSON.stringify(draft.client) : "all"} onValueChange={value => select("client", value)} options={[{ label: "All clients", value: "all" }, ...choices("clientName")]} />
        <Select label="Priority" value={draft.priority ? JSON.stringify(draft.priority) : "all"} onValueChange={value => select("priority", value)} options={[{ label: "All priorities", value: "all" }, ...["highest", "high", "standard", "low"].map(priority => ({ label: priority[0].toUpperCase() + priority.slice(1), value: JSON.stringify(priority) }))]} />
      </div>
      <div className="mt-6 flex items-center justify-between gap-2"><Button type="button" variant="ghost" onClick={() => { setDraft(EMPTY_EVENT_FILTERS); onChange(EMPTY_EVENT_FILTERS); setOpen(false); }}>Clear filters</Button><Button type="button" onClick={() => { onChange(draft); setOpen(false); }}>Apply filters</Button></div>
      <Dialog.Close asChild><button type="button" aria-label="Close filters" className="absolute right-4 top-4 flex size-9 items-center justify-center rounded-lg text-text-tertiary hover:bg-background-subtle"><X className="size-4" /></button></Dialog.Close>
    </Dialog.Content></Dialog.Portal>
  </Dialog.Root>;
}
