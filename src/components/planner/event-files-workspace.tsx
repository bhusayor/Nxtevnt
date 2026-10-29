"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowLeft, ChevronDown, ChevronRight, FileText, Folder, FolderPlus, LayoutGrid, Link2, List, LockSimple, Plus, Trash2, UploadCloud } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { DeleteConfirmation } from "@/components/ui/delete-confirmation";
import { Input } from "@/components/ui/input";
import { SearchInput } from "@/components/ui/search-input";
import { EventFileDialog, EventFilePreview, EventFileThumbnail, EventFileUploadDialog, eventFileAcceptForFolder } from "./event-file-dialogs";
import { EventTierChip } from "./event-tier-chip";
import { createEventFileFolder, deleteEventFileFolder, eventFileFolders, fileIsImage, fileSizeLabel, moveEventFile, renameEventFile, visibleFileFolders, type EventFileView, type FolderFilter, type FolderSort } from "@/lib/event-files";
import { deleteBudgetAttachments } from "@/lib/budget-attachments";
import { upsertBudgetItem, useBudgetStore, type BudgetItem } from "@/lib/planner-budget";
import { updatePlannerEvent, type PlannerEvent } from "@/lib/planner-events";
import { deleteMoodboardImage } from "@/lib/moodboard-images";
import { eventStorageLimit, eventStorageUsed } from "@/lib/event-storage";
import { uploadEventFiles } from "@/lib/event-file-storage";
import { cn } from "@/lib/utils/cn";

function storageAmount(bytes: number) {
  const mb = bytes / (1024 * 1024);
  return `${mb < 10 && mb > 0 ? Number(mb.toFixed(1)) : Math.round(mb)} MB`;
}

export function EventStorageMeter({ event, items }: { event: PlannerEvent; items: readonly BudgetItem[] }) {
  const [used, setUsed] = useState(0);
  useEffect(() => {
    let active = true;
    void eventStorageUsed(event, items).then((bytes) => { if (active) setUsed(bytes); });
    return () => { active = false; };
  }, [event, items]);
  const limit = eventStorageLimit(event);
  const percent = Math.min(100, Math.round(used / limit * 100));
  const nearLimit = used / limit >= 0.8;
  return <div className="rounded-xl border border-border-subtle bg-white px-4 py-3.5 sm:px-5" aria-label="Event file storage">
    <div className="flex flex-wrap items-center justify-between gap-x-5 gap-y-2"><div><p className="text-sm font-semibold text-text-primary">Event storage</p><p className="mt-0.5 text-sm text-text-secondary"><span className="font-semibold tabular-nums text-text-primary">{storageAmount(used)}</span> of {event.tier === "premium" ? "2 GB" : "500 MB"} used</p></div>{event.tier !== "premium" && !event.cancelledAt && <EventTierChip eventId={event.id} eventName={event.name} tier={event.tier} mode="storage-link" />}</div>
    <div role="progressbar" aria-label="Event storage used" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} className={`mt-3 h-2 overflow-hidden rounded-full ${nearLimit ? "bg-[#f7ebcf]" : "bg-[#e7efe9]"}`}><div className={`h-full rounded-full transition-[width] duration-300 ${nearLimit ? "bg-[#d4a13b]" : "bg-brand-primary"}`} style={{ width: `${percent}%` }} /></div>
  </div>;
}

