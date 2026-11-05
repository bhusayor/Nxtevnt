import { hasAttachedClient, type PlannerEvent } from "./planner-events";

export function shouldLeaveEvent(event: PlannerEvent) {
  return hasAttachedClient(event) || event.accessRole === "invited";
}

export function eventLeaveDescription(event: PlannerEvent) {
  if (!hasAttachedClient(event)) return "You can leave this event: it disappears from your workspace, while the event and everything in it stay with its owner.";
  const client = event.clientName?.trim().split(/\s+/)[0] || "the client";
  return `A client is attached to this event, so it can’t be deleted from here. You can leave it: it disappears from your workspace, and ${client} keeps the event and everything in it. If ${client} wants it gone too, they can delete it from their side.`;
}
