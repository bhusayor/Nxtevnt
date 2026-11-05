"use client";

import { useState } from "react";
import { ActionMenu } from "@/components/ui/action-menu";
import { DeleteConfirmation, matchesDeleteConfirmation } from "@/components/ui/delete-confirmation";
import { ArrowUpRight, Ban, CalendarClock, LogOut, Pencil, RotateCcw, Trash2 } from "@/components/ui/icons";
import { EventDetailsEditor } from "./event-details-editor";
import { EventExpiryDialog } from "./event-expiry-dialog";
import { EventCancellationDialog } from "./event-cancellation-dialog";
import { getPlannerEventById, isEventCancelled, leavePlannerEvent, reopenPlannerEvent, type PlannerEvent } from "@/lib/planner-events";
import { useBudgetStore } from "@/lib/planner-budget";
import { deleteEventWithContents } from "@/lib/delete-event";
import { eventLeaveDescription, shouldLeaveEvent } from "@/lib/event-removal";

export function EventRowActions({ event, triggerClassName }: { event: PlannerEvent; triggerClassName?: string }) {
  const [action, setAction] = useState<"edit" | "expiry" | "cancel" | "delete" | null>(null);
  const [error, setError] = useState("");
  const budget = useBudgetStore();
  const cancelled = isEventCancelled(event);
  const leave = shouldLeaveEvent(event);
  const close = () => setAction(null);
  async function remove(confirmation: string) {
    if (!leave && !matchesDeleteConfirmation(confirmation, event.name)) return false;
    try {
      const current = getPlannerEventById(event.id);
      if (current) {
        if (shouldLeaveEvent(current)) leavePlannerEvent(current.id);
        else await deleteEventWithContents(current, budget.items);
      }
      return true;
    } catch { setError(leave ? "This event couldn’t be left. Please try again." : "This event couldn’t be deleted. Please try again."); return false; }
  }
  return <>
    <ActionMenu label={`Actions for ${event.name}`} triggerClassName={triggerClassName} items={[
      { label: "Open", icon: <ArrowUpRight />, href: `/planner/events/${event.id}` },
      { label: "Edit", icon: <Pencil />, onSelect: () => setAction("edit") },
      { label: "Extend expiry", icon: <CalendarClock />, onSelect: () => setAction("expiry") },
      cancelled ? { label: "Reopen event", icon: <RotateCcw />, onSelect: () => { try { reopenPlannerEvent(event.id); } catch { setError("This event couldn’t be reopened. Please try again."); } } }
        : { label: "Cancel event", icon: <Ban />, onSelect: () => setAction("cancel") },
      { label: leave ? "Leave event" : "Delete event", icon: leave ? <LogOut /> : <Trash2 />, destructive: true, onSelect: () => { setError(""); setAction("delete"); } },
    ]} />
    {error && action !== "delete" && <span role="alert" className="text-xs text-error">{error}</span>}
    {action === "edit" && <EventDetailsEditor event={event} open onOpenChange={open => { if (!open) close(); }} hideTrigger />}
    {action === "expiry" && <EventExpiryDialog event={event} onClose={close} />}
    <EventCancellationDialog event={action === "cancel" ? event : null} onClose={close} />
    <DeleteConfirmation open={action === "delete"} onOpenChange={open => { if (!open) close(); }} title={leave ? "Leave event?" : "Delete event?"} description={leave ? eventLeaveDescription(event) : `This permanently removes “${event.name}” and its planning data from this browser. This can’t be undone.`} confirmationName={leave ? undefined : event.name} cancelLabel={leave ? "Keep event" : "Cancel"} confirmLabel={leave ? "Leave event" : "Delete event"} error={error} onConfirm={remove} />
  </>;
}
