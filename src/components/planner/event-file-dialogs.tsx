"use client";

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import Image from "next/image";
import * as Dialog from "@radix-ui/react-dialog";
import { Download, FileText, Folder, UploadCloud, X } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { eventFileFolders, fileIsImage, fileSizeLabel, safeFileImage, safeFileLink, type EventFileView } from "@/lib/event-files";
import { uploadEventFiles } from "@/lib/event-file-storage";
import { getBudgetAttachment } from "@/lib/budget-attachments";
import { readMoodboardImage, useMoodboardImage } from "@/lib/moodboard-images";
import type { PlannerEvent } from "@/lib/planner-events";

export function EventFileDialog({ title, description, onClose, children, busy = false }: { title: string; description: string; onClose: () => void; children: ReactNode; busy?: boolean }) {
  return <Dialog.Root open onOpenChange={open => { if (!open && !busy) onClose(); }}><Dialog.Portal><Dialog.Overlay className="fixed inset-0 z-50 bg-[#10231a]/50 backdrop-blur-[2px]" /><Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90dvh] w-[calc(100vw-2rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl bg-white p-5 shadow-lg focus:outline-none sm:p-6"><div className="mb-5 flex items-start justify-between gap-3"><div><Dialog.Title className="break-words text-lg font-semibold">{title}</Dialog.Title><Dialog.Description className="mt-1 text-sm leading-6 text-text-secondary">{description}</Dialog.Description></div><button type="button" aria-label="Close" onClick={onClose} disabled={busy} className="flex size-10 shrink-0 items-center justify-center rounded-full border border-border-subtle disabled:opacity-40"><X className="size-4" aria-hidden="true" /></button></div>{children}</Dialog.Content></Dialog.Portal></Dialog.Root>;
}

export function EventFileUploadDialog({ event, folderId = "system:budget-attachments", sourceNoteId, onClose, onSaved }: { event: PlannerEvent; folderId?: string; sourceNoteId?: string; onClose: () => void; onSaved?: () => void }) {
  const [destination, setDestination] = useState(folderId);
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const active = useRef(true), saving = useRef(false);
  useEffect(() => { active.current = true; return () => { active.current = false; }; }, []);
  const folders = eventFileFolders(event).filter(folder => !folder.legacy);
  async function save(form: FormEvent) {
    form.preventDefault(); if (saving.current) return;
    saving.current = true; setBusy(true); setError("");
    try { await uploadEventFiles(event.id, destination, files, sourceNoteId, () => active.current); if (active.current) { onSaved?.(); onClose(); } }
    catch (problem) { if (active.current) setError(problem instanceof Error ? problem.message : "These files couldn’t be saved. Try again."); }
    finally { saving.current = false; if (active.current) setBusy(false); }
  }
  return <EventFileDialog title={sourceNoteId ? "Attach files to note" : "Upload files"} description="Choose a folder for your files. They’ll be available in this event’s Files tab." onClose={onClose} busy={busy}>
    <form onSubmit={save} className="space-y-4">
      <label className="grid gap-2 text-sm font-medium">Folder<select aria-label="Upload destination folder" value={destination} disabled={busy} onChange={change => setDestination(change.target.value)} className="h-11 w-full rounded-lg border border-border-subtle bg-white px-3 text-sm">{folders.map(folder => <option key={folder.id} value={folder.id}>{folder.name}</option>)}</select></label>
      <label className="flex cursor-pointer flex-col items-center rounded-xl border border-dashed border-border-strong bg-[#f8faf8] px-5 py-7 text-center" onDragOver={drag => drag.preventDefault()} onDrop={drag => { drag.preventDefault(); if (!busy) setFiles(Array.from(drag.dataTransfer.files)); }}><UploadCloud className="mb-3 size-7 text-brand-primary" aria-hidden="true" /><span className="text-sm font-semibold">Choose files or drag them here</span><span className="mt-2 text-sm leading-6 text-text-secondary">Images, PDF, Word, Excel, CSV or text · up to 15 MB each</span><input type="file" aria-label="Choose event files" multiple disabled={busy} accept=".pdf,.png,.jpg,.jpeg,.webp,.gif,.doc,.docx,.xls,.xlsx,.xlsm,.csv,.txt" onChange={change => setFiles(Array.from(change.target.files ?? []))} className="mt-4 w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-white file:px-3 file:py-2 file:font-medium file:text-brand-primary" /></label>
      {files.length > 0 && <ul aria-label="Selected files" className="space-y-2">{files.map((file, index) => <li key={`${file.name}-${index}`} className="flex items-center justify-between gap-3 text-sm"><span className="min-w-0 break-words">{file.name}</span><span className="shrink-0 text-text-tertiary">{fileSizeLabel(file.size)}</span></li>)}</ul>}
      <p className="text-sm text-text-tertiary">Files are stored in this browser.</p>
      {error && <p role="alert" className="rounded-lg bg-error-soft p-3 text-sm text-error">{error}</p>}
      <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={onClose} disabled={busy}>Cancel</Button><Button type="submit" disabled={busy || !files.length}>{busy ? "Saving files…" : "Upload files"}</Button></div>
    </form>
  </EventFileDialog>;
}

export function EventFileThumbnail({ file }: { file?: EventFileView }) {
  const image = useMoodboardImage(file?.location.kind === "image" ? file.location.value : undefined);
  const [loaded, setLoaded] = useState<{ id: string; url: string } | null>(null);
  const storageId = file?.location.kind === "document" && fileIsImage(file) ? file.location.value : undefined;
  useEffect(() => {
    if (!storageId) return;
    let active = true, url = "";
    getBudgetAttachment(storageId).then(blob => { if (active && blob) { url = URL.createObjectURL(blob); setLoaded({ id: storageId, url }); } }).catch(() => undefined);
    return () => { active = false; if (url) URL.revokeObjectURL(url); };
  }, [storageId]);
  const src = (image.src ? safeFileImage(image.src) : undefined) || (loaded?.id === storageId ? loaded?.url : undefined);
  return src ? <Image src={src} alt="" fill unoptimized sizes="(min-width: 1280px) 25vw, 50vw" className="object-cover" /> : <Folder className="size-12 text-[#bcc8c0]" weight="duotone" aria-hidden="true" />;
}

export function EventFilePreview({ file, onClose }: { file: EventFileView; onClose: () => void }) {
  const [result, setResult] = useState<{ url: string; error?: string } | null>(null);
  useEffect(() => {
    let active = true, created = "";
    async function load() {
      try {
        let url = "";
        if (file.location.kind === "document") { const blob = await getBudgetAttachment(file.location.value); if (!blob) throw new Error("This file isn’t available in this browser. Upload it again from its original section."); created = URL.createObjectURL(blob); url = created; }
        else if (file.location.kind === "image") { url = safeFileImage(await readMoodboardImage(file.location.value)) || ""; if (!url) throw new Error("This image source is unavailable or unsafe to open."); }
        else { url = safeFileLink(file.location.value) || ""; if (!url) throw new Error("This saved link is unavailable or unsafe to open."); }
        if (active) setResult({ url }); else if (created) { URL.revokeObjectURL(created); created = ""; }
      } catch (problem) { if (active) setResult({ url: "", error: problem instanceof Error ? problem.message : "This file couldn’t be opened." }); }
    }
    void load();
    return () => { active = false; if (created) URL.revokeObjectURL(created); };
  }, [file]);
  const pdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name);
  return <EventFileDialog title={file.name} description={[file.sourceLabel, fileSizeLabel(file.size)].filter(Boolean).join(" · ")} onClose={onClose}>
    {!result ? <p role="status" className="py-10 text-center text-sm text-text-secondary">Opening file…</p> : result.error ? <p role="alert" className="rounded-xl bg-error-soft p-4 text-sm text-error">{result.error}</p> : <>
      {fileIsImage(file) || file.location.kind === "image" ? <Image src={result.url} alt={file.name} width={1200} height={900} unoptimized className="max-h-[60dvh] w-full rounded-xl object-contain" /> : pdf && file.location.kind === "document" ? <iframe title={file.name} src={result.url} sandbox="" className="h-[60dvh] w-full rounded-xl border border-border-subtle" /> : <div className="rounded-xl bg-[#f8faf8] p-8 text-center"><FileText className="mx-auto size-10 text-brand-primary" aria-hidden="true" /><p className="mt-3 text-sm">{file.location.kind === "link" ? "Open the saved document in a new tab." : "Download this file to view it on your device."}</p></div>}
      <div className="mt-5 flex justify-end"><a href={result.url} download={file.location.kind === "link" ? undefined : file.name} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-border-subtle px-4 text-sm font-semibold text-brand-primary"><Download className="size-4" aria-hidden="true" />{file.location.kind === "link" ? "Open link" : "Download file"}</a></div>
    </>}
  </EventFileDialog>;
}
