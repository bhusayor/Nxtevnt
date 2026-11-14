"use client";

import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { GuestClientAccessCard } from "@/components/planner/guest-client-access-card";
import { EventRsvpForm } from "@/components/planner/event-rsvp-form";
import { EventCollectForm } from "@/components/planner/event-collect-form";
import { EventSeatingPanel } from "@/components/planner/event-seating-panel";
import { EventCheckinPanel } from "@/components/planner/event-checkin-panel";
import { EventGuestMessagesPanel } from "@/components/planner/event-guest-messages-panel";
import {
  ArrowUpDown, Bell, CalendarDays, Check, CheckCircle2, ChevronDown, CircleAlert, Clock3, Download, FileSpreadsheet,
  Eye, Filter, LockSimple, Mail, MessageSquareText, Pencil, Phone, Plus, Search, Send, Star, Trash2, Upload, UsersRound, X,
} from "@/components/ui/icons";
import { cn } from "@/lib/utils/cn";
import { formatEventDate, updatePlannerEvent, type PlannerEvent } from "@/lib/planner-events";
import { guestAccessCapabilities, guestWorkspaceData, rsvpLabel, type EventGuest, type GuestAccessCapabilities, type GuestCollectorResponse, type GuestRsvp, type GuestWorkspaceData } from "@/lib/event-guests";

type Section = "list" | "rsvp" | "collect" | "seating" | "checkin" | "messages";
type InvitationKind = "invitation" | "reminder" | "save-the-date";
type WorkspaceProps = { event: PlannerEvent; data: GuestWorkspaceData; save: (recipe: (current: GuestWorkspaceData) => GuestWorkspaceData) => void; notice: (text: string) => void };
const sections: { id: Section; label: string; icon: typeof UsersRound }[] = [
  { id: "list", label: "Guest list", icon: UsersRound }, { id: "rsvp", label: "RSVP responses", icon: CheckCircle2 },
  { id: "collect", label: "Collect", icon: FileSpreadsheet }, { id: "seating", label: "Seating", icon: UsersRound },
  { id: "checkin", label: "Check-in", icon: Check }, { id: "messages", label: "Messages", icon: MessageSquareText },
];
const rsvpOptions: { value: GuestRsvp; label: string }[] = ["pending", "coming", "maybe", "not-coming"].map((value) => ({ value: value as GuestRsvp, label: rsvpLabel[value as GuestRsvp] }));
const rsvpSelectTone: Record<GuestRsvp, string> = {
  pending: "bg-[#eef2f4] text-[#556b78] hover:bg-[#e8eef1]",
  coming: "bg-[#e7f4eb] text-[#2e7350] hover:bg-[#dff0e5]",
  maybe: "bg-[#fff3e2] text-[#946c2d] hover:bg-[#ffecd3]",
  "not-coming": "bg-[#fbecec] text-[#a84e55] hover:bg-[#f8e2e4]",
};
const inputClass = "h-10 w-full rounded-xl border border-border-default bg-white px-3 text-sm text-text-primary outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10";
const quietButton = "inline-flex min-h-9 items-center gap-2 rounded-lg px-3 text-sm font-medium text-text-secondary hover:bg-[#f2f6f3] hover:text-brand-primary focus-visible:outline-2 focus-visible:outline-brand-primary";

function downloadCsv(filename: string, rows: string[][]) {
  const csv = rows.map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(",")).join("\r\n");
  const url = URL.createObjectURL(new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a"); link.href = url; link.download = filename; link.click(); URL.revokeObjectURL(url);
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = []; let row: string[] = [], field = "", quoted = false;
  for (let i = 0; i < text.length; i++) { const char = text[i];
    if (char === '"') { if (quoted && text[i + 1] === '"') { field += '"'; i++; } else quoted = !quoted; }
    else if (char === "," && !quoted) { row.push(field); field = ""; }
    else if ((char === "\n" || char === "\r") && !quoted) { if (char === "\r" && text[i + 1] === "\n") i++; row.push(field); if (row.some((cell) => cell.trim())) rows.push(row); row = []; field = ""; }
    else field += char;
  }
  if (quoted) throw new Error("The CSV has an unfinished quoted field.");
  row.push(field); if (row.some((cell) => cell.trim())) rows.push(row);
  return rows;
}

function GuestDialog({ open, onOpenChange, title, description, children, footer, wide = false }: { open: boolean; onOpenChange: (open: boolean) => void; title: string; description?: string; children: ReactNode; footer?: ReactNode; wide?: boolean }) {
  return <Dialog.Root open={open} onOpenChange={onOpenChange}><Dialog.Portal><Dialog.Overlay className="fixed inset-0 z-50 bg-[#172d23]/45 backdrop-blur-[2px]" /><Dialog.Content className={cn("fixed left-1/2 top-1/2 z-50 flex max-h-[min(92dvh,900px)] w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-border-subtle bg-white shadow-[var(--shadow-lg)] focus:outline-none", wide ? "max-w-5xl" : "max-w-xl")}><header className="flex items-start justify-between gap-4 border-b border-border-subtle px-5 py-4 sm:px-6"><div><Dialog.Title className="text-lg font-semibold tracking-tight">{title}</Dialog.Title>{description && <Dialog.Description className="mt-1 text-sm text-text-secondary">{description}</Dialog.Description>}</div><Dialog.Close asChild><button type="button" aria-label="Close dialog" className="flex size-9 shrink-0 items-center justify-center rounded-lg text-text-secondary hover:bg-background-subtle"><X className="size-4" /></button></Dialog.Close></header><div className="min-h-0 overflow-y-auto px-5 py-5 sm:px-6">{children}</div>{footer && <footer className="flex flex-wrap justify-end gap-2 border-t border-border-subtle px-5 py-4 sm:px-6">{footer}</footer>}</Dialog.Content></Dialog.Portal></Dialog.Root>;
}

type GuestEntryForm = {
  name: string;
  email: string;
  phone: string;
  group: string;
  tags: string;
  rsvp: GuestRsvp;
  tableId: string;
  priority: boolean;
};

const emptyGuestEntry = (): GuestEntryForm => ({
  name: "", email: "", phone: "", group: "", tags: "", rsvp: "pending", tableId: "none", priority: false,
});

function guestToEntry(guest: EventGuest): GuestEntryForm {
  return {
    name: guest.name,
    email: guest.email,
    phone: guest.phone.replace(/^\+234\s?/, ""),
    group: guest.group,
    tags: guest.tags.join(", "),
    rsvp: guest.rsvp,
    tableId: guest.tableId ?? "none",
    priority: Boolean(guest.priority),
  };
}

function entryPhone(value: string) {
  const phone = value.trim();
  if (!phone) return "";
  if (phone.startsWith("+")) return phone;
  return `+234${phone.replace(/^0/, "")}`;
}

function entryToGuest(form: GuestEntryForm, id = crypto.randomUUID()): EventGuest {
  return {
    id,
    name: form.name.trim(),
    email: form.email.trim(),
    phone: entryPhone(form.phone),
    group: form.group.trim(),
    tags: form.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
    priority: form.priority,
    rsvp: form.rsvp,
    responseAt: form.rsvp === "pending" ? undefined : new Date().toISOString(),
    responseChannel: form.rsvp === "pending" ? undefined : "In person",
    adults: 1,
    children: 0,
    dietary: "",
    tableId: form.tableId === "none" ? undefined : form.tableId,
  };
}

function validateGuestEntry(form: GuestEntryForm) {
  if (!form.name.trim()) return "Enter the guest’s name.";
  if (!form.email.trim() && !form.phone.trim()) return "Add an email address or phone number so the guest can receive invitations and access codes.";
  if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return "Enter a valid email address.";
  return "";
}

