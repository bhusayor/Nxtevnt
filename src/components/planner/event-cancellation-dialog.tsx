"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Ban, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cancelPlannerEvent, type PlannerEvent } from "@/lib/planner-events";

export function EventCancellationDialog({ event, onClose }: { event: PlannerEvent | null; onClose: () => void }) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  function close() { setReason(""); setError(""); onClose(); }
  function confirm() {
    if (!event) return;
    try { cancelPlannerEvent(event.id, reason); close(); }
    catch { setError("This event couldn’t be cancelled in this browser. Please try again."); }
  }

  return <Dialog.Root open={Boolean(event)} onOpenChange={(open) => { if (!open) close(); }}><Dialog.Portal><Dialog.Overlay className="fixed inset-0 z-50 bg-[#10231a]/55 backdrop-blur-[2px]" /><Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white p-6 shadow-[var(--shadow-lg)] focus:outline-none"><div className="flex items-start justify-between gap-3"><span className="flex size-11 items-center justify-center rounded-xl bg-[#fbeeee] text-[#a34c4c]"><Ban className="size-5" aria-hidden="true" /></span><Dialog.Close asChild><button type="button" aria-label="Close" className="flex size-8 items-center justify-center rounded-lg text-text-tertiary hover:bg-background-subtle"><X className="size-4" /></button></Dialog.Close></div><Dialog.Title className="mt-4 text-lg font-semibold">Cancel {event?.name}?</Dialog.Title><Dialog.Description className="mt-2 text-sm leading-6 text-text-secondary">The event will leave upcoming plans, but its notes, budget and files will stay available. You can reopen it later.</Dialog.Description><label htmlFor="cancellation-reason" className="mt-5 block text-xs font-semibold text-text-primary">Reason <span className="font-normal text-text-tertiary">(optional)</span></label><textarea id="cancellation-reason" rows={3} maxLength={300} value={reason} onChange={(input) => setReason(input.target.value)} placeholder="Add a short note for your team" className="mt-2 w-full resize-none rounded-lg border border-border-subtle bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/15" /><p className="mt-1 text-right text-[0.6875rem] text-text-tertiary">{reason.length}/300</p>{error && <p role="alert" className="mt-3 rounded-lg bg-error-soft p-3 text-xs text-error">{error}</p>}<div className="mt-5 flex justify-end gap-2"><Button type="button" size="sm" variant="outline" onClick={close}>Keep event</Button><Button type="button" size="sm" onClick={confirm} className="bg-[#a34c4c] hover:bg-[#8e4040]">Cancel event</Button></div></Dialog.Content></Dialog.Portal></Dialog.Root>;
}
