import type { EventItem, PlannerEvent } from "./planner-events";

export type AgendaTrack = "program" | "vendor" | "ready";
export type AgendaVisibility = "planner" | "client" | "guests" | "priority" | "vendors";
export type SetupStatus = "tentative" | "confirmed" | "in-progress" | "completed" | "delayed" | "needs-attention";
export type AgendaFields = {
  track: AgendaTrack; date: string; dayOffset?: number; duration: number;
  visibility: AgendaVisibility; location?: string; personnel?: string; clientInvolvement?: string;
  vendorTeam?: string; personGroup?: string; responsible?: string; setupStatus?: SetupStatus;
  internalNotes?: string; externalDescription?: string; updatedAt?: string;
};
export type AgendaDelivery = "email" | "whatsapp" | "sms";
export type AgendaVendorContact = { vendor: string; name?: string; category?: string; email?: string; whatsapp?: string; phone?: string };
export type AgendaShareOptions = { clientAccess?: "view" | "edit"; clientNote?: string; deliveryMethod?: AgendaDelivery; vendorMessage?: string; vendorContacts?: AgendaVendorContact[] };
export type AgendaSharing = AgendaShareOptions & { readyPublishedAt?: string; vendorSharedAt?: string; vendorRecipients?: string[]; delivery?: "local-preview" };
export type AgendaActivity = EventItem & { time: string; agenda: AgendaFields };
export const agendaTracks = {
  program: { title: "Event Program", subtitle: "Shape the moments your guests will remember.", action: "Add activity", empty: "Build the flow of your event", description: "Arrivals, entrances, speeches and everything in between." },
  vendor: { title: "Vendor Setup Timeline", subtitle: "Bring every arrival, setup and handover into one clear plan.", action: "Add setup task", empty: "Get every team on the same timeline", description: "Plan vendor arrivals, setup deadlines and service windows." },
  ready: { title: "Get Ready Timeline", subtitle: "A calm, coordinated start for the people at the heart of the event.", action: "Add activity", empty: "Make room for a smooth start", description: "Coordinate preparation, dressing, portraits and the people involved." },
} as const;
export const agendaVisibilities = { planner: "Planner only", client: "Planner + Client", guests: "Guest facing", priority: "Priority guests", vendors: "Selected vendors" } as const;
export const setupStatuses = { tentative: "Tentative", confirmed: "Confirmed", completed: "Completed", delayed: "Delayed", "needs-attention": "Needs attention", "in-progress": "In progress (legacy)" } as const;
export const setupStatusOptions = Object.entries(setupStatuses).filter(([value]) => value !== "in-progress").map(([value, label]) => ({ value: value as SetupStatus, label }));
export function vendorDeliveryAvailable(contact: AgendaVendorContact | undefined, method: AgendaDelivery) {
  if (method === "email") return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact?.email?.trim() || "");
  const value = method === "whatsapp" ? contact?.whatsapp : contact?.phone;
  return Boolean(value && /^[+\d\s().-]+$/.test(value) && value.replace(/\D/g, "").length >= 6 && value.replace(/\D/g, "").length <= 20);
}
export function agendaVendorNames(event: PlannerEvent) { return [...new Set(eventAgenda(event).filter((item) => item.agenda.track === "vendor" && item.agenda.visibility === "vendors").map((item) => item.agenda.vendorTeam?.trim()).filter((name): name is string => Boolean(name)))].sort(); }
export function trackVisibilities(track: AgendaTrack) { return (Object.keys(agendaVisibilities) as AgendaVisibility[]).filter((value) => track === "vendor" ? ["planner", "client", "vendors"].includes(value) : value !== "vendors"); }
export function validAgendaDate(value: string) { const parsed = new Date(`${value}T12:00:00Z`); return /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value; }
export function shiftAgendaDate(date: string, offset: number) { if (!validAgendaDate(date)) return ""; const value = new Date(`${date}T12:00:00Z`); value.setUTCDate(value.getUTCDate() + offset); return value.toISOString().slice(0, 10); }
export function agendaDateOffset(date: string, base: string) { return Math.round((Date.parse(`${date}T12:00:00Z`) - Date.parse(`${base}T12:00:00Z`)) / 86400000); }
export function timeMinutes(time: string) { if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) return -1; const [hour, minute] = time.split(":").map(Number); return hour * 60 + minute; }
export function clockLabel(minutes: number) { if (minutes < 0) return "Time not set"; const total = minutes % 1440, hour = Math.floor(total / 60), days = Math.floor(minutes / 1440); return `${hour % 12 || 12}:${String(total % 60).padStart(2, "0")} ${hour < 12 ? "AM" : "PM"}${days ? ` (+${days} ${days === 1 ? "day" : "days"})` : ""}`; }
export function agendaTimeRange(item: AgendaActivity) { const start = timeMinutes(item.time); return start < 0 ? "Time not set" : `${clockLabel(start)} – ${clockLabel(start + item.agenda.duration)}`; }
export function agendaDateLabel(date: string) { return validAgendaDate(date) ? new Date(`${date}T12:00:00Z`).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }) : "Date not set"; }
export function relativeAgendaDay(date: string, eventDate: string) { const difference = agendaDateOffset(date, eventDate); return difference === 0 ? "Event day" : difference === -1 ? "Day before" : difference === 1 ? "Day after" : "Additional day"; }

