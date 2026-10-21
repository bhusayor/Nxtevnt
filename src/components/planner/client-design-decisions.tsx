"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Check, Clock3, X } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { MoodboardImage } from "./moodboard-image";
import { updatePlannerEvent, useBrowserReady, usePlannerEvents } from "@/lib/planner-events";
import { currentEventDecisions, decisionAttachment, respondToEventDecision } from "@/lib/event-decisions";

export function ClientDesignDecisions() {
  const events = usePlannerEvents(), ready = useBrowserReady();
  const [selected, setSelected] = useState<{ eventId: string; decisionId: string; revision?: string } | null>(null);
  const [error, setError] = useState("");
  const requests = events.filter((event) => !event.cancelledAt).flatMap((event) => currentEventDecisions(event).filter((decision) => decision.designApproval?.mode === "client").map((decision) => ({ event, decision: { ...decision, image: decisionAttachment(event, decision) } }))).sort((a, b) => (b.decision.designApproval?.remindedAt || b.decision.designApproval!.at).localeCompare(a.decision.designApproval?.remindedAt || a.decision.designApproval!.at));
  const current = requests.find(({ event, decision }) => event.id === selected?.eventId && decision.id === selected.decisionId);
  function confirm() {
    if (!current || !selected) return;
    try {
      let found = false;
      updatePlannerEvent(current.event.id, (event) => { found = true; return respondToEventDecision(event, current.decision.id, selected.revision, "confirm", event.clientName || "Client", new Date().toISOString()); });
      if (!found) throw new Error("This event is no longer available.");
      setError("");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Your confirmation couldn’t be saved."); }
  }
  if (!ready || !requests.length) return null;
  return <section className="mx-auto mb-8 max-w-6xl space-y-4"><header><p className="text-[0.625rem] font-semibold uppercase tracking-wider text-brand-primary">Client preview · Decisions</p><h2 className="mt-1 text-xl font-semibold">A few details for your approval</h2><p className="mt-1 text-xs text-text-secondary">Review the latest decision, then confirm your choice. Your planner sees your response in this browser.</p></header><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{requests.map(({ event, decision }) => { const pending = decision.designApproval?.state === "awaiting-confirmation"; return <button key={`${event.id}:${decision.id}`} type="button" onClick={() => { setError(""); setSelected({ eventId: event.id, decisionId: decision.id, revision: decision.designApproval?.revision }); }} className="overflow-hidden rounded-xl border border-border-subtle bg-white text-left hover:border-brand-primary/40">{decision.image && <span className="relative block aspect-[2/1]"><MoodboardImage source={decision.image} alt={decision.title} sizes="400px" /></span>}<span className="block p-4"><span className="block text-xs text-text-tertiary">{event.name} · {decision.decisionCategory || "Decision"}</span><span className="mt-1 block text-sm font-semibold">{decision.title}</span><span className="mt-3 flex items-center gap-1.5 text-xs text-brand-primary">{pending ? <Clock3 className="size-3.5" /> : <Check className="size-3.5" />}{pending ? decision.designApproval?.remindedAt ? "Reminder · Review & confirm" : "Review & confirm" : "You approved this"}</span></span></button>; })}</div>
    {selected && <Dialog.Root open onOpenChange={(open) => { if (!open) setSelected(null); }}><Dialog.Portal><Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px]" /><Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90dvh] w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl bg-white shadow-xl focus:outline-none"><header className="flex items-start justify-between gap-3 p-5"><div><Dialog.Title className="text-lg font-semibold">{current?.decision.title || "Request unavailable"}</Dialog.Title><Dialog.Description className="mt-1 text-xs text-text-secondary">{current?.event.name || "This decision has changed or is no longer available. Close this window to see the latest request."}</Dialog.Description></div><Dialog.Close asChild><button aria-label="Close design decision" className="flex size-8 items-center justify-center rounded-full hover:bg-background-subtle"><X className="size-4" /></button></Dialog.Close></header>{current && <>{current.decision.image && <MoodboardImage source={current.decision.image} alt={current.decision.title} natural sizes="512px" />}<div className="space-y-3 p-5">{current.decision.decisionRecord?.note && <p className="text-xs leading-5 text-text-secondary">{current.decision.decisionRecord.note}</p>}{current.decision.designApproval?.state === "approved-by-client" ? <p role="status" className="text-sm font-medium text-success">Approved. Your planner can see your confirmation.</p> : <><p className="text-xs leading-5 text-text-secondary">Confirm this decision for your event.</p><Button fullWidth onClick={confirm}>Confirm this decision</Button></>}{error && <p role="alert" className="text-xs text-error">{error}</p>}<p className="text-[0.625rem] leading-5 text-text-tertiary">Local preview only. This is not an authenticated client account.</p></div></>}</Dialog.Content></Dialog.Portal></Dialog.Root>}
  </section>;
}
