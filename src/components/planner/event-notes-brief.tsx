"use client";

import { useState, type FormEvent } from "react";
import { FileText, Pencil } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { updatePlannerEvent, type PlannerEvent } from "@/lib/planner-events";

export function EventNotesBrief({ event }: { event: PlannerEvent }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(event.description);
  const [error, setError] = useState("");
  function begin() { setDraft(event.description); setError(""); setEditing(true); }
  function save(change: FormEvent) {
    change.preventDefault();
    try {
      let found = false;
      updatePlannerEvent(event.id, (current) => { found = true; return { ...current, description: draft.trim() }; });
      if (!found) throw new Error("This event no longer exists.");
      setError(""); setEditing(false);
    } catch (failure) { setError(failure instanceof Error ? failure.message : "Couldn’t save the brief. Please try again."); }
  }
  return <section aria-labelledby="event-notes-brief" className="rounded-2xl border border-border-subtle bg-white p-5 sm:p-6">
    <header className="flex items-center justify-between gap-3"><h3 id="event-notes-brief" className="flex items-center gap-2 text-sm font-semibold"><FileText className="size-4 text-text-tertiary" aria-hidden="true" />The event brief</h3>{!editing && <button type="button" onClick={begin} aria-label="Edit event brief" className="flex size-9 items-center justify-center rounded-lg text-text-secondary hover:bg-background-subtle focus-visible:outline-2 focus-visible:outline-brand-primary"><Pencil className="size-4" aria-hidden="true" /></button>}</header>
    {editing ? <form onSubmit={save} className="mt-4 space-y-3"><label className="block text-xs font-semibold text-text-secondary">Event brief<textarea autoFocus rows={6} maxLength={10000} value={draft} onChange={(change) => setDraft(change.target.value)} className="mt-2 block w-full resize-y rounded-xl border border-border-default p-3 text-sm font-normal leading-6 outline-none focus:border-brand-primary" /></label>{error && <p role="alert" className="text-xs text-error">{error}</p>}<div className="flex flex-wrap justify-end gap-2"><Button type="button" variant="ghost" size="sm" onClick={() => setEditing(false)}>Cancel</Button><Button type="submit" size="sm">Save brief</Button></div></form> : event.description.trim() ? <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-7 text-text-secondary">{event.description}</p> : <><p className="mt-4 text-sm leading-7 text-text-secondary">Give your team a little context: who it’s for, the vision, and what matters most.</p><button type="button" onClick={begin} className="mt-3 min-h-10 text-sm font-semibold text-brand-primary hover:underline">Add an event brief ↗</button></>}
  </section>;
}
