import type { EventItem, PlannerEvent, TaskComment } from "./planner-events";

export const moodboardLimit = 6;
export const moodboardImageLimit = 50;
export const legacyMoodboardId = "legacy-moodboard";
export type MoodboardSource = "planner" | "client";
export type BoardActivity = { id: string; kind: "comment" | "created" | "photos" | "updated"; body: string; author: string; createdAt: string };
export type MoodboardBoard = { id: string; title: string; description?: string; source: MoodboardSource; coverId?: string; createdBy: string; createdAt: string; updatedAt: string; archivedAt?: string; activity: BoardActivity[] };

/** Old loose photos/links remain visible without rewriting saved events on read. */
export function eventMoodboards(event: PlannerEvent): MoodboardBoard[] {
  const boards = event.moodboardBoards ?? [];
  const known = new Set(boards.map((board) => board.id));
  const loose = event.sections.moodboard.filter((item) => !item.boardId || !known.has(item.boardId));
  if (!loose.length) return boards;
  if (known.has(legacyMoodboardId)) return boards;
  return [{ id: legacyMoodboardId, title: "Event inspiration", description: "The venue photos and inspiration already collected for this event.", source: "planner", createdBy: "Planner", createdAt: event.createdAt, updatedAt: event.createdAt, activity: [] }, ...boards];
}

export function itemsInBoard(event: PlannerEvent, boardId: string): EventItem[] {
  const known = new Set((event.moodboardBoards ?? []).map((board) => board.id));
  return event.sections.moodboard.filter((item) => item.boardId === boardId || boardId === legacyMoodboardId && (!item.boardId || !known.has(item.boardId)));
}

export function activeMoodboardPhotos(event: PlannerEvent) {
  const boards = eventMoodboards(event).filter((board) => !board.archivedAt);
  return boards.flatMap((board) => itemsInBoard(event, board.id).filter((item) => item.image && !item.imageArchivedAt));
}

function materialize(event: PlannerEvent): PlannerEvent {
  const boards = eventMoodboards(event);
  const known = new Set(boards.map((board) => board.id));
  return { ...event, moodboardBoards: boards, sections: { ...event.sections, moodboard: event.sections.moodboard.map((item) => item.boardId && known.has(item.boardId) ? item : { ...item, boardId: legacyMoodboardId }) } };
}

function requireBoard(event: PlannerEvent, id: string, writable = true) {
  const board = event.moodboardBoards?.find((entry) => entry.id === id);
  if (!board) throw new Error("This board no longer exists. Return to all boards and try again.");
  if (writable && board.archivedAt) throw new Error("Restore this board before making changes.");
  return board;
}

function cleanBoard(input: Pick<MoodboardBoard, "title" | "description" | "source">) {
  const title = input.title.trim(), description = input.description?.trim();
  if (!title || title.length > 80) throw new Error("Give your board a name of 1–80 characters.");
  if (description && description.length > 600) throw new Error("Keep the board description under 600 characters.");
  if (!["planner", "client"].includes(input.source)) throw new Error("Choose where this inspiration came from.");
  return { title, description: description || undefined, source: input.source };
}

function record(event: PlannerEvent, id: string, activity: BoardActivity): PlannerEvent {
  return { ...event, moodboardBoards: event.moodboardBoards!.map((board) => board.id === id ? { ...board, updatedAt: activity.createdAt, activity: [...board.activity, activity] } : board) };
}

export function createMoodboard(event: PlannerEvent, input: Pick<MoodboardBoard, "id" | "title" | "description" | "source">, activity: BoardActivity): PlannerEvent {
  const current = materialize(event), fields = cleanBoard(input);
  if (current.moodboardBoards!.filter((board) => !board.archivedAt).length >= moodboardLimit) throw new Error("You have 6 active boards. Archive a board before creating another.");
  if (!input.id || current.moodboardBoards!.some((board) => board.id === input.id)) throw new Error("This board already exists.");
  return { ...current, moodboardBoards: [...current.moodboardBoards!, { ...fields, id: input.id, createdBy: activity.author, createdAt: activity.createdAt, updatedAt: activity.createdAt, activity: [activity] }] };
}

export function editMoodboard(event: PlannerEvent, id: string, input: Pick<MoodboardBoard, "title" | "description" | "source">, activity: BoardActivity): PlannerEvent {
  const current = materialize(event); requireBoard(current, id);
  return record({ ...current, moodboardBoards: current.moodboardBoards!.map((board) => board.id === id ? { ...board, ...cleanBoard(input) } : board) }, id, activity);
}

