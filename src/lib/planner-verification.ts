"use client";

import { useSyncExternalStore } from "react";
import { emptyVerificationCheckpoint, sanitizeVerificationCheckpoint, type VerificationCheckpoint, type VerificationDraft } from "./verification-model";

export const verificationStorageKey = "nxtevnt.planner.verification-preview.v1";
const change = "nxtevnt-verification-change";
let rawCache: string | null | undefined, cached = emptyVerificationCheckpoint;
let memoryDraft: VerificationDraft | undefined;
function subscribe(callback: () => void) { window.addEventListener(change, callback); window.addEventListener("storage", callback); return () => { window.removeEventListener(change, callback); window.removeEventListener("storage", callback); }; }
export function readVerificationCheckpoint() {
  if (typeof window === "undefined") return emptyVerificationCheckpoint;
  try { const raw = window.localStorage.getItem(verificationStorageKey); if (raw === rawCache) return cached; const value = sanitizeVerificationCheckpoint(raw ? JSON.parse(raw) : null); rawCache = raw; cached = value; return cached; } catch { return emptyVerificationCheckpoint; }
}
export function useVerificationCheckpoint() { return useSyncExternalStore(subscribe, readVerificationCheckpoint, () => emptyVerificationCheckpoint); }
export function readVerificationMemoryDraft() { return memoryDraft ? { ...memoryDraft, accurate: false } : undefined; }
export function saveVerificationCheckpoint(checkpoint: VerificationCheckpoint, draft?: VerificationDraft, expected?: VerificationCheckpoint) {
  if (expected && JSON.stringify(readVerificationCheckpoint()) !== JSON.stringify(expected)) throw new Error("Your progress changed in another tab. Reload before continuing.");
  const safe = sanitizeVerificationCheckpoint(checkpoint);
  window.localStorage.setItem(verificationStorageKey, JSON.stringify(safe));
  // Write memory only after storage succeeds. Private fields never enter local/session storage.
  if (draft) memoryDraft = { ...draft };
  rawCache = undefined;
  window.dispatchEvent(new Event(change));
}
