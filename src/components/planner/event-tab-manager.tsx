"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { BedDouble, CalendarClock, Crown, Globe2, Shirt, SlidersHorizontal, UsersRound, X } from "@/components/ui/icons";
import { EventTierChip } from "@/components/planner/event-tier-chip";
import type { OptionalWorkspaceSection } from "@/lib/event-workspace-navigation";
import type { PlannerEvent } from "@/lib/planner-events";
import { cn } from "@/lib/utils/cn";

export const optionalEventSections = [
  { id: "guests", label: "Guests", description: "Guest planning and the people coming to the event.", icon: UsersRound, premium: false },
  { id: "agenda", label: "Agenda & timelines", description: "Run of show, timings and team messages.", icon: CalendarClock, premium: false },
  { id: "website", label: "Website", description: "The event’s guest website and designs.", icon: Globe2, premium: true },
  { id: "aso-ebi", label: "Aso ebi", description: "Outfits and family attire.", icon: Shirt, premium: true },
  { id: "accommodation", label: "Accommodation", description: "Hotels and room arrangements.", icon: BedDouble, premium: true },
  { id: "visa-travel", label: "Visa & Travel", description: "Travel plans and guest journeys.", icon: Globe2, premium: true },
  { id: "control-room", label: "Control room", description: "The final check on the event plan.", icon: SlidersHorizontal, premium: true },
] as const satisfies readonly { id: OptionalWorkspaceSection; label: string; description: string; icon: typeof UsersRound; premium: boolean }[];

export function EventTabManager({ event, open, onOpenChange, visibleTabs, onToggle }: {
  event: PlannerEvent;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  visibleTabs: OptionalWorkspaceSection[];
  onToggle: (id: OptionalWorkspaceSection, enabled: boolean) => void;
}) {
  const row = (item: (typeof optionalEventSections)[number]) => {
    const enabled = visibleTabs.includes(item.id);
    const locked = item.premium && event.tier !== "premium";
    return <li key={item.id} className="flex items-center gap-3 border-b border-border-subtle py-3.5 last:border-0">
      <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg", item.premium ? "bg-[#fff3d6] text-[#936923]" : "bg-[#edf4ef] text-brand-primary")}><item.icon className="size-[18px]" aria-hidden="true" /></span>
      <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className="text-sm font-semibold text-text-primary">{item.label}</span>{locked && <span className="inline-flex items-center gap-1 rounded-full border border-[#e6d09b] bg-[#fff6df] px-1.5 py-0.5 text-[0.625rem] font-semibold text-[#805a21]"><Crown className="size-3" weight="fill" aria-hidden="true" />Premium</span>}</div><p className="mt-0.5 text-xs leading-4 text-text-secondary">{item.description}</p></div>
      {locked ? <EventTierChip eventId={event.id} eventName={event.name} tier={event.tier} cancelled={Boolean(event.cancelledAt)} mode="tab-toggle" tabLabel={item.label} onUpgraded={() => onToggle(item.id, true)} /> : <button type="button" role="switch" aria-checked={enabled} aria-label={`${enabled ? "Remove" : "Add"} ${item.label} tab`} onClick={() => onToggle(item.id, !enabled)} className={cn("relative h-6 w-11 shrink-0 rounded-full border transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary", enabled ? "border-brand-primary bg-brand-primary" : "border-[#cdd7d0] bg-[#e7ebe8]")}><span className={cn("absolute top-0.5 size-[18px] rounded-full bg-white shadow-sm transition-transform", enabled ? "left-0.5 translate-x-5" : "left-0.5")} /></button>}
    </li>;
  };

  return <Dialog.Root open={open} onOpenChange={onOpenChange}><Dialog.Portal>
    <Dialog.Overlay className="fixed inset-0 z-40 bg-[#10231a]/45 backdrop-blur-[2px]" />
    <Dialog.Content className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col overflow-hidden border-l border-border-subtle bg-white shadow-[var(--shadow-lg)] focus:outline-none">
      <header className="flex items-start justify-between gap-4 border-b border-border-subtle px-5 py-5 sm:px-6"><div><Dialog.Title className="text-lg font-semibold tracking-tight">Add to this event</Dialog.Title><Dialog.Description className="mt-1 text-xs leading-5 text-text-secondary">Choose the tabs you need. Removing a tab never deletes its contents.</Dialog.Description></div><Dialog.Close asChild><button type="button" aria-label="Close tab options" className="flex size-9 shrink-0 items-center justify-center rounded-lg text-text-secondary hover:bg-background-subtle"><X className="size-4" aria-hidden="true" /></button></Dialog.Close></header>
      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6"><section><h2 className="text-xs font-semibold uppercase tracking-[0.08em] text-text-tertiary">Included</h2><ul className="mt-1">{optionalEventSections.filter((item) => !item.premium).map(row)}</ul></section><section className="mt-7"><h2 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-[#8c672b]"><Crown className="size-3.5" weight="fill" aria-hidden="true" />Premium{event.tier === "premium" && <span className="normal-case tracking-normal text-brand-primary">· Unlocked</span>}</h2><ul className="mt-1">{optionalEventSections.filter((item) => item.premium).map(row)}</ul></section></div>
    </Dialog.Content>
  </Dialog.Portal></Dialog.Root>;
}