function GuestEntryFields({ value, onChange, tables }: { value: GuestEntryForm; onChange: (value: GuestEntryForm) => void; tables: GuestWorkspaceData["tables"] }) {
  const emailId = useId();
  const phoneId = useId();
  return <div className="grid gap-x-6 gap-y-5 md:grid-cols-2">
    <Input label="Guest name" required value={value.name} onChange={(event) => onChange({ ...value, name: event.target.value })} placeholder="Enter name" />
    <div className="space-y-2"><label htmlFor={emailId} className="type-label text-text-primary">Email address <span className="ml-1 text-error" aria-hidden="true">*</span></label><input id={emailId} type="email" value={value.email} onChange={(event) => onChange({ ...value, email: event.target.value })} placeholder="Enter email" className={inputClass} /></div>
    <div className="space-y-2"><label htmlFor={phoneId} className="type-label text-text-primary">Contact number <span className="ml-1 text-error" aria-hidden="true">*</span></label><div className="grid grid-cols-[92px_1fr] gap-2"><div className="flex h-10 items-center justify-center rounded-xl border border-border-default bg-background-subtle text-sm font-medium text-text-secondary">+234</div><input id={phoneId} type="tel" inputMode="tel" value={value.phone} onChange={(event) => onChange({ ...value, phone: event.target.value })} placeholder="Enter phone number" className={inputClass} /></div></div>
    <Select label="RSVP status" value={value.rsvp} onValueChange={(rsvp) => onChange({ ...value, rsvp: rsvp as GuestRsvp })} options={[{ value: "maybe", label: "Maybe" }, { value: "coming", label: "Confirmed" }, { value: "not-coming", label: "Declined" }, { value: "pending", label: "Pending" }]} />
    <Input label="Guest party" value={value.group} onChange={(event) => onChange({ ...value, group: event.target.value })} placeholder="Enter guest party" />
    <Select label="Assigned table" value={value.tableId} onValueChange={(tableId) => onChange({ ...value, tableId })} options={[{ value: "none", label: "Unassigned" }, ...tables.map((table) => ({ value: table.id, label: table.name }))]} />
    <Switch label="Priority guest" description="Mark this person for quick attention." checked={value.priority} onCheckedChange={(priority) => onChange({ ...value, priority })} className="rounded-xl border border-border-subtle bg-background-subtle px-4 py-3" />
    <Input label="Tags" optional value={value.tags} onChange={(event) => onChange({ ...value, tags: event.target.value })} placeholder="VIP, Allergy: Nuts, Early Dinner" helperText="Separate tags with commas." />
  </div>;
}

function Empty({ icon: Icon, title, detail, action }: { icon: typeof UsersRound; title: string; detail: string; action?: ReactNode }) {
  return <div className="flex min-h-52 flex-col items-center justify-center rounded-2xl border border-dashed border-[#d6e2d8] bg-[#fbfdfb] px-5 py-9 text-center"><span className="flex size-11 items-center justify-center rounded-xl bg-[#e9f2ec] text-brand-primary"><Icon className="size-5" /></span><h3 className="mt-3 text-base font-semibold">{title}</h3><p className="mt-1 max-w-md text-sm leading-6 text-text-secondary">{detail}</p>{action && <div className="mt-4">{action}</div>}</div>;
}

function Metric({ label, value, icon: Icon, tone }: { label: string; value: number; icon: typeof UsersRound; tone: string }) { return <div className="flex min-w-0 items-center gap-3 rounded-xl border border-border-subtle bg-white px-4 py-3.5"><span className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg", tone)}><Icon className="size-[18px]" /></span><div><strong className="block text-xl font-semibold tabular-nums leading-6">{value.toLocaleString()}</strong><span className="text-xs text-text-secondary">{label}</span></div></div>; }

export function EventGuestsWorkspace({ event }: { event: PlannerEvent }) {
  const [section, setSection] = useState<Section>("list");
  const [flash, setFlash] = useState("");
  const [composeRequest, setComposeRequest] = useState<{ kind: InvitationKind; id: number; recipientIds?: string[] } | null>(null);
  const invitationMenu = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    function closeOnOutsideClick(event: PointerEvent) {
      if (invitationMenu.current?.open && !invitationMenu.current.contains(event.target as Node)) invitationMenu.current.removeAttribute("open");
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") invitationMenu.current?.removeAttribute("open");
    }
    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);
  const data = guestWorkspaceData(event.guestWorkspace);
  const accessLevel = data.clientAccessLevel ?? 3;
  const access = guestAccessCapabilities(accessLevel);
  function save(recipe: (current: GuestWorkspaceData) => GuestWorkspaceData) {
    try { updatePlannerEvent(event.id, (current) => ({ ...current, guestWorkspace: recipe(guestWorkspaceData(current.guestWorkspace)) })); }
    catch { setFlash("This change could not be saved in this browser. Please try again."); }
  }
  const props: WorkspaceProps = { event, data, save, notice: setFlash };
  function prepareInvitation(kind: InvitationKind, recipientIds?: string[]) {
    invitationMenu.current?.removeAttribute("open");
    setComposeRequest((current) => ({ kind, id: (current?.id ?? 0) + 1, recipientIds }));
    setSection("messages");
  }
  const availableSections = sections.filter(({ id }) => id === "list"
    || (id === "rsvp" || id === "collect" || id === "seating") && access.viewRsvp
    || (id === "checkin" || id === "messages") && access.sendMessages);
  const activeSection = availableSections.some((item) => item.id === section) ? section : "list";
  return <div className="space-y-4"><header className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.11em] text-[#b78139]">The people who make the day</p><h2 className="mt-1 text-2xl font-semibold tracking-tight">Guests</h2><p className="mt-1 text-sm text-text-secondary">A clear place for invitations, responses, seating and arrival.</p></div>{activeSection === "list" && (access.sendMessages ? <details ref={invitationMenu} className="group relative z-20"><summary className="inline-flex min-h-11 cursor-pointer list-none items-center gap-3 rounded-xl bg-gradient-to-r from-[#547e70] to-[#174b3c] px-5 text-sm font-semibold text-white shadow-[0_6px_16px_rgba(28,75,59,0.16)] transition hover:brightness-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary [&::-webkit-details-marker]:hidden"><Send className="size-4" />Send invitation<ChevronDown className="ml-1 size-4 transition-transform group-open:rotate-180" /></summary><div className="absolute right-0 top-full z-30 mt-2 w-72 rounded-xl border border-border-subtle bg-white p-1.5 shadow-[var(--shadow-md)]">{([{ kind: "invitation", label: "Invitation + RSVP", detail: "Invite guests and collect their response", icon: Send }, { kind: "reminder", label: "RSVP reminder", detail: "Follow up with guests who have not replied", icon: Bell }, { kind: "save-the-date", label: "Save the date", detail: "Share the date before the formal invitation", icon: CalendarDays }] as const).map(({ kind, label, detail, icon: Icon }) => <button key={kind} type="button" onClick={() => prepareInvitation(kind)} className="flex w-full items-start gap-3 rounded-lg px-3 py-3 text-left hover:bg-[#f1f6f2] focus-visible:outline-2 focus-visible:outline-brand-primary"><Icon className="mt-0.5 size-4 shrink-0 text-brand-primary" /><span><strong className="block text-sm font-semibold text-text-primary">{label}</strong><span className="mt-0.5 block text-xs leading-5 text-text-secondary">{detail}</span></span></button>)}</div></details> : <span className="rounded-xl border border-border-subtle bg-[#f7f8f8] px-4 py-3 text-xs font-medium text-text-secondary">Client access required to send invitations</span>)}</header>
    <nav aria-label="Guest workspace sections" className="min-w-0 overflow-x-auto rounded-xl border border-[#dce5df] bg-white p-1"><div className="flex min-w-max gap-1" role="tablist" aria-label="Guest workspace">{availableSections.map(({ id, label, icon: Icon }) => <button key={id} type="button" role="tab" aria-selected={activeSection === id} onClick={() => { setComposeRequest(null); setSection(id); }} className={cn("inline-flex min-h-8 items-center gap-1.5 whitespace-nowrap rounded-lg px-3 text-xs font-medium transition-all focus-visible:outline-2 focus-visible:outline-brand-primary", activeSection === id ? "bg-[#e1eee5] font-semibold text-brand-primary shadow-[inset_0_0_0_1px_#bdd8c4]" : "text-text-secondary hover:bg-[#f3f7f4] hover:text-brand-primary")}><Icon className="size-3.5" />{label}</button>)}</div></nav>
    <GuestClientAccessCard event={event} level={accessLevel} />
    {flash && <div role="status" className="flex items-center justify-between gap-3 rounded-xl border border-[#d3e7d7] bg-[#f2f8f3] px-4 py-3 text-sm text-brand-primary"><span>{flash}</span><button type="button" aria-label="Dismiss message" onClick={() => setFlash("")}><X className="size-4" /></button></div>}
    {activeSection === "list" && <GuestList {...props} access={access} onCompose={(kind, recipientIds) => prepareInvitation(kind, recipientIds)} />}{activeSection === "rsvp" && <RsvpPanel {...props} />}{activeSection === "collect" && <CollectPanel {...props} />}{activeSection === "seating" && <EventSeatingPanel {...props} />}{activeSection === "checkin" && <EventCheckinPanel {...props} />}{activeSection === "messages" && <EventGuestMessagesPanel key={composeRequest?.id ?? "messages"} {...props} composeKind={composeRequest?.kind} recipientIds={composeRequest?.recipientIds} onCloseRequest={() => setComposeRequest(null)} />}
  </div>;
}

