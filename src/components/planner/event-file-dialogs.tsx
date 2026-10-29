"use client";

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import Image from "next/image";
import * as Dialog from "@radix-ui/react-dialog";
import { Download, FileText, Folder, FolderOpen, LoaderCircle, Pencil, Trash2, UploadCloud, X } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { EventTierChip } from "./event-tier-chip";
import { eventFileFolders, fileIsImage, fileSizeLabel, safeFileImage, safeFileLink, type EventFileView } from "@/lib/event-files";
import { uploadEventFiles } from "@/lib/event-file-storage";
import { getBudgetAttachment } from "@/lib/budget-attachments";
import { readMoodboardImage, useMoodboardImage } from "@/lib/moodboard-images";
import type { PlannerEvent } from "@/lib/planner-events";
import { cn } from "@/lib/utils/cn";

export const eventFileInputTypes = ".png,.jpg,.jpeg,.webp,.gif,.pdf,.csv,.xls,.xlsx,.xlsm,.doc,.docx,.txt";
export function eventFileAcceptForFolder(folderId: string) {
  if (["system:moodboard-images", "system:event-pictures"].includes(folderId)) return ".png,.jpg,.jpeg,.webp,.gif";
  if (folderId === "system:receipts") return ".png,.jpg,.jpeg,.webp,.pdf";
  return eventFileInputTypes;
}

export function EventFileDialog({ title, description, onClose, children, busy = false, compact = false }: { title: string; description: string; onClose: () => void; children: ReactNode; busy?: boolean; compact?: boolean }) {
  return <Dialog.Root open onOpenChange={open => { if (!open && !busy) onClose(); }}><Dialog.Portal><Dialog.Overlay className="fixed inset-0 z-50 bg-[#10231a]/50 backdrop-blur-[2px]" /><Dialog.Content className={`fixed left-1/2 top-1/2 z-50 max-h-[90dvh] w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl bg-white p-5 shadow-lg focus:outline-none sm:p-6 ${compact ? "max-w-md" : "max-w-2xl"}`}><div className="mb-5 flex items-start justify-between gap-3"><div><Dialog.Title className="break-words text-lg font-semibold">{title}</Dialog.Title><Dialog.Description className="mt-1 text-sm leading-6 text-text-secondary">{description}</Dialog.Description></div><button type="button" aria-label="Close" onClick={onClose} disabled={busy} className="flex size-10 shrink-0 items-center justify-center rounded-full border border-border-subtle disabled:opacity-40"><X className="size-4" aria-hidden="true" /></button></div>{children}</Dialog.Content></Dialog.Portal></Dialog.Root>;
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
    try {
      const started = performance.now();
      await uploadEventFiles(event.id, destination, files, sourceNoteId, () => active.current);
      const remaining = 500 - (performance.now() - started);
      if (remaining > 0) await new Promise(resolve => setTimeout(resolve, remaining));
      if (active.current) { onSaved?.(); onClose(); }
    }
    catch (problem) { if (active.current) setError(problem instanceof Error ? problem.message : "These files couldn’t be saved. Try again."); }
    finally { saving.current = false; if (active.current) setBusy(false); }
  }
  return <EventFileDialog title={sourceNoteId ? "Attach files to note" : "Upload files"} description="Choose a folder for your files. They’ll be available in this event’s Files tab." onClose={onClose} busy={busy}>
    <form onSubmit={save} className="space-y-4">
      <label className="grid gap-2 text-sm font-medium">Folder<select aria-label="Upload destination folder" value={destination} disabled={busy} onChange={change => setDestination(change.target.value)} className="h-11 w-full rounded-lg border border-border-subtle bg-white px-3 text-sm">{folders.map(folder => <option key={folder.id} value={folder.id}>{folder.name}</option>)}</select></label>
      <label className={cn("flex cursor-pointer flex-col items-center rounded-xl border border-dashed border-border-strong bg-[#f8faf8] px-5 py-7 text-center", busy && "pointer-events-none opacity-60")} onDragOver={drag => drag.preventDefault()} onDrop={drag => { drag.preventDefault(); if (!busy) setFiles(Array.from(drag.dataTransfer.files)); }}><UploadCloud className="mb-3 size-7 text-brand-primary" aria-hidden="true" /><span className="text-sm font-semibold">Choose files or drag them here</span><span className="mt-2 text-sm leading-6 text-text-secondary">{["system:moodboard-images", "system:event-pictures"].includes(destination) ? "PNG or JPG images" : destination === "system:receipts" ? "PNG, JPG or PDF receipts" : "PNG, JPG, PDF, CSV, XLSX, XLSM or DOCX"} · up to 15 MB each</span><input type="file" aria-label="Choose event files" multiple disabled={busy} accept={eventFileAcceptForFolder(destination)} onChange={change => setFiles(Array.from(change.target.files ?? []))} className="mt-4 w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-white file:px-3 file:py-2 file:font-medium file:text-brand-primary" /></label>
      {files.length > 0 && <ul aria-label="Selected files" className="space-y-2">{files.map((file, index) => <li key={`${file.name}-${index}`} className="flex items-center justify-between gap-3 text-sm"><span className="min-w-0 break-words">{file.name}</span><span className="flex shrink-0 items-center gap-2 text-text-tertiary">{busy && <LoaderCircle className="size-4 animate-spin text-brand-primary" aria-hidden="true" />}{fileSizeLabel(file.size)}</span></li>)}</ul>}
      {busy && <div role="status" aria-live="polite" className="rounded-xl border border-[#cfe4d6] bg-[#f3faf5] px-4 py-3"><div className="flex items-center gap-2 text-sm font-semibold text-brand-primary"><LoaderCircle className="size-4 animate-spin" aria-hidden="true" />Uploading {files.length} {files.length === 1 ? "file" : "files"}…</div><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#deeee3]"><div className="h-full w-2/3 animate-pulse rounded-full bg-brand-primary" /></div><p className="mt-2 text-xs text-text-secondary">Your files will appear in the folder as soon as they are saved.</p></div>}
      <p className="text-sm text-text-tertiary">Files are stored in this browser.</p>
      {error && <div role="alert" className="space-y-2 rounded-lg bg-error-soft p-3 text-sm text-error"><p>{error}</p>{event.tier !== "premium" && error.includes("storage limit") && <EventTierChip eventId={event.id} eventName={event.name} tier={event.tier} mode="storage-link" />}</div>}
      <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={onClose} disabled={busy}>Cancel</Button><Button type="submit" disabled={busy || !files.length}>{busy ? "Uploading…" : "Upload files"}</Button></div>
    </form>
  </EventFileDialog>;
}

