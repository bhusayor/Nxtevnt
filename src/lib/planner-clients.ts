"use client";

import { useMemo, useSyncExternalStore } from "react";
import { usePlannerEvents } from "@/lib/planner-events";

export type PlannerClient = { id: string; name: string; email?: string; phone?: string; createdAt: string };

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
    ).map((entry) => ({ ...entry, email: typeof entry.email === "string" ? entry.email : "", phone: typeof entry.phone === "string" ? entry.phone : "" })) : [];
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

export function updatePlannerClientContact(client: PlannerClient, contact: { email: string; phone: string }) {
  const email = contact.email.trim();
  const phone = contact.phone.trim();
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Enter a valid email address.");
  if (phone && (!/^[+\d\s().-]+$/.test(phone) || phone.replace(/\D/g, "").length < 7 || phone.replace(/\D/g, "").length > 15)) throw new Error("Enter a phone number with 7 to 15 digits, including the country code.");
  const clients = parseClients(getRaw());
  const current = clients.find((entry) => entry.id === client.id);
  const updated = { ...(current || client), email, phone };
  window.localStorage.setItem(storageKey, JSON.stringify(current ? clients.map((entry) => entry.id === client.id ? updated : entry) : [...clients, updated]));
  window.dispatchEvent(new Event(changedEvent));
  return updated;
}
