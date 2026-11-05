"use client";

import { useSyncExternalStore } from "react";

export type PlannerProspect = { id: string; name: string; createdAt: string };
const key = "nxtevnt.planner.prospects.v1";
const changed = "nxtevnt:planner-prospects-changed";
const empty: readonly PlannerProspect[] = [];
let rawCache: string | null | undefined;
let prospectsCache: readonly PlannerProspect[] = empty;

function read(): readonly PlannerProspect[] {
  if (typeof window === "undefined") return empty;
  let raw: string | null;
  try { raw = window.localStorage.getItem(key); } catch { return empty; }
  if (raw === rawCache) return prospectsCache;
  rawCache = raw;
  try {
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    prospectsCache = Array.isArray(parsed) ? parsed.filter((item): item is PlannerProspect =>
      item !== null && typeof item === "object" && typeof item.id === "string" && typeof item.name === "string" && typeof item.createdAt === "string",
    ) : empty;
  } catch { prospectsCache = empty; }
  return prospectsCache;
}

function subscribe(callback: () => void) {
  window.addEventListener(changed, callback);
  window.addEventListener("storage", callback);
  return () => { window.removeEventListener(changed, callback); window.removeEventListener("storage", callback); };
}

export function usePlannerProspects() { return useSyncExternalStore(subscribe, read, () => empty); }

export function addPlannerProspect(name: string) {
  const clean = name.trim().replace(/\s+/g, " ");
  if (clean.length < 2 || clean.length > 100) throw new Error("Enter a prospect name between 2 and 100 characters.");
  const existing = read().find((item) => item.name.toLocaleLowerCase() === clean.toLocaleLowerCase());
  if (existing) return existing;
  const prospect: PlannerProspect = { id: crypto.randomUUID(), name: clean, createdAt: new Date().toISOString() };
  window.localStorage.setItem(key, JSON.stringify([...read(), prospect]));
  rawCache = undefined;
  window.dispatchEvent(new Event(changed));
  return prospect;
}
