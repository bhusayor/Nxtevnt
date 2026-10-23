"use client";

import { useState } from "react";
import { Wallet } from "@/components/ui/icons";
import { LogBudgetPayment } from "@/components/planner/budget/log-budget-payment";
import { Button } from "@/components/ui/button";
import { legacyBudgetItems, formatBudgetMoney, useBudgetStore } from "@/lib/planner-budget";
import { dashboardPayments } from "@/lib/planner-dashboard";
import { formatEventDate, type PlannerEvent } from "@/lib/planner-events";

export function EventUpcomingPayments({ event, today }: { event: PlannerEvent; today: string }) {
  const store = useBudgetStore();
  const items = [...store.items, ...legacyBudgetItems([event], store)];
  const payments = dashboardPayments([event], items);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = items.find((item) => item.id === selectedId && item.status !== "cancelled");
  const [expanded, setExpanded] = useState(false);
  return <section aria-labelledby="event-upcoming-payments" className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-border-subtle bg-white">
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle p-5 sm:p-6"><div><h2 id="event-upcoming-payments" className="text-lg font-semibold">Upcoming payments</h2><p className="mt-1 text-sm text-text-secondary">Record payments here as they’re made. No money is sent.</p></div>{payments.length > 3 && <button type="button" onClick={() => setExpanded(!expanded)} className="min-h-10 text-sm font-semibold text-brand-primary hover:underline">{expanded ? "Show less" : `See all ${payments.length}`}</button>}</header>
    {payments.length ? <ul className="divide-y divide-border-subtle">{payments.slice(0, expanded ? undefined : 3).map((payment) => <li key={payment.id} className="flex flex-wrap items-center gap-3 p-5 sm:p-6"><span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#fcf2e3] text-[#976e38]"><Wallet className="size-5" aria-hidden="true" /></span><div className="min-w-0 flex-1"><p className="break-words text-sm font-semibold">{payment.title}</p><p className="mt-1 text-sm text-text-secondary">{payment.vendor || "Vendor not added"} · {formatBudgetMoney(payment.amount, payment.currency)}</p><p className={`mt-1 text-xs ${today && payment.date < today ? "font-semibold text-error" : "text-text-secondary"}`}>{today && payment.date < today ? "Overdue" : "Due"} {formatEventDate(payment.date)}</p></div><Button type="button" variant="outline" size="sm" onClick={() => setSelectedId(payment.itemId)} aria-label={`Record payment: ${payment.title}`}>Record payment</Button></li>)}</ul> : <div className="flex min-h-40 flex-col items-center justify-center gap-3 p-6 text-center"><Wallet className="size-7 text-text-tertiary" aria-hidden="true" /><p className="text-sm font-medium text-text-secondary">No upcoming payments</p><p className="max-w-md text-sm leading-6 text-text-secondary">Add a due date or installment to a booked budget item to track it here.</p></div>}
    {selected && !event.cancelledAt && <LogBudgetPayment key={selected.id} item={selected} onClose={() => setSelectedId(null)} onSaved={() => setSelectedId(null)} />}
  </section>;
}
