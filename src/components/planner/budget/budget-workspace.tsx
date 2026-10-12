"use client";

import { useState } from "react";
import Link from "next/link";
import * as Dialog from "@radix-ui/react-dialog";
import { ArrowLeft, ChevronDown, Download, Filter, FolderPlus, Plus, Upload, X } from "lucide-react";

import { AddBudgetGroupDialog } from "@/components/planner/budget/budget-dialogs";
import { BudgetNativeSelect } from "@/components/planner/budget/budget-controls";
import { BudgetItemDetail } from "@/components/planner/budget/budget-item-detail";
import { BudgetItemDialog } from "@/components/planner/budget/budget-item-dialog";
import { BookingsTable, BudgetProgress, BudgetSummary, BudgetTable, UpcomingPayments } from "@/components/planner/budget/budget-sections";
import { ImportBudgetDialog } from "@/components/planner/budget/import-budget-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { SearchInput } from "@/components/ui/search-input";
import { deleteBudgetAttachments } from "@/lib/budget-attachments";
import { downloadBudgetCsv } from "@/lib/budget-export";
import { useBrowserReady, usePlannerEvents } from "@/lib/planner-events";
import { budgetContext, budgetStatuses, currencies, deleteBudgetItem, isBooked, legacyBudgetGroups, legacyBudgetItems, useBudgetStore, type BudgetGroup, type BudgetItem } from "@/lib/planner-budget";
import { cn } from "@/lib/utils/cn";

type BudgetTab = "overview" | "payments" | "bookings";

