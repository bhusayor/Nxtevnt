"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight, ArrowUpRight, CalendarDays, ClipboardCheck, Clock3, FolderOpen, Plus, Search,
} from "@/components/ui/icons";
import { SearchInput } from "@/components/ui/search-input";
import { Select } from "@/components/ui/select";
import { buttonVariants } from "@/components/ui/button";
import {
  formatEventDate, isCustomCover, isEventCancelled, isTaskComplete, taskStatus,
  useBrowserReady, usePlannerEvents,
  type EventItem, type EventTaskGroup, type PlannerEvent,
} from "@/lib/planner-events";
import { cn } from "@/lib/utils/cn";

type EventProgress = "empty" | "todo" | "in-progress" | "overdue" | "blocked" | "completed";
type ProgressFilter = EventProgress | "all";
type EventTaskSummary = {
  event: PlannerEvent;
  total: number;
  completed: number;
  overdue: number;
  blocked: number;
  nextTask?: EventItem;
  nextGroup?: EventTaskGroup;
  progress: number;
  state: EventProgress;
};

const progressDetails: Record<EventProgress, { label: string; tone: string }> = {
  empty: { label: "No tasks yet", tone: "border-[#e2e8e5] bg-[#f3f6f4] text-[#60716a]" },
  todo: { label: "To do", tone: "border-[#e2e8e5] bg-[#f3f6f4] text-[#60716a]" },
  "in-progress": { label: "In progress", tone: "border-[#d7e6f4] bg-[#edf5fc] text-[#4d7499]" },
  overdue: { label: "Overdue", tone: "border-[#f0d9ce] bg-[#fff3ed] text-[#a5583b]" },
  blocked: { label: "Blocked", tone: "border-[#f2dfcb] bg-[#fff3e6] text-[#9b662f]" },
  completed: { label: "Completed", tone: "border-[#d8ebdf] bg-[#edf7ef] text-[#417d54]" },
};

const progressOptions: { label: string; value: ProgressFilter }[] = [
  { label: "All progress", value: "all" },
  { label: "To do", value: "todo" },
  { label: "In progress", value: "in-progress" },
  { label: "Overdue", value: "overdue" },
  { label: "Blocked", value: "blocked" },
  { label: "Completed", value: "completed" },
  { label: "No tasks yet", value: "empty" },
];

function SegmentedBar({ total, segments, label }: {
  total: number;
  segments: { value: number; color: string }[];
  label: string;
}) {
  return <div role="img" aria-label={label} className="mt-5 flex h-2.5 overflow-hidden rounded-full bg-[#edf1ee]">
    {total > 0 && segments.map((segment, index) => <span key={index} className={segment.color} style={{ width: `${segment.value / total * 100}%` }} />)}
  </div>;
}

function buildSummary(event: PlannerEvent, today: string): EventTaskSummary {
  const tasks = event.sections.tasks;
  const pending = tasks.filter((task) => !isTaskComplete(task));
  const completed = tasks.length - pending.length;
  const overdue = pending.filter((task) => task.dueDate && task.dueDate < today).length;
  const blocked = pending.filter((task) => taskStatus(task) === "blocked").length;
  const nextTask = [...pending].sort((first, second) => {
    const firstDue = first.dueDate || "9999-12-31";
    const secondDue = second.dueDate || "9999-12-31";
    return firstDue.localeCompare(secondDue)
      || Number(taskStatus(second) === "blocked") - Number(taskStatus(first) === "blocked")
      || first.title.localeCompare(second.title);
  })[0];
  const nextGroup = event.taskGroups?.find((group) => group.id === nextTask?.groupId);
  const state: EventProgress = tasks.length === 0 ? "empty"
    : pending.length === 0 ? "completed"
      : overdue > 0 ? "overdue"
        : blocked > 0 ? "blocked"
          : completed > 0 || pending.some((task) => taskStatus(task) === "in-progress") ? "in-progress" : "todo";

  return {
    event, total: tasks.length, completed, overdue, blocked, nextTask, nextGroup,
    progress: tasks.length ? Math.round(completed / tasks.length * 100) : 0, state,
  };
}

