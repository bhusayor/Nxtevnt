"use client";

import { refundCreditUse, spendCreditForEvent } from "@/lib/planner-credits";
import { isEventCancelled, updatePlannerEvent } from "@/lib/planner-events";

export function upgradePlannerEvent(eventId: string, eventName: string) {
  const usage = spendCreditForEvent(eventId, eventName, 1, "upgrade");
  if (!usage) throw new Error("You need 1 credit to upgrade this event.");

  try {
    let found = false;
    updatePlannerEvent(eventId, (event) => {
      found = true;
      if (isEventCancelled(event)) throw new Error("Reopen this event before upgrading it.");
      if (event.tier === "premium") throw new Error("This event is already premium.");
      return { ...event, tier: "premium" };
    });
    if (!found) throw new Error("This event no longer exists.");
  } catch (error) {
    refundCreditUse(usage.id);
    throw error;
  }
}
