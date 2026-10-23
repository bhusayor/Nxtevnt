"use client";

import { LogBudgetPayment } from "./log-budget-payment";
import { BudgetPaymentDemo } from "./budget-payment-demo";
import { jjjjBudgetPaymentDemo } from "@/lib/budget-payment-demo";
import type { QuickBudgetDraft } from "./budget-quick-add";

import { DeleteConfirmation } from "@/components/ui/delete-confirmation";

import { useState, type ReactNode } from "react";
import { useScrolledPast } from "@/lib/use-scrolled-past";
import Link from "next/link";
import { ArrowLeft, ChevronDown, Download, Filter, FolderPlus, Plus, Upload, X } from "@/components/ui/icons";

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
import { budgetContext, budgetStatuses, currencies, setBudgetBookingStatus, deleteBudgetItem, paymentStatus, upsertBudgetItem, isBooked, legacyBudgetGroups, legacyBudgetItems, useBudgetStore, type BudgetGroup, type BudgetItem, type VendorStatus } from "@/lib/planner-budget";
import { cn } from "@/lib/utils/cn";

type BudgetTab = "overview" | "payments" | "bookings";

export function BudgetWorkspace({ fixedEventId, embedded = false, unassignedOnly = false, navigation }: { fixedEventId?: string; embedded?: boolean; unassignedOnly?: boolean; navigation?: ReactNode }) {
  const events = usePlannerEvents();
  const budgetSummary = useScrolledPast<HTMLDivElement>();
  const store = useBudgetStore();
  const ready = useBrowserReady();
  const [currencyOverride, setCurrencyOverride] = useState<string | null>(null);
  const setCurrency = setCurrencyOverride;
  const currency = currencyOverride ?? (fixedEventId ? events.find((entry) => entry.id === fixedEventId)?.currency || "NGN" : "NGN");
  const [tab, setTab] = useState<BudgetTab>("overview");
  const [groupOpen, setGroupOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<BudgetGroup | null>(null);
  const [editingItem, setEditingItem] = useState<BudgetItem | null>(null);
  const [editingDraft, setEditingDraft] = useState<QuickBudgetDraft | undefined>();
  const [paymentItem, setPaymentItem] = useState<BudgetItem | null>(null);
  const [paymentOptions, setPaymentOptions] = useState<{ amount?: number; path: "record" | "app" }>({ path: "record" });
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
  if (fixedEventId && !events.some((event) => event.id === fixedEventId)) return <div className="rounded-xl border border-border-subtle bg-white px-6 py-12 text-center"><h1 className="text-lg font-semibold">Event not found</h1><p className="mt-2 text-sm text-text-secondary">This event may be saved in another browser.</p><Link href="/planner/events" className={cn(buttonVariants({ size: "sm" }), "mt-5")}>Back to events</Link></div>;

  const eventId = fixedEventId ?? null;
  const context = budgetContext(events, store, eventId, currency);
  const activeEventIds = new Set(events.map((entry) => entry.id));
  const groups = unassignedOnly ? context.groups.filter((group) => !group.eventId || !activeEventIds.has(group.eventId)) : context.groups;
  const visibleGroupIds = new Set(groups.map((group) => group.id));
  const items = unassignedOnly ? context.items.filter((item) => visibleGroupIds.has(item.groupId)) : context.items;
  const allGroups = [...store.groups, ...legacyBudgetGroups(events)];
  const allItems = [...store.items, ...legacyBudgetItems(events, store)];
  const event = events.find((entry) => entry.id === eventId);
  const paymentDemo = event ? jjjjBudgetPaymentDemo(event, currency, items) : null;
  const clientBudget = event && currency === (event.currency || "NGN") ? Number(event.targetBudget || (!event.budgetTemplateId ? event.budget : "")) || null : null;
  const eventNames = new Map(events.map((entry) => [entry.id, entry.name]));
  const searchValue = search.toLowerCase().trim();
  const matchedItems = items.filter((item) => {
    const groupName = groups.find((group) => group.id === item.groupId)?.name ?? "";
    return (bookedFilter === "all" || (bookedFilter === "booked" ? isBooked(item) : !isBooked(item))) && (!statusFilter || paymentStatus(item) === statusFilter) && (!vendorFilter || item.vendor === vendorFilter) && (!groupFilter || item.groupId === groupFilter) && (!searchValue || `${item.name} ${item.vendor} ${item.notes} ${groupName} ${eventNames.get(item.eventId ?? "") ?? ""}`.toLowerCase().includes(searchValue));
  });
  const filtering = bookedFilter !== "all" || Boolean(statusFilter || vendorFilter || groupFilter || searchValue);
  const visibleGroups = groups.filter((group) => (!groupFilter || group.id === groupFilter) && (!filtering || matchedItems.some((item) => item.groupId === group.id)));
  const visibleExpanded = new Set([...expanded, ...groups.filter((group) => !expanded.has(group.id) && !expanded.has(`closed:${group.id}`)).map((group) => group.id)]);
  const vendors = [...new Set(items.map((item) => item.vendor).filter(Boolean))].sort();
  const savedVendors = [...new Set(allItems.map((item) => item.vendor).filter(Boolean))].sort();
  const filterCount = [statusFilter, vendorFilter, groupFilter].filter(Boolean).length;

  function openPayment(item: BudgetItem, amount?: number, path: "record" | "app" = "record") {
    setPaymentOptions({ amount, path });
    setPaymentItem(item);
  }

  function toggleGroup(id: string) {
    setExpanded((current) => {
      const next = new Set(current);
      if (visibleExpanded.has(id)) { next.delete(id); next.add(`closed:${id}`); }
      else { next.add(id); next.delete(`closed:${id}`); }
      return next;
    });
  }
  function openItem(group: BudgetGroup, item?: BudgetItem, draft?: QuickBudgetDraft) { setEditingGroup(group); setEditingItem(item ?? null); setEditingDraft(draft); }
  function quickAdd(group: BudgetGroup, draft: QuickBudgetDraft) {
    const unitPrice = draft.amount.trim() ? Number(draft.amount.replaceAll(",", "")) : 0;
    const pricedAs = draft.pricedAs ?? "flat-fee";
    const quantity = pricedAs === "per-guest" ? Number(events.find((entry) => entry.id === group.eventId)?.guestCount) : pricedAs === "flat-fee" ? 1 : Number(draft.quantity ?? "1");
    const amount = Math.round(quantity * unitPrice * 100) / 100;
    if (!Number.isFinite(quantity) || quantity <= 0 || (["per-guest", "per-trip"].includes(pricedAs) && !Number.isInteger(quantity))) return "Enter a valid count. Guests and trips must be whole numbers above zero.";
    if (!draft.name.trim()) return "Give this item a name.";
    if (draft.name.trim().length > 120 || draft.notes.trim().length > 500) return "Keep the item name under 120 characters and the description under 500.";
    if (!Number.isFinite(amount) || amount < 0 || !Number.isSafeInteger(Math.round(amount * 100))) return "Enter a budgeted amount of zero or more.";
    try {
      upsertBudgetItem({ id: crypto.randomUUID(), groupId: group.id, eventId: group.eventId, currency: group.currency, name: draft.name.trim(), vendor: "", vendorStatus: "not-sourced", budgeted: amount, pricedAs, quantity, unitPrice, invoiced: 0, paid: 0, paymentDate: "", notes: draft.notes.trim(), status: "unpaid", installments: [], attachments: [], payments: [], createdAt: new Date().toISOString() });
      setMessage("Budget item added. Open its details to add a vendor, invoice or payment plan.");
    } catch { return "This item couldn’t be saved. Please try again."; }
  }
  function changeBooking(item: BudgetItem, status: VendorStatus) {
    try { const updated = setBudgetBookingStatus(item, status); setMessage(`Booking status updated for ${updated.name}: ${updated.vendorStatus.replaceAll("-", " ")}.`); }
    catch (problem) { setMessage(problem instanceof Error ? problem.message : "The booking status couldn’t be saved. Please try again."); }
  }
  function editItem(item: BudgetItem) { const group = groups.find((entry) => entry.id === item.groupId); if (group) openItem(group, item); }
  function doDelete() {
    if (!deleteItem) return;
    try { deleteBudgetItem(deleteItem.id); void deleteBudgetAttachments([...deleteItem.attachments.map((entry) => entry.id), ...(deleteItem.payments ?? []).flatMap((payment) => payment.receipt ? [payment.receipt.id] : [])]).catch(() => undefined); setMessage(`${deleteItem.name} removed from this budget.`); setDeleteItem(null); return true; }
    catch { setMessage("This item couldn’t be removed. Please try again."); return false; }
  }

  return <div className="w-full min-w-0 space-y-6">
    {!embedded && <Link href={unassignedOnly ? "/planner/budget" : `/planner/events/${fixedEventId}?section=budget`} className="inline-flex items-center gap-1.5 text-sm font-semibold text-text-secondary hover:text-brand-primary"><ArrowLeft className="size-4" />{unassignedOnly ? "All event budgets" : "Event workspace"}</Link>}
    {!embedded && <header className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between"><div><h1 className="text-[1.75rem] font-semibold tracking-[-0.04em] text-text-primary">{unassignedOnly ? "Unassigned costs" : "Event budget"}</h1><p className="mt-1 text-sm text-text-secondary">{unassignedOnly ? "Costs not connected to an event. These stay outside your event totals." : `Manage groups, vendors, invoices and payments for ${event?.name ?? "this event"}.`}</p></div><div className="flex flex-wrap gap-2">{!unassignedOnly && <Button type="button" size="md" variant="outline" className="whitespace-nowrap bg-white" leadingIcon={<Upload className="size-4" />} onClick={() => setImportOpen(true)}>Import</Button>}<Button type="button" size="md" variant="outline" className="whitespace-nowrap bg-white" leadingIcon={<Download className="size-4" />} disabled={!items.length} onClick={() => downloadBudgetCsv(groups, items, currency, events)}>Export</Button>{!unassignedOnly && <Button type="button" size="md" className="whitespace-nowrap" leadingIcon={<Plus className="size-4" />} onClick={() => setGroupOpen(true)}>Add budget group</Button>}</div></header>}
    {embedded && <div data-budget-header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">{navigation}<div className="flex flex-wrap items-center gap-2"><Button type="button" size="sm" variant="outline" className="whitespace-nowrap bg-white" leadingIcon={<Upload className="size-3.5" />} onClick={() => setImportOpen(true)}>Import</Button><Button type="button" size="sm" variant="outline" className="whitespace-nowrap bg-white" leadingIcon={<Download className="size-3.5" />} disabled={!items.length} onClick={() => downloadBudgetCsv(groups, items, currency, events)}>Export</Button><Button type="button" size="sm" className="whitespace-nowrap" leadingIcon={<Plus className="size-3.5" />} onClick={() => setGroupOpen(true)}>Add budget group</Button></div></div>}
    <div role={navigation ? "tabpanel" : undefined} id={navigation ? "budget-budget-panel" : undefined} aria-labelledby={navigation ? "budget-budget-tab" : undefined} className="space-y-6">
    <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border-subtle"><div role="tablist" aria-label="Budget views" className="flex gap-5 overflow-x-auto">{[{ id: "overview", label: "Overview" }, { id: "payments", label: "Upcoming Payments" }, { id: "bookings", label: "Bookings" }].map((item) => <button key={item.id} type="button" role="tab" aria-selected={tab === item.id} onClick={() => setTab(item.id as BudgetTab)} className={cn("min-h-10 shrink-0 whitespace-nowrap border-b-2 text-sm font-semibold transition-colors", tab === item.id ? "border-brand-primary text-brand-primary" : "border-transparent text-text-secondary hover:text-text-primary")}>{item.label}</button>)}</div><label className="flex items-center gap-2 pb-2 text-sm font-medium text-text-secondary">Currency<BudgetNativeSelect aria-label="Currency" value={currency} onChange={(change) => { setCurrency(change.target.value); setExpanded(new Set()); }} className="h-9 rounded-md text-sm font-semibold">{currencies.map((entry) => <option key={entry.code} value={entry.code}>{entry.code}</option>)}</BudgetNativeSelect></label></div>
    {message && <div role="status" className="flex items-center justify-between gap-3 rounded-lg border border-border-subtle bg-white px-4 py-2.5 text-sm text-text-secondary">{message}<button type="button" onClick={() => setMessage("")} aria-label="Dismiss message"><X className="size-3.5" /></button></div>}
    {tab === "overview" && (groups.length === 0 ? <section className="flex flex-col items-center rounded-xl border border-dashed border-border-strong bg-white px-5 py-12 text-center"><span className="flex size-11 items-center justify-center rounded-xl bg-[#eaf3ed] text-brand-primary"><FolderPlus className="size-5" /></span><h2 className="mt-4 text-lg font-semibold">{unassignedOnly ? "No unassigned costs" : "Create this event’s budget"}</h2><p className="mt-2 max-w-md text-sm leading-6 text-text-secondary">{unassignedOnly ? "Your budget groups are all connected to events. Open an event to manage its costs." : "Organise costs by category, assign vendors and keep track of payments. Already have a spreadsheet? Bring it in instead."}</p><div className="mt-5 flex flex-wrap justify-center gap-2">{unassignedOnly ? <Link href="/planner/budget" className={buttonVariants({ size: "md" })}>All event budgets</Link> : <><Button type="button" size="md" leadingIcon={<Plus className="size-4" />} onClick={() => setGroupOpen(true)}>Add budget group</Button><Button type="button" size="md" variant="outline" className="bg-white" leadingIcon={<Upload className="size-4" />} onClick={() => setImportOpen(true)}>Import spreadsheet</Button></>}</div></section> : <><div ref={budgetSummary.ref}><BudgetSummary clientBudget={clientBudget} items={items} currency={currency} /></div>{eventId && <BudgetProgress items={items} />}
      <section aria-label="Budget items" className="space-y-3"><div data-budget-items-toolbar className="space-y-2 rounded-xl border border-border-subtle bg-white px-3 py-2 shadow-[0_3px_10px_rgba(0,0,0,0.04)]"><div className="flex items-center justify-between gap-3"><h2 className="text-sm font-semibold text-text-primary">Budget items <span className="ml-1 font-normal text-text-tertiary">{items.length}</span></h2><div className="flex shrink-0 flex-col items-end"><button type="button" onClick={() => setExpanded(visibleGroups.every((group) => visibleExpanded.has(group.id)) ? new Set(groups.map((group) => `closed:${group.id}`)) : new Set(groups.map((group) => group.id)))} className="h-9 whitespace-nowrap text-sm font-semibold text-brand-primary hover:underline">{visibleGroups.every((group) => visibleExpanded.has(group.id)) ? "Collapse all" : "Expand all"}</button>{budgetSummary.passed && !unassignedOnly && <button type="button" onClick={() => setGroupOpen(true)} className="inline-flex min-h-8 items-center gap-1 whitespace-nowrap text-sm font-semibold text-brand-primary hover:underline"><Plus className="size-3.5" aria-hidden="true" />Add budget group</button>}</div></div><div className="flex flex-wrap items-center gap-3"><div role="group" aria-label="Booking filter" className="inline-flex items-center gap-1 rounded-lg border border-border-subtle bg-white p-1">{[{ id: "all", label: "All" }, { id: "not-booked", label: "Not booked" }, { id: "booked", label: "Booked" }].map((option) => <button key={option.id} type="button" aria-pressed={bookedFilter === option.id} onClick={() => setBookedFilter(option.id as typeof bookedFilter)} className={cn("h-8 whitespace-nowrap rounded-md px-3 text-sm font-semibold", bookedFilter === option.id ? "bg-[#eaf3ed] text-brand-primary" : "text-text-secondary hover:bg-background-subtle")}>{option.label}</button>)}</div><SearchInput aria-label="Search budget" placeholder="Search items, notes or vendors" value={search} onChange={(change) => setSearch(change.target.value)} onClear={() => setSearch("")} className="sm:w-64" /><button type="button" onClick={() => setFiltersOpen((value) => !value)} aria-expanded={filtersOpen} className="inline-flex h-10 items-center gap-1.5 whitespace-nowrap rounded-lg border border-border-default bg-white px-3 text-sm font-semibold text-text-secondary hover:border-border-strong"><Filter className="size-3.5" />Filters{filterCount ? ` ${filterCount}` : ""}<ChevronDown className="size-3.5" /></button></div></div>
      {filtersOpen && <div className="grid gap-3 rounded-lg border border-border-subtle bg-white p-4 sm:grid-cols-3"><label className="text-xs font-semibold">Payment status<BudgetNativeSelect value={statusFilter} onChange={(change) => setStatusFilter(change.target.value)} className="mt-1.5 h-9 font-normal"><option value="">Any payment status</option>{budgetStatuses.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}</BudgetNativeSelect></label><label className="text-xs font-semibold">Vendor<BudgetNativeSelect value={vendorFilter} onChange={(change) => setVendorFilter(change.target.value)} className="mt-1.5 h-9 font-normal"><option value="">Any vendor</option>{vendors.map((vendor) => <option key={vendor} value={vendor}>{vendor}</option>)}</BudgetNativeSelect></label><label className="text-xs font-semibold">Budget group<BudgetNativeSelect value={groupFilter} onChange={(change) => setGroupFilter(change.target.value)} className="mt-1.5 h-9 font-normal"><option value="">Any group</option>{groups.map((group) => <option key={group.id} value={group.id}>{group.name}{!eventId ? ` · ${eventNames.get(group.eventId ?? "") ?? "General"}` : ""}</option>)}</BudgetNativeSelect></label></div>}
      {visibleGroups.length ? <BudgetTable groups={visibleGroups} items={matchedItems} events={events} currency={currency} portfolio={false} expanded={visibleExpanded} onToggle={toggleGroup} onAddItem={(group, draft) => openItem(group, undefined, draft)} onQuickAdd={quickAdd} onChangeBooking={changeBooking} onLogPayment={openPayment} onViewItem={setSelectedItem} onEditItem={editItem} onDeleteItem={setDeleteItem} /> : <div className="rounded-xl border border-border-subtle bg-white px-6 py-12 text-center text-sm text-text-secondary">No budget items match these filters. <button type="button" onClick={() => { setSearch(""); setBookedFilter("all"); setStatusFilter(""); setVendorFilter(""); setGroupFilter(""); }} className="font-semibold text-brand-primary hover:underline">Clear filters</button></div>}</section></>)}
    {tab === "payments" && (paymentDemo ? <BudgetPaymentDemo data={paymentDemo} currency={currency} /> : <UpcomingPayments items={items} groups={groups} currency={currency} onView={setSelectedItem} onPay={(item, amount) => openPayment(item, amount, "app")} />)}
    {tab === "bookings" && <div className="space-y-4"><header><h2 className="text-lg font-semibold">Booked vendors & services</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-text-secondary">This is your confirmed booking list. Review the booked amount, what’s paid, the balance and next payment date. Booking a vendor does not mark a payment as paid. Open a row to review its documents and receipts.</p></header><BookingsTable items={items} groups={groups} currency={currency} onView={setSelectedItem} /></div>}
    <AddBudgetGroupDialog open={groupOpen} onOpenChange={setGroupOpen} events={events} targetEventId={eventId} currency={currency} existing={allGroups} existingItems={allItems} onAdded={(ids) => setExpanded((current) => new Set([...current, ...ids]))} />
    <ImportBudgetDialog key={currency} open={importOpen} onOpenChange={setImportOpen} events={events} targetEventId={eventId} currency={currency} groups={allGroups} items={allItems} onImported={() => { setMessage("Import complete. Your budget is ready to review."); setExpanded(new Set()); }} />
    {selectedItem && <BudgetItemDetail item={selectedItem} groupName={allGroups.find((group) => group.id === selectedItem.groupId)?.name ?? "Budget item"} eventName={eventNames.get(selectedItem.eventId ?? "") ?? "General"} open onOpenChange={(next) => { if (!next) setSelectedItem(null); }} onEdit={() => { const item = selectedItem; setSelectedItem(null); editItem(item); }} />}
    {editingGroup && <BudgetItemDialog key={editingItem?.id ?? editingGroup.id} open onOpenChange={(next) => { if (!next) { setEditingGroup(null); setEditingItem(null); } }} group={editingGroup} groups={allGroups} vendors={savedVendors} initial={editingItem} draft={editingDraft} onSaved={(savedCurrency) => { setCurrency(savedCurrency); setMessage(editingItem ? "Budget item updated." : "Budget item added."); setExpanded((current) => new Set([...current, editingGroup.id])); }} />}
    {paymentItem && <LogBudgetPayment key={`${paymentItem.id}:${paymentOptions.path}:${paymentOptions.amount ?? "custom"}`} initialAmount={paymentOptions.amount} initialPath={paymentOptions.path} item={allItems.find((item) => item.id === paymentItem.id) ?? paymentItem} onClose={() => setPaymentItem(null)} onSaved={(item) => { setMessage("Payment logged. Paid, balance and payment status are updated."); setSelectedItem((current) => current?.id === item.id ? item : current); }} />}
    </div>
    <DeleteConfirmation open={Boolean(deleteItem)} onOpenChange={(next) => { if (!next) setDeleteItem(null); }} title="Delete budget item?" description={`“${deleteItem?.name}” and its attached documents will be removed from this budget. This can’t be undone.`} onConfirm={doDelete} />
  </div>;
}
