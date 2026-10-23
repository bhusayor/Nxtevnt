"use client";

import { useState, type FormEvent } from "react";
import { ArrowLeft, ChevronRight, FileText, Folder, FolderPlus, Link2, LockSimple, Plus, UploadCloud } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SearchInput } from "@/components/ui/search-input";
import { EventFileDialog, EventFilePreview, EventFileThumbnail, EventFileUploadDialog } from "./event-file-dialogs";
import { createEventFileFolder, eventFileFolders, fileIsImage, fileSizeLabel, visibleFileFolders, type EventFileView, type FolderFilter, type FolderSort } from "@/lib/event-files";
import { useBudgetStore } from "@/lib/planner-budget";
import { updatePlannerEvent, type PlannerEvent } from "@/lib/planner-events";
import { cn } from "@/lib/utils/cn";

export function EventFilesWorkspace({ event }: { event: PlannerEvent }) {
  const budget = useBudgetStore();
  const folders = eventFileFolders(event, budget.items);
  const [filter, setFilter] = useState<FolderFilter>("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<FolderSort>("recent");
  const [selected, setSelected] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<EventFileView | null>(null);
  const [feedback, setFeedback] = useState("");
  const current = folders.find(folder => folder.id === selected);
  const visible = visibleFileFolders(folders, filter, search, sort);
  function create(form: FormEvent) {
    form.preventDefault();
    try {
      let found = false;
      updatePlannerEvent(event.id, current => { found = true; return createEventFileFolder(current, { id: crypto.randomUUID(), name, createdAt: new Date().toISOString() }); });
      if (!found) throw new Error("This event no longer exists.");
      setCreating(false); setName(""); setSearch(""); setFilter("all"); setError(""); setFeedback("Folder created.");
    } catch (problem) { setError(problem instanceof Error ? problem.message : "This folder couldn’t be saved. Try again."); }
  }
  return <section aria-label="Event files" className="space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3">
      {current ? <div className="flex min-w-0 flex-wrap items-center gap-2"><button type="button" onClick={() => { setSelected(null); setSearch(""); }} className="inline-flex min-h-11 items-center gap-2 rounded-lg px-2 text-sm font-semibold text-brand-primary"><ArrowLeft className="size-4" aria-hidden="true" />All folders</button><ChevronRight className="size-4 text-text-tertiary" aria-hidden="true" /><h2 className="break-words text-base font-semibold">{current.name}</h2>{current.system && <LockSimple className="size-4 text-text-tertiary" aria-label="System folder" />}</div> : <div role="group" aria-label="Folder filters" className="inline-flex rounded-xl border border-border-subtle bg-white p-1">{([{ id: "all", label: "All folders" }, { id: "yours", label: "Yours" }, { id: "system", label: "System" }] as const).map(tab => <button key={tab.id} type="button" aria-pressed={filter === tab.id} onClick={() => setFilter(tab.id)} className={cn("min-h-10 rounded-lg px-3 text-sm font-medium transition-colors", filter === tab.id ? "bg-[#eaf3ed] text-brand-primary" : "text-text-secondary hover:bg-background-subtle")}>{tab.label}</button>)}</div>}
      <div className="flex w-full flex-wrap items-center gap-2 lg:w-auto">
        {!current && <><div className="min-w-48 flex-1 lg:w-56"><SearchInput aria-label="Search folders" placeholder="Search folders" value={search} onChange={change => setSearch(change.target.value)} onClear={() => setSearch("")} /></div><select aria-label="Sort folders" value={sort} onChange={change => setSort(change.target.value as FolderSort)} className="h-11 rounded-lg border border-border-subtle bg-white px-3 text-sm"><option value="recent">Recently added to</option><option value="name">Name A–Z</option></select><Button type="button" disabled={Boolean(event.cancelledAt)} leadingIcon={<Plus className="size-4" aria-hidden="true" />} onClick={() => { setName(""); setError(""); setCreating(true); }}>New folder</Button></>}
        {current && !current.legacy && <Button type="button" disabled={Boolean(event.cancelledAt)} leadingIcon={<UploadCloud className="size-4" aria-hidden="true" />} onClick={() => setUploading(true)}>Upload files</Button>}
      </div>
    </div>
    {feedback && <p role="status" className="text-sm text-brand-primary">{feedback}</p>}
    {current ? <>
      <p className="text-sm text-text-secondary">{current.files.length} {current.files.length === 1 ? "file" : "files"}{current.system ? " · System folder" : ""}</p>
      {current.files.length ? <ul className="overflow-hidden rounded-xl border border-border-subtle bg-white divide-y divide-border-subtle">{current.files.map(file => <li key={file.id}><button type="button" onClick={() => setPreview(file)} className="flex min-h-20 w-full items-center gap-3 p-4 text-left hover:bg-[#f8faf8] focus-visible:outline-2 focus-visible:outline-brand-primary"><span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#f0f5f1] text-brand-primary">{file.location.kind === "link" ? <Link2 className="size-5" aria-hidden="true" /> : <FileText className="size-5" aria-hidden="true" />}</span><span className="min-w-0 flex-1"><span className="block break-words text-sm font-semibold">{file.name}</span><span className="mt-1 block text-sm text-text-secondary">{[file.sourceLabel, fileSizeLabel(file.size)].filter(Boolean).join(" · ")}</span></span><ChevronRight className="size-4 shrink-0 text-text-tertiary" aria-hidden="true" /></button></li>)}</ul> : <div className="rounded-xl border border-dashed border-border-strong bg-white px-6 py-12 text-center"><Folder className="mx-auto size-10 text-text-tertiary" aria-hidden="true" /><h3 className="mt-3 text-base font-semibold">No files yet</h3><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-text-secondary">{current.id === "system:moodboard-images" ? "Images added to this event’s Mood board appear here automatically." : current.id === "system:receipts" ? "Receipts attached when logging a budget payment appear here automatically." : "Upload files here, or add them from the related event section."}</p></div>}
    </> : visible.length ? <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">{visible.map(folder => {
      const cover = folder.files.find(file => fileIsImage(file));
      const size = folder.files.every(file => file.size !== undefined) ? folder.files.reduce((sum, file) => sum + (file.size || 0), 0) : 0;
      return <button key={folder.id} type="button" onClick={() => { setSelected(folder.id); setFeedback(""); }} aria-label={`Open ${folder.name}, ${folder.files.length} ${folder.files.length === 1 ? "file" : "files"}`} className="group overflow-hidden rounded-xl border border-border-subtle bg-white text-left transition-shadow hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary"><span className="relative flex aspect-[16/10] items-center justify-center overflow-hidden bg-[#f6f7f6]"><EventFileThumbnail file={cover} /></span><span className="block space-y-2 p-4"><span className="flex items-start gap-2">{folder.system && <LockSimple className="mt-0.5 size-4 shrink-0 text-text-tertiary" aria-hidden="true" />}<span className="break-words text-base font-semibold">{folder.name}</span></span><span className="block text-sm text-text-secondary">{folder.files.length} {folder.files.length === 1 ? "file" : "files"}{size ? ` · ${fileSizeLabel(size)}` : ""}</span><span className="inline-flex rounded-full bg-[#f2f5f3] px-2.5 py-1 text-sm text-text-secondary">{folder.system ? "System folder" : "Your folder"}</span></span></button>;
    })}</div> : <div className="rounded-xl border border-dashed border-border-strong bg-white px-6 py-12 text-center"><FolderPlus className="mx-auto size-10 text-text-tertiary" aria-hidden="true" /><h3 className="mt-3 text-base font-semibold">{search.trim() ? "No matching folders" : "No folders of your own yet"}</h3><p className="mt-2 text-sm text-text-secondary">{search.trim() ? "Try another folder name or switch filters." : "Create a folder for contracts, floor plans or anything your event needs."}</p></div>}
    {creating && <EventFileDialog title="New folder" description="Give this event’s folder a clear name." onClose={() => setCreating(false)}><form onSubmit={create} className="space-y-4"><Input label="Folder name" placeholder="e.g. Venue contracts" value={name} onChange={change => setName(change.target.value)} maxLength={80} required />{error && <p role="alert" className="text-sm text-error">{error}</p>}<div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setCreating(false)}>Cancel</Button><Button type="submit">Create folder</Button></div></form></EventFileDialog>}
    {uploading && current && <EventFileUploadDialog event={event} folderId={current.id} onClose={() => setUploading(false)} onSaved={() => setFeedback("Files uploaded.")} />}
    {preview && <EventFilePreview key={preview.id} file={preview} onClose={() => setPreview(null)} />}
  </section>;
}
