"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import * as Dialog from "@radix-ui/react-dialog";
import { ArrowRight, Check, Clock3, History, Pencil, X } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { MoodboardImage } from "./moodboard-image";
import { ChangeDecisionDialog } from "./change-decision-dialog";
import { updatePlannerEvent, type EventItem, type PlannerEvent } from "@/lib/planner-events";
import { currentEventDecisions, decisionAttachment, decisionChannels, decisionIsSuperseded, respondToEventDecision } from "@/lib/event-decisions";
import { usePlannerTeam } from "@/lib/planner-team";
import { cn } from "@/lib/utils/cn";

const date = (value?: string) => value ? new Date(value.length === 10 ? `${value}T12:00:00` : value).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" }) : "Not recorded";

export function EventDecisionDetails({ event, decisionId, onClose, startChanging = false, initialNotice = "", inspirationActions }: { event: PlannerEvent; decisionId: string; onClose: () => void; startChanging?: boolean; initialNotice?: string; inspirationActions?: ReactNode }) {
  const [selectedId, setSelectedId] = useState(decisionId), [changing, setChanging] = useState(startChanging);
  const [notice, setNotice] = useState(initialNotice), [error, setError] = useState("");
  useEffect(() => { if (initialNotice) setNotice(initialNotice); }, [initialNotice]);
  const team = usePlannerTeam(), author = team.find((member) => member.isOwner)?.name || "Planner";
  const decision = event.sections.decisions.find((item) => item.id === selectedId);
  if (!decision) return null;
  const attachment = decisionAttachment(event, decision);
  const approval = decision.designApproval, record = decision.decisionRecord;
  const pending = approval?.state === "awaiting-confirmation";
  const superseded = decisionIsSuperseded(event, decision.id);
  const status = superseded ? "Earlier decision" : pending ? "Pending client" : approval?.state === "approved-by-client" ? "Client approved" : record?.decidedBy === "on-behalf" || approval?.mode === "on-behalf" ? "On client’s behalf" : "Recorded";
  const decidedBy = approval?.state === "approved-by-client" ? approval.confirmedBy || event.clientName : record ? `${record.name}${record.decidedBy === "on-behalf" ? " on the client’s behalf" : record.decidedBy === "client" ? " (client)" : ""}` : approval?.mode === "on-behalf" ? `${approval.by} on the client’s behalf` : approval?.by || "Not recorded";
  const channel = record?.method || approval?.method || (approval?.mode === "client" ? "in-app" : undefined);
  const family = new Set([decision.id]);
  // Find the complete linked chain without changing any original record.
  let grew = true;
  while (grew) { grew = false; for (const item of event.sections.decisions) if (item.supersedesDecisionId && (family.has(item.id) || family.has(item.supersedesDecisionId))) for (const id of [item.id, item.supersedesDecisionId]) if (!family.has(id)) { family.add(id); grew = true; } }
  const history = event.sections.decisions.filter((item) => family.has(item.id)).reverse();
  const latest = history.find((item) => !decisionIsSuperseded(event, item.id));
  function remind() {
    try { let found = false; updatePlannerEvent(event.id, (current) => { found = true; return respondToEventDecision(current, decision!.id, approval?.revision, "remind", author, new Date().toISOString()); }); if (!found) throw new Error("This event no longer exists."); setError(""); setNotice("Reminder added to the client preview. No email or push notification was sent."); }
    catch (problem) { setError(problem instanceof Error ? problem.message : "The reminder couldn’t be saved."); }
  }

  if (changing && !superseded) return <ChangeDecisionDialog key={decision.id} event={event} decision={decision} onClose={() => setChanging(false)} onSaved={(id) => { setSelectedId(id); setChanging(false); setNotice("New decision saved. The original is preserved in your history."); }} />;
  return <Dialog.Root open onOpenChange={(open) => { if (!open) onClose(); }}><Dialog.Portal>
    <Dialog.Overlay className="fixed inset-0 z-[90] bg-[#10231a]/50 backdrop-blur-[2px]" />
    <Dialog.Content className="fixed left-1/2 top-1/2 z-[90] max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-border-subtle bg-white shadow-[var(--shadow-lg)] focus:outline-none">
      <header className="flex items-start justify-between gap-4 border-b border-border-subtle p-5 sm:px-6"><div><div className="mb-2 flex flex-wrap gap-2"><span className="rounded-full bg-[#f6f1e8] px-2 py-1 text-[0.625rem] font-medium text-[#8b7656]">{decision.decisionCategory || "Decision"}</span><span className={cn("rounded-full px-2 py-1 text-[0.625rem]", pending || superseded ? "bg-background-subtle text-text-secondary" : "bg-success-soft text-success")}>{status}</span></div><Dialog.Title className="text-lg font-semibold tracking-tight">{decision.title}</Dialog.Title><Dialog.Description className="mt-1 text-xs text-text-secondary">{event.name} · Decision details</Dialog.Description></div><Dialog.Close asChild><button aria-label="Close decision details" className="flex size-8 shrink-0 items-center justify-center rounded-full text-text-tertiary hover:bg-background-subtle"><X className="size-4" /></button></Dialog.Close></header>
      {attachment && <MoodboardImage source={attachment} alt={decision.title} natural sizes="576px" />}
      <div className="space-y-5 p-5 sm:p-6">
        {notice && <div role="status" className="rounded-xl bg-text-primary px-3 py-2.5 text-xs leading-5 text-white">{notice}</div>}
        <div className="flex flex-wrap items-start justify-between gap-4"><dl className="grid min-w-0 flex-1 grid-cols-2 gap-4 text-xs"><div><dt className="text-[0.625rem] text-text-tertiary">{pending ? "Requested by" : "Decided by"}</dt><dd className="mt-1 font-medium">{pending ? approval?.by : decidedBy}</dd></div><div><dt className="text-[0.625rem] text-text-tertiary">How</dt><dd className="mt-1 font-medium">{channel ? decisionChannels[channel] : "Not recorded"}</dd></div><div><dt className="text-[0.625rem] text-text-tertiary">{pending ? "Requested on" : "Decided on"}</dt><dd className="mt-1 font-medium">{date(approval?.confirmedAt || record?.decidedOn || approval?.at)}</dd></div>{record && <div><dt className="text-[0.625rem] text-text-tertiary">Recorded by</dt><dd className="mt-1 font-medium">{record.recordedBy}<span className="mt-1 block text-[0.625rem] font-normal text-text-tertiary">{date(record.recordedAt)}</span></dd></div>}</dl>{!superseded && <Button size="sm" variant="outline" leadingIcon={<Pencil className="size-3.5" />} disabled={Boolean(event.cancelledAt)} onClick={() => { setNotice(""); setChanging(true); }}>Change decision</Button>}</div>
        {(record?.note || decision.detail) && <section className="rounded-xl border border-border-subtle p-3"><h3 className="text-[0.625rem] font-semibold uppercase tracking-wide text-text-tertiary">{record ? "Note" : "Details"}</h3><p className="mt-2 whitespace-pre-wrap text-xs leading-5 text-text-secondary">{record?.note || decision.detail}</p></section>}
        {approval?.evidence && <section><h3 className="mb-2 text-xs font-semibold">Approval evidence</h3><div className="overflow-hidden rounded-xl border border-border-subtle"><MoodboardImage source={approval.evidence} alt={approval.evidenceName || "Client approval evidence"} natural sizes="520px" /></div></section>}
        {!superseded && approval && <section className="border-t border-border-subtle pt-4"><h3 className="text-[0.625rem] font-semibold uppercase tracking-wide text-text-tertiary">Client confirmation</h3><div className="mt-2 flex items-center justify-between gap-3 rounded-xl border border-border-subtle p-3"><div className="text-xs leading-5"><p className="font-medium">{pending ? `Awaiting ${event.clientName || "the client"}` : approval.state === "approved-by-client" ? `Approved by ${approval.confirmedBy || event.clientName}` : approval.mode === "on-behalf" ? "Recorded on the client’s behalf" : "Decision recorded"}</p><p className="mt-1 text-[0.625rem] text-text-tertiary">{pending ? `Requested ${date(approval.requestedAt || approval.at)}` : approval.state === "approved-by-client" ? date(approval.confirmedAt) : "This is a planner-recorded decision, not an in-app client confirmation."}{pending && approval.remindedAt && <span className="block">Last reminder {date(approval.remindedAt)}</span>}</p></div>{pending ? <Button size="sm" variant="outline" disabled={Boolean(event.cancelledAt)} onClick={remind}>Remind</Button> : <Check className="size-5 shrink-0 text-success" />}</div>{pending && <p className="mt-2 text-[0.625rem] leading-5 text-text-tertiary">Local preview only. Email and push delivery aren’t connected. <Link href="/client" className="text-brand-primary underline">Open client preview</Link></p>}</section>}
        {history.length > 1 && <section className="border-t border-border-subtle pt-4"><h3 className="flex items-center gap-2 text-xs font-semibold"><History className="size-4 text-text-tertiary" />Decision history <span className="text-text-tertiary">{history.length}</span></h3><ol className="mt-3 space-y-2">{history.map((item) => <li key={item.id}><button type="button" aria-current={item.id === decision.id ? "true" : undefined} onClick={() => { setSelectedId(item.id); setNotice(""); setError(""); }} className={cn("flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left", item.id === decision.id ? "border-brand-primary/30 bg-[#f8faf8]" : "border-border-subtle hover:bg-background-subtle")}><Clock3 className="size-4 shrink-0 text-text-tertiary" /><span className="min-w-0 flex-1"><span className="block truncate text-xs font-medium">{item.title}</span><span className="mt-1 block text-[0.625rem] text-text-tertiary">{date(item.decisionRecord?.recordedAt || item.designApproval?.at)} · {item.id === latest?.id ? "Latest decision" : "Earlier decision"}</span></span><ArrowRight className="size-3 shrink-0 text-text-tertiary" /></button></li>)}</ol></section>}
        {inspirationActions}
        {error && <p role="alert" className="rounded-xl bg-error-soft px-3 py-2 text-xs text-error">{error}</p>}
      </div>
    </Dialog.Content>
  </Dialog.Portal></Dialog.Root>;
}

