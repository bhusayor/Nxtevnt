"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/button";
import { Check, ShieldCheck, X } from "@/components/ui/icons";
import { cn } from "@/lib/utils/cn";
import { guestAccessCapabilities, type GuestAccessLevel } from "@/lib/event-guests";
import type { PlannerEvent } from "@/lib/planner-events";

const levelLabels: Record<GuestAccessLevel, string> = { 1: "Names only", 2: "Planning access", 3: "Full control" };
const permissions = [
  ["View guest names", "viewNames"],
  ["View RSVP status", "viewRsvp"],
  ["View RSVP answers", "viewAnswers"],
  ["Edit RSVP questions", "editRsvpQuestions"],
  ["Manage seating", "manageSeating"],
  ["Add or remove guests", "manageGuests"],
  ["View phone and email", "viewContact"],
  ["Send invitations and messages", "sendMessages"],
] as const;

export function GuestClientAccessCard({ event, level }: { event: PlannerEvent; level: GuestAccessLevel }) {
  const [open, setOpen] = useState(false);
  const linked = Boolean(event.clientId?.trim());
  return <>
    <section className="flex flex-wrap items-center gap-4 rounded-2xl border border-border-subtle bg-white px-5 py-4 shadow-[0_1px_2px_rgba(20,45,32,0.03)]">
      <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#f0f3f5] text-[#405166]"><ShieldCheck className="size-5" /></span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2.5"><h3 className="text-sm font-semibold text-text-primary">Client access</h3><span className="rounded-full bg-[#fff7e7] px-2.5 py-1 text-xs font-semibold text-[#a75b00]">Level {level} · {levelLabels[level]}</span></div>
        <p className="mt-1 text-sm text-text-secondary">{linked ? `${event.clientName || "The client"} controls what you can see and manage in this guest workspace.` : "No client account is linked to this event, so you have full guest-management access."}</p>
      </div>
      <button type="button" onClick={() => setOpen(true)} className="rounded-lg px-3 py-2 text-sm font-semibold text-brand-primary hover:bg-[#f1f6f2] focus-visible:outline-2 focus-visible:outline-brand-primary">View access details</button>
    </section>

    <Dialog.Root open={open} onOpenChange={setOpen}><Dialog.Portal><Dialog.Overlay className="fixed inset-0 z-50 bg-[#172d23]/45 backdrop-blur-[2px]" /><Dialog.Content className="fixed left-1/2 top-1/2 z-50 flex max-h-[90dvh] w-[calc(100vw-2rem)] max-w-3xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-border-subtle bg-white shadow-[var(--shadow-lg)] focus:outline-none">
      <header className="flex items-start justify-between gap-4 border-b border-border-subtle px-6 py-5"><div><Dialog.Title className="text-xl font-semibold tracking-tight">How client access works</Dialog.Title><Dialog.Description className="mt-1 text-sm text-text-secondary">Your client decides how much of their guest list you can see and manage for this event.</Dialog.Description></div><Dialog.Close asChild><button type="button" aria-label="Close access details" className="flex size-9 items-center justify-center rounded-lg text-text-secondary hover:bg-background-subtle"><X className="size-5" /></button></Dialog.Close></header>
      <div className="overflow-y-auto px-6 py-5">
        <div className="overflow-hidden rounded-xl border border-border-subtle">
          <table className="w-full text-left text-sm"><thead className="bg-[#f7f8f8] text-text-secondary"><tr><th className="px-4 py-3 font-medium">Capability</th>{([1, 2, 3] as const).map((item) => <th key={item} className={cn("w-16 px-3 py-3 text-center font-semibold", item === level && "bg-[#edf5ef] text-brand-primary")}>L{item}</th>)}</tr></thead><tbody className="divide-y divide-border-subtle">{permissions.map(([label, capability]) => <tr key={capability}><th scope="row" className="px-4 py-3 font-medium text-text-primary">{label}</th>{([1, 2, 3] as const).map((item) => <td key={item} className={cn("px-3 py-3 text-center", item === level && "bg-[#f7fbf8]")}>{guestAccessCapabilities(item)[capability] ? <Check aria-label="Included" className="mx-auto size-4 text-[#198754]" /> : <span aria-label="Not included" className="text-text-disabled">—</span>}</td>)}</tr>)}</tbody></table>
        </div>
        <p className="mt-4 text-sm text-text-secondary">Only the client can approve, change or revoke access. If you need another capability, ask the client to update your level.</p>
      </div>
      <footer className="flex justify-end border-t border-border-subtle px-6 py-4"><Dialog.Close asChild><Button type="button">Got it</Button></Dialog.Close></footer>
    </Dialog.Content></Dialog.Portal></Dialog.Root>
  </>;
}
