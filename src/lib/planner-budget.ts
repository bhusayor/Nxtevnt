"use client";

import { useSyncExternalStore } from "react";
import type { PlannerEvent } from "@/lib/planner-events";
import type { PricedAs } from "@/lib/budget-pricing";

export type PaymentStatus = "unpaid" | "upcoming" | "partially-paid" | "paid" | "overdue" | "cancelled";
// Retain the two legacy values when reading older budgets and spreadsheets.
export type BudgetStatus = PaymentStatus | "not-started" | "quoted";
export type VendorStatus = "not-sourced" | "sourcing" | "booked";
export type BudgetPayment = { id: string; amount: number; date: string; method: "bank-transfer" | "cash" | "card" | "other"; reference: string; note: string; createdAt: string; receipt?: BudgetAttachment };
export type BudgetInstallment = { id: string; percentage: number; dueDate: string };
export type BudgetAttachment = { id: string; name: string; type: string; size: number; category?: "document" | "invoice" };
export type BudgetGroup = { id: string; name: string; eventId: string | null; currency: string; createdAt: string };
export type BudgetItem = {
  id: string;
  groupId: string;
  eventId: string | null;
  name: string;
  vendor: string;
  vendorStatus: VendorStatus;
  currency: string;
  budgeted: number;
  pricedAs?: PricedAs;
  quantity?: number;
  unitPrice?: number;
  invoiced: number;
  paid: number;
  paymentDate: string;
  notes: string;
  status: BudgetStatus;
  installments: BudgetInstallment[];
  attachments: BudgetAttachment[];
  payments?: BudgetPayment[];
  createdAt: string;
};
export type BudgetStore = { groups: BudgetGroup[]; items: BudgetItem[]; deletedLegacyIds: string[] };

export const budgetGroupNames = [
  "Venue & Rentals", "Catering & Drinks", "Decor & Styling", "Music & Entertainment",
  "Photography & Video", "Attire & Beauty", "Logistics & Transport", "Stationery & Printing",
  "Security", "Accommodation", "Planning & Support", "Miscellaneous",
] as const;

export const currencies = [
  { code: "NGN", label: "NGN — Nigerian Naira" },
  { code: "USD", label: "USD — US Dollar" },
  { code: "GBP", label: "GBP — British Pound" },
  { code: "EUR", label: "EUR — Euro" },
] as const;

export const budgetStatuses: { value: PaymentStatus; label: string }[] = [
  { value: "unpaid", label: "Unpaid" },
  { value: "upcoming", label: "Payment due" }, { value: "partially-paid", label: "Partially paid" },
  { value: "paid", label: "Paid" }, { value: "overdue", label: "Overdue" },
];
export const vendorStatuses: { value: VendorStatus; label: string }[] = [
  { value: "not-sourced", label: "Not sourced" }, { value: "sourcing", label: "Sourcing" }, { value: "booked", label: "Booked" },
];

function normalizeItem(item: BudgetItem, currency: string): BudgetItem {
  const oldStatus = item.status as string;
  return {
    ...item,
    status: oldStatus === "sourcing" || oldStatus === "booked" ? "not-started" : item.status,
    vendorStatus: item.vendorStatus ?? (!item.vendor ? "not-sourced" : oldStatus === "sourcing" ? "sourcing" : ["booked", "upcoming", "partially-paid", "paid", "overdue"].includes(oldStatus) ? "booked" : "not-sourced"),
    currency: item.currency ?? currency,
    installments: Array.isArray(item.installments) ? item.installments : [],
    attachments: Array.isArray(item.attachments) ? item.attachments : [],
    payments: Array.isArray(item.payments) ? item.payments : [],
  };
}

const storageKey = "nxtevnt.planner.budget.v1";
const changedEvent = "nxtevnt:planner-budget-changed";
const empty: BudgetStore = { groups: [], items: [], deletedLegacyIds: [] };
let cachedRaw: string | null | undefined;
let cached: BudgetStore = empty;

function readStore(): BudgetStore {
  if (typeof window === "undefined") return empty;
  let raw: string | null;
  try { raw = window.localStorage.getItem(storageKey); } catch { return empty; }
  if (raw === cachedRaw) return cached;
  cachedRaw = raw;
  try {
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    if (parsed && typeof parsed === "object" && "groups" in parsed && "items" in parsed && Array.isArray(parsed.groups) && Array.isArray(parsed.items)) {
      const groups = parsed.groups as BudgetGroup[];
      const groupCurrencies = new Map(groups.map((group) => [group.id, group.currency]));
      cached = { groups, items: (parsed.items as BudgetItem[]).map((item) => normalizeItem(item, groupCurrencies.get(item.groupId) ?? "NGN")), deletedLegacyIds: "deletedLegacyIds" in parsed && Array.isArray(parsed.deletedLegacyIds) ? parsed.deletedLegacyIds as string[] : [] };
    } else cached = empty;
  } catch { cached = empty; }
  return cached;
}

