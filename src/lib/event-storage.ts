"use client";

import type { PlannerEvent } from "./planner-events";
import type { BudgetItem } from "./planner-budget";
import { readMoodboardImage } from "./moodboard-images";

export const STANDARD_EVENT_STORAGE_BYTES = 500 * 1024 * 1024;
export const PREMIUM_EVENT_STORAGE_BYTES = 2 * 1024 * 1024 * 1024;

export function eventStorageLimit(event: Pick<PlannerEvent, "tier">) {
  return event.tier === "premium" ? PREMIUM_EVENT_STORAGE_BYTES : STANDARD_EVENT_STORAGE_BYTES;
}

export function dataImageBytes(source: string) {
  const base64 = source.match(/^data:image\/[^;]+;base64,([\s\S]+)$/i)?.[1];
  if (!base64) return 0;
  return Math.max(0, Math.floor(base64.length * 3 / 4) - (base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0));
}

/** Count each stored payload once, even if a decision also references a mood board image. */
export async function eventStorageUsed(event: PlannerEvent, budgetItems: readonly BudgetItem[] = []) {
  let bytes = (event.fileEntries ?? []).reduce((sum, file) => sum + Math.max(0, file.size || 0), 0);
  for (const item of budgetItems) if (item.eventId === event.id) {
    bytes += (item.attachments ?? []).reduce((sum, file) => sum + Math.max(0, file.size || 0), 0);
    bytes += (item.payments ?? []).reduce((sum, payment) => sum + Math.max(0, payment.receipt?.size || 0), 0);
  }
  const images = new Set<string>();
  if (event.image?.startsWith("data:image/")) images.add(event.image);
  for (const item of [...(event.sections.moodboard ?? []), ...(event.sections.decisions ?? [])]) {
    if (item.designApproval?.evidence) images.add(item.designApproval.evidence);
    if (item.image) images.add(item.image);
  }
  for (const source of images) {
    if (source.startsWith("nxtevnt-moodboard:")) {
      try { bytes += dataImageBytes(await readMoodboardImage(source)); } catch { /* Missing local payloads occupy no browser storage. */ }
    } else bytes += dataImageBytes(source);
  }
  return bytes;
}

export async function assertEventStorageSpace(event: PlannerEvent, budgetItems: readonly BudgetItem[], incomingBytes: number) {
  if (incomingBytes <= 0) return;
  const used = await eventStorageUsed(event, budgetItems);
  if (used + incomingBytes > eventStorageLimit(event)) {
    throw new Error(event.tier === "premium"
      ? "This upload would exceed the event’s 2 GB storage limit. Remove files before trying again."
      : "This upload would exceed the event’s 500 MB storage limit. Upgrade to Premium for 2 GB.");
  }
}
