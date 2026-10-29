"use client";

import { currentEventDecisions } from "@/lib/event-decisions";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ArrowRight, CalendarDays, Check, ClipboardCheck, MapPin, Scale, Star, UsersRound, Wallet } from "@/components/ui/icons";
import { EventDetailsEditor } from "@/components/planner/event-details-editor";
import { EventClientDetails } from "@/components/planner/event-client-details";
import { EventCoverEditor } from "@/components/planner/event-cover-editor";
import { EventTierChip } from "@/components/planner/event-tier-chip";
import { EventLinkedEvents } from "@/components/planner/event-linked-events";
import { EventUpcomingPayments } from "@/components/planner/event-upcoming-payments";
import { EventOverviewDecisions } from "@/components/planner/event-overview-decisions";
import { EventMoodboardPreview } from "@/components/planner/event-moodboard";
import { EventPhotoViewer } from "@/components/planner/event-photo-viewer";
import { OverviewMetricCard } from "@/components/planner/overview-metric-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatBudgetMoney, useBudgetStore } from "@/lib/planner-budget";
import { usePlannerClients } from "@/lib/planner-clients";
import { eventDayOffset, localEventToday } from "@/lib/event-weather";
import { completePlannerTask, formatEventDate, formatEventPlace, isCustomCover, isEventCancelled, isTaskActive, isTaskComplete, taskStatus, type PlannerEvent } from "@/lib/planner-events";
import { cn } from "@/lib/utils/cn";

type Props = {
  event: PlannerEvent;
  onOpenTasks: (taskId?: string) => void;
  onOpenMoodboard: (addPhoto?: boolean) => void;
  onOpenDecisions?: () => void;
};

