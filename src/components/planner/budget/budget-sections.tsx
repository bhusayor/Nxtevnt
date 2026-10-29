"use client";

export { BudgetTable } from "./budget-table";
export { UpcomingPayments } from "./upcoming-payments";
export { BudgetStatusBadge, VendorStatusBadge } from "./budget-status-badges";
import { BudgetStatusBadge } from "./budget-status-badges";
import { useState, type FormEvent } from "react";
import { CircleDollarSign, Pencil, ReceiptText, Wallet } from "@/components/ui/icons";

import { OverviewMetricCard } from "@/components/planner/overview-metric-card";
import { Button } from "@/components/ui/button";
import type { PlannerEvent } from "@/lib/planner-events";
import { formatBudgetMoney, installmentPayments, isBooked, itemBalance, paymentStatus, type BudgetGroup, type BudgetItem } from "@/lib/planner-budget";
import { cn } from "@/lib/utils/cn";

export function BudgetedCard({ budgeted, clientBudget, currency, onSaveClientBudget }: { budgeted: number; clientBudget: number | null; currency: string; onSaveClientBudget?: (amount: number) => string | null }) {
  const [editing, setEditing] = useState(false);
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const difference = clientBudget === null ? null : clientBudget - budgeted;
  const percent = clientBudget && clientBudget > 0 ? Math.min(100, Math.max(0, Math.round(budgeted / clientBudget * 100))) : 0;

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = Number(amount.replaceAll(",", ""));
    if (!/^[\d,]+$/.test(amount) || !Number.isSafeInteger(value) || value <= 0) { setError("Enter a client budget above zero."); return; }
    const failure = onSaveClientBudget?.(value);
    if (failure) { setError(failure); return; }
    setError("");
    setEditing(false);
  }

  function beginEdit() {
    setAmount(clientBudget === null ? "" : Math.round(clientBudget).toLocaleString("en-NG"));
    setError("");
    setEditing(true);
  }

  const currencySymbol = new Intl.NumberFormat("en-NG", { style: "currency", currency }).formatToParts(0).find((part) => part.type === "currency")?.value ?? currency;

  return <article className="flex min-w-0 flex-col rounded-2xl border border-border-subtle bg-white p-4 text-left shadow-[0_8px_26px_-23px_rgba(20,45,30,.35)] sm:p-5">
    <div className="flex items-start justify-between gap-2"><span className="pt-0.5 text-sm font-semibold text-text-secondary">{editing ? "Client budget" : "Budgeted"}</span><span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#f1edf8] text-[#705987]"><CircleDollarSign className="size-[18px]" weight="bold" aria-hidden="true" /></span></div>
    {editing ? <form onSubmit={save} className="flex flex-1 flex-col">
      <label htmlFor="client-budget-amount" className="sr-only">Client budget amount</label>
      <div className="mt-3 flex min-w-0 items-baseline gap-1 border-b-2 border-[#a693b9] pb-1.5 text-[1.375rem] font-semibold leading-tight tracking-[-0.045em] text-text-primary focus-within:border-brand-primary sm:text-[1.5rem]"><span aria-hidden="true">{currencySymbol}</span><input id="client-budget-amount" autoFocus onFocus={(event) => event.currentTarget.select()} inputMode="numeric" value={amount} onChange={(event) => { setAmount(event.target.value.replace(/[^\d]/g, "").slice(0, 15).replace(/\B(?=(\d{3})+(?!\d))/g, ",")); setError(""); }} placeholder="0" aria-invalid={Boolean(error)} className="min-w-0 w-full bg-transparent text-[1.375rem] font-semibold tracking-[-0.045em] tabular-nums outline-none placeholder:text-text-tertiary sm:text-[1.5rem]" /></div>
      <div className="mt-auto pt-4"><p className="rounded-xl bg-[#f7f4fb] px-3 py-2.5 text-sm font-medium text-[#705987]">Budgeted plan · {formatBudgetMoney(budgeted, currency)}</p>{error && <p role="alert" className="mt-2 text-xs text-error">{error}</p>}<div className="mt-3 flex flex-wrap gap-2"><Button type="submit" size="sm">Save client budget</Button><Button type="button" size="sm" variant="ghost" onClick={() => { setEditing(false); setError(""); }}>Cancel</Button></div></div>
    </form> : <>
      <strong className="mt-3 block break-words text-[1.375rem] font-semibold leading-tight tracking-[-0.045em] tabular-nums text-text-primary sm:text-[1.5rem]">{formatBudgetMoney(budgeted, currency)}</strong>
      {clientBudget !== null && <div className="mt-3" role="progressbar" aria-label="Budgeted against client budget" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}><div className="h-1.5 overflow-hidden rounded-full bg-[#eee9f5]"><span className={cn("block h-full rounded-full transition-[width] duration-500", difference !== null && difference < 0 ? "bg-[#d69a52]" : "bg-[#8b72a8]")} style={{ width: `${percent}%` }} /></div></div>}
      <div className="mt-auto pt-4"><div className="flex min-h-10 flex-wrap items-center gap-x-3 gap-y-2 rounded-xl bg-[#f7f4fb] px-3 py-2.5 text-sm">{onSaveClientBudget ? <button type="button" onClick={beginEdit} className="inline-flex min-h-7 items-center gap-1 font-medium text-[#705987] hover:underline">{clientBudget === null ? "Set client budget" : `Client budget ${formatBudgetMoney(clientBudget, currency)}`}<Pencil className="size-3.5 shrink-0" aria-hidden="true" /></button> : <span className="font-medium text-[#705987]">{clientBudget === null ? "Client budget not set" : `Client budget ${formatBudgetMoney(clientBudget, currency)}`}</span>}{difference !== null && <span className={cn("ml-auto rounded-lg px-2 py-1 font-semibold tabular-nums", difference < 0 ? "bg-[#fff1d6] text-[#80540a]" : difference > 0 ? "bg-[#eaf4ed] text-[#37634a]" : "bg-[#edf1ef] text-[#4f6558]")}>{difference < 0 ? `Over by ${formatBudgetMoney(Math.abs(difference), currency)}` : difference > 0 ? `Under by ${formatBudgetMoney(difference, currency)}` : "On budget"}</span>}</div></div>
    </>}
  </article>;
}

