import type { BudgetGroup, BudgetItem } from "@/lib/planner-budget";
import type { BudgetTemplate } from "@/lib/event-setup-templates";

export const budgetNameKey = (name: string) => name.normalize("NFKC").trim().toLocaleLowerCase().replace(/\s+/g, " ");

export function budgetTemplateSections(template: BudgetTemplate, eventId: string | null, currency: string, guests: number, estimates: boolean, existingGroups: BudgetGroup[], existingItems: BudgetItem[]) {
  const groups = existingGroups.filter((group) => group.eventId === eventId && group.currency === currency);
  const sections = new Map<string, { name: string; groupId?: string; items: { name: string; amount: number; alreadyAdded: boolean }[] }>();
  template.items.forEach((item) => {
    const key = budgetNameKey(item.group);
    const group = groups.find((entry) => budgetNameKey(entry.name) === key);
    const section = sections.get(key) ?? { name: item.group, groupId: group?.id, items: [] };
    section.items.push({ name: item.name, amount: estimates ? Math.round((item.base + item.perGuest * guests) * 100) / 100 : 0, alreadyAdded: Boolean(group && existingItems.some((entry) => entry.groupId === group.id && entry.currency === currency && budgetNameKey(entry.name) === budgetNameKey(item.name))) });
    sections.set(key, section);
  });
  return [...sections.values()];
}

/** Additive only: reuse groups, skip existing items, and never replace payments. */
export function planBudgetTemplate(template: BudgetTemplate, selected: string[], eventId: string | null, currency: string, guests: number, estimates: boolean, existingGroups: BudgetGroup[], existingItems: BudgetItem[]) {
  if (estimates && currency !== "NGN") throw new Error("Template estimates are in NGN. Use zero starting amounts for other currencies.");
  if (estimates && (!Number.isSafeInteger(guests) || guests <= 0)) throw new Error("Enter a whole guest count above zero.");
  const sections = budgetTemplateSections(template, eventId, currency, guests, estimates, existingGroups, existingItems);
  const chosen = new Set(selected.map(budgetNameKey));
  if (!chosen.size || [...chosen].some((name) => !sections.some((section) => budgetNameKey(section.name) === name))) throw new Error("Select at least one group from this template.");
  const groups: BudgetGroup[] = [], items: BudgetItem[] = [], groupIds: string[] = [];
  const createdAt = new Date().toISOString();
  sections.filter((section) => chosen.has(budgetNameKey(section.name))).forEach((section) => {
    const groupId = section.groupId ?? crypto.randomUUID();
    groupIds.push(groupId);
    if (!section.groupId) groups.push({ id: groupId, name: section.name, eventId, currency, createdAt });
    section.items.filter((item) => !item.alreadyAdded).forEach((item) => {
      if (!Number.isFinite(item.amount) || item.amount < 0 || !Number.isSafeInteger(Math.round(item.amount * 100))) throw new Error("The template estimate is too large. Reduce the guest count.");
      items.push({ id: crypto.randomUUID(), groupId, eventId, name: item.name, vendor: "", vendorStatus: "not-sourced", currency, budgeted: item.amount, pricedAs: "flat-fee", quantity: 1, unitPrice: item.amount, invoiced: 0, paid: 0, paymentDate: "", notes: `Starting item from ${template.name}. Review the scope and price before booking.`, status: "unpaid", installments: [], attachments: [], payments: [], createdAt });
    });
  });
  return { groups, items, groupIds };
}
