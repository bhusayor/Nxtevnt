"use client";

import { useSyncExternalStore } from "react";

export type EventItem = {
  id: string;
  title: string;
  detail?: string;
  amount?: number;
  time?: string;
  url?: string;
  done?: boolean;
};

export type EventSections = {
  tasks: EventItem[];
  expenses: EventItem[];
  proposal: EventItem[];
  moodboard: EventItem[];
  agenda: EventItem[];
  decisions: EventItem[];
  files: EventItem[];
};

export type EventNote = {
  id: string;
  body: string;
  author: string;
  createdAt: string;
  pinned: boolean;
};

export type QuestionnaireQuestionType = "short" | "long" | "email" | "phone" | "number" | "single" | "multiple" | "dropdown" | "checkbox" | "yes-no" | "date" | "time" | "datetime" | "date-range" | "photo" | "file" | "divider";
export type QuestionnaireQuestion = { id: string; label: string; type?: QuestionnaireQuestionType; required?: boolean; options?: string[] };
export type QuestionnaireSection = { id: string; title: string; questions: QuestionnaireQuestion[] };
export type SentQuestionnaire = {
  id: string;
  templateId: string;
  title: string;
  category?: string;
  sections: QuestionnaireSection[];
  answers: Record<string, string>;
  status: "pending" | "in-progress" | "submitted";
  sentAt: string;
  updatedAt?: string;
};

export type PlannerEvent = {
  id: string;
  name: string;
  type: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  clientName: string;
  guestCount: string;
  budget: string;
  description: string;
  image: string;
  createdAt: string;
  cancelledAt?: string;
  cancellationReason?: string;
  notes: string;
  noteEntries?: EventNote[];
  questionnaires?: SentQuestionnaire[];
  sections: EventSections;
};

export type NewPlannerEvent = Pick<PlannerEvent, "name" | "type" | "date" | "startTime" | "endTime" | "location" | "clientName" | "guestCount" | "budget" | "description" | "image">;

export const eventCovers = [
  { src: "/images/auth/nigerian-wedding-party.jpg", label: "Celebration" },
  { src: "/images/auth/wedding-reception.jpg", label: "Reception" },
  { src: "/images/auth/lagos-conference.jpg", label: "Conference" },
  { src: "/images/auth/gala-dinner.jpg", label: "Dinner" },
] as const;

const key = "nxtevnt.planner.events.v1";
const changed = "nxtevnt:planner-events-changed";
const emptyEvents: readonly PlannerEvent[] = [];
let cachedRaw: string | null | undefined;
let cachedEvents: readonly PlannerEvent[] = emptyEvents;

function readEvents(): readonly PlannerEvent[] {
  if (typeof window === "undefined") return emptyEvents;
  let raw: string | null;
  try {
    raw = window.localStorage.getItem(key);
  } catch {
    return emptyEvents;
  }
  if (raw === cachedRaw) return cachedEvents;
  cachedRaw = raw;
  try {
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    cachedEvents = Array.isArray(parsed)
      ? parsed.filter((event): event is PlannerEvent =>
          typeof event === "object" && event !== null &&
          typeof event.id === "string" && typeof event.name === "string" &&
          typeof event.date === "string" && typeof event.sections === "object" && event.sections !== null,
        )
      : emptyEvents;
  } catch {
    cachedEvents = emptyEvents;
  }
  return cachedEvents;
}

function subscribe(callback: () => void) {
  window.addEventListener(changed, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(changed, callback);
    window.removeEventListener("storage", callback);
  };
}

function writeEvents(events: readonly PlannerEvent[]) {
  window.localStorage.setItem(key, JSON.stringify(events));
  cachedRaw = undefined;
  window.dispatchEvent(new Event(changed));
}

export function usePlannerEvents() {
  return useSyncExternalStore(subscribe, readEvents, () => emptyEvents);
}

function subscribeNoop() { return () => {}; }

export function useBrowserReady() {
  return useSyncExternalStore(subscribeNoop, () => true, () => false);
}

export function createPlannerEvent(input: NewPlannerEvent, id = crypto.randomUUID()): PlannerEvent {
  const event: PlannerEvent = {
    ...input,
    id,
    createdAt: new Date().toISOString(),
    notes: "",
    noteEntries: [],
    questionnaires: [],
    sections: { tasks: [], expenses: [], proposal: [], moodboard: [], agenda: [], decisions: [], files: [] },
  };
  writeEvents([event, ...readEvents()]);
  return event;
}

export function getEventNotes(event: PlannerEvent): EventNote[] {
  if (event.noteEntries) return event.noteEntries;
  return event.notes.trim() ? [{ id: "legacy-note", body: event.notes, author: "Amaka Okafor", createdAt: event.createdAt, pinned: false }] : [];
}

export function updatePlannerEvent(id: string, update: (event: PlannerEvent) => PlannerEvent) {
  const events = readEvents();
  const index = events.findIndex((event) => event.id === id);
  if (index < 0) return;
  writeEvents(events.map((event, current) => current === index ? update(event) : event));
}

export function isEventCancelled(event: PlannerEvent) {
  return Boolean(event.cancelledAt);
}

export function cancelPlannerEvent(id: string, reason: string) {
  updatePlannerEvent(id, (event) => ({ ...event, cancelledAt: new Date().toISOString(), cancellationReason: reason.trim() || undefined }));
}

export function reopenPlannerEvent(id: string) {
  updatePlannerEvent(id, (event) => ({ ...event, cancelledAt: undefined, cancellationReason: undefined }));
}

export function deletePlannerEvent(id: string) {
  const events = readEvents();
  if (!events.some((event) => event.id === id)) return;
  writeEvents(events.filter((event) => event.id !== id));
}

export function formatEventDate(date: string, options?: Intl.DateTimeFormatOptions) {
  const parsed = new Date(`${date}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;
  return new Intl.DateTimeFormat("en-NG", options ?? { day: "numeric", month: "long", year: "numeric" }).format(parsed);
}

export function formatNaira(value: number) {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(value);
}

export function formatGroupedDigits(value: string) {
  return value.replace(/\D/g, "").replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export function isCustomCover(src: string) {
  return src.startsWith("data:image/");
}
