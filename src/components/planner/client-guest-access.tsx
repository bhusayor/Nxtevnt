"use client";

import { useState } from "react";
import { Check, ShieldCheck } from "@/components/ui/icons";
import { guestWorkspaceData, type GuestAccessLevel } from "@/lib/event-guests";
import { updatePlannerEvent, useBrowserReady, usePlannerEvents } from "@/lib/planner-events";
import { cn } from "@/lib/utils/cn";

const levels: { level: GuestAccessLevel; name: string; detail: string; permissions: string[] }[] = [
  { level: 1, name: "Names only", detail: "The planner can see who is invited, but no private contact or response details.", permissions: ["View guest names"] },
  { level: 2, name: "Planning access", detail: "Useful when the planner handles RSVP structure and seating without private contact details.", permissions: ["View names and RSVP status", "View answers and edit questions", "Manage seating"] },
  { level: 3, name: "Full control", detail: "Best when the planner manages your guest list and all communication for you.", permissions: ["Add and manage guests", "View contact details", "Send invitations and messages"] },
];

export function ClientGuestAccess() {
  const events = usePlannerEvents();
  const ready = useBrowserReady();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  if (!ready || !events.length) return null;

  function setLevel(eventId: string, level: GuestAccessLevel) {
    try {
      updatePlannerEvent(eventId, (event) => ({ ...event, guestWorkspace: { ...guestWorkspaceData(event.guestWorkspace), clientAccessLevel: level } }));
      setError(""); setMessage(`Planner access updated to Level ${level}.`);
    } catch { setMessage(""); setError("Access could not be updated in this browser. Please try again."); }
  }

  return <section className="mx-auto mb-8 w-full max-w-6xl space-y-4">
    <header><p className="text-[0.625rem] font-semibold uppercase tracking-wider text-brand-primary">Client preview · Guest privacy</p><h2 className="mt-1 text-xl font-semibold">Planner access to your guest list</h2><p className="mt-1 text-xs leading-5 text-text-secondary">You decide what your planner can see and do. Changes apply immediately to the planner’s guest workspace in this browser.</p></header>
    <div className="space-y-3">{events.map((event) => { const current = guestWorkspaceData(event.guestWorkspace).clientAccessLevel ?? 3; return <article key={event.id} className="rounded-2xl border border-border-subtle bg-white p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div className="flex items-start gap-3"><span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#edf4ee] text-brand-primary"><ShieldCheck className="size-5" /></span><div><h3 className="text-sm font-semibold">{event.name}</h3><p className="mt-1 text-xs text-text-secondary">Current access: Level {current} · {levels[current - 1].name}</p></div></div><span className="rounded-full bg-[#fff7e7] px-3 py-1 text-xs font-semibold text-[#a75b00]">Client controlled</span></div><div className="mt-5 grid gap-3 md:grid-cols-3">{levels.map((option) => { const selected = current === option.level; return <button key={option.level} type="button" aria-pressed={selected} onClick={() => setLevel(event.id, option.level)} className={cn("rounded-xl border p-4 text-left transition-[border-color,background-color,box-shadow]", selected ? "border-[#77aa86] bg-[#f2faf4] shadow-sm" : "border-border-subtle hover:border-[#b6ccb9] hover:bg-[#fbfdfb]")}><span className="flex items-center justify-between gap-2"><strong className="text-sm">Level {option.level} · {option.name}</strong>{selected && <Check className="size-4 text-[#198754]" />}</span><span className="mt-2 block text-xs leading-5 text-text-secondary">{option.detail}</span><span className="mt-3 block space-y-1.5">{option.permissions.map((permission) => <span key={permission} className="flex items-start gap-1.5 text-[11px] text-text-secondary"><Check className="mt-0.5 size-3 shrink-0 text-[#198754]" />{permission}</span>)}</span></button>; })}</div></article>; })}</div>
    {message && <p role="status" className="rounded-lg bg-success-soft px-3 py-2 text-xs text-success">{message}</p>}{error && <p role="alert" className="rounded-lg bg-error-soft px-3 py-2 text-xs text-error">{error}</p>}
    <p className="rounded-lg border border-[#dce7f4] bg-[#f0f6fc] px-4 py-3 text-xs leading-5 text-[#526f8d]">Local preview: authenticated client accounts are not connected yet. This control demonstrates the permission handoff in the shared browser data.</p>
  </section>;
}