export function BudgetSummary({ clientBudget, items, currency, onSaveClientBudget }: { clientBudget: number | null; items: BudgetItem[]; currency: string; onSaveClientBudget?: (amount: number) => string | null }) {
  const budgeted = items.reduce((sum, item) => sum + item.budgeted, 0);
  const invoiced = items.reduce((sum, item) => sum + item.invoiced, 0);
  const paid = items.reduce((sum, item) => sum + item.paid, 0);
  const remaining = clientBudget === null ? null : clientBudget - budgeted;
  const metrics = [
    { label: "Invoiced", value: formatBudgetMoney(invoiced, currency), detail: "Billed by vendors", icon: ReceiptText, tone: "blue" as const },
    { label: "Paid", value: formatBudgetMoney(paid, currency), detail: "Recorded payments", icon: CircleDollarSign, tone: "amber" as const, progress: invoiced > 0 ? { value: Math.round(paid / invoiced * 100), label: "Payments against invoices" } : undefined },
    { label: "Remaining", value: remaining === null ? "—" : formatBudgetMoney(Math.abs(remaining), currency), detail: remaining === null ? "Set a client budget" : remaining < 0 ? "Over budget" : remaining === 0 ? "On budget" : "Under budget", icon: Wallet, tone: remaining === null ? "neutral" as const : remaining < 0 ? "amber" as const : "sage" as const },
  ];
  return <section aria-label="Budget summary" className="grid grid-cols-2 gap-3 xl:grid-cols-4"><BudgetedCard budgeted={budgeted} clientBudget={clientBudget} currency={currency} onSaveClientBudget={onSaveClientBudget} />{metrics.map((metric) => <OverviewMetricCard key={metric.label} {...metric} compact className="[&>div:first-child>span:first-child]:text-sm [&>div:last-child>div]:text-sm" />)}</section>;
}