/** Legacy agenda lines are adapted only on read, with their old details kept private. */
export function eventAgenda(event: PlannerEvent): AgendaActivity[] {
  return event.sections.agenda.map((item) => {
    const agenda: AgendaFields = item.agenda ? { ...item.agenda, date: item.agenda.dayOffset !== undefined ? shiftAgendaDate(event.date, item.agenda.dayOffset) : item.agenda.date } : { track: "program", date: event.date, dayOffset: 0, duration: 30, visibility: "planner", internalNotes: item.detail };
    return { ...item, time: item.time || "", agenda };
  }).sort((a, b) => a.agenda.date.localeCompare(b.agenda.date) || timeMinutes(a.time) - timeMinutes(b.time));
}
export type AgendaFilters = { search?: string; date?: string; visibility?: string; status?: string };
export function filterAgenda(items: AgendaActivity[], track: AgendaTrack, filters: AgendaFilters = {}) {
  const query = filters.search?.trim().toLocaleLowerCase();
  return items.filter((item) => item.agenda.track === track && (!filters.date || filters.date === "all" || item.agenda.date === filters.date) && (!filters.visibility || filters.visibility === "all" || item.agenda.visibility === filters.visibility) && (track !== "vendor" || !filters.status || filters.status === "all" || (item.agenda.setupStatus || "tentative") === filters.status) && (!query || [item.title, item.agenda.location, item.agenda.vendorTeam, item.agenda.personGroup, item.agenda.personnel, item.agenda.responsible, item.agenda.clientInvolvement, item.agenda.internalNotes, item.agenda.externalDescription].some((value) => value?.toLocaleLowerCase().includes(query))));
}
export function agendaGroups(items: AgendaActivity[]) { return [...new Set(items.map((item) => item.agenda.date))].sort().map((date) => ({ date, items: items.filter((item) => item.agenda.date === date) })); }
export function agendaConflicts(items: AgendaActivity[]) {
  const conflicts = new Set<string>();
  for (let i = 0; i < items.length; i++) for (let j = i + 1; j < items.length; j++) {
    const a = items[i], b = items[j], startA = timeMinutes(a.time), startB = timeMinutes(b.time);
    if (startA < 0 || startB < 0) continue;
    const sameTrack = a.agenda.track === b.agenda.track;
    const resourceA = (a.agenda.responsible || a.agenda.personnel || a.agenda.personGroup || a.agenda.vendorTeam || "").trim().toLocaleLowerCase();
    const resourceB = (b.agenda.responsible || b.agenda.personnel || b.agenda.personGroup || b.agenda.vendorTeam || "").trim().toLocaleLowerCase();
    if (!sameTrack || a.agenda.track !== "program" && (!resourceA || resourceA !== resourceB)) continue;
    const absoluteA = Date.parse(`${a.agenda.date}T00:00:00Z`) / 60000 + startA, absoluteB = Date.parse(`${b.agenda.date}T00:00:00Z`) / 60000 + startB;
    if (absoluteA < absoluteB + b.agenda.duration && absoluteB < absoluteA + a.agenda.duration) { conflicts.add(a.id); conflicts.add(b.id); }
  }
  return conflicts;
}
function assertEditable(event: PlannerEvent) { if (event.cancelledAt) throw new Error("Reopen this event before changing its schedule."); }
export function saveAgendaActivity(event: PlannerEvent, input: AgendaActivity, at: string, editing = false, expectedRevision?: string): PlannerEvent {
  assertEditable(event);
  const existing = event.sections.agenda.find((item) => item.id === input.id);
  if (!input.id || editing && !existing || !editing && existing) throw new Error(editing ? "This activity no longer exists." : "This activity has already been added.");
  if (editing && existing?.agenda?.updatedAt !== expectedRevision) throw new Error("This activity changed. Reopen it before editing.");
  const a = input.agenda;
  if (!a || !Object.hasOwn(agendaTracks, a.track)) throw new Error("Choose a schedule for this activity.");
  if (editing && (existing?.agenda?.track || "program") !== a.track) throw new Error("This activity belongs to another schedule.");
  if (!input.title.trim() || input.title.trim().length > 160) throw new Error("Give the activity a title of 1–160 characters.");
  if (!validAgendaDate(a.date) || a.dayOffset !== undefined && (!Number.isInteger(a.dayOffset) || a.dayOffset < -3650 || a.dayOffset > 3650)) throw new Error("Choose a valid activity date.");
  if (timeMinutes(input.time) < 0) throw new Error("Choose a valid start time.");
  if (!Number.isInteger(a.duration) || a.duration < 1 || a.duration > 1440) throw new Error("Duration must be 1–1,440 minutes.");
  if (!trackVisibilities(a.track).includes(a.visibility)) throw new Error("Choose a visibility available for this schedule.");
  if (a.track === "vendor" && a.setupStatus && !Object.hasOwn(setupStatuses, a.setupStatus)) throw new Error("Choose a valid setup status.");
  for (const field of [a.location, a.personnel, a.clientInvolvement, a.vendorTeam, a.personGroup, a.responsible]) if ((field?.length || 0) > 200) throw new Error("Keep names and locations within 200 characters.");
  if ((a.internalNotes?.length || 0) > 2000 || (a.externalDescription?.length || 0) > 2000) throw new Error("Keep each note or description within 2,000 characters.");
  const clean = Object.fromEntries(Object.entries(a).map(([key, value]) => [key, typeof value === "string" ? value.trim() : value])) as AgendaFields;
  const item = { ...existing, ...input, title: input.title.trim(), agenda: { ...clean, updatedAt: at } };
  return { ...event, sections: { ...event.sections, agenda: editing ? event.sections.agenda.map((entry) => entry.id === item.id ? item : entry) : [...event.sections.agenda, item] } };
}
export function removeAgendaActivity(event: PlannerEvent, id: string, expectedRevision?: string) {
  assertEditable(event); const existing = event.sections.agenda.find((item) => item.id === id);
  if (!existing) throw new Error("This activity no longer exists.");
  if (existing.agenda?.updatedAt !== expectedRevision) throw new Error("This activity changed. Reopen it before deleting.");
  return { ...event, sections: { ...event.sections, agenda: event.sections.agenda.filter((item) => item.id !== id) } };
}
export function updateSetupStatus(event: PlannerEvent, id: string, status: SetupStatus, at: string) {
  const item = eventAgenda(event).find((entry) => entry.id === id && entry.agenda.track === "vendor");
  if (!item) throw new Error("This setup activity no longer exists.");
  return saveAgendaActivity(event, { ...item, agenda: { ...item.agenda, setupStatus: status } }, at, true, item.agenda.updatedAt);
}
export function setAgendaSharing(event: PlannerEvent, track: "ready" | "vendor", enabled: boolean, at: string, recipients: string[] = [], options: AgendaShareOptions = {}) {
  assertEditable(event);
  if (track === "vendor") {
    const available = new Set(agendaVendorNames(event));
    const valid = [...new Set(recipients.map((name) => name.trim()).filter((name) => available.has(name)))];
    if (enabled && !valid.length) throw new Error("Choose at least one vendor or team with a Selected vendors activity.");
    const contacts = (options.vendorContacts || event.agendaSharing?.vendorContacts || []).filter((contact) => available.has(contact.vendor)).map((contact) => ({ vendor: contact.vendor, name: contact.name?.trim(), category: contact.category?.trim(), email: contact.email?.trim(), whatsapp: contact.whatsapp?.trim(), phone: contact.phone?.trim() }));
    if (contacts.some((contact) => Object.values(contact).some((value) => (value?.length || 0) > 200))) throw new Error("Keep each contact field within 200 characters.");
    const method = options.deliveryMethod;
    if (method && !["email", "whatsapp", "sms"].includes(method)) throw new Error("Choose a valid delivery method.");
    if (enabled && method && valid.some((vendor) => !vendorDeliveryAvailable(contacts.find((contact) => contact.vendor === vendor), method))) throw new Error("Add valid contact details for every selected vendor, or choose another delivery method.");
    if ((options.vendorMessage?.length || 0) > 2000) throw new Error("Keep your message within 2,000 characters.");
    return { ...event, agendaSharing: { ...event.agendaSharing, delivery: "local-preview" as const, vendorSharedAt: enabled ? at : undefined, vendorRecipients: enabled ? valid : [], vendorContacts: contacts, deliveryMethod: method || event.agendaSharing?.deliveryMethod, vendorMessage: options.vendorMessage?.trim() ?? event.agendaSharing?.vendorMessage } };
  }
  const access = options.clientAccess ?? event.agendaSharing?.clientAccess ?? "view";
  if (!["view", "edit"].includes(access)) throw new Error("Choose View only or Can edit.");
  if ((options.clientNote?.length || 0) > 2000) throw new Error("Keep the client note within 2,000 characters.");
  return { ...event, agendaSharing: { ...event.agendaSharing, delivery: "local-preview" as const, readyPublishedAt: enabled ? at : undefined, clientAccess: access, clientNote: options.clientNote?.trim() ?? event.agendaSharing?.clientNote } };
}

