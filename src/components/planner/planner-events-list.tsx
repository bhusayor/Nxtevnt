"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Ban, CalendarDays, CircleCheck, ClipboardList, LayoutGrid, List, Plus, Search, Wallet } from "@/components/ui/icons";

import { EventCalendar } from "@/components/planner/event-calendar";
import { EventListView } from "@/components/planner/event-list-view";
import { asDashboardEvent, DashboardEventCard } from "@/components/planner/upcoming-events";
import { Button, buttonVariants } from "@/components/ui/button";
import { SearchInput } from "@/components/ui/search-input";
import { isEventCancelled, useBrowserReady, usePlannerEvents } from "@/lib/planner-events";
import { cn } from "@/lib/utils/cn";

type EventTab = "all" | "completed" | "upcoming" | "cancelled";
type EventView = "cards" | "calendar" | "list";

function FirstEventEmptyState() {
  return <section className="grid overflow-hidden rounded-[1.5rem] border border-[#dce8df] bg-gradient-to-br from-[#f1f7f2] via-white to-[#fbf6ee] shadow-[0_18px_48px_-40px_rgba(24,45,34,.36)] md:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
    <div className="flex min-w-0 flex-col justify-between px-6 py-9 sm:px-9 sm:py-11"><div><span className="inline-flex rounded-full border border-[#d9e9dc] bg-white/80 px-3 py-1.5 text-[0.6875rem] font-semibold text-brand-primary">Your starting point</span><h3 className="mt-5 max-w-lg text-[1.75rem] font-semibold leading-[1.16] tracking-[-0.045em] sm:text-[2.25rem]">Make space for your next moment.</h3><p className="mt-3 max-w-md text-sm leading-6 text-text-secondary">Create an event with the essentials. Its notes, budget, tasks and files will have a home from day one.</p><Link href="/planner/create-event" className={cn(buttonVariants({ size: "md" }), "mt-6 inline-flex w-fit items-center gap-2")}><Plus className="size-4" aria-hidden="true" />Create your first event</Link><p className="mt-3 text-xs text-text-tertiary">Just a name, event type and date to begin.</p></div><div className="mt-9 grid gap-3 border-t border-[#dce8df] pt-5 sm:grid-cols-3">{[{ icon: CalendarDays, title: "Create", detail: "Add the essentials" }, { icon: ClipboardList, title: "Plan", detail: "Keep details together" }, { icon: Wallet, title: "Track", detail: "Stay on top of costs" }].map((step) => { const Icon = step.icon; return <div key={step.title} className="flex items-start gap-2"><span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white text-brand-primary"><Icon className="size-4" aria-hidden="true" /></span><span><span className="block text-xs font-semibold">{step.title}</span><span className="mt-0.5 block text-[0.6875rem] text-text-secondary">{step.detail}</span></span></div>; })}</div></div>
    <div className="relative hidden min-h-[410px] overflow-hidden bg-[#293f33] md:block"><Image src="/images/auth/nigerian-wedding-party.jpg" alt="Friends celebrating together at an event" fill priority sizes="(min-width: 768px) 40vw, 100vw" className="object-cover" /><span className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" /><p className="absolute bottom-5 left-5 right-5 rounded-xl border border-white/25 bg-white/15 px-4 py-3 text-sm font-medium text-white backdrop-blur-md">Great events begin with one clear place to plan.</p></div>
  </section>;
}

function TabEmptyState({ tab, hasEvents, onViewAll }: { tab: Exclude<EventTab, "all">; hasEvents: boolean; onViewAll: () => void }) {
  const completed = tab === "completed";
  const cancelled = tab === "cancelled";
  const Icon = completed ? CircleCheck : cancelled ? Ban : CalendarDays;
  return <section className="relative overflow-hidden rounded-[1.5rem] border border-border-subtle bg-white px-6 py-14 text-center sm:px-10 sm:py-16"><span className={cn("mx-auto flex size-14 items-center justify-center rounded-2xl", completed ? "bg-[#fbf1e4] text-[#967047]" : cancelled ? "bg-[#fcf2f2] text-[#a34c4c]" : "bg-[#eaf3ed] text-brand-primary")}><Icon className="size-7" weight="regular" aria-hidden="true" /></span><p className="mt-6 text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-text-tertiary">{completed ? "Completed events" : cancelled ? "Cancelled events" : "Upcoming events"}</p><h3 className="mt-2 text-xl font-semibold tracking-tight">{completed ? "No completed events yet" : cancelled ? "No cancelled events" : "Nothing on the horizon yet"}</h3><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-text-secondary">{completed ? "Events appear here once their date has passed. For now, keep planning what’s next." : cancelled ? "If plans change, you can cancel an event without losing its details. It will live here and can be reopened." : "Your upcoming events will gather here as soon as you create one."}</p><div className="mt-6 flex flex-wrap justify-center gap-2">{hasEvents && <Button type="button" size="md" variant="outline" onClick={onViewAll}>View all events</Button>}{!completed && !cancelled && <Link href="/planner/create-event" className={cn(buttonVariants({ size: "md" }), "inline-flex items-center gap-2")}><Plus className="size-4" aria-hidden="true" />Create event</Link>}{(completed || cancelled) && !hasEvents && <Link href="/planner/create-event" className={cn(buttonVariants({ size: "md" }), "inline-flex items-center gap-2")}><Plus className="size-4" aria-hidden="true" />Create your first event</Link>}</div></section>;
}

export function PlannerEventsList() {
  const events = usePlannerEvents();
  const ready = useBrowserReady();
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<EventTab>("all");
  const [view, setView] = useState<EventView>("cards");
  const today = new Date().toLocaleDateString("sv-SE");
  const sorted = useMemo(() => [...events].sort((first, second) => first.date.localeCompare(second.date)), [events]);
  const upcoming = sorted.filter((event) => !isEventCancelled(event) && event.date >= today);
  const completed = sorted.filter((event) => !isEventCancelled(event) && event.date < today).reverse();
  const cancelled = sorted.filter(isEventCancelled).reverse();
  const selected = tab === "upcoming" ? upcoming : tab === "completed" ? completed : tab === "cancelled" ? cancelled : sorted;
  const search = query.trim().toLowerCase();
  const priorityOrder = { high: 0, standard: 1, low: 2 };
  const filtered = selected.filter((event) => `${event.name} ${event.type} ${event.location} ${event.clientName}`.toLowerCase().includes(search)).sort((first, second) => (priorityOrder[first.priority ?? "standard"] - priorityOrder[second.priority ?? "standard"]) || first.date.localeCompare(second.date));
  const calendarFocusDate = tab === "completed" ? filtered[0]?.date : tab === "upcoming" ? filtered[0]?.date : upcoming[0]?.date ?? filtered.at(-1)?.date;
  const tabs = [{ id: "all" as const, label: "All events", count: events.length }, { id: "upcoming" as const, label: "Upcoming", count: upcoming.length }, { id: "completed" as const, label: "Completed", count: completed.length }, { id: "cancelled" as const, label: "Cancelled", count: cancelled.length }];
  const views = [{ id: "cards" as const, label: "Cards view", icon: LayoutGrid }, { id: "calendar" as const, label: "Calendar view", icon: CalendarDays }, { id: "list" as const, label: "List view", icon: List }];

  return <div className="@container/events w-full min-w-0 space-y-7">
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><h1 className="text-[1.75rem] font-semibold tracking-[-0.04em] sm:text-[2rem]">Events</h1><p className="mt-1 text-sm text-text-secondary">Every celebration, from first idea to final detail.</p></div>{events.length > 0 && <Link href="/planner/create-event" className={buttonVariants({ size: "md" })}><Plus className="size-4" aria-hidden="true" />Create event</Link>}</header>

    {!ready ? <div className="h-80 animate-pulse rounded-xl bg-white" aria-label="Loading events" /> : <>
      <section className="space-y-5" aria-label="Browse events">
        <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-3 border-b border-border-subtle"><div role="tablist" aria-label="Event status" className="flex max-w-full gap-5 overflow-x-auto">{tabs.map((entry) => <button key={entry.id} id={`events-tab-${entry.id}`} role="tab" type="button" aria-selected={tab === entry.id} aria-controls="events-tab-panel" onClick={() => setTab(entry.id)} className={cn("flex min-h-11 shrink-0 items-center gap-2 whitespace-nowrap border-b-2 text-xs font-semibold transition-colors", tab === entry.id ? "border-brand-primary text-brand-primary" : "border-transparent text-text-secondary hover:text-text-primary")}>{entry.label}<span className={cn("flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-[0.625rem]", tab === entry.id ? "bg-[#eaf3ed] text-brand-primary" : "bg-[#f1f3f1] text-text-tertiary")}>{entry.count}</span></button>)}</div><p className="pb-3 text-xs text-text-tertiary">{selected.length} {selected.length === 1 ? "event" : "events"}</p></div>
        <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-base font-semibold">{tabs.find((entry) => entry.id === tab)?.label}</h2><p className="mt-1 text-xs text-text-secondary">{tab === "completed" ? "Events whose dates have passed." : tab === "upcoming" ? "Today’s events and everything coming next." : tab === "cancelled" ? "Cancelled plans, kept for your records." : "Every event in your workspace."}</p></div><div className="flex w-full flex-wrap items-center gap-2 sm:w-auto"><div className="min-w-0 flex-1 sm:w-60 sm:flex-none"><SearchInput aria-label="Search events" placeholder="Search events" value={query} onChange={(event) => setQuery(event.target.value)} onClear={() => setQuery("")} /></div><div role="group" aria-label="Event view" className="flex shrink-0 rounded-lg border border-border-subtle bg-white p-1">{views.map((entry) => { const Icon = entry.icon; return <button key={entry.id} type="button" onClick={() => setView(entry.id)} aria-label={entry.label} title={entry.label} aria-pressed={view === entry.id} className={cn("flex size-11 items-center justify-center rounded-md transition-colors focus-visible:outline-2 focus-visible:outline-brand-primary", view === entry.id ? "bg-brand-primary text-white" : "text-text-secondary hover:bg-background-subtle")}><Icon className="size-[18px]" weight="bold" aria-hidden="true" /></button>; })}</div></div></div>
        <div id="events-tab-panel" role="tabpanel" aria-labelledby={`events-tab-${tab}`}>
          {selected.length === 0 ? tab === "all" ? <FirstEventEmptyState /> : <TabEmptyState tab={tab} hasEvents={events.length > 0} onViewAll={() => setTab("all")} /> : filtered.length === 0 ? <div className="rounded-xl border border-border-subtle bg-white px-6 py-14 text-center"><Search className="mx-auto size-6 text-text-tertiary" aria-hidden="true" /><h3 className="mt-3 text-base font-semibold">No matching events</h3><p className="mt-1 text-sm text-text-secondary">Try another name, type, client or location.</p><button type="button" onClick={() => setQuery("")} className="mt-4 inline-flex min-h-10 items-center gap-1 text-sm font-semibold text-brand-primary hover:underline">Clear search <ArrowRight className="size-4" aria-hidden="true" /></button></div> : view === "calendar" ? <EventCalendar key={`${tab}-${calendarFocusDate}`} events={filtered} focusDate={calendarFocusDate} /> : view === "list" ? <EventListView events={filtered} today={today} /> : <div className={cn("grid gap-5", filtered.length > 1 && "@min-[640px]/events:grid-cols-2", filtered.length > 2 && "@min-[1020px]/events:grid-cols-3")}>{filtered.map((event) => <DashboardEventCard key={event.id} event={asDashboardEvent(event)} featured={filtered.length === 1} featuredLabel="Your event" />)}</div>}
        </div>
      </section>
    </>}

  </div>;
}