function subscribe(callback: () => void) {
  window.addEventListener(changedEvent, callback);
  window.addEventListener("storage", callback);
  return () => { window.removeEventListener(changedEvent, callback); window.removeEventListener("storage", callback); };
}

function writeStore(store: BudgetStore) {
  window.localStorage.setItem(storageKey, JSON.stringify(store));
  cachedRaw = undefined;
  window.dispatchEvent(new Event(changedEvent));
}

export function useBudgetStore() {
  return useSyncExternalStore(subscribe, readStore, () => empty);
}

export function addBudgetGroups(groups: BudgetGroup[]) {
  const current = readStore();
  writeStore({ ...current, groups: [...current.groups, ...groups] });
}

export function upsertBudgetItem(item: BudgetItem) {
  const current = readStore();
  writeStore({ ...current, items: current.items.some((entry) => entry.id === item.id) ? current.items.map((entry) => entry.id === item.id ? item : entry) : [...current.items, item] });
}

/** Reprice estimates only. Invoice, paid balance, receipts and schedules are untouched. */
export function repriceBudgetGuestItems(eventId: string, guestCount: number) {
  if (!Number.isSafeInteger(guestCount) || guestCount <= 0) throw new Error("Set a whole-number guest count above zero before updating per-guest amounts.");
  const before = readStore();
  const items = before.items.map((item) => {
    if (item.eventId !== eventId || item.pricedAs !== "per-guest" || item.status === "cancelled") return item;
    const unitPrice = item.unitPrice ?? (item.quantity && item.quantity > 0 ? item.budgeted / item.quantity : NaN);
    const budgeted = Math.round(unitPrice * guestCount * 100) / 100;
    if (!Number.isFinite(unitPrice) || unitPrice < 0 || !Number.isSafeInteger(Math.round(budgeted * 100))) throw new Error(`Check the per-guest price for ${item.name} before updating the guest count.`);
    return { ...item, quantity: guestCount, unitPrice, budgeted };
  });
  if (items.every((item, index) => item === before.items[index])) return () => {};
  writeStore({ ...before, items });
  return () => writeStore(before);
}

function updateCurrentBudgetItem(item: BudgetItem, update: (current: BudgetItem) => BudgetItem) {
  const store = readStore();
  const saved = store.items.find((entry) => entry.id === item.id);
  if (!saved && (!item.id.startsWith("legacy:") || store.deletedLegacyIds.includes(item.id))) throw new Error("This budget item no longer exists. Refresh the budget and try again.");
  const next = update(saved ?? item);
  writeStore({ ...store, items: saved ? store.items.map((entry) => entry.id === next.id ? next : entry) : [...store.items, next] });
  return next;
}

export function setBudgetBookingStatus(item: BudgetItem, status: VendorStatus) {
  if (!vendorStatuses.some((entry) => entry.value === status)) throw new Error("Choose a valid booking status.");
  return updateCurrentBudgetItem(item, (current) => ({ ...current, vendorStatus: status }));
}

export function recordBudgetPayment(item: BudgetItem, payment: BudgetPayment) {
  return updateCurrentBudgetItem(item, (current) => {
    if (current.payments?.some((entry) => entry.id === payment.id)) return current;
    if (current.status === "cancelled") throw new Error("This item is cancelled. Edit the item before logging a payment.");
    if (!Number.isFinite(payment.amount) || payment.amount <= 0 || Math.abs(payment.amount * 100 - Math.round(payment.amount * 100)) > 0.001) throw new Error("Enter a payment amount greater than zero, with up to two decimal places.");
    if (payment.amount > itemBalance(current) + 0.001) throw new Error("This payment is more than the balance left. Check the amount or update the item’s budget or invoice first.");
    const date = new Date(`${payment.date}T12:00:00Z`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(payment.date) || !Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== payment.date || payment.date > budgetToday()) throw new Error("Choose a valid payment date today or earlier.");
    if (!["bank-transfer", "cash", "card", "other"].includes(payment.method) || payment.reference.length > 120 || payment.note.length > 500) throw new Error("Check the payment method, reference and note before saving.");
    if (payment.receipt && (!payment.receipt.id || !payment.receipt.name || payment.receipt.name.length > 255 || !["application/pdf", "image/png", "image/jpeg", "image/webp"].includes(payment.receipt.type) || payment.receipt.size <= 0 || payment.receipt.size > 15 * 1024 * 1024)) throw new Error("Choose a PDF or image receipt up to 15 MB.");
    const next = { ...current, paid: Math.round((current.paid + payment.amount) * 100) / 100, payments: [...(current.payments ?? []), { ...payment, reference: payment.reference.trim(), note: payment.note.trim() }] };
    return { ...next, status: paymentStatus(next) };
  });
}

