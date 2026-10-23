"use client";

import { useState } from "react";
import { CalendarDays, CreditCard } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { formatEventDate, type PlannerEvent } from "@/lib/planner-events";
import { budgetToday, formatBudgetMoney, type BudgetGroup, type BudgetItem } from "@/lib/planner-budget";
import { budgetPaymentProgress, scheduledPaymentStatus, upcomingBudgetPaymentRows } from "@/lib/budget-payment-rows";
import { BudgetStatusBadge } from "./budget-status-badges";

type Props = { items: BudgetItem[]; groups: BudgetGroup[]; currency: string; events?: readonly PlannerEvent[]; onView: (item: BudgetItem) => void; onPay?: (item: BudgetItem, amount: number) => void; today?: string; defaultShowAll?: boolean; showControls?: boolean; includePaid?: boolean };

export function PaymentProgress({ item, currency }: { item: BudgetItem; currency: string }) {
  const { balance, paid, total, percent } = budgetPaymentProgress(item);
  return <div className="min-w-44 space-y-2"><p className="text-sm text-text-secondary">Balance: <span className="font-semibold tabular-nums text-text-primary">{formatBudgetMoney(balance, currency)}</span></p><div role="progressbar" aria-label={`Payment progress for ${item.name}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent} aria-valuetext={`${percent}% paid; ${formatBudgetMoney(paid, currency)} of ${formatBudgetMoney(total, currency)}`} className="h-1.5 overflow-hidden rounded-full bg-[#f0eeea]"><span className="block h-full rounded-full bg-[#c99b4f]" style={{ width: `${percent}%` }} /></div><p className="text-xs tabular-nums text-text-tertiary">{percent}% paid · {formatBudgetMoney(paid, currency)}</p></div>;
}

export function UpcomingPayments({ items, groups, currency, events, onView, onPay, today = budgetToday(), defaultShowAll = false, showControls = true, includePaid = false }: Props) {
  const [showAll, setShowAll] = useState(defaultShowAll);
  const groupNames = new Map(groups.map((group) => [group.id, group.name]));
  const eventDetails = new Map(events?.map((event) => [event.id, event]) ?? []);
  const nextWeek = new Date(`${today}T12:00:00Z`); nextWeek.setUTCDate(nextWeek.getUTCDate() + 7);
  const weekEnd = nextWeek.toISOString().slice(0, 10);
  const payments = upcomingBudgetPaymentRows(items, { includePaid });
  const sections = showAll ? [{ label: "All payments", items: payments }] : [
    { label: "Overdue", items: payments.filter((entry) => entry.date < today) },
    { label: "This week", items: payments.filter((entry) => entry.date >= today && entry.date <= weekEnd) },
    { label: "Later", items: payments.filter((entry) => entry.date > weekEnd) },
  ];
  const headers = ["Budget item & vendor", "Status", ...(events ? ["Event & date"] : []), "Installment due & date", "Payment progress", "Action"];
  if (!payments.length) return <div className="rounded-xl border border-border-subtle bg-white px-6 py-14 text-center"><CalendarDays className="mx-auto size-8 text-text-tertiary" aria-hidden="true" /><h3 className="mt-3 text-sm font-semibold">No upcoming payments</h3><p className="mt-2 text-sm leading-6 text-text-secondary">Add a payment schedule to a budget item and unpaid installments will appear here.</p></div>;

  return <div className="space-y-5">{showControls && <div className="flex flex-wrap items-center justify-between gap-3"><p className="max-w-2xl text-sm leading-6 text-text-secondary">{onPay ? "Pay opens the Paystack test flow—no money moves. Switch to Log a payment to record money already paid." : "Track scheduled payments and open an event to manage its budget."}</p><Button type="button" variant="ghost" onClick={() => setShowAll((value) => !value)}>{showAll ? "Group by due date" : "Show all payments"}</Button></div>}
    {sections.filter((section) => section.items.length).map((section) => <section key={section.label} aria-label={section.label === "All payments" ? section.label : `${section.label} payments`} className="overflow-hidden rounded-xl border border-border-subtle bg-white">
      <h3 className="border-b border-border-subtle bg-[#fafbfa] px-5 py-3 text-sm font-semibold">{section.label} <span className="ml-1 font-normal text-text-tertiary">{section.items.length}</span></h3>
      <div className="hidden overflow-x-auto md:block"><table className="w-full min-w-[840px] text-left text-sm"><caption className="sr-only">Scheduled payments with installment due dates, outstanding balances and payment progress.</caption><thead className="border-b border-border-subtle bg-[#fcfcfc] text-xs font-semibold uppercase tracking-wider text-text-tertiary"><tr>{headers.map((heading) => <th key={heading} scope="col" className="px-5 py-3.5">{heading}</th>)}</tr></thead><tbody className="divide-y divide-border-subtle">{section.items.map((entry) => {
        const event = eventDetails.get(entry.item.eventId ?? "");
        return <tr key={entry.key} className="hover:bg-[#fcfdfc]"><td className="min-w-52 px-5 py-5"><button type="button" onClick={() => onView(entry.item)} className="break-words text-left text-sm font-semibold leading-6 hover:text-brand-primary hover:underline">{entry.item.name}</button><p className="mt-1 break-words text-sm text-text-secondary">{entry.item.vendor || "No vendor assigned"}</p><p className="mt-1 text-xs text-text-tertiary">{groupNames.get(entry.item.groupId) || "Budget item"}</p></td><td className="px-5 py-5"><BudgetStatusBadge status={scheduledPaymentStatus(entry, today)} /></td>{events && <td className="min-w-40 px-5 py-5"><p className="text-sm font-medium">{event?.name || "Event unavailable"}</p><p className="mt-1 text-sm text-text-secondary">{event?.date ? formatEventDate(event.date, { day: "numeric", month: "short", year: "numeric" }) : "Date not set"}</p></td>}<td className="min-w-44 px-5 py-5"><p className="text-base font-semibold tabular-nums">{formatBudgetMoney(entry.amount, currency)}</p><p className={`mt-1 text-sm leading-6 ${!entry.completed && entry.date < today ? "font-medium text-error" : "text-text-secondary"}`}>{entry.completed ? "Scheduled" : "Due"} {formatEventDate(entry.date, { day: "numeric", month: "short", year: "numeric" })}</p><p className="mt-1 text-xs text-text-tertiary">{entry.label}</p></td><td className="px-5 py-5"><PaymentProgress item={entry.item} currency={currency} /></td><td className="px-5 py-5">{onPay && !entry.completed ? <Button type="button" variant="outline" aria-label={`Pay ${entry.label} for ${entry.item.name}`} leadingIcon={<CreditCard className="size-4" aria-hidden="true" />} onClick={() => onPay(entry.item, entry.amount)}>Pay</Button> : <button type="button" onClick={() => onView(entry.item)} className="min-h-10 whitespace-nowrap text-sm font-semibold text-brand-primary hover:underline">{events ? "Open event" : "View details"}</button>}</td></tr>;
      })}</tbody></table></div>
      <div className="divide-y divide-border-subtle md:hidden">{section.items.map((entry) => {
        const event = eventDetails.get(entry.item.eventId ?? "");
        return <article key={entry.key} className="space-y-4 p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0 flex-1"><button type="button" onClick={() => onView(entry.item)} className="break-words text-left text-sm font-semibold leading-6 hover:text-brand-primary">{entry.item.name}</button><p className="mt-1 text-sm text-text-secondary">{entry.item.vendor || "No vendor assigned"}</p></div><BudgetStatusBadge status={scheduledPaymentStatus(entry, today)} /></div>{events && <p className="text-sm text-text-secondary">{event?.name || "Event unavailable"}{event?.date ? ` · ${formatEventDate(event.date)}` : ""}</p>}<div><p className="text-xs text-text-tertiary">{entry.label}{!entry.completed && " due"}</p><p className="mt-1 text-base font-semibold tabular-nums">{formatBudgetMoney(entry.amount, currency)}</p><p className={`mt-1 text-sm ${!entry.completed && entry.date < today ? "font-medium text-error" : "text-text-secondary"}`}>{entry.completed ? "Scheduled" : "Due"} {formatEventDate(entry.date, { day: "numeric", month: "short", year: "numeric" })}</p></div><PaymentProgress item={entry.item} currency={currency} />{onPay && !entry.completed ? <Button type="button" variant="outline" aria-label={`Pay ${entry.label} for ${entry.item.name}`} leadingIcon={<CreditCard className="size-4" aria-hidden="true" />} onClick={() => onPay(entry.item, entry.amount)}>Pay</Button> : <button type="button" onClick={() => onView(entry.item)} className="min-h-10 text-sm font-semibold text-brand-primary">{events ? "Open event budget" : "View details"}</button>}</article>;
      })}</div>
    </section>)}
  </div>;
}
