import type { PlannerEvent } from "./planner-events";
import type { BudgetGroup, BudgetItem } from "./planner-budget";
import type { PlannerVendorReply } from "./planner-vendor-replies";

export type VendorQuoteDestination = { groupId: string; groupName: string; itemId: string; itemName: string; amount: number };

export function vendorQuoteBudgetChange(reply: PlannerVendorReply, event: PlannerEvent, groups: readonly BudgetGroup[], items: readonly BudgetItem[], destination: VendorQuoteDestination, now = new Date().toISOString()) {
  if (reply.eventId !== event.id) throw Error("This reply belongs to a different event.");
  const currency = event.currency || "NGN";
  const amount = destination.amount;
  if (!Number.isFinite(amount) || amount <= 0 || Math.abs(amount * 100 - Math.round(amount * 100)) > 0.001) throw Error("Enter a quoted amount above zero, with up to two decimal places.");
  if (!reply.vendor.trim()) throw Error("This reply has no vendor to attach to the budget item.");
  const group = destination.groupId === "new"
    ? { id: crypto.randomUUID(), name: destination.groupName.trim(), eventId: event.id, currency, createdAt: now }
    : groups.find(entry => entry.id === destination.groupId && entry.eventId === event.id && entry.currency === currency);
  if (!group || !group.name || group.name.length > 100) throw Error("Choose a budget group or name a new one.");
  const existing = destination.itemId === "new" ? undefined : items.find(entry => entry.id === destination.itemId && entry.groupId === group.id && entry.eventId === event.id);
  if (destination.itemId !== "new" && !existing) throw Error("Choose an item in this budget group.");
  const name = existing?.name || destination.itemName.trim();
  if (!name || name.length > 120) throw Error("Give the budget item a name.");
  if (existing && (existing.invoiced > amount || existing.paid > amount)) throw Error("This quote is below amounts already invoiced or paid. Edit that item directly.");
  const quoteAttachments = (reply.attachments ?? []).filter(file => file.id && file.name && file.size > 0);
  const attachments = [...(existing?.attachments ?? [])];
  for (const attachment of quoteAttachments) if (!attachments.some(file => file.id === attachment.id)) attachments.push(attachment);
  const item: BudgetItem = existing ? {
    ...existing, vendor: reply.vendor.trim(), vendorStatus: "sourcing", budgeted: amount,
    pricedAs: "flat-fee", quantity: 1, unitPrice: amount,
    attachments,
  } : {
    id: `vendor-quote:${reply.id}`, groupId: group.id, eventId: event.id, currency, name,
    vendor: reply.vendor.trim(), vendorStatus: "sourcing", budgeted: amount,
    pricedAs: "flat-fee", quantity: 1, unitPrice: amount, invoiced: 0, paid: 0,
    paymentDate: "", notes: "", status: "unpaid", installments: [], attachments, payments: [], createdAt: now,
  };
  return { groups: destination.groupId === "new" ? [group] : [], items: [item] };
}
