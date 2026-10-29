import { getEventNotes, type PlannerEvent } from "./planner-events";
import type { BudgetItem } from "./planner-budget";
import { activeMoodboardPhotos } from "./planner-moodboards";

export const systemFileFolders = [
  { id: "system:moodboard-images", name: "Moodboard images" },
  { id: "system:event-pictures", name: "Event pictures" },
  { id: "system:receipts", name: "Receipts" },
  { id: "system:budget-attachments", name: "Budget attachments" },
  { id: "system:invoices", name: "Invoices" },
] as const;
export type EventFileFolder = { id: string; name: string; createdAt: string };
export type EventFileRecord = { id: string; folderId: string; name: string; type: string; size: number; createdAt: string; storageId: string; sourceNoteId?: string };
export type EventFileOverride = { name?: string; folderId?: string };
export type EventFileView = { id: string; folderId: string; name: string; type: string; size?: number; addedAt: string; sourceLabel: string; location: { kind: "document" | "image" | "link"; value: string; sourceUrl?: string } };
export type EventFolderView = EventFileFolder & { system: boolean; legacy?: boolean; files: EventFileView[] };
export type FolderFilter = "all" | "yours" | "system";
export type FolderSort = "recent" | "name";
export const legacyFilesFolderId = "legacy:linked-files";

export function safeFileLink(value: string) {
  try { const parsed = new URL(value); return ["https:", "http:"].includes(parsed.protocol) ? parsed.href : null; }
  catch { return null; }
}
export function safeFileImage(value: string) {
  return /^data:image\/(jpeg|png|webp|gif);base64,/i.test(value) || /^\/(?!\/)/.test(value) ? value : safeFileLink(value);
}
export function fileIsImage(file: Pick<EventFileView, "type" | "name">) {
  return /^image\/(jpeg|png|webp|gif)$/.test(file.type) || /\.(png|jpe?g|webp|gif)$/i.test(file.name);
}
export function fileSizeLabel(size?: number) {
  if (size === undefined) return "";
  if (size < 1024) return `${size} B`;
  return size < 1024 * 1024 ? `${Math.round(size / 1024)} KB` : `${(size / 1024 / 1024).toFixed(1)} MB`;
}

/** Live indexes, not copies: removing a source attachment removes its Files entry too. */
export function eventFileFolders(event: PlannerEvent, budgetItems: readonly BudgetItem[] = []): EventFolderView[] {
  const folders: EventFolderView[] = [
    ...systemFileFolders.map(folder => ({ ...folder, createdAt: event.createdAt, system: true, files: [] })),
    ...(event.fileFolders ?? []).map(folder => ({ ...folder, system: false, files: [] })),
  ];
  const byId = new Map(folders.map(folder => [folder.id, folder]));
  const seen = new Set<string>();
  const add = (file: EventFileView) => {
    if (seen.has(file.id)) return;
    const override = event.fileOverrides?.[file.id];
    const folder = byId.get(override?.folderId || file.folderId) ?? byId.get(file.folderId);
    if (folder) { folder.files.push({ ...file, folderId: folder.id, name: override?.name || file.name }); seen.add(file.id); }
  };
  for (const file of event.fileEntries ?? []) add({ ...file, sourceLabel: file.sourceNoteId ? "Notes" : "Files", addedAt: file.createdAt, location: { kind: "document", value: file.storageId } });
  for (const image of activeMoodboardPhotos({ ...event, sections: { ...event.sections, moodboard: event.sections.moodboard ?? [] } })) add({ id: `moodboard:${image.id}`, folderId: "system:moodboard-images", name: image.title, type: "image/jpeg", addedAt: image.imageAddedAt || event.createdAt, sourceLabel: "Mood board", location: { kind: "image", value: image.image! } });
  if (event.image) add({ id: `cover:${event.id}`, folderId: "system:event-pictures", name: "Event cover", type: "image/jpeg", addedAt: event.createdAt, sourceLabel: "Event cover", location: { kind: "image", value: event.image } });
  for (const item of budgetItems.filter(item => item.eventId === event.id)) {
    for (const attachment of item.attachments ?? []) add({ ...attachment, id: `budget:${attachment.id}`, folderId: attachment.category === "invoice" ? "system:invoices" : "system:budget-attachments", addedAt: item.createdAt, sourceLabel: `Budget · ${item.name}`, location: { kind: "document", value: attachment.id, sourceUrl: attachment.sourceUrl } });
    for (const payment of item.payments ?? []) if (payment.receipt) add({ ...payment.receipt, id: `receipt:${payment.receipt.id}`, folderId: "system:receipts", addedAt: payment.createdAt, sourceLabel: `Payment · ${item.name}`, location: { kind: "document", value: payment.receipt.id } });
  }
  if (event.sections.files?.length) {
    const folder: EventFolderView = { id: legacyFilesFolderId, name: "Linked files", createdAt: event.createdAt, system: false, legacy: true, files: [] };
    folders.push(folder); byId.set(folder.id, folder);
    for (const item of event.sections.files) add({ id: `legacy:${item.id}`, folderId: folder.id, name: item.title, type: "link", addedAt: event.createdAt, sourceLabel: "Saved link", location: { kind: "link", value: safeFileLink(item.url || "") || "" } });
  }
  return folders;
}
export function visibleFileFolders(folders: EventFolderView[], filter: FolderFilter, search: string, sort: FolderSort) {
  const term = search.trim().toLocaleLowerCase();
  const modified = (folder: EventFolderView) => Math.max(Date.parse(folder.createdAt) || 0, ...folder.files.map(file => Date.parse(file.addedAt) || 0));
  return folders.filter(folder => (filter === "all" || filter === "system" && folder.system || filter === "yours" && !folder.system) && folder.name.toLocaleLowerCase().includes(term))
    .sort((a, b) => sort === "name" ? a.name.localeCompare(b.name) : modified(b) - modified(a));
}
function writable(event: PlannerEvent) {
  if (event.cancelledAt) throw new Error("Reopen this event before adding files or folders.");
}
export function createEventFileFolder(event: PlannerEvent, folder: EventFileFolder): PlannerEvent {
  writable(event);
  const name = folder.name.trim();
  if (!name || name.length > 80) throw new Error("Use a folder name of 1–80 characters.");
  if (!folder.id || folder.id.startsWith("system:") || folder.id === legacyFilesFolderId || eventFileFolders(event).some(entry => entry.id === folder.id || entry.name.toLocaleLowerCase() === name.toLocaleLowerCase())) throw new Error("A folder with this name already exists. Choose another name.");
  return { ...event, fileFolders: [...(event.fileFolders ?? []), { ...folder, name }] };
}

