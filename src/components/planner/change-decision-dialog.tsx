"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { ArrowDown, Check, Mail, Monitor, Phone, UploadCloud, UsersRound, WhatsApp, X } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MoodboardImage } from "./moodboard-image";
import { updatePlannerEvent, type EventItem, type PlannerEvent } from "@/lib/planner-events";
import { changeEventDecision, decisionAttachment, decisionCategories, decisionChannels, localDecisionDate } from "@/lib/event-decisions";
import { usePlannerTeam } from "@/lib/planner-team";
import { prepareEventImage } from "@/lib/event-images";
import { deleteMoodboardImage, storeMoodboardImage } from "@/lib/moodboard-images";
import { budgetItemsForEvent } from "@/lib/planner-budget";
import { assertEventStorageSpace, dataImageBytes } from "@/lib/event-storage";
import { cn } from "@/lib/utils/cn";

const icons = { "in-app": Monitor, whatsapp: WhatsApp, call: Phone, "in-person": UsersRound, email: Mail };
const categoryDots = ["bg-[#789282]", "bg-[#ca985d]", "bg-[#8199bc]", "bg-[#be8599]", "bg-[#b4a172]", "bg-[#9992ab]"];
const pill = "inline-flex min-h-9 items-center justify-center gap-2 rounded-full border px-3 text-xs transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary disabled:opacity-40";

