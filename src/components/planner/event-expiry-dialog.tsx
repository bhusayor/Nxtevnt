"use client";

import { useState, type FormEvent } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { CalendarClock, X } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { eventExpiryDate, validateEventExpiry } from "@/lib/event-browsing";
import { formatEventDate, getPlannerEventById, updatePlannerEvent, type PlannerEvent } from "@/lib/planner-events";

export function EventExpiryDialog({ event, onClose }: { event: PlannerEvent; onClose: () => void }) {
  const expiry = eventExpiryDate(event);
  const [date, setDate] = useState("");
  const [error, setError] = useState("");
  function save(input: FormEvent) {
    input.preventDefault();
    const current = getPlannerEventById(event.id);
    if (!current) { setError("This event no longer exists."); return; }
    const issue = validateEventExpiry(current, date, new Date().toLocaleDateString("sv-SE"));
    if (issue) { setError(issue); return; }
    try { updatePlannerEvent(event.id, latest => ({ ...latest, expiresAt: date })); onClose(); }
    catch { setError("The expiry date couldn’t be saved. Please try again."); }
  }
  return <Dialog.Root open onOpenChange={open => { if (!open) onClose(); }}><Dialog.Portal>
    <Dialog.Overlay className="fixed inset-0 z-50 bg-[#10231a]/50 backdrop-blur-[2px]" />
    <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-[var(--shadow-lg)] focus:outline-none">
      <CalendarClock className="mb-4 size-7 text-brand-primary" aria-hidden="true" />
      <Dialog.Title className="text-lg font-semibold">Extend event expiry</Dialog.Title>
      <Dialog.Description className="mt-2 text-sm leading-6 text-text-secondary">{event.name}{expiry ? ` currently expires on ${formatEventDate(expiry)}.` : " has no expiry date set."} Choose a later expiry for this event.</Dialog.Description>
      <form onSubmit={save} className="mt-5 space-y-5"><Input label="New expiry date" type="date" required value={date} onChange={input => { setDate(input.target.value); setError(""); }} error={error} />
        <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={onClose}>Cancel</Button><Button type="submit">Save expiry</Button></div>
      </form>
      <Dialog.Close asChild><button type="button" aria-label="Close expiry editor" className="absolute right-4 top-4 flex size-9 items-center justify-center rounded-lg text-text-tertiary hover:bg-background-subtle"><X className="size-4" /></button></Dialog.Close>
    </Dialog.Content>
  </Dialog.Portal></Dialog.Root>;
}
