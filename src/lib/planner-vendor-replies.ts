"use client";

import { useSyncExternalStore } from "react";

export type PlannerVendorReply = { id: string; eventId: string; vendor: string; subject: string; message: string; createdAt: string; status: "unread" | "read" };
export const vendorReplyStorageKey = "nxtevnt.planner.vendor-replies.v1";
const changed = "nxtevnt:vendor-replies-changed", empty: readonly PlannerVendorReply[] = [];
let raw: string | null | undefined, cached = empty;
function read() {
  let value: string | null; try { value = window.localStorage.getItem(vendorReplyStorageKey); } catch { return empty; }
  if (value === raw) return cached; raw = value;
  try { const parsed = JSON.parse(value || "[]"); cached = Array.isArray(parsed) ? parsed.filter((item): item is PlannerVendorReply => item && ["id", "eventId", "vendor", "subject", "message", "createdAt"].every((key) => typeof item[key] === "string") && Number.isFinite(Date.parse(item.createdAt)) && ["unread", "read"].includes(item.status)) : empty; }
  catch { cached = empty; }
  return cached;
}
function subscribe(callback: () => void) { window.addEventListener("storage", callback); window.addEventListener(changed, callback); return () => { window.removeEventListener("storage", callback); window.removeEventListener(changed, callback); }; }
// Empty until the vendor messaging feed is connected; never manufacture replies.
export function usePlannerVendorReplies() { return useSyncExternalStore(subscribe, read, () => empty); }
export function markVendorReplyRead(id: string) {
  const replies = read(); if (!replies.some((item) => item.id === id)) throw Error("This reply is no longer available.");
  window.localStorage.setItem(vendorReplyStorageKey, JSON.stringify(replies.map((item) => item.id === id ? { ...item, status: "read" } : item)));
  raw = undefined; window.dispatchEvent(new Event(changed));
}
