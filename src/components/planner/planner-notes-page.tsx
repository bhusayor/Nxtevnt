"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ActionMenu } from "@/components/ui/action-menu";
import { Button } from "@/components/ui/button";
import { DeleteConfirmation } from "@/components/ui/delete-confirmation";
import { SearchInput } from "@/components/ui/search-input";
import { Archive, Folder, LockSimple, Microphone, NotebookPen, Pin, Plus, RotateCcw, Trash2, Upload } from "@/components/ui/icons";
import { getEventNotes, updatePlannerEvent, usePlannerEvents, type EventNote, type PlannerEvent } from "@/lib/planner-events";
import { noteDateLabel, noteDay, notePlainText, noteTime, noteTitleFromBody } from "@/lib/event-notes";
import { addWorkspaceNote, deleteWorkspaceNote, updateWorkspaceNote, useWorkspaceNotes, type WorkspaceNote } from "@/lib/planner-workspace-notes";
import { usePlannerTeam } from "@/lib/planner-team";
import { usePlannerClients } from "@/lib/planner-clients";
import { usePlannerProspects } from "@/lib/planner-prospects";
import { cn } from "@/lib/utils/cn";
import { NoteSelect, WorkspaceNoteModal, NOTE_CATEGORIES, type WorkspaceNoteDraft } from "./workspace-note-modal";
import { WorkspaceNoteDetail } from "./workspace-note-detail";
import { noteCategoryTone } from "./note-category-tone";

type View = "all" | "mine" | "leads" | "archive" | `event:${string}`;
type Entry = { note: EventNote; event?: PlannerEvent; notebook?: WorkspaceNote["notebook"] };
const titleOf = (note: EventNote) => note.title?.trim() || noteTitleFromBody(note.body) || "Untitled note";
const eventHref = (event: PlannerEvent) => `/planner/events/${event.id}?section=notes`;
const entryKey = (entry: Entry) => `${entry.event?.id || entry.notebook}-${entry.note.id}`;

function NoteTypeIcon({ note }: { note: EventNote }) {
  const kind = note.kind || (note.id === "legacy-note" ? "imported" : "typed");
  const Icon = kind === "voice" ? Microphone : kind === "imported" ? Upload : NotebookPen;
  return <span title={`${kind[0].toUpperCase()}${kind.slice(1)} note`} className={cn("flex size-9 shrink-0 items-center justify-center rounded-xl", kind === "voice" ? "bg-[#e9f4ef] text-[#32755b]" : kind === "imported" ? "bg-[#edf2fa] text-[#5275a2]" : "bg-[#fbf2e7] text-[#a4671c]")}><Icon className="size-[18px]" aria-hidden="true" /></span>;
}

