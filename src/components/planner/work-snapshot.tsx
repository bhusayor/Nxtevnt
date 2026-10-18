"use client";

import { CalendarRange, ClipboardCheck, MessageSquareText, Wallet } from "@/components/ui/icons";
import { OverviewMetricCard } from "@/components/planner/overview-metric-card";
import { installmentPayments, itemBalance, legacyBudgetItems, useBudgetStore } from "@/lib/planner-budget";
import { isEventCancelled, isTaskActive, isTaskComplete, usePlannerEvents } from "@/lib/planner-events";

export function WorkSnapshot() {
  const events = usePlannerEvents();
  const budgetStore = useBudgetStore();
  const activeEvents = events.filter((event) => !isEventCancelled(event));
  const openTasks = activeEvents.flatMap((event) => event.sections.tasks).filter((task) => isTaskActive(task) && !isTaskComplete(task)).length;
  const activeIds = new Set(activeEvents.map((event) => event.id));
  const today = new Date().toLocaleDateString("sv-SE");
  const vendorPaymentsDue = [...budgetStore.items, ...legacyBudgetItems(events, budgetStore)].filter((item) => item.eventId && activeIds.has(item.eventId) && item.vendorStatus === "booked" && itemBalance(item) > 0 && item.status !== "cancelled").reduce((count, item) => {
    if (item.installments.length) return count + installmentPayments(item).filter((payment) => payment.due > 0 && payment.dueDate <= today).length;
    return count + (item.paymentDate && item.paymentDate <= today ? 1 : 0);
  }, 0);
  const openDecisions = activeEvents.flatMap((event) => event.sections.decisions).filter((decision) => !decision.done).length;
  const items = [
    { label: "Events", value: events.length, detail: "In your workspace", icon: CalendarRange, tone: "sage" as const },
    { label: "Open tasks", value: openTasks, detail: "Across your events", icon: ClipboardCheck, tone: "lilac" as const },
    { label: "Vendor payments due", value: vendorPaymentsDue, detail: "Unpaid and due today or earlier", icon: Wallet, tone: "amber" as const },
    { label: "Decisions", value: openDecisions, detail: "Waiting on a call", icon: MessageSquareText, tone: "blue" as const },
  ];
  return (
    <section className="grid grid-cols-2 gap-3 xl:grid-cols-4 xl:gap-4" aria-label="Work snapshot">
      {items.map((item) => <OverviewMetricCard key={item.label} {...item} />)}
    </section>
  );
}