function GuestList({ event, data, save, notice, access, onCompose }: WorkspaceProps & { access: GuestAccessCapabilities; onCompose: (kind: InvitationKind, recipientIds: string[]) => void }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<GuestRsvp | "all">("all");
  const [sort, setSort] = useState("name-asc");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string[]>([]);
  const [dialog, setDialog] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [retryOpen, setRetryOpen] = useState(false);
  const [unlockOpen, setUnlockOpen] = useState(false);
  const [form, setForm] = useState<GuestEntryForm>(emptyGuestEntry);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [bulkForm, setBulkForm] = useState<GuestEntryForm>(emptyGuestEntry);
  const [queuedGuests, setQueuedGuests] = useState<EventGuest[]>([]);
  const [bulkEditingId, setBulkEditingId] = useState<string | null>(null);
  const [expandedQueued, setExpandedQueued] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [bulkError, setBulkError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const addMenu = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    function closeMenu(event: PointerEvent) {
      if (addMenu.current?.open && !addMenu.current.contains(event.target as Node)) addMenu.current.removeAttribute("open");
    }
    function closeOnEscape(event: KeyboardEvent) { if (event.key === "Escape") addMenu.current?.removeAttribute("open"); }
    document.addEventListener("pointerdown", closeMenu);
    document.addEventListener("keydown", closeOnEscape);
    return () => { document.removeEventListener("pointerdown", closeMenu); document.removeEventListener("keydown", closeOnEscape); };
  }, []);
  const guests = data.guests;
  const locked = Boolean(data.listLocked);
  const coming = guests.filter((guest) => guest.rsvp === "coming");
  const failed = guests.filter((guest) => guest.invitationFailedAt);
  const counts = {
    coming: coming.length,
    pending: guests.filter((guest) => guest.rsvp === "pending").length,
    no: guests.filter((guest) => guest.rsvp === "not-coming").length,
    maybe: guests.filter((guest) => guest.rsvp === "maybe").length,
  };
  const rsvpOrder: Record<GuestRsvp, number> = { coming: 0, maybe: 1, pending: 2, "not-coming": 3 };
  const visible = guests.filter((guest) => {
    const matchesFilter = filter === "all" || guest.rsvp === filter;
    return matchesFilter && `${guest.name} ${guest.email} ${guest.phone} ${guest.group} ${guest.tags.join(" ")}`.toLowerCase().includes(query.toLowerCase());
  }).sort((a, b) => sort === "name-desc" ? b.name.localeCompare(a.name)
    : sort === "rsvp" ? rsvpOrder[a.rsvp] - rsvpOrder[b.rsvp] || a.name.localeCompare(b.name)
      : sort === "invited-newest" ? (b.invitedAt ?? "").localeCompare(a.invitedAt ?? "") || a.name.localeCompare(b.name)
        : a.name.localeCompare(b.name));
  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(visible.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageRows = visible.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const visibleIds = pageRows.map((guest) => guest.id);
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selected.includes(id));
  const detailGuest = guests.find((guest) => guest.id === detailId);
  const deleteGuest = guests.find((guest) => guest.id === deleteId);
  const detailFields: [string, string][] = detailGuest ? [
    ...(access.viewContact ? [["Email address", detailGuest.email || "—"], ["Contact number", detailGuest.phone || "—"]] as [string, string][] : []),
    ...(access.viewRsvp ? [
      ["RSVP status", detailGuest.rsvp === "coming" ? "Confirmed" : detailGuest.rsvp === "not-coming" ? "Declined" : rsvpLabel[detailGuest.rsvp]],
      ["Guest party", detailGuest.group || "—"], ["Tags", detailGuest.tags.join(", ") || "No tags"],
      ["Priority", detailGuest.priority ? "Yes" : "No"], ["Invitation", detailGuest.invitationFailedAt ? "Failed" : detailGuest.invitedAt ? "Sent" : "Not sent"],
      ["Party size", `${detailGuest.adults} adult${detailGuest.adults === 1 ? "" : "s"} · ${detailGuest.children} child${detailGuest.children === 1 ? "" : "ren"}`],
      ["Dietary needs", detailGuest.dietary || "—"],
    ] as [string, string][] : []),
    ...(access.manageSeating ? [["Assigned table", data.tables.find((table) => table.id === detailGuest.tableId)?.name ?? "Unassigned"]] as [string, string][] : []),
  ] : [];
  const dietaryCount = (term: string) => coming.filter((guest) => guest.dietary.toLowerCase().includes(term)).length;
  function open() {
    if (locked || !access.manageGuests) return;
    setEditingId(null);
    setForm(emptyGuestEntry());
    setError(""); setDialog(true);
  }
  function openEdit(guest: EventGuest) {
    if (locked || !access.manageGuests) return;
    setEditingId(guest.id);
    setForm(guestToEntry(guest));
    setError("");
    setDialog(true);
  }
  function submit(e: FormEvent) {
    e.preventDefault();
    if (locked || !access.manageGuests) return;
    const message = validateGuestEntry(form);
    if (message) { setError(message); return; }
    save((current) => ({
      ...current,
      guests: editingId ? current.guests.map((guest) => guest.id === editingId ? { ...guest, ...entryToGuest(form, guest.id), invitedAt: guest.invitedAt, invitationFailedAt: guest.invitationFailedAt, adults: guest.adults, children: guest.children, dietary: guest.dietary, checkedInAt: form.rsvp === "coming" ? guest.checkedInAt : undefined } : guest) : [...current.guests, entryToGuest(form)],
    }));
    setDialog(false);
    notice(editingId ? "Guest details updated." : "Guest added to the list.");
  }
  async function importFile(file?: File) {
    if (!file || locked || !access.manageGuests) return;
    try {
      if (file.size > 2_000_000) throw new Error("Choose a CSV smaller than 2 MB.");
      const rows = parseCsv(await file.text());
      const header = rows.shift()?.map((cell) => cell.trim().toLowerCase());
      if (!header?.includes("name")) throw new Error("The CSV needs a Name column. Email, Phone and Group are optional.");
      const value = (row: string[], key: string) => row[header.indexOf(key)]?.trim() ?? "";
      const imported = rows.filter((row) => value(row, "name")).map((row): EventGuest => ({
        id: crypto.randomUUID(), name: value(row, "name"), email: value(row, "email"), phone: value(row, "phone"),
        group: value(row, "group"), tags: value(row, "tags").split(",").map((tag) => tag.trim()).filter(Boolean),
        rsvp: "pending", adults: 1, children: 0, dietary: value(row, "dietary"),
      }));
      save((current) => ({ ...current, guests: [...current.guests, ...imported] }));
      notice(`${imported.length} guests added from CSV.`);
    } catch (error) { notice(error instanceof Error ? error.message : "The CSV could not be read."); }
    if (fileRef.current) fileRef.current.value = "";
  }
  function queueBulkGuest(e: FormEvent) {
    e.preventDefault();
    if (locked || !access.manageGuests) return;
    const message = validateGuestEntry(bulkForm);
    if (message) { setBulkError(message); return; }
    if (!bulkEditingId && queuedGuests.length >= 10) { setBulkError("You can queue up to 10 guests at a time. Save these guests before adding more."); return; }
    setQueuedGuests((current) => bulkEditingId ? current.map((guest) => guest.id === bulkEditingId ? entryToGuest(bulkForm, guest.id) : guest) : [...current, entryToGuest(bulkForm)]);
    setExpandedQueued(bulkEditingId);
    setBulkEditingId(null);
    setBulkForm(emptyGuestEntry());
    setBulkError("");
  }
  function editQueuedGuest(guest: EventGuest) {
    setBulkEditingId(guest.id);
    setBulkForm(guestToEntry(guest));
    setBulkError("");
  }
  function saveQueuedGuests() {
    if (!queuedGuests.length || locked || !access.manageGuests) return;
    save((current) => ({ ...current, guests: [...current.guests, ...queuedGuests] }));
    notice(`${queuedGuests.length} guest${queuedGuests.length === 1 ? "" : "s"} added to the guest list.`);
    setQueuedGuests([]);
    setBulkForm(emptyGuestEntry());
    setBulkEditingId(null);
    setExpandedQueued(null);
    setBulkOpen(false);
  }
  function cancelBulk() {
    setQueuedGuests([]);
    setBulkForm(emptyGuestEntry());
    setBulkEditingId(null);
    setExpandedQueued(null);
    setBulkError("");
    setBulkOpen(false);
  }
  function removeGuest(id: string) {
    save((current) => ({
      ...current,
      guests: current.guests.filter((guest) => guest.id !== id),
      collectorResponses: current.collectorResponses.map((response) => response.guestId === id ? { ...response, guestId: undefined, status: "new" as const } : response),
    }));
    setSelected((current) => current.filter((guestId) => guestId !== id));
    setDeleteId(null);
    notice("Guest removed from the list.");
  }
  function setRsvp(id: string, value: string) {
    const rsvp = value as GuestRsvp;
    save((current) => ({ ...current, guests: current.guests.map((guest) => guest.id === id ? {
      ...guest, rsvp, responseAt: rsvp === "pending" ? undefined : new Date().toISOString(),
      responseChannel: rsvp === "pending" ? undefined : "In person", checkedInAt: rsvp === "coming" ? guest.checkedInAt : undefined,
    } : guest) }));
  }
  function setTable(id: string, tableId: string) {
    if (tableId !== "none") {
      const table = data.tables.find((item) => item.id === tableId);
      const occupied = guests.filter((guest) => guest.tableId === tableId && guest.id !== id).length;
      if (table && occupied >= table.capacity) { notice(`${table.name} is full. Choose another table.`); return; }
    }
    save((current) => ({ ...current, guests: current.guests.map((guest) => guest.id === id ? { ...guest, tableId: tableId === "none" ? undefined : tableId } : guest) }));
  }
  function toggleSelected(id: string) { setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]); }
  function exportGuests(items: EventGuest[], suffix: string) {
    downloadCsv(`${event.name}-${suffix}.csv`, [["Name", "Email", "Phone", "Guest party", "Tags", "Priority", "RSVP", "Invitation", "Table", "Adults", "Children", "Dietary"], ...items.map((guest) => [guest.name, guest.email, guest.phone, guest.group, guest.tags.join(", "), guest.priority ? "Yes" : "No", rsvpLabel[guest.rsvp], guest.invitationFailedAt ? "Failed" : guest.invitedAt ? "Sent" : "Not sent", data.tables.find((table) => table.id === guest.tableId)?.name ?? "", String(guest.adults), String(guest.children), guest.dietary])]);
  }
  return <div className="space-y-6">
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5"><Metric label="Total guests" value={guests.length} icon={UsersRound} tone="bg-[#e9f1fb] text-[#507a9d]" /><Metric label="Confirmed" value={counts.coming} icon={CheckCircle2} tone="bg-[#e7f6ec] text-[#30805a]" /><Metric label="Pending" value={counts.pending} icon={Clock3} tone="bg-[#edf1f4] text-[#667786]" /><Metric label="Declined" value={counts.no} icon={X} tone="bg-[#fceeee] text-[#b85858]" /><Metric label="Maybe" value={counts.maybe} icon={CircleAlert} tone="bg-[#fff3df] text-[#a2772e]" /></div>
    <section className="overflow-hidden rounded-2xl border border-border-subtle bg-white">
      <div className="flex flex-wrap items-center gap-3 border-b border-border-subtle px-5 py-4">
        <div className="relative min-w-[220px] flex-[1_1_260px]"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-tertiary" /><input aria-label="Search guests" value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} placeholder="Search guests" className={cn(inputClass, "pl-9")} /></div>
        <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" aria-label="Import guests CSV" onChange={(e) => void importFile(e.target.files?.[0])} />
        <Button type="button" variant="outline" disabled={locked || !access.manageGuests} leadingIcon={<Upload className="size-4" />} onClick={() => fileRef.current?.click()}>Import</Button>
        <div className="relative w-44"><Filter className="pointer-events-none absolute left-3 top-1/2 z-10 size-4 -translate-y-1/2 text-text-tertiary" /><Select ariaLabel="RSVP status" value={filter} onValueChange={(value) => { setFilter(value as GuestRsvp | "all"); setPage(1); }} options={[{ value: "all", label: "RSVP status" }, { value: "coming", label: `Confirmed (${counts.coming})` }, { value: "maybe", label: `Maybe (${counts.maybe})` }, { value: "not-coming", label: `Declined (${counts.no})` }, { value: "pending", label: `Pending (${counts.pending})` }]} className="pl-9" /></div>
        <div className="relative w-44"><ArrowUpDown className="pointer-events-none absolute left-3 top-1/2 z-10 size-4 -translate-y-1/2 text-text-tertiary" /><Select ariaLabel="Sort guests" value={sort} onValueChange={(value) => { setSort(value); setPage(1); }} options={[{ value: "name-asc", label: "Name (A–Z)" }, { value: "name-desc", label: "Name (Z–A)" }, { value: "rsvp", label: "RSVP status" }, { value: "invited-newest", label: "Recently invited" }]} className="pl-9" /></div>
        <Button type="button" variant="outline" leadingIcon={<Download className="size-4" />} onClick={() => exportGuests(visible, "guests")}>Export</Button>
        <details ref={addMenu} className="group relative z-20"><summary className={cn("inline-flex h-10 cursor-pointer list-none items-center gap-2 rounded-xl bg-brand-primary px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary [&::-webkit-details-marker]:hidden", (locked || !access.manageGuests) && "pointer-events-none opacity-45")}><Plus className="size-4" />Add guest<ChevronDown className="size-4 transition-transform group-open:rotate-180" /></summary><div className="absolute right-0 top-full z-30 mt-2 w-56 rounded-xl border border-border-subtle bg-white p-1.5 shadow-[var(--shadow-md)]"><button type="button" onClick={() => { addMenu.current?.removeAttribute("open"); open(); }} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-text-primary hover:bg-[#f1f6f2]"><Plus className="size-4 text-brand-primary" />Add single guest</button><button type="button" onClick={() => { addMenu.current?.removeAttribute("open"); setError(""); setBulkOpen(true); }} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-text-primary hover:bg-[#f1f6f2]"><UsersRound className="size-4 text-brand-primary" />Add bulk guests</button><button type="button" onClick={() => { addMenu.current?.removeAttribute("open"); fileRef.current?.click(); }} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-text-primary hover:bg-[#f1f6f2]"><Upload className="size-4 text-brand-primary" />Import CSV file</button></div></details>
      </div>
      {failed.length > 0 && access.sendMessages && <div className="flex items-center justify-between gap-3 border-b border-border-subtle bg-[#fffaf3] px-5 py-2.5 text-xs text-[#825f2d]"><span>{failed.length} invitation{failed.length === 1 ? "" : "s"} need attention.</span><button type="button" onClick={() => setRetryOpen(true)} className="font-semibold hover:underline">Review failed</button></div>}
      {selected.length > 0 && <div className="flex flex-wrap items-center gap-3 border-b border-border-subtle bg-[#eff6f1] px-4 py-2.5 text-xs"><strong className="text-brand-primary">{selected.length} selected</strong>{access.sendMessages && <button type="button" className="inline-flex items-center gap-1.5 font-semibold text-brand-primary hover:underline" onClick={() => onCompose("invitation", selected)}><Send className="size-3.5" />Invite selected</button>}<button type="button" className="font-semibold text-brand-primary hover:underline" onClick={() => exportGuests(guests.filter((guest) => selected.includes(guest.id)), "selected-guests")}>Export selected</button><button type="button" className="text-text-secondary hover:underline" onClick={() => setSelected([])}>Clear selection</button></div>}
      {access.viewRsvp && <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border-subtle bg-[#f7faf8] px-5 py-4"><div><p className="text-sm font-semibold text-[#263d32]">Final numbers</p><p className="mt-1 text-xs leading-5 text-text-secondary">Confirmed {counts.coming} · adults {coming.reduce((sum, guest) => sum + guest.adults, 0)} · children {coming.reduce((sum, guest) => sum + guest.children, 0)} · {dietaryCount("vegetarian")} vegetarian · {dietaryCount("nuts")} no nuts · {dietaryCount("halal")} halal</p></div>{access.manageGuests && <Button variant="outline" size="sm" leadingIcon={<LockSimple className="size-4" />} onClick={() => { if (locked) setUnlockOpen(true); else save((current) => ({ ...current, listLocked: true })); }}>{locked ? "Unlock list" : "Lock the list"}</Button>}</div>}
      {locked && <p className="border-b border-border-subtle bg-[#fffaf0] px-4 py-2 text-xs text-[#825f2d]">Guest names and contact details are locked. RSVP, seating and check-in can still change.</p>}
      {visible.length ? (
        <div className="overflow-x-auto">
          <table className={cn("w-full text-left text-sm", access.viewContact ? "min-w-[1100px]" : "min-w-[760px]")}>
            <thead className="border-b border-border-subtle bg-[#f3f7f4] text-xs font-semibold uppercase tracking-[0.045em] text-[#436352]">
              <tr>
                {access.manageGuests && <th scope="col" className="w-10 px-5 py-4">
                  <input type="checkbox" aria-label="Select all visible guests" checked={allVisibleSelected} onChange={() => setSelected((current) => allVisibleSelected ? current.filter((id) => !visibleIds.includes(id)) : [...new Set([...current, ...visibleIds])])} className="size-4 accent-brand-primary" />
                </th>}
                <th scope="col" className="px-5 py-4">Guest</th>{access.viewContact && <th scope="col" className="px-5 py-4">Contact</th>}{access.viewRsvp && <><th scope="col" className="px-5 py-4">RSVP status</th><th scope="col" className="px-5 py-4">Invitation</th><th scope="col" className="px-5 py-4">Guest party</th><th scope="col" className="px-5 py-4">Tags</th></>}{access.manageSeating && <th scope="col" className="px-5 py-4">Table</th>}<th scope="col" className="px-5 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {pageRows.map((guest) => <tr key={guest.id} className="hover:bg-[#fbfdfb]">
                {access.manageGuests && <td className="px-5 py-4"><input type="checkbox" aria-label={`Select ${guest.name}`} checked={selected.includes(guest.id)} onChange={() => toggleSelected(guest.id)} className="size-4 accent-brand-primary" /></td>}
                <th scope="row" className="whitespace-nowrap px-5 py-4 font-semibold"><span className="inline-flex items-center gap-2">{access.viewRsvp && guest.priority && <Star weight="fill" className="size-3.5 text-[#c58b32]" />}{guest.name}</span></th>
                {access.viewContact && <td className="px-5 py-4 text-xs leading-5 text-text-secondary"><span className="flex items-center gap-1.5"><Mail className="size-3.5 shrink-0" />{guest.email || "No email"}</span><span className="mt-1 flex items-center gap-1.5"><Phone className="size-3.5 shrink-0" />{guest.phone || "No phone number"}</span></td>}
                {access.viewRsvp && <><td className="px-5 py-4">{access.manageGuests ? <Select ariaLabel={`RSVP response for ${guest.name}`} value={guest.rsvp} onValueChange={(value) => setRsvp(guest.id, value)} options={rsvpOptions} className={cn("h-9 w-[144px] gap-2 whitespace-nowrap rounded-full border-0 px-3.5 text-[13px] font-semibold shadow-none focus:ring-2 focus:ring-brand-primary/20", rsvpSelectTone[guest.rsvp])} /> : <span className={cn("inline-flex rounded-full px-3 py-1.5 text-xs font-semibold", rsvpSelectTone[guest.rsvp])}>{guest.rsvp === "coming" ? "Confirmed" : guest.rsvp === "not-coming" ? "Declined" : rsvpLabel[guest.rsvp]}</span>}</td>
                <td className="whitespace-nowrap px-5 py-4 text-xs text-text-secondary">{guest.invitationFailedAt ? <span className="text-error">Failed</span> : guest.invitedAt ? formatEventDate(guest.invitedAt.slice(0, 10), { day: "numeric", month: "short", year: "numeric" }) : "Not sent"}</td>
                <td className="px-5 py-4 text-xs text-text-secondary">{guest.group || "—"}</td>
                <td className="px-5 py-4"><div className="flex max-w-48 flex-wrap gap-1">{guest.tags.length ? guest.tags.map((tag) => <span key={tag} className="rounded-full bg-[#eaf2ed] px-2 py-1 text-[11px] font-medium text-[#477462]">{tag}</span>) : <span className="text-text-tertiary">—</span>}</div></td></>}
                {access.manageSeating && <td className="px-5 py-4"><Select ariaLabel={`Table for ${guest.name}`} value={guest.tableId ?? "none"} onValueChange={(value) => setTable(guest.id, value)} options={[{ value: "none", label: "Unassigned" }, ...data.tables.map((table) => ({ value: table.id, label: table.name }))]} className={cn("h-9 w-[150px] gap-2 whitespace-nowrap rounded-full border-0 px-3.5 text-[13px] font-semibold shadow-none focus:ring-2 focus:ring-brand-primary/20 [&>span:first-child]:min-w-0 [&>span:first-child]:flex-1 [&>span:first-child]:truncate", guest.tableId ? "bg-[#eaf2ec] text-[#376b53] hover:bg-[#e2eee5]" : "bg-[#f0f1f6] text-[#5d6476] hover:bg-[#e9ebf2]")} /></td>}
                <td className="px-5 py-4"><div className="flex justify-end gap-1"><button type="button" aria-label={`View ${guest.name}`} title="View details" onClick={() => setDetailId(guest.id)} className="flex size-8 items-center justify-center rounded-lg text-text-secondary hover:bg-[#edf4ef] hover:text-brand-primary"><Eye className="size-4" /></button>{access.manageGuests && <><button type="button" aria-label={`Edit ${guest.name}`} title="Edit guest" disabled={locked} onClick={() => openEdit(guest)} className="flex size-8 items-center justify-center rounded-lg text-text-secondary hover:bg-[#edf4ef] hover:text-brand-primary disabled:cursor-not-allowed disabled:opacity-35"><Pencil className="size-4" /></button><button type="button" aria-label={`Delete ${guest.name}`} title="Delete guest" disabled={locked} onClick={() => setDeleteId(guest.id)} className="flex size-8 items-center justify-center rounded-lg text-error hover:bg-[#fff0f0] hover:text-[#a23737] disabled:cursor-not-allowed disabled:opacity-35"><Trash2 className="size-4" /></button></>}</div></td>
              </tr>)}
            </tbody>
          </table>
        </div>
      ) : <div className="p-4"><Empty icon={UsersRound} title={guests.length ? "No guests match" : "Start the guest list"} detail={guests.length ? "Try a different search or filter." : "Add guests one by one, or import a CSV with names and contact details."} action={!guests.length && !locked && access.manageGuests && <Button size="sm" leadingIcon={<Plus className="size-4" />} onClick={() => open()}>Add first guest</Button>} /></div>}
      {visible.length > pageSize && <nav aria-label="Guest list pages" className="flex flex-wrap items-center justify-between gap-3 border-t border-border-subtle bg-[#fbfcfb] px-4 py-3"><p className="text-xs text-text-secondary">Showing {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, visible.length)} of {visible.length} guests</p><div className="flex items-center gap-2"><Button type="button" size="sm" variant="outline" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>Previous</Button><span className="min-w-16 text-center text-xs font-semibold tabular-nums text-[#315a45]">{currentPage} of {totalPages}</span><Button type="button" size="sm" variant="outline" disabled={currentPage === totalPages} onClick={() => setPage(currentPage + 1)}>Next</Button></div></nav>}
    </section>
    <GuestDialog open={dialog} onOpenChange={setDialog} wide title={editingId ? "Edit guest" : "Add single guest"} description="Email or phone is needed to send invitations and access codes for private event websites.">
      <form onSubmit={submit} className="space-y-5"><GuestEntryFields value={form} onChange={setForm} tables={data.tables} />{error && <p role="alert" className="rounded-xl bg-[#fff3f3] px-4 py-3 text-sm text-error">{error}</p>}<div className="flex justify-end gap-2 pt-2"><Button type="button" variant="outline" onClick={() => setDialog(false)}>Cancel</Button><Button type="submit">{editingId ? "Save changes" : "Add guest"}</Button></div></form>
    </GuestDialog>
    <GuestDialog open={bulkOpen} onOpenChange={(open) => { if (open) setBulkOpen(true); else cancelBulk(); }} wide title="Add bulk guests" description="Complete one guest at a time. Review the queued list, then save everyone together.">
      <div className="space-y-7">
        <form onSubmit={queueBulkGuest} className="space-y-5 rounded-2xl border border-border-subtle bg-[#fbfcfb] p-5">
          <GuestEntryFields value={bulkForm} onChange={setBulkForm} tables={data.tables} />
          {bulkError && <p role="alert" className="rounded-xl bg-[#fff3f3] px-4 py-3 text-sm text-error">{bulkError}</p>}
          <div className="flex justify-end"><Button type="submit" disabled={!bulkEditingId && queuedGuests.length >= 10}>{bulkEditingId ? "Update guest" : "Add guest"}</Button></div>
        </form>
        <section aria-labelledby="queued-guests-heading" className="space-y-3">
          <div className="flex flex-wrap items-end justify-between gap-2"><div><h4 id="queued-guests-heading" className="text-lg font-semibold">Queued guests ({queuedGuests.length}/10)</h4><p className="mt-1 text-sm text-text-secondary">Guests stay here until you save all. You can view, edit or remove any entry first.</p></div></div>
          {queuedGuests.length ? <div className="space-y-2 rounded-2xl border border-[#dbe6de] bg-[#f7faf8] p-3">{queuedGuests.map((guest) => {
            const expanded = expandedQueued === guest.id;
            const tableName = data.tables.find((table) => table.id === guest.tableId)?.name ?? "Unassigned";
            return <article key={guest.id} className="overflow-hidden rounded-xl border border-border-subtle bg-white shadow-sm">
              <div className="flex items-start gap-3 p-4"><button type="button" aria-expanded={expanded} aria-label={`${expanded ? "Hide" : "Show"} details for ${guest.name}`} onClick={() => setExpandedQueued(expanded ? null : guest.id)} className="min-w-0 flex-1 text-left"><span className="flex items-center gap-2 font-semibold text-text-primary">{guest.priority && <Star weight="fill" className="size-3.5 text-[#c58b32]" />}{guest.name}</span><span className="mt-1 block truncate text-sm text-text-secondary">{[guest.email, guest.phone].filter(Boolean).join(" · ")}</span></button><button type="button" aria-label={`${expanded ? "Collapse" : "Expand"} ${guest.name}`} onClick={() => setExpandedQueued(expanded ? null : guest.id)} className="flex size-8 items-center justify-center rounded-lg text-text-secondary hover:bg-background-subtle"><ChevronDown className={cn("size-4 transition-transform", expanded && "rotate-180")} /></button><button type="button" aria-label={`Edit queued guest ${guest.name}`} onClick={() => editQueuedGuest(guest)} className="flex size-8 items-center justify-center rounded-lg text-text-secondary hover:bg-[#edf4ef] hover:text-brand-primary"><Pencil className="size-4" /></button><button type="button" aria-label={`Remove queued guest ${guest.name}`} onClick={() => { setQueuedGuests((current) => current.filter((item) => item.id !== guest.id)); if (bulkEditingId === guest.id) { setBulkEditingId(null); setBulkForm(emptyGuestEntry()); } }} className="flex size-8 items-center justify-center rounded-lg text-error hover:bg-[#fff0f0] hover:text-[#a23737]"><Trash2 className="size-4" /></button></div>
              {expanded && <div className="grid gap-4 border-t border-border-subtle bg-[#fcfdfc] px-4 py-4 text-sm sm:grid-cols-2 lg:grid-cols-3"><div><span className="block text-xs font-medium text-text-tertiary">Email address</span><span className="mt-1 block break-all text-text-secondary">{guest.email || "—"}</span></div><div><span className="block text-xs font-medium text-text-tertiary">Contact number</span><span className="mt-1 block text-text-secondary">{guest.phone || "—"}</span></div><div><span className="block text-xs font-medium text-text-tertiary">RSVP status</span><span className={cn("mt-1 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold", rsvpSelectTone[guest.rsvp])}>{guest.rsvp === "coming" ? "Confirmed" : guest.rsvp === "not-coming" ? "Declined" : rsvpLabel[guest.rsvp]}</span></div><div><span className="block text-xs font-medium text-text-tertiary">Guest party</span><span className="mt-1 block text-text-secondary">{guest.group || "—"}</span></div><div><span className="block text-xs font-medium text-text-tertiary">Assigned table</span><span className="mt-1 block text-text-secondary">{tableName}</span></div><div><span className="block text-xs font-medium text-text-tertiary">Tags</span><span className="mt-1 block text-text-secondary">{guest.tags.join(", ") || "No tags"}</span></div><div><span className="block text-xs font-medium text-text-tertiary">Priority guest</span><span className="mt-1 block text-text-secondary">{guest.priority ? "Yes" : "No"}</span></div></div>}
            </article>;
          })}</div> : <div className="rounded-2xl border border-dashed border-[#d6e2d8] bg-[#fbfdfb] px-5 py-8 text-center"><UsersRound className="mx-auto size-6 text-text-tertiary" /><p className="mt-2 text-sm font-semibold">No guests queued yet</p><p className="mt-1 text-xs text-text-secondary">Complete the form above and choose Add guest.</p></div>}
        </section>
        <div className="flex flex-wrap justify-end gap-2 border-t border-border-subtle pt-5"><Button type="button" variant="outline" onClick={cancelBulk}>Cancel</Button><Button type="button" disabled={!queuedGuests.length} onClick={saveQueuedGuests}>Save all guests</Button></div>
      </div>
    </GuestDialog>
    <GuestDialog open={Boolean(detailGuest)} onOpenChange={(open) => { if (!open) setDetailId(null); }} title={detailGuest?.name ?? "Guest details"} description="All information saved for this guest.">
      {detailGuest && <div className="space-y-5">{detailFields.length ? <div className="grid gap-4 sm:grid-cols-2">{detailFields.map(([label, value]) => <div key={label} className="rounded-xl border border-border-subtle bg-[#fafcfb] px-4 py-3"><span className="block text-xs font-medium text-text-tertiary">{label}</span><span className="mt-1 block break-words text-sm font-medium text-text-primary">{value}</span></div>)}</div> : <div className="rounded-xl border border-border-subtle bg-[#fafcfb] px-4 py-5 text-sm leading-6 text-text-secondary">Your current client access only allows this guest’s name to be viewed.</div>}{access.manageGuests && !locked && <div className="flex justify-end"><Button type="button" variant="outline" leadingIcon={<Pencil className="size-4" />} onClick={() => { setDetailId(null); openEdit(detailGuest); }}>Edit guest</Button></div>}</div>}
    </GuestDialog>
    <GuestDialog open={Boolean(deleteGuest)} onOpenChange={(open) => { if (!open) setDeleteId(null); }} title="Delete guest?" description={deleteGuest ? `${deleteGuest.name} will be removed from this event’s guest list.` : undefined} footer={<><Button type="button" variant="outline" onClick={() => setDeleteId(null)}>Keep guest</Button><Button type="button" variant="destructive" onClick={() => deleteGuest && removeGuest(deleteGuest.id)}>Delete guest</Button></>}>
      <div className="rounded-xl border border-[#f0d2d2] bg-[#fff7f7] p-4 text-sm leading-6 text-[#7e4141]">This removes their saved guest details, seating assignment and list selection. This action cannot be undone.</div>
    </GuestDialog>
    <GuestDialog open={retryOpen} onOpenChange={setRetryOpen} title="Failed invitations" description="Review contact details, then open a direct reply for each guest."><div className="space-y-2">{failed.map((guest) => <div key={guest.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border-subtle p-3"><div><p className="text-sm font-semibold">{guest.name}</p><p className="text-xs text-text-secondary">{guest.email || guest.phone}</p></div><div className="flex gap-2">{guest.email && <a className={quietButton} href={`mailto:${guest.email}?subject=${encodeURIComponent(`Invitation to ${event.name}`)}`}><Mail className="size-4" />Email</a>}{guest.phone && <a className={quietButton} href={`https://wa.me/${guest.phone.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer"><Phone className="size-4" />WhatsApp</a>}</div></div>)}</div></GuestDialog>
    <GuestDialog
      open={unlockOpen}
      onOpenChange={setUnlockOpen}
      title="Unlock guest list?"
      description="Your team will be able to add and import guests again."
      footer={<><Button type="button" variant="outline" onClick={() => setUnlockOpen(false)}>Keep locked</Button><Button type="button" onClick={() => { save((current) => ({ ...current, listLocked: false })); setUnlockOpen(false); }}>Unlock list</Button></>}
    >
      <div className="flex items-start gap-3 rounded-xl bg-[#f2f7f3] p-4 text-sm leading-6 text-[#42594b]"><span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#e2eee5] text-brand-primary"><LockSimple className="size-4" /></span><p>All guest details and RSVP history stay in place. You can lock the list again whenever final numbers are ready.</p></div>
    </GuestDialog>
  </div>;
}

function RsvpPanel({ event, data, save, notice }: WorkspaceProps) {
  const [mode, setMode] = useState<"responses" | "form">("responses");
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [visibleColumns, setVisibleColumns] = useState({ contact: true, channel: true, answers: true });
  const columnsMenu = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    function closeOnOutsideClick(event: PointerEvent) {
      if (columnsMenu.current?.open && !columnsMenu.current.contains(event.target as Node)) columnsMenu.current.removeAttribute("open");
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") columnsMenu.current?.removeAttribute("open");
    }
    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);
  const counts = {
    coming: data.guests.filter((guest) => guest.rsvp === "coming").length,
    maybe: data.guests.filter((guest) => guest.rsvp === "maybe").length,
    no: data.guests.filter((guest) => guest.rsvp === "not-coming").length,
    pending: data.guests.filter((guest) => guest.rsvp === "pending").length,
  };
  const filters = [
    { id: "all", label: "All" },
    { id: "pending", label: "No reply" },
    { id: "coming", label: "Coming" },
    { id: "maybe", label: "Maybe" },
    { id: "not-coming", label: "Not coming" },
    { id: "self-added", label: "Self-added" },
  ];
  const guests = data.guests.filter((guest) => {
    const matchesFilter = filter === "all" || (filter === "self-added" ? guest.responseChannel === "Collector" : guest.rsvp === filter);
    return matchesFilter && `${guest.name} ${guest.email} ${guest.phone}`.toLowerCase().includes(query.toLowerCase());
  });
  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(guests.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageRows = guests.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  function recordResponse(guest: EventGuest, value: GuestRsvp) {
    save((current) => ({ ...current, guests: current.guests.map((item) => item.id === guest.id ? {
      ...item, rsvp: value, responseAt: value === "pending" ? undefined : new Date().toISOString(),
      responseChannel: value === "pending" ? undefined : item.responseChannel ?? "In person",
    } : item) }));
  }
  async function exportExcel() {
    try {
      const XLSX = await import("xlsx");
      const rows = [["Guest", "Response", "Phone", "Email", "Reply channel", "Adults", "Children", "Dietary needs"],
        ...data.guests.map((guest) => [guest.name, guest.rsvp === "pending" ? "No reply" : rsvpLabel[guest.rsvp], guest.phone, guest.email, guest.responseChannel ?? "", guest.adults, guest.children, guest.dietary])];
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(rows), "RSVP responses");
      XLSX.writeFile(workbook, `${event.name.replace(/[^a-z0-9_-]+/gi, "-")}-rsvp.xlsx`);
    } catch { notice("The RSVP export could not be prepared. Please try again."); }
  }
  return <div className="space-y-4">
    <header className="flex flex-wrap items-end justify-between gap-3">
      <div><h3 className="text-base font-semibold">RSVP responses</h3><p className="mt-0.5 text-xs text-text-secondary">See who is coming and record replies as they arrive.</p></div>
      <div className="inline-flex w-fit rounded-lg border border-[#dce5df] bg-white p-1" role="tablist" aria-label="RSVP views">
      {(["responses", "form"] as const).map((view) => <button key={view} role="tab" aria-selected={mode === view} type="button" onClick={() => setMode(view)} className={cn("rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors focus-visible:outline-2 focus-visible:outline-brand-primary", mode === view ? "bg-[#e1eee5] font-semibold text-brand-primary shadow-[inset_0_0_0_1px_#bdd8c4]" : "text-text-secondary hover:bg-[#f3f7f4] hover:text-brand-primary")}>{view}</button>)}
      </div>
    </header>
    {mode === "responses" && <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <Metric label="Coming" value={counts.coming} icon={CheckCircle2} tone="bg-[#e7f6ec] text-[#30805a]" />
      <Metric label="Maybe" value={counts.maybe} icon={CircleAlert} tone="bg-[#fff3df] text-[#a2772e]" />
      <Metric label="Not coming" value={counts.no} icon={X} tone="bg-[#fceeee] text-[#b85858]" />
      <Metric label="No reply" value={counts.pending} icon={Clock3} tone="bg-[#edf1f4] text-[#667786]" />
    </div>}
    {mode === "responses" ? <section className="overflow-hidden rounded-2xl border border-border-subtle bg-white">
      <div className="flex flex-wrap items-center gap-3 border-b border-border-subtle p-4">
        <div className="flex flex-wrap gap-1" role="group" aria-label="Filter RSVP responses">{filters.map((item) => <button key={item.id} type="button" aria-pressed={filter === item.id} onClick={() => { setFilter(item.id); setPage(1); }} className={cn("rounded-lg px-3 py-2 text-sm font-medium", filter === item.id ? "bg-[#eaf2ec] text-brand-primary" : "text-text-secondary hover:bg-[#f5f7f5]")}>{item.label}</button>)}</div>
        <div className="relative ml-auto w-full sm:w-60"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-tertiary" /><input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} aria-label="Search RSVP guests" placeholder="Search guests" className={cn(inputClass, "pl-9")} /></div>
        <div className="flex items-center gap-2"><details ref={columnsMenu} className="group relative"><summary className="inline-flex min-h-10 cursor-pointer list-none items-center gap-2 rounded-xl border border-border-default px-3 text-sm font-medium text-text-primary hover:bg-[#f5f7f5] [&::-webkit-details-marker]:hidden"><FileSpreadsheet className="size-4" />Columns<ChevronDown className="size-4 transition-transform group-open:rotate-180" /></summary><div className="absolute right-0 top-full z-20 mt-1 w-48 rounded-xl border border-border-subtle bg-white p-2 shadow-[var(--shadow-md)]">{(["contact", "channel", "answers"] as const).map((key) => <label key={key} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-sm capitalize hover:bg-[#f5f7f5]"><input type="checkbox" checked={visibleColumns[key]} onChange={(event) => setVisibleColumns({ ...visibleColumns, [key]: event.target.checked })} className="accent-brand-primary" />{key === "channel" ? "Reply channel" : key}</label>)}</div></details><Button size="sm" variant="outline" leadingIcon={<Download className="size-3.5" />} onClick={() => void exportExcel()}>Export Excel</Button></div>
      </div>
      {guests.length ? <div className="overflow-x-auto"><table className="w-full min-w-[680px] text-left text-sm"><thead className="border-b border-border-subtle bg-[#f7f9f7] text-xs font-semibold text-[#52675c]"><tr><th className="px-5 py-3.5" scope="col">Guest</th><th className="px-5 py-3.5" scope="col">Response</th>{visibleColumns.contact && <th className="px-5 py-3.5" scope="col">Contact</th>}{visibleColumns.channel && <th className="px-5 py-3.5" scope="col">Reply channel</th>}{visibleColumns.answers && <th className="px-5 py-3.5" scope="col">Answers</th>}</tr></thead><tbody className="divide-y divide-border-subtle">{pageRows.map((guest) => <tr key={guest.id} className="hover:bg-[#fbfdfb]"><th scope="row" className="px-5 py-4 font-semibold">{guest.name}</th><td className="px-5 py-4"><Select ariaLabel={`RSVP response for ${guest.name}`} value={guest.rsvp} onValueChange={(value) => recordResponse(guest, value as GuestRsvp)} options={[{ value: "pending", label: "No reply" }, { value: "coming", label: "Coming" }, { value: "maybe", label: "Maybe" }, { value: "not-coming", label: "Not coming" }]} className={cn("h-9 w-[144px] gap-2 whitespace-nowrap rounded-full border-0 px-3.5 text-[13px] font-semibold shadow-none focus:ring-2 focus:ring-brand-primary/20", rsvpSelectTone[guest.rsvp])} /></td>{visibleColumns.contact && <td className="px-5 py-4 text-sm leading-5 text-text-secondary"><span className="block">{guest.phone || guest.email || "—"}</span>{guest.phone && guest.email && <span className="block text-xs text-text-tertiary">{guest.email}</span>}</td>}{visibleColumns.channel && <td className="px-5 py-4 text-sm text-text-secondary">{guest.responseChannel ?? "—"}</td>}{visibleColumns.answers && <td className="px-5 py-4 text-sm text-text-secondary">{guest.rsvp === "pending" ? "—" : `${guest.adults} ${guest.adults === 1 ? "adult" : "adults"} · ${guest.children} ${guest.children === 1 ? "child" : "children"}${guest.dietary ? ` · ${guest.dietary}` : ""}`}</td>}</tr>)}</tbody></table></div> : <div className="p-4"><Empty icon={MessageSquareText} title={data.guests.length ? "No responses match" : "Responses will gather here"} detail={data.guests.length ? "Try another filter or search." : "Build your guest list first. You can then record replies from calls, email or the collector."} /></div>}
      {guests.length > pageSize && <nav aria-label="RSVP response pages" className="flex flex-wrap items-center justify-between gap-3 border-t border-border-subtle bg-[#fbfcfb] px-4 py-3"><p className="text-xs text-text-secondary">Showing {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, guests.length)} of {guests.length} guests</p><div className="flex items-center gap-2"><Button size="sm" variant="outline" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>Previous</Button><span className="min-w-16 text-center text-xs font-semibold tabular-nums text-brand-primary">{currentPage} of {totalPages}</span><Button size="sm" variant="outline" disabled={currentPage === totalPages} onClick={() => setPage(currentPage + 1)}>Next</Button></div></nav>}
    </section> : <EventRsvpForm event={event} data={data} save={save} />}
  </div>;
}

function CollectPanel({ event, data, save, notice }: WorkspaceProps) {
  const [mode, setMode] = useState<"form" | "responses">("form");
  const [responseOpen, setResponseOpen] = useState(false);
  const [response, setResponse] = useState({ name: "", phone: "", email: "", adults: "1", children: "0", answers: "" });
  const [filter, setFilter] = useState<"new" | "added" | "skipped" | "all">("all");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [formError, setFormError] = useState("");
  const collected = data.collectorResponses;
  const filtered = collected.filter((item) => (filter === "all" || item.status === filter) && `${item.name} ${item.phone} ${item.email}`.toLowerCase().includes(query.trim().toLowerCase()));
  const pageSize = 10;
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pageRows = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  function setResponseStatus(item: GuestCollectorResponse, status: "added" | "skipped") {
    save((current) => {
      const existing = current.guests.find((guest) => guest.id === item.guestId || (item.phone && guest.phone === item.phone) || (item.email && guest.email.toLowerCase() === item.email.toLowerCase()));
      const newGuest: EventGuest | undefined = status === "added" && !existing ? {
        id: crypto.randomUUID(), name: item.name, phone: item.phone, email: item.email, group: "", tags: [],
        rsvp: "pending", adults: item.adults, children: item.children, dietary: item.answers,
      } : undefined;
      return {
        ...current,
        guests: newGuest ? [...current.guests, newGuest] : current.guests,
        collectorResponses: current.collectorResponses.map((entry) => entry.id === item.id ? { ...entry, status, guestId: status === "added" ? (existing?.id ?? newGuest?.id) : entry.guestId } : entry),
      };
    });
    notice(status === "added" ? "Response added to the guest list." : "Response skipped.");
  }

  function addResponse(event: FormEvent) {
    event.preventDefault();
    if (!response.name.trim()) { setFormError("Enter a name."); return; }
    if (!response.phone.trim() && !response.email.trim()) { setFormError("Add a phone number or email."); return; }
    const item: GuestCollectorResponse = {
      id: crypto.randomUUID(), name: response.name.trim(), phone: response.phone.trim(), email: response.email.trim(),
      adults: Math.max(0, Number(response.adults) || 0), children: Math.max(0, Number(response.children) || 0),
      answers: response.answers.trim(), receivedAt: new Date().toISOString(), status: "new",
    };
    save((current) => ({ ...current, collectorResponses: [item, ...current.collectorResponses] }));
    setResponseOpen(false);
    setResponse({ name: "", phone: "", email: "", adults: "1", children: "0", answers: "" });
    setMode("responses"); setFilter("new"); setPage(1);
    setFormError("");
    notice("Response recorded for review.");
  }

  return <div className="space-y-4">
    <header className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="text-lg font-semibold">Collect guest details</h3><p className="mt-1 text-sm text-text-secondary">Share a short form before invitations, then review the names it gathers.</p></div>
      <div role="tablist" aria-label="Collect views" className="inline-flex items-center gap-1 rounded-xl border border-[#dce5df] bg-white p-1">
        <button type="button" role="tab" aria-selected={mode === "form"} onClick={() => setMode("form")} className={cn("rounded-lg px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-brand-primary", mode === "form" ? "bg-[#e1eee5] font-semibold text-brand-primary shadow-[inset_0_0_0_1px_#bdd8c4]" : "text-text-secondary hover:bg-[#f3f7f4]")}>Form</button>
        <button type="button" role="tab" aria-selected={mode === "responses"} onClick={() => setMode("responses")} className={cn("rounded-lg px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-brand-primary", mode === "responses" ? "bg-[#e1eee5] font-semibold text-brand-primary shadow-[inset_0_0_0_1px_#bdd8c4]" : "text-text-secondary hover:bg-[#f3f7f4]")}>Responses <span className="ml-1 tabular-nums opacity-70">{collected.length}</span></button>
      </div>
    </header>

    {mode === "form" ? <EventCollectForm event={event} data={data} save={save} /> :
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3"><Metric label="To review" value={collected.filter((item) => item.status === "new").length} icon={Clock3} tone="bg-[#edf1f4] text-[#667786]" /><Metric label="Added to guest list" value={collected.filter((item) => item.status === "added").length} icon={CheckCircle2} tone="bg-[#e7f6ec] text-[#30805a]" /><Metric label="Skipped" value={collected.filter((item) => item.status === "skipped").length} icon={X} tone="bg-[#f8eeee] text-[#ab6666]" /></div>
        <section className="overflow-hidden rounded-2xl border border-border-subtle bg-white">
          <div className="flex flex-wrap items-center gap-3 border-b border-border-subtle px-4 py-3">
            <div className="flex flex-wrap items-center gap-1">{([{ id: "all", label: "All" }, { id: "new", label: "New" }, { id: "added", label: "Added" }, { id: "skipped", label: "Skipped" }] as const).map((item) => <button key={item.id} type="button" aria-pressed={filter === item.id} onClick={() => { setFilter(item.id); setPage(1); }} className={cn("rounded-lg px-2.5 py-1.5 text-xs font-medium", filter === item.id ? "bg-[#e6f0e9] text-brand-primary" : "text-text-secondary hover:bg-[#f3f7f4]")}>{item.label}</button>)}</div>
            <div className="ml-auto flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto"><Button size="sm" variant="outline" leadingIcon={<Plus className="size-3.5" />} onClick={() => setResponseOpen(true)}>Record response</Button><div className="relative w-full sm:w-52"><Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-text-tertiary" /><input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} aria-label="Search collected responses" placeholder="Search name or contact" className={cn(inputClass, "h-9 pl-8 text-xs")} /></div><Button size="sm" variant="outline" leadingIcon={<Download className="size-3.5" />} onClick={() => downloadCsv(`${event.name}-collected-responses.csv`, [["Name", "Phone", "Email", "Adults", "Children", "Answers", "Received", "Status"], ...filtered.map((item) => [item.name, item.phone, item.email, String(item.adults), String(item.children), item.answers, item.receivedAt, item.status])])}>Export</Button></div>
          </div>
          {pageRows.length ? <div className="overflow-x-auto"><table className="w-full min-w-[780px] text-left text-sm">
            <thead className="bg-[#f7f9f7] text-xs font-semibold text-[#52675c]"><tr><th scope="col" className="px-4 py-3">Name</th><th scope="col" className="px-4 py-3">Phone / email</th><th scope="col" className="px-4 py-3">Party</th><th scope="col" className="px-4 py-3">Answers</th><th scope="col" className="px-4 py-3">Received</th><th scope="col" className="px-4 py-3">Status</th><th scope="col" className="px-4 py-3">Action</th></tr></thead>
            <tbody className="divide-y divide-border-subtle">{pageRows.map((item) => <tr key={item.id} className="hover:bg-[#fbfdfb]"><th scope="row" className="px-4 py-3 font-semibold">{item.name}{item.guestId && <span className="mt-0.5 block text-[11px] font-normal text-brand-primary">Already on your guest list</span>}</th><td className="px-4 py-3 text-xs leading-5 text-text-secondary">{item.phone && <span className="block">{item.phone}</span>}{item.email && <span className="block">{item.email}</span>}</td><td className="px-4 py-3 text-xs text-text-secondary">{item.adults} adults · {item.children} children</td><td className="px-4 py-3 text-xs text-text-secondary">{item.answers || "—"}</td><td className="px-4 py-3 whitespace-nowrap text-xs text-text-secondary">{new Date(item.receivedAt).toLocaleDateString()}</td><td className="px-4 py-3"><span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", item.status === "new" ? "bg-[#e9f1fb] text-[#3e6896]" : item.status === "added" ? "bg-[#e7f4eb] text-[#2e7350]" : "bg-[#f1f2f2] text-[#67747b]")}>{item.status === "new" ? "New" : item.status === "added" ? "Added" : "Skipped"}</span></td><td className="px-4 py-3">{item.status === "new" ? <div className="flex items-center gap-2"><button type="button" onClick={() => setResponseStatus(item, "added")} disabled={data.listLocked && !item.guestId} className="whitespace-nowrap text-xs font-semibold text-brand-primary hover:underline disabled:cursor-not-allowed disabled:opacity-40">{item.guestId ? "Mark added" : "Add to guest list"}</button><button type="button" onClick={() => setResponseStatus(item, "skipped")} className="text-xs text-text-secondary hover:underline">Skip</button></div> : <button type="button" onClick={() => save((current) => ({ ...current, collectorResponses: current.collectorResponses.map((entry) => entry.id === item.id ? { ...entry, status: "new" } : entry) }))} className="text-xs font-medium text-brand-primary hover:underline">Review again</button>}</td></tr>)}</tbody>
          </table></div> : <div className="p-4"><Empty icon={FileSpreadsheet} title={collected.length ? "No responses match" : "No responses yet"} detail={collected.length ? "Try another filter or search." : "Responses from the collector will appear here for review."} action={!collected.length && <Button size="sm" onClick={() => setResponseOpen(true)}>Record response</Button>} /></div>}
          {filtered.length > pageSize && <nav aria-label="Collected response pages" className="flex items-center justify-between gap-3 border-t border-border-subtle px-4 py-3 text-xs"><span className="text-text-secondary">Showing {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filtered.length)} of {filtered.length}</span><div className="flex items-center gap-2"><Button size="sm" variant="outline" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>Previous</Button><span className="tabular-nums">{currentPage} of {pageCount}</span><Button size="sm" variant="outline" disabled={currentPage === pageCount} onClick={() => setPage(currentPage + 1)}>Next</Button></div></nav>}
        </section>
      </div>}

    <GuestDialog open={responseOpen} onOpenChange={setResponseOpen} title="Record a response" description="This response will wait for review before joining the guest list.">
      <form onSubmit={addResponse} className="space-y-4">
        <Input label="Name" value={response.name} onChange={(event) => setResponse({ ...response, name: event.target.value })} required />
        <div className="grid gap-3 sm:grid-cols-2"><Input label="Phone" value={response.phone} onChange={(event) => setResponse({ ...response, phone: event.target.value })} /><Input label="Email" type="email" value={response.email} onChange={(event) => setResponse({ ...response, email: event.target.value })} /></div>
        <div className="grid gap-3 sm:grid-cols-2"><Input label="Adults" type="number" min="0" value={response.adults} onChange={(event) => setResponse({ ...response, adults: event.target.value })} /><Input label="Children" type="number" min="0" value={response.children} onChange={(event) => setResponse({ ...response, children: event.target.value })} /></div>
        <Input label="Other answers" value={response.answers} onChange={(event) => setResponse({ ...response, answers: event.target.value })} placeholder="e.g. Vegetarian" />
        {formError && <p role="alert" className="text-sm text-error">{formError}</p>}
        <div className="flex justify-end"><Button type="submit">Add response</Button></div>
      </form>
    </GuestDialog>
  </div>;
}
