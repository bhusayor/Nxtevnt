"use client";

import { useState } from "react";
export { BudgetTable } from "./budget-table";
export { BudgetStatusBadge, VendorStatusBadge } from "./budget-status-badges";
import { BudgetStatusBadge } from "./budget-status-badges";
import { CalendarDays, CircleDollarSign, ReceiptText, Wallet } from "@/components/ui/icons";

import { OverviewMetricCard } from "@/components/planner/overview-metric-card";
import { Button } from "@/components/ui/button";
import type { PlannerEvent } from "@/lib/planner-events";
import { formatBudgetMoney, installmentPayments, isBooked, itemBalance, paymentStatus, type BudgetGroup, type BudgetItem } from "@/lib/planner-budget";
import { cn } from "@/lib/utils/cn";

export function BudgetSummary({ clientBudget, items, currency }: { clientBudget: number | null; items: BudgetItem[]; currency: string }) {
  const budgeted = items.reduce((sum, item) => sum + item.budgeted, 0);
  const invoiced = items.reduce((sum, item) => sum + item.invoiced, 0);
  const paid = items.reduce((sum, item) => sum + item.paid, 0);
  const remaining = clientBudget === null ? null : clientBudget - budgeted;
  const metrics = [
    { label: "Client budget", value: clientBudget === null ? "Not set" : formatBudgetMoney(clientBudget, currency), detail: "Client’s target", icon: Wallet, tone: "neutral" as const },
    { label: "Budgeted / committed", value: formatBudgetMoney(budgeted, currency), detail: "Planned event costs", icon: CircleDollarSign, tone: "lilac" as const, progress: clientBudget && clientBudget > 0 ? { value: Math.round(budgeted / clientBudget * 100), label: "Budget committed against client target" } : undefined },
    { label: "Invoiced", value: formatBudgetMoney(invoiced, currency), detail: "Billed by vendors", icon: ReceiptText, tone: "blue" as const },
    { label: "Paid", value: formatBudgetMoney(paid, currency), detail: "Recorded payments", icon: CircleDollarSign, tone: "amber" as const, progress: invoiced > 0 ? { value: Math.round(paid / invoiced * 100), label: "Payments against invoices" } : undefined },
    { label: "Remaining", value: remaining === null ? "—" : formatBudgetMoney(Math.abs(remaining), currency), detail: remaining === null ? "Set a client budget" : remaining < 0 ? "Over budget" : remaining === 0 ? "On budget" : "Under budget", icon: Wallet, tone: remaining === null ? "neutral" as const : remaining < 0 ? "rose" as const : "sage" as const },
  ];
  return <section aria-label="Budget summary" className="grid grid-cols-2 gap-3 xl:grid-cols-3 2xl:grid-cols-5">{metrics.map((metric) => <OverviewMetricCard key={metric.label} {...metric} compact />)}</section>;
}

