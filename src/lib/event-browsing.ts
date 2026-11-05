import type { PlannerEvent } from "./planner-events";

export type EventFilters = { type: string; client: string; priority: string };
export type EventDateOrder = "asc" | "desc";
export const EMPTY_EVENT_FILTERS: EventFilters = { type: "", client: "", priority: "" };

export function browseEvents(events: readonly PlannerEvent[], query: string, filters: EventFilters, order: EventDateOrder) {
  const search = query.trim().toLocaleLowerCase();
  return events.filter(event => (!filters.type || event.type === filters.type)
    && (!filters.client || event.clientName === filters.client)
    && (!filters.priority || (event.priority ?? "standard") === filters.priority)
    && `${event.name} ${event.type} ${event.location} ${event.city || ""} ${event.clientName}`.toLocaleLowerCase().includes(search))
    .sort((first, second) => (order === "asc" ? first.date.localeCompare(second.date) : second.date.localeCompare(first.date)) || first.name.localeCompare(second.name));
}

export function eventExpiryDate(event: Pick<PlannerEvent, "expiresAt">): string | null {
  const value = event.expiresAt;
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T12:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value ? value : null;
}

export function validateEventExpiry(event: Pick<PlannerEvent, "expiresAt">, value: string, today: string): string | null {
  if (!eventExpiryDate({ expiresAt: value })) return "Choose a valid expiry date.";
  const previous = eventExpiryDate(event);
  if (value <= today) return "Choose an expiry date after today.";
  if (previous && value <= previous) return "Choose a date after the current expiry.";
  return null;
}
