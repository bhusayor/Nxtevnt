import { isEventCancelled, type PlannerEvent } from "./planner-events";
import { overviewEventType, overviewEventTypes } from "./overview-event-types";

export const lineupYearBounds = { min: 1900, max: 2200 };
export function lineupYear(events: readonly PlannerEvent[], year: number) {
  const prefix = String(year) + "-";
  const active = events.filter(event => {
    if (isEventCancelled(event) || typeof event.date !== "string" || !event.date.startsWith(prefix) || !/^\d{4}-\d{2}-\d{2}$/.test(event.date)) return false;
    const date = new Date(event.date + "T12:00:00Z");
    return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === event.date;
  });
  const months = Array.from({ length: 12 }, (_, index) => {
    const month = prefix + String(index + 1).padStart(2, "0");
    const entries = active.filter(event => event.date.startsWith(month));
    return { month, entries, values: overviewEventTypes.map(type => entries.filter(event => overviewEventType(event.type).key === type.key).length) };
  });
  return { events: active, months, max: Math.max(1, ...months.map(month => month.entries.length)) };
}