export function EventFileThumbnail({ file }: { file?: EventFileView }) {
  const image = useMoodboardImage(file?.location.kind === "image" ? file.location.value : undefined);
  const [loaded, setLoaded] = useState<{ id: string; url: string } | null>(null);
  const storageId = file?.location.kind === "document" && fileIsImage(file) ? file.location.value : undefined;
  const sourceUrl = file?.location.sourceUrl;
  useEffect(() => {
    if (!storageId) return;
    let active = true, url = "";
    getBudgetAttachment(storageId, sourceUrl).then(blob => { if (active && blob) { url = URL.createObjectURL(blob); setLoaded({ id: storageId, url }); } }).catch(() => undefined);
    return () => { active = false; if (url) URL.revokeObjectURL(url); };
  }, [storageId, sourceUrl]);
  const src = (image.src ? safeFileImage(image.src) : undefined) || (loaded?.id === storageId ? loaded?.url : undefined);
  return src ? <Image src={src} alt="" fill unoptimized sizes="(min-width: 1280px) 25vw, 50vw" className="object-cover" /> : <Folder className="size-12 text-[#bcc8c0]" weight="duotone" aria-hidden="true" />;
}

export function EventFilePreview({ file, folders, onClose, onRename, onMove, onDelete, readOnly = false }: { file: EventFileView; folders: { id: string; name: string }[]; onClose: () => void; onRename: (name: string) => Promise<void>; onMove: (folderId: string) => Promise<void>; onDelete: () => Promise<void>; readOnly?: boolean }) {
  const [result, setResult] = useState<{ url: string; error?: string } | null>(null);
  const [action, setAction] = useState<"rename" | "move" | "delete" | null>(null);
  const [draftName, setDraftName] = useState(file.name);
  const [destination, setDestination] = useState(file.folderId);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true, created = "";
    async function load() {
      try {
        let url = "";
        if (file.location.kind === "document") { const blob = await getBudgetAttachment(file.location.value, file.location.sourceUrl); if (!blob) throw new Error("This file isn’t available in this browser. Upload it again from its original section."); created = URL.createObjectURL(blob); url = created; }
        else if (file.location.kind === "image") { url = safeFileImage(await readMoodboardImage(file.location.value)) || ""; if (!url) throw new Error("This image source is unavailable or unsafe to open."); }
        else { url = safeFileLink(file.location.value) || ""; if (!url) throw new Error("This saved link is unavailable or unsafe to open."); }
        if (active) setResult({ url }); else if (created) { URL.revokeObjectURL(created); created = ""; }
      } catch (problem) { if (active) setResult({ url: "", error: problem instanceof Error ? problem.message : "This file couldn’t be opened." }); }
    }
    void load();
    return () => { active = false; if (created) URL.revokeObjectURL(created); };
  }, [file]);
  const pdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name);
  async function applyAction(callback: () => Promise<void>) {
    if (busy) return;
    setBusy(true); setError("");
    try { await callback(); setAction(null); }
    catch (problem) { setError(problem instanceof Error ? problem.message : "Couldn’t update this file. Try again."); }
    finally { setBusy(false); }
  }
  const actionClass = "group relative flex size-10 shrink-0 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-[#edf3ef] hover:text-brand-primary focus-visible:outline-2 focus-visible:outline-brand-primary disabled:opacity-40";
  const hint = (label: string) => <span aria-hidden="true" className="pointer-events-none absolute right-1/2 top-full z-10 mt-1 hidden translate-x-1/2 whitespace-nowrap rounded-md bg-[#20352b] px-2 py-1 text-xs font-medium text-white shadow-sm group-hover:block group-focus-visible:block">{label}</span>;
  return <Dialog.Root open onOpenChange={open => { if (!open && !busy) onClose(); }}><Dialog.Portal><Dialog.Overlay className="fixed inset-0 z-50 bg-[#10231a]/65 backdrop-blur-[2px]" /><Dialog.Content className="fixed left-1/2 top-1/2 z-50 flex h-[min(92dvh,860px)] w-[calc(100vw-1.5rem)] max-w-6xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl bg-white shadow-[var(--shadow-lg)] focus:outline-none">
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle px-4 py-3 sm:px-5">
      <div className="flex min-w-0 items-center gap-3"><span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#f0f5f1] text-brand-primary"><FileText className="size-5" aria-hidden="true" /></span><div className="min-w-0"><Dialog.Title className="truncate text-base font-semibold text-text-primary">{file.name}</Dialog.Title><Dialog.Description className="truncate text-xs text-text-secondary">{[fileSizeLabel(file.size), file.sourceLabel].filter(Boolean).join(" · ")}</Dialog.Description></div></div>
      <div role="toolbar" aria-label="File actions" className="flex items-center gap-0.5">
        {result?.url && <a href={result.url} download={file.location.kind === "link" ? undefined : file.name} target={file.location.kind === "link" ? "_blank" : undefined} rel="noopener noreferrer" aria-label={file.location.kind === "link" ? "Open link" : "Download file"} title={file.location.kind === "link" ? "Open link" : "Download file"} className={actionClass}><Download className="size-5" aria-hidden="true" />{hint(file.location.kind === "link" ? "Open link" : "Download")}</a>}
        {!readOnly && <><button type="button" aria-label="Rename file" title="Rename file" disabled={busy} onClick={() => { setDraftName(file.name); setError(""); setAction("rename"); }} className={actionClass}><Pencil className="size-5" aria-hidden="true" />{hint("Rename")}</button><button type="button" aria-label="Move file" title="Move file" disabled={busy} onClick={() => { setDestination(file.folderId); setError(""); setAction("move"); }} className={actionClass}><FolderOpen className="size-5" aria-hidden="true" />{hint("Move to folder")}</button><button type="button" aria-label="Delete file" title="Delete file" disabled={busy} onClick={() => { setError(""); setAction("delete"); }} className={cn(actionClass, "text-error hover:bg-error-soft hover:text-error")}><Trash2 className="size-5" aria-hidden="true" />{hint("Delete")}</button></>}
        <span className="mx-1 h-6 w-px bg-border-subtle" aria-hidden="true" /><button type="button" aria-label="Close preview" title="Close preview" disabled={busy} onClick={onClose} className={actionClass}><X className="size-5" aria-hidden="true" />{hint("Close")}</button>
      </div>
    </div>
    {action && <div className="border-b border-border-subtle bg-[#fafbf9] px-4 py-3 sm:px-5">
      {action === "rename" && <form onSubmit={form => { form.preventDefault(); void applyAction(() => onRename(draftName)); }} className="flex flex-wrap items-end gap-2"><label className="min-w-48 flex-1 text-xs font-semibold text-text-secondary">File name<input autoFocus aria-label="New file name" value={draftName} onChange={change => setDraftName(change.target.value)} maxLength={120} className="mt-1 block h-10 w-full rounded-lg border border-border-default bg-white px-3 text-sm text-text-primary focus:border-brand-primary focus:outline-none" /></label><Button type="submit" disabled={busy || !draftName.trim()}>Save name</Button><Button type="button" variant="ghost" onClick={() => setAction(null)} disabled={busy}>Cancel</Button></form>}
      {action === "move" && <form onSubmit={form => { form.preventDefault(); void applyAction(() => onMove(destination)); }} className="flex flex-wrap items-end gap-2"><label className="min-w-48 flex-1 text-xs font-semibold text-text-secondary">Move to folder<select aria-label="Destination folder" value={destination} onChange={change => setDestination(change.target.value)} className="mt-1 block h-10 w-full rounded-lg border border-border-default bg-white px-3 text-sm text-text-primary focus:border-brand-primary focus:outline-none">{folders.filter(folder => !["system:moodboard-images", "system:event-pictures"].includes(folder.id) || fileIsImage(file)).map(folder => <option key={folder.id} value={folder.id}>{folder.name}</option>)}</select></label><Button type="submit" disabled={busy || destination === file.folderId}>Move file</Button><Button type="button" variant="ghost" onClick={() => setAction(null)} disabled={busy}>Cancel</Button></form>}
      {action === "delete" && <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-text-primary">Delete <strong>{file.name}</strong> from this event?</p><div className="flex gap-2"><Button type="button" variant="outline" onClick={() => setAction(null)} disabled={busy}>Cancel</Button><Button type="button" variant="destructive" onClick={() => void applyAction(onDelete)} disabled={busy}>Delete file</Button></div></div>}
      {error && <p role="alert" className="mt-2 text-sm text-error">{error}</p>}
    </div>}
    <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto bg-[#f8faf8] p-4 sm:p-6">{!result ? <p role="status" className="text-sm text-text-secondary">Opening file…</p> : result.error ? <p role="alert" className="rounded-xl bg-error-soft p-4 text-sm text-error">{result.error}</p> : fileIsImage(file) || file.location.kind === "image" ? <Image src={result.url} alt={file.name} width={1600} height={1200} unoptimized className="max-h-full w-auto max-w-full rounded-lg object-contain shadow-sm" /> : pdf && file.location.kind === "document" ? <iframe title={file.name} src={result.url} sandbox="" className="h-full min-h-64 w-full rounded-lg border border-border-subtle bg-white" /> : <div className="rounded-xl border border-border-subtle bg-white p-8 text-center"><FileText className="mx-auto size-10 text-brand-primary" aria-hidden="true" /><p className="mt-3 text-sm text-text-secondary">{file.location.kind === "link" ? "Open this saved link with the toolbar above." : "Download this file to view it on your device."}</p></div>}</div>
  </Dialog.Content></Dialog.Portal></Dialog.Root>;
}
