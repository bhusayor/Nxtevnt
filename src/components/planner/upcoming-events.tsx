"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CalendarDays, CheckCheck, MapPin, NotebookPen, Plus, UsersRound } from "@/components/ui/icons";

import { buttonVariants } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { cn } from "@/lib/utils/cn";
import type { DashboardEvent } from "@/components/planner/overview-data";
import { formatEventDate, getEventNotes, isCustomCover, isEventCancelled, isTaskActive, isTaskComplete, usePlannerEvents, type PlannerEvent } from "@/lib/planner-events";

const tones = {
  sage: { avatar: "bg-success-soft text-success", surface: "bg-[#f1f6f2]", bar: "bg-[#729784]" },
  blue: { avatar: "bg-info-soft text-info", surface: "bg-[#f0f5fa]", bar: "bg-[#7c9fbd]" },
  lilac: { avatar: "bg-[var(--status-lavender-bg)] text-[var(--status-lavender-text)]", surface: "bg-[#f5f2fa]", bar: "bg-[#a38cbc]" },
};

export function DashboardEventCard({ event, featured = false, adaptiveRow = false, featuredLabel = "Your next event" }: { event: DashboardEvent; featured?: boolean; adaptiveRow?: boolean; featuredLabel?: string }) {
  const tone = tones[event.tone];
  const href = `/planner/events/${event.slug}`;
  return (
    <article className={cn("group flex min-w-0 flex-col overflow-hidden rounded-xl border border-border-subtle bg-white shadow-[0_3px_14px_-10px_rgba(28,41,36,0.2)] transition-[border-color,box-shadow] hover:border-border-strong/50 hover:shadow-[var(--shadow-sm)]", featured && "@min-[680px]/events:grid @min-[680px]/events:grid-cols-[44%_56%]", adaptiveRow && "@min-[560px]/events:grid @min-[560px]/events:grid-cols-[38%_62%] @min-[860px]/events:flex @min-[860px]/events:flex-col")}>
      <Link href={href} className={cn("relative block h-48 overflow-hidden", featured && "h-56 @min-[680px]/events:h-full @min-[680px]/events:min-h-80", adaptiveRow && "@min-[560px]/events:h-full @min-[860px]/events:h-48")}>
        <Image src={event.image} alt={event.alt} fill priority={featured} unoptimized={isCustomCover(event.image)} sizes={featured ? "(min-width: 1024px) 40vw, 100vw" : "(min-width: 1200px) 30vw, (min-width: 768px) 45vw, 100vw"} className="object-cover" style={{ objectPosition: event.position }} />
        <span className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/5 to-black/10" aria-hidden="true" />
        <span className="absolute top-4 left-4 flex size-12 flex-col items-center justify-center rounded-lg bg-white/95 text-text-primary shadow-sm"><span className="text-[0.5625rem] font-semibold uppercase tracking-widest">{event.month}</span><span className="text-xl font-semibold leading-6 tracking-tight">{event.day}</span></span>
        <span className="absolute top-4 right-4"><StatusBadge status={event.status} showDot={false} /></span>
        <span className="absolute right-4 bottom-4 left-4 flex items-center justify-between gap-2 text-white"><span className="text-xs font-medium">{event.type}</span><span className="rounded-full border border-white/30 bg-black/15 px-2.5 py-1 text-[0.625rem] backdrop-blur-sm">{event.countdown}</span></span>
      </Link>
      <div className={cn("flex min-w-0 flex-1 flex-col p-5", featured && "@min-[680px]/events:justify-center @min-[680px]/events:p-7")}>
        {featured && <p className="mb-2 text-[0.625rem] font-semibold uppercase tracking-[0.12em] text-brand-primary">{featuredLabel}</p>}
        <h3 className={cn("min-w-0 text-base font-semibold tracking-[-0.025em] text-text-primary", featured && "text-xl")}><Link href={href} className="hover:text-brand-primary">{event.name}</Link></h3>
        <p className="mt-2 flex items-start gap-1.5 text-xs leading-5 text-text-secondary"><MapPin className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />{event.location}</p>
        <div className="mt-3 flex min-h-6 items-center gap-2">{event.client !== "Personal event" && <><span className={cn("flex size-6 items-center justify-center rounded-full text-[0.5625rem] font-semibold", tone.avatar)}>{event.initials}</span><p className="text-xs text-text-secondary"><span className="text-text-tertiary">Client · </span>{event.client}</p></>}</div>
        {featured && <div className="mt-5 grid grid-cols-2 gap-3"><div className={cn("rounded-lg p-3", tone.surface)}><CheckCheck className="mb-1.5 size-4 text-brand-primary" aria-hidden="true" /><p className="text-sm font-semibold">{event.tasks}</p><p className="mt-0.5 text-[0.6875rem] text-text-secondary">Tasks complete</p></div><div className={cn("rounded-lg p-3", tone.surface)}>{event.secondaryLabel === "Notes" ? <NotebookPen className="mb-1.5 size-4 text-brand-primary" aria-hidden="true" /> : <UsersRound className="mb-1.5 size-4 text-brand-primary" aria-hidden="true" />}<p className="text-sm font-semibold">{event.secondaryValue}</p><p className="mt-0.5 text-[0.6875rem] text-text-secondary">{event.secondaryLabel}</p></div></div>}
        <div className="mt-4"><div className="mb-2 flex items-center justify-between text-[0.6875rem]"><span className="text-text-tertiary">Planning progress</span><span className="font-semibold text-text-primary">{event.progress}%</span></div><div className="h-1.5 overflow-hidden rounded-full bg-[#f0f1ef]" role="progressbar" aria-label={`${event.name} planning progress`} aria-valuenow={event.progress} aria-valuemin={0} aria-valuemax={100}><div className={cn("h-full rounded-full", tone.bar)} style={{ width: `${event.progress}%` }} /></div></div>
        <div className="mt-auto pt-4"><Link href={event.status === "cancelled" ? href : `${href}?section=tasks`} className={cn("block rounded-lg px-3 py-2.5 transition-colors hover:bg-surface-selected", tone.surface)}><span className="min-w-0"><span className="block text-[0.5625rem] font-semibold uppercase tracking-wider text-text-tertiary">{event.status === "cancelled" ? "Event status" : "Next action"}</span><span className="mt-0.5 block text-xs font-medium text-text-primary">{event.status === "cancelled" ? "View saved event details" : event.next}</span></span></Link></div>
      </div>
    </article>
  );
}