function OverviewPanel({ events, summaries }: { events: readonly PlannerEvent[]; summaries: readonly EventTaskSummary[] }) {
  const groups = events.flatMap((event) => (event.taskGroups ?? []).map((group) => ({
    group,
    tasks: event.sections.tasks.filter((task) => task.groupId === group.id),
  })));
  const completedGroups = groups.filter(({ tasks }) => tasks.length > 0 && tasks.every(isTaskComplete)).length;
  const startedGroups = groups.filter(({ tasks }) => tasks.length > 0 && !tasks.every(isTaskComplete) && tasks.some((task) => taskStatus(task) !== "todo")).length;
  const untouchedGroups = groups.length - completedGroups - startedGroups;
  const total = summaries.reduce((sum, summary) => sum + summary.total, 0);
  const completed = summaries.reduce((sum, summary) => sum + summary.completed, 0);
  const overdue = summaries.reduce((sum, summary) => sum + summary.overdue, 0);
  const tasks = events.flatMap((event) => event.sections.tasks);
  const inProgress = tasks.filter((task) => taskStatus(task) === "in-progress").length;
  const blocked = tasks.filter((task) => taskStatus(task) === "blocked").length;
  const todo = total - completed - inProgress - blocked;

  return <section aria-label="Task overview" className="grid gap-3 lg:grid-cols-2">
    <article className="rounded-2xl border border-border-subtle bg-white p-5 shadow-[0_8px_26px_-23px_rgba(20,45,30,.35)] sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div><p className="text-[0.6875rem] font-semibold uppercase tracking-[0.09em] text-text-tertiary">Milestones</p><p className="mt-2 text-[2rem] font-semibold leading-none tracking-[-0.05em] tabular-nums text-text-primary">{groups.length}</p><p className="mt-2 text-xs text-text-secondary">Stages across your events</p></div>
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#eef2fa] text-[#61759a]"><FolderOpen className="size-5" aria-hidden="true" /></span>
      </div>
      <SegmentedBar total={groups.length} segments={[{ value: completedGroups, color: "bg-[#70b789]" }, { value: startedGroups, color: "bg-[#88a9d4]" }, { value: untouchedGroups, color: "bg-[#d6dfdb]" }]} label={`${completedGroups} completed, ${startedGroups} in progress, ${untouchedGroups} not started milestones`} />
      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-[0.6875rem] text-text-secondary"><span><i className="mr-1.5 inline-block size-2 rounded-full bg-[#70b789]" />{completedGroups} completed</span><span><i className="mr-1.5 inline-block size-2 rounded-full bg-[#88a9d4]" />{startedGroups} in motion</span><span><i className="mr-1.5 inline-block size-2 rounded-full bg-[#d6dfdb]" />{untouchedGroups} not started</span></div>
    </article>
    <article className="rounded-2xl border border-border-subtle bg-white p-5 shadow-[0_8px_26px_-23px_rgba(20,45,30,.35)] sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div><div className="flex flex-wrap items-center gap-2"><p className="text-[0.6875rem] font-semibold uppercase tracking-[0.09em] text-text-tertiary">Tasks</p>{overdue > 0 && <span className="inline-flex items-center gap-1 rounded-full bg-[#fff3ed] px-2 py-0.5 text-[0.625rem] font-semibold text-[#a5583b]"><Clock3 className="size-3" aria-hidden="true" />{overdue} overdue</span>}</div><p className="mt-2 text-[2rem] font-semibold leading-none tracking-[-0.05em] tabular-nums text-text-primary">{total}</p><p className="mt-2 text-xs text-text-secondary">{total ? `${Math.round(completed / total * 100)}% complete across all events` : "Ready for your first task"}</p></div>
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#edf5ef] text-brand-primary"><ClipboardCheck className="size-5" aria-hidden="true" /></span>
      </div>
      <SegmentedBar total={total} segments={[{ value: completed, color: "bg-[#48976a]" }, { value: inProgress, color: "bg-[#87bca0]" }, { value: todo, color: "bg-[#d8e9dd]" }, { value: blocked, color: "bg-[#dfaa70]" }]} label={`${completed} completed, ${inProgress} in progress, ${todo} to do, ${blocked} blocked tasks`} />
      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-[0.6875rem] text-text-secondary"><span><i className="mr-1.5 inline-block size-2 rounded-full bg-[#48976a]" />{completed} completed</span><span><i className="mr-1.5 inline-block size-2 rounded-full bg-[#87bca0]" />{inProgress} in progress</span><span><i className="mr-1.5 inline-block size-2 rounded-full bg-[#d8e9dd]" />{todo} to do</span><span><i className="mr-1.5 inline-block size-2 rounded-full bg-[#dfaa70]" />{blocked} blocked</span></div>
    </article>
  </section>;
}

function ProgressBadge({ state }: { state: EventProgress }) {
  const { label, tone } = progressDetails[state];
  return <span className={cn("inline-flex w-fit items-center rounded-full border px-2.5 py-1 text-[0.625rem] font-semibold leading-4", tone)}>{label}</span>;
}

function EventIdentity({ event }: { event: PlannerEvent }) {
  return <div className="flex min-w-0 items-center gap-2.5"><span className="relative size-10 shrink-0 overflow-hidden rounded-lg bg-[#e9efea]"><Image src={event.image} alt="" fill unoptimized={isCustomCover(event.image)} sizes="40px" className="object-cover" /></span><span className="min-w-0"><span className="block truncate text-xs font-semibold text-text-primary" title={event.name}>{event.name}</span><span className="mt-0.5 block whitespace-nowrap text-[0.6875rem] text-text-tertiary">{formatEventDate(event.date, { day: "numeric", month: "short", year: "numeric" })}</span></span></div>;
}

function EventProgressBar({ summary }: { summary: EventTaskSummary }) {
  return <div className="min-w-[130px]"><div className="mb-2 flex items-center justify-between gap-2 text-[0.6875rem]"><span className="text-text-tertiary">{summary.completed} of {summary.total} tasks</span><span className="font-semibold tabular-nums text-text-primary">{summary.progress}%</span></div><div role="progressbar" aria-label={`${summary.event.name} task completion`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={summary.progress} className="h-1.5 overflow-hidden rounded-full bg-[#e8eee9]"><div className="h-full rounded-full bg-[#48976a] transition-[width] duration-500" style={{ width: `${summary.progress}%` }} /></div></div>;
}

function NextTask({ summary }: { summary: EventTaskSummary }) {
  const task = summary.nextTask;
  if (!task) return <div><p className="text-xs font-semibold text-text-primary">{summary.total ? "All tasks completed" : "No tasks added yet"}</p><p className="mt-1 text-[0.6875rem] text-text-tertiary">{summary.total ? "Nothing left on the task list" : "Add a task inside this event"}</p></div>;
  const isOverdue = Boolean(task.dueDate && task.dueDate < new Date().toLocaleDateString("sv-SE"));
  return <div className="min-w-0"><p className="truncate text-xs font-semibold text-text-primary" title={task.title}>{task.title}</p><p className={cn("mt-1 flex items-center gap-1 text-[0.6875rem]", isOverdue ? "font-semibold text-[#a5583b]" : "text-text-tertiary")}>{task.dueDate ? <><CalendarDays className="size-3.5 shrink-0" aria-hidden="true" />{isOverdue ? "Overdue · " : "Due "}{formatEventDate(task.dueDate, { day: "numeric", month: "short" })}</> : "No due date set"}</p></div>;
}

function EventRow({ summary, compact = false }: { summary: EventTaskSummary; compact?: boolean }) {
  const href = `/planner/events/${summary.event.id}?section=tasks`;
  if (compact) return <article className="space-y-4 rounded-xl border border-border-subtle bg-white p-4"><div className="flex items-start justify-between gap-3"><EventIdentity event={summary.event} /><ProgressBadge state={summary.state} /></div><div className="grid grid-cols-2 gap-3 border-t border-border-subtle pt-3"><div><p className="mb-1 text-[0.625rem] font-semibold uppercase tracking-wide text-text-tertiary">Next task</p><NextTask summary={summary} /></div><div><p className="mb-1 text-[0.625rem] font-semibold uppercase tracking-wide text-text-tertiary">Milestone</p><p className="text-xs text-text-secondary">{summary.nextGroup?.title ?? (summary.nextTask ? "Other tasks" : "—")}</p></div></div><EventProgressBar summary={summary} /><Link href={href} className="inline-flex min-h-9 items-center gap-1 text-xs font-semibold text-brand-primary hover:underline">View tasks<ArrowUpRight className="size-3.5" aria-hidden="true" /></Link></article>;

  return <tr className="border-t border-border-subtle transition-colors hover:bg-[#fbfcfb]"><td className="max-w-52 px-5 py-4"><EventIdentity event={summary.event} /></td><td className="max-w-56 px-4 py-4"><NextTask summary={summary} /></td><td className="max-w-44 px-4 py-4 text-xs text-text-secondary"><span className="block truncate" title={summary.nextGroup?.title ?? ""}>{summary.nextGroup?.title ?? (summary.nextTask ? "Other tasks" : "—")}</span></td><td className="min-w-40 px-4 py-4"><EventProgressBar summary={summary} /></td><td className="px-4 py-4"><ProgressBadge state={summary.state} /></td><td className="px-4 py-4 text-right"><Link href={href} className="inline-flex min-h-9 items-center gap-1 whitespace-nowrap text-xs font-semibold text-brand-primary hover:underline">View tasks<ArrowUpRight className="size-3.5" aria-hidden="true" /></Link></td></tr>;
}

export function PlannerTasksPage() {
  const ready = useBrowserReady();
  const events = usePlannerEvents();
  const [query, setQuery] = useState("");
  const [eventFilter, setEventFilter] = useState("all");
  const [progressFilter, setProgressFilter] = useState<ProgressFilter>("all");
  const today = new Date().toLocaleDateString("sv-SE");
  const activeEvents = events.filter((event) => !isEventCancelled(event));
  const summaries = activeEvents.map((event) => buildSummary(event, today));
  const search = query.trim().toLowerCase();
  const filtered = summaries.filter((summary) => (eventFilter === "all" || summary.event.id === eventFilter)
    && (progressFilter === "all" || summary.state === progressFilter)
    && (!search || `${summary.event.name} ${summary.event.clientName ?? ""}`.toLowerCase().includes(search)))
    .sort((first, second) => {
      const urgency: Record<EventProgress, number> = { overdue: 0, blocked: 1, "in-progress": 2, todo: 3, empty: 4, completed: 5 };
      return urgency[first.state] - urgency[second.state]
        || (first.nextTask?.dueDate || "9999-12-31").localeCompare(second.nextTask?.dueDate || "9999-12-31")
        || first.event.date.localeCompare(second.event.date);
    });
  const hasFilters = Boolean(query || eventFilter !== "all" || progressFilter !== "all");
  const clearFilters = () => { setQuery(""); setEventFilter("all"); setProgressFilter("all"); };

  return <div className="w-full min-w-0 space-y-7 pb-10">
    <header><p className="text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-brand-primary">Across your workspace</p><h1 className="mt-1 text-[1.75rem] font-semibold tracking-[-0.04em] text-text-primary sm:text-[2rem]">Tasks</h1><p className="mt-1 text-sm text-text-secondary">See how each event is moving, then open its task plan.</p></header>
    {!ready ? <div className="h-80 animate-pulse rounded-2xl bg-white" aria-label="Loading tasks" /> : <>
      <OverviewPanel events={activeEvents} summaries={summaries} />
      {activeEvents.length === 0 ? <section className="rounded-2xl border border-[#dce8df] bg-gradient-to-br from-[#f2f8f3] to-white px-6 py-12 text-center sm:py-16"><span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-white text-brand-primary"><ClipboardCheck className="size-7" aria-hidden="true" /></span><h2 className="mt-5 text-xl font-semibold tracking-tight">{events.length ? "No active events to track" : "Your plan starts with an event"}</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-text-secondary">{events.length ? "Cancelled events are kept in your records. Reopen one from Events, or create a new event to start planning tasks." : "Create an event, then shape its work into milestones and tasks. Progress will appear here for every event."}</p><Link href={events.length ? "/planner/events" : "/planner/create-event"} className={cn(buttonVariants({ size: "md" }), "mt-6 inline-flex items-center gap-2")}>{events.length ? "View events" : "Create an event"}{events.length ? <ArrowRight className="size-4" aria-hidden="true" /> : <Plus className="size-4" aria-hidden="true" />}</Link></section> : <section aria-labelledby="event-tasks-heading" className="space-y-4">
        <div><h2 id="event-tasks-heading" className="text-base font-semibold text-text-primary">Tasks by event <span className="ml-1 font-normal text-text-tertiary">{activeEvents.length}</span></h2><p className="mt-1 text-xs text-text-secondary">One row per event. Open an event to see every task and milestone.</p></div>
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-[minmax(220px,1fr)_minmax(170px,220px)_minmax(145px,190px)]"><SearchInput aria-label="Search events" placeholder="Search events or clients" value={query} onChange={(input) => setQuery(input.target.value)} onClear={() => setQuery("")} /><Select ariaLabel="Filter tasks by event" value={eventFilter} onValueChange={setEventFilter} options={[{ label: "All events", value: "all" }, ...activeEvents.map((event) => ({ label: event.name, value: event.id }))]} /><Select ariaLabel="Filter events by task progress" value={progressFilter} onValueChange={(value) => setProgressFilter(value as ProgressFilter)} options={progressOptions} /></div>
        {filtered.length ? <div className="overflow-hidden rounded-2xl border border-border-subtle bg-white"><div className="flex items-center justify-between border-b border-border-subtle px-5 py-3 text-[0.6875rem] text-text-tertiary"><span>{filtered.length} {filtered.length === 1 ? "event" : "events"} shown</span><span>Needs attention first</span></div><div className="hidden overflow-x-auto md:block"><table className="w-full min-w-[960px] border-collapse text-left"><thead className="bg-[#f8faf8] text-[0.625rem] font-semibold uppercase tracking-[0.08em] text-text-tertiary"><tr><th className="px-5 py-3">Event</th><th className="px-4 py-3">Next task</th><th className="px-4 py-3">Current milestone</th><th className="px-4 py-3">Task progress</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right"><span className="sr-only">Open event tasks</span></th></tr></thead><tbody>{filtered.map((summary) => <EventRow key={summary.event.id} summary={summary} />)}</tbody></table></div><div className="grid gap-3 bg-[#fbfcfb] p-3 md:hidden">{filtered.map((summary) => <EventRow key={summary.event.id} summary={summary} compact />)}</div></div> : <div className="rounded-2xl border border-border-subtle bg-white px-6 py-12 text-center"><span className="mx-auto flex size-12 items-center justify-center rounded-xl bg-[#eef4ef] text-brand-primary"><Search className="size-5" aria-hidden="true" /></span><h3 className="mt-4 text-base font-semibold">No events match these filters</h3><p className="mx-auto mt-2 max-w-sm text-xs leading-5 text-text-secondary">Try another event, progress state or search term.</p>{hasFilters && <button type="button" onClick={clearFilters} className="mt-5 min-h-9 text-xs font-semibold text-brand-primary hover:underline">Clear filters</button>}</div>}
      </section>}
    </>}
  </div>;
}
