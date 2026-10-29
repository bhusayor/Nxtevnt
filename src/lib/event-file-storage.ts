"use client";

import { saveBudgetAttachments, deleteBudgetAttachments, validateBudgetAttachment, validateBudgetReceipt } from "./budget-attachments";
import { addEventFileRecords, type EventFileRecord } from "./event-files";
import { getPlannerEventById, updatePlannerEvent } from "./planner-events";
import { budgetItemsForEvent } from "./planner-budget";
import { assertEventStorageSpace } from "./event-storage";

/** Commit payloads first, metadata second; clean staged blobs if the event save fails. */
export async function uploadEventFiles(eventId: string, folderId: string, files: File[], sourceNoteId?: string, isCurrent = () => true) {
  if (!files.length) throw new Error("Choose at least one file.");
  if (files.length > 20 || files.reduce((sum, file) => sum + file.size, 0) > 50 * 1024 * 1024) throw new Error("Add up to 20 files and 50 MB at a time.");
  const invalid = files.map(validateBudgetAttachment).find(Boolean);
  if (invalid) throw new Error(invalid);
  if (folderId === "system:receipts") { const invalidReceipt = files.map(validateBudgetReceipt).find(Boolean); if (invalidReceipt) throw new Error(invalidReceipt); }
  const currentEvent = getPlannerEventById(eventId);
  if (!currentEvent) throw new Error("This event no longer exists.");
  if (currentEvent.cancelledAt) throw new Error("Reopen this event before adding files or folders.");
  await assertEventStorageSpace(currentEvent, budgetItemsForEvent(eventId), files.reduce((sum, file) => sum + file.size, 0));
  const now = new Date().toISOString();
  const records: EventFileRecord[] = files.map(file => { const id = crypto.randomUUID(); return { id, storageId: `event-file:${id}`, folderId, name: file.name, type: file.type, size: file.size, createdAt: now, sourceNoteId }; });
  await saveBudgetAttachments(records.map((record, index) => ({ attachment: { ...record, id: record.storageId }, file: files[index] })));
  try {
    if (!isCurrent()) throw new Error("Upload cancelled.");
    let found = false;
    updatePlannerEvent(eventId, current => { found = true; return addEventFileRecords(current, records); });
    if (!found) throw new Error("This event no longer exists.");
    return records;
  } catch (problem) { await deleteBudgetAttachments(records.map(record => record.storageId)).catch(() => undefined); throw problem; }
}