export function deleteBudgetItem(id: string) {
  const current = readStore();
  writeStore({ ...current, items: current.items.filter((item) => item.id !== id), deletedLegacyIds: id.startsWith("legacy:") ? [...current.deletedLegacyIds, id] : current.deletedLegacyIds });
}

export function deleteBudgetForEvent(eventId: string) {
  const current = readStore();
  const groupIds = new Set(current.groups.filter((group) => group.eventId === eventId).map((group) => group.id));
  writeStore({
    ...current,
    groups: current.groups.filter((group) => group.eventId !== eventId),
    items: current.items.filter((item) => item.eventId !== eventId && !groupIds.has(item.groupId)),
  });
}

export function importBudgetData(groups: BudgetGroup[], items: BudgetItem[]) {
  const current = readStore();
  const upserts = new Map(current.items.map((item) => [item.id, item]));
  for (const item of items) upserts.set(item.id, item);
  writeStore({ ...current, groups: [...current.groups, ...groups], items: [...upserts.values()] });
}

export function legacyBudgetGroups(events: readonly PlannerEvent[]): BudgetGroup[] {
  return events.filter((event) => event.sections.expenses.length > 0).map((event) => ({ id: `legacy:${event.id}:group`, name: "Miscellaneous", eventId: event.id, currency: "NGN", createdAt: event.createdAt }));
}

export function legacyBudgetItems(events: readonly PlannerEvent[], store: BudgetStore): BudgetItem[] {
  const savedIds = new Set(store.items.map((item) => item.id));
  const deletedIds = new Set(store.deletedLegacyIds);
  return events.flatMap((event) => event.sections.expenses.map((expense) => {
    const id = `legacy:${event.id}:${expense.id}`;
    return { id, groupId: `legacy:${event.id}:group`, eventId: event.id, name: expense.title, vendor: "", vendorStatus: "not-sourced" as const, currency: "NGN", budgeted: expense.amount ?? 0, invoiced: 0, paid: 0, paymentDate: "", notes: expense.detail ?? "", status: "not-started" as const, installments: [], attachments: [], createdAt: event.createdAt };
  }).filter((item) => !savedIds.has(item.id) && !deletedIds.has(item.id)));
}

export function budgetContext(events: readonly PlannerEvent[], store: BudgetStore, eventId: string | null, currency: string) {
  const groups = [...store.groups, ...legacyBudgetGroups(events)].filter((group) => group.currency === currency && (eventId === null || group.eventId === eventId));
  const groupIds = new Set(groups.map((group) => group.id));
  const items = [...store.items, ...legacyBudgetItems(events, store)].filter((item) => groupIds.has(item.groupId));
  return { groups, items };
}

export function isBooked(item: BudgetItem) { return item.vendorStatus === "booked"; }

export function formatBudgetMoney(amount: number, currency: string) {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency, minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(amount);
}

export function itemBalance(item: BudgetItem) {
  return Math.max(0, Math.max(item.budgeted, item.invoiced) - item.paid);
}

export function budgetToday() { return new Date().toLocaleDateString("sv-SE", { timeZone: "Africa/Lagos" }); }

export function paymentStatus(item: Pick<BudgetItem, "budgeted" | "invoiced" | "paid" | "status" | "installments" | "paymentDate">, today = budgetToday()): PaymentStatus {
  if (item.status === "cancelled") return "cancelled";
  const balance = Math.max(item.budgeted, item.invoiced) - item.paid;
  if (item.paid > 0 && balance < 0.005) return "paid";
  const scheduled = installmentPayments(item).filter((entry) => entry.due > 0.005);
  const dueDates = scheduled.length ? scheduled.map((entry) => entry.dueDate) : item.installments.length ? [] : item.paymentDate ? [item.paymentDate] : [];
  if (balance > 0.005 && dueDates.some((date) => date < today)) return "overdue";
  const nextWeek = new Date(`${today}T12:00:00Z`); nextWeek.setUTCDate(nextWeek.getUTCDate() + 7);
  if (balance > 0.005 && dueDates.some((date) => date >= today && date <= nextWeek.toISOString().slice(0, 10))) return "upcoming";
  if (item.paid > 0) return "partially-paid";
  return "unpaid";
}

export function installmentPayments(item: Pick<BudgetItem, "paid" | "budgeted" | "installments">) {
  let allocated = item.paid;
  return item.installments
    .filter((installment) => installment.percentage > 0 && installment.dueDate)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .map((installment) => {
      const amount = item.budgeted * installment.percentage / 100;
      const paid = Math.min(amount, Math.max(0, allocated));
      allocated -= paid;
      return { ...installment, amount, due: Math.max(0, amount - paid) };
    });
}

export function budgetDuplicateKey(item: Pick<BudgetItem, "eventId" | "name" | "vendor">, groupName: string) {
  return [item.eventId ?? "general", groupName, item.name, item.vendor].map((value) => value.trim().toLowerCase().replace(/\s+/g, " ")).join("|");
}
