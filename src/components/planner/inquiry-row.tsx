"use client";

import { ArrowUpRight, CalendarDays, MapPin } from "@/components/ui/icons";
import type { PlannerInquiry } from "@/lib/planner-business";
import { inquiryFacts } from "@/lib/inquiry-details";

export function InquiryRow({ inquiry, onOpen }: { inquiry: PlannerInquiry; onOpen: () => void }) {
  const facts = inquiryFacts(inquiry);
  const initials = inquiry.name.trim().split(/\s+/).slice(0, 2).map(n => n[0]).join("").toUpperCase();
  return <article className="grid min-h-24 w-full grid-cols-[2.25rem_minmax(0,1fr)] items-start gap-x-3 rounded-xl px-3 py-4 text-left">
    <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-[#eaf1ed] text-xs font-semibold text-brand-primary" aria-hidden="true">{initials}</span>
    <div className="min-w-0 space-y-1.5"><div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1"><div className="flex flex-wrap items-center gap-x-2 gap-y-1"><span className="text-sm font-semibold">{inquiry.name}</span><span className="rounded-md bg-[#f0f5f2] px-2 py-0.5 text-xs font-medium text-brand-primary">{facts.eventType}</span></div><button type="button" onClick={onOpen} aria-label={`View and respond to inquiry: ${inquiry.name} — ${inquiry.subject}`} className="ml-auto inline-flex min-h-8 items-center gap-1 whitespace-nowrap text-sm font-semibold text-brand-primary underline decoration-brand-primary/30 underline-offset-4 hover:decoration-brand-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary">View and respond<ArrowUpRight className="size-4" aria-hidden="true" /></button></div>
      <p className="truncate text-sm leading-5 text-text-secondary" title={inquiry.subject}>{inquiry.subject}</p>
      <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs leading-5 text-text-secondary">{[{ icon: CalendarDays, label: "Preferred event date", value: facts.eventDate }, { icon: MapPin, label: "Location", value: facts.location }].map(({ icon: Icon, label, value }) => <span key={label} className="inline-flex min-w-0 items-center gap-1.5" title={`${label}: ${value}`}><Icon className="size-3.5 shrink-0 text-text-tertiary" aria-hidden="true" /><span className="truncate"><span className="sr-only">{label}: </span>{value}</span></span>)}</div>
    </div>
  </article>;
}