export function BudgetWorkspace({ fixedEventId, embedded = false, unassignedOnly = false }: { fixedEventId?: string; embedded?: boolean; unassignedOnly?: boolean }) {
  const events = usePlannerEvents();
  const store = useBudgetStore();
  const ready = useBrowserReady();
  const [currency, setCurrency] = useState("NGN");
  const [tab, setTab] = useState<BudgetTab>("overview");
  const [groupOpen, setGroupOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<BudgetGroup | null>(null);
  const [editingItem, setEditingItem] = useState<BudgetItem | null>(null);
  const [selectedItem, setSelectedItem] = useState<BudgetItem | null>(null);
  const [deleteItem, setDeleteItem] = useState<BudgetItem | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [bookedFilter, setBookedFilter] = useState<"all" | "not-booked" | "booked">("all");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [vendorFilter, setVendorFilter] = useState("");
  const [groupFilter, setGroupFilter] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [message, setMessage] = useState("");

  if (!ready) return <div className="h-80 animate-pulse rounded-xl bg-white" aria-label="Loading budget" />;
  if (fixedEventId && !events.some((event) => event.id === fixedEventId)) return <div className="rounded-xl border border-border-subtle bg-white px-6 py-12 text-center"><h1 className="text-lg font-semibold">Event not found</h1><p className="mt-2 text-xs text-text-secondary">This event may be saved in another browser.</p><Link href="/planner/events" className={cn(buttonVariants({ size: "sm" }), "mt-5")}>Back to events</Link></div>;

  const eventId = fixedEventId ?? null;
  const context = budgetContext(events, store, eventId, currency);
  const activeEventIds = new Set(events.map((entry) => entry.id));
  const groups = unassignedOnly ? context.groups.filter((group) => !group.eventId || !activeEventIds.has(group.eventId)) : context.groups;
  const visibleGroupIds = new Set(groups.map((group) => group.id));
  const items = unassignedOnly ? context.items.filter((item) => visibleGroupIds.has(item.groupId)) : context.items;
  const allGroups = [...store.groups, ...legacyBudgetGroups(events)];
  const allItems = [...store.items, ...legacyBudgetItems(events, store)];
  const event = events.find((entry) => entry.id === eventId);
  const clientBudget = currency === "NGN" && event ? Number(event.budget) || null : null;
  const eventNames = new Map(events.map((entry) => [entry.id, entry.name]));
  const searchValue = search.toLowerCase().trim();
  const matchedItems = items.filter((item) => {
    const groupName = groups.find((group) => group.id === item.groupId)?.name ?? "";
    return (bookedFilter === "all" || (bookedFilter === "booked" ? isBooked(item) : !isBooked(item))) && (!statusFilter || item.status === statusFilter) && (!vendorFilter || item.vendor === vendorFilter) && (!groupFilter || item.groupId === groupFilter) && (!searchValue || `${item.name} ${item.vendor} ${item.notes} ${groupName} ${eventNames.get(item.eventId ?? "") ?? ""}`.toLowerCase().includes(searchValue));
  });
  const filtering = bookedFilter !== "all" || Boolean(statusFilter || vendorFilter || groupFilter || searchValue);
  const visibleGroups = groups.filter((group) => (!groupFilter || group.id === groupFilter) && (!filtering || matchedItems.some((item) => item.groupId === group.id)));
  const visibleExpanded = new Set([...expanded, ...groups.filter((group) => !expanded.has(group.id) && !expanded.has(`closed:${group.id}`)).map((group) => group.id)]);
  const vendors = [...new Set(items.map((item) => item.vendor).filter(Boolean))].sort();
  const savedVendors = [...new Set(allItems.map((item) => item.vendor).filter(Boolean))].sort();
  const filterCount = [statusFilter, vendorFilter, groupFilter].filter(Boolean).length;

  function toggleGroup(id: string) {
    setExpanded((current) => {
      const next = new Set(current);
      if (visibleExpanded.has(id)) { next.delete(id); next.add(`closed:${id}`); }
      else { next.add(id); next.delete(`closed:${id}`); }
      return next;
    });
  }
  function openItem(group: BudgetGroup, item?: BudgetItem) { setEditingGroup(group); setEditingItem(item ?? null); }
  function editItem(item: BudgetItem) { const group = groups.find((entry) => entry.id === item.groupId); if (group) openItem(group, item); }
  function doDelete() {
    if (!deleteItem) return;
    try { deleteBudgetItem(deleteItem.id); void deleteBudgetAttachments(deleteItem.attachments.map((entry) => entry.id)).catch(() => undefined); setMessage(`${deleteItem.name} removed from this budget.`); setDeleteItem(null); }
    catch { setMessage("This item couldn’t be removed. Please try again."); }
  }

  return <div className="w-full min-w-0 space-y-6">
    {!embedded && <Link href={unassignedOnly ? "/planner/budget" : `/planner/events/${fixedEventId}?section=budget`} className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-secondary hover:text-brand-primary"><ArrowLeft className="size-4" />{unassignedOnly ? "All event budgets" : "Event workspace"}</Link>}
    {!embedded && <header className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between"><div><h1 className="text-[1.75rem] font-semibold tracking-[-0.04em] text-text-primary">{unassignedOnly ? "Unassigned costs" : "Event budget"}</h1><p className="mt-1 text-sm text-text-secondary">{unassignedOnly ? "Costs not connected to an event. These stay outside your event totals." : `Manage groups, vendors, invoices and payments for ${event?.name ?? "this event"}.`}</p></div><div className="flex flex-wrap gap-2">{!unassignedOnly && <Button type="button" size="md" variant="outline" className="whitespace-nowrap bg-white" leadingIcon={<Upload className="size-4" />} onClick={() => setImportOpen(true)}>Import</Button>}<Button type="button" size="md" variant="outline" className="whitespace-nowrap bg-white" leadingIcon={<Download className="size-4" />} disabled={!items.length} onClick={() => downloadBudgetCsv(groups, items, currency, events)}>Export</Button>{!unassignedOnly && <Button type="button" size="md" className="whitespace-nowrap" leadingIcon={<Plus className="size-4" />} onClick={() => setGroupOpen(true)}>Add budget group</Button>}</div></header>}
    {embedded && <div className="flex flex-wrap items-center justify-end gap-2"><Button type="button" size="sm" variant="outline" className="whitespace-nowrap bg-white" leadingIcon={<Upload className="size-3.5" />} onClick={() => setImportOpen(true)}>Import</Button><Button type="button" size="sm" variant="outline" className="whitespace-nowrap bg-white" leadingIcon={<Download className="size-3.5" />} disabled={!items.length} onClick={() => downloadBudgetCsv(groups, items, currency, events)}>Export</Button><Button type="button" size="sm" className="whitespace-nowrap" leadingIcon={<Plus className="size-3.5" />} onClick={() => setGroupOpen(true)}>Add budget group</Button></div>}
    <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border-subtle"><div role="tablist" aria-label="Budget views" className="flex gap-5 overflow-x-auto">{[{ id: "overview", label: "Overview" }, { id: "payments", label: "Upcoming Payments" }, { id: "bookings", label: "Bookings" }].map((item) => <button key={item.id} type="button" role="tab" aria-selected={tab === item.id} onClick={() => setTab(item.id as BudgetTab)} className={cn("min-h-10 shrink-0 whitespace-nowrap border-b-2 text-xs font-semibold transition-colors", tab === item.id ? "border-brand-primary text-brand-primary" : "border-transparent text-text-secondary hover:text-text-primary")}>{item.label}</button>)}</div><label className="flex items-center gap-2 pb-2 text-xs font-medium text-text-secondary">Currency<BudgetNativeSelect aria-label="Currency" value={currency} onChange={(change) => { setCurrency(change.target.value); setExpanded(new Set()); }} className="h-9 rounded-md text-xs font-semibold">{currencies.map((entry) => <option key={entry.code} value={entry.code}>{entry.code}</option>)}</BudgetNativeSelect></label></div>
    {message && <div role="status" className="flex items-center justify-between gap-3 rounded-lg border border-border-subtle bg-white px-4 py-2.5 text-xs text-text-secondary">{message}<button type="button" onClick={() => setMessage("")} aria-label="Dismiss message"><X className="size-3.5" /></button></div>}
    {tab === "overview" && (groups.length === 0 ? <section className="flex flex-col items-center rounded-xl border border-dashed border-border-strong bg-white px-5 py-12 text-center"><span className="flex size-11 items-center justify-center rounded-xl bg-[#eaf3ed] text-brand-primary"><FolderPlus className="size-5" /></span><h2 className="mt-4 text-lg font-semibold">{unassignedOnly ? "No unassigned costs" : "Create this event’s budget"}</h2><p className="mt-2 max-w-md text-sm leading-6 text-text-secondary">{unassignedOnly ? "Your budget groups are all connected to events. Open an event to manage its costs." : "Organise costs by category, assign vendors and keep track of payments. Already have a spreadsheet? Bring it in instead."}</p><div className="mt-5 flex flex-wrap justify-center gap-2">{unassignedOnly ? <Link href="/planner/budget" className={buttonVariants({ size: "md" })}>All event budgets</Link> : <><Button type="button" size="md" leadingIcon={<Plus className="size-4" />} onClick={() => setGroupOpen(true)}>Add budget group</Button><Button type="button" size="md" variant="outline" className="bg-white" leadingIcon={<Upload className="size-4" />} onClick={() => setImportOpen(true)}>Import spreadsheet</Button></>}</div></section> : <><BudgetSummary clientBudget={clientBudget} items={items} currency={currency} />{eventId && <BudgetProgress items={items} />}
      <section aria-label="Budget items" className="space-y-3"><div className="flex items-center justify-between gap-3"><h2 className="text-sm font-semibold text-text-primary">Budget items <span className="ml-1 font-normal text-text-tertiary">{items.length}</span></h2><button type="button" onClick={() => setExpanded(visibleGroups.every((group) => visibleExpanded.has(group.id)) ? new Set(groups.map((group) => `closed:${group.id}`)) : new Set(groups.map((group) => group.id)))} className="h-9 whitespace-nowrap text-xs font-semibold text-brand-primary hover:underline">{visibleGroups.every((group) => visibleExpanded.has(group.id)) ? "Collapse all" : "Expand all"}</button></div><div className="flex flex-wrap items-center gap-3"><div role="group" aria-label="Booking filter" className="inline-flex items-center gap-1 rounded-lg border border-border-subtle bg-white p-1">{[{ id: "all", label: "All" }, { id: "not-booked", label: "Not booked" }, { id: "booked", label: "Booked" }].map((option) => <button key={option.id} type="button" aria-pressed={bookedFilter === option.id} onClick={() => setBookedFilter(option.id as typeof bookedFilter)} className={cn("h-8 whitespace-nowrap rounded-md px-3 text-xs font-semibold", bookedFilter === option.id ? "bg-[#eaf3ed] text-brand-primary" : "text-text-secondary hover:bg-background-subtle")}>{option.label}</button>)}</div><SearchInput aria-label="Search budget" placeholder="Search items, notes or vendors" value={search} onChange={(change) => setSearch(change.target.value)} onClear={() => setSearch("")} className="sm:w-64" /><button type="button" onClick={() => setFiltersOpen((value) => !value)} aria-expanded={filtersOpen} className="inline-flex h-10 items-center gap-1.5 whitespace-nowrap rounded-lg border border-border-default bg-white px-3 text-xs font-semibold text-text-secondary hover:border-border-strong"><Filter className="size-3.5" />Filters{filterCount ? ` ${filterCount}` : ""}<ChevronDown className="size-3.5" /></button></div>
      {filtersOpen && <div className="grid gap-3 rounded-lg border border-border-subtle bg-white p-4 sm:grid-cols-3"><label className="text-[0.6875rem] font-semibold">Status<BudgetNativeSelect value={statusFilter} onChange={(change) => setStatusFilter(change.target.value)} className="mt-1.5 h-9 font-normal"><option value="">Any status</option>{budgetStatuses.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}</BudgetNativeSelect></label><label className="text-[0.6875rem] font-semibold">Vendor<BudgetNativeSelect value={vendorFilter} onChange={(change) => setVendorFilter(change.target.value)} className="mt-1.5 h-9 font-normal"><option value="">Any vendor</option>{vendors.map((vendor) => <option key={vendor} value={vendor}>{vendor}</option>)}</BudgetNativeSelect></label><label className="text-[0.6875rem] font-semibold">Budget group<BudgetNativeSelect value={groupFilter} onChange={(change) => setGroupFilter(change.target.value)} className="mt-1.5 h-9 font-normal"><option value="">Any group</option>{groups.map((group) => <option key={group.id} value={group.id}>{group.name}{!eventId ? ` · ${eventNames.get(group.eventId ?? "") ?? "General"}` : ""}</option>)}</BudgetNativeSelect></label></div>}
      {visibleGroups.length ? <BudgetTable groups={visibleGroups} items={matchedItems} events={events} currency={currency} portfolio={false} expanded={visibleExpanded} onToggle={toggleGroup} onAddItem={(group) => openItem(group)} onViewItem={setSelectedItem} onEditItem={editItem} onDeleteItem={setDeleteItem} /> : <div className="rounded-xl border border-border-subtle bg-white px-6 py-12 text-center text-sm text-text-secondary">No budget items match these filters. <button type="button" onClick={() => { setSearch(""); setBookedFilter("all"); setStatusFilter(""); setVendorFilter(""); setGroupFilter(""); }} className="font-semibold text-brand-primary hover:underline">Clear filters</button></div>}</section></>)}
    {tab === "payments" && <UpcomingPayments items={items} groups={groups} currency={currency} onView={setSelectedItem} />}
    {tab === "bookings" && <BookingsTable items={items} groups={groups} currency={currency} onView={setSelectedItem} />}
    <AddBudgetGroupDialog open={groupOpen} onOpenChange={setGroupOpen} events={events} targetEventId={eventId} currency={currency} existing={allGroups} onAdded={(ids) => setExpanded((current) => new Set([...current, ...ids]))} />
    <ImportBudgetDialog open={importOpen} onOpenChange={setImportOpen} events={events} targetEventId={eventId} currency={currency} groups={allGroups} items={allItems} onImported={() => { setMessage("Import complete. Your budget is ready to review."); setExpanded(new Set()); }} />
    {selectedItem && <BudgetItemDetail item={selectedItem} groupName={allGroups.find((group) => group.id === selectedItem.groupId)?.name ?? "Budget item"} eventName={eventNames.get(selectedItem.eventId ?? "") ?? "General"} open onOpenChange={(next) => { if (!next) setSelectedItem(null); }} onEdit={() => { const item = selectedItem; setSelectedItem(null); editItem(item); }} />}
    {editingGroup && <BudgetItemDialog key={editingItem?.id ?? editingGroup.id} open onOpenChange={(next) => { if (!next) { setEditingGroup(null); setEditingItem(null); } }} group={editingGroup} groups={allGroups} vendors={savedVendors} initial={editingItem} onSaved={(savedCurrency) => { setCurrency(savedCurrency); setMessage(editingItem ? "Budget item updated." : "Budget item added."); setExpanded((current) => new Set([...current, editingGroup.id])); }} />}
    <Dialog.Root open={Boolean(deleteItem)} onOpenChange={(next) => { if (!next) setDeleteItem(null); }}><Dialog.Portal><Dialog.Overlay className="fixed inset-0 z-50 bg-[#10231a]/50" /><Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white p-5 shadow-[var(--shadow-lg)]"><Dialog.Title className="text-base font-semibold">Delete budget item?</Dialog.Title><Dialog.Description className="mt-2 text-xs leading-5 text-text-secondary">{deleteItem?.name} will be removed from this budget. This cannot be undone.</Dialog.Description><div className="mt-5 flex justify-end gap-2"><Button type="button" size="sm" variant="outline" onClick={() => setDeleteItem(null)}>Cancel</Button><Button type="button" size="sm" variant="destructive" onClick={doDelete}>Delete item</Button></div></Dialog.Content></Dialog.Portal></Dialog.Root>
  </div>;
}
