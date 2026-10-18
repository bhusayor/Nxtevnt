"use client";

import { useMemo, useSyncExternalStore } from "react";
import { milestoneTemplates, type MilestoneTemplate } from "@/lib/event-setup-templates";
import { isTaskActive, type EventItem, type PlannerEvent } from "@/lib/planner-events";

const storageKey = "nxtevnt.planner.task-templates.v1";
const changedEvent = "nxtevnt:task-templates-changed";
const emptyRaw = "[]";

function getRaw() {
  if (typeof window === "undefined") return emptyRaw;
  try { return window.localStorage.getItem(storageKey) ?? emptyRaw; }
  catch { return emptyRaw; }
}

function parseTemplates(raw: string): MilestoneTemplate[] {
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((entry): entry is MilestoneTemplate =>
      entry !== null && typeof entry === "object" && typeof entry.id === "string" &&
      typeof entry.name === "string" && typeof entry.description === "string" &&
      Array.isArray(entry.milestones) && entry.milestones.every((milestone: unknown) =>
        milestone !== null && typeof milestone === "object" &&
        "title" in milestone && typeof milestone.title === "string" &&
        "tasks" in milestone && Array.isArray(milestone.tasks),
      ),
    ) : [];
  } catch { return []; }
}

function subscribe(callback: () => void) {
  window.addEventListener(changedEvent, callback);
  window.addEventListener("storage", callback);
  return () => { window.removeEventListener(changedEvent, callback); window.removeEventListener("storage", callback); };
}

export function useMilestoneTemplates() {
  const raw = useSyncExternalStore(subscribe, getRaw, () => emptyRaw);
  return useMemo(() => [...milestoneTemplates, ...parseTemplates(raw)], [raw]);
}

function daysBefore(eventDate: string, dueDate?: string) {
  if (!dueDate) return undefined;
  const eventTime = Date.parse(`${eventDate}T12:00:00`);
  const dueTime = Date.parse(`${dueDate}T12:00:00`);
  return Number.isFinite(eventTime) && Number.isFinite(dueTime) ? Math.round((eventTime - dueTime) / 86_400_000) : undefined;
}

function templateTasks(event: PlannerEvent, tasks: EventItem[]) {
  return tasks.filter(isTaskActive).map((task) => ({
    title: task.title,
    daysBefore: daysBefore(event.date, task.dueDate),
    detail: task.detail,
    priority: task.priority,
    clientVisible: task.clientVisible,
  }));
}

export function savePlannerTaskTemplate(event: PlannerEvent, name: string) {
  const cleanName = name.trim().replace(/\s+/g, " ");
  if (cleanName.length < 3 || cleanName.length > 80) throw new Error("Enter a template name between 3 and 80 characters.");
  const saved = parseTemplates(getRaw());
  if ([...milestoneTemplates, ...saved].some((template) => template.name.toLocaleLowerCase() === cleanName.toLocaleLowerCase())) throw new Error("A template with that name already exists.");
  const groups = event.taskGroups ?? [];
  const milestones = groups.map((group) => ({
    title: group.title,
    description: group.description,
    daysBefore: daysBefore(event.date, group.dueDate),
    tasks: templateTasks(event, event.sections.tasks.filter((task) => task.groupId === group.id)),
  }));
  const groupIds = new Set(groups.map((group) => group.id));
  const otherTasks = event.sections.tasks.filter((task) => !task.groupId || !groupIds.has(task.groupId));
  if (otherTasks.length) milestones.push({ title: "Other tasks", description: undefined, daysBefore: undefined, tasks: templateTasks(event, otherTasks) });
  if (!milestones.length) throw new Error("Add a milestone or task before saving a template.");
  const template: MilestoneTemplate = { id: crypto.randomUUID(), name: cleanName, description: `Saved from ${event.name}`, milestones };
  window.localStorage.setItem(storageKey, JSON.stringify([...saved, template]));
  window.dispatchEvent(new Event(changedEvent));
  return template;
}

