"use client";

import { useMemo, useSyncExternalStore } from "react";
import { usePlannerEvents } from "@/lib/planner-events";

export type PlannerClient = { id: string; name: string; email?: string; createdAt: string };

const storageKey = "nxtevnt.planner.clients.v1";
const changedEvent = "nxtevnt:planner-clients-changed";
const emptyRaw = "[]";

function getRaw() {
  if (typeof window === "undefined") return emptyRaw;
  try { return window.localStorage.getItem(storageKey) ?? emptyRaw; }
  catch { return emptyRaw; }
}

function parseClients(raw: string): PlannerClient[] {
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((entry): entry is PlannerClient =>
      entry !== null && typeof entry === "object" && typeof entry.id === "string" && typeof entry.name === "string" && typeof entry.createdAt === "string",
    ) : [];
  } catch { return []; }
}

function subscribe(callback: () => void) {
  window.addEventListener(changedEvent, callback);
  window.addEventListener("storage", callback);
  return () => { window.removeEventListener(changedEvent, callback); window.removeEventListener("storage", callback); };
}

export function usePlannerClients() {
  const raw = useSyncExternalStore(subscribe, getRaw, () => emptyRaw);
  const events = usePlannerEvents();
  return useMemo(() => {
    const clients = parseClients(raw);
    const names = new Set(clients.map((client) => client.name.toLocaleLowerCase()));
    for (const event of events) {
      const name = event.clientName?.trim();
      if (name && !names.has(name.toLocaleLowerCase())) {
        clients.push({ id: `event-client:${name.toLocaleLowerCase()}`, name, createdAt: event.createdAt });
        names.add(name.toLocaleLowerCase());
      }
    }
    return clients.sort((a, b) => a.name.localeCompare(b.name));
  }, [raw, events]);
}

export function addPlannerClient(name: string, email = "") {
  const cleanName = name.trim().replace(/\s+/g, " ");
  const cleanEmail = email.trim();
  if (cleanName.length < 2 || cleanName.length > 100) throw new Error("Enter a client name between 2 and 100 characters.");
  if (cleanEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) throw new Error("Enter a valid email address.");
  const existing = parseClients(getRaw());
  const duplicate = existing.find((client) => client.name.toLocaleLowerCase() === cleanName.toLocaleLowerCase());
  if (duplicate) return duplicate;
  const client = { id: crypto.randomUUID(), name: cleanName, email: cleanEmail, createdAt: new Date().toISOString() };
  window.localStorage.setItem(storageKey, JSON.stringify([...existing, client]));
  window.dispatchEvent(new Event(changedEvent));
  return client;
}
