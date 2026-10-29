"use client";

import { useState } from "react";
import Link from "next/link";
import * as Dialog from "@radix-ui/react-dialog";
import { Check, Crown, X } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { useCreditBalance } from "@/lib/planner-credits";
import { upgradePlannerEvent } from "@/lib/planner-event-tier";

type Props = {
  eventId: string;
  eventName: string;
  tier?: "standard" | "premium";
  cancelled?: boolean;
  mode?: "chip" | "header" | "locked-slot" | "moodboard-link" | "storage-link";
  slotNumber?: number;
  slotKind?: "proposal" | "questionnaire";
};

export function EventTierChip({ eventId, eventName, tier, cancelled = false, mode = "chip", slotNumber, slotKind = "proposal" }: Props) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const balance = useCreditBalance();
  const eventHref = `/planner/events/${encodeURIComponent(eventId)}`;

  if (tier === "premium") {
    return <span className="inline-flex min-h-7 items-center gap-1 rounded-full border border-[#a97921] bg-[#d6a448] px-2.5 py-1 text-[0.6875rem] font-bold leading-4 text-[#302211] shadow-sm" aria-label="Premium event"><Crown className="size-3.5" weight="fill" aria-hidden="true" />Premium</span>;
  }

  if (cancelled) return <span className="inline-flex min-h-7 items-center rounded-full border border-border-subtle bg-white px-2.5 py-1 text-[0.6875rem] font-semibold leading-4 text-text-secondary">Standard</span>;

  function confirmUpgrade() {
    setSaving(true);
    setError("");
    try {
      upgradePlannerEvent(eventId, eventName);
      setOpen(false);
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : "The upgrade couldn’t be saved. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return <Dialog.Root open={open} onOpenChange={(next) => { setOpen(next); if (!next) setError(""); }}>
    <Dialog.Trigger asChild>{mode === "locked-slot" ? <button type="button" data-questionnaire-slot={slotKind === "questionnaire" ? "locked" : undefined} className={`flex min-w-0 self-start flex-col items-center justify-center rounded-2xl border border-dashed border-[#dfd0aa] bg-linear-to-br from-[#fffaf0] to-white text-center transition-colors hover:border-[#cda351] hover:from-[#fff3d6] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a97921] ${slotKind === "questionnaire" ? "min-h-40 p-4" : "min-h-64 px-5 py-7"}`} aria-label={`View Premium benefits for ${slotKind} slot ${slotNumber}`}><span className={`flex items-center justify-center rounded-xl bg-[#f8e8bc] text-[#896125] ${slotKind === "questionnaire" ? "size-8" : "size-11"}`}><Crown className={slotKind === "questionnaire" ? "size-4" : "size-5"} weight="fill" aria-hidden="true" /></span><span className="mt-3 text-xs font-semibold uppercase tracking-wide text-[#8b672d]">{slotKind === "questionnaire" ? "Questionnaire" : "Proposal"} {String(slotNumber).padStart(2, "0")} · Premium</span><span className="mt-1 text-sm font-medium leading-5 text-text-primary">{slotKind === "questionnaire" ? "More questionnaires with Premium" : "More options for your event with Premium"}</span><span className="mt-2 text-xs font-semibold text-[#79591f] underline underline-offset-2">Explore Premium</span></button> : mode === "moodboard-link" || mode === "storage-link" ? <button type="button" className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-[#ddbc6f] bg-[#f8e6ad] px-3 text-xs font-semibold text-[#674819] shadow-sm transition-colors hover:border-[#c99538] hover:bg-[#f4d88c] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a97921]" aria-label={`Upgrade ${eventName} to Premium ${mode === "storage-link" ? "for 2 GB of storage" : "for 6 mood boards"}`}><Crown className="size-4" weight="fill" aria-hidden="true" />{mode === "storage-link" ? "Upgrade to 2 GB" : "Upgrade for 6"}</button> : <button type="button" className={`inline-flex items-center gap-1 rounded-full border border-[#ddbc6f] bg-[#f8e6ad] font-semibold leading-4 text-[#674819] shadow-sm transition-colors hover:border-[#c99538] hover:bg-[#f4d88c] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a97921] ${mode === "header" ? "min-h-9 px-3 text-xs" : "min-h-7 px-2.5 py-1 text-[0.6875rem]"}`} aria-label={`Upgrade ${eventName} to Premium for 1 credit`}><Crown className="size-3.5" weight="fill" aria-hidden="true" />Standard <span aria-hidden="true">·</span> <span className="underline decoration-current/40 underline-offset-2">Upgrade</span></button>}</Dialog.Trigger>
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-50 bg-[#10231a]/50 backdrop-blur-[2px]" />
      <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-[#e9e2d3] bg-white p-6 shadow-[var(--shadow-lg)] focus:outline-none sm:p-7">
        <div className="flex items-start justify-between gap-3"><span className="flex size-11 items-center justify-center rounded-xl bg-[#fff0c9] text-[#91691f]"><Crown className="size-6" weight="duotone" aria-hidden="true" /></span><Dialog.Close asChild><button type="button" aria-label="Close upgrade details" className="flex size-9 items-center justify-center rounded-full text-text-secondary hover:bg-background-subtle focus-visible:outline-2 focus-visible:outline-brand-primary"><X className="size-4" aria-hidden="true" /></button></Dialog.Close></div>
        <Dialog.Title className="mt-4 text-xl font-semibold tracking-tight">Upgrade this event to Premium</Dialog.Title>
        <Dialog.Description className="mt-2 text-sm leading-6 text-text-secondary">Give {eventName} more room to grow.</Dialog.Description>
        <ul className="mt-5 space-y-2.5 text-sm text-text-primary">
          {["Up to 3 proposals and 3 questionnaires", "Up to 6 mood boards", "2 GB of event file storage", "More guest website design options"].map((benefit) => <li key={benefit} className="flex items-start gap-2.5"><Check className="mt-0.5 size-4 shrink-0 text-brand-primary" aria-hidden="true" />{benefit}</li>)}
        </ul>
        <div className="mt-5 rounded-xl border border-[#eddfbc] bg-[#fffaf0] px-4 py-3 text-sm"><div className="flex justify-between gap-3 font-semibold"><span>Upgrade cost</span><span>1 credit</span></div><p className="mt-1 text-xs text-text-secondary">{balance} {balance === 1 ? "credit" : "credits"} available · Non-refundable · No downgrade</p></div>
        {error && <p role="alert" className="mt-4 rounded-lg bg-error-soft px-3 py-2 text-sm text-error">{error}</p>}
        <div className="mt-6 flex flex-wrap justify-end gap-2"><Dialog.Close asChild><Button type="button" variant="outline">Not now</Button></Dialog.Close>{balance > 0 ? <Button type="button" onClick={confirmUpgrade} loading={saving}>Upgrade for 1 credit</Button> : <Link href={`/planner/credits?tab=buy&returnTo=${encodeURIComponent(eventHref)}`} className="inline-flex min-h-10 items-center justify-center rounded-lg bg-brand-primary bg-[image:var(--action-primary-gradient)] px-4 text-sm font-semibold text-white hover:bg-[image:var(--action-primary-gradient-hover)]">Buy credits</Link>}</div>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}
