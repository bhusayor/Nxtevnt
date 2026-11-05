import { deleteBudgetAttachments } from "./budget-attachments";
import { deleteBudgetForEvent, type BudgetItem } from "./planner-budget";
import { deleteMoodboardImage } from "./moodboard-images";
import { deletePlannerEvent, getPlannerEventById, hasAttachedClient, type PlannerEvent } from "./planner-events";

/** The same cleanup applies whether deletion starts in a row or the workspace. */
export async function deleteEventWithContents(event: PlannerEvent, budgetItems: readonly BudgetItem[]) {
  const current = getPlannerEventById(event.id);
  if (!current) throw new Error("This event is no longer in your workspace.");
  if (hasAttachedClient(current) || current.accessRole === "invited") throw new Error("An event with an attached client cannot be deleted from this workspace.");
  const attachments = budgetItems.filter(item => item.eventId === event.id).flatMap(item => [
    ...item.attachments.map(attachment => attachment.id),
    ...(item.payments ?? []).flatMap(payment => payment.receipt ? [payment.receipt.id] : []),
  ]);
  await deleteBudgetAttachments(attachments);
  deleteBudgetForEvent(event.id);
  deletePlannerEvent(event.id);
  await deleteBudgetAttachments((event.fileEntries ?? []).map(file => file.storageId)).catch(() => undefined);
  await Promise.all([...event.sections.moodboard, ...event.sections.decisions].flatMap(item => [
    deleteMoodboardImage(item.image).catch(() => {}),
    deleteMoodboardImage(item.designApproval?.evidence).catch(() => {}),
  ]));
}
