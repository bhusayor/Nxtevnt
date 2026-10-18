"use client";

import { useState, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import {
  ArrowLeft, ArrowRight, Ban, BookOpenText, CalendarClock, CalendarDays, Check,
  ChevronRight, CircleDollarSign, ClipboardCheck,
  Clock3, FileText, ImageIcon, Lightbulb, Link2, MapPin, Plus, Scale,
  RotateCcw, Trash2, UsersRound, Wallet,
} from "@/components/ui/icons";

import { Button, buttonVariants } from "@/components/ui/button";
import { EventDetailsEditor } from "@/components/planner/event-details-editor";
import { BudgetWorkspace } from "@/components/planner/budget/budget-workspace";
import { EventNotesQuestionnaires } from "@/components/planner/event-notes-questionnaires";
import { EventCancellationDialog } from "@/components/planner/event-cancellation-dialog";
import { TaskWorkspace } from "@/components/planner/task-workspace";
import { OverviewMetricCard } from "@/components/planner/overview-metric-card";
import { deleteBudgetAttachments } from "@/lib/budget-attachments";
import { deleteBudgetForEvent, useBudgetStore } from "@/lib/planner-budget";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";
import { Textarea } from "@/components/ui/textarea";
import {
  deletePlannerEvent, formatEventDate, formatNaira, isCustomCover, isEventCancelled, isTaskActive, isTaskComplete, reopenPlannerEvent, updatePlannerEvent, useBrowserReady, usePlannerEvents,
  type EventItem, type EventSections, type PlannerEvent,
} from "@/lib/planner-events";
import { cn } from "@/lib/utils/cn";

type SectionId = "overview" | "notes" | "budget" | "proposal" | "tasks" | "moodboard" | "agenda" | "decisions" | "files";
type CollectionId = keyof EventSections;

const sections = [
  { id: "overview", label: "Event overview", icon: BookOpenText, description: "The big picture, all in one place." },
  { id: "notes", label: "Notes", icon: FileText, description: "Share team updates and gather answers from your client." },
  { id: "budget", label: "Budget", icon: Wallet, description: "Track what this event will cost." },
  { id: "proposal", label: "Budget proposal", icon: CircleDollarSign, description: "Shape the estimate you’ll present." },
  { id: "tasks", label: "Tasks", icon: ClipboardCheck, description: "Turn the plan into clear next steps." },
  { id: "moodboard", label: "Moodboard", icon: ImageIcon, description: "Gather inspiration in one place." },
  { id: "agenda", label: "Agenda & timelines", icon: CalendarClock, description: "Map out the flow of the day." },
  { id: "decisions", label: "Decision", icon: Scale, description: "Record the calls that shape this event." },
  { id: "files", label: "Files", icon: Link2, description: "Keep important document links close." },
] as const satisfies readonly { id: SectionId; label: string; icon: typeof BookOpenText; description: string }[];

const sectionCopy: Record<CollectionId, { heading: string; empty: string; action: string; placeholder: string; tone: string }> = {
  tasks: { heading: "Plan the next steps", empty: "No tasks yet. Add the first thing that needs doing.", action: "Add task", placeholder: "e.g. Confirm venue booking", tone: "bg-[#eef5f0] text-[#487156]" },
  expenses: { heading: "Budget items", empty: "No expenses yet. Add costs as you plan.", action: "Add expense", placeholder: "e.g. Catering deposit", tone: "bg-[#faf2e9] text-[#90683b]" },
  proposal: { heading: "Proposal items", empty: "Your proposal is a blank canvas. Add an item to begin.", action: "Add proposal item", placeholder: "e.g. Venue styling", tone: "bg-[#edf3f9] text-[#527996]" },
  moodboard: { heading: "Inspiration links", empty: "No inspiration saved yet. Collect links to images, styles or ideas.", action: "Save inspiration", placeholder: "e.g. Garden table setting", tone: "bg-[#f5f0f8] text-[#785f91]" },
  agenda: { heading: "Run of show", empty: "No agenda items yet. Start with the first moment of the day.", action: "Add agenda item", placeholder: "e.g. Guests arrive", tone: "bg-[#edf3f9] text-[#527996]" },
  decisions: { heading: "Decisions to make", empty: "No decisions recorded yet. Add something that needs a call.", action: "Add decision", placeholder: "e.g. Choose the final menu", tone: "bg-[#faf2e9] text-[#90683b]" },
  files: { heading: "Linked files", empty: "No files linked yet. Add a shareable document URL to keep it handy.", action: "Add file link", placeholder: "e.g. Venue contract", tone: "bg-[#eef5f0] text-[#487156]" },
};

function updateSection(id: string, section: CollectionId, items: EventItem[]) {
  updatePlannerEvent(id, (event) => ({ ...event, sections: { ...event.sections, [section]: items } }));
}

function OverviewPanel({ event, onSelect }: { event: PlannerEvent; onSelect: (section: SectionId) => void }) {
  const activeTasks = event.sections.tasks.filter(isTaskActive);
  const completed = activeTasks.filter(isTaskComplete).length;
  const spent = event.sections.expenses.reduce((total, item) => total + (item.amount || 0), 0);
  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3"><OverviewMetricCard icon={ClipboardCheck} label="Tasks complete" value={`${completed} of ${activeTasks.length}`} detail="Across this event" tone="sage" progress={activeTasks.length ? { value: Math.round(completed / activeTasks.length * 100), label: "Event task completion" } : undefined} className="event-overview-metric" compact /><OverviewMetricCard icon={Wallet} label="Estimated budget" value={event.budget ? formatNaira(Number(event.budget)) : "Not set yet"} detail="Working event estimate" tone="amber" animateCurrency className="event-overview-metric" compact /><OverviewMetricCard icon={UsersRound} label="Expected guests" value={event.guestCount ? Number(event.guestCount).toLocaleString("en-NG") : "Not set yet"} detail="Current guest estimate" tone="lilac" className="event-overview-metric" compact /></div>
      {(event.assignedTeamMember || event.priority || event.budgetTemplateId || event.milestoneTemplateId || event.targetBudget) && <div className="flex flex-wrap gap-2 text-xs">{event.assignedTeamMember && <span className="rounded-full border border-border-subtle bg-white px-3 py-1.5">Team lead: {event.assignedTeamMember}</span>}{event.priority && <span className="rounded-full border border-border-subtle bg-white px-3 py-1.5">{event.priority[0].toUpperCase() + event.priority.slice(1)} priority</span>}{event.targetBudget && <span className="rounded-full border border-border-subtle bg-white px-3 py-1.5">Client target: {formatNaira(Number(event.targetBudget))}</span>}</div>}
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_280px]">
        <section className="rounded-xl border border-border-subtle bg-white p-5 sm:p-6"><div className="flex items-center gap-2"><span className="flex size-8 items-center justify-center rounded-lg bg-[#eaf3ed] text-brand-primary"><BookOpenText className="size-4" aria-hidden="true" /></span><h3 className="text-base font-semibold">About this event</h3></div><p className="mt-4 text-sm leading-7 text-text-secondary">{event.description || "A new moment is taking shape. Add notes, build the budget and map the next steps as the details come together."}</p><div className="mt-6 grid gap-4 border-t border-border-subtle pt-5 sm:grid-cols-2"><div><p className="text-[0.6875rem] font-semibold uppercase tracking-wide text-text-tertiary">Where</p><p className="mt-1.5 flex items-start gap-2 text-sm font-medium"><MapPin className="mt-0.5 size-4 shrink-0 text-brand-primary" aria-hidden="true" />{event.location || "Venue to be confirmed"}</p></div><div><p className="text-[0.6875rem] font-semibold uppercase tracking-wide text-text-tertiary">When</p><p className="mt-1.5 flex items-start gap-2 text-sm font-medium"><Clock3 className="mt-0.5 size-4 shrink-0 text-brand-primary" aria-hidden="true" />{event.startTime ? `${event.startTime}${event.endTime ? ` – ${event.endTime}` : ""}` : "Time to be confirmed"}</p></div><div><p className="text-[0.6875rem] font-semibold uppercase tracking-wide text-text-tertiary">Client / host</p><p className="mt-1.5 text-sm font-medium">{event.clientName || "Not added yet"}</p></div><div><p className="text-[0.6875rem] font-semibold uppercase tracking-wide text-text-tertiary">Recorded expenses</p><p className="mt-1.5 text-sm font-medium">{formatNaira(spent)}</p></div></div></section>
        <section className="rounded-xl border border-[#dfeae1] bg-[#eff6f0] p-5 sm:p-6"><span className="flex size-9 items-center justify-center rounded-lg bg-white text-brand-primary"><Lightbulb className="size-5" aria-hidden="true" /></span><h3 className="mt-4 text-base font-semibold">Where to begin?</h3><p className="mt-2 text-xs leading-5 text-text-secondary">Build your plan one detail at a time. These spaces stay with this event.</p><div className="mt-5 space-y-2">{[{ id: "notes", label: "Capture your ideas" }, { id: "tasks", label: "Add your first task" }, { id: "budget", label: "Shape the budget" }].map((item) => <button type="button" key={item.id} onClick={() => onSelect(item.id as SectionId)} className="flex w-full items-center justify-between rounded-lg border border-[#e2ebe3] bg-white px-3 py-3 text-left text-xs font-semibold text-text-primary transition-colors hover:border-brand-primary/35">{item.label}<ArrowRight className="size-3.5 text-brand-primary" aria-hidden="true" /></button>)}</div></section>
      </div>
    </div>
  );
}

