"use client";

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { EventRsvpForm } from "@/components/planner/event-rsvp-form";
import { EventCollectForm } from "@/components/planner/event-collect-form";
import { EventSeatingPanel } from "@/components/planner/event-seating-panel";
import { EventCheckinPanel } from "@/components/planner/event-checkin-panel";
import { EventGuestMessagesPanel } from "@/components/planner/event-guest-messages-panel";
import {
  Bell, CalendarDays, Check, CheckCircle2, ChevronDown, CircleAlert, Clock3, Download, FileSpreadsheet,
  LockSimple, Mail, MessageSquareText, Phone, Plus, Search, Send, Upload, UsersRound, X,
} from "@/components/ui/icons";
import { cn } from "@/lib/utils/cn";
import { formatEventDate, updatePlannerEvent, type PlannerEvent } from "@/lib/planner-events";
import { guestWorkspaceData, rsvpLabel, type EventGuest, type GuestCollectorResponse, type GuestRsvp, type GuestWorkspaceData } from "@/lib/event-guests";

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

function GuestDialog({ open, onOpenChange, title, description, children, footer }: { open: boolean; onOpenChange: (open: boolean) => void; title: string; description?: string; children: ReactNode; footer?: ReactNode }) {
  return <Dialog.Root open={open} onOpenChange={onOpenChange}><Dialog.Portal><Dialog.Overlay className="fixed inset-0 z-50 bg-[#172d23]/45 backdrop-blur-[2px]" /><Dialog.Content className="fixed left-1/2 top-1/2 z-50 flex max-h-[min(90dvh,780px)] w-[calc(100vw-2rem)] max-w-xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-border-subtle bg-white shadow-[var(--shadow-lg)] focus:outline-none"><header className="flex items-start justify-between gap-4 border-b border-border-subtle px-5 py-4 sm:px-6"><div><Dialog.Title className="text-lg font-semibold tracking-tight">{title}</Dialog.Title>{description && <Dialog.Description className="mt-1 text-sm text-text-secondary">{description}</Dialog.Description>}</div><Dialog.Close asChild><button type="button" aria-label="Close dialog" className="flex size-9 shrink-0 items-center justify-center rounded-lg text-text-secondary hover:bg-background-subtle"><X className="size-4" /></button></Dialog.Close></header><div className="min-h-0 overflow-y-auto px-5 py-5 sm:px-6">{children}</div>{footer && <footer className="flex flex-wrap justify-end gap-2 border-t border-border-subtle px-5 py-4 sm:px-6">{footer}</footer>}</Dialog.Content></Dialog.Portal></Dialog.Root>;
}

function Empty({ icon: Icon, title, detail, action }: { icon: typeof UsersRound; title: string; detail: string; action?: ReactNode }) {
  return <div className="flex min-h-52 flex-col items-center justify-center rounded-2xl border border-dashed border-[#d6e2d8] bg-[#fbfdfb] px-5 py-9 text-center"><span className="flex size-11 items-center justify-center rounded-xl bg-[#e9f2ec] text-brand-primary"><Icon className="size-5" /></span><h3 className="mt-3 text-base font-semibold">{title}</h3><p className="mt-1 max-w-md text-sm leading-6 text-text-secondary">{detail}</p>{action && <div className="mt-4">{action}</div>}</div>;
}

