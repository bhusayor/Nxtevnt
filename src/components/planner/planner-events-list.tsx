"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CalendarDays, Plus, Search } from "lucide-react";

import { asDashboardEvent, DashboardEventCard } from "@/components/planner/upcoming-events";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useBrowserReady, usePlannerEvents } from "@/lib/planner-events";
import { cn } from "@/lib/utils/cn";

export function PlannerEventsList() {
  const events = usePlannerEvents();
  const ready = useBrowserReady();
  const [query, setQuery] = useState("");
  const sorted = useMemo(() => [...events].sort((first, second) => first.date.localeCompare(second.date)), [events]);
  const filtered = sorted.filter((event) => `${event.name} ${event.type} ${event.location}`.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="@container/events w-full min-w-0 space-y-7">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="mb-2 text-[0.6875rem] font-bold uppercase tracking-[0.14em] text-brand-primary">Planner workspace</p><h1 className="text-[1.75rem] font-semibold tracking-[-0.04em] sm:text-[2rem]">Your events</h1><p className="mt-2 text-sm text-text-secondary">A home for every moment you&apos;re planning.</p></div><Link href="/planner/create-event" className={buttonVariants({ size: "md" })}><Plus className="size-4" aria-hidden="true" />Create event</Link></header>

      {!ready ? <div className="h-80 animate-pulse rounded-xl bg-white" aria-label="Loading events" /> : events.length === 0 ? (
        <section className="grid overflow-hidden rounded-[1.25rem] border border-border-subtle bg-white shadow-[0_14px_35px_-32px_rgba(24,45,34,.35)] md:grid-cols-[43%_57%]">
          <div className="relative h-56 md:h-[380px]"><Image src="/images/auth/nigerian-wedding-party.jpg" alt="Friends celebrating together at an event" fill priority sizes="(min-width: 768px) 40vw, 100vw" className="object-cover" /><span className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent" /></div>
          <div className="flex flex-col justify-center p-6 sm:p-9"><span className="flex size-11 items-center justify-center rounded-xl bg-[#eaf3ed] text-brand-primary"><CalendarDays className="size-5" aria-hidden="true" /></span><h2 className="mt-5 text-2xl font-semibold tracking-tight">No events yet</h2><p className="mt-2 max-w-md text-sm leading-6 text-text-secondary">Create an event to give its budget, tasks, notes, schedule and files a place to live.</p><Link href="/planner/create-event" className={cn(buttonVariants({ size: "md" }), "mt-6 w-fit")}><Plus className="size-4" aria-hidden="true" />Create your first event</Link><p className="mt-4 text-xs text-text-tertiary">You only need a name, type and date to get started.</p></div>
        </section>
      ) : (
        <>
          <div className="flex flex-col gap-4 rounded-xl border border-[#e1eae3] bg-[#eff5f0] p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"><div><p className="text-sm font-semibold text-text-primary">{events.length} {events.length === 1 ? "event" : "events"} in your workspace</p><p className="mt-1 text-xs text-text-secondary">Each event has its own planning space.</p></div><div className="w-full sm:w-64"><Input aria-label="Search events" placeholder="Search your events" value={query} onChange={(event) => setQuery(event.target.value)} /></div></div>
          {filtered.length ? <div className={cn("grid gap-5", filtered.length > 1 && "@min-[640px]/events:grid-cols-2", filtered.length > 2 && "@min-[1020px]/events:grid-cols-3")}>{filtered.map((event) => <DashboardEventCard key={event.id} event={asDashboardEvent(event)} featured={filtered.length === 1} featuredLabel="Your event" />)}</div> : <div className="rounded-xl border border-border-subtle bg-white px-6 py-14 text-center"><Search className="mx-auto size-6 text-text-tertiary" aria-hidden="true" /><h2 className="mt-3 text-base font-semibold">No matching events</h2><p className="mt-1 text-sm text-text-secondary">Try another name, type or location.</p><button type="button" onClick={() => setQuery("")} className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-primary hover:underline">Clear search <ArrowRight className="size-4" aria-hidden="true" /></button></div>}
        </>
      )}
    </div>
  );
}
