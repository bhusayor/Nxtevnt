"use client";

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { ChevronDown, LockSimple, Microphone, Upload, X } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import type { EventNote, PlannerEvent } from "@/lib/planner-events";
import { cn } from "@/lib/utils/cn";
import { NoteDestinationPicker } from "./note-destination-picker";
import { noteCategoryTone } from "./note-category-tone";

export const NOTE_CATEGORIES = ["General", "Call", "Ideas", "Follow-up", "Meeting", "Decision", "Lead"] as const;

type VoiceResult = { isFinal: boolean; 0: { transcript: string } };
type VoiceRecognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: { resultIndex: number; results: ArrayLike<VoiceResult> }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};
type VoiceWindow = Window & { SpeechRecognition?: new () => VoiceRecognition; webkitSpeechRecognition?: new () => VoiceRecognition };

export type WorkspaceNoteDraft = {
  destination: string;
  title: string;
  body: string;
  category: string;
  tags: string[];
  kind: EventNote["kind"];
};

export function NoteSelect({ value, onChange, children, label, className }: {
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
  label: string;
  className?: string;
}) {
  return <span className={cn("relative block min-w-0", className)}>
    <select aria-label={label} value={value} onChange={(event) => onChange(event.target.value)} className={cn("h-11 w-full appearance-none rounded-xl border border-border-default bg-white pl-3 pr-10 text-sm text-text-primary outline-none transition-colors hover:border-border-strong focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10", noteCategoryTone(value)?.control)}>
      {children}
    </select>
    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-text-secondary" aria-hidden="true" />
  </span>;
}

