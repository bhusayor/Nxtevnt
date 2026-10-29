"use client";

import { useState } from "react";
import { FileText, Plus } from "@/components/ui/icons";
import { EventFilePreview, EventFileUploadDialog } from "./event-file-dialogs";
import { eventFileFolders, moveEventFile, renameEventFile, type EventFileView } from "@/lib/event-files";
import { updatePlannerEvent, type PlannerEvent } from "@/lib/planner-events";
import { deleteBudgetAttachments } from "@/lib/budget-attachments";

export function NoteFileAttachments({ event, noteId }: { event: PlannerEvent; noteId: string }) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<EventFileView | null>(null);
  const ids = new Set((event.fileEntries ?? []).filter(file => file.sourceNoteId === noteId).map(file => file.id));
  const files = eventFileFolders(event).flatMap(folder => folder.files).filter(file => ids.has(file.id));
  function persist(change: (current: PlannerEvent) => PlannerEvent) {
    let found = false;
    updatePlannerEvent(event.id, current => { found = true; return change(current); });
    if (!found) throw new Error("This event no longer exists.");
  }
  return <div className="mt-4 space-y-2">
    {files.length > 0 && <ul aria-label="Note attachments" className="flex flex-wrap gap-2">{files.map(file => <li key={file.id}><button type="button" onClick={() => setPreview(file)} className="inline-flex min-h-10 max-w-full items-center gap-2 rounded-lg border border-border-subtle px-3 py-2 text-left text-sm text-brand-primary hover:bg-background-subtle"><FileText className="size-4 shrink-0" aria-hidden="true" /><span className="break-words">{file.name}</span></button></li>)}</ul>}
    <button type="button" disabled={Boolean(event.cancelledAt)} aria-label="Attach files to note" onClick={() => setUploading(true)} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg px-2 text-sm font-medium text-brand-primary hover:bg-background-subtle disabled:opacity-40"><Plus className="size-4" aria-hidden="true" />Attach file</button>
    {uploading && <EventFileUploadDialog event={event} sourceNoteId={noteId} onClose={() => setUploading(false)} />}
    {preview && <EventFilePreview key={preview.id} file={preview} folders={eventFileFolders(event).filter(folder => !folder.legacy).map(folder => ({ id: folder.id, name: folder.name }))} readOnly={Boolean(event.cancelledAt)} onClose={() => setPreview(null)} onRename={async name => { persist(current => renameEventFile(current, preview.id, name)); setPreview({ ...preview, name: name.trim() }); }} onMove={async folderId => { persist(current => moveEventFile(current, preview.id, folderId)); setPreview(null); }} onDelete={async () => { const stored = event.fileEntries?.find(entry => entry.id === preview.id)?.storageId; persist(current => ({ ...current, fileEntries: (current.fileEntries ?? []).filter(entry => entry.id !== preview.id) })); setPreview(null); if (stored) await deleteBudgetAttachments([stored]); }} />}
  </div>;
}
