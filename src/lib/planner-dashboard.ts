import { installmentPayments, itemBalance, type BudgetItem } from "@/lib/planner-budget";
import { isEventCancelled, type PlannerEvent } from "@/lib/planner-events";

export type DashboardPeriod = { label: string; start: string; end: string };
export const dateKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
export const monthKey = (date: Date) => dateKey(date).slice(0, 7);
export const inPeriod = (date: string, period: DashboardPeriod) => Boolean(date && (!period.start || date >= period.start) && (!period.end || date <= period.end));

export function dashboardPeriod(preset: string, today = new Date()): DashboardPeriod {
  const year = today.getFullYear();
  const month = today.getMonth();
  if (preset === "all") return { label: "All time", start: "", end: "" };
  if (preset === "week") {
    const first = new Date(year, month, today.getDate() - (today.getDay() + 6) % 7);
    return { label: "This week", start: dateKey(first), end: dateKey(new Date(first.getFullYear(), first.getMonth(), first.getDate() + 6)) };
  }
  if (preset === "year") return { label: "This year", start: `${year}-01-01`, end: `${year}-12-31` };
  if (preset === "quarter") {
    const first = Math.floor(month / 3) * 3;
    return { label: "This quarter", start: dateKey(new Date(year, first, 1)), end: dateKey(new Date(year, first + 3, 0)) };
  }
  return { label: "This month", start: dateKey(new Date(year, month, 1)), end: dateKey(new Date(year, month + 1, 0)) };
}

export function dashboardPayments(events: readonly PlannerEvent[], items: BudgetItem[]) {
  const active = new Map(events.filter((event) => !isEventCancelled(event)).map((event) => [event.id, event]));
  return items.flatMap((item) => {
    const event = item.eventId ? active.get(item.eventId) : undefined;
    if (!event || item.vendorStatus !== "booked" || item.status === "cancelled" || itemBalance(item) <= 0) return [];
    const payments = item.installments.length ? installmentPayments(item).filter((payment) => payment.due > 0).map((payment) => ({ id: payment.id, date: payment.dueDate, amount: payment.due })) : item.paymentDate ? [{ id: "balance", date: item.paymentDate, amount: itemBalance(item) }] : [];
    return payments.map((payment) => ({ ...payment, id: `${item.id}:${payment.id}`, itemId: item.id, title: item.name, vendor: item.vendor, event, currency: item.currency }));
  }).sort((a, b) => a.date.localeCompare(b.date));
}