export function ChangeDecisionDialog({ event, decision, onClose, onSaved }: { event: PlannerEvent; decision: EventItem; onClose: () => void; onSaved: (id: string) => void }) {
  const record = decision.decisionRecord;
  const [category, setCategory] = useState(decision.decisionCategory || "Design");
  const [title, setTitle] = useState(decision.title);
  const [who, setWho] = useState<"client" | "someone-else" | "on-behalf">(record?.decidedBy || (decision.designApproval?.mode === "on-behalf" ? "on-behalf" : "client"));
  const [name, setName] = useState(record?.decidedBy === "someone-else" ? record.name : "");
  const [method, setMethod] = useState<keyof typeof decisionChannels>(record?.method || decision.designApproval?.method || (who === "on-behalf" ? "whatsapp" : "in-app"));
  const [decidedOn, setDecidedOn] = useState(localDecisionDate());
  const [note, setNote] = useState("");
  const [image, setImage] = useState(decisionAttachment(event, decision));
  const [file, setFile] = useState<File | null>(null);
  const preview = useMemo(() => file ? URL.createObjectURL(file) : "", [file]);
  const [busy, setBusy] = useState(false), [error, setError] = useState("");
  const submitting = useRef(false), revision = useRef(decision.designApproval?.revision);
  const noteField = useRef<HTMLTextAreaElement>(null);
  const team = usePlannerTeam(), author = team.find((member) => member.isOwner)?.name || "Planner";
  useEffect(() => { if (preview) return () => URL.revokeObjectURL(preview); }, [preview]);
  const attachment = file ? preview : image;
  function chooseWho(value: typeof who) { setWho(value); if (value === "on-behalf" && method === "in-app") setMethod("whatsapp"); }
  function focusNote() {
    noteField.current?.focus({ preventScroll: true });
    noteField.current?.scrollIntoView({ block: "nearest", behavior: typeof window !== "undefined" && !window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "smooth" : "instant" });
  }

  async function save(form: FormEvent) {
    form.preventDefault();
    if (submitting.current) return;
    submitting.current = true; setBusy(true); setError("");
    let uploaded: string | undefined;
    try {
      if (file) {
        const data = await prepareEventImage(file, 500_000);
        await assertEventStorageSpace(event, budgetItemsForEvent(event.id), dataImageBytes(data));
        uploaded = await storeMoodboardImage(`decision-attachment:${crypto.randomUUID()}`, data);
      }
      const id = crypto.randomUUID(); let found = false;
      updatePlannerEvent(event.id, (current) => { found = true; return changeEventDecision(current, decision.id, { id, title, category, image: uploaded || image, decidedBy: who, name, method, decidedOn, note, expectedRevision: revision.current }, author, new Date().toISOString()); });
      if (!found) throw new Error("This event no longer exists.");
      // This is a new record. Never remove images or evidence belonging to previous decisions.
      onSaved(id);
    } catch (reason) {
      if (uploaded) void deleteMoodboardImage(uploaded).catch(() => {});
      setError(reason instanceof Error ? reason.message : "The new decision couldn’t be saved. Please try again.");
    } finally { submitting.current = false; setBusy(false); }
  }

  return <Dialog.Root open onOpenChange={(open) => { if (!open && !busy) onClose(); }}><Dialog.Portal>
    <Dialog.Overlay className="fixed inset-0 z-[100] bg-[#10231a]/50 backdrop-blur-[2px]" />
    <Dialog.Content onEscapeKeyDown={(e) => { if (busy) e.preventDefault(); }} onInteractOutside={(e) => { if (busy) e.preventDefault(); }} className="fixed left-1/2 top-1/2 z-[100] flex max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-border-subtle bg-white shadow-[var(--shadow-lg)] focus:outline-none">
      <header className="flex shrink-0 items-start justify-between gap-4 border-b border-border-subtle px-5 py-5 sm:px-6"><div><p className="mb-1.5 text-[0.625rem] font-semibold uppercase tracking-[.12em] text-brand-primary">A new version, a clear history</p><Dialog.Title className="text-xl font-semibold tracking-tight">Change this decision</Dialog.Title><Dialog.Description className="mt-2 max-w-sm text-xs leading-5 text-text-secondary">Save a new decision linked to the original. The previous record stays in your history.</Dialog.Description></div><Dialog.Close asChild><button type="button" disabled={busy} aria-label="Close change decision" className="flex size-8 shrink-0 items-center justify-center rounded-full text-text-tertiary hover:bg-background-subtle"><X className="size-4" /></button></Dialog.Close></header>
      <form onSubmit={(e) => void save(e)} className="flex min-h-0 flex-1 flex-col">
        <div role="region" className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6" aria-label="Decision form fields"><fieldset disabled={busy} className="min-w-0 space-y-6 pb-2">
          <fieldset><legend className="mb-2.5 text-xs font-semibold">Category</legend><div className="flex flex-wrap gap-2">{decisionCategories.map((value, index) => <button key={value} type="button" aria-pressed={category === value} onClick={() => setCategory(value)} className={cn(pill, category === value ? "border-brand-primary bg-[#edf4ef] font-semibold text-brand-primary" : "border-border-subtle bg-white text-text-secondary")}><span className={cn("size-1.5 rounded-full", categoryDots[index])} />{value}{category === value && <Check className="size-3" />}</button>)}</div></fieldset>
          <Input label="What was decided" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={240} required placeholder="Describe the new decision" />
          <section><div className="mb-2.5 flex items-center justify-between"><h3 className="text-xs font-semibold">Attachment <span className="font-normal text-text-tertiary">· Optional</span></h3>{attachment && <label className="cursor-pointer text-xs font-medium text-brand-primary hover:underline">Replace image<input type="file" className="sr-only" disabled={busy} accept="image/jpeg,image/png,image/webp" onChange={(e) => { setFile(e.target.files?.[0] || null); e.target.value = ""; }} /></label>}</div>{attachment ? <div className="relative"><div className="relative aspect-[2/1] overflow-hidden rounded-xl border border-border-subtle bg-background-subtle"><MoodboardImage source={attachment} alt="New decision attachment" contain sizes="520px" /></div><button type="button" aria-label="Remove decision attachment" onClick={() => { setFile(null); setImage(undefined); }} className="absolute right-2 top-2 flex size-8 items-center justify-center rounded-full border border-border-subtle bg-white shadow-sm"><X className="size-4" /></button></div> : <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-border-strong bg-white p-5"><UploadCloud className="size-6 text-text-tertiary" /><span className="text-xs"><span className="block font-medium">Add an image</span><span className="mt-1 block text-[0.625rem] text-text-tertiary">JPG, PNG or WebP · up to 12 MB</span></span><input type="file" className="sr-only" disabled={busy} accept="image/jpeg,image/png,image/webp" onChange={(e) => { setFile(e.target.files?.[0] || null); e.target.value = ""; }} /></label>}</section>
          <fieldset><legend className="mb-2.5 w-full text-xs font-semibold"><span className="flex items-center justify-between gap-3"><span>Decided by</span><button type="button" onClick={focusNote} className="inline-flex min-h-8 items-center gap-1.5 rounded-md px-1 text-xs font-medium text-brand-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary">{note.trim() ? "Go to note" : "Add a note"}<ArrowDown className="size-3" aria-hidden="true" /></button></span></legend><div className="flex flex-wrap gap-2">{([{ value: "client", label: `${event.clientName || "Client"} (client)` }, { value: "someone-else", label: "Someone else" }, { value: "on-behalf", label: "Me, on the client’s behalf" }] as const).map(({ value, label }) => <button key={value} type="button" aria-pressed={who === value} onClick={() => chooseWho(value)} className={cn(pill, who === value ? "border-brand-primary bg-[#edf4ef] font-semibold text-brand-primary" : "border-border-subtle text-text-secondary")}>{label}</button>)}</div>{who === "someone-else" && <div className="mt-3"><Input label="Decision maker’s name" value={name} onChange={(e) => setName(e.target.value)} maxLength={100} required placeholder="Who made this decision?" /></div>}</fieldset>
          <fieldset><legend className="mb-2.5 text-xs font-semibold">How</legend><div className="flex flex-wrap gap-2">{(Object.keys(decisionChannels) as (keyof typeof decisionChannels)[]).map((value) => { const Icon = icons[value]; return <button key={value} type="button" disabled={busy || who === "on-behalf" && value === "in-app"} aria-pressed={method === value} onClick={() => setMethod(value)} className={cn(pill, method === value ? "border-brand-primary bg-[#edf4ef] font-semibold text-brand-primary" : "border-border-subtle text-text-secondary")}><Icon className="size-3.5" />{decisionChannels[value]}</button>; })}</div>{who === "client" && method === "in-app" && <p className="mt-2 text-[0.6875rem] leading-5 text-text-tertiary">This creates a fresh request for the client to confirm. It won’t be marked approved on their behalf.</p>}</fieldset>
          <div className="max-w-64"><Input label="Decided on" type="date" value={decidedOn} onChange={(e) => setDecidedOn(e.target.value)} max={localDecisionDate()} required helperText="Recorded today; this date shows when the decision was made." /></div>
          <div><Textarea ref={noteField} label="Note" optional rows={3} className="scroll-m-4" maxLength={280} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Why did the decision change?" /><p className="mt-1 text-right text-[0.625rem] text-text-tertiary">{note.length}/280</p></div>
          {error && <p role="alert" className="rounded-xl bg-error-soft px-3 py-2 text-xs leading-5 text-error">{error}</p>}
        </fieldset></div>
        <footer className="flex shrink-0 items-center justify-end gap-2 border-t border-border-subtle bg-white px-5 py-4 sm:px-6"><Button type="button" variant="ghost" disabled={busy} onClick={onClose}>Cancel</Button><Button type="submit" loading={busy} disabled={!title.trim() || who === "someone-else" && !name.trim()}>Save the new decision</Button></footer>
      </form>
    </Dialog.Content>
  </Dialog.Portal></Dialog.Root>;
}