export function EventOverviewPanel({ event, onOpenTasks, onOpenMoodboard, onOpenDecisions }: Props) {
  const [showCover, setShowCover] = useState(false);
  const [taskError, setTaskError] = useState("");
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    const initial = window.setTimeout(() => setNow(new Date()), 0);
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => { window.clearTimeout(initial); window.clearInterval(timer); };
  }, []);
  const clients = usePlannerClients();
  const budgetItems = useBudgetStore().items.filter((item) => item.eventId === event.id && item.status !== "cancelled");
  const client = event.clientId ? clients.find((item) => item.id === event.clientId) : clients.find((item) => item.name.toLocaleLowerCase() === event.clientName.trim().toLocaleLowerCase());
  const tasks = event.sections.tasks.filter(isTaskActive);
  const completed = tasks.filter(isTaskComplete).length;
  const pending = tasks.filter((task) => !isTaskComplete(task));
  const nextTasks = [...pending].sort((first, second) =>
    Number(taskStatus(second) === "blocked") - Number(taskStatus(first) === "blocked") ||
    (first.dueDate || "9999").localeCompare(second.dueDate || "9999") ||
    Number(second.priority === "high") - Number(first.priority === "high"),
  ).slice(0, 3);
  const booked = budgetItems.filter((item) => item.vendorStatus === "booked").length;
  const decisions = currentEventDecisions(event).filter((item) => !item.done).length;
  const today = now ? localEventToday(event.timeZone || "Africa/Lagos", now) : "";
  const daysUntil = eventDayOffset(event.date, today);
  const cancelled = isEventCancelled(event);
  const futureEvent = !cancelled && daysUntil > 0;
  const countdown = cancelled ? "Plans paused" : !Number.isFinite(daysUntil) ? "Date to be confirmed" : daysUntil === 0 ? "It’s event day" : daysUntil < 0 ? "Event day passed" : String(daysUntil);
  const time = event.startTime ? `${event.startTime}${event.endTime ? ` – ${event.endTime}` : ""}` : "Time to be confirmed";
  const currency = event.currency || "NGN";
  const eventPath = `/planner/events/${encodeURIComponent(event.id)}`;
  const details = [
    { label: "Date & time", icon: CalendarDays, value: formatEventDate(event.date, { day: "numeric", month: "short", year: "numeric" }), detail: time },
    { label: "Location", icon: MapPin, value: formatEventPlace(event), detail: "" },
    { label: "Guest size", icon: UsersRound, value: event.guestCount ? `${Number(event.guestCount).toLocaleString("en-NG")} guests` : "Not set yet", detail: "" },
  ];

  return (
    <div className="space-y-5">
      <section aria-label="Event details" className="grid overflow-hidden rounded-2xl border border-[#e2e7e2] bg-white shadow-[0_8px_28px_-24px_rgba(20,45,30,.25)] md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <div className="relative h-44 border-b border-[#e2e7df] bg-[#edf0e9] sm:h-48 md:h-auto md:min-h-[260px] md:border-b-0 md:border-r">
          <button type="button" aria-label={`Open full photo for ${event.name}`} onClick={() => setShowCover(true)} className="absolute inset-0 block w-full focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-brand-primary">
            <Image src={event.image} alt={`Cover photo for ${event.name}`} fill priority unoptimized={isCustomCover(event.image)} sizes="(min-width: 1024px) 35vw, (min-width: 768px) 40vw, 100vw" className="object-cover" />
          </button>
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent" />
          <div aria-label="Event countdown" className="pointer-events-none absolute bottom-4 left-4 max-w-[calc(100%-6rem)] rounded-xl border border-white/30 bg-black/25 px-3 py-2.5 text-white backdrop-blur-md">
            {futureEvent ? <><p className="text-xs font-medium uppercase tracking-[0.1em] text-white/90">Until the event</p><p className="mt-1 flex flex-wrap items-baseline gap-x-2"><span className="text-4xl font-semibold leading-none tracking-tight tabular-nums sm:text-5xl">{countdown}</span><span className="text-sm font-medium">{daysUntil === 1 ? "day" : "days"} to go</span></p></> : <p className="text-sm font-semibold">{now || cancelled ? countdown : "Event countdown"}</p>}
          </div>
          <EventCoverEditor event={event} />
        </div>
        <div className="flex min-w-0 flex-col bg-linear-to-br from-white to-[#f9fbf7] p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 flex-wrap items-center gap-2"><span className="rounded-full bg-[#edf3ec] px-2.5 py-1 text-[0.6875rem] font-semibold text-brand-primary">{event.type}</span><StatusBadge status={cancelled ? "cancelled" : daysUntil < 0 ? "past" : "upcoming"} showDot={false} /><EventTierChip eventId={event.id} eventName={event.name} tier={event.tier} cancelled={cancelled} /></div>
            <EventDetailsEditor event={event} className="shrink-0" />
          </div>
          {event.description && <p title={event.description} className="mt-2 line-clamp-1 text-sm leading-5 text-text-secondary">{event.description}</p>}
          <dl className="my-3 grid grid-cols-2 gap-x-4 gap-y-3 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,1.3fr)_minmax(0,.8fr)]">
            {details.map(({ label, icon: Icon, value, detail }) => <div key={label} className="flex min-w-0 items-start gap-2.5">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-[#edf3ed] text-[#548164]"><Icon className="size-3.5" aria-hidden="true" /></span>
              <div className="min-w-0"><dt className="text-xs font-medium leading-4 text-text-secondary">{label}</dt>
              <dd className="mt-1 break-words text-sm font-semibold leading-5 text-text-primary">{value}</dd>
              {detail && <dd className="mt-0.5 break-words text-xs leading-4 text-text-secondary">{detail}</dd>}</div>
            </div>)}
          </dl>
          <EventClientDetails client={client} name={event.clientName} lead={event.assignedTeamMember} />
        </div>
      </section>
      <EventPhotoViewer photo={showCover ? { src: event.image, title: event.name } : null} onClose={() => setShowCover(false)} />

      <section aria-labelledby="planning-at-a-glance">
        <header className="mb-4"><p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-[#a4671c]"><Star className="size-4" aria-hidden="true" />The celebration is taking shape</p><h2 id="planning-at-a-glance" className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl">Your planning at a glance</h2></header>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <OverviewMetricCard icon={ClipboardCheck} href={`${eventPath}?section=tasks`} label="Tasks complete" value={`${completed} of ${tasks.length}`} detail={pending.length ? `${pending.length} still to do` : tasks.length ? "Every task is complete" : "Ready for your first task"} tone="sage" progress={tasks.length ? { value: Math.round(completed / tasks.length * 100), label: "Event task completion" } : undefined} className="event-overview-metric" compact />
        <OverviewMetricCard icon={Wallet} href={`${eventPath}?section=budget`} label="Estimated budget" value={event.budget ? formatBudgetMoney(Number(event.budget), currency) : "Not set yet"} detail={event.targetBudget ? `Client target · ${formatBudgetMoney(Number(event.targetBudget), currency)}` : "Your working event estimate"} tone="amber" animateCurrency={currency === "NGN"} className="event-overview-metric" compact />
        <OverviewMetricCard icon={UsersRound} href={`${eventPath}?section=budget&tab=bookings`} label="Vendor bookings" value={booked} detail="Booked budget items" tone="blue" className="event-overview-metric" compact />
        <OverviewMetricCard icon={Scale} href={`${eventPath}?section=decisions`} label="Open decisions" value={decisions} detail={decisions ? "Ready for your next call" : "No decisions waiting"} tone="lilac" className="event-overview-metric" compact />
        </div>
      </section>

      <div data-overview-row="tasks-mood-board" className="grid auto-rows-fr items-stretch gap-6 lg:min-h-[440px] lg:grid-cols-2">
        <section className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-border-subtle bg-white">
          <div className="flex items-center justify-between gap-3 border-b border-border-subtle px-5 py-5 sm:px-6"><div><h2 className="text-base font-semibold tracking-tight">Next 3 tasks</h2><p className="mt-1 text-xs text-text-secondary">{nextTasks.length ? "Your nearest deadlines and tasks needing attention." : "Give each next step a place."}</p></div><button type="button" onClick={() => onOpenTasks()} className="inline-flex min-h-10 shrink-0 items-center gap-1.5 text-xs font-semibold text-brand-primary hover:underline focus-visible:outline-2 focus-visible:outline-brand-primary">View tasks<ArrowRight className="size-3.5" aria-hidden="true" /></button></div>
          {nextTasks.length ? <ul className="flex flex-1 flex-col divide-y divide-border-subtle">{nextTasks.map((task) => {
            const blocked = taskStatus(task) === "blocked";
            const overdue = Boolean(task.dueDate && task.dueDate < today);
            const milestone = event.taskGroups?.find((group) => group.id === task.groupId);
            return <li key={task.id} className="relative flex flex-1 items-center gap-3 px-5 py-5 sm:gap-4 sm:px-6"><input type="checkbox" checked={false} disabled={cancelled} aria-label={`Mark complete: ${task.title}`} onChange={() => { try { completePlannerTask(event.id, task.id); setTaskError(""); } catch (failure) { setTaskError(failure instanceof Error ? failure.message : "Couldn’t complete this task. Please try again."); } }} className="relative z-10 size-5 shrink-0 cursor-pointer accent-brand-primary disabled:cursor-not-allowed" /><button type="button" aria-label={`Open task: ${task.title}`} onClick={() => onOpenTasks(task.id)} className="group flex min-w-0 flex-1 items-center gap-3 rounded-lg text-left transition-colors after:absolute after:inset-0 after:rounded-lg after:content-[''] hover:text-brand-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-primary"><span className="min-w-0 flex-1"><span className="block text-sm font-semibold leading-5">{task.title}</span><span className="mt-1 block text-xs leading-5 text-text-secondary">{milestone?.title || "Event task"}{task.assignee ? ` · ${task.assignee}` : ""}</span><span className={cn("mt-2 inline-flex rounded-md px-2 py-0.5 text-xs font-medium leading-4", overdue ? "bg-error-soft text-error" : blocked ? "bg-[#fff3e8] text-[#9b632e]" : "bg-[#f1f4f1] text-text-secondary")}>{blocked ? "Blocked · " : ""}{task.dueDate ? `${overdue ? "Overdue" : "Due"} ${formatEventDate(task.dueDate, { day: "numeric", month: "short" })}` : "No due date yet"}</span></span><ArrowRight className="size-4 shrink-0 text-text-tertiary group-hover:text-brand-primary" aria-hidden="true" /></button></li>;
          })}</ul> : <div className="flex min-h-64 flex-1 flex-col items-center justify-center px-6 py-8 text-center"><span className="flex size-12 items-center justify-center rounded-2xl bg-[#edf5ef] text-brand-primary"><Check className="size-5" aria-hidden="true" /></span><p className="mt-4 text-sm font-semibold">{tasks.length ? "You’re all caught up" : "Start with your first milestone"}</p><p className="mt-2 max-w-xs text-xs leading-6 text-text-secondary">{tasks.length ? "All your current tasks are complete. Add the next steps when you’re ready." : "Group the work into milestones, then add tasks and dates to build your plan."}</p></div>}
          {taskError && <p role="alert" className="border-t border-border-subtle px-5 py-3 text-sm text-error">{taskError}</p>}
        </section>
        <EventMoodboardPreview event={event} onOpen={onOpenMoodboard} />
      </div>
      <div data-overview-row="decisions-payments" className="grid auto-rows-fr items-stretch gap-6 lg:min-h-80 lg:grid-cols-2">
        <EventOverviewDecisions event={event} onOpenAll={onOpenDecisions} />
        <EventUpcomingPayments event={event} today={today} />
      </div>
      <EventLinkedEvents event={event} />
    </div>
  );
}
