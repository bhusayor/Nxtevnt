"use client";

import { DeleteConfirmation } from "@/components/ui/delete-confirmation";

import { useId, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ClipboardCheck, MessageSquareText, Pin, Plus, Search } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { NoteComposerDialog } from "./note-composer";
import { NoteActionsMenu } from "./note-actions-menu";
import { NoteBody } from "./note-body";
import { NoteTaskDialog } from "./note-task-dialog";
import { createNoteTask, groupEventNotes, noteDate, noteDateLabel, noteTime } from "@/lib/event-notes";
import { getEventNotes, updatePlannerEvent, type EventItem, type EventNote, type PlannerEvent } from "@/lib/planner-events";
import { usePlannerTeam } from "@/lib/planner-team";
import { cn } from "@/lib/utils/cn";

export function EventNotesTab({ event, initialCompose = false }: { event: PlannerEvent; initialCompose?: boolean }) {
  const notes = getEventNotes(event);
  const team = usePlannerTeam();
  const author = team.find((member) => member.isOwner) || team[0];
  const id = useId();
  const [open, setOpen] = useState(initialCompose);
  const [editing, setEditing] = useState<EventNote | null>(null);
  const [taskNote, setTaskNote] = useState<EventNote | null>(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [deleting, setDeleting] = useState<EventNote | null>(null);
  const term = search.toLocaleLowerCase().trim();
  const visible = notes.filter((note) => `${note.title || ""} ${note.body} ${note.author} ${noteDateLabel(note.createdAt)} ${noteDate(note.createdAt)}`.toLocaleLowerCase().includes(term));
  const groups = groupEventNotes(visible);
  const linkedTask = (note: EventNote) => event.sections.tasks.find((task) => task.id === note.taskId || task.sourceNoteId === note.id);
  const taskHref = (task: EventItem) => `/planner/events/${event.id}?section=tasks&task=${encodeURIComponent(task.id)}`;

  function save(update: (current: PlannerEvent) => PlannerEvent, message: string) {
    try { updatePlannerEvent(event.id, update); setError(""); setFeedback(message); return true; }
    catch (problem) { setError(problem instanceof Error ? problem.message : "This change couldn’t be saved. Please try again."); return false; }
  }
  function write(note?: EventNote) { setEditing(note || null); setError(""); setFeedback(""); setOpen(true); }
  function post(draft: { title: string; body: string }) {
    const now = new Date().toISOString();
    return save((current) => {
      const currentNotes = getEventNotes(current);
      if (editing && !currentNotes.some((note) => note.id === editing.id)) throw new Error("This note no longer exists. Close the editor and try again.");
      const next = editing ? currentNotes.map((note) => note.id === editing.id ? { ...note, ...draft, updatedAt: now } : note) : [...currentNotes, { id: crypto.randomUUID(), ...draft, author: author?.name || "Planner", authorId: author?.id, createdAt: now, pinned: false }];
      return { ...current, notes: "", noteEntries: next };
    }, editing ? "Note updated." : "Note posted.");
  }
  function pin(note: EventNote) {
    save((current) => ({ ...current, notes: "", noteEntries: getEventNotes(current).map((entry) => entry.id === note.id ? { ...entry, pinned: !entry.pinned } : entry) }), note.pinned ? "Note unpinned." : "Note pinned to the top.");
  }
  function createTask(task: EventItem) {
    if (!taskNote) return false;
    return save((current) => createNoteTask(current, getEventNotes(current), taskNote.id, task), "Task created. Your original note is still here.");
  }
  function remove() {
    if (!deleting) return;
    const saved = save((current) => ({ ...current, notes: "", noteEntries: getEventNotes(current).filter((note) => note.id !== deleting.id) }), "Note deleted.");
    if (saved) setDeleting(null);
    return saved;
  }

  return <div className="space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="text-base font-semibold">Team notes</h3><p className="mt-1 text-xs text-text-secondary">Pinned notes first, then your team’s updates by date.</p></div>{notes.length > 0 && <Button type="button" size="sm" onClick={() => write()} leadingIcon={<Plus className="size-3.5" aria-hidden="true" />}>Write a note</Button>}</div>
    {notes.length === 0 ? <div className="flex min-h-72 flex-col items-center justify-center rounded-xl border border-dashed border-border-strong bg-white px-6 py-12 text-center"><span className="flex size-12 items-center justify-center rounded-xl bg-[#edf4ee] text-brand-primary"><MessageSquareText className="size-6" aria-hidden="true" /></span><h4 className="mt-4 text-base font-semibold">No notes yet</h4><p className="mt-2 max-w-sm text-xs leading-5 text-text-secondary">Capture a thought, meeting takeaway or reminder. Your team’s notes will appear here.</p><Button type="button" size="sm" className="mt-5" onClick={() => write()} leadingIcon={<Plus className="size-3.5" aria-hidden="true" />}>Write your note</Button></div> : <>
      <div className="relative"><Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-text-tertiary" aria-hidden="true" /><input type="search" aria-label="Search notes" value={search} onChange={(change) => setSearch(change.target.value)} placeholder="Search titles, notes or authors" className="h-11 w-full rounded-xl border border-border-subtle bg-white pl-10 pr-4 text-xs outline-none focus:border-brand-primary" /></div>
      {groups.length ? <div className="space-y-6">{groups.map((group, index) => <section key={group.key} aria-labelledby={`${id}-group-${index}`} className="space-y-3">
        <div className="flex items-center gap-2"><h4 id={`${id}-group-${index}`} className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-secondary">{group.key === "pinned" && <Pin className="size-3.5 text-brand-primary" aria-hidden="true" />}{group.label}</h4><span className="text-[0.625rem] tabular-nums text-text-tertiary">{group.notes.length}</span><span className="h-px flex-1 bg-border-subtle" aria-hidden="true" /></div>
        {group.notes.map((note) => {
          const task = linkedTask(note);
          const title = note.title || `Note by ${note.author}`;
          return <article key={note.id} className={cn("min-w-0 rounded-xl border bg-white p-4 sm:p-5", note.pinned ? "border-[#cbded0]" : "border-border-subtle")}>
            <div className="flex items-start gap-3"><span className="relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#e8f1eb] text-xs font-bold text-brand-primary">{note.authorAvatar ? <Image src={note.authorAvatar} alt={`${note.author} avatar`} fill unoptimized sizes="40px" className="object-cover" /> : note.author.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "?"}</span>
              <div className="min-w-0 flex-1 pt-0.5"><p className="break-words text-xs font-semibold text-text-primary">{note.author}</p><div className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[0.6875rem] leading-5 text-text-tertiary"><time dateTime={note.createdAt}>{noteTime(note.createdAt)} · {noteDate(note.createdAt)}</time>{note.updatedAt && <span title={`Edited ${noteTime(note.updatedAt)} · ${noteDate(note.updatedAt)}`}>· Edited</span>}</div></div>
              <NoteActionsMenu title={title} pinned={note.pinned} taskHref={task ? taskHref(task) : undefined} onEdit={() => write(note)} onPin={() => pin(note)} onTask={() => { setError(""); setTaskNote(note); }} onDelete={() => { setError(""); setDeleting(note); }} />
            </div>
            {note.title && <h5 className="mt-4 break-words text-sm font-semibold leading-6">{note.title}</h5>}
            <div className={note.title ? "mt-1.5" : "mt-4"}><NoteBody body={note.body} /></div>
            {task && <Link href={taskHref(task)} className="mt-4 inline-flex min-h-9 max-w-full items-center gap-2 text-xs font-semibold text-brand-primary hover:underline"><ClipboardCheck className="size-4 shrink-0" aria-hidden="true" /><span className="truncate">View task · {task.title}</span></Link>}
          </article>;
        })}
      </section>)}</div> : <div className="rounded-xl border border-dashed border-border-strong bg-white px-6 py-12 text-center"><Search className="mx-auto size-6 text-text-tertiary" aria-hidden="true" /><h4 className="mt-3 text-sm font-semibold">No matching notes</h4><p className="mt-1 text-xs text-text-secondary">Try another title, word or author name.</p><button type="button" onClick={() => setSearch("")} className="mt-3 text-xs font-semibold text-brand-primary hover:underline">Clear search</button></div>}
    </>}
    {feedback && <p role="status" className="text-xs text-brand-primary">{feedback}</p>}{error && <p role="alert" className="rounded-lg bg-error-soft px-3 py-2 text-xs text-error">{error}</p>}
    {open && <NoteComposerDialog key={editing?.id || "new"} open={open} onOpenChange={setOpen} onSave={post} initialNote={editing || undefined} />}
    {taskNote && <NoteTaskDialog key={taskNote.id} note={taskNote} event={event} onClose={() => setTaskNote(null)} onCreate={createTask} />}
    <DeleteConfirmation open={Boolean(deleting)} onOpenChange={(value) => { if (!value) setDeleting(null); }} title="Delete note?" description={`This permanently removes “${deleting?.title || "this note"}” from the event.${deleting && linkedTask(deleting) ? " Its linked task will stay in Tasks." : ""} This can’t be undone.`} error={error} onConfirm={remove} />
  </div>;
}
