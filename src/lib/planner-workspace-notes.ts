"use client";

import { useSyncExternalStore } from "react";
import type { EventNote } from "./planner-events";

export type WorkspaceNote = EventNote & {
  notebook: "mine" | "leads";
  person?: { type: "prospect" | "client"; id: string; name: string };
};

const storageKey = "nxtevnt.planner.workspace-notes.v1";
const changed = "nxtevnt:workspace-notes-changed";
const empty: readonly WorkspaceNote[] = [];
let cachedRaw: string | null | undefined;
let cachedNotes: readonly WorkspaceNote[] = empty;

function read(): readonly WorkspaceNote[] {
  if (typeof window === "undefined") return empty;
  let raw: string | null;
  try { raw = window.localStorage.getItem(storageKey); } catch { return empty; }
  if (raw === cachedRaw) return cachedNotes;
  cachedRaw = raw;
  try {
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    cachedNotes = Array.isArray(parsed) ? parsed.filter((note): note is WorkspaceNote =>
      note !== null && typeof note === "object" && typeof note.id === "string" &&
      typeof note.body === "string" && typeof note.createdAt === "string" &&
      (note.notebook === "mine" || note.notebook === "leads"),
    ) : empty;
  } catch { cachedNotes = empty; }
  return cachedNotes;
}

function subscribe(callback: () => void) {
  window.addEventListener(changed, callback);
  window.addEventListener("storage", callback);
  return () => { window.removeEventListener(changed, callback); window.removeEventListener("storage", callback); };
}

function write(notes: readonly WorkspaceNote[]) {
  window.localStorage.setItem(storageKey, JSON.stringify(notes));
  cachedRaw = undefined;
  window.dispatchEvent(new Event(changed));
}

export function useWorkspaceNotes() { return useSyncExternalStore(subscribe, read, () => empty); }
export function addWorkspaceNote(note: WorkspaceNote) { write([note, ...read()]); }
export function updateWorkspaceNote(id: string, update: (note: WorkspaceNote) => WorkspaceNote) {
  const notes = read();
  if (!notes.some((note) => note.id === id)) throw new Error("This note is no longer available.");
  write(notes.map((note) => note.id === id ? update(note) : note));
}
export function deleteWorkspaceNote(id: string) { write(read().filter((note) => note.id !== id)); }
