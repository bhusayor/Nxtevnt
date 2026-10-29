"use client";

import { useState, type ReactNode } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import type { MoodboardBoard, MoodboardSource } from "@/lib/planner-moodboards";
import type { EventItem } from "@/lib/planner-events";

function MoodboardDialog({ title, description, onClose, children }: { title: string; description: string; onClose: () => void; children: ReactNode }) {
  return <Dialog.Root open onOpenChange={(open) => { if (!open) onClose(); }}><Dialog.Portal><Dialog.Overlay className="fixed inset-0 z-50 bg-[#10231a]/50 backdrop-blur-[2px]" /><Dialog.Content className="fixed inset-x-0 bottom-0 z-50 flex max-h-[92dvh] flex-col overflow-hidden rounded-t-2xl bg-white shadow-[var(--shadow-lg)] focus:outline-none sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:w-[min(32rem,calc(100vw-2rem))] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl"><header className="flex items-start justify-between gap-4 border-b border-border-subtle p-5 sm:px-6"><div><Dialog.Title className="text-lg font-semibold">{title}</Dialog.Title><Dialog.Description className="mt-1 text-xs leading-5 text-text-secondary">{description}</Dialog.Description></div><Dialog.Close asChild><button type="button" aria-label="Close board editor" className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border-subtle"><X className="size-4" aria-hidden="true" /></button></Dialog.Close></header><div className="overflow-y-auto p-5 sm:p-6">{children}</div></Dialog.Content></Dialog.Portal></Dialog.Root>;
}

export function MoodboardEditor({ board, defaultSource = "planner", limit = 6, error, onClose, onSave }: { board?: MoodboardBoard; defaultSource?: MoodboardSource; limit?: number; error?: string; onClose: () => void; onSave: (fields: { title: string; description: string; source: MoodboardSource }) => boolean }) {
  const [title, setTitle] = useState(board?.title ?? "");
  const [description, setDescription] = useState(board?.description ?? "");
  const [source, setSource] = useState<MoodboardSource>(board?.source ?? defaultSource);
  return <MoodboardDialog title={board ? "Edit board" : "Create a moodboard"} description={`Maximum ${limit} boards per event, with up to 50 images in each board.`} onClose={onClose}><form className="space-y-5" onSubmit={(event) => { event.preventDefault(); if (onSave({ title, description, source })) onClose(); }}>
    <Input label="Board name" placeholder="e.g. Reception & table styling" required maxLength={80} value={title} onChange={(event) => setTitle(event.target.value)} />
    <Textarea label="The idea behind this board" optional placeholder="Describe the feeling, colours or details you’re exploring…" rows={3} maxLength={600} value={description} onChange={(event) => setDescription(event.target.value)} />
    <Select label="Inspiration from" value={source} onValueChange={(value) => setSource(value as MoodboardSource)} options={[{ value: "planner", label: "Planner · ideas from your team" }, { value: "client", label: "Client’s · ideas supplied by the client" }]} helperText="This organises your boards; it doesn’t share a board or send a notification." />
    {error && <p role="alert" className="text-xs leading-5 text-error">{error}</p>}<div className="flex justify-end gap-2 border-t border-border-subtle pt-5"><Button type="button" variant="outline" size="sm" onClick={onClose}>Cancel</Button><Button type="submit" size="sm" disabled={!title.trim()}>{board ? "Save changes" : "Create board"}</Button></div>
  </form></MoodboardDialog>;
}

export function MoodboardItemEditor({ item, error, onClose, onSave }: { item?: EventItem; error?: string; onClose: () => void; onSave: (item: EventItem) => boolean }) {
  const [title, setTitle] = useState(item?.title ?? "");
  const [detail, setDetail] = useState(item?.detail ?? "");
  const [url, setUrl] = useState(item?.url ?? "");
  const [category, setCategory] = useState(item?.imageCategory ?? "Venue");
  return <MoodboardDialog title={item?.image ? "Edit photo details" : item ? "Edit inspiration link" : "Save an inspiration link"} description={item?.image ? "Add a little context so everyone knows what to notice." : "Keep useful references alongside your images."} onClose={onClose}><form className="space-y-4" onSubmit={(event) => { event.preventDefault(); if (onSave({ ...item, id: item?.id || crypto.randomUUID(), title, ...(item?.image ? { detail, imageCategory: category } : { url }) })) onClose(); }}>
    {!item?.image && <Input label="Link" type="url" placeholder="https://…" required value={url} onChange={(event) => setUrl(event.target.value)} />}
    <Input label={item?.image ? "Caption" : "Title"} required maxLength={120} placeholder="e.g. A warm candlelit reception" value={title} onChange={(event) => setTitle(event.target.value)} />
    {item?.image && <Select label="Category" value={category} onValueChange={setCategory} options={["Venue", "Ceremony", "Reception", "Styling", "Other"].map((value) => ({ label: value, value }))} />}
    {item?.image && <Textarea label="Notes" optional rows={3} maxLength={600} value={detail} onChange={(event) => setDetail(event.target.value)} placeholder="What do you love about this idea?" />}
    {error && <p role="alert" className="text-xs leading-5 text-error">{error}</p>}<div className="flex justify-end gap-2 border-t border-border-subtle pt-4"><Button type="button" size="sm" variant="outline" onClick={onClose}>Cancel</Button><Button type="submit" size="sm" disabled={!title.trim()}>Save {item?.image ? "details" : "link"}</Button></div>
  </form></MoodboardDialog>;
}
