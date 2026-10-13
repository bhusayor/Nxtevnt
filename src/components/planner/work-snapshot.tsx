"use client";

import Link from "next/link";
import { ArrowUpRight, CalendarRange, ClipboardCheck, MessageSquareText, Wallet } from "@/components/ui/icons";
import { installmentPayments, itemBalance, legacyBudgetItems, useBudgetStore } from "@/lib/planner-budget";
import { isEventCancelled, usePlannerEvents } from "@/lib/planner-events";

export function WorkSnapshot() {
  const events = usePlannerEvents();
  const budgetStore = useBudgetStore();
  const activeEvents = events.filter((event) => !isEventCancelled(event));
  const openTasks = activeEvents.flatMap((event) => event.sections.tasks).filter((task) => !task.done).length;
  const activeIds = new Set(activeEvents.map((event) => event.id));
  const today = new Date().toLocaleDateString("sv-SE");
  const vendorPaymentsDue = [...budgetStore.items, ...legacyBudgetItems(events, budgetStore)].filter((item) => item.eventId && activeIds.has(item.eventId) && item.vendorStatus === "booked" && itemBalance(item) > 0 && item.status !== "cancelled").reduce((count, item) => {
    if (item.installments.length) return count + installmentPayments(item).filter((payment) => payment.due > 0 && payment.dueDate <= today).length;
    return count + (item.paymentDate && item.paymentDate <= today ? 1 : 0);
  }, 0);
  const openDecisions = activeEvents.flatMap((event) => event.sections.decisions).filter((decision) => !decision.done).length;
  const taskEvent = activeEvents.find((event) => event.sections.tasks.some((task) => !task.done)) ?? activeEvents[0];
  const decisionEvent = activeEvents.find((event) => event.sections.decisions.some((decision) => !decision.done)) ?? activeEvents[0];
  const items = [
    { label: "Events", value: String(events.length), detail: "In your workspace", href: "/planner/events", icon: CalendarRange, surface: "bg-[#edf4ee] border-[#e0ebe2]", ink: "text-[#40654e]", iconTone: "bg-white/75" },
    { label: "Open tasks", value: String(openTasks), detail: "Across your events", href: taskEvent ? `/planner/events/${taskEvent.id}?section=tasks` : "/planner/events", icon: ClipboardCheck, surface: "bg-[#f1eef9] border-[#e8e2f2]", ink: "text-[#705987]", iconTone: "bg-white/75" },
    { label: "Vendor payments due", value: String(vendorPaymentsDue), detail: "Unpaid and due today or earlier", href: "/planner/budget", icon: Wallet, surface: "bg-[#faf1e5] border-[#f0e6d6]", ink: "text-[#8a6537]", iconTone: "bg-white/75" },
    { label: "Decisions", value: String(openDecisions), detail: "Waiting on a call", href: decisionEvent ? `/planner/events/${decisionEvent.id}?section=decisions` : "/planner/events", icon: MessageSquareText, surface: "bg-[#eaf2f8] border-[#dfe9f1]", ink: "text-[#446d8b]", iconTone: "bg-white/75" },
  ];
  return (
    <section className="grid grid-cols-2 gap-3 xl:grid-cols-4 xl:gap-4" aria-label="Work snapshot">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <Link key={item.label} href={item.href} className={`group rounded-xl border p-4 transition-[border-color,box-shadow] hover:border-border-strong/40 hover:shadow-[var(--shadow-xs)] sm:p-5 ${item.surface}`}>
            <div className="flex items-center justify-between gap-2"><span className={`flex size-9 items-center justify-center rounded-lg ${item.iconTone} ${item.ink}`}><Icon className="size-[18px]" weight="bold" aria-hidden="true" /></span><ArrowUpRight className={`size-4 opacity-50 transition-opacity group-hover:opacity-100 ${item.ink}`} aria-hidden="true" /></div>
            <div className="mt-3 flex flex-wrap items-baseline gap-x-2.5 gap-y-1"><strong className="text-[1.75rem] font-semibold leading-none tracking-[-0.045em] text-text-primary">{item.value}</strong><span className="text-xs font-medium text-text-secondary">{item.label}</span></div>
            <p className="mt-2 text-[0.6875rem] leading-4 text-text-secondary">{item.detail}</p>
          </Link>
        );
      })}
    </section>
  );
}