export function WorkspaceNoteModal({ events, initialDestination, onClose, onSave }: {
  events: readonly PlannerEvent[];
  initialDestination: string;
  onClose: () => void;
  onSave: (draft: WorkspaceNoteDraft) => boolean;
}) {
  const [title, setTitle] = useState("");
  const [destination, setDestination] = useState(initialDestination);
  const [category, setCategory] = useState<string>("General");
  const [body, setBody] = useState("");
  const [tags, setTags] = useState("");
  const [kind, setKind] = useState<EventNote["kind"]>("typed");
  const [listening, setListening] = useState(false);
  const [error, setError] = useState("");
  const recognition = useRef<VoiceRecognition | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  useEffect(() => () => { recognition.current?.abort(); recognition.current = null; }, []);

  function toggleRecord() {
    if (recognition.current) {
      recognition.current.stop();
      return;
    }
    const Recognition = (window as VoiceWindow).SpeechRecognition ?? (window as VoiceWindow).webkitSpeechRecognition;
    if (!Recognition) { setError("Voice transcription is not available in this browser. You can still type your note."); return; }
    const active = new Recognition();
    const committed = new Set<number>();
    active.lang = "en-NG";
    active.continuous = true;
    active.interimResults = false;
    active.onresult = (event) => {
      for (let index = event.resultIndex; index < event.results.length; index++) {
        const result = event.results[index];
        if (!result?.isFinal || committed.has(index)) continue;
        const transcript = result[0]?.transcript.trim();
        if (!transcript) continue;
        committed.add(index);
        setBody((current) => `${current}${current.trim() ? "\n" : ""}${transcript}`);
        setKind("voice");
      }
    };
    active.onerror = (event) => {
      setError(event.error === "not-allowed" ? "Allow microphone access to record a voice note." : "Recording stopped. Try again or type your note.");
      recognition.current = null;
      setListening(false);
    };
    active.onend = () => { if (recognition.current === active) recognition.current = null; setListening(false); };
    recognition.current = active;
    try { active.start(); setListening(true); setError(""); }
    catch { recognition.current = null; setError("Recording could not start."); }
  }

  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!/\.(txt|md|csv)$/i.test(file.name)) {
      setError("Text, Markdown and CSV files can be added to a note. For other files, use the event Files tab.");
      return;
    }
    if (file.size > 500_000) { setError("Choose a text file smaller than 500 KB."); return; }
    try {
      const content = await file.text();
      setBody((current) => `${current}${current.trim() ? "\n\n" : ""}${content}`);
      setTitle((current) => current || file.name.replace(/\.[^.]+$/, ""));
      setKind("imported");
      setError("");
    } catch { setError("The file could not be read."); }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (listening) { setError("Stop recording before saving the note."); return; }
    if (!body.trim()) { setError("Write a note or add a transcript before saving."); return; }
    if (body.length > 20_000) { setError("Keep the note within 20,000 characters."); return; }
    const ok = onSave({
      destination,
      title: title.trim() || "Untitled note",
      body: body.trim(),
      category,
      tags: [...new Set(tags.split(",").map((tag) => tag.trim()).filter(Boolean))].slice(0, 12),
      kind,
    });
    if (!ok) setError("Your note could not be saved. Please try again.");
  }

  const eventNote = destination.startsWith("event:");
  return <Dialog.Root open onOpenChange={(open) => { if (!open) onClose(); }}>
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-[90] bg-[#12251c]/55 backdrop-blur-[2px]" />
      <Dialog.Content data-note-dialog aria-describedby="workspace-note-privacy" className="fixed left-1/2 top-1/2 z-[91] flex max-h-[min(92dvh,900px)] w-[calc(100vw-1.5rem)] max-w-[760px] -translate-x-1/2 -translate-y-1/2 flex-col rounded-2xl border border-border-subtle bg-white shadow-[var(--shadow-lg)] focus:outline-none">
        <div className="flex items-start justify-between gap-4 border-b border-border-subtle px-5 py-5 sm:px-7">
          <div><Dialog.Title className="text-2xl font-semibold text-text-primary">Add note</Dialog.Title><Dialog.Description id="workspace-note-privacy" className="mt-2 flex items-center gap-2 text-sm text-text-secondary"><LockSimple className="size-4" aria-hidden="true" />{eventNote ? "Saved to this event · only your team can see it" : "Saved to your notebook · only you can see it"}</Dialog.Description></div>
          <Dialog.Close asChild><button type="button" aria-label="Close add note" className="flex size-9 items-center justify-center rounded-lg text-text-secondary hover:bg-background-subtle"><X className="size-5" /></button></Dialog.Close>
        </div>
        <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-5 sm:px-7">
            <input autoFocus aria-label="Note title" maxLength={120} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Untitled note" className="w-full rounded-xl border border-transparent bg-transparent px-1 py-2 text-xl font-semibold text-text-primary outline-none placeholder:font-medium placeholder:text-text-tertiary focus:border-brand-primary" />
            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_190px]"><NoteDestinationPicker value={destination} onChange={setDestination} events={events} /><NoteSelect value={category} onChange={setCategory} label="Note category">{NOTE_CATEGORIES.map((item) => <option key={item}>{item}</option>)}</NoteSelect></div>
            <div className="flex items-center gap-4 border-y border-border-subtle py-4"><button type="button" onClick={toggleRecord} aria-pressed={listening} className={cn("flex size-20 shrink-0 flex-col items-center justify-center rounded-full bg-brand-primary bg-[image:var(--action-primary-gradient)] text-sm font-medium text-white shadow-md", listening && "bg-error bg-none")}><Microphone className="mb-1 size-5" aria-hidden="true" />{listening ? "Stop" : "Record"}</button><div className="min-w-0"><p className="text-sm font-semibold text-text-primary">Voice or a file</p><p className="mt-1 text-xs leading-5 text-text-secondary">Record to transcribe, or import a text, Markdown or CSV file.</p><input ref={fileInput} type="file" accept=".txt,.md,.csv,text/plain,text/markdown,text/csv" className="hidden" onChange={upload} /><button type="button" onClick={() => fileInput.current?.click()} className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-brand-primary hover:underline"><Upload className="size-4" aria-hidden="true" />Upload file</button></div></div>
            <label className="block text-sm font-semibold text-text-primary">Your note<textarea value={body} onChange={(event) => setBody(event.target.value)} placeholder="Write a note or paste a transcript…" className="mt-2 min-h-44 w-full resize-y rounded-xl border border-border-default bg-white px-4 py-3 text-sm font-normal leading-6 text-text-primary outline-none placeholder:text-text-tertiary focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10" /></label>
            <input aria-label="Tags, separated by commas" value={tags} onChange={(event) => setTags(event.target.value)} placeholder="Tags, separated by commas (optional)" className="h-11 w-full rounded-xl border border-border-default bg-white px-3 text-sm text-text-primary outline-none placeholder:text-text-tertiary focus:border-brand-primary" />
            {error && <p role="alert" className="rounded-lg bg-error-soft px-3 py-2 text-sm text-error">{error}</p>}
          </div>
          <div className="flex items-center justify-between gap-3 border-t border-border-subtle bg-[#fbfcfb] px-5 py-4 sm:px-7"><span className="flex items-center gap-2 text-xs text-text-secondary"><LockSimple className="size-4" aria-hidden="true" />{eventNote ? "Only your team" : "Only you"}</span><Button type="submit" disabled={!body.trim() || listening}>Save note</Button></div>
        </form>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}
