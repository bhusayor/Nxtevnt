"use client";

import { useState } from "react";
import { FileText, Plus } from "@/components/ui/icons";
import { EventFilePreview, EventFileUploadDialog } from "./event-file-dialogs";
import { eventFileFolders, type EventFileView } from "@/lib/event-files";
import type { PlannerEvent } from "@/lib/planner-events";

export function NoteFileAttachments({ event, noteId }: { event: PlannerEvent; noteId: string }) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<EventFileView | null>(null);
  const ids = new Set((event.fileEntries ?? []).filter(file => file.sourceNoteId === noteId).map(file => file.id));
  const files = eventFileFolders(event).flatMap(folder => folder.files).filter(file => ids.has(file.id));
  return <div className="mt-4 space-y-2">
    {files.length > 0 && <ul aria-label="Note attachments" className="flex flex-wrap gap-2">{files.map(file => <li key={file.id}><button type="button" onClick={() => setPreview(file)} className="inline-flex min-h-10 max-w-full items-center gap-2 rounded-lg border border-border-subtle px-3 py-2 text-left text-sm text-brand-primary hover:bg-background-subtle"><FileText className="size-4 shrink-0" aria-hidden="true" /><span className="break-words">{file.name}</span></button></li>)}</ul>}
    <button type="button" disabled={Boolean(event.cancelledAt)} aria-label="Attach files to note" onClick={() => setUploading(true)} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg px-2 text-sm font-medium text-brand-primary hover:bg-background-subtle disabled:opacity-40"><Plus className="size-4" aria-hidden="true" />Attach file</button>
    {uploading && <EventFileUploadDialog event={event} sourceNoteId={noteId} onClose={() => setUploading(false)} />}
    {preview && <EventFilePreview key={preview.id} file={preview} onClose={() => setPreview(null)} />}
  </div>;
}