/** Preview-only permissions. Production delivery/authentication needs a server. */
export function clientCanEditAgenda(event: PlannerEvent) { return !event.cancelledAt && Boolean(event.agendaSharing?.readyPublishedAt) && event.agendaSharing?.clientAccess === "edit"; }
export function saveClientAgendaActivity(event: PlannerEvent, input: AgendaActivity, at: string, editing = false, expectedRevision?: string) {
  if (!clientCanEditAgenda(event)) throw new Error("This timeline is no longer published with editing access.");
  const existing = eventAgenda(event).find((item) => item.id === input.id);
  if (input.agenda.track !== "ready" || editing && (!existing || !agendaForAudience(event, "ready", "client").some((item) => item.id === input.id))) throw new Error("This activity isn’t available to edit in the client timeline.");
  const a = input.agenda;
  const safe: AgendaActivity = { ...(existing || {}), id: input.id, title: input.title, time: input.time, agenda: { ...existing?.agenda, track: "ready", date: a.date, dayOffset: a.dayOffset, duration: a.duration, visibility: existing?.agenda.visibility || "client", location: a.location, personGroup: a.personGroup, responsible: a.responsible, externalDescription: a.externalDescription } };
  return saveAgendaActivity(event, safe, at, editing, expectedRevision);
}
export function moveClientAgendaActivity(event: PlannerEvent, id: string, direction: -1 | 1, at: string, expectedRevision?: string, expectedNeighbor?: { id: string; revision?: string }) {
  if (!clientCanEditAgenda(event)) throw new Error("This timeline is no longer published with editing access.");
  const visible = agendaForAudience(event, "ready", "client"), item = visible.find((entry) => entry.id === id);
  if (!item || ![-1, 1].includes(direction)) throw new Error("This activity isn’t available to move.");
  const day = visible.filter((entry) => entry.agenda.date === item.agenda.date), index = day.findIndex((entry) => entry.id === id), neighbor = day[index + direction];
  if (!neighbor) throw new Error("This activity can’t move further on this day.");
  if (item.agenda.updatedAt !== expectedRevision || expectedNeighbor && (neighbor.id !== expectedNeighbor.id || neighbor.agenda.updatedAt !== expectedNeighbor.revision)) throw new Error("This timeline changed. Review the latest schedule before moving an activity.");
  const stored = event.sections.agenda, a = stored.find((entry) => entry.id === id)!, b = stored.find((entry) => entry.id === neighbor.id)!;
  // Swap start slots, not private fields or duration. Equal-time entries swap their stable stored position.
  const swapped = stored.map((entry) => entry.id === a.id ? { ...b, time: a.time, agenda: { ...b.agenda!, updatedAt: at } } : entry.id === b.id ? { ...a, time: b.time, agenda: { ...a.agenda!, updatedAt: at } } : entry);
  return { ...event, sections: { ...event.sections, agenda: swapped } };
}
export function agendaForAudience(event: PlannerEvent, track: AgendaTrack, audience: "planner" | "client" | "vendor", vendor?: string) {
  const items = eventAgenda(event).filter((item) => item.agenda.track === track);
  if (audience === "planner") return items;
  if (audience === "client" && track === "ready" && !event.agendaSharing?.readyPublishedAt) return [];
  if (audience === "vendor" && (track !== "vendor" || !event.agendaSharing?.vendorSharedAt || !vendor || !event.agendaSharing.vendorRecipients?.includes(vendor))) return [];
  return items.filter((item) => audience === "vendor" ? item.agenda.visibility === "vendors" && item.agenda.vendorTeam?.trim() === vendor : ["client", "guests", "priority"].includes(item.agenda.visibility)).map((item) => ({ ...item, detail: undefined, agenda: { ...item.agenda, internalNotes: undefined } }));
}