function CollectionPanel({ event, section }: { event: PlannerEvent; section: CollectionId }) {
  const copy = sectionCopy[section];
  const items = event.sections[section] ?? [];
  const [title, setTitle] = useState("");
  const [detail, setDetail] = useState("");
  const [amount, setAmount] = useState("");
  const [time, setTime] = useState("");
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
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
    try { updateSection(event.id, section, [...items, item]); setTitle(""); setDetail(""); setAmount(""); setTime(""); setUrl(""); setError(""); }
    catch { setError("This item couldn’t be saved in this browser. Please try again."); }
  }

  function changeItems(next: EventItem[]) {
    try { updateSection(event.id, section, next); setError(""); }
    catch { setError("Your change couldn’t be saved in this browser. Please try again."); }
  }

  return <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
    <section className="min-w-0 overflow-hidden rounded-xl border border-border-subtle bg-white"><div className="flex items-center justify-between gap-3 border-b border-border-subtle px-5 py-4 sm:px-6"><div><h3 className="text-base font-semibold">{copy.heading}</h3><p className="mt-1 text-xs text-text-tertiary">{items.length} {items.length === 1 ? "item" : "items"}{usesAmount && items.length > 0 ? ` · ${formatNaira(total)}` : ""}</p></div><span className={cn("flex size-9 items-center justify-center rounded-lg", copy.tone)}>{section === "tasks" ? <ClipboardCheck className="size-[18px]" aria-hidden="true" /> : section === "agenda" ? <CalendarClock className="size-[18px]" aria-hidden="true" /> : section === "files" ? <Link2 className="size-[18px]" aria-hidden="true" /> : <BookOpenText className="size-[18px]" aria-hidden="true" />}</span></div>
      {items.length === 0 ? <div className="flex min-h-56 flex-col items-center justify-center px-6 py-12 text-center"><span className={cn("flex size-11 items-center justify-center rounded-xl", copy.tone)}><Plus className="size-5" aria-hidden="true" /></span><h4 className="mt-4 text-sm font-semibold">A clean slate</h4><p className="mt-1 max-w-xs text-xs leading-5 text-text-secondary">{copy.empty}</p></div> : <ul className="divide-y divide-border-subtle">{displayItems.map((item) => <li key={item.id} className="flex items-start gap-3 px-5 py-4 sm:px-6">{supportsDone ? <button type="button" onClick={() => changeItems(items.map((entry) => entry.id === item.id ? { ...entry, done: !entry.done } : entry))} aria-label={`${item.done ? "Mark incomplete" : "Mark complete"}: ${item.title}`} className={cn("mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border", item.done ? "border-brand-primary bg-brand-primary text-white" : "border-border-strong text-transparent hover:border-brand-primary")}><Check className="size-3" aria-hidden="true" /></button> : <span className={cn("mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md", copy.tone)}><ChevronRight className="size-3.5" aria-hidden="true" /></span>}<div className="min-w-0 flex-1"><p className={cn("text-sm font-medium text-text-primary", item.done && "text-text-tertiary line-through")}>{item.url ? <a href={item.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 hover:text-brand-primary hover:underline">{item.title}<Link2 className="size-3" aria-hidden="true" /></a> : item.title}</p>{item.detail && <p className="mt-1 text-xs leading-5 text-text-secondary">{item.detail}</p>}{item.dueDate && <p className="mt-1 text-xs font-medium text-text-tertiary">Due {formatEventDate(item.dueDate, { day: "numeric", month: "short", year: "numeric" })}</p>}{item.time && <p className="mt-1 text-xs font-medium text-text-tertiary">{item.time}</p>}</div>{item.amount !== undefined && <span className="shrink-0 text-xs font-semibold text-text-primary">{formatNaira(item.amount)}</span>}<button type="button" onClick={() => changeItems(items.filter((entry) => entry.id !== item.id))} aria-label={`Remove ${item.title}`} className="ml-1 flex size-7 shrink-0 items-center justify-center rounded-md text-text-tertiary hover:bg-error-soft hover:text-error"><Trash2 className="size-3.5" aria-hidden="true" /></button></li>)}</ul>}
    </section>
    <form onSubmit={add} className="h-fit rounded-xl border border-[#e0e9e2] bg-[#f3f7f3] p-5 sm:p-6"><span className="flex size-9 items-center justify-center rounded-lg bg-white text-brand-primary"><Plus className="size-[18px]" aria-hidden="true" /></span><h3 className="mt-4 text-base font-semibold">{copy.action}</h3><p className="mt-1 text-xs leading-5 text-text-secondary">Keep this event moving, one detail at a time.</p><div className="mt-5 space-y-4"><Input label="Name" placeholder={copy.placeholder} value={title} onChange={(event) => setTitle(event.target.value)} required />{usesTime && <Input label="Time" type="time" value={time} onChange={(event) => setTime(event.target.value)} required />}{usesAmount && <Input label="Amount (₦)" type="number" min="1" placeholder="0" value={amount} onChange={(event) => setAmount(event.target.value)} required />}{usesUrl && <Input label="Link" type="url" placeholder="https://…" value={url} onChange={(event) => setUrl(event.target.value)} required />}{(section === "decisions" || section === "agenda" || section === "proposal") && <Textarea label="Details" optional rows={2} placeholder="Add a little context…" value={detail} onChange={(event) => setDetail(event.target.value)} />}</div>{error && <p role="alert" className="mt-4 text-xs text-error">{error}</p>}<Button type="submit" className="mt-5 w-full" leadingIcon={<Plus className="size-4" aria-hidden="true" />}>{copy.action}</Button></form>
  </div>;
}

function MoodboardPanel({ event }: { event: PlannerEvent }) {
  return <div className="space-y-5"><div className="relative h-44 overflow-hidden rounded-xl border border-border-subtle sm:h-56"><Image src={event.image} alt="Current visual direction for this event" fill unoptimized={isCustomCover(event.image)} sizes="(min-width: 1024px) 70vw, 100vw" className="object-cover" /><span className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" /><div className="absolute bottom-4 left-5 text-white"><p className="text-[0.625rem] font-semibold uppercase tracking-widest text-white/80">Your event cover</p><p className="mt-1 text-sm font-semibold">Start with a feeling. Build from here.</p></div></div><CollectionPanel event={event} section="moodboard" /></div>;
}

export function EventWorkspace({ id, initialSection, initialTab, initialAction, initialTaskId }: { id: string; initialSection?: string; initialTab?: string; initialAction?: string; initialTaskId?: string }) {
  const router = useRouter();
  const events = usePlannerEvents();
  const budgetStore = useBudgetStore();
  const ready = useBrowserReady();
  const event = events.find((item) => item.id === id);
  const [active, setActive] = useState<SectionId>(sections.some((section) => section.id === initialSection) ? initialSection as SectionId : "overview");
  const [quickAction, setQuickAction] = useState(initialAction);
  const [cancelling, setCancelling] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  async function confirmDelete() {
    setDeleteBusy(true);
    setDeleteError("");
    try {
      const attachments = budgetStore.items.filter((item) => item.eventId === id).flatMap((item) => item.attachments.map((attachment) => attachment.id));
      await deleteBudgetAttachments(attachments);
      deleteBudgetForEvent(id);
      deletePlannerEvent(id);
      router.replace("/planner/events");
    } catch {
      setDeleteError("This event couldn’t be deleted in this browser. Please try again.");
    } finally { setDeleteBusy(false); }
  }

  if (!ready) return <div className="h-96 animate-pulse rounded-xl bg-white" aria-label="Loading event" />;
  if (!event) return <div className="mx-auto max-w-lg rounded-xl border border-border-subtle bg-white p-8 text-center"><CalendarDays className="mx-auto size-9 text-brand-primary" aria-hidden="true" /><h1 className="mt-4 text-xl font-semibold">Event not found</h1><p className="mt-2 text-sm text-text-secondary">This event may be saved in another browser or may have been removed.</p><Link href="/planner/events" className={cn(buttonVariants({ size: "md" }), "mt-5")}>Back to events</Link></div>;

  const section = sections.find((item) => item.id === active)!;
  const SectionIcon = section.icon;
  const isPast = event.date < new Date().toLocaleDateString("sv-SE");
  const cancelled = isEventCancelled(event);
  return <div className="w-full min-w-0 space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-3"><Link href="/planner/events" className="inline-flex min-h-9 items-center gap-2 text-xs font-semibold text-text-secondary hover:text-brand-primary"><ArrowLeft className="size-4" aria-hidden="true" />All events</Link><div className="flex flex-wrap items-center gap-2"><EventDetailsEditor event={event} />{cancelled ? <button type="button" onClick={() => reopenPlannerEvent(event.id)} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-[#cfe1d3] bg-white px-3 text-xs font-semibold text-brand-primary hover:bg-[#eaf3ed]"><RotateCcw className="size-3.5" aria-hidden="true" />Reopen event</button> : <button type="button" onClick={() => setCancelling(true)} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-[#f0dcdc] bg-white px-3 text-xs font-semibold text-[#a34c4c] hover:bg-[#fcf2f2]"><Ban className="size-3.5" aria-hidden="true" />Cancel event</button>}<button type="button" onClick={() => { setDeleteError(""); setDeleting(true); }} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-[#f0dcdc] bg-white px-3 text-xs font-semibold text-[#a34c4c] hover:bg-[#fcf2f2]"><Trash2 className="size-3.5" aria-hidden="true" />Delete event</button></div></div>
    <header className="relative isolate overflow-hidden rounded-[1.25rem] bg-[#294d3b] text-white"><Image src={event.image} alt="" fill priority unoptimized={isCustomCover(event.image)} sizes="(min-width: 1024px) 80vw, 100vw" className="object-cover" /><span className="absolute inset-0 bg-gradient-to-r from-[#142d24]/95 via-[#1d372a]/85 to-black/15" aria-hidden="true" /><div className="relative flex min-h-56 flex-col justify-end px-5 py-6 sm:min-h-64 sm:px-8 sm:py-8"><div className="mb-4 flex flex-wrap items-center gap-2"><span className="rounded-full border border-white/25 bg-white/15 px-3 py-1 text-[0.6875rem] font-semibold backdrop-blur-sm">{event.type}</span><StatusBadge status={cancelled ? "cancelled" : isPast ? "past" : "upcoming"} showDot={false} className={cancelled ? "bg-white text-[#a34c4c]" : "bg-white text-brand-primary"} /></div><h1 className="max-w-2xl text-[1.75rem] font-semibold tracking-[-0.045em] sm:text-[2.25rem]">{event.name}</h1><div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-white/85"><span className="inline-flex items-center gap-1.5"><CalendarDays className="size-4" aria-hidden="true" />{formatEventDate(event.date)}</span><span className="inline-flex items-center gap-1.5"><MapPin className="size-4" aria-hidden="true" />{event.location || "Location to be confirmed"}</span></div></div></header>
    {cancelled && <div className="flex items-start gap-3 rounded-xl border border-[#f0dcdc] bg-[#fcf5f5] p-4 text-sm text-[#824949]"><Ban className="mt-0.5 size-4 shrink-0" aria-hidden="true" /><div><p className="font-semibold">This event is cancelled</p><p className="mt-1 text-xs leading-5">It won’t appear in upcoming plans. All planning details remain here{event.cancellationReason ? ` · ${event.cancellationReason}` : "."}</p></div></div>}
    <div className="grid min-w-0 gap-5 lg:grid-cols-[230px_minmax(0,1fr)] xl:gap-7">
      <nav aria-label="Event sections" className="min-w-0 lg:sticky lg:top-24 lg:h-fit lg:rounded-xl lg:border lg:border-border-subtle lg:bg-white lg:p-2"><div className="flex gap-1 overflow-x-auto pb-2 lg:block lg:space-y-0.5 lg:overflow-visible lg:pb-0">{sections.map((item) => { const Icon = item.icon; return <button key={item.id} type="button" onClick={() => setActive(item.id)} aria-current={active === item.id ? "page" : undefined} className={cn("flex min-h-10 shrink-0 items-center gap-2.5 rounded-lg px-3 text-xs font-medium transition-colors lg:w-full lg:text-left", active === item.id ? "bg-[#eaf3ed] font-semibold text-brand-primary" : "text-text-secondary hover:bg-background-subtle hover:text-text-primary")}><Icon className="size-[17px] shrink-0" weight="bold" aria-hidden="true" />{item.label}</button>; })}</div></nav>
      <div className="min-w-0"><div className="mb-5 flex items-start gap-3"><span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#eaf3ed] text-brand-primary"><SectionIcon className="size-5" aria-hidden="true" /></span><div><h2 className="text-xl font-semibold tracking-[-0.03em] text-text-primary">{active === "notes" ? "Notes & questionnaires" : section.label}</h2><p className="mt-1 text-xs text-text-secondary">{section.description}</p></div></div>
        {active === "overview" && <OverviewPanel event={event} onSelect={setActive} />}
        {active === "notes" && <EventNotesQuestionnaires key={event.id} event={event} initialTab={initialTab} initialAction={quickAction} onActionConsumed={() => setQuickAction(undefined)} />}
        {active === "budget" && <BudgetWorkspace fixedEventId={event.id} embedded />}
        {active === "proposal" && <div className="space-y-5"><div className="flex items-center gap-3 rounded-xl border border-[#e1eaf1] bg-[#f0f5fa] p-4 text-xs text-[#55748b]"><CircleDollarSign className="size-5 shrink-0" aria-hidden="true" />Build a working estimate here. Proposal items stay with this event; they are not sent to anyone automatically.</div><CollectionPanel event={event} section="proposal" /></div>}
        {active === "tasks" && <TaskWorkspace event={event} initialTaskId={initialTaskId} />}
        {active === "moodboard" && <MoodboardPanel event={event} />}
        {active === "agenda" && <CollectionPanel event={event} section="agenda" />}
        {active === "decisions" && <CollectionPanel event={event} section="decisions" />}
        {active === "files" && <CollectionPanel event={event} section="files" />}
      </div>
    </div>
    <EventCancellationDialog event={cancelling ? event : null} onClose={() => setCancelling(false)} />
    <Dialog.Root open={deleting} onOpenChange={(open) => { if (!open && !deleteBusy) setDeleting(false); }}><Dialog.Portal><Dialog.Overlay className="fixed inset-0 z-50 bg-[#10231a]/55 backdrop-blur-[2px]" /><Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white p-6 shadow-[var(--shadow-lg)] focus:outline-none"><div className="flex items-start justify-between gap-3"><span className="flex size-11 items-center justify-center rounded-xl bg-error-soft text-error"><Trash2 className="size-5" aria-hidden="true" /></span><Dialog.Close asChild><button type="button" disabled={deleteBusy} aria-label="Close" className="flex size-8 items-center justify-center rounded-lg text-text-tertiary hover:bg-background-subtle">×</button></Dialog.Close></div><Dialog.Title className="mt-4 text-lg font-semibold">Delete {event.name}?</Dialog.Title><Dialog.Description className="mt-2 text-sm leading-6 text-text-secondary">This permanently removes the event, its notes, tasks, questionnaires, budget and attached documents from this browser. This cannot be undone.</Dialog.Description>{deleteError && <p role="alert" className="mt-4 rounded-lg bg-error-soft p-3 text-xs text-error">{deleteError}</p>}<div className="mt-6 flex justify-end gap-2"><Button type="button" size="sm" variant="outline" disabled={deleteBusy} onClick={() => setDeleting(false)}>Keep event</Button><Button type="button" size="sm" disabled={deleteBusy} onClick={() => void confirmDelete()} className="bg-error hover:bg-error/90">{deleteBusy ? "Deleting…" : "Delete event"}</Button></div></Dialog.Content></Dialog.Portal></Dialog.Root>
  </div>;
}
