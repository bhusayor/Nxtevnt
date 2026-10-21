"use client";

import type { DashboardEvent } from "@/components/planner/overview-data";
import { formatBudgetMoney, legacyBudgetItems, useBudgetStore } from "@/lib/planner-budget";
import { usePlannerEvents } from "@/lib/planner-events";

export function EventCardProgress({ event }: { event: DashboardEvent }) {
  const events = usePlannerEvents();
  const store = useBudgetStore();
  const savedEvent = events.find((entry) => entry.id === event.slug);
  const items = [...store.items, ...legacyBudgetItems(events, store)].filter((item) => item.eventId === event.slug && item.status !== "cancelled");
  const currency = savedEvent?.currency || "NGN";
  const currencyItems = items.filter((item) => item.currency === currency);
  const total = currencyItems.length ? currencyItems.reduce((sum, item) => sum + Math.max(item.budgeted, item.invoiced), 0) : Number(savedEvent?.budget || 0);
  const paid = currencyItems.reduce((sum, item) => sum + item.paid, 0);
  const booked = items.filter((item) => item.vendorStatus === "booked").length;
  const otherCurrencies = [...new Set(items.filter((item) => item.currency !== currency).map((item) => item.currency))];
  const money = (value: number) => new Intl.NumberFormat("en-NG", { style: "currency", currency, notation: "compact", maximumFractionDigits: 1 }).format(value);
  const rows = [
    { label: "Tasks", value: event.tasks, full: `${event.tasks} complete`, progress: event.progress, color: "bg-[#648dba]" },
    { label: otherCurrencies.length ? `Paid · ${currency}` : "Paid", value: `${money(paid)} of ${money(total)}`, full: `${formatBudgetMoney(paid, currency)} paid of ${formatBudgetMoney(total, currency)}${otherCurrencies.length ? `. Other currencies tracked separately: ${otherCurrencies.join(", ")}.` : ""}`, progress: total ? paid / total * 100 : 0, color: "bg-[#47886e]" },
    { label: "Booked", value: `${booked} of ${items.length}`, full: `${booked} of ${items.length} budget items have a booked vendor`, progress: items.length ? booked / items.length * 100 : 0, color: "bg-[#d9a04c]" },
  ];
  return <div className="mt-3 space-y-3">{rows.map((row) => <div key={row.label}><div className="mb-1.5 flex items-center justify-between gap-2 text-[0.6875rem]"><span className="text-text-tertiary">{row.label}</span><span className="font-medium tabular-nums text-text-primary" title={row.full}>{row.value}</span></div><div role="progressbar" aria-label={`${event.name}: ${row.label}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(Math.max(0, Math.min(100, row.progress)))} aria-valuetext={row.full} className="h-1.5 overflow-hidden rounded-full bg-[#edf0ee]"><div className={`h-full rounded-full motion-safe:transition-[width] motion-safe:duration-500 ${row.color}`} style={{ width: `${Math.max(0, Math.min(100, row.progress))}%` }} /></div></div>)}</div>;
}
