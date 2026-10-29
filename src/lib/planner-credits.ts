"use client";

import { useMemo, useSyncExternalStore } from "react";

export const creditPacks = [
  { id: "single", name: "Single Credit", count: 1, price: 35000, originalPrice: 75000, badge: "53% Limited Time", savings: "" },
  { id: "starter", name: "Starter Pack", count: 3, price: 89000, originalPrice: 200000, badge: "56% Limited Time", savings: "Save 15% vs Single" },
  { id: "growth", name: "Growth Pack", count: 5, price: 120000, originalPrice: 300000, badge: "60% Limited Time", savings: "Save 31% vs Single" },
  { id: "pro", name: "Pro Pack", count: 10, price: 125000, originalPrice: 500000, badge: "Best Value", savings: "Save 64% vs Single" },
] as const;

export type CreditPackId = (typeof creditPacks)[number]["id"];

export type CreditPurchase = {
  id: string;
  packId: CreditPackId;
  packName: string;
  count: number;
  remaining: number;
  amount: number;
  purchasedAt: string;
  expiresAt: string;
  reference: string;
};

export type CreditUsage = {
  id: string;
  eventId: string;
  eventName: string;
  usedAt: string;
  purchaseId: string | null;
  count?: number;
  kind?: "create" | "upgrade";
  allocations?: { purchaseId: string | null; count: number }[];
};

export type CreditWallet = {
  legacyBalance: number;
  purchases: CreditPurchase[];
  usages: CreditUsage[];
};

const walletKey = "nxtevnt.planner.credit-wallet.v1";
const legacyBalanceKey = "nxtevnt.planner.credits.v2";
const changedEvent = "nxtevnt:planner-credits-changed";
const emptyRaw = "empty";
const emptyWallet: CreditWallet = { legacyBalance: 0, purchases: [], usages: [] };

function getWalletRaw() {
  if (typeof window === "undefined") return emptyRaw;
  try {
    const wallet = window.localStorage.getItem(walletKey);
    if (wallet !== null) return wallet;
    const legacy = window.localStorage.getItem(legacyBalanceKey);
    return legacy === null ? emptyRaw : `legacy:${legacy}`;
  } catch { return emptyRaw; }
}

function parseWallet(raw: string): CreditWallet {
  if (raw.startsWith("legacy:")) {
    const value = Number(raw.slice(7));
    return { ...emptyWallet, legacyBalance: Number.isSafeInteger(value) && value > 0 ? value : 0 };
  }
  if (raw === emptyRaw) return emptyWallet;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return emptyWallet;
    const wallet = parsed as Partial<CreditWallet>;
    return {
      legacyBalance: Number.isSafeInteger(wallet.legacyBalance) && Number(wallet.legacyBalance) >= 0 ? Number(wallet.legacyBalance) : 0,
      purchases: Array.isArray(wallet.purchases) ? wallet.purchases.filter((item): item is CreditPurchase =>
        item && typeof item.id === "string" && typeof item.remaining === "number" && Number.isSafeInteger(item.remaining) && item.remaining >= 0 && typeof item.expiresAt === "string") : [],
      usages: Array.isArray(wallet.usages) ? wallet.usages.filter((item): item is CreditUsage =>
        item && typeof item.id === "string" && typeof item.eventName === "string" && typeof item.usedAt === "string") : [],
    };
  } catch { return emptyWallet; }
}

function readWallet() { return parseWallet(getWalletRaw()); }

function writeWallet(wallet: CreditWallet) {
  window.localStorage.setItem(walletKey, JSON.stringify(wallet));
  window.dispatchEvent(new Event(changedEvent));
}

function subscribe(callback: () => void) {
  window.addEventListener(changedEvent, callback);
  window.addEventListener("storage", callback);
  return () => { window.removeEventListener(changedEvent, callback); window.removeEventListener("storage", callback); };
}

