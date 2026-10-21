"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import * as Dialog from "@radix-ui/react-dialog";
import { ArrowLeft, ArrowRight, Check, Clock3, Mail, Phone, UploadCloud, UsersRound, WhatsApp, X } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { MoodboardImage } from "./moodboard-image";
import type { EventItem } from "@/lib/planner-events";
import { approvalMethods, type MoodboardApprovalInput, type MoodboardApprovalMode } from "@/lib/planner-moodboards";
import { prepareEventImage } from "@/lib/event-images";
import { deleteMoodboardImage, storeMoodboardImage } from "@/lib/moodboard-images";
import { cn } from "@/lib/utils/cn";
import { EventDecisionDetails } from "./event-decision-details";
import type { PlannerEvent } from "@/lib/planner-events";

type Props = { photo: EventItem; event: PlannerEvent; clientName?: string; error?: string; readOnly?: boolean; onClose: () => void; onApprove: (mode: MoodboardApprovalMode, input: MoodboardApprovalInput) => boolean };
const methodIcons = { whatsapp: WhatsApp, call: Phone, "in-person": UsersRound, email: Mail };

export function MoodboardApprovalDialog({ photo, event, clientName, error, readOnly, onClose, onApprove }: Props) {
  const approval = photo.designApproval;
  const [view, setView] = useState<"choose" | "on-behalf">("choose");
  const [method, setMethod] = useState(approval?.method);
  const [file, setFile] = useState<File | null>(null);
  const [keepEvidence, setKeepEvidence] = useState(true);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState("");
  const [notice, setNotice] = useState("");
  const revision = useRef(approval?.revision), submitting = useRef(false);
  const client = clientName?.trim() || "The client";

  async function record(mode: MoodboardApprovalMode) {
    if (submitting.current || readOnly) return;
    if (mode === "on-behalf" && !method) { setProblem("Choose how the client told you."); return; }
    submitting.current = true; setBusy(true); setProblem("");
    let uploaded: string | undefined;
    try {
      if (mode === "on-behalf" && file) uploaded = await storeMoodboardImage(`approval-evidence:${crypto.randomUUID()}`, await prepareEventImage(file, 500_000));
      const evidence = mode === "on-behalf" ? uploaded || (keepEvidence ? approval?.evidence : undefined) : undefined;
      if (!onApprove(mode, { method, evidence, evidenceName: uploaded ? file?.name : keepEvidence ? approval?.evidenceName : undefined, expectedRevision: revision.current })) throw new Error("This decision couldn’t be saved. Please try again.");
      setFile(null);
      setNotice(mode === "client" ? "Added to Decisions and the client preview, awaiting confirmation." : "Decision recorded on the client’s behalf.");
    } catch (reason) {
      if (uploaded) void deleteMoodboardImage(uploaded).catch(() => {});
      setProblem(reason instanceof Error ? reason.message : "This decision couldn’t be saved.");
    } finally { submitting.current = false; setBusy(false); }
  }

  if (event && approval && event.sections.decisions.some((item) => item.id === approval.decisionId)) return <EventDecisionDetails event={event} decisionId={approval.decisionId} onClose={onClose} initialNotice={notice} />;
  return <Dialog.Root open onOpenChange={(open) => { if (!open && !busy) onClose(); }}><Dialog.Portal>
    <Dialog.Overlay className="fixed inset-0 z-[90] bg-[#10231a]/50 backdrop-blur-[2px]" />
    <Dialog.Content onEscapeKeyDown={(event) => { if (busy) event.preventDefault(); }} onInteractOutside={(event) => { if (busy) event.preventDefault(); }} className="fixed left-1/2 top-1/2 z-[90] max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-border-subtle bg-white shadow-[var(--shadow-lg)] focus:outline-none">
      <header className="flex items-start justify-between gap-3 px-5 py-4"><div><Dialog.Title className="text-lg font-semibold tracking-tight">{view === "on-behalf" ? "Record the client’s approval" : "Approve this picture"}</Dialog.Title><Dialog.Description className="mt-1 text-xs leading-5 text-text-secondary">{view === "on-behalf" ? "Keep a clear record of how the client agreed." : `Who is confirming this design for ${client}?`}</Dialog.Description></div><Dialog.Close asChild><button type="button" disabled={busy} aria-label="Close picture approval" className="flex size-8 shrink-0 items-center justify-center rounded-full text-text-secondary hover:bg-background-subtle disabled:opacity-40"><X className="size-4" aria-hidden="true" /></button></Dialog.Close></header>
      <div className="bg-background-subtle"><MoodboardImage source={photo.image} alt={photo.title} natural sizes="512px" /></div>
      <div className="space-y-4 p-5">
        {notice && <div role="status" className="relative rounded-xl bg-text-primary px-3 py-2.5 text-xs leading-5 text-white"><span className="absolute -top-1 left-5 size-2 rotate-45 bg-text-primary" />{notice}</div>}
        {view === "on-behalf" ? <form onSubmit={(event) => { event.preventDefault(); void record("on-behalf"); }} className="space-y-4"><fieldset disabled={busy || readOnly}><legend className="mb-2 text-xs font-semibold">How did the client tell you?</legend><div className="flex flex-wrap gap-2">{(Object.keys(approvalMethods) as (keyof typeof approvalMethods)[]).map((value) => { const Icon = methodIcons[value]; return <button key={value} type="button" aria-pressed={method === value} onClick={() => setMethod(value)} className={cn("flex min-h-10 items-center gap-2 rounded-full border px-3 text-xs", method === value ? "border-brand-primary bg-[#edf4ef] font-semibold text-brand-primary" : "border-border-subtle bg-white text-text-secondary")}><Icon className="size-4" aria-hidden="true" />{approvalMethods[value]}{method === value && <Check className="size-3" />}</button>; })}</div></fieldset><div><label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-border-strong bg-white p-4 text-xs"><UploadCloud className="size-5 shrink-0 text-text-tertiary" /><span><span className="block font-medium">{file?.name || "Add a screenshot"} <span className="font-normal text-text-tertiary">· Optional</span></span><span className="mt-1 block text-[0.625rem] text-text-tertiary">JPG, PNG or WebP · up to 12 MB</span></span><input type="file" disabled={busy} accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(event) => { setFile(event.target.files?.[0] || null); event.target.value = ""; }} /></label>{(file || keepEvidence && approval?.evidence) && <div className="mt-2 flex items-center justify-between gap-2 text-xs text-text-secondary"><span className="truncate">{file?.name || approval?.evidenceName || "Saved screenshot"}</span><button type="button" disabled={busy} onClick={() => { setFile(null); setKeepEvidence(false); }} className="font-medium text-error hover:underline">Remove</button></div>}</div><div className="flex justify-between gap-2"><Button type="button" variant="ghost" disabled={busy} leadingIcon={<ArrowLeft className="size-3.5" />} onClick={() => setView("choose")}>Back</Button><Button type="submit" disabled={busy || !method || readOnly}>{busy ? "Saving…" : "Record decision"}</Button></div></form> : <div className="space-y-2">{([{ mode: "client", title: `${client} will confirm this`, description: "Add to their client preview and await confirmation.", Icon: Clock3 }, { mode: "on-behalf", title: "I’m approving on the client’s behalf", description: "Record how they agreed, with optional evidence.", Icon: Check }] as const).map(({ mode, title, description, Icon }) => <button key={mode} type="button" disabled={busy || readOnly} onClick={() => { if (mode === "client") void record(mode); else { setProblem(""); setView("on-behalf"); } }} className="group flex w-full items-start gap-3 rounded-xl border border-border-subtle p-3.5 text-left hover:bg-background-subtle disabled:opacity-50"><span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-background-subtle text-brand-primary"><Icon className="size-4" /></span><span className="flex-1"><span className="block text-xs font-semibold">{title}</span><span className="mt-1 block text-[0.6875rem] leading-5 text-text-secondary">{description}</span></span><ArrowRight className="mt-1 size-3.5 shrink-0 text-text-tertiary" /></button>)}</div>}
        {(problem || error) && <p role="alert" className="rounded-lg bg-error-soft px-3 py-2 text-xs leading-5 text-error">{error || problem}</p>}
        <p className="text-[0.625rem] leading-5 text-text-tertiary">Local preview only · client requests and reminders appear in this browser. Email and push delivery aren’t connected. <Link href="/client" className="font-medium text-brand-primary underline">Open client preview</Link></p>
      </div>
    </Dialog.Content>
  </Dialog.Portal></Dialog.Root>;
}