export function asDashboardEvent(event: PlannerEvent): DashboardEvent {
  const date = new Date(`${event.date}T12:00:00`);
  const today = new Date().toLocaleDateString("sv-SE");
  const daysUntil = Math.round((date.getTime() - new Date(`${today}T12:00:00`).getTime()) / 86_400_000);
  const tasks = (event.sections.tasks ?? []).filter(isTaskActive);
  const completed = tasks.filter(isTaskComplete).length;
  const client = event.clientName || "Personal event";
  return {
    slug: event.id,
    name: event.name,
    type: event.type,
    date: formatEventDate(event.date),
    day: new Intl.DateTimeFormat("en-NG", { day: "2-digit" }).format(date),
    month: new Intl.DateTimeFormat("en-NG", { month: "short" }).format(date),
    location: event.location || "Venue to be confirmed",
    client,
    progress: tasks.length ? Math.round(completed / tasks.length * 100) : 0,
    next: tasks.find((task) => !isTaskComplete(task))?.title || (tasks.length ? "All tasks complete" : "Add your first task"),
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
  const today = !events && storedEvents.length ? new Date().toLocaleDateString("sv-SE") : "";
  const liveEvents = storedEvents
    .filter((event) => !isEventCancelled(event) && event.date >= today)
    .sort((first, second) => first.date.localeCompare(second.date))
    .map(asDashboardEvent);
  const source = events ?? liveEvents;
  const visibleEvents = source.slice(0, 3);
  const count = visibleEvents.length;
  return (
    <section className="@container/events min-w-0" aria-labelledby="upcoming-events-title">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5"><h2 id="upcoming-events-title" className="text-lg font-semibold tracking-[-0.025em] text-text-primary">Upcoming events</h2><span className="flex size-6 items-center justify-center rounded-full bg-white text-[0.6875rem] font-semibold text-text-secondary ring-1 ring-border-subtle">{source.length}</span></div>
        {count > 0 && <Link href="/planner/events" className="inline-flex min-h-9 items-center gap-1.5 text-xs font-semibold text-text-secondary hover:text-brand-primary">View all <ArrowRight aria-hidden="true" className="size-3.5" /></Link>}
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
    </section>
  );
}