export function getCreditBalance() {
  const wallet = readWallet();
  const now = Date.now();
  return wallet.legacyBalance + wallet.purchases.reduce((sum, purchase) =>
    sum + (Date.parse(purchase.expiresAt) > now ? purchase.remaining : 0), 0);
}

export function useCreditBalance() {
  return useSyncExternalStore(subscribe, getCreditBalance, () => 0);
}

export function useCreditWallet() {
  const raw = useSyncExternalStore(subscribe, getWalletRaw, () => emptyRaw);
  return useMemo(() => parseWallet(raw), [raw]);
}

// This is a local demo purchase. No Paystack request or actual payment is made.
export function completeDemoCreditPurchase(packId: CreditPackId) {
  const pack = creditPacks.find((item) => item.id === packId);
  if (!pack) throw new Error("Unknown credit pack");
  const now = new Date();
  const expires = new Date(now);
  expires.setFullYear(expires.getFullYear() + 1);
  const purchase: CreditPurchase = {
    id: crypto.randomUUID(), packId, packName: pack.name, count: pack.count, remaining: pack.count,
    amount: pack.price, purchasedAt: now.toISOString(), expiresAt: expires.toISOString(),
    reference: `NXD-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
  };
  const wallet = readWallet();
  writeWallet({ ...wallet, purchases: [purchase, ...wallet.purchases] });
  return purchase;
}

export function spendCreditForEvent(eventId: string, eventName: string, count = 1, kind: "create" | "upgrade" = "create") {
  if (!Number.isSafeInteger(count) || count < 1) throw new Error("Choose a valid credit cost.");
  const wallet = readWallet();
  const now = Date.now();
  const eligible = [...wallet.purchases]
    .filter((purchase) => purchase.remaining > 0 && Date.parse(purchase.expiresAt) > now)
    .sort((a, b) => Date.parse(a.expiresAt) - Date.parse(b.expiresAt));
  let needed = count;
  const allocations: { purchaseId: string | null; count: number }[] = [];
  for (const purchase of eligible) {
    const used = Math.min(needed, purchase.remaining);
    if (used > 0) allocations.push({ purchaseId: purchase.id, count: used });
    needed -= used;
    if (!needed) break;
  }
  if (needed > 0 && wallet.legacyBalance > 0) {
    const used = Math.min(needed, wallet.legacyBalance);
    allocations.push({ purchaseId: null, count: used });
    needed -= used;
  }
  if (needed > 0) return null;
  const usage: CreditUsage = {
    id: crypto.randomUUID(), eventId, eventName: eventName.trim(), usedAt: new Date(now).toISOString(),
    purchaseId: allocations[0].purchaseId, count, kind, allocations,
  };
  const usedByPurchase = new Map(allocations.filter((entry) => entry.purchaseId).map((entry) => [entry.purchaseId, entry.count]));
  writeWallet({
    legacyBalance: wallet.legacyBalance - (allocations.find((entry) => entry.purchaseId === null)?.count ?? 0),
    purchases: wallet.purchases.map((purchase) => ({ ...purchase, remaining: purchase.remaining - (usedByPurchase.get(purchase.id) ?? 0) })),
    usages: [usage, ...wallet.usages],
  });
  return usage;
}

export function refundCreditUse(usageId: string) {
  const wallet = readWallet();
  const usage = wallet.usages.find((item) => item.id === usageId);
  if (!usage) return;
  const allocations = usage.allocations?.length ? usage.allocations : [{ purchaseId: usage.purchaseId, count: 1 }];
  const restoredByPurchase = new Map(allocations.filter((entry) => entry.purchaseId).map((entry) => [entry.purchaseId, entry.count]));
  writeWallet({
    legacyBalance: wallet.legacyBalance + (allocations.find((entry) => entry.purchaseId === null)?.count ?? 0),
    purchases: wallet.purchases.map((purchase) => ({ ...purchase, remaining: purchase.remaining + (restoredByPurchase.get(purchase.id) ?? 0) })),
    usages: wallet.usages.filter((item) => item.id !== usageId),
  });
}