export function deleteEventFileFolder(event: PlannerEvent, folderId: string): PlannerEvent {
  writable(event);
  if (!(event.fileFolders ?? []).some((folder) => folder.id === folderId)) throw new Error("This folder can’t be deleted.");
  return {
    ...event,
    fileFolders: (event.fileFolders ?? []).filter((folder) => folder.id !== folderId),
    fileEntries: (event.fileEntries ?? []).filter((file) => file.folderId !== folderId),
    fileOverrides: Object.fromEntries(Object.entries(event.fileOverrides ?? {}).filter(([, value]) => value.folderId !== folderId)),
  };
}
export function renameEventFile(event: PlannerEvent, fileId: string, name: string, budgetItems: readonly BudgetItem[] = []): PlannerEvent {
  writable(event);
  const nextName = name.trim();
  if (!nextName || nextName.length > 120) throw new Error("Use a file name of 1–120 characters.");
  const file = eventFileFolders(event, budgetItems).flatMap(folder => folder.files).find(entry => entry.id === fileId);
  if (!file && !event.fileEntries?.some(entry => entry.id === fileId)) throw new Error("This file no longer exists.");
  if (event.fileEntries?.some(entry => entry.id === fileId)) return { ...event, fileEntries: event.fileEntries.map(entry => entry.id === fileId ? { ...entry, name: nextName } : entry) };
  return { ...event, fileOverrides: { ...event.fileOverrides, [fileId]: { ...event.fileOverrides?.[fileId], name: nextName } } };
}
export function moveEventFile(event: PlannerEvent, fileId: string, folderId: string, budgetItems: readonly BudgetItem[] = []): PlannerEvent {
  writable(event);
  const file = eventFileFolders(event, budgetItems).flatMap(folder => folder.files).find(entry => entry.id === fileId);
  if (!file && !event.fileEntries?.some(entry => entry.id === fileId)) throw new Error("This file no longer exists.");
  const destination = eventFileFolders(event).find(folder => folder.id === folderId && !folder.legacy);
  if (!destination) throw new Error("Choose an available folder.");
  if (["system:moodboard-images", "system:event-pictures"].includes(folderId) && file && !fileIsImage(file)) throw new Error("Only images can go in this folder.");
  if (event.fileEntries?.some(entry => entry.id === fileId)) return { ...event, fileEntries: event.fileEntries.map(entry => entry.id === fileId ? { ...entry, folderId } : entry) };
  return { ...event, fileOverrides: { ...event.fileOverrides, [fileId]: { ...event.fileOverrides?.[fileId], folderId } } };
}
export function addEventFileRecords(event: PlannerEvent, records: EventFileRecord[]): PlannerEvent {
  writable(event);
  const folders = new Set(eventFileFolders(event).filter(folder => !folder.legacy).map(folder => folder.id));
  const ids = new Set((event.fileEntries ?? []).map(file => file.id));
  for (const record of records) {
    if (!folders.has(record.folderId)) throw new Error("This folder no longer exists. Choose another folder.");
    if (record.sourceNoteId && !getEventNotes(event).some(note => note.id === record.sourceNoteId)) throw new Error("This note no longer exists. Return to Notes and try again.");
    if (["system:moodboard-images", "system:event-pictures"].includes(record.folderId) && !fileIsImage(record)) throw new Error("Choose image files for this folder, or select a document folder.");
    if (!record.id || ids.has(record.id) || !record.storageId || !record.name.trim() || record.size <= 0 || record.size > 15 * 1024 * 1024) throw new Error("This file could not be added. Choose it again.");
    ids.add(record.id);
  }
  return { ...event, fileEntries: [...(event.fileEntries ?? []), ...records] };
}
