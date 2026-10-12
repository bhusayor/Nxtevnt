"use client";

import { useSyncExternalStore } from "react";
import type { PlannerEvent } from "@/lib/planner-events";

export type BudgetStatus = "not-started" | "quoted" | "upcoming" | "partially-paid" | "paid" | "overdue" | "cancelled";
export type VendorStatus = "not-sourced" | "sourcing" | "booked";
export type BudgetInstallment = { id: string; percentage: number; dueDate: string };
export type BudgetAttachment = { id: string; name: string; type: string; size: number };
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
  invoiced: number;
  paid: number;
  paymentDate: string;
  notes: string;
  status: BudgetStatus;
  installments: BudgetInstallment[];
  attachments: BudgetAttachment[];
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

export const budgetStatuses: { value: BudgetStatus; label: string }[] = [
  { value: "not-started", label: "Not started" }, { value: "quoted", label: "Quoted" },
  { value: "upcoming", label: "Upcoming" }, { value: "partially-paid", label: "Partially paid" },
  { value: "paid", label: "Paid" }, { value: "overdue", label: "Overdue" },
  { value: "cancelled", label: "Cancelled" },
];
export const vendorStatuses: { value: VendorStatus; label: string }[] = [
  { value: "not-sourced", label: "Not sourced" }, { value: "sourcing", label: "Sourcing" }, { value: "booked", label: "Booked" },
];

function normalizeItem(item: BudgetItem, currency: string): BudgetItem {
  const oldStatus = item.status as string;
  return {
    ...item,
    status: oldStatus === "sourcing" || oldStatus === "booked" ? "not-started" : item.status,
    vendorStatus: !item.vendor ? "not-sourced" : item.vendorStatus ?? (oldStatus === "sourcing" ? "sourcing" : ["booked", "upcoming", "partially-paid", "paid", "overdue"].includes(oldStatus) ? "booked" : "not-sourced"),
    currency: item.currency ?? currency,
    installments: Array.isArray(item.installments) ? item.installments : [],
    attachments: Array.isArray(item.attachments) ? item.attachments : [],
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

export function installmentPayments(item: BudgetItem) {
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