export function EventFilesWorkspace({ event }: { event: PlannerEvent }) {
  const budget = useBudgetStore();
  const folders = eventFileFolders(event, budget.items);
  const [filter, setFilter] = useState<FolderFilter>("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<FolderSort>("recent");
  const [selected, setSelected] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [inlineUploading, setInlineUploading] = useState<File[]>([]);
  const [inlineUploadFolderId, setInlineUploadFolderId] = useState("");
  const [inlineUploadError, setInlineUploadError] = useState("");
  const inlineSaving = useRef(false);
  const [draggingFiles, setDraggingFiles] = useState(false);
  const [preview, setPreview] = useState<EventFileView | null>(null);
  const [feedback, setFeedback] = useState("");
  const [fileSearch, setFileSearch] = useState("");
  const [fileType, setFileType] = useState("all");
  const [fileSort, setFileSort] = useState("newest");
  const [fileView, setFileView] = useState<"grid" | "list">("grid");
  const current = folders.find(folder => folder.id === selected);
  const visible = visibleFileFolders(folders, filter, search, sort);
  const visibleFiles = (current?.files ?? []).filter(file => file.name.toLocaleLowerCase().includes(fileSearch.trim().toLocaleLowerCase()) && (fileType === "all" || fileType === "images" && (fileIsImage(file) || file.location.kind === "image") || fileType === "links" && file.location.kind === "link" || fileType === "documents" && !fileIsImage(file) && file.location.kind !== "image" && file.location.kind !== "link")).sort((a, b) => fileSort === "name" ? a.name.localeCompare(b.name) : (Date.parse(b.addedAt) || 0) - (Date.parse(a.addedAt) || 0));
  function create(form: FormEvent) {
    form.preventDefault();
    try {
      let found = false;
      updatePlannerEvent(event.id, current => { found = true; return createEventFileFolder(current, { id: crypto.randomUUID(), name, createdAt: new Date().toISOString() }); });
      if (!found) throw new Error("This event no longer exists.");
      setCreating(false); setName(""); setSearch(""); setFilter("all"); setError(""); setFeedback("Folder created.");
    } catch (problem) { setError(problem instanceof Error ? problem.message : "This folder couldn’t be saved. Try again."); }
  }
  async function removeFolder(folderId: string) {
    try {
      let found = false;
      let storedIds: string[] = [];
      updatePlannerEvent(event.id, latest => {
        found = true;
        const next = deleteEventFileFolder(latest, folderId);
        storedIds = (latest.fileEntries ?? []).filter(file => file.folderId === folderId).map(file => file.storageId);
        return next;
      });
      if (!found) throw new Error("This event no longer exists.");
      setSelected(null);
      setError("");
      try { await deleteBudgetAttachments(storedIds); setFeedback("Folder deleted."); }
      catch { setFeedback("Folder deleted. Some local file data could not be cleared."); }
      return true;
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : "This folder couldn’t be deleted. Try again.");
      return false;
    }
  }
  async function uploadIntoEmptyFolder(files: File[], folderId: string) {
    if (!files.length || inlineSaving.current) return;
    inlineSaving.current = true;
    setInlineUploading(files);
    setInlineUploadFolderId(folderId);
    setInlineUploadError("");
    try {
      const started = performance.now();
      await uploadEventFiles(event.id, folderId, files);
      const remaining = 600 - (performance.now() - started);
      if (remaining > 0) await new Promise(resolve => setTimeout(resolve, remaining));
      setFeedback(`${files.length} ${files.length === 1 ? "file" : "files"} uploaded.`);
    } catch (problem) {
      setInlineUploadError(problem instanceof Error ? problem.message : "These files couldn’t be uploaded. Try again.");
    } finally {
      inlineSaving.current = false;
      setInlineUploading([]);
      setDraggingFiles(false);
    }
  }
  function persistFile(change: (latest: PlannerEvent) => PlannerEvent) {
    let found = false;
    updatePlannerEvent(event.id, latest => { found = true; return change(latest); });
    if (!found) throw new Error("This event no longer exists.");
  }
  async function removeFile(file: EventFileView) {
    if (event.cancelledAt) throw new Error("Reopen this event before changing files.");
    let cleanupFailed = false;
    const withoutOverride = (latest: PlannerEvent) => {
      const fileOverrides = { ...latest.fileOverrides };
      delete fileOverrides[file.id];
      return fileOverrides;
    };
    const manual = event.fileEntries?.find(entry => entry.id === file.id);
    if (manual) {
      persistFile(latest => ({ ...latest, fileEntries: (latest.fileEntries ?? []).filter(entry => entry.id !== file.id), fileOverrides: withoutOverride(latest) }));
      await deleteBudgetAttachments([manual.storageId]).catch(() => { cleanupFailed = true; });
    } else if (file.id.startsWith("budget:") || file.id.startsWith("receipt:")) {
      const attachmentId = file.id.split(":")[1];
      const item = budget.items.find(entry => entry.eventId === event.id && ((entry.attachments ?? []).some(attachment => attachment.id === attachmentId) || (entry.payments ?? []).some(payment => payment.receipt?.id === attachmentId)));
      if (!item) throw new Error("This file no longer exists.");
      upsertBudgetItem({ ...item, attachments: (item.attachments ?? []).filter(attachment => attachment.id !== attachmentId), payments: (item.payments ?? []).map(payment => payment.receipt?.id === attachmentId ? { ...payment, receipt: undefined } : payment) });
      persistFile(latest => ({ ...latest, fileOverrides: withoutOverride(latest) }));
      await deleteBudgetAttachments([attachmentId]).catch(() => { cleanupFailed = true; });
    } else if (file.id.startsWith("moodboard:")) {
      const imageId = file.id.slice("moodboard:".length);
      persistFile(latest => ({ ...latest, sections: { ...latest.sections, moodboard: (latest.sections.moodboard ?? []).filter(image => image.id !== imageId) }, fileOverrides: withoutOverride(latest) }));
      const usedByDecision = (event.sections.decisions ?? []).some(decision => decision.image === file.location.value);
      const usedByAnotherPhoto = (event.sections.moodboard ?? []).some(image => image.id !== imageId && image.image === file.location.value);
      if (!usedByDecision && !usedByAnotherPhoto) await deleteMoodboardImage(file.location.value).catch(() => { cleanupFailed = true; });
    } else if (file.id.startsWith("cover:")) {
      persistFile(latest => ({ ...latest, image: "", fileOverrides: withoutOverride(latest) }));
    } else if (file.id.startsWith("legacy:")) {
      const linkId = file.id.slice("legacy:".length);
      persistFile(latest => ({ ...latest, sections: { ...latest.sections, files: (latest.sections.files ?? []).filter(link => link.id !== linkId) }, fileOverrides: withoutOverride(latest) }));
    } else throw new Error("This file no longer exists.");
    setPreview(null); setFeedback(cleanupFailed ? "File deleted. Some local file data could not be cleared." : "File deleted.");
  }
  return <section aria-label="Event files" className="space-y-5">
    <EventStorageMeter event={event} items={budget.items} />
    <div className="flex flex-wrap items-center justify-between gap-3">
      {current ? <div className="flex min-w-0 flex-wrap items-center gap-2"><button type="button" onClick={() => { setSelected(null); setSearch(""); }} className="inline-flex min-h-11 items-center gap-2 rounded-lg px-2 text-sm font-semibold text-brand-primary"><ArrowLeft className="size-4" aria-hidden="true" />All folders</button><ChevronRight className="size-4 text-text-tertiary" aria-hidden="true" /><h2 className="break-words text-base font-semibold">{current.name}</h2>{current.system && <LockSimple className="size-4 text-text-tertiary" aria-label="System folder" />}</div> : <div role="group" aria-label="Folder filters" className="inline-flex rounded-xl border border-border-subtle bg-white p-1">{([{ id: "all", label: "All folders" }, { id: "yours", label: "Yours" }, { id: "system", label: "System" }] as const).map(tab => <button key={tab.id} type="button" aria-pressed={filter === tab.id} onClick={() => setFilter(tab.id)} className={cn("min-h-10 rounded-lg px-3 text-sm font-medium transition-colors", filter === tab.id ? "bg-[#eaf3ed] text-brand-primary" : "text-text-secondary hover:bg-background-subtle")}>{tab.label}</button>)}</div>}
      <div className="flex w-full flex-wrap items-center gap-2 lg:w-auto">
        {!current && <><div className="min-w-48 flex-1 lg:w-56"><SearchInput aria-label="Search folders" placeholder="Search folders" value={search} onChange={change => setSearch(change.target.value)} onClear={() => setSearch("")} /></div><span className="relative"><select aria-label="Sort folders" value={sort} onChange={change => setSort(change.target.value as FolderSort)} className="h-11 appearance-none rounded-lg border border-border-subtle bg-white py-0 pl-3 pr-10 text-sm"><option value="recent">Recently added to</option><option value="name">Name A–Z</option></select><ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-text-tertiary" aria-hidden="true" /></span><Button type="button" disabled={Boolean(event.cancelledAt)} leadingIcon={<Plus className="size-4" aria-hidden="true" />} onClick={() => { setName(""); setError(""); setCreating(true); }}>New folder</Button></>}
        {current && !current.legacy && <Button type="button" disabled={Boolean(event.cancelledAt) || Boolean(inlineUploading.length)} leadingIcon={<UploadCloud className="size-4" aria-hidden="true" />} onClick={() => setUploading(true)}>Upload files</Button>}
        {current && !current.system && !current.legacy && <Button type="button" variant="outline" className="border-[#e6babb] text-error hover:border-error hover:bg-error-soft hover:text-error" disabled={Boolean(event.cancelledAt) || Boolean(inlineUploading.length)} leadingIcon={<Trash2 className="size-4" aria-hidden="true" />} onClick={() => { setError(""); setDeleting(current.id); }}>Delete folder</Button>}
      </div>
    </div>
    {feedback && <p role="status" className="text-sm text-brand-primary">{feedback}</p>}
    {current ? <>
      <div className="flex flex-wrap items-end justify-between gap-3"><p className="text-sm text-text-secondary">{current.files.length} {current.files.length === 1 ? "file" : "files"}{current.system ? " · System folder" : ""}</p><div className="flex w-full flex-wrap items-center gap-2 lg:w-auto"><div className="min-w-44 flex-1 lg:w-52"><SearchInput aria-label="Search files" placeholder="Search files" value={fileSearch} onChange={change => setFileSearch(change.target.value)} onClear={() => setFileSearch("")} /></div><span className="relative"><select aria-label="Filter file types" value={fileType} onChange={change => setFileType(change.target.value)} className="h-11 appearance-none rounded-lg border border-border-subtle bg-white py-0 pl-3 pr-9 text-sm"><option value="all">All types</option><option value="images">Images</option><option value="documents">Documents</option><option value="links">Links</option></select><ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-text-tertiary" aria-hidden="true" /></span><span className="relative"><select aria-label="Sort files" value={fileSort} onChange={change => setFileSort(change.target.value)} className="h-11 appearance-none rounded-lg border border-border-subtle bg-white py-0 pl-3 pr-9 text-sm"><option value="newest">Newest first</option><option value="name">Name A–Z</option></select><ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-text-tertiary" aria-hidden="true" /></span><div role="group" aria-label="File view" className="flex rounded-lg border border-border-subtle bg-white p-1"><button type="button" aria-label="Grid view" aria-pressed={fileView === "grid"} onClick={() => setFileView("grid")} className={cn("flex min-h-9 items-center gap-1.5 rounded-md px-2 text-sm", fileView === "grid" ? "bg-[#edf3ef] text-brand-primary" : "text-text-secondary hover:bg-background-subtle")}><LayoutGrid className="size-4" aria-hidden="true" />Grid</button><button type="button" aria-label="List view" aria-pressed={fileView === "list"} onClick={() => setFileView("list")} className={cn("flex min-h-9 items-center gap-1.5 rounded-md px-2 text-sm", fileView === "list" ? "bg-[#edf3ef] text-brand-primary" : "text-text-secondary hover:bg-background-subtle")}><List className="size-4" aria-hidden="true" />List</button></div></div></div>
      {inlineUploadError && current.id === inlineUploadFolderId && <div role="alert" className="rounded-lg bg-error-soft p-3 text-sm text-error"><p>{inlineUploadError}</p>{event.tier !== "premium" && inlineUploadError.includes("storage limit") && <EventTierChip eventId={event.id} eventName={event.name} tier={event.tier} mode="storage-link" />}</div>}
      {inlineUploading.length && current.id === inlineUploadFolderId ? <div role="status" aria-live="polite" className="flex min-h-56 flex-col items-center justify-center rounded-xl border border-[#cfe4d6] bg-[#f3faf5] px-6 py-12 text-center"><UploadCloud className="size-8 animate-pulse text-brand-primary" aria-hidden="true" /><p className="mt-3 text-base font-semibold text-text-primary">Uploading {inlineUploading.length} {inlineUploading.length === 1 ? "file" : "files"}…</p><p className="mt-1 max-w-md truncate text-sm text-text-secondary">{inlineUploading.map(file => file.name).join(", ")}</p><div className="mt-5 h-2 w-full max-w-xs overflow-hidden rounded-full bg-[#dcece1]"><div className="h-full w-2/3 animate-pulse rounded-full bg-brand-primary" /></div></div> : visibleFiles.length ? fileView === "grid" ? <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{visibleFiles.map(file => <li key={file.id}><button type="button" onClick={() => setPreview(file)} className="group w-full overflow-hidden rounded-xl border border-border-subtle bg-white text-left transition-shadow hover:shadow-md focus-visible:outline-2 focus-visible:outline-brand-primary"><span className="relative flex aspect-[4/3] items-center justify-center overflow-hidden bg-[#f5f7f5]">{fileIsImage(file) || file.location.kind === "image" ? <EventFileThumbnail file={file} /> : file.location.kind === "link" ? <Link2 className="size-12 text-[#9aaba0]" aria-hidden="true" /> : <FileText className="size-12 text-[#9aaba0]" aria-hidden="true" />}</span><span className="block p-3"><span className="block truncate text-sm font-semibold text-text-primary">{file.name}</span><span className="mt-1 block truncate text-xs text-text-secondary">{[fileSizeLabel(file.size), file.sourceLabel].filter(Boolean).join(" · ")}</span></span></button></li>)}</ul> : <ul className="overflow-hidden rounded-xl border border-border-subtle bg-white divide-y divide-border-subtle">{visibleFiles.map(file => <li key={file.id}><button type="button" onClick={() => setPreview(file)} className="flex min-h-20 w-full items-center gap-3 p-4 text-left hover:bg-[#f8faf8] focus-visible:outline-2 focus-visible:outline-brand-primary"><span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#f0f5f1] text-brand-primary">{file.location.kind === "link" ? <Link2 className="size-5" aria-hidden="true" /> : <FileText className="size-5" aria-hidden="true" />}</span><span className="min-w-0 flex-1"><span className="block break-words text-sm font-semibold">{file.name}</span><span className="mt-1 block text-sm text-text-secondary">{[file.sourceLabel, fileSizeLabel(file.size)].filter(Boolean).join(" · ")}</span></span><ChevronRight className="size-4 shrink-0 text-text-tertiary" aria-hidden="true" /></button></li>)}</ul> : current.files.length ? <div className="rounded-xl border border-dashed border-border-strong bg-white px-6 py-12 text-center"><Folder className="mx-auto size-10 text-text-tertiary" aria-hidden="true" /><h3 className="mt-3 text-base font-semibold">No matching files</h3><p className="mt-2 text-sm text-text-secondary">Try another name or file type.</p></div> : current.legacy || event.cancelledAt ? <div className="rounded-xl border border-dashed border-border-strong bg-white px-6 py-12 text-center"><Folder className="mx-auto size-10 text-text-tertiary" aria-hidden="true" /><h3 className="mt-3 text-base font-semibold">This folder is empty</h3></div> : <label
        onDragOver={drag => { drag.preventDefault(); setDraggingFiles(true); }}
        onDragLeave={() => setDraggingFiles(false)}
        onDrop={drop => { drop.preventDefault(); setDraggingFiles(false); void uploadIntoEmptyFolder(Array.from(drop.dataTransfer.files), current.id); }}
        className={cn("relative flex min-h-56 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed bg-white px-6 py-12 text-center transition-colors focus-within:ring-2 focus-within:ring-brand-primary", draggingFiles ? "border-brand-primary bg-[#f0f7f2]" : "border-border-strong hover:border-brand-primary hover:bg-[#fbfdfb]")}
      >
        <input type="file" multiple aria-label="Choose files for empty folder" accept={eventFileAcceptForFolder(current.id)} className="absolute inset-0 h-full w-full cursor-pointer opacity-0" onChange={change => { const files = Array.from(change.target.files ?? []); change.target.value = ""; return uploadIntoEmptyFolder(files, current.id); }} />
        <UploadCloud className="size-9 text-brand-primary" aria-hidden="true" />
        <span className="mt-3 text-base font-semibold text-text-primary">This folder is empty</span>
        <span className="mt-1 text-sm text-text-secondary">Drop files here or click to upload</span>
        <span className="mt-2 text-xs text-text-tertiary">{["system:moodboard-images", "system:event-pictures"].includes(current.id) ? "PNG, JPG, WebP or GIF" : current.id === "system:receipts" ? "PNG, JPG, WebP or PDF" : "PNG, JPG, PDF, CSV, XLSX, XLSM or DOCX"} · up to 15 MB each</span>
      </label>}
    </> : visible.length ? <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">{visible.map(folder => {
      const cover = folder.files.find(file => fileIsImage(file));
      const size = folder.files.every(file => file.size !== undefined) ? folder.files.reduce((sum, file) => sum + (file.size || 0), 0) : 0;
      return <button key={folder.id} type="button" onClick={() => { setSelected(folder.id); setFeedback(""); }} aria-label={`Open ${folder.name}, ${folder.files.length} ${folder.files.length === 1 ? "file" : "files"}`} className="group overflow-hidden rounded-xl border border-border-subtle bg-white text-left transition-shadow hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary"><span className="relative flex aspect-[16/10] items-center justify-center overflow-hidden bg-[#f6f7f6]"><EventFileThumbnail file={cover} /></span><span className="block space-y-2 p-4"><span className="flex items-start gap-2">{folder.system && <LockSimple className="mt-0.5 size-4 shrink-0 text-text-tertiary" aria-hidden="true" />}<span className="break-words text-base font-semibold">{folder.name}</span></span><span className="block text-sm text-text-secondary">{folder.files.length} {folder.files.length === 1 ? "file" : "files"}{size ? ` · ${fileSizeLabel(size)}` : ""}</span><span className="inline-flex rounded-full bg-[#f2f5f3] px-2.5 py-1 text-sm text-text-secondary">{folder.system ? "System folder" : "Your folder"}</span></span></button>;
    })}{filter !== "system" && !search.trim() && !event.cancelledAt && <button type="button" onClick={() => { setName(""); setError(""); setCreating(true); }} className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed border-border-strong bg-white/65 px-6 text-center text-text-secondary transition-colors hover:border-brand-primary hover:bg-white focus-visible:outline-2 focus-visible:outline-brand-primary"><Plus className="mb-3 size-6" aria-hidden="true" /><span className="text-sm font-semibold text-text-primary">New folder</span><span className="mt-1 text-xs">Contracts, floor plans and more</span></button>}</div> : <div className="rounded-xl border border-dashed border-border-strong bg-white px-6 py-12 text-center"><FolderPlus className="mx-auto size-10 text-text-tertiary" aria-hidden="true" /><h3 className="mt-3 text-base font-semibold">{search.trim() ? "No matching folders" : "No folders of your own yet"}</h3><p className="mt-2 text-sm text-text-secondary">{search.trim() ? "Try another folder name or switch filters." : "Create a folder for contracts, floor plans or anything your event needs."}</p></div>}
    {creating && <EventFileDialog title="New folder" description="Keep related event files together." compact onClose={() => setCreating(false)}><form onSubmit={create} className="space-y-4"><Input label="Folder name" placeholder="e.g. Venue contracts" value={name} onChange={change => setName(change.target.value)} maxLength={80} required />{error && <p role="alert" className="text-sm text-error">{error}</p>}<div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setCreating(false)}>Cancel</Button><Button type="submit" disabled={!name.trim()}>Create folder</Button></div></form></EventFileDialog>}
    {uploading && current && <EventFileUploadDialog event={event} folderId={current.id} onClose={() => setUploading(false)} onSaved={() => setFeedback("Files uploaded.")} />}
    {preview && <EventFilePreview key={preview.id} file={preview} folders={folders.filter(folder => !folder.legacy).map(folder => ({ id: folder.id, name: folder.name }))} readOnly={Boolean(event.cancelledAt)} onClose={() => setPreview(null)} onRename={async name => { persistFile(latest => renameEventFile(latest, preview.id, name, budget.items)); setPreview({ ...preview, name: name.trim() }); setFeedback("File renamed."); }} onMove={async folderId => { persistFile(latest => moveEventFile(latest, preview.id, folderId, budget.items)); setPreview(null); setFeedback(`File moved to ${folders.find(folder => folder.id === folderId)?.name || "folder"}.`); }} onDelete={() => removeFile(preview)} />}
    <DeleteConfirmation open={Boolean(deleting)} onOpenChange={(open) => { if (!open) { setDeleting(null); setError(""); } }} title="Delete folder?" description={<>“{folders.find(folder => folder.id === deleting)?.name || "This folder"}” and files uploaded directly to it will be deleted. Files moved here from other sections return to their original folders. This can’t be undone.</>} confirmLabel="Delete folder" error={error} onConfirm={() => deleting ? removeFolder(deleting) : false} />
  </section>;
}
