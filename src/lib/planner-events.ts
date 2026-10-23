"use client";

import { useSyncExternalStore } from "react";
import { guestCommunicationsMilestone } from "@/lib/event-setup-templates";
import type { BudgetProposal } from "@/lib/budget-proposals";
import type { MoodboardBoard } from "@/lib/planner-moodboards";
import type { AgendaFields, AgendaSharing } from "@/lib/event-agenda";
import type { EventFileFolder, EventFileRecord } from "@/lib/event-files";

export type EventItem = {
  id: string;
  sourceNoteId?: string;
  title: string;
  groupId?: string;
  detail?: string;
  status?: TaskStatus | LegacyTaskStatus;
  priority?: "high" | "medium" | "low";
  assignee?: string;
  clientVisible?: boolean;
  comments?: TaskComment[];
  amount?: number;
  time?: string;
  agenda?: AgendaFields;
  url?: string;
  image?: string;
  imageCategory?: string;
  imageAddedBy?: string;
  imageAddedAt?: string;
  imageFeedback?: "like" | "not-this" | "approved";
  imageLiked?: boolean;
  imagePinned?: boolean;
  imagePinOrder?: number;
  imageArchivedAt?: string;
  designApproval?: {
    mode: "client" | "on-behalf" | "recorded";
    state: "awaiting-confirmation" | "approved-on-behalf" | "approved-by-client" | "recorded";
    by: string; at: string; decisionId: string;
    revision?: string;
    method?: "whatsapp" | "call" | "in-person" | "email";
    evidence?: string; evidenceName?: string;
    confirmedBy?: string; confirmedAt?: string;
    requestedAt?: string; remindedAt?: string; reminderCount?: number;
    delivery?: "local-preview";
  };
  decisionCategory?: "Budget" | "Design" | "Vendors" | "Guests" | "Venue & dates" | "Programme";
  supersedesDecisionId?: string;
  decisionRecord?: {
    decidedBy: "client" | "someone-else" | "on-behalf";
    name: string;
    method: "in-app" | "whatsapp" | "call" | "in-person" | "email";
    decidedOn: string;
    recordedAt: string;
    recordedBy: string;
    note?: string;
  };
  sourceMoodboardImageId?: string;
  sourceMoodboardBoardId?: string;
  boardId?: string;
  done?: boolean;
  dueDate?: string;
};

export type TaskStatus = "todo" | "in-progress" | "completed" | "blocked";
type LegacyTaskStatus = "ongoing" | "review" | "canceled" | "archived";
export type TaskComment = { id: string; body: string; author: string; createdAt: string };

export function taskStatus(task: EventItem): TaskStatus {
  if (task.status === "ongoing" || task.status === "review") return "in-progress";
  if (task.status === "blocked" || task.status === "completed" || task.status === "in-progress" || task.status === "todo") return task.status;
  return task.done ? "completed" : "todo";
}

export function isTaskComplete(task: EventItem) { return taskStatus(task) === "completed"; }
export function isTaskActive(task: EventItem) { return ["todo", "in-progress", "completed", "blocked"].includes(taskStatus(task)); }

export type EventTaskGroup = {
  id: string;
  title: string;
  description?: string;
  dueDate?: string;
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
  title?: string;
  body: string;
  author: string;
  authorId?: string;
  authorAvatar?: string;
  createdAt: string;
  updatedAt?: string;
  taskId?: string;
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
  city?: string;
  currency?: string;
  timeZone?: string;
  clientId?: string;
  linkedEventIds?: string[];
  clientName: string;
  guestCount: string;
  budget: string;
  budgetTemplateId?: string;
  targetBudget?: string;
  milestoneTemplateId?: string;
  assignedTeamMember?: string;
  priority?: "highest" | "high" | "standard" | "low";
  description: string;
  image: string;
  createdAt: string;
  cancelledAt?: string;
  cancellationReason?: string;
  notes: string;
  noteEntries?: EventNote[];
  fileFolders?: EventFileFolder[];
  fileEntries?: EventFileRecord[];
  questionnaires?: SentQuestionnaire[];
  taskGroups?: EventTaskGroup[];
  budgetProposals?: BudgetProposal[];
  moodboardBoards?: MoodboardBoard[];
  agendaSharing?: AgendaSharing;
  sections: EventSections;
};

export type NewPlannerEvent = Pick<PlannerEvent, "name" | "type" | "date" | "startTime" | "endTime" | "location" | "clientName" | "guestCount" | "budget" | "description" | "image"> & Pick<PlannerEvent, "city" | "currency" | "timeZone" | "clientId" | "budgetTemplateId" | "targetBudget" | "milestoneTemplateId" | "assignedTeamMember" | "priority">;

export const eventCovers = [
  { src: "/images/auth/nigerian-wedding-party.jpg", label: "Celebration" },
  { src: "/images/auth/wedding-reception.jpg", label: "Reception" },
  { src: "/images/auth/lagos-conference.jpg", label: "Conference" },
  { src: "/images/auth/gala-dinner.jpg", label: "Dinner" },
] as const;

const key = "nxtevnt.planner.events.v1";
const changed = "nxtevnt:planner-events-changed";
const guestMilestoneMigrationKey = "nxtevnt.planner.guest-milestone.v1";
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