export function archiveMoodboard(event: PlannerEvent, id: string, archived: boolean, activity: BoardActivity): PlannerEvent {
  const current = materialize(event), board = requireBoard(current, id, false);
  if (archived === Boolean(board.archivedAt)) return current;
  if (!archived && current.moodboardBoards!.filter((entry) => !entry.archivedAt).length >= moodboardLimit) throw new Error("Archive another board first. You can have 6 active boards at a time.");
  return record({ ...current, moodboardBoards: current.moodboardBoards!.map((entry) => entry.id === id ? { ...entry, archivedAt: archived ? activity.createdAt : undefined } : entry) }, id, activity);
}

export function addMoodboardItems(event: PlannerEvent, id: string, items: EventItem[], activity: BoardActivity): PlannerEvent {
  const current = materialize(event); requireBoard(current, id);
  const existing = itemsInBoard(current, id);
  if (existing.filter((item) => item.image).length + items.filter((item) => item.image).length > moodboardImageLimit) throw new Error("A board can hold up to 50 images. Choose fewer images or use another board.");
  const ids = new Set(current.sections.moodboard.map((item) => item.id));
  for (const item of items) {
    validateItem(item);
    if (!item.id || ids.has(item.id)) throw new Error("This image or link has already been added.");
    ids.add(item.id);
  }
  return record({ ...current, sections: { ...current.sections, moodboard: [...current.sections.moodboard, ...items.map((item) => ({ ...item, title: item.title.trim(), boardId: id }))] } }, id, activity);
}

function validateItem(item: EventItem) {
  if (!item.title.trim() || item.title.trim().length > 120) throw new Error("Add a caption of 1–120 characters.");
  if ((item.detail?.length ?? 0) > 600) throw new Error("Keep photo notes under 600 characters.");
  if (!item.image) {
    try { if (!["http:", "https:"].includes(new URL(item.url || "").protocol)) throw new Error(); }
    catch { throw new Error("Add a valid https:// inspiration link."); }
  }
}

export function editMoodboardItem(event: PlannerEvent, boardId: string, item: EventItem, activity: BoardActivity): PlannerEvent {
  const current = materialize(event); requireBoard(current, boardId); validateItem(item);
  const existing = itemsInBoard(current, boardId).find((entry) => entry.id === item.id);
  if (!existing) throw new Error("This image or link no longer exists.");
  if (existing.imageArchivedAt) throw new Error("Restore this image before editing it.");
  // Caption editing cannot replace image data or turn a link into a photo.
  const updated = { ...existing, title: item.title.trim(), detail: item.detail?.trim() || undefined, ...(existing.image ? { imageCategory: item.imageCategory } : { url: item.url }) };
  return record({ ...current, sections: { ...current.sections, moodboard: current.sections.moodboard.map((entry) => entry.id === item.id ? updated : entry) } }, boardId, activity);
}

export function setMoodboardCover(event: PlannerEvent, boardId: string, photoId: string, activity: BoardActivity): PlannerEvent {
  const current = materialize(event); requireBoard(current, boardId);
  if (!itemsInBoard(current, boardId).some((item) => item.id === photoId && item.image && !item.imageArchivedAt)) throw new Error("Choose an active photo from this board for its cover.");
  return record({ ...current, moodboardBoards: current.moodboardBoards!.map((board) => board.id === boardId ? { ...board, coverId: photoId } : board) }, boardId, activity);
}

export function removeMoodboardItem(event: PlannerEvent, boardId: string, itemId: string, activity: BoardActivity): PlannerEvent {
  const current = materialize(event); requireBoard(current, boardId);
  if (!itemsInBoard(current, boardId).some((item) => item.id === itemId)) throw new Error("This image or link no longer exists.");
  return record({ ...current, moodboardBoards: current.moodboardBoards!.map((board) => board.id === boardId && board.coverId === itemId ? { ...board, coverId: undefined } : board), sections: { ...current.sections, decisions: preserveDecisionImages(current, new Set([itemId])), moodboard: current.sections.moodboard.filter((item) => item.id !== itemId) } }, boardId, activity);
}

// Older approvals only stored a source link. Retain that original image before deleting its source.
function preserveDecisionImages(event: PlannerEvent, removedIds: Set<string>) {
  return event.sections.decisions.map((decision) => {
    if (decision.image || decision.decisionRecord || !decision.sourceMoodboardImageId || !removedIds.has(decision.sourceMoodboardImageId)) return decision;
    const image = event.sections.moodboard.find((item) => item.id === decision.sourceMoodboardImageId)?.image;
    return image ? { ...decision, image } : decision;
  });
}

