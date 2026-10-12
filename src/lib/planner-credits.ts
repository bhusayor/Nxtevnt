"use client";

import { useSyncExternalStore } from "react";

const storageKey = "nxtevnt.planner.credits.v1";
const changedEvent = "nxtevnt:planner-credits-changed";
const initialCredits = 24;

export function getCreditBalance() {
  if (typeof window === "undefined") return initialCredits;
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (raw === null) return initialCredits;
    const balance = Number(raw);
    return Number.isSafeInteger(balance) && balance >= 0 ? balance : initialCredits;
  } catch { return initialCredits; }
}

function subscribe(callback: () => void) {
  window.addEventListener(changedEvent, callback);
  window.addEventListener("storage", callback);
  return () => { window.removeEventListener(changedEvent, callback); window.removeEventListener("storage", callback); };
}

export function useCreditBalance() {
  return useSyncExternalStore(subscribe, getCreditBalance, () => initialCredits);
}

export function changeCreditBalance(amount: number) {
  const next = getCreditBalance() + amount;
  if (next < 0) return false;
  window.localStorage.setItem(storageKey, String(next));
  window.dispatchEvent(new Event(changedEvent));
  return true;
}
