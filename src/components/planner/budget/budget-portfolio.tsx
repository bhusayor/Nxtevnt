"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Download, FolderOpen, Plus, ReceiptText, Search, Upload, Wallet } from "@/components/ui/icons";

import { BudgetNativeSelect } from "@/components/planner/budget/budget-controls";
import { BookingsTable, BudgetSummary, UpcomingPayments } from "@/components/planner/budget/budget-sections";
import { ImportBudgetDialog } from "@/components/planner/budget/import-budget-dialog";
import { WorkSnapshot } from "@/components/planner/work-snapshot";
import { Button, buttonVariants } from "@/components/ui/button";
import { SearchInput } from "@/components/ui/search-input";
import { downloadBudgetCsv } from "@/lib/budget-export";
import { eventCovers, formatEventDate, isCustomCover, useBrowserReady, usePlannerEvents, type PlannerEvent } from "@/lib/planner-events";
import { budgetContext, currencies, formatBudgetMoney, itemBalance, useBudgetStore, type BudgetItem } from "@/lib/planner-budget";
import { cn } from "@/lib/utils/cn";

type PortfolioTab = "events" | "payments" | "bookings";

function BudgetEmptyHero({ event }: { event?: PlannerEvent }) {
  const href = event ? `/planner/events/${event.id}?section=budget` : "/planner/create-event";
  return <section className="grid overflow-hidden rounded-[1.5rem] border border-[#dce8df] bg-gradient-to-br from-[#f0f7f2] via-white to-[#fbf5ec] shadow-[0_18px_48px_-40px_rgba(24,45,34,.36)] md:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
    <div className="flex min-w-0 flex-col justify-between px-6 py-9 sm:px-9 sm:py-11"><div><span className="inline-flex rounded-full border border-[#d9e9dc] bg-white/80 px-3 py-1.5 text-xs font-semibold text-brand-primary">{event ? "Ready when you are" : "Start here"}</span><h2 className="mt-5 max-w-lg text-[1.75rem] font-semibold leading-[1.16] tracking-[-0.045em] sm:text-[2.25rem]">{event ? "Give your events a clear financial plan." : "Every great budget begins with an event."}</h2><p className="mt-3 max-w-md text-sm leading-6 text-text-secondary">{event ? "Choose an event, add your first budget group, then record costs as plans take shape. The totals here will update automatically." : "Create an event first. You can then organise costs, invoices and payments in its own budget, while this page keeps the full picture in view."}</p><Link href={href} className={cn(buttonVariants({ size: "md" }), "mt-6 inline-flex w-fit items-center gap-2")}>{event ? "Start an event budget" : "Create your first event"}<ArrowRight className="size-4" aria-hidden="true" /></Link><p className="mt-3 text-sm text-text-tertiary">{event ? `Start with ${event.name}, or choose another event below.` : "A name, type and date are enough to begin."}</p></div><div className="mt-9 grid gap-3 border-t border-[#dce8df] pt-5 sm:grid-cols-3">{[{ icon: FolderOpen, title: "Organise", detail: "Group your costs" }, { icon: ReceiptText, title: "Record", detail: "Add invoices & files" }, { icon: Wallet, title: "Stay clear", detail: "Track what’s paid" }].map((step) => { const Icon = step.icon; return <div key={step.title} className="flex items-start gap-2"><span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white text-brand-primary"><Icon className="size-4" aria-hidden="true" /></span><span><span className="block text-sm font-semibold">{step.title}</span><span className="mt-0.5 block text-xs text-text-secondary">{step.detail}</span></span></div>; })}</div></div>
    <div className="relative hidden min-h-[410px] overflow-hidden bg-[#514237] md:block"><Image src="/images/auth/wedding-reception.jpg" alt="A thoughtfully prepared event reception" fill sizes="(min-width: 768px) 40vw, 100vw" className="object-cover" /><span className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" /><div className="absolute bottom-5 left-5 right-5 rounded-xl border border-white/25 bg-white/15 px-4 py-3 text-white backdrop-blur-md"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-white/80">A better view of every detail</p><p className="mt-1 text-sm font-medium">From the first estimate to the final payment.</p></div></div>
  </section>;
}

function EventBudgetRow({ event, items, currency, compact = false }: { event: PlannerEvent; items: BudgetItem[]; currency: string; compact?: boolean }) {
  const budgeted = items.reduce((sum, item) => sum + item.budgeted, 0);
  const invoiced = items.reduce((sum, item) => sum + item.invoiced, 0);
  const paid = items.reduce((sum, item) => sum + item.paid, 0);
  const balance = items.reduce((sum, item) => sum + itemBalance(item), 0);
  const clientBudget = currency === "NGN" ? Number(event.budget) || 0 : 0;
  const progress = clientBudget > 0 ? Math.min(100, Math.round(budgeted / clientBudget * 100)) : 0;
  const href = `/planner/events/${event.id}?section=budget`;
  const image = event.image || eventCovers[0].src;

  if (compact) return <article className="rounded-xl border border-border-subtle bg-white p-3 shadow-[var(--shadow-sm)]">
    <Link href={href} className="flex items-center gap-3 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary">
      <span className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-[#e8eee9]"><Image src={image} alt="" fill unoptimized={isCustomCover(image)} sizes="56px" className="object-cover" /></span>
      <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-text-primary">{event.name}</span><span className="mt-0.5 block text-sm text-text-secondary">{formatEventDate(event.date, { day: "numeric", month: "short", year: "numeric" })} · {event.type}</span></span>
      <ArrowRight className="size-4 shrink-0 text-brand-primary" aria-hidden="true" />
    </Link>
    <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-border-subtle pt-3 text-sm"><div><p className="text-text-tertiary">Budgeted</p><p className="mt-1 font-semibold tabular-nums">{formatBudgetMoney(budgeted, currency)}</p></div><div><p className="text-text-tertiary">Invoiced</p><p className="mt-1 font-semibold tabular-nums">{formatBudgetMoney(invoiced, currency)}</p></div><div><p className="text-text-tertiary">Paid</p><p className="mt-1 font-semibold tabular-nums">{formatBudgetMoney(paid, currency)}</p></div><div><p className="text-text-tertiary">Balance left</p><p className="mt-1 font-semibold tabular-nums">{formatBudgetMoney(balance, currency)}</p></div></div>
    <div className="mt-3 flex items-center justify-between border-t border-border-subtle pt-3 text-xs"><span className="text-text-tertiary">{items.length ? `${items.length} budget ${items.length === 1 ? "item" : "items"}` : "No budget items yet"}</span><Link href={href} className="inline-flex items-center gap-1 font-semibold text-brand-primary">{items.length ? "Open budget" : "Start budget"}<ArrowRight className="size-3" aria-hidden="true" /></Link></div>
  </article>;

  return <tr className="group border-t border-border-subtle transition-colors hover:bg-[#fbfcfb]">
    <td className="px-5 py-3.5"><Link href={href} className="flex min-w-0 items-center gap-3 focus-visible:rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary"><span className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-[#e8eee9]"><Image src={image} alt="" fill unoptimized={isCustomCover(image)} sizes="56px" className="object-cover transition-transform duration-300 group-hover:scale-105" /></span><span className="min-w-0"><span className="block max-w-52 truncate text-sm font-semibold text-text-primary group-hover:text-brand-primary" title={event.name}>{event.name}</span><span className="mt-0.5 block text-xs text-text-tertiary">{event.type} · {formatEventDate(event.date, { day: "numeric", month: "short", year: "numeric" })}</span></span></Link></td>
    <td className="px-4 py-3.5"><span className="block whitespace-nowrap text-sm font-semibold tabular-nums">{clientBudget ? formatBudgetMoney(clientBudget, currency) : "—"}</span>{clientBudget > 0 && <span className="mt-2 block h-1.5 w-24 overflow-hidden rounded-full bg-[#e9eeea]"><span className={cn("block h-full rounded-full", budgeted > clientBudget ? "bg-[#d09368]" : "bg-brand-primary")} style={{ width: `${progress}%` }} /></span>}</td>
    <td className="whitespace-nowrap px-4 py-3.5 text-right text-sm font-semibold tabular-nums">{formatBudgetMoney(budgeted, currency)}</td>
    <td className="whitespace-nowrap px-4 py-3.5 text-right text-sm tabular-nums">{formatBudgetMoney(invoiced, currency)}</td>
    <td className="whitespace-nowrap px-4 py-3.5 text-right text-sm tabular-nums">{formatBudgetMoney(paid, currency)}</td>
    <td className="whitespace-nowrap px-4 py-3.5 text-right text-sm font-semibold tabular-nums">{formatBudgetMoney(balance, currency)}</td>
    <td className="px-4 py-3.5 text-right"><Link href={href} className="inline-flex min-h-9 items-center gap-1 whitespace-nowrap rounded-md px-2 text-sm font-semibold text-brand-primary hover:bg-[#eaf3ed]">{items.length ? "Open" : "Start"}<ArrowRight className="size-3.5" aria-hidden="true" /></Link></td>
  </tr>;
}

export function BudgetPortfolio({ initialTab = "events" }: { initialTab?: PortfolioTab } = {}) {
  const router = useRouter();
  const events = usePlannerEvents();
  const store = useBudgetStore();
  const ready = useBrowserReady();
  const [currency, setCurrency] = useState("NGN");
  const [tab, setTab] = useState<PortfolioTab>(initialTab);
  const [search, setSearch] = useState("");
  const [importOpen, setImportOpen] = useState(false);
  const [message, setMessage] = useState("");

  if (!ready) return <div className="h-80 animate-pulse rounded-xl bg-white" aria-label="Loading budgets" />;

  const { groups, items } = budgetContext(events, store, null, currency);
  const eventIds = new Set(events.map((event) => event.id));
  const eventGroups = groups.filter((group) => group.eventId && eventIds.has(group.eventId));
  const eventGroupIds = new Set(eventGroups.map((group) => group.id));
  const eventItems = items.filter((item) => eventGroupIds.has(item.groupId));
  const hasAnyBudgetItems = store.items.some((item) => Boolean(item.eventId && eventIds.has(item.eventId))) || events.some((event) => event.sections.expenses.length > 0);
  const unassignedGroups = store.groups.filter((group) => !group.eventId || !eventIds.has(group.eventId));
  const unassignedGroupIds = new Set(unassignedGroups.map((group) => group.id));
  const unassignedItems = store.items.filter((item) => unassignedGroupIds.has(item.groupId));
  const query = search.trim().toLowerCase();
  const visibleEvents = events.filter((event) => `${event.name} ${event.type} ${event.clientName} ${event.location}`.toLowerCase().includes(query));
  const eventItemsById = new Map(events.map((event) => [event.id, eventItems.filter((item) => item.eventId === event.id)]));
  const clientBudget = currency === "NGN" ? events.reduce((sum, event) => sum + (Number(event.budget) || 0), 0) || null : null;

  return <div className="w-full min-w-0 space-y-6">
    <header className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.12em] text-brand-primary">Across your workspace</p><h1 className="mt-1 text-[1.75rem] font-semibold tracking-[-0.04em] text-text-primary">{tab === "payments" ? "Upcoming payments" : "Budget across events"}</h1><p className="mt-1 text-sm text-text-secondary">{tab === "payments" ? "Review outstanding vendor installments across your events." : "See the whole picture here, then open an event to manage its budget."}</p></div>{events.length > 0 && <div className="flex flex-wrap gap-2"><Button type="button" size="md" variant="outline" className="bg-white" leadingIcon={<Upload className="size-4" />} onClick={() => setImportOpen(true)}>Import</Button><Button type="button" size="md" variant="outline" className="bg-white" leadingIcon={<Download className="size-4" />} disabled={!eventItems.length} onClick={() => downloadBudgetCsv(eventGroups, eventItems, currency, events)}>Export</Button><Link href="/planner/create-event" className={cn(buttonVariants({ size: "md" }), "inline-flex items-center gap-2")}><Plus className="size-4" aria-hidden="true" />Create event</Link></div>}</header>

    {message && <p role="status" className="rounded-lg border border-[#cbded0] bg-[#f1f8f3] px-4 py-3 text-sm text-brand-primary">{message}</p>}

    {!hasAnyBudgetItems && tab === "events" && <WorkSnapshot />}
    {!events.length ? (tab === "payments" ? <UpcomingPayments items={eventItems} groups={eventGroups} currency={currency} events={events} onView={(item) => router.push(`/planner/events/${item.eventId}?section=budget`)} /> : <BudgetEmptyHero />) : <>
      {!hasAnyBudgetItems && tab === "events" && <BudgetEmptyHero event={events[0]} />}
      {(hasAnyBudgetItems || tab === "payments") && <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border-subtle"><div role="tablist" aria-label="Portfolio budget views" className="flex gap-5 overflow-x-auto">{[{ id: "events", label: "Event budgets" }, { id: "payments", label: "Upcoming payments" }, { id: "bookings", label: "Bookings" }].map((entry) => <button key={entry.id} role="tab" type="button" aria-selected={tab === entry.id} onClick={() => setTab(entry.id as PortfolioTab)} className={cn("min-h-10 shrink-0 whitespace-nowrap border-b-2 text-sm font-semibold", tab === entry.id ? "border-brand-primary text-brand-primary" : "border-transparent text-text-secondary hover:text-text-primary")}>{entry.label}</button>)}</div><label className="flex items-center gap-2 pb-2 text-sm font-medium text-text-secondary">Currency<BudgetNativeSelect aria-label="Currency" value={currency} onChange={(event) => setCurrency(event.target.value)} className="h-9 rounded-md text-sm font-semibold">{currencies.map((entry) => <option key={entry.code} value={entry.code}>{entry.code}</option>)}</BudgetNativeSelect></label></div>}
      {tab === "events" && <>{hasAnyBudgetItems && <><BudgetSummary clientBudget={clientBudget} items={eventItems} currency={currency} /><p className="-mt-3 text-xs text-text-tertiary">Totals include all events in {currency}; currencies are not converted. Balance left is the higher of budgeted or invoiced, less paid.</p></>}<section className="space-y-3"><div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-base font-semibold text-text-primary">{hasAnyBudgetItems ? "Event budgets" : "Choose an event to begin"} <span className="ml-1 text-sm font-normal text-text-tertiary">{events.length}</span></h2><p className="mt-1 text-sm text-text-secondary">Select an event to add groups, edit items and review its documents.</p></div><SearchInput aria-label="Search event budgets" placeholder="Search events or clients" value={search} onChange={(event) => setSearch(event.target.value)} onClear={() => setSearch("")} className="w-full sm:w-64" /></div>
        {visibleEvents.length ? <><div className="hidden overflow-x-auto rounded-xl border border-border-subtle bg-white md:block"><table className="w-full min-w-[900px] border-collapse text-left"><thead className="bg-[#f8faf8] text-xs font-semibold uppercase tracking-[0.08em] text-text-tertiary"><tr><th className="px-5 py-3">Event</th><th className="px-4 py-3">Client budget</th><th className="px-4 py-3 text-right">Budgeted</th><th className="px-4 py-3 text-right">Invoiced</th><th className="px-4 py-3 text-right">Paid</th><th className="px-4 py-3 text-right">Balance left</th><th className="px-4 py-3 text-right"><span className="sr-only">Open budget</span></th></tr></thead><tbody>{visibleEvents.map((event) => <EventBudgetRow key={event.id} event={event} items={eventItemsById.get(event.id) ?? []} currency={currency} />)}</tbody></table></div><div className="grid gap-3 md:hidden">{visibleEvents.map((event) => <EventBudgetRow key={event.id} event={event} items={eventItemsById.get(event.id) ?? []} currency={currency} compact />)}</div></> : <div className="rounded-xl border border-border-subtle bg-white px-6 py-12 text-center"><Search className="mx-auto size-6 text-text-tertiary" /><p className="mt-3 text-sm font-semibold">No events match your search</p><button type="button" onClick={() => setSearch("")} className="mt-2 text-sm font-semibold text-brand-primary hover:underline">Clear search</button></div>}
      </section></>}
      {tab === "payments" && <UpcomingPayments items={eventItems} groups={eventGroups} currency={currency} events={events} onView={(item) => router.push(`/planner/events/${item.eventId}?section=budget`)} />}
      {hasAnyBudgetItems && tab === "bookings" && <BookingsTable items={eventItems} groups={eventGroups} currency={currency} events={events} onView={(item) => router.push(`/planner/events/${item.eventId}?section=budget`)} />}
    </>}

    {unassignedGroups.length > 0 && <section className="flex flex-wrap items-center gap-4 rounded-xl border border-[#e6e2d8] bg-[#fbfaf7] px-5 py-4"><span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-white text-[#8b7758]"><FolderOpen className="size-5" /></span><div className="min-w-0 flex-1"><h2 className="text-sm font-semibold">Unassigned costs</h2><p className="mt-0.5 text-sm text-text-secondary">{unassignedItems.length} {unassignedItems.length === 1 ? "item" : "items"} are not attached to an active event. They are kept separate from event totals.</p></div><Link href="/planner/budget/unassigned" className="inline-flex min-h-9 items-center gap-1 text-sm font-semibold text-brand-primary">Review costs<ArrowRight className="size-3.5" aria-hidden="true" /></Link></section>}
    <ImportBudgetDialog key={currency} open={importOpen} onOpenChange={setImportOpen} events={events} targetEventId={null} requireEvent currency={currency} groups={groups} items={items} onImported={() => setMessage("Import complete. Open an event to review its budget items.")} />
  </div>;
}
