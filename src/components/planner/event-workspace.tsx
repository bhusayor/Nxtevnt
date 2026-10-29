"use client";

import { ConfirmDeleteButton, DeleteConfirmation, matchesDeleteConfirmation } from "@/components/ui/delete-confirmation";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import {
  Ban, BookOpenText, CalendarClock, CalendarDays, Check,
  ChevronRight, CircleDollarSign, ClipboardCheck,
  FileText, Folder, ImageIcon, Link2, Plus, Scale,
  RotateCcw, Trash2, Wallet, SlidersHorizontal,
} from "@/components/ui/icons";

import { Button, buttonVariants } from "@/components/ui/button";
import { EventOverviewPanel } from "@/components/planner/event-overview-panel";
import { EventMoodboard } from "@/components/planner/event-moodboard";
import { AgendaWorkspace } from "@/components/planner/agenda/agenda-workspace";
import { EventDecisionsList } from "@/components/planner/event-decision-details";
import { EventBudgetProposals } from "@/components/planner/budget/event-budget-proposals";
import { EventControlRoom } from "@/components/planner/event-workspace-extras";
import { budgetWorkspaceTab, workspaceSection, type WorkspaceSection } from "@/lib/event-workspace-navigation";
import { EventNotesQuestionnaires } from "@/components/planner/event-notes-questionnaires";
import { EventCancellationDialog } from "@/components/planner/event-cancellation-dialog";
import { TaskWorkspace } from "@/components/planner/task-workspace";
import { EventFilesWorkspace } from "./event-files-workspace";
import { deleteBudgetAttachments } from "@/lib/budget-attachments";
import { deleteMoodboardImage } from "@/lib/moodboard-images";
import { deleteBudgetForEvent, formatBudgetMoney, useBudgetStore } from "@/lib/planner-budget";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  deletePlannerEvent, formatEventDate, isEventCancelled, reopenPlannerEvent, updatePlannerEvent, useBrowserReady, usePlannerEvents,
  type EventItem, type EventSections, type PlannerEvent,
} from "@/lib/planner-events";
import { cn } from "@/lib/utils/cn";
import { currentEventDecisions } from "@/lib/event-decisions";

type SectionId = WorkspaceSection;
type CollectionId = keyof EventSections;

const sections = [
  { id: "overview", label: "Event overview", icon: BookOpenText, description: "The big picture, all in one place." },
  { id: "notes", label: "Notes and Decision", icon: FileText, description: "Keep notes, questionnaires and decisions together." },
  { id: "proposal", label: "Budget", icon: CircleDollarSign, description: "Manage the live budget and compare three proposal options." },
  { id: "tasks", label: "Tasks", icon: ClipboardCheck, description: "Turn the plan into clear next steps." },
  { id: "moodboard", label: "Mood board", icon: ImageIcon, description: "Gather inspiration in one place." },
  { id: "agenda", label: "Agenda & timelines", icon: CalendarClock, description: "Map out the flow of the day." },
  { id: "control-room", label: "Control room", icon: SlidersHorizontal, description: "A focused check on the plan." },
  { id: "files", label: "Files", icon: Folder, description: "Keep event uploads and documents organised." },
] as const satisfies readonly { id: SectionId; label: string; icon: typeof BookOpenText; description: string }[];

const sectionCopy: Record<CollectionId, { heading: string; empty: string; action: string; placeholder: string; tone: string }> = {
  tasks: { heading: "Plan the next steps", empty: "No tasks yet. Add the first thing that needs doing.", action: "Add task", placeholder: "e.g. Confirm venue booking", tone: "bg-[#eef5f0] text-[#487156]" },
  expenses: { heading: "Budget items", empty: "No expenses yet. Add costs as you plan.", action: "Add expense", placeholder: "e.g. Catering deposit", tone: "bg-[#faf2e9] text-[#90683b]" },
  proposal: { heading: "Proposal items", empty: "Your proposal is a blank canvas. Add the first line when you are ready.", action: "Save line", placeholder: "e.g. Venue styling", tone: "bg-[#edf3f9] text-[#527996]" },
  moodboard: { heading: "Inspiration links", empty: "No inspiration saved yet. Collect links to images, styles or ideas.", action: "Save inspiration", placeholder: "e.g. Garden table setting", tone: "bg-[#f5f0f8] text-[#785f91]" },
  agenda: { heading: "Run of show", empty: "No agenda items yet. Start with the first moment of the day.", action: "Add agenda item", placeholder: "e.g. Guests arrive", tone: "bg-[#edf3f9] text-[#527996]" },
  decisions: { heading: "Event decisions", empty: "No decisions recorded yet. Add something that needs a call.", action: "Add decision", placeholder: "e.g. Choose the final menu", tone: "bg-[#faf2e9] text-[#90683b]" },
  files: { heading: "Linked files", empty: "No files linked yet. Add a shareable document URL to keep it handy.", action: "Add file link", placeholder: "e.g. Venue contract", tone: "bg-[#eef5f0] text-[#487156]" },
};

