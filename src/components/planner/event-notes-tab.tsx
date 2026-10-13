"use client";

import { useState, type ReactNode } from "react";
import { MessageSquareText, Pin, Plus, Search, Trash2 } from "@/components/ui/icons";

import { NoteComposerDialog } from "@/components/planner/note-composer";
import { Button } from "@/components/ui/button";
import { getEventNotes, updatePlannerEvent, type EventNote, type PlannerEvent } from "@/lib/planner-events";
import { cn } from "@/lib/utils/cn";

function noteDate(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Date unknown";
  const day = (value: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Lagos", year: "numeric", month: "2-digit", day: "2-digit" }).format(value);
  const now = new Date();
  if (day(date) === day(now)) return "Today";
  if (day(date) === day(new Date(now.getTime() - 86_400_000))) return "Yesterday";
  return new Intl.DateTimeFormat("en-GB", { timeZone: "Africa/Lagos", day: "2-digit", month: "long", year: "numeric" }).format(date);
}

function inline(line: string): ReactNode[] {
  return line.split(/(\*\*[^*]+\*\*|__[^_]+__|~~[^~]+~~|\^\^[^^]+\^\^|\*[^*]+\*|\[[^\]]+\]\(https?:\/\/[^)]+\))/g).map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) return <strong key={index}>{inline(part.slice(2, -2))}</strong>;
    if (part.startsWith("__") && part.endsWith("__")) return <u key={index}>{inline(part.slice(2, -2))}</u>;
    if (part.startsWith("~~") && part.endsWith("~~")) return <s key={index}>{inline(part.slice(2, -2))}</s>;
    if (part.startsWith("^^") && part.endsWith("^^")) return <span key={index} className="font-medium text-[#3870cf]">{inline(part.slice(2, -2))}</span>;
    if (part.startsWith("*") && part.endsWith("*")) return <em key={index}>{part.slice(1, -1)}</em>;
    const link = /^\[([^\]]+)\]\((https?:\/\/[^)]+)\)$/.exec(part);
    if (link) return <a key={index} href={link[2]} target="_blank" rel="noopener noreferrer" className="font-medium text-brand-primary underline underline-offset-2">{link[1]}</a>;
    return part;
  });
}

function NoteBody({ body }: { body: string }) {
  return <div className="space-y-1.5 text-[0.8125rem] leading-6 text-text-primary">{body.split("\n").map((line, index) => line.startsWith("- ") ? <div key={index} className="flex gap-2"><span aria-hidden="true">•</span><span>{inline(line.slice(2))}</span></div> : line ? <p key={index} className="whitespace-pre-wrap break-words">{inline(line)}</p> : <div key={index} className="h-1" />)}</div>;
}