export function BudgetProgress({ items }: { items: BudgetItem[] }) {
  const bookable = items.filter((item) => item.status !== "cancelled");
  if (!bookable.length) return null;
  const booked = bookable.filter(isBooked).length;
  const percent = Math.round(booked / bookable.length * 100);
  return <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-border-subtle bg-white px-4 py-3 text-sm"><span className="font-semibold text-text-primary">{booked} of {bookable.length} booked</span><div role="progressbar" aria-label="Budget items booked" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} className="h-1.5 min-w-28 flex-1 overflow-hidden rounded-full bg-[#eef0ed]"><span className="block h-full rounded-full bg-[#6f9878]" style={{ width: `${percent}%` }} /></div><span className="font-medium text-text-secondary">{percent}% booked</span></div>;
}

type ListProps = { items: BudgetItem[]; groups: BudgetGroup[]; currency: string; events?: readonly PlannerEvent[]; onView: (item: BudgetItem) => void };
export function BookingsTable({ items, groups, currency, events, onView }: ListProps) {
  const booked = items.filter((item) => isBooked(item) && item.status !== "cancelled");
  const groupNames = new Map(groups.map((group) => [group.id, group.name]));
  const eventNames = new Map(events?.map((event) => [event.id, event.name]) ?? []);
  if (!booked.length) return <div className="rounded-xl border border-border-subtle bg-white px-6 py-14 text-center"><ReceiptText className="mx-auto size-8 text-text-tertiary" /><h3 className="mt-3 text-sm font-semibold">No bookings yet</h3><p className="mt-1 text-sm text-text-secondary">Items with a booked vendor will appear here, even before work or payments begin.</p></div>;
  return <div className="overflow-hidden rounded-xl border border-border-subtle bg-white"><div className="hidden overflow-x-auto md:block"><table className="w-full min-w-[700px] text-left text-sm"><thead className="border-b border-border-subtle bg-[#fafbfa] text-xs uppercase tracking-wider text-text-tertiary"><tr>{["Vendor", "Service", "Booked amount", "Paid", "Balance", "Next payment", "Payment status", ""].map((heading) => <th key={heading} className="whitespace-nowrap px-4 py-3">{heading}</th>)}</tr></thead><tbody className="divide-y divide-border-subtle">{booked.map((item) => <tr key={item.id} className="hover:bg-[#fcfdfc]"><td className="px-4 py-3 font-semibold">{item.vendor || "No vendor"}</td><td className="px-4 py-3">{item.name}<span className="block text-xs text-text-tertiary">{groupNames.get(item.groupId)}{events ? ` · ${eventNames.get(item.eventId ?? "") ?? "Event"}` : ""}</span></td><td className="whitespace-nowrap px-4 py-3 tabular-nums">{formatBudgetMoney(item.budgeted, currency)}</td><td className="whitespace-nowrap px-4 py-3 tabular-nums">{formatBudgetMoney(item.paid, currency)}</td><td className="whitespace-nowrap px-4 py-3 tabular-nums">{formatBudgetMoney(itemBalance(item), currency)}</td><td className="whitespace-nowrap px-4 py-3">{installmentPayments(item).find((entry) => entry.due > 0)?.dueDate ?? item.paymentDate ?? "—"}</td><td className="px-4 py-3"><BudgetStatusBadge status={paymentStatus(item)} /></td><td className="px-4 py-3"><button type="button" onClick={() => onView(item)} className="font-semibold text-brand-primary hover:underline">{events ? "Open event" : "View"}</button></td></tr>)}</tbody></table></div><div className="divide-y divide-border-subtle md:hidden">{booked.map((item) => <article key={item.id} className="p-4"><div className="flex items-start justify-between gap-2"><div><p className="text-sm font-semibold">{item.vendor || "No vendor"}</p><p className="mt-0.5 text-sm text-text-secondary">{item.name} · {groupNames.get(item.groupId)}{events ? ` · ${eventNames.get(item.eventId ?? "") ?? "Event"}` : ""}</p></div><BudgetStatusBadge status={paymentStatus(item)} /></div><div className="mt-3 grid grid-cols-2 gap-3 text-sm"><div><p className="text-text-tertiary">Booked amount</p><p className="mt-0.5 font-semibold tabular-nums">{formatBudgetMoney(item.budgeted, currency)}</p></div><div><p className="text-text-tertiary">Paid</p><p className="mt-0.5 font-medium tabular-nums">{formatBudgetMoney(item.paid, currency)}</p></div><div><p className="text-text-tertiary">Balance</p><p className="mt-0.5 font-medium tabular-nums">{formatBudgetMoney(itemBalance(item), currency)}</p></div><div><p className="text-text-tertiary">Next payment</p><p className="mt-0.5 font-medium">{installmentPayments(item).find((entry) => entry.due > 0)?.dueDate ?? item.paymentDate ?? "—"}</p></div></div><button type="button" onClick={() => onView(item)} className="mt-3 text-sm font-semibold text-brand-primary">{events ? "Open event budget" : "View booking"}</button></article>)}</div></div>;
}