export function deleteMoodboard(event: PlannerEvent, id: string): PlannerEvent {
  const current = materialize(event); requireBoard(current, id, false);
  return { ...current, moodboardBoards: current.moodboardBoards!.filter((board) => board.id !== id), sections: { ...current.sections, decisions: preserveDecisionImages(current, new Set(itemsInBoard(current, id).map((item) => item.id))), moodboard: current.sections.moodboard.filter((item) => item.boardId !== id) } };
}

export function commentOnMoodboard(event: PlannerEvent, id: string, activity: BoardActivity): PlannerEvent {
  const current = materialize(event), board = requireBoard(current, id);
  const body = activity.body.trim();
  if (activity.kind !== "comment" || !body || body.length > 2000) throw new Error("Write a comment of 1–2,000 characters.");
  if (board.activity.some((entry) => entry.id === activity.id)) return current;
  return record(current, id, { ...activity, body });
}

export type MoodboardImageChange = { feedback?: EventItem["imageFeedback"] | null; liked?: boolean; pinned?: boolean; archived?: boolean; category?: string };

export function isMoodboardImageLiked(photo: EventItem) { return photo.imageLiked ?? photo.imageFeedback === "like"; }

/** Latest pin comes first, while unpinned photos retain their original order. */
export function orderMoodboardPhotos(photos: EventItem[]) {
  return [...photos].sort((first, second) => Number(Boolean(second.imagePinned)) - Number(Boolean(first.imagePinned)) || (first.imagePinned && second.imagePinned ? (second.imagePinOrder || 0) - (first.imagePinOrder || 0) : 0));
}

export function updateMoodboardImage(event: PlannerEvent, boardId: string, photoId: string, change: MoodboardImageChange, activity: BoardActivity): PlannerEvent {
  const current = materialize(event); requireBoard(current, boardId);
  const photo = itemsInBoard(current, boardId).find((item) => item.id === photoId && item.image);
  if (!photo) throw new Error("This image no longer exists in this board.");
  if (photo.imageArchivedAt && change.archived !== false) throw new Error("Restore this image before making changes.");
  if (change.feedback != null && !["like", "not-this", "approved"].includes(change.feedback)) throw new Error("Choose valid image feedback.");
  if (change.category && !["Venue", "Ceremony", "Reception", "Styling", "Other"].includes(change.category)) throw new Error("Choose a valid image category.");
  const updated: EventItem = { ...photo,
    ...(Object.hasOwn(change, "feedback") ? { imageFeedback: change.feedback || undefined } : {}),
    ...(Object.hasOwn(change, "liked") ? { imageLiked: Boolean(change.liked), ...(photo.imageFeedback === "like" ? { imageFeedback: undefined } : {}) } : {}),
    ...(Object.hasOwn(change, "pinned") ? { imagePinned: Boolean(change.pinned), imagePinOrder: change.pinned ? Math.max(0, ...itemsInBoard(current, boardId).map((item) => Number.isFinite(item.imagePinOrder) ? item.imagePinOrder! : 0)) + 1 : undefined } : {}),
    ...(Object.hasOwn(change, "archived") ? { imageArchivedAt: change.archived ? activity.createdAt : undefined } : {}),
    ...(change.category ? { imageCategory: change.category } : {}),
  };
  return record({ ...current, moodboardBoards: current.moodboardBoards!.map((board) => board.id === boardId && board.coverId === photoId && change.archived ? { ...board, coverId: undefined } : board), sections: { ...current.sections, moodboard: current.sections.moodboard.map((item) => item.id === photoId ? updated : item) } }, boardId, activity);
}

export function commentOnMoodboardImage(event: PlannerEvent, boardId: string, photoId: string, comment: TaskComment): PlannerEvent {
  const current = materialize(event); requireBoard(current, boardId);
  const photo = itemsInBoard(current, boardId).find((item) => item.id === photoId && item.image);
  if (!photo) throw new Error("This image no longer exists in this board.");
  if (photo.imageArchivedAt) throw new Error("Restore this image to continue its conversation.");
  const body = comment.body.trim();
  if (!body || body.length > 2000) throw new Error("Write a comment of 1–2,000 characters.");
  if (photo.comments?.some((entry) => entry.id === comment.id)) return current;
  const updated = { ...current, sections: { ...current.sections, moodboard: current.sections.moodboard.map((item) => item.id === photoId ? { ...item, comments: [...(item.comments ?? []), { ...comment, body }] } : item) } };
  return record(updated, boardId, { id: comment.id, kind: "updated", body: `Commented on “${photo.title}”.`, author: comment.author, createdAt: comment.createdAt });
}

