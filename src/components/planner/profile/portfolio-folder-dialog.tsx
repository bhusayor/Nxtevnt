"use client";

import { useRef, useState, type FormEvent } from "react";
import Image from "next/image";
import * as Dialog from "@radix-ui/react-dialog";
import { FolderPlus, LoaderCircle, UploadCloud, X } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { prepareEventImage } from "@/lib/event-images";
import type { PortfolioFolder } from "@/lib/planner-profile-types";

export function PortfolioFolderDialog({ onCreate, disabled }: { onCreate: (folder: PortfolioFolder) => boolean; disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [cover, setCover] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const input = useRef<HTMLInputElement>(null);
  function changeOpen(value: boolean) {
    if (busy) return;
    if (!value) { setTitle(""); setDescription(""); setCover(""); setError(""); }
    setOpen(value);
  }
  async function upload(file?: File) {
    if (!file || busy) return;
    setBusy(true); setError("");
    try { setCover(await prepareEventImage(file, 200_000)); }
    catch (problem) { setError(problem instanceof Error ? problem.message : "This cover couldn’t be prepared."); }
    finally { setBusy(false); if (input.current) input.current.value = ""; }
  }
  function create(event: FormEvent) {
    event.preventDefault();
    if (!title.trim() || !cover || busy) return;
    if (onCreate({ id: crypto.randomUUID(), title: title.trim(), description: description.trim(), cover, photos: [] })) changeOpen(false);
    else setError("This folder couldn’t be saved. Try a smaller cover image or free some browser storage.");
  }
  return <Dialog.Root open={open} onOpenChange={changeOpen}><Dialog.Trigger asChild><Button type="button" size="sm" variant="outline" disabled={disabled} leadingIcon={<FolderPlus className="size-4" aria-hidden="true" />}>Create folder</Button></Dialog.Trigger><Dialog.Portal>
    <Dialog.Overlay className="fixed inset-0 z-50 bg-black/45 backdrop-blur-sm" />
    <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90dvh] w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl bg-white p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3"><div><Dialog.Title className="text-lg font-semibold">Create a portfolio folder</Dialog.Title><Dialog.Description className="mt-2 text-xs leading-6 text-text-secondary">One celebration, one collection. Add a cover, then upload the photos that tell its story.</Dialog.Description></div><Dialog.Close disabled={busy} aria-label="Close new folder form" className="flex size-8 shrink-0 items-center justify-center rounded-full hover:bg-[#f4f4f4]"><X className="size-4" /></Dialog.Close></div>
      <form onSubmit={create} className="mt-5 space-y-4">
        <Input label="Folder name" placeholder="e.g. Chidinma & Tobi’s wedding" required maxLength={100} value={title} onChange={(event) => setTitle(event.target.value)} />
        <Textarea label="A little about this project" optional placeholder="The setting, style, or details that made it special." maxLength={800} rows={3} value={description} onChange={(event) => setDescription(event.target.value)} />
        <div><p className="mb-2 text-xs font-medium">Folder cover <span className="text-error">*</span></p><input ref={input} type="file" aria-label="Choose portfolio folder cover" accept="image/jpeg,image/png,image/webp" disabled={busy} className="sr-only" onChange={(event) => void upload(event.target.files?.[0])} /><button type="button" disabled={busy} onClick={() => input.current?.click()} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); void upload(event.dataTransfer.files[0]); }} className="flex w-full items-center gap-4 rounded-xl border border-dashed border-border-default bg-[#fafafa] p-3 text-left hover:bg-[#f5f5f5] disabled:opacity-70">
          <span className="relative flex h-16 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border-subtle bg-white">{cover ? <Image src={cover} alt="New folder cover" fill unoptimized sizes="96px" className="object-cover" /> : <UploadCloud className="size-5 text-text-secondary" aria-hidden="true" />}</span>
          <span className="min-w-0"><span className="flex items-center gap-2 text-xs font-semibold">{busy && <LoaderCircle className="size-3.5 shrink-0 motion-safe:animate-spin" aria-hidden="true" />}{busy ? "Preparing cover…" : cover ? "Change cover photo" : "Choose a cover photo"}</span><span className="mt-1 block text-[0.6875rem] leading-5 text-text-tertiary">Click or drop an image here.<br />JPG, PNG or WebP · up to 12 MB</span></span>
        </button><p className="mt-2 text-[0.625rem] leading-5 text-text-tertiary">This thumbnail identifies your folder. You’ll add the gallery photos next.</p></div>
        {error && <p role="alert" className="text-xs text-error">{error}</p>}
        <div className="flex justify-end gap-2 pt-2"><Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => changeOpen(false)}>Cancel</Button><Button type="submit" size="sm" disabled={!title.trim() || !cover || busy}>Create folder & add photos</Button></div>
      </form>
    </Dialog.Content>
  </Dialog.Portal></Dialog.Root>;
}