export function PlannerNotesPage() {
  const events = usePlannerEvents();
  const ownNotes = useWorkspaceNotes();
  const team = usePlannerTeam();
  const clients = usePlannerClients();
  const prospects = usePlannerProspects();
  const [view, setView] = useState<View>("all");
  const [eventSearch, setEventSearch] = useState("");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [composerOpen, setComposerOpen] = useState(false);
  const [detailKey, setDetailKey] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<Entry | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const author = team.find((member) => member.isOwner) || team[0];
  const destinationPerson = (destination: string) => {
    if (destination.startsWith("prospect:")) {
      const person = prospects.find((entry) => entry.id === destination.slice(9));
      if (!person) throw new Error("That prospect is no longer available.");
      return { type: "prospect" as const, id: person.id, name: person.name };
    }
    if (destination.startsWith("client:")) {
      const person = clients.find((entry) => entry.id === destination.slice(7));
      if (!person) throw new Error("That client is no longer available.");
      return { type: "client" as const, id: person.id, name: person.name };
    }
    return undefined;
  };
  const destinationNotebook = (destination: string) => destination === "leads" || destination.startsWith("prospect:") ? "leads" as const : "mine" as const;

  const allEntries = useMemo<Entry[]>(() => [
    ...ownNotes.map((note) => ({ note, notebook: note.notebook })),
    ...events.flatMap((event) => getEventNotes(event).map((note) => ({ note, event }))),
  ], [ownNotes, events]);
  const selectedEvent = view.startsWith("event:") ? events.find((event) => event.id === view.slice(6)) : undefined;
  const activeView: View = view.startsWith("event:") && !selectedEvent ? "all" : view;
  const activeEntries = allEntries.filter((entry) => !entry.note.archivedAt);
  const archivedEntries = allEntries.filter((entry) => Boolean(entry.note.archivedAt));
  const eventCounts = new Map(events.map((event) => [event.id, getEventNotes(event).filter((note) => !note.archivedAt).length]));
  const detail = detailKey ? allEntries.find((entry) => entryKey(entry) === detailKey) : undefined;
  const viewTitle = activeView === "all" ? "All notes" : activeView === "mine" ? "My notebook" : activeView === "leads" ? "Leads" : activeView === "archive" ? "Archive" : selectedEvent?.name || "Event notebook";

  const filtered = allEntries.filter((entry) => {
    if (activeView === "archive" ? !entry.note.archivedAt : Boolean(entry.note.archivedAt)) return false;
    if (activeView === "mine" && entry.notebook !== "mine") return false;
    if (activeView === "leads" && entry.notebook !== "leads") return false;
    if (activeView.startsWith("event:") && entry.event?.id !== activeView.slice(6)) return false;
    const category = entry.note.category || (entry.notebook === "leads" ? "Lead" : "General");
    if (categoryFilter !== "all" && categoryFilter !== category) return false;
    const term = search.trim().toLocaleLowerCase();
    return !term || `${entry.note.title || ""} ${entry.note.body} ${entry.note.author} ${category} ${(entry.note.tags || []).join(" ")} ${entry.event?.name || ""} ${entry.notebook ? (entry.note as WorkspaceNote).person?.name || "" : ""}`.toLocaleLowerCase().includes(term);
  }).sort((a, b) => Number(Boolean(b.note.pinned)) - Number(Boolean(a.note.pinned)) || (b.note.updatedAt || b.note.createdAt).localeCompare(a.note.updatedAt || a.note.createdAt));
  const grouped = new Map<string, { label: string; entries: Entry[] }>();
  for (const entry of filtered) {
    const key = entry.note.pinned ? "pinned" : noteDay(entry.note.createdAt);
    if (!grouped.has(key)) grouped.set(key, { label: entry.note.pinned ? "Pinned" : noteDateLabel(entry.note.createdAt), entries: [] });
    grouped.get(key)!.entries.push(entry);
  }
  const categoryOptions = [...new Set([...NOTE_CATEGORIES, "Lead", ...allEntries.map((entry) => entry.note.category).filter((value): value is string => Boolean(value))])];

  function changeNote(entry: Entry, update: (note: EventNote) => EventNote) {
    if (entry.event) {
      updatePlannerEvent(entry.event.id, (event) => ({ ...event, notes: "", noteEntries: getEventNotes(event).map((note) => note.id === entry.note.id ? update(note) : note) }));
    } else {
      updateWorkspaceNote(entry.note.id, (note) => ({ ...update(note), notebook: note.notebook }));
    }
  }

  function saveNote(draft: WorkspaceNoteDraft) {
    try {
      const now = new Date().toISOString();
      const note: EventNote = { id: crypto.randomUUID(), title: draft.title, body: draft.body, category: draft.category, tags: draft.tags, kind: draft.kind, author: author?.name || "Planner", authorId: author?.id, createdAt: now, pinned: false };
      if (draft.destination.startsWith("event:")) {
        const eventId = draft.destination.slice(6);
        if (!events.some((event) => event.id === eventId)) throw new Error("Choose an event before saving this note.");
        updatePlannerEvent(eventId, (event) => ({ ...event, notes: "", noteEntries: [...getEventNotes(event), note] }));
      } else {
        addWorkspaceNote({ ...note, notebook: destinationNotebook(draft.destination), person: destinationPerson(draft.destination) });
      }
      setComposerOpen(false); setError(""); setNotice("Note added.");
      return true;
    } catch (problem) { setError(problem instanceof Error ? problem.message : "The note could not be saved."); return false; }
  }

  function togglePin(entry: Entry) {
    try { changeNote(entry, (note) => ({ ...note, pinned: !note.pinned })); setError(""); setNotice(entry.note.pinned ? "Note unpinned." : "Note pinned."); }
    catch { setError("The pin could not be changed."); }
  }
  function toggleArchive(entry: Entry) {
    try { changeNote(entry, (note) => ({ ...note, archivedAt: note.archivedAt ? undefined : new Date().toISOString(), updatedAt: new Date().toISOString() })); setError(""); setNotice(entry.note.archivedAt ? "Note restored." : "Note archived."); setDetailKey(null); }
    catch { setError("The note could not be moved to the archive."); }
  }
  function changeCategory(entry: Entry, category: string) {
    try { changeNote(entry, (note) => ({ ...note, category, updatedAt: new Date().toISOString() })); setError(""); }
    catch { setError("The category could not be changed."); }
  }
  function changeTags(entry: Entry, tags: string[]) {
    try { changeNote(entry, (note) => ({ ...note, tags, updatedAt: new Date().toISOString() })); setError(""); }
    catch { setError("The tags could not be saved."); }
  }
  function changeAdditionalThoughts(entry: Entry, additionalThoughts: string) {
    try { changeNote(entry, (note) => ({ ...note, additionalThoughts, updatedAt: new Date().toISOString() })); setError(""); }
    catch { setError("The additional thoughts could not be saved."); }
  }
  function moveNote(entry: Entry, destination: string) {
    const current = entry.event ? `event:${entry.event.id}` : entry.notebook && (entry.note as WorkspaceNote).person ? `${(entry.note as WorkspaceNote).person!.type}:${(entry.note as WorkspaceNote).person!.id}` : entry.notebook;
    if (destination === current) return;
    try {
      const next = { ...entry.note, updatedAt: new Date().toISOString() };
      if (!entry.event && !destination.startsWith("event:")) {
        updateWorkspaceNote(entry.note.id, (note) => ({ ...note, notebook: destinationNotebook(destination), person: destinationPerson(destination), updatedAt: next.updatedAt }));
      } else if (destination.startsWith("event:")) {
        const eventId = destination.slice(6);
        if (!events.some((event) => event.id === eventId)) throw new Error("That event is no longer available.");
        updatePlannerEvent(eventId, (event) => ({ ...event, notes: "", noteEntries: [...getEventNotes(event), next] }));
      } else addWorkspaceNote({ ...next, notebook: destinationNotebook(destination), person: destinationPerson(destination) });
      if (entry.event) updatePlannerEvent(entry.event.id, (event) => ({ ...event, notes: "", noteEntries: getEventNotes(event).filter((note) => note.id !== entry.note.id) }));
      else if (destination.startsWith("event:")) deleteWorkspaceNote(entry.note.id);
      setDetailKey(`${destination.startsWith("event:") ? destination : destinationNotebook(destination)}-${entry.note.id}`);
      setError(""); setNotice("Note moved.");
    } catch (problem) { setError(problem instanceof Error ? problem.message : "The note could not be moved."); }
  }
  function remove() {
    if (!deleting) return false;
    try {
      if (deleting.event) updatePlannerEvent(deleting.event.id, (event) => ({ ...event, notes: "", noteEntries: getEventNotes(event).filter((note) => note.id !== deleting.note.id) }));
      else deleteWorkspaceNote(deleting.note.id);
      setDeleting(null); setDetailKey(null); setError(""); setNotice("Note deleted."); return true;
    } catch { setError("The note could not be deleted."); return false; }
  }

  const notebookNav = [
    { id: "all" as View, label: "All notes", count: activeEntries.length, icon: NotebookPen },
    { id: "mine" as View, label: "My notebook", count: activeEntries.filter((entry) => entry.notebook === "mine").length, icon: NotebookPen },
    { id: "leads" as View, label: "Leads", count: activeEntries.filter((entry) => entry.notebook === "leads").length, icon: NotebookPen },
    { id: "archive" as View, label: "Archive", count: archivedEntries.length, icon: Archive },
  ];

  return <main className="mx-auto w-full max-w-[94rem] space-y-6 px-4 pb-12 sm:px-6 lg:px-10">
    <header className="flex flex-wrap items-start justify-between gap-4"><div><p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[.12em] text-[#a4671c]"><NotebookPen className="size-4" aria-hidden="true" />The planner notebook</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-text-primary">Notes</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-text-secondary">Your notebook is yours alone. Notes linked to an event are shared with your team, never your client.</p></div><Button type="button" leadingIcon={<Plus className="size-4" aria-hidden="true" />} onClick={() => setComposerOpen(true)}>Add note</Button></header>
    {error && <p role="alert" className="rounded-xl bg-error-soft px-4 py-3 text-sm text-error">{error}</p>}{notice && <p role="status" className="text-sm text-brand-primary">{notice}</p>}
    <div className="grid items-start gap-5 lg:grid-cols-[230px_minmax(0,1fr)] xl:grid-cols-[250px_minmax(0,1fr)]">
      <aside aria-label="Notebooks" className="space-y-5"><section className="overflow-hidden rounded-2xl border border-border-subtle bg-white p-3"><h2 className="px-2 py-2 text-[0.6875rem] font-semibold uppercase tracking-[.1em] text-text-tertiary">My notebooks</h2><div className="space-y-1">{notebookNav.map((item) => { const Icon = item.icon; return <button key={item.id} type="button" aria-current={activeView === item.id ? "page" : undefined} onClick={() => { setView(item.id); setCategoryFilter("all"); }} className={cn("flex min-h-11 w-full items-center gap-2 rounded-lg px-3 text-left text-sm transition-colors", activeView === item.id ? "bg-[#eaf3ed] font-semibold text-brand-primary" : "text-text-secondary hover:bg-background-subtle hover:text-text-primary")}><Icon className="size-4 shrink-0" aria-hidden="true" /><span className="min-w-0 flex-1 truncate">{item.label}</span><span className="text-xs tabular-nums">{item.count}</span></button>; })}</div></section>
        <section className="overflow-hidden rounded-2xl border border-border-subtle bg-white p-3"><div className="px-2 py-2"><h2 className="flex items-center gap-2 text-sm font-semibold"><Folder className="size-4 text-brand-primary" aria-hidden="true" />Event notebooks</h2><p className="mt-1 flex items-center gap-1 text-xs text-text-tertiary"><LockSimple className="size-3.5" aria-hidden="true" />Team only · not clients</p></div><div className="mt-2"><SearchInput aria-label="Find an event notebook" placeholder="Find an event…" value={eventSearch} onChange={(event) => setEventSearch(event.target.value)} onClear={() => setEventSearch("")} /></div><div className="mt-3 max-h-80 space-y-1 overflow-y-auto">{events.filter((event) => event.name.toLocaleLowerCase().includes(eventSearch.trim().toLocaleLowerCase())).map((event) => <button key={event.id} type="button" aria-current={activeView === `event:${event.id}` ? "page" : undefined} onClick={() => { setView(`event:${event.id}`); setCategoryFilter("all"); }} className={cn("flex min-h-11 w-full items-center gap-2 rounded-lg px-3 text-left text-sm transition-colors", activeView === `event:${event.id}` ? "bg-[#eaf3ed] font-semibold text-brand-primary" : "text-text-secondary hover:bg-background-subtle hover:text-text-primary")}><Folder className="size-4 shrink-0" aria-hidden="true" /><span className="min-w-0 flex-1 truncate">{event.name}</span><span className="text-xs tabular-nums">{eventCounts.get(event.id) || 0}</span></button>)}{events.length === 0 && <p className="px-2 py-4 text-xs leading-5 text-text-tertiary">Create an event to give it a team notebook.</p>}</div></section></aside>
      <section aria-label={viewTitle} className="min-w-0 overflow-hidden rounded-2xl border border-border-subtle bg-white"><div className="flex flex-wrap items-end justify-between gap-3 px-5 pb-4 pt-5 sm:px-6"><div><h2 className="text-lg font-semibold text-text-primary">{viewTitle}</h2><p className="mt-1 text-xs text-text-tertiary">{filtered.length} {filtered.length === 1 ? "note" : "notes"}{selectedEvent ? " · Shared with your team" : ""}</p></div>{selectedEvent && <Link href={eventHref(selectedEvent)} className="text-sm font-semibold text-brand-primary hover:underline">Open event notebook →</Link>}</div><div className="flex flex-wrap gap-2 border-b border-border-subtle px-5 pb-5 sm:px-6"><div className="min-w-56 flex-1"><SearchInput aria-label="Search notes" placeholder="Search notes, tags or events…" value={search} onChange={(event) => setSearch(event.target.value)} onClear={() => setSearch("")} /></div><NoteSelect value={categoryFilter} onChange={setCategoryFilter} label="Filter note category" className="min-w-44"><option value="all">All categories</option>{categoryOptions.map((item) => <option key={item}>{item}</option>)}</NoteSelect></div>
        {filtered.length ? <div className="divide-y divide-border-subtle">{[...grouped.entries()].map(([key, group]) => <div key={key}><div className="bg-[#fbfcfb] px-5 py-2 text-xs font-semibold text-text-tertiary sm:px-6">{group.label} <span className="ml-1 font-normal tabular-nums">{group.entries.length}</span></div><ul className="divide-y divide-border-subtle">{group.entries.map((entry) => { const note = entry.note; const title = titleOf(note); const category = note.category || (entry.notebook === "leads" ? "Lead" : "General"); return <li key={entryKey(entry)} className="flex items-start gap-3 px-5 py-4 hover:bg-[#fbfcfb] sm:px-6"><NoteTypeIcon note={note} /><div className="min-w-0 flex-1"><button type="button" onClick={() => setDetailKey(entryKey(entry))} className="break-words text-left text-sm font-semibold text-text-primary hover:text-brand-primary hover:underline">{title}</button><p className="mt-1 line-clamp-2 text-sm leading-5 text-text-secondary">{notePlainText(note.body)}</p><div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-text-tertiary"><span className={cn("rounded-full border px-2 py-0.5 font-medium", noteCategoryTone(category)?.badge || "border-border-subtle bg-background-subtle text-text-secondary")}>{category}</span>{entry.event ? <span className="inline-flex items-center gap-1"><Folder className="size-3.5" aria-hidden="true" />{entry.event.name}</span> : <span>{(entry.note as WorkspaceNote).person?.name || (entry.notebook === "leads" ? "Leads" : "My notebook")}</span>}{note.tags?.slice(0, 2).map((tag) => <span key={tag}>#{tag}</span>)}<span>·</span><time dateTime={note.createdAt}>{noteTime(note.createdAt)}</time></div></div><div className="flex shrink-0 items-center gap-1"><button type="button" onClick={() => togglePin(entry)} aria-label={`${note.pinned ? "Unpin" : "Pin"} ${title}`} title={note.pinned ? "Unpin note" : "Pin note"} className={cn("flex size-9 items-center justify-center rounded-lg hover:bg-background-subtle", note.pinned ? "text-[#a4671c]" : "text-text-tertiary")}><Pin className="size-4" aria-hidden="true" weight={note.pinned ? "fill" : "regular"} /></button><ActionMenu label={`More actions for ${title}`} items={[{ label: "Open note", icon: <NotebookPen />, onSelect: () => setDetailKey(entryKey(entry)) }, { label: note.pinned ? "Unpin note" : "Pin note", icon: <Pin />, onSelect: () => togglePin(entry) }, { label: note.archivedAt ? "Restore note" : "Archive note", icon: note.archivedAt ? <RotateCcw /> : <Archive />, onSelect: () => toggleArchive(entry) }, { label: "Delete note", icon: <Trash2 />, onSelect: () => setDeleting(entry), destructive: true }]} /></div></li>; })}</ul></div>)}</div> : <div className="px-6 py-16 text-center"><NotebookPen className="mx-auto size-7 text-text-tertiary" aria-hidden="true" /><h3 className="mt-3 text-base font-semibold">{search || categoryFilter !== "all" ? "No matching notes" : activeView === "archive" ? "No archived notes" : "No notes here yet"}</h3><p className="mt-1 text-sm text-text-secondary">{search || categoryFilter !== "all" ? "Try another search or category." : activeView === "archive" ? "Archived notes will appear here." : selectedEvent ? "Add a note to this event’s team notebook." : "Capture a thought to get started."}</p>{activeView !== "archive" && <Button type="button" size="sm" variant="outline" className="mt-5" onClick={() => setComposerOpen(true)}>Add note</Button>}</div>}
      </section>
    </div>
    {composerOpen && <WorkspaceNoteModal events={events} initialDestination={activeView.startsWith("event:") ? activeView : activeView === "leads" ? "leads" : "mine"} onClose={() => setComposerOpen(false)} onSave={saveNote} />}
    {detail && <WorkspaceNoteDetail key={entryKey(detail)} note={detail.note} notebook={detail.notebook || null} person={detail.notebook ? (detail.note as WorkspaceNote).person : undefined} event={detail.event} events={events} onClose={() => setDetailKey(null)} onPin={() => togglePin(detail)} onArchive={() => toggleArchive(detail)} onDelete={() => { setDetailKey(null); setDeleting(detail); }} onCategory={(category) => changeCategory(detail, category)} onTags={(tags) => changeTags(detail, tags)} onAdditionalThoughts={(value) => changeAdditionalThoughts(detail, value)} onMove={(destination) => moveNote(detail, destination)} />}
    <DeleteConfirmation open={Boolean(deleting)} onOpenChange={(open) => { if (!open) setDeleting(null); }} title="Delete note?" description={`This permanently removes “${deleting ? titleOf(deleting.note) : "this note"}”${deleting?.event ? ` from ${deleting.event.name}` : ""}. This can’t be undone.`} onConfirm={remove} />
  </main>;
}
