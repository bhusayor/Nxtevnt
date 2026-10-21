"use client";

import { useState } from "react";
import { Select } from "@/components/ui/select";
import { AgendaTable } from "./agenda-views";
import { ClientReadySchedule } from "./client-ready-schedule";
import { useBrowserReady, usePlannerEvents } from "@/lib/planner-events";
import { agendaForAudience, agendaTracks, type AgendaTrack } from "@/lib/event-agenda";

export function RecipientAgendaPreview({ role }: { role: "client" | "vendor" }) {
  const events = usePlannerEvents(), ready = useBrowserReady();
  const [vendor, setVendor] = useState("");
  const vendors = [...new Set(events.flatMap((event) => event.agendaSharing?.vendorRecipients || []))].sort(), selectedVendor = vendor || vendors[0];
  const schedules = events.filter((event) => !event.cancelledAt).flatMap((event) => (role === "client" ? ["program", "vendor", "ready"] : ["vendor"]).map((track) => ({ event, track: track as AgendaTrack, items: agendaForAudience(event, track as AgendaTrack, role, selectedVendor) }))).filter(({ event, track, items }) => items.length || role === "client" && track === "ready" && Boolean(event.agendaSharing?.readyPublishedAt));
  if (!ready || role === "client" && !schedules.length || role === "vendor" && !vendors.length) return null;
  return <section className="mx-auto mb-8 max-w-6xl space-y-4"><header className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-[0.625rem] font-semibold uppercase tracking-wider text-brand-primary">{role} preview · Event schedules</p><h2 className="mt-1 text-xl font-semibold">{role === "client" ? "Your event, at a glance" : "Your setup & service windows"}</h2><p className="mt-2 text-xs leading-5 text-text-secondary">Local preview only. These are not authenticated recipient accounts. Internal notes are never displayed here.</p></div>{role === "vendor" && <div className="w-60"><Select label="Preview as vendor / team" value={selectedVendor} onValueChange={setVendor} options={vendors.map((value) => ({ value, label: value }))} /></div>}</header>{schedules.length ? schedules.map(({ event, track, items }) => <section key={`${event.id}-${track}`} className="space-y-3"><div><h3 className="text-sm font-semibold">{event.name}</h3><p className="mt-1 text-xs text-text-tertiary">{agendaTracks[track].title} · {event.timeZone || "Africa/Lagos"}</p></div>{role === "client" && track === "ready" ? <ClientReadySchedule event={event} items={items} /> : <>{role === "vendor" && event.agendaSharing?.vendorMessage && <p className="whitespace-pre-wrap rounded-xl border border-border-subtle bg-white p-4 text-xs leading-6"><span className="mb-1 block font-semibold">From your planner</span>{event.agendaSharing.vendorMessage}</p>}<AgendaTable items={items} track={track} eventDate={event.date} internal={false} /></>}</section>) : <p className="rounded-xl border border-border-subtle bg-white p-6 text-xs text-text-secondary">No activities are currently shared with this team.</p>}</section>;
}
