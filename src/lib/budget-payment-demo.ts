import type { PlannerEvent } from "./planner-events";
import { budgetToday, type BudgetGroup, type BudgetItem } from "./planner-budget";
import { upcomingBudgetPaymentRows } from "./budget-payment-rows";

export type BudgetPaymentDemo = { groups: BudgetGroup[]; items: BudgetItem[] };

/** Presentation-only examples requested for the jjjj review event. Never persisted. */
export function jjjjBudgetPaymentDemo(event: Pick<PlannerEvent, "id" | "name" | "cancelledAt">, currency: string, realItems: BudgetItem[], today = budgetToday()): BudgetPaymentDemo | null {
  if (event.name.trim().toLowerCase() !== "jjjj" || event.cancelledAt || currency !== "NGN" || upcomingBudgetPaymentRows(realItems).length) return null;
  const due = (offset: number) => { const date = new Date(`${today}T12:00:00Z`); date.setUTCDate(date.getUTCDate() + offset); return date.toISOString().slice(0, 10); };
  const prefix = `demo:jjjj-payments:${event.id}`;
  const examples = [
    { name: "Venue rentals", group: "Venue & Rentals", vendor: "The Grand Hall", budgeted: 1800000, paid: 450000, schedule: [{ percentage: 50, offset: -3 }, { percentage: 50, offset: 10 }] },
    { name: "Stage build", group: "Decor & Styling", vendor: "Bloom & Co Decor", budgeted: 750000, paid: 375000, schedule: [{ percentage: 100, offset: 3 }] },
    { name: "Catering", group: "Catering & Drinks", vendor: "Savour Catering", budgeted: 1200000, paid: 1200000, schedule: [{ percentage: 100, offset: -1 }] },
    { name: "DJ & sound", group: "Music & Entertainment", vendor: "Pulse Sound & DJ", budgeted: 500000, paid: 0, schedule: [{ percentage: 100, offset: 21 }] },
  ];
  return {
    groups: examples.map((example, index) => ({ id: `${prefix}:group:${index}`, name: example.group, eventId: event.id, currency, createdAt: `${today}T12:00:00Z` })),
    items: examples.map((example, index) => ({
      id: `${prefix}:item:${index}`, groupId: `${prefix}:group:${index}`, eventId: event.id,
      name: example.name, vendor: example.vendor, vendorStatus: "booked", currency,
      budgeted: example.budgeted, invoiced: example.budgeted, paid: example.paid,
      pricedAs: "flat-fee", quantity: 1, unitPrice: example.budgeted,
      paymentDate: "", notes: "", status: "unpaid",
      installments: example.schedule.map((line, lineIndex) => ({ id: `${prefix}:line:${index}:${lineIndex}`, percentage: line.percentage, dueDate: due(line.offset) })),
      attachments: [], payments: [], createdAt: `${today}T12:00:00Z`,
    })),
  };
}