export function EventNotesTab({ event }: { event: PlannerEvent }) {
  const notes = getEventNotes(event);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const ordered = [...notes].sort((first, second) => Number(second.pinned) - Number(first.pinned) || second.createdAt.localeCompare(first.createdAt));
  const visible = ordered.filter((note) => `${note.body} ${note.author} ${noteDate(note.createdAt)}`.toLowerCase().includes(search.toLowerCase().trim()));

  function save(next: EventNote[]) {
    try { updatePlannerEvent(event.id, (current) => ({ ...current, notes: "", noteEntries: next })); setError(""); return true; }
    catch { setError("This change couldn’t be saved in this browser. Please try again."); return false; }
  }

  function post(body: string, author: string) {
    const note: EventNote = { id: crypto.randomUUID(), body, author, createdAt: new Date().toISOString(), pinned: false };
    return save([...notes, note]);
  }

  return <div className="space-y-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="text-base font-semibold">Team notes</h3><p className="mt-1 text-xs text-text-secondary">Ideas and updates from everyone planning this event.</p></div>{notes.length > 0 && <Button type="button" size="sm" onClick={() => setOpen(true)} leadingIcon={<Plus className="size-3.5" aria-hidden="true" />}>Write a note</Button>}</div>
    {notes.length === 0 ? <div className="flex min-h-72 flex-col items-center justify-center rounded-xl border border-dashed border-border-strong bg-white px-6 py-12 text-center"><span className="flex size-12 items-center justify-center rounded-xl bg-[#edf4ee] text-brand-primary"><MessageSquareText className="size-6" aria-hidden="true" /></span><h4 className="mt-4 text-base font-semibold">No notes yet</h4><p className="mt-2 max-w-sm text-xs leading-5 text-text-secondary">Capture a thought, meeting takeaway or reminder. Your team’s notes will appear here.</p><Button type="button" size="sm" className="mt-5" onClick={() => setOpen(true)} leadingIcon={<Plus className="size-3.5" aria-hidden="true" />}>Write your note</Button></div> : <><div className="relative"><Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-text-tertiary" aria-hidden="true" /><input type="search" aria-label="Search notes" value={search} onChange={(change) => setSearch(change.target.value)} placeholder="Search notes or authors" className="h-11 w-full rounded-xl border border-border-subtle bg-white pl-10 pr-4 text-xs outline-none focus:border-brand-primary" /></div>{visible.length ? <div className="space-y-3">{visible.map((note) => <article key={note.id} className={cn("rounded-xl border bg-white p-4 sm:p-5", note.pinned ? "border-[#cbded0]" : "border-border-subtle")}><div className="flex items-start gap-3"><span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#e8f1eb] text-xs font-bold text-brand-primary">{note.author.split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("")}</span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-x-2 gap-y-1"><span className="text-xs font-semibold text-text-primary">{note.author}</span><span className="text-[0.6875rem] text-text-tertiary">{noteDate(note.createdAt)}</span>{note.pinned && <span className="inline-flex items-center gap-1 rounded-full bg-[#eaf3ed] px-2 py-0.5 text-[0.625rem] font-semibold text-brand-primary"><Pin className="size-2.5" aria-hidden="true" />Pinned</span>}</div><div className="mt-3"><NoteBody body={note.body} /></div></div><div className="flex shrink-0 items-center gap-1"><button type="button" onClick={() => save(notes.map((item) => item.id === note.id ? { ...item, pinned: !item.pinned } : item))} aria-label={note.pinned ? "Unpin note" : "Pin note"} title={note.pinned ? "Unpin note" : "Pin note"} className={cn("flex size-8 items-center justify-center rounded-lg hover:bg-background-subtle", note.pinned ? "text-brand-primary" : "text-text-tertiary")}><Pin className="size-4" aria-hidden="true" /></button><button type="button" onClick={() => setConfirmDelete(note.id)} aria-label="Delete note" title="Delete note" className="flex size-8 items-center justify-center rounded-lg text-text-tertiary hover:bg-error-soft hover:text-error"><Trash2 className="size-4" aria-hidden="true" /></button></div></div>{confirmDelete === note.id && <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-error-soft px-3 py-2"><p className="text-xs font-medium text-error">Delete this note permanently?</p><div className="flex gap-2"><button type="button" onClick={() => setConfirmDelete(null)} className="px-2 py-1 text-xs font-semibold text-text-secondary">Cancel</button><button type="button" onClick={() => { if (save(notes.filter((item) => item.id !== note.id))) setConfirmDelete(null); }} className="rounded-md bg-error px-2.5 py-1.5 text-xs font-semibold text-white">Delete</button></div></div>}</article>)}</div> : <div className="rounded-xl border border-dashed border-border-strong bg-white px-6 py-12 text-center"><Search className="mx-auto size-6 text-text-tertiary" aria-hidden="true" /><h4 className="mt-3 text-sm font-semibold">No matching notes</h4><p className="mt-1 text-xs text-text-secondary">Try another word or author name.</p><button type="button" onClick={() => setSearch("")} className="mt-3 text-xs font-semibold text-brand-primary hover:underline">Clear search</button></div>}</>}
    {error && <p role="alert" className="rounded-lg bg-error-soft px-3 py-2 text-xs text-error">{error}</p>}{open && <NoteComposerDialog open={open} onOpenChange={setOpen} onPost={post} />}
  </div>;
}
