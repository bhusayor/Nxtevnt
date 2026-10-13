"use client";

import { useMemo, useSyncExternalStore } from "react";

export type PlannerTeamMember = { id: string; name: string; createdAt: string; isOwner?: boolean };

const storageKey = "nxtevnt.planner.team.v1";
const changedEvent = "nxtevnt:planner-team-changed";
const emptyRaw = "[]";

function ownerName() {
  if (typeof window === "undefined") return "Amaka Okafor";
  try { return window.sessionStorage.getItem("nxtevnt-signup-name")?.trim() || "Amaka Okafor"; }
  catch { return "Amaka Okafor"; }
}

function getRaw() {
  if (typeof window === "undefined") return emptyRaw;
  try { return window.localStorage.getItem(storageKey) ?? emptyRaw; }
  catch { return emptyRaw; }
}

function parseMembers(raw: string): PlannerTeamMember[] {
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((entry): entry is PlannerTeamMember =>
      entry !== null && typeof entry === "object" && typeof entry.id === "string" && typeof entry.name === "string" && typeof entry.createdAt === "string",
    ) : [];
  } catch { return []; }
}

function subscribe(callback: () => void) {
  window.addEventListener(changedEvent, callback);
  window.addEventListener("storage", callback);
  return () => { window.removeEventListener(changedEvent, callback); window.removeEventListener("storage", callback); };
}

function subscribeOwner() { return () => {}; }

function writeMembers(members: PlannerTeamMember[]) {
  window.localStorage.setItem(storageKey, JSON.stringify(members));
  window.dispatchEvent(new Event(changedEvent));
}

export function usePlannerTeam() {
  const raw = useSyncExternalStore(subscribe, getRaw, () => emptyRaw);
  const owner = useSyncExternalStore(subscribeOwner, ownerName, () => "Amaka Okafor");
  return useMemo(() => {
    return [{ id: "owner", name: owner, createdAt: "", isOwner: true }, ...parseMembers(raw).filter((member) => member.name.toLocaleLowerCase() !== owner.toLocaleLowerCase())];
  }, [raw, owner]);
}

export function addPlannerTeamMember(name: string) {
  const trimmed = name.trim().replace(/\s+/g, " ");
  if (trimmed.length < 2 || trimmed.length > 80) throw new Error("Enter a name between 2 and 80 characters.");
  const existing = parseMembers(getRaw());
  if ([ownerName(), ...existing.map((member) => member.name)].some((value) => value.toLocaleLowerCase() === trimmed.toLocaleLowerCase())) throw new Error("That name is already in your team.");
  const member = { id: crypto.randomUUID(), name: trimmed, createdAt: new Date().toISOString() };
  writeMembers([...existing, member]);
  return member;
}

export function removePlannerTeamMember(id: string) {
  if (id === "owner") return;
  writeMembers(parseMembers(getRaw()).filter((member) => member.id !== id));
}
