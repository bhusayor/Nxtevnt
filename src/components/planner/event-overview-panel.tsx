"use client";

import { currentEventDecisions } from "@/lib/event-decisions";

import { useState } from "react";
import Image from "next/image";
import { ArrowRight, CalendarDays, Check, ClipboardCheck, Clock3, MapPin, Scale, UsersRound, Wallet } from "@/components/ui/icons";
import { EventDetailsEditor } from "@/components/planner/event-details-editor";
import { EventMoodboardPreview } from "@/components/planner/event-moodboard";
import { EventPhotoViewer } from "@/components/planner/event-photo-viewer";
import { OverviewMetricCard } from "@/components/planner/overview-metric-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatBudgetMoney, useBudgetStore } from "@/lib/planner-budget";
import { usePlannerClients } from "@/lib/planner-clients";
import { formatEventDate, formatEventPlace, isCustomCover, isEventCancelled, isTaskActive, isTaskComplete, taskStatus, type PlannerEvent } from "@/lib/planner-events";
import { cn } from "@/lib/utils/cn";

type Props = {
  event: PlannerEvent;
  onOpenTasks: (taskId?: string) => void;
  onOpenMoodboard: (addPhoto?: boolean) => void;
};

export function EventOverviewPanel({ event, onOpenTasks, onOpenMoodboard }: Props) {
  const [showCover, setShowCover] = useState(false);
  const clients = usePlannerClients();
  const budgetItems = useBudgetStore().items.filter((item) => item.eventId === event.id && item.status !== "cancelled");
  const client = clients.find((item) => item.id === event.clientId || item.name.toLocaleLowerCase() === event.clientName.toLocaleLowerCase());
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
  const today = new Date().toLocaleDateString("sv-SE");
  const daysUntil = Math.round((new Date(`${event.date}T12:00:00`).getTime() - new Date(`${today}T12:00:00`).getTime()) / 86_400_000);
  const cancelled = isEventCancelled(event);
  const futureEvent = !cancelled && daysUntil > 0;
  const countdown = cancelled ? "Plans paused" : daysUntil === 0 ? "It’s event day" : daysUntil < 0 ? "Event day passed" : String(daysUntil);
  const time = event.startTime ? `${event.startTime}${event.endTime ? ` – ${event.endTime}` : ""}` : "Time to be confirmed";
  const currency = event.currency || "NGN";
  const details = [
    { label: "Date & time", icon: CalendarDays, value: formatEventDate(event.date, { day: "numeric", month: "short", year: "numeric" }), detail: time },
    { label: "Location", icon: MapPin, value: formatEventPlace(event), detail: "" },
    { label: "Client / host", icon: UsersRound, value: event.clientName || "Not added yet", detail: client?.email || "" },
    { label: "Guest size", icon: UsersRound, value: event.guestCount ? `${Number(event.guestCount).toLocaleString("en-NG")} guests` : "Not set yet", detail: "" },
  ];

  return (
    <div className="space-y-6">
      <section aria-label="Event details" className="grid overflow-hidden rounded-2xl border border-[#e2e7e2] bg-white shadow-[0_8px_28px_-24px_rgba(20,45,30,.25)] lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col bg-linear-to-br from-white to-[#f9fbf7] p-5 sm:p-7">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 flex-wrap items-center gap-2"><span className="rounded-full bg-[#edf3ec] px-2.5 py-1 text-[0.6875rem] font-semibold text-brand-primary">{event.type}</span><StatusBadge status={cancelled ? "cancelled" : daysUntil < 0 ? "past" : "upcoming"} showDot={false} /></div>
            <EventDetailsEditor event={event} className="shrink-0" />
          </div>
          <h1 className="mt-5 break-words text-[1.65rem] font-semibold leading-tight tracking-[-0.04em] text-text-primary sm:text-[1.9rem]">{event.name}</h1>
          {event.description && <p className="mt-2 line-clamp-2 text-sm leading-6 text-text-secondary">{event.description}</p>}
          <dl className="my-6 grid grid-cols-2 gap-x-4 gap-y-6">
            {details.map(({ label, icon: Icon, value, detail }) => <div key={label} className="flex min-w-0 items-start gap-2.5">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-[#edf3ed] text-[#548164]"><Icon className="size-4" aria-hidden="true" /></span>
              <div className="min-w-0"><dt className="text-[0.6875rem] font-medium leading-4 text-text-secondary">{label}</dt>
              <dd className="mt-1 break-words text-sm font-semibold leading-5 text-text-primary">{value}</dd>
              {detail && <dd className="mt-1 break-words text-[0.6875rem] leading-4 text-text-secondary">{detail}</dd>}</div>
            </div>)}
          </dl>
          <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-[#e6ebe3] pt-4">
            <p className="flex items-baseline gap-2 text-brand-primary">{futureEvent ? <><span className="text-2xl font-semibold tracking-tight tabular-nums">{countdown}</span><span className="text-xs font-medium">{daysUntil === 1 ? "day" : "days"} to go</span></> : <span className="text-sm font-semibold">{countdown}</span>}</p>
            {event.timeZone && <span className="inline-flex items-center gap-1.5 text-[0.6875rem] text-text-secondary"><Clock3 className="size-3.5" aria-hidden="true" />{event.timeZone.replaceAll("_", " ")}</span>}
          </div>
        </div>
        <div className="relative min-h-72 border-t border-[#e2e7df] bg-[#edf0e9] sm:min-h-80 lg:min-h-[340px] lg:border-l lg:border-t-0">
          <button type="button" aria-label={`Open full photo for ${event.name}`} onClick={() => setShowCover(true)} className="absolute inset-0 block w-full focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-brand-primary">
            <Image src={event.image} alt={`Cover photo for ${event.name}`} fill priority unoptimized={isCustomCover(event.image)} sizes="(min-width: 1024px) 42vw, 100vw" className="object-cover" />
          </button>
        </div>
      </section>
      <EventPhotoViewer photo={showCover ? { src: event.image, title: event.name } : null} onClose={() => setShowCover(false)} />

      <section aria-label="Planning at a glance" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <OverviewMetricCard icon={ClipboardCheck} label="Tasks complete" value={`${completed} of ${tasks.length}`} detail={pending.length ? `${pending.length} still to do` : tasks.length ? "Every task is complete" : "Ready for your first task"} tone="sage" progress={tasks.length ? { value: Math.round(completed / tasks.length * 100), label: "Event task completion" } : undefined} className="event-overview-metric" compact />
        <OverviewMetricCard icon={Wallet} label="Estimated budget" value={event.budget ? formatBudgetMoney(Number(event.budget), currency) : "Not set yet"} detail={event.targetBudget ? `Client target · ${formatBudgetMoney(Number(event.targetBudget), currency)}` : "Your working event estimate"} tone="amber" animateCurrency={currency === "NGN"} className="event-overview-metric" compact />
        <OverviewMetricCard icon={UsersRound} label="Vendor bookings" value={booked} detail="Booked budget items" tone="blue" className="event-overview-metric" compact />
        <OverviewMetricCard icon={Scale} label="Open decisions" value={decisions} detail={decisions ? "Ready for your next call" : "No decisions waiting"} tone="lilac" className="event-overview-metric" compact />
      </section>

      <div className="grid items-stretch gap-6 xl:min-h-[440px] xl:grid-cols-[minmax(0,1fr)_380px] 2xl:grid-cols-[minmax(0,1fr)_420px]">
        <section className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-border-subtle bg-white">
          <div className="flex items-center justify-between gap-3 border-b border-border-subtle px-5 py-5 sm:px-6"><div><h2 className="text-base font-semibold tracking-tight">Next on the plan</h2><p className="mt-1 text-xs text-text-secondary">{nextTasks.length ? "Your nearest deadlines and tasks needing attention." : "Give each next step a place."}</p></div><button type="button" onClick={() => onOpenTasks()} className="inline-flex min-h-10 shrink-0 items-center gap-1.5 text-xs font-semibold text-brand-primary hover:underline focus-visible:outline-2 focus-visible:outline-brand-primary">View tasks<ArrowRight className="size-3.5" aria-hidden="true" /></button></div>
          {nextTasks.length ? <ul className="flex flex-1 flex-col divide-y divide-border-subtle">{nextTasks.map((task) => {
            const blocked = taskStatus(task) === "blocked";
            const overdue = Boolean(task.dueDate && task.dueDate < today);
            const milestone = event.taskGroups?.find((group) => group.id === task.groupId);
            return <li key={task.id} className="flex flex-1"><button type="button" onClick={() => onOpenTasks(task.id)} className="group flex w-full items-center gap-3 px-5 py-5 text-left transition-colors hover:bg-[#f8faf8] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-brand-primary sm:gap-4 sm:px-6"><span className={cn("flex size-9 shrink-0 items-center justify-center rounded-xl", blocked ? "bg-[#fff2e5] text-[#a96629]" : "bg-[#edf5ef] text-brand-primary")}><ClipboardCheck className="size-4" aria-hidden="true" /></span><span className="min-w-0 flex-1"><span className="block text-sm font-semibold leading-5 text-text-primary">{task.title}</span><span className="mt-1 block text-xs leading-5 text-text-secondary">{milestone?.title || "Event task"}{task.assignee ? ` · ${task.assignee}` : ""}</span><span className={cn("mt-2 inline-flex rounded-md px-2 py-0.5 text-[0.625rem] font-medium leading-4", blocked || overdue ? "bg-[#fff3e8] text-[#9b632e]" : "bg-[#f1f4f1] text-text-secondary")}>{blocked ? "Blocked · " : ""}{task.dueDate ? `${overdue ? "Overdue" : "Due"} ${formatEventDate(task.dueDate, { day: "numeric", month: "short" })}` : "No due date yet"}</span></span><ArrowRight className="size-4 shrink-0 text-text-tertiary group-hover:text-brand-primary" aria-hidden="true" /></button></li>;
          })}</ul> : <div className="flex min-h-64 flex-1 flex-col items-center justify-center px-6 py-8 text-center"><span className="flex size-12 items-center justify-center rounded-2xl bg-[#edf5ef] text-brand-primary"><Check className="size-5" aria-hidden="true" /></span><p className="mt-4 text-sm font-semibold">{tasks.length ? "You’re all caught up" : "Start with your first milestone"}</p><p className="mt-2 max-w-xs text-xs leading-6 text-text-secondary">{tasks.length ? "All your current tasks are complete. Add the next steps when you’re ready." : "Group the work into milestones, then add tasks and dates to build your plan."}</p></div>}
        </section>
        <EventMoodboardPreview event={event} onOpen={onOpenMoodboard} />
      </div>
    </div>
  );
}