function updateSection(id: string, section: CollectionId, items: EventItem[]) {
  updatePlannerEvent(id, (event) => ({ ...event, sections: { ...event.sections, [section]: items } }));
}

function CollectionPanel({ event, section }: { event: PlannerEvent; section: CollectionId }) {
  const copy = sectionCopy[section];
  const items = section === "decisions" ? currentEventDecisions(event) : event.sections[section] ?? [];
  const [title, setTitle] = useState("");
  const [detail, setDetail] = useState("");
  const [amount, setAmount] = useState("");
  const [time, setTime] = useState("");
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [addingProposal, setAddingProposal] = useState(false);
  const usesAmount = section === "expenses" || section === "proposal";
  const usesUrl = section === "files" || section === "moodboard";
  const usesTime = section === "agenda";
  const supportsDone = section === "tasks" || section === "decisions";
  const total = usesAmount ? items.reduce((sum, item) => sum + (item.amount || 0), 0) : 0;
  const displayItems = section === "agenda" ? [...items].sort((first, second) => (first.time || "").localeCompare(second.time || "")) : items;

  function add(eventForm: FormEvent<HTMLFormElement>) {
    eventForm.preventDefault();
    if (!title.trim()) { setError("Give this item a name."); return; }
    if (usesUrl) {
      try { const parsed = new URL(url); if (!["http:", "https:"].includes(parsed.protocol)) throw new Error("Invalid protocol"); }
      catch { setError("Add a valid https:// link."); return; }
    }
    if (usesAmount && (!amount || Number(amount) <= 0)) { setError("Enter an amount greater than zero."); return; }
    if (usesTime && !time) { setError("Choose a time for this agenda item."); return; }
    const item: EventItem = { id: crypto.randomUUID(), title: title.trim(), detail: detail.trim() || undefined, amount: usesAmount ? Number(amount) : undefined, time: usesTime ? time : undefined, url: usesUrl ? url.trim() : undefined, done: false };
    try { if (section === "decisions") updatePlannerEvent(event.id, (current) => ({ ...current, sections: { ...current.sections, decisions: [...current.sections.decisions, item] } })); else updateSection(event.id, section, [...items, item]); setTitle(""); setDetail(""); setAmount(""); setTime(""); setUrl(""); setError(""); if (section === "proposal") setAddingProposal(false); }
    catch { setError("This item couldn’t be saved in this browser. Please try again."); }
  }

  function changeItems(next: EventItem[]) {
    try { updateSection(event.id, section, next); setError(""); return true; }
    catch { setError("Your change couldn’t be saved in this browser. Please try again."); return false; }
  }

  const form = <form onSubmit={add} className={cn("h-fit p-5 sm:p-6", section !== "proposal" && "rounded-xl border border-[#e0e9e2] bg-[#f3f7f3]")}>
    {section !== "proposal" && <><span className="flex size-9 items-center justify-center rounded-lg bg-white text-brand-primary"><Plus className="size-[18px]" aria-hidden="true" /></span><h3 className="mt-4 text-base font-semibold">{copy.action}</h3><p className="mt-1 text-xs leading-5 text-text-secondary">Keep this event moving, one detail at a time.</p></>}
    <div className={cn("space-y-4", section !== "proposal" && "mt-5")}>
      <Input label="Name" placeholder={copy.placeholder} value={title} onChange={(event) => setTitle(event.target.value)} required />
      {usesTime && <Input label="Time" type="time" value={time} onChange={(event) => setTime(event.target.value)} required />}
      {usesAmount && <Input label={`Amount (${event.currency || "NGN"})`} type="number" min="1" placeholder="0" value={amount} onChange={(event) => setAmount(event.target.value)} required />}
      {usesUrl && <Input label="Link" type="url" placeholder="https://…" value={url} onChange={(event) => setUrl(event.target.value)} required />}
      {(section === "decisions" || section === "agenda" || section === "proposal") && <Textarea label="Details" optional rows={2} placeholder="Add a little context…" value={detail} onChange={(event) => setDetail(event.target.value)} />}
    </div>
    {error && <p role="alert" className="mt-4 text-xs text-error">{error}</p>}
    <div className={cn("mt-5 flex", section === "proposal" ? "justify-end gap-2" : "w-full")}>
      {section === "proposal" && <Button type="button" variant="ghost" onClick={() => setAddingProposal(false)}>Cancel</Button>}
      <Button type="submit" className={section !== "proposal" ? "w-full" : undefined} leadingIcon={<Plus className="size-4" aria-hidden="true" />}>{copy.action}</Button>
    </div>
  </form>;

  return <div className={cn("grid gap-5", section !== "proposal" && "xl:grid-cols-[minmax(0,1fr)_320px]")}>
    <section className="min-w-0 overflow-hidden rounded-xl border border-border-subtle bg-white">
      <div className="flex items-center justify-between gap-3 border-b border-border-subtle px-5 py-4 sm:px-6"><div><h3 className="text-base font-semibold">{copy.heading}</h3><p className="mt-1 text-xs text-text-tertiary">{items.length} {items.length === 1 ? "item" : "items"}{usesAmount && items.length > 0 ? ` · ${formatBudgetMoney(total, event.currency || "NGN")}` : ""}</p></div>{section === "proposal" ? <Button type="button" size="sm" leadingIcon={<Plus className="size-3.5" aria-hidden="true" />} onClick={() => setAddingProposal(true)}>Add line</Button> : <span className={cn("flex size-9 items-center justify-center rounded-lg", copy.tone)}>{section === "tasks" ? <ClipboardCheck className="size-[18px]" aria-hidden="true" /> : section === "agenda" ? <CalendarClock className="size-[18px]" aria-hidden="true" /> : section === "files" ? <Link2 className="size-[18px]" aria-hidden="true" /> : <BookOpenText className="size-[18px]" aria-hidden="true" />}</span>}</div>
      {items.length === 0 ? <div className="flex min-h-56 flex-col items-center justify-center px-6 py-12 text-center"><span className={cn("flex size-11 items-center justify-center rounded-xl", copy.tone)}><Plus className="size-5" aria-hidden="true" /></span><h4 className="mt-4 text-sm font-semibold">A clean slate</h4><p className="mt-1 max-w-xs text-xs leading-5 text-text-secondary">{copy.empty}</p></div> : section === "decisions" ? <EventDecisionsList event={event} /> : <ul className="divide-y divide-border-subtle">{displayItems.map((item) => <li key={item.id} className="flex items-start gap-3 px-5 py-4 sm:px-6">{supportsDone ? <button type="button" onClick={() => changeItems(items.map((entry) => entry.id === item.id ? { ...entry, done: !entry.done } : entry))} aria-label={`${item.done ? "Mark incomplete" : "Mark complete"}: ${item.title}`} className={cn("mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border", item.done ? "border-brand-primary bg-brand-primary text-white" : "border-border-strong text-transparent hover:border-brand-primary")}><Check className="size-3" aria-hidden="true" /></button> : <span className={cn("mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md", copy.tone)}><ChevronRight className="size-3.5" aria-hidden="true" /></span>}<div className="min-w-0 flex-1"><p className={cn("text-sm font-medium text-text-primary", item.done && "text-text-tertiary line-through")}>{item.url ? <a href={item.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 hover:text-brand-primary hover:underline">{item.title}<Link2 className="size-3" aria-hidden="true" /></a> : item.title}</p>{item.detail && <p className="mt-1 text-xs leading-5 text-text-secondary">{item.detail}</p>}{item.dueDate && <p className="mt-1 text-xs font-medium text-text-tertiary">Due {formatEventDate(item.dueDate, { day: "numeric", month: "short", year: "numeric" })}</p>}{item.time && <p className="mt-1 text-xs font-medium text-text-tertiary">{item.time}</p>}</div>{item.amount !== undefined && <span className="shrink-0 text-xs font-semibold text-text-primary">{formatBudgetMoney(item.amount, event.currency || "NGN")}</span>}<ConfirmDeleteButton confirmationTitle="Delete item?" description={`“${item.title}” will be permanently removed from this event. This can’t be undone.`} onConfirm={() => changeItems(items.filter((entry) => entry.id !== item.id))} aria-label={`Delete ${item.title}`} className="flex size-9 shrink-0 items-center justify-center rounded-lg text-text-tertiary hover:bg-error-soft hover:text-error"><Trash2 className="size-4" aria-hidden="true" /></ConfirmDeleteButton></li>)}</ul>}
    </section>
    {section === "proposal" ? <Dialog.Root open={addingProposal} onOpenChange={setAddingProposal}><Dialog.Portal><Dialog.Overlay className="fixed inset-0 z-50 bg-[#10231a]/50 backdrop-blur-[2px]" /><Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90dvh] w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl bg-white shadow-[var(--shadow-lg)] focus:outline-none"><div className="border-b border-border-subtle px-5 py-4"><Dialog.Title className="text-base font-semibold">New proposal line</Dialog.Title><Dialog.Description className="mt-1 text-xs text-text-secondary">Add a cost to this working estimate.</Dialog.Description></div>{form}</Dialog.Content></Dialog.Portal></Dialog.Root> : form}
  </div>;
}

export function EventWorkspace({ id, initialSection, initialTab, initialAction, initialTaskId }: { id: string; initialSection?: string; initialTab?: string; initialAction?: string; initialTaskId?: string }) {
  const router = useRouter();
  const events = usePlannerEvents();
  const budgetStore = useBudgetStore();
  const ready = useBrowserReady();
  const event = events.find((item) => item.id === id);
  const [active, setActive] = useState<SectionId>(workspaceSection(initialSection));
  const [notesTab, setNotesTab] = useState(initialSection === "decisions" ? "decisions" : initialTab);
  const [quickAction, setQuickAction] = useState(initialAction);
  const [selectedTaskId, setSelectedTaskId] = useState(initialTaskId);
  const [addingMoodboardPhoto, setAddingMoodboardPhoto] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  async function confirmDelete(confirmation: string) {
    if (!event || !matchesDeleteConfirmation(confirmation, event.name)) return false;
    setDeleteBusy(true);
    setDeleteError("");
    try {
      const attachments = budgetStore.items.filter((item) => item.eventId === id).flatMap((item) => [...item.attachments.map((attachment) => attachment.id), ...(item.payments ?? []).flatMap((payment) => payment.receipt ? [payment.receipt.id] : [])]);
      await deleteBudgetAttachments(attachments);
      deleteBudgetForEvent(id);
      deletePlannerEvent(id);
      await deleteBudgetAttachments((event.fileEntries ?? []).map(file => file.storageId)).catch(() => undefined);
      // Only remove image payloads after the event metadata was successfully deleted.
      await Promise.all([...event.sections.moodboard, ...event.sections.decisions].flatMap((item) => [deleteMoodboardImage(item.image).catch(() => {}), deleteMoodboardImage(item.designApproval?.evidence).catch(() => {})]));
      router.replace("/planner/events");
      return true;
    } catch {
      setDeleteError("This event couldn’t be deleted in this browser. Please try again.");
      return false;
    } finally { setDeleteBusy(false); }
  }

  if (!ready) return <div className="h-96 animate-pulse rounded-xl bg-white" aria-label="Loading event" />;
  if (!event) return <div className="mx-auto max-w-lg rounded-xl border border-border-subtle bg-white p-8 text-center"><CalendarDays className="mx-auto size-9 text-brand-primary" aria-hidden="true" /><h1 className="mt-4 text-xl font-semibold">Event not found</h1><p className="mt-2 text-sm text-text-secondary">This event may be saved in another browser or may have been removed.</p><Link href="/planner/events" className={cn(buttonVariants({ size: "md" }), "mt-5")}>Back to events</Link></div>;

  const cancelled = isEventCancelled(event);
  return <div className="w-full min-w-0 space-y-4">
    <header className="flex min-w-0 items-center gap-3 py-1">
      <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-[#e5e9df] bg-white/80 text-brand-primary"><CalendarDays className="size-5" /></span>
      <h1 className="min-w-0 break-words text-xl font-semibold leading-tight tracking-[-0.035em] text-text-primary sm:text-2xl">{event.name}</h1>
    </header>
    <nav aria-label="Event sections" className="min-w-0 overflow-hidden rounded-xl border border-border-subtle bg-white px-2 sm:px-3"><div className="flex gap-1 overflow-x-auto" role="tablist" aria-label="Event sections">{sections.map((item) => <button key={item.id} id={`event-tab-${item.id}`} type="button" role="tab" aria-selected={active === item.id} aria-controls="event-panel" onClick={() => { setSelectedTaskId(undefined); setAddingMoodboardPhoto(false); setActive(item.id); }} className={cn("flex min-h-12 shrink-0 items-center gap-2 whitespace-nowrap border-b-2 px-3 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-brand-primary", active === item.id ? "border-brand-primary font-semibold text-brand-primary" : "border-transparent text-text-secondary hover:border-border-subtle hover:text-text-primary")}><item.icon className="size-4 shrink-0" aria-hidden="true" />{item.label}</button>)}</div></nav>
    {cancelled && <div className="flex items-start gap-3 rounded-xl border border-[#f0dcdc] bg-[#fcf5f5] p-4 text-sm text-[#824949]"><Ban className="mt-0.5 size-4 shrink-0" aria-hidden="true" /><div><p className="font-semibold">This event is cancelled</p><p className="mt-1 text-xs leading-5">It won’t appear in upcoming plans. All planning details remain here{event.cancellationReason ? ` · ${event.cancellationReason}` : "."}</p></div></div>}
    <div id="event-panel" role="tabpanel" aria-labelledby={`event-tab-${active}`} className="min-w-0">
        {active === "overview" && <EventOverviewPanel event={event} onOpenTasks={(taskId) => { setSelectedTaskId(taskId); setActive("tasks"); }} onOpenMoodboard={(addPhoto) => { setAddingMoodboardPhoto(Boolean(addPhoto)); setActive("moodboard"); }} onOpenDecisions={() => { setNotesTab("decisions"); setActive("notes"); }} />}
        {active === "notes" && <EventNotesQuestionnaires key={event.id} event={event} initialTab={notesTab} decisions={<CollectionPanel event={event} section="decisions" />} initialAction={quickAction} onActionConsumed={() => setQuickAction(undefined)} />}
        {active === "proposal" && <EventBudgetProposals key={event.id} event={event} initialTab={budgetWorkspaceTab(initialSection, initialTab)} />}
        {active === "tasks" && <TaskWorkspace event={event} initialTaskId={selectedTaskId} initialAction={quickAction} onActionConsumed={() => setQuickAction(undefined)} />}
        {active === "moodboard" && <EventMoodboard event={event} startAdding={addingMoodboardPhoto} />}
        {active === "agenda" && <AgendaWorkspace key={event.id} event={event} />}
        {active === "control-room" && <EventControlRoom event={event} onOpenTasks={() => setActive("tasks")} onOpenAgenda={() => setActive("agenda")} onOpenDecisions={() => { setNotesTab("decisions"); setActive("notes"); }} />}
        {active === "files" && <EventFilesWorkspace key={event.id} event={event} />}
    </div>
    {active === "overview" && <section aria-label="Event controls" className="flex flex-col gap-4 border-t border-border-subtle pt-5 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-semibold text-text-secondary">Event controls</p><p className="mt-1 text-xs text-text-tertiary">Manage this event’s status or remove it.</p></div><div className="flex flex-wrap gap-2">{cancelled ? <button type="button" onClick={() => reopenPlannerEvent(event.id)} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-[#cfe1d3] bg-white px-3.5 text-xs font-semibold text-brand-primary hover:bg-[#eaf3ed]"><RotateCcw className="size-4" aria-hidden="true" />Reopen event</button> : <button type="button" onClick={() => setCancelling(true)} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-[#edcaca] bg-white px-3.5 text-xs font-semibold text-[#a34c4c] hover:bg-[#fcf2f2]"><Ban className="size-4" aria-hidden="true" />Cancel event</button>}<button type="button" onClick={() => { setDeleteError(""); setDeleting(true); }} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-[#edcaca] bg-white px-3.5 text-xs font-semibold text-[#a34c4c] hover:bg-[#fcf2f2]"><Trash2 className="size-4" aria-hidden="true" />Delete event</button></div></section>}
    <EventCancellationDialog event={cancelling ? event : null} onClose={() => setCancelling(false)} />
    <DeleteConfirmation open={deleting} onOpenChange={setDeleting} title="Delete event?" description={`This permanently removes “${event.name}”, its notes, tasks, questionnaires, budget and attached documents from this browser. This can’t be undone.`} confirmationName={event.name} error={deleteError} busy={deleteBusy} onConfirm={confirmDelete} confirmLabel="Delete event" />
  </div>;
}
