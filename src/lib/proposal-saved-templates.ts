"use client";

import { useSyncExternalStore } from "react";
import { copyProposalGroups, type BudgetProposal, type ProposalGroup } from "@/lib/budget-proposals";

export type SavedProposalTemplate = { id: string; name: string; currency: string; groups: ProposalGroup[]; createdAt: string };
const key = "nxtevnt.planner.proposal-templates.v1";
const changeEvent = "nxtevnt:proposal-templates-changed";
const empty: SavedProposalTemplate[] = [];
let cachedRaw: string | null | undefined;
let cached = empty;

function read() {
  if (typeof window === "undefined") return empty;
  let raw: string | null;
  try { raw = window.localStorage.getItem(key); } catch { return empty; }
  if (raw === cachedRaw) return cached;
  cachedRaw = raw;
  try { const parsed: unknown = raw ? JSON.parse(raw) : []; cached = Array.isArray(parsed) ? parsed as SavedProposalTemplate[] : empty; }
  catch { cached = empty; }
  return cached;
}

function subscribe(callback: () => void) {
  window.addEventListener(changeEvent, callback);
  window.addEventListener("storage", callback);
  return () => { window.removeEventListener(changeEvent, callback); window.removeEventListener("storage", callback); };
}

export function useSavedProposalTemplates() { return useSyncExternalStore(subscribe, read, () => empty); }

export function saveProposalAsTemplate(proposal: BudgetProposal) {
  if (!proposal.groups.length) throw new Error("Add at least one budget group before saving this proposal as a template.");
  const template: SavedProposalTemplate = { id: crypto.randomUUID(), name: proposal.name, currency: proposal.currency, groups: copyProposalGroups(proposal.groups), createdAt: new Date().toISOString() };
  window.localStorage.setItem(key, JSON.stringify([...read(), template]));
  cachedRaw = undefined;
  window.dispatchEvent(new Event(changeEvent));
  return template;
}
