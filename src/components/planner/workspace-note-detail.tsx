"use client";

import { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { ActionMenu } from "@/components/ui/action-menu";
import { Archive, ChevronRight, Copy, Handshake, Link2, LockSimple, NotebookPen, Phone, Pin, RotateCcw, Trash2, X } from "@/components/ui/icons";
import { notePlainText, noteTime } from "@/lib/event-notes";
import type { EventNote, PlannerEvent } from "@/lib/planner-events";
import type { WorkspaceNote } from "@/lib/planner-workspace-notes";
import { NoteDestinationPicker } from "./note-destination-picker";
import { NOTE_CATEGORIES, NoteSelect } from "./workspace-note-modal";

type Props = {
  note: EventNote;
  notebook: "mine" | "leads" | null;
  person?: WorkspaceNote["person"];
  event?: PlannerEvent;
  events: readonly PlannerEvent[];
  onClose: () => void;
  onPin: () => void;
  onArchive: () => void;
  onDelete: () => void;
  onCategory: (category: string) => void;
  onTags: (tags: string[]) => void;
  onAdditionalThoughts: (thoughts: string) => void;
  onMove: (destination: string) => void;
};

export function WorkspaceNoteDetail({
  note, notebook, person, event, events, onClose, onPin, onArchive,
  onDelete, onCategory, onTags, onAdditionalThoughts, onMove,
}: Props) {
  const [tags, setTags] = useState((note.tags || []).join(", "));
  const [thoughts, setThoughts] = useState(note.additionalThoughts || "");
  const [thoughtsOpen, setThoughtsOpen] = useState(Boolean(note.additionalThoughts));
  const [copied, setCopied] = useState(false);
  const destination = event ? `event:${event.id}` : person ? `${person.type}:${person.id}` : notebook || "mine";
  const privacy = event ? "Only your team" : "Only you";
  const location = event?.name || person?.name || (notebook === "leads" ? "Leads" : "My notebook");
  const body = notePlainText(note.body);
  const kind = note.kind === "voice" ? "Recorded" : note.kind === "imported" ? "Imported" : "Typed";
  const date = new Date(note.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
  const thoughtsSaved = thoughts === (note.additionalThoughts || "");

  useEffect(() => {
    if (thoughtsSaved) return;
    const timer = window.setTimeout(() => onAdditionalThoughts(thoughts), 650);
    return () => window.clearTimeout(timer);
  }, [thoughts, thoughtsSaved, onAdditionalThoughts]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(body);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  function saveTags() {
    onTags([...new Set(tags.split(",").map((tag) => tag.trim()).filter(Boolean))].slice(0, 12));
  }

  return (
    <Dialog.Root open onOpenChange={(open) => { if (!open) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[70] bg-[#12251c]/55 backdrop-blur-[2px]" />
        <Dialog.Content
          data-note-dialog
          aria-describedby="note-detail-meta"
          className="fixed left-1/2 top-1/2 z-[71] flex h-[min(92dvh,980px)] w-[calc(100vw-1.5rem)] max-w-[1200px] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-border-subtle bg-white shadow-[var(--shadow-lg)] focus:outline-none"
        >
          <header className="flex shrink-0 items-start justify-between gap-3 border-b border-border-subtle px-5 py-4 sm:px-7 sm:py-5">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-sm font-semibold text-brand-primary">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#e8f0ec]">
                  <NotebookPen className="size-4" aria-hidden="true" />
                </span>
                <span className="truncate">{location}</span>
              </div>
              <Dialog.Title className="mt-3 line-clamp-2 break-words text-xl font-semibold tracking-tight text-text-primary sm:text-2xl">
                {note.title || "Untitled note"}
              </Dialog.Title>
              <Dialog.Description id="note-detail-meta" className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-text-secondary sm:text-sm">
                <LockSimple className="size-3.5" aria-hidden="true" />
                {privacy}<span>·</span>{note.author}<span>·</span>{kind}
                <span>·</span>{date} at {noteTime(note.createdAt)}
              </Dialog.Description>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <button type="button" onClick={onPin} title={note.pinned ? "Unpin note" : "Pin note"} aria-label={note.pinned ? "Unpin note" : "Pin note"} className="flex size-8 items-center justify-center rounded-lg text-text-secondary hover:bg-background-subtle">
                <Pin className="size-4" weight={note.pinned ? "fill" : "regular"} />
              </button>
              <Dialog.Close asChild>
                <button type="button" aria-label="Close note" className="flex size-8 items-center justify-center rounded-lg text-text-secondary hover:bg-background-subtle">
                  <X className="size-4" />
                </button>
              </Dialog.Close>
            </div>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto md:grid md:grid-cols-[minmax(0,1fr)_290px] md:overflow-hidden">
            <section className="min-w-0 px-5 py-5 sm:px-7 md:flex md:min-h-0 md:flex-col md:overflow-hidden" aria-label="Note text">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h3 className="text-base font-semibold text-text-primary">{note.kind === "voice" ? "Transcript" : "Original note"}</h3>
                <button type="button" onClick={() => void copy()} aria-label="Copy note text" title="Copy note text" className="flex size-8 items-center justify-center rounded-lg text-text-secondary hover:bg-background-subtle hover:text-brand-primary">
                  <Copy className="size-4" />
                </button>
              </div>
              {copied && <p role="status" className="mb-2 text-xs text-brand-primary">Copied note text.</p>}
              <div className="min-h-64 whitespace-pre-wrap break-words rounded-xl border border-border-subtle bg-[#fcfdfc] px-5 py-4 text-sm leading-7 text-text-primary sm:text-base sm:leading-8 md:min-h-0 md:flex-1 md:overflow-y-auto">
                {body}
              </div>
              <div className="mt-5 border-t border-border-subtle pt-2">
                <button type="button" onClick={() => setThoughtsOpen((open) => !open)} aria-expanded={thoughtsOpen} className="flex min-h-11 w-full items-center gap-2 text-left text-sm font-semibold text-text-primary hover:text-brand-primary">
                  <ChevronRight className={`size-4 shrink-0 transition-transform ${thoughtsOpen ? "rotate-90" : ""}`} aria-hidden="true" />
                  <span className="flex-1">Additional thoughts</span><span className="text-xs font-normal text-text-tertiary">Optional</span>
                </button>
                {thoughtsOpen && <textarea value={thoughts} onChange={(event) => setThoughts(event.target.value)} onBlur={() => { if (!thoughtsSaved) onAdditionalThoughts(thoughts); }} placeholder="Add context or a follow-up thought…" aria-label="Additional thoughts" className="mt-2 min-h-28 w-full resize-y rounded-xl border border-border-default bg-white px-4 py-3 text-sm leading-6 text-text-primary outline-none focus:border-brand-primary" />}
                {thoughtsOpen && <p role="status" className="mt-1 text-xs text-text-tertiary">{thoughtsSaved ? "Saved" : "Saving…"}</p>}
              </div>
            </section>

            <aside className="space-y-5 border-t border-border-subtle bg-[#fafbf9] px-5 py-5 md:min-h-0 md:overflow-y-auto md:border-l md:border-t-0" aria-label="Note details">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-text-secondary">Notebook or person</label>
                <NoteDestinationPicker value={destination} onChange={onMove} events={events} compact />
              </div>
              <label className="block text-xs font-semibold text-text-secondary">
                Category
                <NoteSelect className="mt-1.5" value={note.category || "General"} onChange={onCategory} label="Note category">
                  {note.category && !NOTE_CATEGORIES.some((item) => item === note.category) && <option value={note.category}>{note.category}</option>}
                  {NOTE_CATEGORIES.map((item) => <option key={item}>{item}</option>)}
                </NoteSelect>
              </label>
              <label className="block text-xs font-semibold text-text-secondary">
                Tags
                <input
                  value={tags}
                  onChange={(event) => setTags(event.target.value)}
                  onBlur={saveTags}
                  onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); event.currentTarget.blur(); } }}
                  placeholder="Add tags…"
                  className="mt-1.5 h-11 w-full rounded-xl border border-border-default bg-white px-3 text-sm font-normal text-text-primary outline-none focus:border-brand-primary"
                />
              </label>
              <div className="border-t border-border-subtle pt-4">
                <p className="text-sm font-semibold text-brand-primary">Ask Nimi</p>
                <button type="button" disabled title="Nimi is not connected to notes yet" className="mt-3 flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-border-default bg-background-subtle px-3 text-sm text-text-secondary opacity-60"><Phone className="size-4" aria-hidden="true" />{note.kind === "voice" || note.category === "Call" ? "From a call" : `${kind} note`}</button>
              </div>
            </aside>
          </div>

          <footer className="flex shrink-0 flex-wrap items-center gap-2 border-t border-border-subtle bg-[#fafbf9] px-5 py-3 sm:px-7">
            <div className="w-full min-w-0 sm:w-64"><NoteDestinationPicker value={destination} onChange={onMove} events={events} compact initialTab="events" triggerContent={<span className="inline-flex items-center gap-1.5"><Link2 className="size-4" aria-hidden="true" />Move to event notebook…</span>} /></div>
            <div className="w-full min-w-0 sm:w-48"><NoteDestinationPicker value={destination} onChange={onMove} events={events} compact initialTab="prospects" triggerContent={<span className="inline-flex items-center gap-1.5"><Handshake className="size-4" aria-hidden="true" />Save as prospect</span>} /></div>
            <button type="button" disabled title="Nimi is not connected to notes yet" className="flex min-h-11 items-center gap-2 rounded-xl bg-brand-primary px-4 text-sm font-semibold text-white opacity-50">Send to Nimi</button>
            <span className="ml-auto hidden items-center gap-1.5 text-xs text-text-secondary lg:flex"><LockSimple className="size-3.5" aria-hidden="true" />{note.archivedAt ? "Archived" : privacy}</span>
            <ActionMenu
              label={`More actions for ${note.title || "note"}`}
              triggerClassName="border border-border-default bg-white"
              items={[
                { label: note.pinned ? "Unpin note" : "Pin note", icon: <Pin />, onSelect: onPin },
                { label: note.archivedAt ? "Restore note" : "Archive note", icon: note.archivedAt ? <RotateCcw /> : <Archive />, onSelect: onArchive },
                { label: "Delete note", icon: <Trash2 />, onSelect: onDelete, destructive: true },
              ]}
            />
          </footer>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