export function BudgetProgress({ items }: { items: BudgetItem[] }) {
  const vendors = new Map<string, boolean>();
  for (const item of items) {
    if (!item.vendor.trim() || item.status === "cancelled") continue;
    const key = item.vendor.trim().toLowerCase();
    vendors.set(key, (vendors.get(key) ?? false) || isBooked(item));
  }
  if (!vendors.size) return null;
  const booked = [...vendors.values()].filter(Boolean).length;
  const percent = Math.round(booked / vendors.size * 100);
  return <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-border-subtle bg-white px-4 py-3 text-xs"><span className="font-semibold text-text-primary">{booked} of {vendors.size} vendors booked</span><div role="progressbar" aria-label="Vendors booked" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} className="h-1.5 min-w-28 flex-1 overflow-hidden rounded-full bg-[#eef0ed]"><span className="block h-full rounded-full bg-[#6f9878]" style={{ width: `${percent}%` }} /></div><span className="font-medium text-text-secondary">{percent}% booked</span></div>;
}

type ListProps = { items: BudgetItem[]; groups: BudgetGroup[]; currency: string; events?: readonly PlannerEvent[]; onView: (item: BudgetItem) => void };
export function UpcomingPayments({ items, groups, currency, events, onView }: ListProps) {
  const [showAll, setShowAll] = useState(false);
  const groupNames = new Map(groups.map((group) => [group.id, group.name]));
  const eventNames = new Map(events?.map((event) => [event.id, event.name]) ?? []);
  const today = new Date().toLocaleDateString("sv-SE", { timeZone: "Africa/Lagos" });
  const nextWeek = new Date(new Date().getTime() + 7 * 86_400_000).toLocaleDateString("sv-SE", { timeZone: "Africa/Lagos" });
  const payments = items.filter((item) => item.status !== "cancelled").flatMap((item) => {
    const installments = installmentPayments(item);
    return installments.length ? installments.filter((entry) => entry.due > 0).map((entry) => ({ key: `${item.id}:${entry.id}`, item, amount: entry.due, date: entry.dueDate, label: `${entry.percentage}% installment` })) : item.paymentDate && itemBalance(item) > 0 ? [{ key: item.id, item, amount: itemBalance(item), date: item.paymentDate, label: item.name }] : [];
  }).sort((a, b) => a.date.localeCompare(b.date));
  const sections = [
    { label: "Overdue", items: payments.filter((entry) => entry.date < today) },
    { label: "This week", items: payments.filter((entry) => entry.date >= today && entry.date <= nextWeek) },
    { label: "Later", items: payments.filter((entry) => entry.date > nextWeek) },
  ].filter((section) => section.items.length);
  if (!payments.length) return <div className="rounded-xl border border-border-subtle bg-white px-6 py-14 text-center"><CalendarDays className="mx-auto size-8 text-text-tertiary" /><h3 className="mt-3 text-sm font-semibold">No upcoming payments</h3><p className="mt-1 text-xs text-text-secondary">Add an installment or payment due date to a budget item and it will appear here.</p></div>;
  return <div className="space-y-5"><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-xs text-text-secondary">Track what is due. Payment processing is not connected yet.</p><Button type="button" size="sm" variant="ghost" onClick={() => setShowAll((value) => !value)}>{showAll ? "Group by due date" : "Show all dates"}</Button></div>{(showAll ? [{ label: "All payments", items: payments }] : sections).map((section) => <section key={section.label} className="overflow-hidden rounded-xl border border-border-subtle bg-white"><h3 className="border-b border-border-subtle bg-[#fafbfa] px-4 py-3 text-xs font-semibold">{section.label} <span className="ml-1 text-text-tertiary">{section.items.length}</span></h3><div className="hidden overflow-x-auto md:block"><table className="w-full min-w-[690px] text-left text-xs"><thead className="border-b border-border-subtle text-[0.625rem] font-semibold uppercase tracking-wider text-text-tertiary"><tr>{["Payment", "Vendor", "Amount", "Due date", "Payment status", ""].map((heading) => <th key={heading} className="px-4 py-3">{heading}</th>)}</tr></thead><tbody className="divide-y divide-border-subtle">{section.items.map((entry) => <tr key={entry.key} className="hover:bg-[#fcfdfc]"><td className="px-4 py-3 font-semibold">{entry.label}<span className="block font-normal text-text-tertiary">{entry.item.name} · {groupNames.get(entry.item.groupId)}{events ? ` · ${eventNames.get(entry.item.eventId ?? "") ?? "Event"}` : ""}</span></td><td className="px-4 py-3 text-text-secondary">{entry.item.vendor || "No vendor"}</td><td className="whitespace-nowrap px-4 py-3 font-semibold tabular-nums">{formatBudgetMoney(entry.amount, currency)}</td><td className="whitespace-nowrap px-4 py-3">{entry.date}</td><td className="px-4 py-3"><BudgetStatusBadge status={entry.date < today ? "overdue" : "upcoming"} /></td><td className="px-4 py-3"><button type="button" onClick={() => onView(entry.item)} className="whitespace-nowrap font-semibold text-brand-primary hover:underline">{events ? "Open event" : "View"}</button></td></tr>)}</tbody></table></div><div className="divide-y divide-border-subtle md:hidden">{section.items.map((entry) => <article key={entry.key} className="p-4"><div className="flex items-start justify-between gap-2"><div><p className="text-sm font-semibold">{entry.label}</p><p className="mt-0.5 text-xs text-text-tertiary">{entry.item.name}{events ? ` · ${eventNames.get(entry.item.eventId ?? "") ?? "Event"}` : ""}</p></div><BudgetStatusBadge status={entry.date < today ? "overdue" : "upcoming"} /></div><p className="mt-3 text-xs text-text-secondary">{entry.item.vendor || "No vendor"} · Due {entry.date}</p><p className="mt-1 text-sm font-semibold tabular-nums">{formatBudgetMoney(entry.amount, currency)}</p><button type="button" onClick={() => onView(entry.item)} className="mt-3 text-xs font-semibold text-brand-primary">{events ? "Open event budget" : "View details"}</button></article>)}</div></section>)}</div>;
}

export function BookingsTable({ items, groups, currency, events, onView }: ListProps) {
  const booked = items.filter((item) => isBooked(item) && item.status !== "cancelled");
  const groupNames = new Map(groups.map((group) => [group.id, group.name]));
  const eventNames = new Map(events?.map((event) => [event.id, event.name]) ?? []);
  if (!booked.length) return <div className="rounded-xl border border-border-subtle bg-white px-6 py-14 text-center"><ReceiptText className="mx-auto size-8 text-text-tertiary" /><h3 className="mt-3 text-sm font-semibold">No bookings yet</h3><p className="mt-1 text-xs text-text-secondary">Items with a booked vendor will appear here, even before work or payments begin.</p></div>;
  return <div className="overflow-hidden rounded-xl border border-border-subtle bg-white"><div className="hidden overflow-x-auto md:block"><table className="w-full min-w-[700px] text-left text-xs"><thead className="border-b border-border-subtle bg-[#fafbfa] text-[0.625rem] uppercase tracking-wider text-text-tertiary"><tr>{["Vendor", "Service", "Booked amount", "Paid", "Balance", "Next payment", "Payment status", ""].map((heading) => <th key={heading} className="whitespace-nowrap px-4 py-3">{heading}</th>)}</tr></thead><tbody className="divide-y divide-border-subtle">{booked.map((item) => <tr key={item.id} className="hover:bg-[#fcfdfc]"><td className="px-4 py-3 font-semibold">{item.vendor || "No vendor"}</td><td className="px-4 py-3">{item.name}<span className="block text-[0.6875rem] text-text-tertiary">{groupNames.get(item.groupId)}{events ? ` · ${eventNames.get(item.eventId ?? "") ?? "Event"}` : ""}</span></td><td className="whitespace-nowrap px-4 py-3 tabular-nums">{formatBudgetMoney(item.budgeted, currency)}</td><td className="whitespace-nowrap px-4 py-3 tabular-nums">{formatBudgetMoney(item.paid, currency)}</td><td className="whitespace-nowrap px-4 py-3 tabular-nums">{formatBudgetMoney(itemBalance(item), currency)}</td><td className="whitespace-nowrap px-4 py-3">{installmentPayments(item).find((entry) => entry.due > 0)?.dueDate ?? item.paymentDate ?? "—"}</td><td className="px-4 py-3"><BudgetStatusBadge status={paymentStatus(item)} /></td><td className="px-4 py-3"><button type="button" onClick={() => onView(item)} className="font-semibold text-brand-primary hover:underline">{events ? "Open event" : "View"}</button></td></tr>)}</tbody></table></div><div className="divide-y divide-border-subtle md:hidden">{booked.map((item) => <article key={item.id} className="p-4"><div className="flex items-start justify-between gap-2"><div><p className="text-sm font-semibold">{item.vendor || "No vendor"}</p><p className="mt-0.5 text-xs text-text-secondary">{item.name} · {groupNames.get(item.groupId)}{events ? ` · ${eventNames.get(item.eventId ?? "") ?? "Event"}` : ""}</p></div><BudgetStatusBadge status={paymentStatus(item)} /></div><div className="mt-3 grid grid-cols-2 gap-3 text-xs"><div><p className="text-text-tertiary">Booked amount</p><p className="mt-0.5 font-semibold tabular-nums">{formatBudgetMoney(item.budgeted, currency)}</p></div><div><p className="text-text-tertiary">Paid</p><p className="mt-0.5 font-medium tabular-nums">{formatBudgetMoney(item.paid, currency)}</p></div><div><p className="text-text-tertiary">Balance</p><p className="mt-0.5 font-medium tabular-nums">{formatBudgetMoney(itemBalance(item), currency)}</p></div><div><p className="text-text-tertiary">Next payment</p><p className="mt-0.5 font-medium">{installmentPayments(item).find((entry) => entry.due > 0)?.dueDate ?? item.paymentDate ?? "—"}</p></div></div><button type="button" onClick={() => onView(item)} className="mt-3 text-xs font-semibold text-brand-primary">{events ? "Open event budget" : "View booking"}</button></article>)}</div></div>;
}
