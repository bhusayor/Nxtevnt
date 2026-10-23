"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CalendarDays, ClipboardCheck, MapPin, NotebookPen, Plus } from "@/components/ui/icons";
import { EventCardProgress } from "@/components/planner/event-card-progress";
import { EventWeatherPill } from "./event-weather-pill";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import type { DashboardEvent } from "@/components/planner/overview-data";
import { formatEventDate, formatEventPlace, getEventNotes, isCustomCover, isEventCancelled, isTaskActive, isTaskComplete, usePlannerEvents, type PlannerEvent } from "@/lib/planner-events";
import { eventDayOffset, isForecastWindow, localEventToday } from "@/lib/event-weather";

const tones = {
  sage: { avatar: "bg-success-soft text-success", surface: "bg-[#f1f6f2]", bar: "bg-[#729784]" },
  blue: { avatar: "bg-info-soft text-info", surface: "bg-[#f0f5fa]", bar: "bg-[#7c9fbd]" },
  lilac: { avatar: "bg-[var(--status-lavender-bg)] text-[var(--status-lavender-text)]", surface: "bg-[#f5f2fa]", bar: "bg-[#a38cbc]" },
};

export function DashboardEventCard({ event, featured = false, adaptiveRow = false, featuredLabel = "Your next event" }: { event: DashboardEvent; featured?: boolean; adaptiveRow?: boolean; featuredLabel?: string }) {
  const tone = tones[event.tone];
  const href = `/planner/events/${event.slug}`;
  const tasksComplete = event.tasksComplete ?? event.progress === 100;
  const taskHref = `${href}?section=tasks${event.nextTaskId ? `&task=${encodeURIComponent(event.nextTaskId)}` : ""}`;
  const imageSizes = featured ? "(min-width: 1024px) 40vw, 100vw" : "(min-width: 1200px) 30vw, (min-width: 768px) 45vw, 100vw";
  return (
    <article className={cn("group relative isolate flex min-w-0 flex-col overflow-hidden rounded-xl border border-border-subtle bg-white shadow-[0_3px_14px_-10px_rgba(28,41,36,0.2)] transition-[border-color,box-shadow] hover:border-border-strong/50 hover:shadow-[var(--shadow-sm)]", featured && "@min-[680px]/events:grid @min-[680px]/events:grid-cols-[44%_56%]", adaptiveRow && "@min-[560px]/events:grid @min-[560px]/events:grid-cols-[38%_62%] @min-[860px]/events:flex @min-[860px]/events:flex-col")}>
      <div className={cn("relative block h-60 overflow-hidden bg-[#29372f] sm:h-64", featured && "h-72 sm:h-80 @min-[680px]/events:h-full @min-[680px]/events:min-h-96", adaptiveRow && "@min-[560px]/events:h-full @min-[860px]/events:h-64")}>
        <Image src={event.image} alt={event.alt} fill preload={featured} unoptimized={isCustomCover(event.image)} sizes={imageSizes} className="object-cover" style={{ objectPosition: event.position }} />
        <span className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-black/10" aria-hidden="true" />
        <span className="absolute top-4 left-4 flex size-12 flex-col items-center justify-center rounded-lg bg-white/95 text-text-primary shadow-sm"><span className="text-xs font-semibold uppercase tracking-widest">{event.month}</span><span className="text-xl font-semibold leading-6 tracking-tight">{event.day}</span></span>
        <span className="absolute top-4 right-4 max-w-[calc(100%-6rem)]"><EventWeatherPill date={event.dateISO} city={event.weatherCity} timeZone={event.timeZone} status={event.status} /></span>
        <span className="absolute right-4 bottom-4 left-4 flex items-center justify-between gap-2 text-white"><span className="text-sm font-medium">{event.type}</span><span className="rounded-full border border-white/30 bg-black/15 px-2.5 py-1 text-xs backdrop-blur-sm">{event.countdown}</span></span>
      </div>
      <div className={cn("flex min-w-0 flex-1 flex-col p-5", featured && "@min-[680px]/events:justify-center @min-[680px]/events:p-7")}>
        {featured && <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-brand-primary">{featuredLabel}</p>}
        <h3 className={cn("min-w-0 text-base font-semibold tracking-[-0.025em] text-text-primary", featured && "text-xl")}><Link href={href} aria-label={`Open event: ${event.name}`} className="after:absolute after:inset-0 after:z-10 after:rounded-xl hover:text-brand-primary focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-inset focus-visible:after:ring-brand-primary">{event.name}</Link></h3>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm text-text-secondary"><p className="flex min-w-0 items-start gap-1.5 leading-5"><MapPin className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />{event.location}</p>{event.client !== "Personal event" && <div className="flex min-w-0 items-center gap-1.5"><span className={cn("flex size-5 shrink-0 items-center justify-center rounded-full text-xs font-semibold", tone.avatar)}>{event.initials}</span><p className="min-w-0 truncate"><span className="text-text-tertiary">Client · </span>{event.client}</p></div>}</div>
        <EventCardProgress event={event} />
        <div className="mt-auto pt-3"><Link href={event.status === "cancelled" ? href : taskHref} aria-label={event.status === "cancelled" ? `View saved event: ${event.name}` : tasksComplete ? `Task completed: review tasks for ${event.name}` : `Next task for ${event.name}: ${event.next}`} className={cn("relative z-20 flex min-h-14 items-center justify-between gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-surface-selected focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary", tone.surface)}><span className="min-w-0"><span className="block text-xs font-semibold uppercase tracking-wider text-text-tertiary">{event.status === "cancelled" ? "Event status" : tasksComplete ? "Task completed" : "Next task"}</span><span className="mt-0.5 block text-sm font-medium text-text-primary">{event.status === "cancelled" ? "View saved event details" : tasksComplete ? "All tasks are done" : event.next}</span>{event.nextTaskDueDate && !tasksComplete && event.status !== "cancelled" && <time dateTime={event.nextTaskDueDate} className={cn("mt-1 block text-xs", event.nextTaskOverdue ? "font-semibold text-error" : "text-text-secondary")}>{event.nextTaskOverdue ? "Overdue" : "Due"} {formatEventDate(event.nextTaskDueDate, { day: "numeric", month: "short", year: "numeric" })}</time>}</span><ArrowRight className="size-4 shrink-0 text-brand-primary" aria-hidden="true" /></Link></div>
        <div className="relative z-20 mt-3 flex items-center gap-2" aria-label={`Actions for ${event.name}`}>
          <Link href={href} className={cn(buttonVariants({ size: "sm" }), "min-h-10 min-w-0 flex-1 justify-between text-sm")}>Open event<ArrowRight className="size-4 shrink-0" aria-hidden="true" /></Link>
          {event.status !== "cancelled" ? <><Link href={`${href}?section=tasks&action=add-task`} aria-label={`Add task to ${event.name}`} title="Add task" className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-border-default bg-white text-brand-primary hover:bg-surface-selected"><ClipboardCheck className="size-[18px]" aria-hidden="true" /></Link><Link href={`${href}?section=notes&action=write`} aria-label={`Write a note for ${event.name}`} title="Write a note" className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-border-default bg-white text-brand-primary hover:bg-surface-selected"><NotebookPen className="size-[18px]" aria-hidden="true" /></Link></> : <><button type="button" disabled title="Reopen the event to add tasks" aria-label="Add task unavailable for cancelled event" className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-border-subtle text-text-disabled"><ClipboardCheck className="size-[18px]" /></button><button type="button" disabled title="Reopen the event to write notes" aria-label="Write a note unavailable for cancelled event" className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-border-subtle text-text-disabled"><NotebookPen className="size-[18px]" /></button></>}
        </div>
      </div>
    </article>
  );
}

export function asDashboardEvent(event: PlannerEvent): DashboardEvent {
  const date = new Date(`${event.date}T12:00:00`);
  const today = localEventToday(event.timeZone);
  const daysUntil = eventDayOffset(event.date, today);
  const tasks = (event.sections.tasks ?? []).filter(isTaskActive);
  const completed = tasks.filter(isTaskComplete).length;
  const nextTask = tasks.filter((task) => !isTaskComplete(task)).sort((a, b) => (a.dueDate || "9999").localeCompare(b.dueDate || "9999") || Number(b.priority === "high") - Number(a.priority === "high"))[0];
  const client = event.clientName || "Personal event";
  return {
    slug: event.id,
    name: event.name,
    type: event.type,
    date: formatEventDate(event.date),
    day: new Intl.DateTimeFormat("en-NG", { day: "2-digit" }).format(date),
    month: new Intl.DateTimeFormat("en-NG", { month: "short" }).format(date),
    location: formatEventPlace(event),
    client,
    progress: tasks.length ? Math.round(completed / tasks.length * 100) : 0,
    next: nextTask?.title || (tasks.length ? "Task completed" : "Add your first task"),
    nextTaskId: nextTask?.id,
    nextTaskDueDate: nextTask?.dueDate,
    nextTaskOverdue: Boolean(nextTask?.dueDate && nextTask.dueDate < today),
    dateISO: event.date,
    weatherCity: event.city || "",
    timeZone: event.timeZone,
    tasksComplete: tasks.length > 0 && completed === tasks.length,
    image: event.image,
    alt: `${event.type} event cover`,
    status: isEventCancelled(event) ? "cancelled" : daysUntil < 0 ? "past" : "upcoming",
    tone: "sage",
    initials: client.split(/\s+/).slice(0, 2).map((word) => word[0]?.toUpperCase()).join(""),
    countdown: isEventCancelled(event) ? "Cancelled" : daysUntil < 0 ? `${Math.abs(daysUntil)} ${daysUntil === -1 ? "day" : "days"} ago` : daysUntil === 0 ? "Today" : daysUntil === 1 ? "Tomorrow" : `${daysUntil} days to go`,
    tasks: `${completed} of ${tasks.length}`,
    secondaryValue: getEventNotes(event).length ? String(getEventNotes(event).length) : "None yet",
    secondaryLabel: "Notes",
    position: "center",
  };
}

export function UpcomingEvents({ events }: { events?: readonly DashboardEvent[] }) {
  const storedEvents = usePlannerEvents();
  const liveEvents = storedEvents
    .filter((event) => !isEventCancelled(event) && event.date >= localEventToday(event.timeZone))
    .sort((first, second) => first.date.localeCompare(second.date))
    .map(asDashboardEvent);
  const source = events ?? liveEvents;
  const visibleEvents = source.slice(0, 3);
  const count = visibleEvents.length;
  return (
    <section className="@container/events min-w-0" aria-labelledby="upcoming-events-title">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5"><h2 id="upcoming-events-title" className="text-lg font-semibold tracking-[-0.025em] text-text-primary">Upcoming events</h2><span className="flex size-6 items-center justify-center rounded-full bg-white text-xs font-semibold text-text-secondary ring-1 ring-border-subtle">{source.length}</span></div>
        {count > 0 && <Link href="/planner/events" className="inline-flex min-h-9 items-center gap-1.5 text-sm font-semibold text-text-secondary hover:text-brand-primary">View all <ArrowRight aria-hidden="true" className="size-3.5" /></Link>}
      </div>
      {count === 0 ? (
        <div className="grid overflow-hidden rounded-xl border border-border-subtle bg-white @min-[680px]/events:grid-cols-[40%_60%]">
          <div className="relative h-44 @min-[680px]/events:h-full @min-[680px]/events:min-h-64"><Image src="/images/auth/wedding-reception.jpg" alt="A reception venue ready for its guests" fill priority sizes="(min-width: 768px) 35vw, 100vw" className="object-cover" /></div>
          <div className="flex flex-col justify-center p-6 @min-[680px]/events:p-8"><span className="flex size-10 items-center justify-center rounded-lg bg-success-soft text-success"><CalendarDays className="size-5" aria-hidden="true" /></span><h3 className="mt-4 text-xl font-semibold tracking-tight">No upcoming events yet</h3><p className="mt-2 max-w-md text-sm leading-6 text-text-secondary">Create your first event to see it here. You can add the name, type and date now, then build the plan at your own pace.</p><Link href="/planner/create-event" className={cn(buttonVariants({ size: "md" }), "mt-5 w-fit")}><Plus className="size-4" aria-hidden="true" />Create event</Link></div>
        </div>
      ) : (
        <div className={cn("grid gap-5", count === 2 && "@min-[600px]/events:grid-cols-2", count === 3 && "@min-[860px]/events:grid-cols-3")}>
          {visibleEvents.map((event) => <DashboardEventCard key={event.slug} event={event} featured={count === 1} adaptiveRow={count === 3} />)}
        </div>
      )}
      {visibleEvents.some((event) => event.weatherCity && event.dateISO && isForecastWindow(event.dateISO, localEventToday(event.timeZone))) && <p className="mt-3 text-xs text-text-tertiary">Weather source: <a href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer" className="underline hover:text-brand-primary">Open-Meteo</a> · Forecasts may change.</p>}
    </section>
  );
}
