"use client";

import { useState, type FormEvent } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ChevronDown, Download, Mail, MessageSquareText, Plus, Send, X } from "@/components/ui/icons";
import { formatEventDate, type PlannerEvent } from "@/lib/planner-events";
import { type EventGuest, type GuestMessage, type GuestWorkspaceData } from "@/lib/event-guests";

type InvitationKind = "invitation" | "reminder" | "save-the-date";
type DeliveryStatus = "read" | "opened" | "delivered" | "failed" | "pending";
type Recipient = { id: string; name: string; channel: GuestMessage["channel"]; status: DeliveryStatus; rsvp: boolean };
type Run = { id: string; kind: string; sentAt: string; subject: string; body: string; recipients: Recipient[]; credits: number; author: string };
type Props = {
  event: PlannerEvent;
  data: GuestWorkspaceData;
  save: (recipe: (current: GuestWorkspaceData) => GuestWorkspaceData) => void;
  notice: (text: string) => void;
  composeKind?: InvitationKind;
  onCloseRequest: () => void;
};

const statusLabels: Record<DeliveryStatus, string> = { read: "Read", opened: "Opened", delivered: "Delivered", failed: "Failed", pending: "No status yet" };
const statusTone: Record<DeliveryStatus, string> = {
  read: "bg-[#e5f2eb] text-[#2f7456]", opened: "bg-[#e7f0fa] text-[#416c9b]",
  delivered: "bg-[#edf3f1] text-[#57756c]", failed: "bg-[#fbe9e9] text-[#b64c50]",
  pending: "bg-[#f0f2f2] text-[#66736f]",
};

