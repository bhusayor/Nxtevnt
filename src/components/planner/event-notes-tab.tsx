"use client";

import { DeleteConfirmation } from "@/components/ui/delete-confirmation";

import { useId, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ClipboardCheck, LockSimple, MessageSquareText, NotebookPen, Pin, Search, Star } from "@/components/ui/icons";
import { InlineNoteComposer } from "./note-composer";
import { NoteFileAttachments } from "./note-file-attachments";
import { EventNotesBrief } from "./event-notes-brief";
import { NoteActionsMenu } from "./note-actions-menu";
import { NoteBody } from "./note-body";
import { NoteTaskDialog } from "./note-task-dialog";
import { createNoteTask, filterEventNotes, groupEventNotes, noteDate, noteTime, type NoteFilter } from "@/lib/event-notes";
import { getEventNotes, updatePlannerEvent, type EventItem, type EventNote, type PlannerEvent } from "@/lib/planner-events";
import { usePlannerTeam } from "@/lib/planner-team";
import { cn } from "@/lib/utils/cn";

export function EventNotesTab({ event, initialCompose = false }: { event: PlannerEvent; initialCompose?: boolean }) {
  const notes = getEventNotes(event);
  const team = usePlannerTeam();
  const author = team.find((member) => member.isOwner) || team[0];
  const id = useId();
  const [editing, setEditing] = useState<EventNote | null>(null);
  const [taskNote, setTaskNote] = useState<EventNote | null>(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [deleting, setDeleting] = useState<EventNote | null>(null);
  const [filter, setFilter] = useState<NoteFilter>("all");
  const term = search.toLocaleLowerCase().trim();
  const pinned = notes.filter((note) => note.pinned).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const visible = filterEventNotes(notes, filter, search);
  const emptyTitle = term ? "No matching notes" : filter === "pinned" ? "No pinned notes yet" : filter === "team" ? "No team notes yet" : filter === "nimi" ? "No notes from Nimi yet" : "No notes yet";
  const emptyDetail = term ? "Try another title, word or author name." : filter === "pinned" ? "Pin a note from its menu to keep it here and in the side column." : filter === "nimi" ? "Notes from Nimi will appear here when they’re added to this event." : "Start with a title and a thought above. Your notes will appear here.";
  const groups = groupEventNotes(visible);
  const linkedTask = (note: EventNote) => event.sections.tasks.find((task) => task.id === note.taskId || task.sourceNoteId === note.id);
  const taskHref = (task: EventItem) => `/planner/events/${event.id}?section=tasks&task=${encodeURIComponent(task.id)}`;

  function save(update: (current: PlannerEvent) => PlannerEvent, message: string) {
    try { let found = false; updatePlannerEvent(event.id, (current) => { found = true; return update(current); }); if (!found) throw new Error("This event no longer exists."); setError(""); setFeedback(message); return true; }
    catch (problem) { setError(problem instanceof Error ? problem.message : "This change couldn’t be saved. Please try again."); return false; }
  }
  function write(note: EventNote) { setEditing(note); setError(""); setFeedback(""); }
  function post(draft: { title: string; body: string }, editingNote?: EventNote) {
    const now = new Date().toISOString();
    const saved = save((current) => {
      const currentNotes = getEventNotes(current);
      if (editingNote && !currentNotes.some((note) => note.id === editingNote.id)) throw new Error("This note no longer exists. Cancel this edit and try again.");
      const next = editingNote ? currentNotes.map((note) => note.id === editingNote.id ? { ...note, ...draft, updatedAt: now } : note) : [...currentNotes, { id: crypto.randomUUID(), ...draft, author: author?.name || "Planner", authorId: author?.id, createdAt: now, pinned: false }];
      return { ...current, notes: "", noteEntries: next };
    }, editingNote ? "Note updated." : "Note posted.");
    if (saved && editingNote) setEditing(null);
    return saved;
  }
  function pin(note: EventNote) {
    save((current) => ({ ...current, notes: "", noteEntries: getEventNotes(current).map((entry) => entry.id === note.id ? { ...entry, pinned: !entry.pinned } : entry) }), note.pinned ? "Note unpinned." : "Note moved to Pinned notes.");
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

  function renderNote(note: EventNote) {
    if (editing?.id === note.id) return <InlineNoteComposer key={note.id} initialNote={editing} autoFocus onSave={(draft) => post(draft, note)} onCancel={() => setEditing(null)} />;
    const task = linkedTask(note);
          const title = note.title || `Note by ${note.author}`;
          return <article key={note.id} className={cn("min-w-0 rounded-xl border bg-white p-4 sm:p-5", note.pinned ? "border-[#cbded0]" : "border-border-subtle")}>
            <div className="flex items-start gap-3"><span className="relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#e8f1eb] text-xs font-bold text-brand-primary">{note.authorAvatar ? <Image src={note.authorAvatar} alt={`${note.author} avatar`} fill unoptimized sizes="40px" className="object-cover" /> : note.author.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "?"}</span>
              <div className="min-w-0 flex-1 pt-0.5"><p className="break-words text-xs font-semibold text-text-primary">{note.author}</p><div className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[0.6875rem] leading-5 text-text-tertiary"><time dateTime={note.createdAt}>{noteTime(note.createdAt)} · {noteDate(note.createdAt)}</time>{note.updatedAt && <span title={`Edited ${noteTime(note.updatedAt)} · ${noteDate(note.updatedAt)}`}>· Edited</span>}</div></div>
              <NoteActionsMenu title={title} pinned={note.pinned} taskHref={task ? taskHref(task) : undefined} onEdit={() => write(note)} onPin={() => pin(note)} onTask={() => { setError(""); setTaskNote(note); }} onDelete={() => { setError(""); setDeleting(note); }} />
            </div>
            {note.title && <h5 className="mt-4 break-words text-sm font-semibold leading-6">{note.title}</h5>}
            <div className={note.title ? "mt-1.5" : "mt-4"}><NoteBody body={note.body} /></div>
            <NoteFileAttachments event={event} noteId={note.id} />
            {task && <Link href={taskHref(task)} className="mt-4 inline-flex min-h-9 max-w-full items-center gap-2 text-xs font-semibold text-brand-primary hover:underline"><ClipboardCheck className="size-4 shrink-0" aria-hidden="true" /><span className="truncate">View task · {task.title}</span></Link>}
          </article>;
  }

  return <div className="space-y-6">
    <header className="flex flex-wrap items-start justify-between gap-4"><div><p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[.12em] text-[#a4671c]"><NotebookPen className="size-4" aria-hidden="true" />The event notebook</p><h2 className="mt-2 text-2xl font-semibold tracking-tight">Every detail, in one place.</h2><p className="mt-2 text-sm text-text-secondary">Ideas, decisions and little things worth remembering.</p></div><span className="inline-flex items-center gap-2 rounded-full border border-border-subtle bg-white px-3 py-2 text-xs font-medium text-text-secondary"><LockSimple className="size-3.5" aria-hidden="true" />Only your team</span></header>
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_320px] 2xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="min-w-0 space-y-5">
        <InlineNoteComposer onSave={post} autoFocus={initialCompose} />
        {feedback && <p role="status" className="text-sm text-brand-primary">{feedback}</p>}{error && <p role="alert" className="rounded-lg bg-error-soft px-3 py-2 text-sm text-error">{error}</p>}
        <div className="flex items-center justify-between gap-3"><h3 className="text-sm font-semibold">Your notes <span className="ml-2 rounded-full bg-background-subtle px-2 py-1 text-xs font-medium text-text-secondary">{notes.length}</span></h3><span className="text-xs text-text-tertiary">Newest first</span></div>
        {notes.length > 0 && <div className="relative"><Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-text-tertiary" aria-hidden="true" /><input type="search" aria-label="Search notes" value={search} onChange={(change) => setSearch(change.target.value)} placeholder="Search titles, notes or authors" className="h-11 w-full rounded-xl border border-border-subtle bg-white pl-10 pr-4 text-sm outline-none focus:border-brand-primary" /></div>}
        <div role="group" aria-label="Note filters" className="flex gap-2 overflow-x-auto pb-1">
          {([{ id: "all", label: "All notes" }, { id: "pinned", label: "Pinned" }, { id: "team", label: "By the team" }, { id: "nimi", label: "From Nimi" }] as const).map((item) => <button key={item.id} type="button" aria-pressed={filter === item.id} onClick={() => setFilter(item.id)} className={cn("inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl px-4 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary", filter === item.id ? "bg-brand-primary text-white" : "text-text-secondary hover:bg-background-subtle hover:text-text-primary")}>{item.id === "nimi" && <Star className="size-4" aria-hidden="true" />}{item.label}</button>)}
        </div>
        {groups.length ? <div className="space-y-6">{groups.map((group, index) => <section key={group.key} aria-labelledby={`${id}-group-${index}`} className="space-y-3"><div className="flex items-center gap-2"><h4 id={`${id}-group-${index}`} className="text-xs font-semibold text-text-secondary">{group.label}</h4><span className="text-xs tabular-nums text-text-tertiary">{group.notes.length}</span><span className="h-px flex-1 bg-border-subtle" aria-hidden="true" /></div>{group.notes.map(renderNote)}</section>)}</div> : <div className="rounded-xl border border-dashed border-border-strong bg-white px-6 py-10 text-center"><MessageSquareText className="mx-auto size-6 text-text-tertiary" aria-hidden="true" /><h4 className="mt-3 text-sm font-semibold">{emptyTitle}</h4><p className="mt-2 text-sm text-text-secondary">{emptyDetail}</p>{term && <button type="button" onClick={() => setSearch("")} className="mt-3 min-h-9 text-sm font-semibold text-brand-primary hover:underline">Clear search</button>}</div>}
      </div>
      <aside aria-label="Event brief and pinned notes" className="min-w-0 space-y-5">
        <EventNotesBrief event={event} />
        <section aria-labelledby="event-pinned-notes" className="space-y-3"><h3 id="event-pinned-notes" className="flex items-center gap-2 text-sm font-semibold"><Pin className="size-4 text-[#a4671c]" aria-hidden="true" />Pinned notes {pinned.length > 0 && <span className="text-xs font-normal text-text-tertiary">{pinned.length}</span>}</h3>{pinned.length ? pinned.map(renderNote) : <div className="rounded-2xl border border-dashed border-[#e7d8c1] bg-[#fcfaf6] p-5"><p className="text-sm font-semibold">A place for the essentials</p><p className="mt-2 text-sm leading-6 text-text-secondary">Pin a note from its menu to keep important details close at hand.</p></div>}</section>
      </aside>
    </div>
    {taskNote && <NoteTaskDialog key={taskNote.id} note={taskNote} event={event} onClose={() => setTaskNote(null)} onCreate={createTask} />}
    <DeleteConfirmation open={Boolean(deleting)} onOpenChange={(value) => { if (!value) setDeleting(null); }} title="Delete note?" description={`This permanently removes “${deleting?.title || "this note"}” from the event.${deleting && linkedTask(deleting) ? " Its linked task will stay in Tasks." : ""} This can’t be undone.`} error={error} onConfirm={remove} />
  </div>;
}
