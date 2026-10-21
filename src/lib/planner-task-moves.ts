import type { EventItem, PlannerEvent, TaskComment, TaskStatus } from "@/lib/planner-events";

export const taskStatuses: TaskStatus[] = ["todo", "in-progress", "completed", "blocked"];
const effectiveStatus = (task: EventItem) => task.status === "ongoing" || task.status === "review" ? "in-progress" : taskStatuses.includes(task.status as TaskStatus) ? task.status : task.done ? "completed" : "todo";
const milestoneOf = (event: PlannerEvent, task: EventItem) => event.taskGroups?.some((group) => group.id === task.groupId) ? task.groupId : undefined;

export type TaskDestination = { groupId?: string | null; status?: TaskStatus; relativeTaskId?: string; placement?: "before" | "after" };

/** Move existing records, never recreate them: comments and other metadata stay intact. */
export function moveTaskInPlan(event: PlannerEvent, taskId: string, destination: TaskDestination): PlannerEvent {
  const tasks = event.sections.tasks;
  const task = tasks.find((entry) => entry.id === taskId);
  if (!task) throw new Error("This task no longer exists. Refresh the plan and try again.");
  const changesMilestone = Object.prototype.hasOwnProperty.call(destination, "groupId");
  if (changesMilestone && destination.groupId && !event.taskGroups?.some((group) => group.id === destination.groupId)) throw new Error("The destination milestone no longer exists.");
  if (destination.status && !taskStatuses.includes(destination.status)) throw new Error("Choose a valid task status.");
  const moved: EventItem = { ...task, ...(changesMilestone ? { groupId: destination.groupId || undefined } : {}), ...(destination.status ? { status: destination.status, done: destination.status === "completed" } : {}) };
  if (destination.relativeTaskId === taskId) return event;
  const remaining = tasks.filter((entry) => entry.id !== taskId);
  let index = tasks.findIndex((entry) => entry.id === taskId);
  if (destination.relativeTaskId) {
    const anchor = remaining.find((entry) => entry.id === destination.relativeTaskId);
    if (!anchor) throw new Error("The destination task no longer exists.");
    if (changesMilestone && milestoneOf(event, anchor) !== milestoneOf(event, moved)) throw new Error("That task is in another milestone. Choose a new drop position.");
    if (destination.status && effectiveStatus(anchor) !== destination.status) throw new Error("That task has changed status. Choose a new drop position.");
    index = remaining.findIndex((entry) => entry.id === anchor.id) + (destination.placement === "after" ? 1 : 0);
  } else if ((changesMilestone && milestoneOf(event, task) !== milestoneOf(event, moved)) || (destination.status && effectiveStatus(task) !== destination.status)) {
    const matches = remaining.flatMap((entry, position) => (!destination.status || effectiveStatus(entry) === destination.status) && (!changesMilestone || milestoneOf(event, entry) === milestoneOf(event, moved)) ? [position] : []);
    index = matches.length ? matches[matches.length - 1] + 1 : remaining.length;
  }
  remaining.splice(Math.min(index, remaining.length), 0, moved);
  return { ...event, sections: { ...event.sections, tasks: remaining } };
}

export function reorderMilestone(event: PlannerEvent, milestoneId: string, relativeId: string, placement: "before" | "after" = "before"): PlannerEvent {
  const groups = event.taskGroups ?? [];
  const group = groups.find((entry) => entry.id === milestoneId);
  if (!group || !groups.some((entry) => entry.id === relativeId)) throw new Error("This milestone no longer exists. Refresh the plan and try again.");
  if (milestoneId === relativeId) return event;
  const remaining = groups.filter((entry) => entry.id !== milestoneId);
  const position = remaining.findIndex((entry) => entry.id === relativeId) + (placement === "after" ? 1 : 0);
  remaining.splice(position, 0, group);
  return { ...event, taskGroups: remaining };
}

export function appendTaskComment(event: PlannerEvent, taskId: string, comment: TaskComment): PlannerEvent {
  const task = event.sections.tasks.find((entry) => entry.id === taskId);
  if (!task) throw new Error("This task no longer exists.");
  if (!comment.body.trim() || comment.body.trim().length > 1000) throw new Error("Write a comment of 1–1,000 characters.");
  if (task.comments?.some((entry) => entry.id === comment.id)) return event;
  return { ...event, sections: { ...event.sections, tasks: event.sections.tasks.map((entry) => entry.id === taskId ? { ...entry, comments: [...(entry.comments ?? []), { ...comment, body: comment.body.trim() }] } : entry) } };
}
