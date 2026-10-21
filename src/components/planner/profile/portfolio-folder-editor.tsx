"use client";

import { DeleteConfirmation } from "@/components/ui/delete-confirmation";

import { useRef, useState } from "react";
import Image from "next/image";
import { ArrowLeft, Check, LoaderCircle, Trash2, UploadCloud } from "@/components/ui/icons";
import { EventPhotoViewer } from "@/components/planner/event-photo-viewer";
import { prepareEventImage } from "@/lib/event-images";
import type { PortfolioFolder, ProfilePhoto } from "@/lib/planner-profile-types";
import { ProfileTextField, ProfileImageUpload } from "./profile-fields";

export function PortfolioFolderEditor({ folder, onChange, onBack }: { folder: PortfolioFolder; onChange: (change: Partial<PortfolioFolder> | ((current: PortfolioFolder) => PortfolioFolder)) => boolean; onBack: () => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [viewing, setViewing] = useState<ProfilePhoto | null>(null);
  const [removing, setRemoving] = useState("");
  async function upload(files: File[]) {
    if (!files.length || busy) return;
    if (folder.photos.length + files.length > 12) { setError("Each folder can contain up to 12 photos. Remove a photo to make room."); return; }
    setBusy(true); setProgress(0); setError("");
    try {
      const photos: ProfilePhoto[] = [];
      for (const [index, file] of files.entries()) { photos.push({ id: crypto.randomUUID(), title: file.name.replace(/\.[^.]+$/, "").replace(/[_-]/g, " "), src: await prepareEventImage(file, 150_000) }); setProgress(Math.round((index + 1) / files.length * 100)); }
      if (!onChange((current) => ({ ...current, photos: [...current.photos, ...photos] }))) setError("These photos couldn’t be saved. Try fewer or smaller photos to free up browser storage.");
    } catch (problem) { setError(problem instanceof Error ? problem.message : "These photos couldn’t be uploaded."); }
    finally { setBusy(false); if (input.current) input.current.value = ""; }
  }
  return <div aria-busy={busy} className="space-y-5">
    <button type="button" disabled={busy} onClick={onBack} className="inline-flex min-h-9 items-center gap-2 text-xs font-semibold text-text-secondary hover:text-brand-primary disabled:opacity-50"><ArrowLeft className="size-4" aria-hidden="true" />All portfolio folders</button>
    <div className="flex items-center gap-4 rounded-xl border border-border-subtle p-3"><div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-[#f3f3f3]">{folder.cover && <Image src={folder.cover} alt={`${folder.title} folder cover`} fill unoptimized sizes="96px" className="object-cover" />}</div><div className="min-w-0"><p className="text-xs font-semibold">Folder cover</p><p className="mt-1 text-[0.6875rem] leading-5 text-text-secondary">The thumbnail visitors see before opening this folder.</p><ProfileImageUpload label="Change cover" maxLength={200_000} onError={setError} onUpload={(cover) => { if (!onChange({ cover })) setError("This cover couldn’t be saved."); }} className="mt-1 min-h-8 border-0 bg-transparent px-0 shadow-none" /></div></div>
    <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]"><ProfileTextField label="Folder name" value={folder.title} maxLength={100} validate={(value) => value ? "" : "Give this folder a name."} onSave={(title) => onChange({ title })} inputClassName="font-semibold" /><ProfileTextField label="About this project" value={folder.description} maxLength={800} placeholder="Describe the event and your work." onSave={(description) => onChange({ description })} /></div>
    <input ref={input} type="file" aria-label={`Upload photos to ${folder.title}`} accept="image/jpeg,image/png,image/webp" multiple disabled={busy} className="sr-only" onChange={(event) => void upload(Array.from(event.target.files || []))} />
    <div className="border-t border-border-subtle pt-5"><div className="flex items-center justify-between gap-3"><h3 className="text-sm font-semibold">Gallery photos</h3><span className="text-xs tabular-nums text-text-tertiary">{folder.photos.length} of 12</span></div><p className="mt-1 text-xs leading-6 text-text-secondary">The photos visitors explore inside this folder.</p></div>
    <button type="button" disabled={busy} onClick={() => input.current?.click()} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); void upload(Array.from(event.dataTransfer.files)); }} className="flex min-h-20 w-full items-center gap-4 rounded-xl border border-dashed border-border-default bg-[#fafafa] p-4 text-left hover:bg-[#f5f5f5] disabled:opacity-70">{busy ? <LoaderCircle className="size-5 shrink-0 text-text-secondary motion-safe:animate-spin" aria-hidden="true" /> : <UploadCloud className="size-5 shrink-0 text-text-secondary" aria-hidden="true" />}<span className="min-w-0"><span className="block text-xs font-semibold">{busy ? `Preparing photos · ${progress}%` : "Add photos"}</span><span className="mt-1 block text-[0.6875rem] leading-5 text-text-tertiary">{busy ? "Your photos will appear below once saved." : "Drop images here or click to choose · JPG, PNG, WebP · up to 12 MB each"}</span>{busy && <span role="progressbar" aria-label="Preparing portfolio photos" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress} className="mt-2 block h-1.5 w-32 overflow-hidden rounded-full bg-[#e5e7e5]"><span className="block h-full rounded-full bg-brand-primary transition-[width] duration-300" style={{ width: `${progress}%` }} /></span>}</span></button>
    {error && <p role="alert" className="text-xs text-error">{error}</p>}
    {folder.photos.length > 0 && <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{folder.photos.map((photo) => <article key={photo.id} className="overflow-hidden rounded-2xl border border-border-subtle bg-white"><button type="button" onClick={() => setViewing(photo)} aria-label={`View ${photo.title || "portfolio photo"}`} className="relative block aspect-[4/3] w-full"><Image src={photo.src} alt={photo.title || folder.title} fill unoptimized sizes="(min-width:1280px) 25vw, 50vw" className="object-cover" /></button><div className="p-3"><ProfileTextField label="Caption" value={photo.title} maxLength={100} onSave={(title) => onChange((current) => ({ ...current, photos: current.photos.map((item) => item.id === photo.id ? { ...item, title } : item) }))} /><div className="mt-2 flex items-center justify-between gap-3"><button type="button" onClick={() => onChange({ cover: photo.src })} className="inline-flex min-h-8 items-center gap-1 text-[0.6875rem] font-medium text-brand-primary hover:underline">{folder.cover === photo.src ? <><Check className="size-3" />Folder cover</> : "Use as cover"}</button><button type="button" disabled={busy} onClick={() => setRemoving(photo.id)} aria-label={`Remove ${photo.title || "photo"}`} className="flex size-8 items-center justify-center rounded-lg text-text-tertiary hover:bg-error-soft hover:text-error"><Trash2 className="size-4" /></button></div></div><DeleteConfirmation open={removing === photo.id} onOpenChange={(open) => { if (!open) setRemoving(""); }} title="Delete portfolio photo?" description="This photo will be removed from your profile draft. Save your profile to apply this change, or cancel profile editing to restore it." onConfirm={() => onChange((current) => ({ ...current, photos: current.photos.filter((item) => item.id !== photo.id) }))} /></article>)}</div>}
    <EventPhotoViewer photo={viewing ? { src: viewing.src, title: viewing.title || folder.title } : null} onClose={() => setViewing(null)} />
  </div>;
}
