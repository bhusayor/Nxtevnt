import type { PlannerEvent } from "./planner-events";
import type { BudgetItem } from "./planner-budget";

export function perGuestItemCount(event: PlannerEvent, items: BudgetItem[]) {
  return items.filter((item) => item.eventId === event.id && item.pricedAs === "per-guest" && item.status !== "cancelled").length + (event.budgetProposals ?? []).reduce((sum, proposal) => sum + proposal.groups.reduce((total, group) => total + group.items.filter((item) => item.pricedAs === "per-guest").length, 0), 0);
}

export function repriceProposalGuestItems(event: PlannerEvent, guestCount: number): PlannerEvent {
  if (!Number.isSafeInteger(guestCount) || guestCount <= 0) throw new Error("Set a whole-number guest count above zero before updating per-guest amounts.");
  if (!event.budgetProposals) return event;
  return { ...event, budgetProposals: event.budgetProposals.map((proposal) => {
    if (!proposal.groups.some((group) => group.items.some((item) => item.pricedAs === "per-guest"))) return proposal;
    if (proposal.groups.some((group) => group.items.some((item) => item.pricedAs === "per-guest" && (!Number.isFinite(item.unitPrice) || item.unitPrice < 0 || !Number.isSafeInteger(Math.round(item.unitPrice * guestCount * 100)))))) throw new Error(`Check the per-guest prices in ${proposal.name} before updating the guest count.`);
    return { ...proposal, status: "draft", updatedAt: new Date().toISOString(), groups: proposal.groups.map((group) => ({ ...group, items: group.items.map((item) => item.pricedAs === "per-guest" ? { ...item, quantity: guestCount } : item) })) };
  }) };
}