export function addGuestMilestoneToExistingEvents() {
  if (typeof window === "undefined") return;
  try {
    if (window.localStorage.getItem(guestMilestoneMigrationKey)) return;
    const events = readEvents();
    const updated = events.map((event) => {
      if ((event.taskGroups ?? []).some((group) => group.title.trim().toLocaleLowerCase() === guestCommunicationsMilestone.title.toLocaleLowerCase())) return event;
      const groupId = crypto.randomUUID();
      return {
        ...event,
        taskGroups: [...(event.taskGroups ?? []), {
          id: groupId,
          title: guestCommunicationsMilestone.title,
          description: guestCommunicationsMilestone.description,
        }],
        sections: {
          ...event.sections,
          tasks: [...event.sections.tasks, ...guestCommunicationsMilestone.tasks.map((task) => ({
            id: crypto.randomUUID(), groupId, title: task.title, status: "todo" as const, done: false, priority: "medium" as const,
          }))],
        },
      };
    });
    if (events.length) writeEvents(updated);
    window.localStorage.setItem(guestMilestoneMigrationKey, "done");
  } catch {
    // A blocked storage write should not prevent the planner workspace from opening.
  }
}

function subscribeNoop() { return () => {}; }

export function useBrowserReady() {
  return useSyncExternalStore(subscribeNoop, () => true, () => false);
}

export function createPlannerEvent(input: NewPlannerEvent, id = crypto.randomUUID(), initialTasks: EventItem[] = [], taskGroups: EventTaskGroup[] = []): PlannerEvent {
  const event: PlannerEvent = {
    ...input,
    id,
    createdAt: new Date().toISOString(),
    notes: "",
    noteEntries: [],
    questionnaires: [],
    taskGroups,
    sections: { tasks: initialTasks, expenses: [], proposal: [], moodboard: [], agenda: [], decisions: [], files: [] },
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

export const EVENT_QUESTIONNAIRE_LIMIT = 3;

export function assertPlannerQuestionnaireSlot(eventId: string) {
  const event = readEvents().find((item) => item.id === eventId);
  if (!event) throw new Error("This event no longer exists.");
  if (isEventCancelled(event)) throw new Error("Reopen this event before sending a questionnaire.");
  if ((event.questionnaires ?? []).length >= EVENT_QUESTIONNAIRE_LIMIT) throw new Error("All three questionnaire slots are filled. Remove a questionnaire before sending another.");
}

export function sendPlannerQuestionnaire(eventId: string, request: SentQuestionnaire) {
  let found = false;
  updatePlannerEvent(eventId, (event) => {
    found = true;
    if ((event.questionnaires ?? []).some((item) => item.id === request.id)) return event;
    if (isEventCancelled(event)) throw new Error("Reopen this event before sending a questionnaire.");
    if ((event.questionnaires ?? []).length >= EVENT_QUESTIONNAIRE_LIMIT) throw new Error("All three questionnaire slots are filled. Remove a questionnaire before sending another.");
    return { ...event, questionnaires: [...(event.questionnaires ?? []), request] };
  });
  if (!found) throw new Error("This event no longer exists.");
}

export function completePlannerTask(eventId: string, taskId: string) {
  let found = false;
  updatePlannerEvent(eventId, (event) => {
    found = true;
    if (isEventCancelled(event)) throw new Error("This event is cancelled. Reopen it before completing tasks.");
    const task = event.sections.tasks.find((item) => item.id === taskId);
    if (!task || !isTaskActive(task) || task.status === "archived" || task.status === "canceled") throw new Error("This task is no longer active. Refresh the event and try again.");
    return { ...event, sections: { ...event.sections, tasks: event.sections.tasks.map((item) => item.id === taskId ? { ...item, status: "completed", done: true } : item) } };
  });
  if (!found) throw new Error("This event no longer exists.");
}

export function linkedPlannerEvents(event: PlannerEvent, events: readonly PlannerEvent[]) {
  const ids = new Set(Array.isArray(event.linkedEventIds) ? event.linkedEventIds : []);
  return events.filter((item) => item.id !== event.id && (ids.has(item.id) || (Array.isArray(item.linkedEventIds) && item.linkedEventIds.includes(event.id))));
}

export function setPlannerEventLinks(eventId: string, linkedIds: string[]) {
  const events = readEvents();
  if (!events.some((event) => event.id === eventId)) throw new Error("This event no longer exists.");
  const ids = new Set(linkedIds);
  if (ids.has(eventId) || [...ids].some((id) => !events.some((event) => event.id === id))) throw new Error("One of these events is no longer available. Refresh and try again.");
  // Save both sides together so either event can open the other, without sharing plans.
  writeEvents(events.map((event) => {
    if (event.id === eventId) return { ...event, linkedEventIds: [...ids] };
    const previous = Array.isArray(event.linkedEventIds) ? event.linkedEventIds : [];
    if (!ids.has(event.id) && !previous.includes(eventId)) return event;
    const next = previous.filter((id) => id !== eventId);
    return { ...event, linkedEventIds: ids.has(event.id) ? [...next, eventId] : next };
  }));
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

export function formatEventPlace(event: Pick<PlannerEvent, "location" | "city">) {
  return [event.location?.trim(), event.city?.trim()].filter(Boolean).join(", ") || "Location to be confirmed";
}

export function formatGroupedDigits(value: string) {
  return value.replace(/\D/g, "").replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export function isCustomCover(src: string) {
  return src.startsWith("data:image/");
}
