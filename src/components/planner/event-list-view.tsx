"use client";

import Image from "next/image";
import Link from "next/link";
import { CalendarDays, MapPin } from "@/components/ui/icons";
import { EventRowActions } from "./event-row-actions";
import { eventExpiryDate } from "@/lib/event-browsing";
import { formatEventDate, isCustomCover, isEventCancelled, type PlannerEvent } from "@/lib/planner-events";
import { cn } from "@/lib/utils/cn";

const columns = "@min-[960px]/events:grid-cols-[minmax(210px,2fr)_minmax(110px,1fr)_minmax(120px,1fr)_100px_120px_56px]";

export function EventListView({ events, today }: { events: readonly PlannerEvent[]; today: string }) {
  return <section className="overflow-hidden rounded-xl border border-border-subtle bg-white" aria-label="Events list">
    <div className={cn("hidden gap-4 border-b border-border-subtle bg-[#f8faf8] px-5 py-3 text-[0.625rem] font-semibold uppercase tracking-[0.1em] text-text-tertiary @min-[960px]/events:grid", columns)}>
      <span>Event</span><span>Date</span><span>Location</span><span>Status</span><span>Event expiration</span><span className="text-right">Actions</span>
    </div>
    <div className="divide-y divide-border-subtle">{events.map(event => {
      const cancelled = isEventCancelled(event);
      const completed = !cancelled && event.date < today;
      const expiry = eventExpiryDate(event);
      const expired = expiry != null && expiry < today;
      return <article key={event.id} className={cn("group grid min-w-0 gap-3 px-4 py-4 transition-colors hover:bg-[#fbfcfb] sm:px-5 @min-[960px]/events:items-center @min-[960px]/events:gap-4", columns)}>
        <Link href={`/planner/events/${event.id}`} className="flex min-w-0 items-center gap-3 rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary">
          <span className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-[#e8eee9]"><Image src={event.image} alt="" fill unoptimized={isCustomCover(event.image)} sizes="56px" className={cn("object-cover", completed && "grayscale opacity-75")} /></span>
          <span className="min-w-0"><span className={cn("block truncate text-sm font-semibold text-text-primary group-hover:text-brand-primary", completed && "text-text-secondary")}>{event.name}</span><span className="mt-1 block truncate text-xs text-text-secondary">{event.type}{event.clientName ? ` · ${event.clientName}` : ""}</span></span>
        </Link>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-secondary @min-[960px]/events:block"><span className="inline-flex items-center gap-1.5 @min-[960px]/events:block"><CalendarDays className="size-3.5 @min-[960px]/events:hidden" aria-hidden="true" />{formatEventDate(event.date, { day: "numeric", month: "short", year: "numeric" })}</span>{event.startTime && <span className="text-text-tertiary @min-[960px]/events:mt-1 @min-[960px]/events:block">{event.startTime}</span>}</div>
        <p className="inline-flex min-w-0 items-center gap-1.5 truncate text-xs text-text-secondary"><MapPin className="size-3.5 shrink-0 @min-[960px]/events:hidden" aria-hidden="true" />{[event.location, event.city].filter(Boolean).join(", ") || "Location to be confirmed"}</p>
        <span className={cn("w-fit rounded-full px-2.5 py-1 text-[0.6875rem] font-semibold", cancelled ? "bg-[#fcf2f2] text-[#a34c4c]" : completed ? "bg-[#eef0ee] text-[#606862]" : "bg-[#eaf3ed] text-brand-primary")}>{cancelled ? "Cancelled" : completed ? "Completed" : "Upcoming"}</span>
        <div className="text-xs"><span className="mr-2 text-text-tertiary @min-[960px]/events:hidden">Event expiration</span>{expiry ? <time dateTime={expiry} className={cn(expired ? "text-error" : "text-text-secondary")}>{formatEventDate(expiry, { day: "numeric", month: "short", year: "numeric" })}</time> : <span className="text-text-tertiary">Not set</span>}{expired && <span className="ml-1 text-[0.625rem] text-error">Expired</span>}</div>
        <div className="flex items-center justify-end"><EventRowActions event={event} /></div>
      </article>;
    })}</div>
  </section>;
}
