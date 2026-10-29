"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Wallet } from "@/components/ui/icons";
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
  const selectedPayment = payments.find(payment => payment.id === selectedId);
  const selected = items.find((item) => item.id === selectedPayment?.itemId && item.status !== "cancelled");
  return <section aria-labelledby="event-upcoming-payments" className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-border-subtle bg-white">
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle p-5 sm:p-6"><div><h2 id="event-upcoming-payments" className="text-lg font-semibold">Next 3 payments</h2><p className="mt-1 text-sm text-text-secondary">Record payments here as they’re made. No money is sent.</p></div><Link href={`/planner/events/${encodeURIComponent(event.id)}?section=budget&tab=payments`} className="inline-flex min-h-10 items-center gap-1.5 text-sm font-semibold text-brand-primary hover:underline focus-visible:outline-2 focus-visible:outline-brand-primary">View payments<ArrowRight className="size-3.5" aria-hidden="true" /></Link></header>
    {payments.length ? <ul className="divide-y divide-border-subtle">{payments.slice(0, 3).map((payment) => <li key={payment.id} className="relative flex flex-wrap items-center gap-3 p-5 sm:p-6"><button type="button" aria-label={`Open payment: ${payment.title}, due ${formatEventDate(payment.date)}`} onClick={() => setSelectedId(payment.id)} className="flex min-w-0 flex-1 items-center gap-3 rounded-lg text-left after:absolute after:inset-0 after:rounded-lg after:content-[''] focus-visible:outline-2 focus-visible:outline-brand-primary"><span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#fcf2e3] text-[#976e38]"><Wallet className="size-5" aria-hidden="true" /></span><span className="min-w-0 flex-1"><span className="block break-words text-sm font-semibold">{payment.title}</span><span className="mt-1 block text-sm text-text-secondary">{payment.vendor || "Vendor not added"} · {formatBudgetMoney(payment.amount, payment.currency)}</span><span className={`mt-1 block text-xs ${today && payment.date < today ? "font-semibold text-error" : "text-text-secondary"}`}>{today && payment.date < today ? "Overdue" : "Due"} {formatEventDate(payment.date)}</span></span></button><Button type="button" variant="outline" size="sm" className="relative z-10" onClick={() => setSelectedId(payment.id)} aria-label={`Record payment: ${payment.title}, due ${formatEventDate(payment.date)}`}>Record payment</Button></li>)}</ul> : <div className="flex min-h-40 flex-col items-center justify-center gap-3 p-6 text-center"><Wallet className="size-7 text-text-tertiary" aria-hidden="true" /><p className="text-sm font-medium text-text-secondary">No upcoming payments</p><p className="max-w-md text-sm leading-6 text-text-secondary">Add a due date or installment to a booked budget item to track it here.</p></div>}
    {selected && !event.cancelledAt && <LogBudgetPayment key={selectedPayment?.id} item={selected} initialAmount={selectedPayment?.amount} onClose={() => setSelectedId(null)} onSaved={() => setSelectedId(null)} />}
  </section>;
}
