import { taskStatus, type EventItem, type EventTaskGroup, type TaskStatus } from "./planner-events";
import { eventDayOffset } from "./event-weather";

/** Statuses partition the plan; overdue is a date-based overlap, never a fifth status. */
export function taskSummary(tasks: readonly EventItem[], today: string) {
  const counts: Record<TaskStatus, number> = { todo: 0, "in-progress": 0, blocked: 0, completed: 0 };
  const overdueByStatus: Record<TaskStatus, number> = { todo: 0, "in-progress": 0, blocked: 0, completed: 0 };
  let total = 0, overdue = 0;
  for (const task of tasks) {
    if (task.status === "canceled" || task.status === "archived") continue;
    const status = taskStatus(task);
    counts[status]++;
    total++;
    if (status !== "completed" && task.dueDate && eventDayOffset(task.dueDate, today) < 0) {
      overdueByStatus[status]++;
      overdue++;
    }
  }
  return { total, counts, overdue, overdueByStatus };
}

export function milestoneSummary(groups: readonly EventTaskGroup[], tasks: readonly EventItem[], today: string) {
  let completed = 0, overdue = 0;
  for (const group of groups) {
    const summary = taskSummary(tasks.filter((task) => task.groupId === group.id), today);
    const finished = summary.total > 0 && summary.counts.completed === summary.total;
    if (finished) completed++;
    else if (summary.overdue > 0 || group.dueDate && eventDayOffset(group.dueDate, today) < 0) overdue++;
  }
  return { total: groups.length, open: groups.length - completed, completed, overdue };
}