export function DecisionRow({ event, decision, onOpen }: { event: PlannerEvent; decision: EventItem; onOpen?: (mode: "details" | "change") => void }) {
  const [open, setOpen] = useState<"details" | "change" | null>(null);
  const attachment = decisionAttachment(event, decision);
  const old = decisionIsSuperseded(event, decision.id), pending = decision.designApproval?.state === "awaiting-confirmation";
  return <li className="flex flex-wrap items-center gap-3 px-5 py-4 sm:px-6"><button type="button" onClick={() => onOpen ? onOpen("details") : setOpen("details")} className="flex min-w-0 flex-1 items-center gap-3 text-left">{attachment && <span className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-background-subtle"><MoodboardImage source={attachment} alt={decision.title} sizes="56px" /></span>}<span className="min-w-0"><span className="block text-sm font-medium">{decision.title}</span><span className="mt-1 block text-[0.625rem] text-text-tertiary">{decision.decisionCategory || "Decision"} · {old ? "Earlier decision · View history" : pending ? "Awaiting client confirmation" : decision.designApproval?.state === "approved-by-client" ? "Approved by client" : decision.designApproval?.mode === "on-behalf" ? "Approved on client’s behalf" : decision.done ? "Recorded" : "Open decision"}</span></span></button>{!old && <Button size="sm" variant="outline" leadingIcon={<Pencil className="size-3.5" />} disabled={Boolean(event.cancelledAt)} onClick={() => onOpen ? onOpen("change") : setOpen("change")}>Change decision</Button>}{open && <EventDecisionDetails key={decision.id + open} event={event} decisionId={decision.id} startChanging={open === "change"} onClose={() => setOpen(null)} />}</li>;
}

export function EventDecisionsList({ event }: { event: PlannerEvent }) {
  const [selected, setSelected] = useState<{ id: string; mode: "details" | "change" } | null>(null);
  return <><ul className="divide-y divide-border-subtle">{currentEventDecisions(event).slice().reverse().map((decision) => <DecisionRow key={decision.id} event={event} decision={decision} onOpen={(mode) => setSelected({ id: decision.id, mode })} />)}</ul>{selected && <EventDecisionDetails key={selected.id + selected.mode} event={event} decisionId={selected.id} startChanging={selected.mode === "change"} onClose={() => setSelected(null)} />}</>;
}