export type MoodboardApprovalMode = "client" | "on-behalf";
export type MoodboardApprovalInput = { method?: NonNullable<EventItem["designApproval"]>["method"]; evidence?: string; evidenceName?: string; expectedRevision?: string };
export const approvalMethods = { whatsapp: "WhatsApp", call: "Call", "in-person": "In person", email: "Email" } as const;

export function approveMoodboardImage(event: PlannerEvent, boardId: string, photoId: string, mode: MoodboardApprovalMode, activity: BoardActivity, input: MoodboardApprovalInput = {}): PlannerEvent {
  if (event.cancelledAt) throw new Error("Reopen this event before changing a decision.");
  const current = materialize(event), board = requireBoard(current, boardId);
  const photo = itemsInBoard(current, boardId).find((item) => item.id === photoId && item.image);
  if (!photo) throw new Error("This image no longer exists in this board.");
  if (photo.imageArchivedAt) throw new Error("Restore this image before requesting approval.");
  if (mode !== "client" && mode !== "on-behalf") throw new Error("Choose who is confirming this design decision.");
  if (photo.designApproval?.revision !== input.expectedRevision) throw new Error("This decision changed. Close and reopen it before editing.");
  if (mode === "on-behalf" && (!input.method || !Object.hasOwn(approvalMethods, input.method))) throw new Error("Choose how the client gave their approval.");
  if (input.evidence && !input.evidence.startsWith("nxtevnt-moodboard:")) throw new Error("Upload the screenshot before recording this decision.");
  const existing = current.sections.decisions.find((decision) => decision.sourceMoodboardImageId === photoId);
  if (existing) throw new Error("This image already has a decision. Use Change decision to preserve its history.");
  const decisionId = photo.designApproval?.decisionId || `moodboard-decision:${photoId}`;
  const designApproval: NonNullable<EventItem["designApproval"]> = { mode, state: mode === "client" ? "awaiting-confirmation" : "approved-on-behalf", by: activity.author, at: activity.createdAt, decisionId, revision: activity.id,
    ...(mode === "client" ? { requestedAt: activity.createdAt, delivery: "local-preview" as const } : { method: input.method, evidence: input.evidence, evidenceName: input.evidenceName?.slice(0, 180) }) };
  const decision: EventItem = { id: decisionId, image: photo.image, title: `Design: ${photo.title}`, detail: `${board.title} · ${mode === "client" ? "Awaiting client confirmation." : `Approval recorded by ${activity.author} on the client’s behalf.`}`, decisionCategory: "Design", sourceMoodboardImageId: photo.id, sourceMoodboardBoardId: boardId, designApproval, done: mode === "on-behalf" };
  return record({ ...current, sections: { ...current.sections,
    moodboard: current.sections.moodboard.map((item) => item.id === photoId ? { ...item, designApproval, ...(item.imageFeedback === "approved" || item.imageFeedback === "not-this" ? { imageFeedback: undefined } : {}) } : item),
    decisions: [...current.sections.decisions, decision],
  } }, boardId, activity);
}

/** Updates both sides of the linked decision atomically; an old client screen cannot confirm a revised request. */
export function respondToMoodboardApproval(event: PlannerEvent, boardId: string, photoId: string, revision: string | undefined, action: "confirm" | "remind", activity: BoardActivity): PlannerEvent {
  if (event.cancelledAt) throw new Error("This event was cancelled. Client confirmations are closed.");
  const current = materialize(event); requireBoard(current, boardId);
  const photo = itemsInBoard(current, boardId).find((item) => item.id === photoId && item.image);
  const approval = photo?.designApproval;
  if (!photo || photo.imageArchivedAt || !approval || approval.mode !== "client" || approval.state !== "awaiting-confirmation" || approval.revision !== revision) throw new Error("This request is no longer awaiting confirmation. Refresh the decision and try again.");
  if (action === "remind" && approval.remindedAt && Date.parse(activity.createdAt) - Date.parse(approval.remindedAt) < 60_000) throw new Error("A reminder was just added. Please wait a minute before reminding again.");
  const next = action === "confirm" ? { ...approval, revision: activity.id, state: "approved-by-client" as const, confirmedBy: activity.author, confirmedAt: activity.createdAt } : { ...approval, remindedAt: activity.createdAt, reminderCount: (approval.reminderCount ?? 0) + 1 };
  return record({ ...current, sections: { ...current.sections,
    moodboard: current.sections.moodboard.map((item) => item.id === photoId ? { ...item, designApproval: next } : item),
    decisions: current.sections.decisions.map((item) => item.id === approval.decisionId ? { ...item, designApproval: next, done: action === "confirm", detail: action === "confirm" ? `Approved by ${activity.author}.` : item.detail } : item),
  } }, boardId, activity);
}