function Metric({ label, value, icon: Icon, tone }: { label: string; value: number; icon: typeof UsersRound; tone: string }) { return <div className="flex min-w-0 items-center gap-3 rounded-xl border border-border-subtle bg-white px-4 py-3.5"><span className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg", tone)}><Icon className="size-[18px]" /></span><div><strong className="block text-xl font-semibold tabular-nums leading-6">{value.toLocaleString()}</strong><span className="text-xs text-text-secondary">{label}</span></div></div>; }

export function EventGuestsWorkspace({ event }: { event: PlannerEvent }) {
  const [section, setSection] = useState<Section>("list");
  const [flash, setFlash] = useState("");
  const [composeRequest, setComposeRequest] = useState<{ kind: InvitationKind; id: number } | null>(null);
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
  function save(recipe: (current: GuestWorkspaceData) => GuestWorkspaceData) {
    try { updatePlannerEvent(event.id, (current) => ({ ...current, guestWorkspace: recipe(guestWorkspaceData(current.guestWorkspace)) })); }
    catch { setFlash("This change could not be saved in this browser. Please try again."); }
  }
  const props: WorkspaceProps = { event, data, save, notice: setFlash };
  function prepareInvitation(kind: InvitationKind) {
    invitationMenu.current?.removeAttribute("open");
    setComposeRequest((current) => ({ kind, id: (current?.id ?? 0) + 1 }));
    setSection("messages");
  }
  return <div className="space-y-4"><header className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.11em] text-[#b78139]">The people who make the day</p><h2 className="mt-1 text-2xl font-semibold tracking-tight">Guests</h2><p className="mt-1 text-sm text-text-secondary">A clear place for invitations, responses, seating and arrival.</p></div>{section === "list" && <details ref={invitationMenu} className="group relative z-20"><summary className="inline-flex min-h-11 cursor-pointer list-none items-center gap-3 rounded-xl bg-gradient-to-r from-[#547e70] to-[#174b3c] px-5 text-sm font-semibold text-white shadow-[0_6px_16px_rgba(28,75,59,0.16)] transition hover:brightness-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary [&::-webkit-details-marker]:hidden"><Send className="size-4" />Send invitation<ChevronDown className="ml-1 size-4 transition-transform group-open:rotate-180" /></summary><div className="absolute right-0 top-full z-30 mt-2 w-64 rounded-xl border border-border-subtle bg-white p-1.5 shadow-[var(--shadow-md)]">{([{ kind: "invitation", label: "Invitation · request RSVP", icon: Send }, { kind: "reminder", label: "Reminder", icon: Bell }, { kind: "save-the-date", label: "Save the date", icon: CalendarDays }] as const).map(({ kind, label, icon: Icon }) => <button key={kind} type="button" onClick={() => prepareInvitation(kind)} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-text-primary hover:bg-[#f1f6f2] focus-visible:outline-2 focus-visible:outline-brand-primary"><Icon className="size-4 shrink-0 text-brand-primary" />{label}</button>)}</div></details>}</header>
    <nav aria-label="Guest workspace sections" className="min-w-0 overflow-x-auto rounded-xl border border-[#dce5df] bg-white p-1"><div className="flex min-w-max gap-1" role="tablist" aria-label="Guest workspace">{sections.map(({ id, label, icon: Icon }) => <button key={id} type="button" role="tab" aria-selected={section === id} onClick={() => { setComposeRequest(null); setSection(id); }} className={cn("inline-flex min-h-8 items-center gap-1.5 whitespace-nowrap rounded-lg px-3 text-xs font-medium transition-all focus-visible:outline-2 focus-visible:outline-brand-primary", section === id ? "bg-[#e1eee5] font-semibold text-brand-primary shadow-[inset_0_0_0_1px_#bdd8c4]" : "text-text-secondary hover:bg-[#f3f7f4] hover:text-brand-primary")}><Icon className="size-3.5" />{label}</button>)}</div></nav>
    {flash && <div role="status" className="flex items-center justify-between gap-3 rounded-xl border border-[#d3e7d7] bg-[#f2f8f3] px-4 py-3 text-sm text-brand-primary"><span>{flash}</span><button type="button" aria-label="Dismiss message" onClick={() => setFlash("")}><X className="size-4" /></button></div>}
    {section === "list" && <GuestList {...props} />}{section === "rsvp" && <RsvpPanel {...props} />}{section === "collect" && <CollectPanel {...props} />}{section === "seating" && <EventSeatingPanel {...props} />}{section === "checkin" && <EventCheckinPanel {...props} />}{section === "messages" && <EventGuestMessagesPanel key={composeRequest?.id ?? "messages"} {...props} composeKind={composeRequest?.kind} onCloseRequest={() => setComposeRequest(null)} />}
  </div>;
}

function GuestList({ event, data, save, notice }: WorkspaceProps) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string[]>([]);
  const [dialog, setDialog] = useState(false);
  const [retryOpen, setRetryOpen] = useState(false);
  const [unlockOpen, setUnlockOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", group: "", tags: "", adults: "1", children: "0", dietary: "" });
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const guests = data.guests;
  const locked = Boolean(data.listLocked);
  const coming = guests.filter((guest) => guest.rsvp === "coming");
  const failed = guests.filter((guest) => guest.invitationFailedAt);
  const counts = {
    coming: coming.length,
    pending: guests.filter((guest) => guest.rsvp === "pending").length,
    no: guests.filter((guest) => guest.rsvp === "not-coming").length,
    maybe: guests.filter((guest) => guest.rsvp === "maybe").length,
    invited: guests.filter((guest) => guest.invitedAt).length,
    notInvited: guests.filter((guest) => !guest.invitedAt && !guest.invitationFailedAt).length,
  };
  const visible = guests.filter((guest) => {
    const matchesFilter = filter === "all" || (filter === "not-invited" ? !guest.invitedAt && !guest.invitationFailedAt : filter === "invited" ? Boolean(guest.invitedAt) : filter === "no-reply" ? guest.rsvp === "pending" : guest.rsvp === filter);
    return matchesFilter && `${guest.name} ${guest.email} ${guest.phone} ${guest.group} ${guest.tags.join(" ")}`.toLowerCase().includes(query.toLowerCase());
  });
  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(visible.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageRows = visible.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const visibleIds = pageRows.map((guest) => guest.id);
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selected.includes(id));
  const filters = [
    { id: "all", label: "All", count: guests.length },
    { id: "not-invited", label: "Not invited", count: counts.notInvited },
    { id: "invited", label: "Invited", count: counts.invited },
    { id: "no-reply", label: "No reply", count: counts.pending },
    { id: "coming", label: "Coming", count: counts.coming },
    { id: "not-coming", label: "Not coming", count: counts.no },
    { id: "maybe", label: "Maybe", count: counts.maybe },
  ];
  const dietaryCount = (term: string) => coming.filter((guest) => guest.dietary.toLowerCase().includes(term)).length;
  function open() {
    if (locked) return;
    setForm({ name: "", email: "", phone: "", group: "", tags: "", adults: "1", children: "0", dietary: "" });
    setError(""); setDialog(true);
  }
  function submit(e: FormEvent) {
    e.preventDefault();
    if (locked) return;
    const name = form.name.trim();
    if (!name) { setError("Enter the guest’s name."); return; }
    if (!form.email.trim() && !form.phone.trim()) { setError("Add an email address or phone number so the guest can be reached."); return; }
    const adults = Number(form.adults), children = Number(form.children);
    if (!Number.isInteger(adults) || adults < 0 || !Number.isInteger(children) || children < 0) { setError("Adults and children must be whole numbers of zero or more."); return; }
    const guest: EventGuest = {
      id: crypto.randomUUID(), name, email: form.email.trim(), phone: form.phone.trim(), group: form.group.trim(),
      tags: form.tags.split(",").map((tag) => tag.trim()).filter(Boolean), rsvp: "pending",
      adults, children, dietary: form.dietary.trim(),
    };
    save((current) => ({ ...current, guests: [...current.guests, guest] }));
    setDialog(false);
  }
  async function importFile(file?: File) {
    if (!file || locked) return;
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
    downloadCsv(`${event.name}-${suffix}.csv`, [["Name", "Email", "Phone", "Group", "Tags", "RSVP", "Invitation", "Table", "Adults", "Children", "Dietary"], ...items.map((guest) => [guest.name, guest.email, guest.phone, guest.group, guest.tags.join(", "), rsvpLabel[guest.rsvp], guest.invitationFailedAt ? "Failed" : guest.invitedAt ? "Sent" : "Not sent", data.tables.find((table) => table.id === guest.tableId)?.name ?? "", String(guest.adults), String(guest.children), guest.dietary])]);
  }
  return <div className="space-y-6">
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5"><Metric label="Total guests" value={guests.length} icon={UsersRound} tone="bg-[#e9f1fb] text-[#507a9d]" /><Metric label="Confirmed" value={counts.coming} icon={CheckCircle2} tone="bg-[#e7f6ec] text-[#30805a]" /><Metric label="Pending" value={counts.pending} icon={Clock3} tone="bg-[#edf1f4] text-[#667786]" /><Metric label="Not coming" value={counts.no} icon={X} tone="bg-[#fceeee] text-[#b85858]" /><Metric label="Maybe" value={counts.maybe} icon={CircleAlert} tone="bg-[#fff3df] text-[#a2772e]" /></div>
    <section className="overflow-hidden rounded-2xl border border-border-subtle bg-white">
      <div className="flex flex-wrap items-center gap-3 border-b border-border-subtle px-5 py-4"><div className="relative min-w-[220px] flex-1"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-tertiary" /><input aria-label="Search guests" value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} placeholder="Search name, contact, group or tag" className={cn(inputClass, "pl-9")} /></div><input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" aria-label="Import guests CSV" onChange={(e) => void importFile(e.target.files?.[0])} /><Button type="button" variant="outline" disabled={locked} leadingIcon={<Upload className="size-4" />} onClick={() => fileRef.current?.click()}>Import</Button><Button type="button" variant="outline" leadingIcon={<Download className="size-4" />} onClick={() => exportGuests(guests, "guests")}>Export</Button><Button type="button" disabled={locked} leadingIcon={<Plus className="size-4" />} onClick={() => open()}>Add guest</Button></div>
      <div className="flex flex-wrap items-center gap-3 border-b border-border-subtle px-5 py-3" role="group" aria-label="Filter guests"><div className="flex flex-1 flex-wrap gap-1.5">{filters.map((item) => <button key={item.id} type="button" onClick={() => { setFilter(item.id); setPage(1); }} aria-pressed={filter === item.id} className={cn("rounded-lg px-3 py-2 text-xs font-medium transition-colors", filter === item.id ? "bg-[#eaf2ec] text-brand-primary" : "text-text-secondary hover:bg-[#f5f7f5]")}>{item.label} <span className="ml-1 tabular-nums opacity-70">{item.count}</span></button>)}</div>{failed.length > 0 && <button type="button" onClick={() => setRetryOpen(true)} className="rounded-lg border border-border-subtle bg-white px-3 py-2 text-xs font-medium text-text-secondary hover:border-[#b8d2bf] hover:text-brand-primary">Retry failed ({failed.length})</button>}</div>
      {selected.length > 0 && <div className="flex flex-wrap items-center gap-3 border-b border-border-subtle bg-[#eff6f1] px-4 py-2.5 text-xs"><strong className="text-brand-primary">{selected.length} selected</strong><button type="button" className="font-semibold text-brand-primary hover:underline" onClick={() => exportGuests(guests.filter((guest) => selected.includes(guest.id)), "selected-guests")}>Export selected</button><button type="button" className="text-text-secondary hover:underline" onClick={() => setSelected([])}>Clear selection</button></div>}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border-subtle bg-[#f7faf8] px-5 py-4"><div><p className="text-sm font-semibold text-[#263d32]">Final numbers</p><p className="mt-1 text-xs leading-5 text-text-secondary">Coming {counts.coming} · adults {coming.reduce((sum, guest) => sum + guest.adults, 0)} · children {coming.reduce((sum, guest) => sum + guest.children, 0)} · {dietaryCount("vegetarian")} vegetarian · {dietaryCount("nuts")} no nuts · {dietaryCount("halal")} halal</p></div><Button variant="outline" size="sm" leadingIcon={<LockSimple className="size-4" />} onClick={() => { if (locked) setUnlockOpen(true); else save((current) => ({ ...current, listLocked: true })); }}>{locked ? "Unlock list" : "Lock the list"}</Button></div>
      {locked && <p className="border-b border-border-subtle bg-[#fffaf0] px-4 py-2 text-xs text-[#825f2d]">Guest names and contact details are locked. RSVP, seating and check-in can still change.</p>}
      {visible.length ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-left text-sm">
            <thead className="border-b border-border-subtle bg-[#f3f7f4] text-xs font-semibold uppercase tracking-[0.045em] text-[#436352]">
              <tr>
                <th scope="col" className="w-10 px-5 py-4">
                  <input type="checkbox" aria-label="Select all visible guests" checked={allVisibleSelected} onChange={() => setSelected((current) => allVisibleSelected ? current.filter((id) => !visibleIds.includes(id)) : [...new Set([...current, ...visibleIds])])} className="size-4 accent-brand-primary" />
                </th>
                {["Guest", "Contact", "RSVP response", "RSVP sent", "Group", "Tags", "Table"].map((label) => <th key={label} scope="col" className="px-5 py-4">{label}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {pageRows.map((guest) => <tr key={guest.id} className="hover:bg-[#fbfdfb]">
                <td className="px-5 py-4"><input type="checkbox" aria-label={`Select ${guest.name}`} checked={selected.includes(guest.id)} onChange={() => toggleSelected(guest.id)} className="size-4 accent-brand-primary" /></td>
                <th scope="row" className="whitespace-nowrap px-5 py-4 font-semibold">{guest.name}</th>
                <td className="px-5 py-4 text-xs leading-5 text-text-secondary"><span className="flex items-center gap-1.5"><Mail className="size-3.5 shrink-0" />{guest.email || "No email"}</span><span className="mt-1 flex items-center gap-1.5"><Phone className="size-3.5 shrink-0" />{guest.phone || "No phone number"}</span></td>
                <td className="px-5 py-4"><Select ariaLabel={`RSVP response for ${guest.name}`} value={guest.rsvp} onValueChange={(value) => setRsvp(guest.id, value)} options={rsvpOptions} className={cn("h-9 w-[144px] gap-2 whitespace-nowrap rounded-full border-0 px-3.5 text-[13px] font-semibold shadow-none focus:ring-2 focus:ring-brand-primary/20", rsvpSelectTone[guest.rsvp])} /></td>
                <td className="whitespace-nowrap px-5 py-4 text-xs text-text-secondary">{guest.invitationFailedAt ? <span className="text-error">Failed</span> : guest.invitedAt ? formatEventDate(guest.invitedAt.slice(0, 10), { day: "numeric", month: "short", year: "numeric" }) : "Not sent"}</td>
                <td className="px-5 py-4 text-xs text-text-secondary">{guest.group || "—"}</td>
                <td className="px-5 py-4"><div className="flex max-w-48 flex-wrap gap-1">{guest.tags.length ? guest.tags.map((tag) => <span key={tag} className="rounded-full bg-[#eaf2ed] px-2 py-1 text-[11px] font-medium text-[#477462]">{tag}</span>) : <span className="text-text-tertiary">—</span>}</div></td>
                <td className="px-5 py-4"><Select ariaLabel={`Table for ${guest.name}`} value={guest.tableId ?? "none"} onValueChange={(value) => setTable(guest.id, value)} options={[{ value: "none", label: "Unassigned" }, ...data.tables.map((table) => ({ value: table.id, label: table.name }))]} className={cn("h-9 w-[150px] gap-2 whitespace-nowrap rounded-full border-0 px-3.5 text-[13px] font-semibold shadow-none focus:ring-2 focus:ring-brand-primary/20 [&>span:first-child]:min-w-0 [&>span:first-child]:flex-1 [&>span:first-child]:truncate", guest.tableId ? "bg-[#eaf2ec] text-[#376b53] hover:bg-[#e2eee5]" : "bg-[#f0f1f6] text-[#5d6476] hover:bg-[#e9ebf2]")} /></td>
              </tr>)}
            </tbody>
          </table>
        </div>
      ) : <div className="p-4"><Empty icon={UsersRound} title={guests.length ? "No guests match" : "Start the guest list"} detail={guests.length ? "Try a different search or filter." : "Add guests one by one, or import a CSV with names and contact details."} action={!guests.length && !locked && <Button size="sm" leadingIcon={<Plus className="size-4" />} onClick={() => open()}>Add first guest</Button>} /></div>}
      {visible.length > pageSize && <nav aria-label="Guest list pages" className="flex flex-wrap items-center justify-between gap-3 border-t border-border-subtle bg-[#fbfcfb] px-4 py-3"><p className="text-xs text-text-secondary">Showing {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, visible.length)} of {visible.length} guests</p><div className="flex items-center gap-2"><Button type="button" size="sm" variant="outline" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>Previous</Button><span className="min-w-16 text-center text-xs font-semibold tabular-nums text-[#315a45]">{currentPage} of {totalPages}</span><Button type="button" size="sm" variant="outline" disabled={currentPage === totalPages} onClick={() => setPage(currentPage + 1)}>Next</Button></div></nav>}
    </section>
    <GuestDialog open={dialog} onOpenChange={setDialog} title="Add guest" description="Keep the name and contact details together for every part of the guest plan."><form onSubmit={submit} className="space-y-4"><Input label="Guest name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Ngozi Okafor" /><div className="grid gap-4 sm:grid-cols-2"><Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="name@example.com" /><Input label="Phone / WhatsApp" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+234…" /></div><div className="grid gap-4 sm:grid-cols-2"><Input label="Group" value={form.group} onChange={(e) => setForm({ ...form, group: e.target.value })} placeholder="e.g. Bride’s family" /><Input label="Tags" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="VIP, family" /></div><div className="grid gap-4 sm:grid-cols-2"><Input label="Adults" type="number" min="0" value={form.adults} onChange={(e) => setForm({ ...form, adults: e.target.value })} /><Input label="Children" type="number" min="0" value={form.children} onChange={(e) => setForm({ ...form, children: e.target.value })} /></div><Input label="Dietary needs" value={form.dietary} onChange={(e) => setForm({ ...form, dietary: e.target.value })} placeholder="e.g. Vegetarian, no nuts" />{error && <p role="alert" className="text-sm text-error">{error}</p>}<div className="flex justify-end pt-2"><Button type="submit">Add guest</Button></div></form></GuestDialog>
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