function seedRuns(event: PlannerEvent, guests: EventGuest[]): Run[] {
  const eventDate = formatEventDate(event.date, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const invited = guests.filter((guest) => guest.invitedAt || guest.invitationFailedAt);
  const coming = guests.filter((guest) => guest.rsvp === "coming");
  if (!guests.length) return [];
  return [
    {
      id: "sample-invitations", kind: "Invitations", sentAt: "2026-10-26T10:00:00.000Z",
      subject: event.name, body: `You're invited to celebrate with us! ${eventDate} · ${event.city || "Location to follow"}. Please let us know if you can join us.`,
      recipients: invited.map((guest, index) => ({ id: guest.id, name: guest.name, channel: index % 6 === 0 ? "Email" : index % 9 === 0 ? "SMS" : "WhatsApp", status: guest.invitationFailedAt ? "failed" : guest.rsvp === "coming" ? "read" : guest.rsvp === "maybe" ? "opened" : "pending", rsvp: guest.rsvp === "coming" })),
      credits: Number((invited.filter((guest) => guest.phone).length * 0.01).toFixed(2)), author: "Planner",
    },
    {
      id: "sample-gate-morning", kind: "Gate codes", sentAt: "2026-11-03T11:00:00.000Z",
      subject: `Your guest code for ${event.name}`, body: "Please show your code to an usher when you arrive. We look forward to celebrating with you.",
      recipients: coming.slice(0, 5).map((guest, index) => ({ id: guest.id, name: guest.name, channel: index === 0 ? "Email" : "WhatsApp", status: index === 0 ? "opened" : "read", rsvp: true })),
      credits: 0.04, author: "Planner",
    },
    {
      id: "sample-gate-evening", kind: "Gate codes", sentAt: "2026-11-03T18:00:00.000Z",
      subject: `Your guest code for ${event.name}`, body: "Please keep this code ready at the entrance. Your name will be checked against the guest list.",
      recipients: coming.slice(5, 9).map((guest) => ({ id: guest.id, name: guest.name, channel: "WhatsApp", status: "read", rsvp: true })),
      credits: 0.04, author: "Planner",
    },
  ];
}

function csvDownload(filename: string, rows: string[][]) {
  const csv = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\r\n");
  const url = URL.createObjectURL(new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a"); link.href = url; link.download = filename; link.click(); URL.revokeObjectURL(url);
}

function FilterSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: { value: string; label: string }[] }) {
  return <div className="relative">
    <select aria-label={label} value={value} onChange={(event) => onChange(event.target.value)} className="h-9 min-w-32 appearance-none rounded-lg border border-border-subtle bg-white py-1.5 pl-3 pr-9 text-[13px] font-medium text-text-primary outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10">
      {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
    </select>
    <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 size-3.5 -translate-y-1/2 text-text-secondary" />
  </div>;
}

function ChannelPreview({ channel, run, event }: { channel: GuestMessage["channel"]; run: Run; event: PlannerEvent }) {
  const Icon = channel === "Email" ? Mail : channel === "WhatsApp" ? MessageSquareText : Send;
  return <div className="min-w-0 rounded-xl border border-border-subtle bg-[#fbfcfb] p-3.5">
    <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-text-secondary"><Icon className="size-3.5" />{channel}</div>
    <div className={channel === "WhatsApp" ? "rounded-lg bg-[#eaf2ed] p-3" : "p-1"}>
      <p className="text-[13px] font-semibold text-text-primary">{run.subject}</p>
      <p className="mt-1.5 text-xs leading-5 text-text-secondary">{run.body}</p>
      {run.kind === "Invitations" && <p className="mt-2 break-all text-[11px] font-medium text-brand-primary">{event.name} · RSVP</p>}
      {channel === "Email" && <p className="mt-2 text-[11px] text-text-secondary">Reply to this email to respond.</p>}
      {channel === "SMS" && <p className="mt-2 text-[11px] text-text-secondary">Reply YES or NO to respond.</p>}
    </div>
  </div>;
}

export function EventGuestMessagesPanel({ event, data, save, notice, composeKind, onCloseRequest }: Props) {
  const eventDate = formatEventDate(event.date, { day: "numeric", month: "long", year: "numeric" });
  const startingCopy = composeKind === "invitation"
    ? { subject: `You’re invited to ${event.name}`, body: `We’d love to celebrate with you at ${event.name} on ${eventDate}. Please let us know whether you can join us.` }
    : composeKind === "reminder" ? { subject: `A reminder about ${event.name}`, body: `We’re looking forward to ${event.name} on ${eventDate}. Please let us know if you can join us.` }
      : composeKind === "save-the-date" ? { subject: `Save the date for ${event.name}`, body: `Please save ${eventDate} for ${event.name}. We’ll share more details soon.` } : { subject: "", body: "" };
  const [dialog, setDialog] = useState(Boolean(composeKind));
  const [subject, setSubject] = useState(startingCopy.subject);
  const [body, setBody] = useState(startingCopy.body);
  const [channel, setChannel] = useState<GuestMessage["channel"]>("Email");
  const [audience, setAudience] = useState(composeKind === "reminder" ? "pending" : "all");
  const [error, setError] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [channelFilter, setChannelFilter] = useState("all");
  const [expanded, setExpanded] = useState<string | null>(data.sampleSeeded ? "sample-invitations" : null);
  const [deliveryFilter, setDeliveryFilter] = useState("all");
  const [showAllRecipients, setShowAllRecipients] = useState(false);
  const eligible = data.guests.filter((guest) => (audience === "all" || guest.rsvp === audience) && (channel === "Email" ? Boolean(guest.email) : Boolean(guest.phone)));
  const runs = data.sampleSeeded ? seedRuns(event, data.guests) : [];
  const filteredRuns = runs.filter((run) => (typeFilter === "all" || run.kind === typeFilter) && (channelFilter === "all" || run.recipients.some((recipient) => recipient.channel === channelFilter)));

  function saveDraft(e: FormEvent) {
    e.preventDefault();
    if (!subject.trim() || !body.trim()) { setError("Add a subject and message."); return; }
    const message: GuestMessage = { id: crypto.randomUUID(), subject: subject.trim(), body: body.trim(), channel, audience, createdAt: new Date().toISOString(), recipients: eligible.length };
    save((current) => ({ ...current, messages: [message, ...current.messages] }));
    setDialog(false); onCloseRequest(); setSubject(""); setBody(""); setError(""); notice("Message draft saved.");
  }

  return <div className="space-y-5">
    <header className="flex flex-wrap items-start justify-between gap-3">
      <div><h3 className="text-lg font-semibold tracking-tight">Messages</h3><p className="mt-1 text-sm text-text-secondary">Email is free. WhatsApp and SMS use NXTEVNT credits.</p></div>
      <Button size="sm" leadingIcon={<Plus className="size-4" />} onClick={() => setDialog(true)}>Compose message</Button>
    </header>

    <div className="flex flex-wrap items-center gap-2">
      <FilterSelect label="Message type" value={typeFilter} onChange={setTypeFilter} options={[{ value: "all", label: "All messages" }, { value: "Invitations", label: "Invitations" }, { value: "Gate codes", label: "Gate codes" }]} />
      <FilterSelect label="Message channel" value={channelFilter} onChange={setChannelFilter} options={[{ value: "all", label: "All channels" }, { value: "WhatsApp", label: "WhatsApp" }, { value: "Email", label: "Email" }, { value: "SMS", label: "SMS" }]} />
      <Button size="sm" variant="outline" leadingIcon={<Download className="size-3.5" />} onClick={() => csvDownload(`${event.name}-messages.csv`, [["Date", "Type", "Guest", "Channel", "Status", "RSVP"], ...filteredRuns.flatMap((run) => run.recipients.filter((recipient) => channelFilter === "all" || recipient.channel === channelFilter).map((recipient) => [run.sentAt, run.kind, recipient.name, recipient.channel, statusLabels[recipient.status], recipient.rsvp ? "Yes" : "No"]))])}>Export</Button>
    </div>

    {data.messages.length > 0 && <section aria-label="Message drafts" className="overflow-hidden rounded-xl border border-border-subtle bg-white">
      <div className="border-b border-border-subtle px-4 py-2 text-xs font-semibold uppercase tracking-wide text-text-secondary">Drafts</div>
      {data.messages.map((message) => <button key={message.id} type="button" onClick={() => { setSubject(message.subject); setBody(message.body); setChannel(message.channel); setAudience(message.audience); setDialog(true); }} className="flex w-full items-center justify-between gap-4 border-b border-border-subtle px-4 py-3 text-left last:border-b-0 hover:bg-[#f7faf8]"><span className="min-w-0"><strong className="block truncate text-sm">{message.subject}</strong><span className="mt-0.5 block text-xs text-text-secondary">{message.channel} · {message.recipients} eligible guests · Saved {new Date(message.createdAt).toLocaleDateString()}</span></span><span className="shrink-0 text-xs font-semibold text-brand-primary">Open draft</span></button>)}
    </section>}

    {filteredRuns.length > 0 ? <section aria-label="Message history" className="space-y-2.5">
      {filteredRuns.map((run) => {
        const shownRecipients = run.recipients.filter((recipient) => channelFilter === "all" || recipient.channel === channelFilter);
        const counts = { read: run.recipients.filter((r) => r.status === "read").length, opened: run.recipients.filter((r) => r.status === "opened").length, delivered: run.recipients.filter((r) => r.status === "delivered").length, failed: run.recipients.filter((r) => r.status === "failed").length, rsvp: run.recipients.filter((r) => r.rsvp).length };
        const channels = (["WhatsApp", "SMS", "Email"] as const).map((name) => ({ name, count: run.recipients.filter((recipient) => recipient.channel === name).length })).filter((item) => item.count);
        const isOpen = expanded === run.id;
        const visibleRecipients = shownRecipients.filter((recipient) => deliveryFilter === "all" || deliveryFilter === "seen" && ["read", "opened"].includes(recipient.status) || deliveryFilter === "delivered" && recipient.status === "delivered" || deliveryFilter === "pending" && recipient.status === "pending" || deliveryFilter === "failed" && recipient.status === "failed");
        return <article key={run.id} className="overflow-hidden rounded-xl border border-border-subtle bg-white">
          <button type="button" aria-expanded={isOpen} onClick={() => { setExpanded(isOpen ? null : run.id); setDeliveryFilter("all"); setShowAllRecipients(false); }} className="flex w-full flex-wrap items-center gap-x-3 gap-y-1.5 px-4 py-3 text-left hover:bg-[#f7faf8] focus-visible:outline-2 focus-visible:outline-brand-primary sm:px-5">
            <span className="whitespace-nowrap text-[13px] font-semibold text-text-primary">{new Date(run.sentAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })} · {new Date(run.sentAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false })}</span>
            <span className="rounded-full bg-[#f0f2f1] px-2.5 py-0.5 text-xs font-medium text-text-primary">{run.kind}</span>
            <span className="min-w-0 flex-1 text-xs leading-5 text-text-secondary">{run.recipients.length} recipients · {channels.map((item) => `${item.count} ${item.name}`).join(" · ")} · {run.credits.toFixed(2)} credits · by {run.author}</span>
            <span className="ml-auto flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-text-secondary"><span className="text-[#2f7456]">Read {counts.read}</span><span>Delivered {counts.delivered}</span><span>Opened {counts.opened}</span><span className={counts.failed ? "text-[#b64c50]" : ""}>Failed {counts.failed}</span><span>RSVP yes {counts.rsvp}</span><ChevronDown className={`ml-0.5 size-4 transition-transform ${isOpen ? "rotate-180" : ""}`} /></span>
          </button>
          {isOpen && <div className="border-t border-border-subtle px-4 py-4 sm:px-5">
            <div className={`grid gap-3 ${channels.length > 1 ? "md:grid-cols-2" : ""} ${channels.length > 2 ? "lg:grid-cols-3" : ""}`}>
              {channels.map(({ name }) => <ChannelPreview key={name} channel={name} run={run} event={event} />)}
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border-subtle pt-4">
              <div className="flex flex-wrap items-center gap-1">{([{ id: "all", label: "All" }, { id: "seen", label: "Read / Opened" }, { id: "delivered", label: "Delivered only" }, { id: "pending", label: "No status yet" }, { id: "failed", label: "Failed" }] as const).map((filter) => <button key={filter.id} type="button" aria-pressed={deliveryFilter === filter.id} onClick={() => { setDeliveryFilter(filter.id); setShowAllRecipients(false); }} className={`rounded-lg px-2.5 py-1.5 text-xs font-medium ${deliveryFilter === filter.id ? "bg-[#e8f1ea] text-brand-primary" : "text-text-secondary hover:bg-[#f2f6f3]"}`}>{filter.label}</button>)}</div>
              {counts.failed > 0 && <button type="button" onClick={() => { setDeliveryFilter("failed"); notice("Failed recipients are shown below for review."); }} className="rounded-lg border border-border-subtle px-3 py-1.5 text-xs font-semibold text-text-primary hover:bg-[#f7faf8]">Review failed ({counts.failed})</button>}
            </div>
            <div className="mt-3 overflow-hidden rounded-xl border border-border-subtle">
              {visibleRecipients.length ? (showAllRecipients ? visibleRecipients : visibleRecipients.slice(0, 10)).map((recipient) => <div key={recipient.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-border-subtle px-3.5 py-2.5 text-[13px] last:border-b-0"><span className="font-medium text-text-primary">{recipient.name}</span><span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${statusTone[recipient.status]}`}>{recipient.channel} · {statusLabels[recipient.status]}</span></div>) : <p className="px-3.5 py-5 text-center text-xs text-text-secondary">No recipients match this filter.</p>}
              {!showAllRecipients && visibleRecipients.length > 10 && <button type="button" onClick={() => setShowAllRecipients(true)} className="w-full border-t border-border-subtle px-3.5 py-2 text-center text-xs font-semibold text-brand-primary hover:bg-[#f7faf8]">Show all {visibleRecipients.length} recipients</button>}
            </div>
          </div>}
        </article>;
      })}
    </section> : <div className="rounded-xl border border-dashed border-border-subtle bg-white px-5 py-10 text-center"><MessageSquareText className="mx-auto size-7 text-text-tertiary" /><p className="mt-3 text-sm font-semibold">{runs.length ? "No messages match these filters" : "No messages yet"}</p><p className="mt-1 text-xs text-text-secondary">{runs.length ? "Try another type or channel." : "Compose an invitation or update, then save it for review."}</p></div>}

    <Dialog.Root open={dialog} onOpenChange={(open) => { setDialog(open); if (!open) onCloseRequest(); }}><Dialog.Portal><Dialog.Overlay className="fixed inset-0 z-50 bg-[#172d23]/45 backdrop-blur-[2px]" /><Dialog.Content className="fixed left-1/2 top-1/2 z-50 flex max-h-[90dvh] w-[calc(100vw-2rem)] max-w-xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-border-subtle bg-white shadow-[var(--shadow-lg)] focus:outline-none"><header className="flex items-start justify-between gap-4 border-b border-border-subtle px-5 py-4 sm:px-6"><div><Dialog.Title className="text-lg font-semibold">Compose a message</Dialog.Title><Dialog.Description className="mt-1 text-sm text-text-secondary">For {event.name}. Review the eligible guest count before saving.</Dialog.Description></div><Dialog.Close asChild><button type="button" aria-label="Close dialog" className="flex size-9 shrink-0 items-center justify-center rounded-lg text-text-secondary hover:bg-background-subtle"><X className="size-4" /></button></Dialog.Close></header><div className="overflow-y-auto px-5 py-5 sm:px-6"><form onSubmit={saveDraft} className="space-y-4"><div className="grid gap-3 sm:grid-cols-2"><Select label="Channel" value={channel} onValueChange={(value) => setChannel(value as GuestMessage["channel"])} options={["Email", "WhatsApp", "SMS"].map((value) => ({ value, label: value }))} /><Select label="Audience" value={audience} onValueChange={setAudience} options={[{ value: "all", label: "All guests" }, { value: "pending", label: "No reply" }, { value: "coming", label: "Coming" }, { value: "maybe", label: "Maybe" }, { value: "not-coming", label: "Not coming" }]} /></div><p className="rounded-lg bg-[#f4f7f5] px-3 py-2 text-xs text-text-secondary">{eligible.length} guests have {channel === "Email" ? "an email address" : "a phone number"} in this audience.</p><Input label="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} required placeholder="e.g. An update about the celebration" /><Textarea label="Message" value={body} onChange={(e) => setBody(e.target.value)} rows={6} required placeholder="Write the message here…" />{error && <p role="alert" className="text-sm text-error">{error}</p>}<div className="flex justify-end"><Button type="submit">Save draft</Button></div></form></div></Dialog.Content></Dialog.Portal></Dialog.Root>
  </div>;
}
