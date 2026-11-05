"use client";

import { Crown } from "@/components/ui/icons";
import { optionalEventSections } from "@/components/planner/event-tab-manager";
import type { OptionalWorkspaceSection } from "@/lib/event-workspace-navigation";

export function EventFeatureSpace({ section }: { section: Exclude<OptionalWorkspaceSection, "guests" | "agenda" | "control-room"> }) {
  const feature = optionalEventSections.find((item) => item.id === section)!;
  return <section className="rounded-2xl border border-border-subtle bg-white p-6 sm:p-8">
    <span className="flex size-11 items-center justify-center rounded-xl bg-[#fff4dc] text-[#91691f]"><feature.icon className="size-5" aria-hidden="true" /></span>
    <div className="mt-5 flex flex-wrap items-center gap-2"><h2 className="text-xl font-semibold tracking-tight">{feature.label}</h2><span className="inline-flex items-center gap-1 rounded-full border border-[#e6d09b] bg-[#fff6df] px-2 py-1 text-xs font-semibold text-[#805a21]"><Crown className="size-3.5" weight="fill" aria-hidden="true" />Premium</span></div>
    <p className="mt-2 max-w-xl text-sm leading-6 text-text-secondary">{feature.description}</p>
    <div className="mt-6 rounded-xl border border-dashed border-border-subtle bg-[#fbfcfb] px-5 py-10 text-center"><p className="text-sm font-semibold">Nothing here yet</p><p className="mt-1 text-xs leading-5 text-text-secondary">This tab stays in your event navigation until you remove it. Removing it will not delete any event information.</p></div>
  </section>;
}
