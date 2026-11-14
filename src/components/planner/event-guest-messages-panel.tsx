"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CalendarDays, Check, ChevronDown, CircleDollarSign, Download, Globe2, Mail, MapPin, MessageSquareText, Plus, Send, WhatsApp, X } from "@/components/ui/icons";
import { formatEventDate, type PlannerEvent } from "@/lib/planner-events";
import {
  type EventGuest,
  type GuestDeliveryStatus,
  type GuestMessage,
  type GuestMessageChannel,
  type GuestMessageKind,
  type GuestMessageRun,
  type GuestWorkspaceData,
} from "@/lib/event-guests";

type InvitationKind = "invitation" | "reminder" | "save-the-date";
type Props = {
  event: PlannerEvent;
  data: GuestWorkspaceData;
  save: (recipe: (current: GuestWorkspaceData) => GuestWorkspaceData) => void;
  notice: (text: string) => void;
  composeKind?: InvitationKind;
  recipientIds?: string[];
  onCloseRequest: () => void;
};

const statusLabels: Record<GuestDeliveryStatus, string> = { read: "Read", opened: "Opened", delivered: "Delivered", failed: "Failed", pending: "No status yet" };
const statusTone: Record<GuestDeliveryStatus, string> = {
  read: "bg-[#e5f2eb] text-[#2f7456]", opened: "bg-[#e7f0fa] text-[#416c9b]",
  delivered: "bg-[#edf3f1] text-[#57756c]", failed: "bg-[#fbe9e9] text-[#b64c50]",
  pending: "bg-[#f0f2f2] text-[#66736f]",
};

function seedRuns(event: PlannerEvent, guests: EventGuest[]): GuestMessageRun[] {
  const eventDate = formatEventDate(event.date, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const invited = guests.filter((guest) => guest.invitedAt || guest.invitationFailedAt);
  const coming = guests.filter((guest) => guest.rsvp === "coming");
  if (!guests.length) return [];
  return [
    {
      id: "sample-invitations", kind: "Invitation", sentAt: "2026-10-26T10:00:00.000Z",
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

function ChannelPreview({ channel, run }: { channel: GuestMessageChannel; run: GuestMessageRun }) {
  const Icon = channel === "Email" ? Mail : channel === "WhatsApp" ? MessageSquareText : Send;
  return <div className="min-w-0 rounded-xl border border-border-subtle bg-[#fbfcfb] p-3.5">
    <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-text-secondary"><Icon className="size-3.5" />{channel}</div>
    <div className={channel === "WhatsApp" ? "rounded-lg bg-[#eaf2ed] p-3" : "p-1"}>
      <p className="text-[13px] font-semibold text-text-primary">{run.subject}</p>
      <p className="mt-1.5 whitespace-pre-line text-xs leading-5 text-text-secondary">{run.body}</p>
      {channel === "Email" && <p className="mt-2 text-[11px] text-text-secondary">Reply to this email to respond.</p>}
      {channel === "SMS" && <p className="mt-2 text-[11px] text-text-secondary">Reply YES or NO to respond.</p>}
    </div>
  </div>;
}

function composeKindLabel(kind?: InvitationKind): GuestMessageKind {
  if (kind === "invitation") return "Invitation";
  if (kind === "reminder") return "Reminder";
  if (kind === "save-the-date") return "Save the date";
  return "General update";
}

export function EventGuestMessagesPanel({ event, data, save, notice, composeKind, recipientIds, onCloseRequest }: Props) {
  const eventDate = formatEventDate(event.date, { day: "numeric", month: "long", year: "numeric" });
  const startingCopy = composeKind === "invitation"
    ? { subject: `You’re invited to ${event.name}`, body: `We’d love to celebrate with you at ${event.name} on ${eventDate}. Please let us know whether you can join us.` }
    : composeKind === "reminder" ? { subject: `A reminder about ${event.name}`, body: `We’re looking forward to ${event.name} on ${eventDate}. Please let us know if you can join us.` }
      : composeKind === "save-the-date" ? { subject: `Save the date for ${event.name}`, body: `Please save ${eventDate} for ${event.name}. We’ll share more details soon.` } : { subject: "", body: "" };
  const [dialog, setDialog] = useState(Boolean(composeKind));
  const [draftId, setDraftId] = useState<string | null>(null);
  const [messageKind, setMessageKind] = useState<GuestMessageKind>(composeKindLabel(composeKind));
  const [subject, setSubject] = useState(startingCopy.subject);
  const [body, setBody] = useState(startingCopy.body);
  const [channels, setChannels] = useState<GuestMessageChannel[]>(["Email"]);
  const [replyTo, setReplyTo] = useState("");
  const [appearance, setAppearance] = useState<"site" | "custom">("site");
  const [targetRecipientIds, setTargetRecipientIds] = useState<string[] | undefined>(recipientIds);
  const [audience, setAudience] = useState(recipientIds?.length ? "selected" : composeKind === "reminder" ? "pending" : composeKind === "invitation" ? "not-invited" : "all");
  const [error, setError] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [channelFilter, setChannelFilter] = useState("all");
  const [expanded, setExpanded] = useState<string | null>(data.sampleSeeded ? "sample-invitations" : null);
  const [deliveryFilter, setDeliveryFilter] = useState("all");
  const [showAllRecipients, setShowAllRecipients] = useState(false);
  const selectedSet = new Set(targetRecipientIds ?? []);
  const audienceGuests = data.guests.filter((guest) => {
    const audienceMatches = audience === "selected" ? selectedSet.has(guest.id)
      : audience === "all" ? true
        : audience === "not-invited" ? !guest.invitedAt && !guest.invitationFailedAt
          : audience === "invited" ? Boolean(guest.invitedAt)
            : guest.rsvp === audience;
    return audienceMatches;
  });
  const eligibleGuests = audienceGuests.filter((guest) => channels.some((channel) => channel === "Email" ? Boolean(guest.email) : Boolean(guest.phone)));
  const recipientDeliveries = eligibleGuests.flatMap((guest) => channels.filter((channel) => channel === "Email" ? Boolean(guest.email) : Boolean(guest.phone)).map((channel) => ({ guest, channel })));
  const runs = [...data.messageRuns, ...(data.sampleSeeded ? seedRuns(event, data.guests) : [])].sort((a, b) => b.sentAt.localeCompare(a.sentAt));
  const filteredRuns = runs.filter((run) => (typeFilter === "all" || run.kind === typeFilter) && (channelFilter === "all" || run.recipients.some((recipient) => recipient.channel === channelFilter)));
  const audienceOptions = [
    ...(targetRecipientIds?.length ? [{ value: "selected", label: "Selected", count: targetRecipientIds.length }] : []),
    { value: "not-invited", label: "Not invited yet", count: data.guests.filter((guest) => !guest.invitedAt && !guest.invitationFailedAt).length },
    { value: "pending", label: "Haven’t replied", count: data.guests.filter((guest) => guest.rsvp === "pending").length },
    { value: "all", label: "Everyone", count: data.guests.length },
  ];
  const deliveryCounts = {
    Email: recipientDeliveries.filter((item) => item.channel === "Email").length,
    WhatsApp: recipientDeliveries.filter((item) => item.channel === "WhatsApp").length,
    SMS: recipientDeliveries.filter((item) => item.channel === "SMS").length,
  };
  const totalCredits = Number(((deliveryCounts.WhatsApp + deliveryCounts.SMS) * 0.01).toFixed(2));

  function validateMessage() {
    setError("");
    if (!subject.trim() || !body.trim()) { setError("Add a subject and message."); return false; }
    if (!channels.length) { setError("Select at least one delivery channel."); return false; }
    if (!eligibleGuests.length) { setError("No guests in this audience have contact details for the selected channels."); return false; }
    if (channels.includes("Email") && !/^\S+@\S+\.\S+$/.test(replyTo.trim())) { setError("Add a valid reply-to email before sending."); return false; }
    return true;
  }

  function saveDraft() {
    if (!subject.trim() || !body.trim()) { setError("Add a subject and message."); return; }
    const id = draftId ?? crypto.randomUUID();
    const previous = data.messages.find((message) => message.id === id);
    const message: GuestMessage = {
      id, subject: subject.trim(), body: body.trim(), channel: channels[0] ?? "Email", channels, replyTo: replyTo.trim(), audience, kind: messageKind,
      createdAt: previous?.createdAt ?? new Date().toISOString(), recipients: eligibleGuests.length,
      recipientIds: audience === "selected" ? targetRecipientIds : undefined,
    };
    save((current) => ({ ...current, messages: previous ? current.messages.map((item) => item.id === id ? message : item) : [message, ...current.messages] }));
    setDialog(false); onCloseRequest(); setDraftId(null); setError(""); notice(previous ? "Message draft updated." : "Message draft saved.");
  }

  function sendNow() {
    if (!validateMessage()) return;
    const sentAt = new Date().toISOString();
    const rsvpKinds: GuestMessageKind[] = ["Invitation", "Reminder"];
    const rsvpPath = `/guest/${encodeURIComponent(event.id)}/rsvp`;
    const rsvpUrl = `${window.location.origin}${rsvpPath}`;
    const sentBody = rsvpKinds.includes(messageKind) && !body.includes(rsvpPath) ? `${body.trim()}\n\nRSVP: ${rsvpUrl}` : body.trim();
    const run: GuestMessageRun = {
      id: crypto.randomUUID(), kind: messageKind, sentAt, subject: subject.trim(), body: sentBody,
      recipients: recipientDeliveries.map(({ guest, channel }) => ({ id: guest.id, name: guest.name, channel, status: "delivered", rsvp: guest.rsvp === "coming" })),
      credits: totalCredits, author: "Planner",
    };
    const eligibleIds = new Set(eligibleGuests.map((guest) => guest.id));
    save((current) => ({
      ...current,
      messages: draftId ? current.messages.filter((message) => message.id !== draftId) : current.messages,
      messageRuns: [run, ...current.messageRuns],
      guests: messageKind === "Invitation" ? current.guests.map((guest) => eligibleIds.has(guest.id) ? { ...guest, invitedAt: sentAt, invitationFailedAt: undefined } : guest) : current.guests,
    }));
    setDialog(false); onCloseRequest(); setDraftId(null); setError(""); notice(`${messageKind} recorded for ${eligibleGuests.length} guest${eligibleGuests.length === 1 ? "" : "s"}.`);
  }

  function startNewMessage() {
    setDraftId(null); setMessageKind("General update"); setSubject(""); setBody(""); setChannels(["Email"]); setReplyTo("");
    setAudience("all"); setTargetRecipientIds(undefined); setError(""); setAppearance("site"); setDialog(true);
  }

  function openDraft(message: GuestMessage) {
    setDraftId(message.id); setMessageKind(message.kind ?? "General update"); setSubject(message.subject); setBody(message.body);
    setChannels(message.channels?.length ? message.channels : [message.channel]); setReplyTo(message.replyTo ?? ""); setAudience(message.audience); setTargetRecipientIds(message.recipientIds); setError(""); setDialog(true);
  }
  const previewGuest = eligibleGuests[0]?.name ?? "Your guest";
  const previewHeadline = messageKind === "Invitation" ? "You’re Invited!" : messageKind === "Reminder" ? "A Gentle RSVP Reminder" : messageKind === "Save the date" ? "Save the Date" : "An Event Update";
  const previewCta = messageKind === "Reminder" ? "Complete your RSVP" : messageKind === "Invitation" ? "View invitation & RSVP" : "View event details";
  const composerTitle = messageKind === "Invitation" ? "Compose invitation + RSVP" : messageKind === "Reminder" ? "Compose RSVP reminder" : messageKind === "Save the date" ? "Compose save the date" : draftId ? "Edit message draft" : "Compose message";

  return <div className="space-y-5">
    <header className="flex flex-wrap items-start justify-between gap-3">
      <div><h3 className="text-lg font-semibold tracking-tight">Messages</h3><p className="mt-1 text-sm text-text-secondary">Email is free. WhatsApp and SMS use NXTEVNT credits.</p></div>
      <Button size="sm" leadingIcon={<Plus className="size-4" />} onClick={startNewMessage}>Compose message</Button>
    </header>

    <div className="flex flex-wrap items-center gap-2">
      <FilterSelect label="Message type" value={typeFilter} onChange={setTypeFilter} options={[{ value: "all", label: "All messages" }, { value: "Invitation", label: "Invitations" }, { value: "Reminder", label: "Reminders" }, { value: "Save the date", label: "Save the dates" }, { value: "General update", label: "General updates" }, { value: "Gate codes", label: "Gate codes" }]} />
      <FilterSelect label="Message channel" value={channelFilter} onChange={setChannelFilter} options={[{ value: "all", label: "All channels" }, { value: "WhatsApp", label: "WhatsApp" }, { value: "Email", label: "Email" }, { value: "SMS", label: "SMS" }]} />
      <Button size="sm" variant="outline" leadingIcon={<Download className="size-3.5" />} onClick={() => csvDownload(`${event.name}-messages.csv`, [["Date", "Type", "Guest", "Channel", "Status", "RSVP"], ...filteredRuns.flatMap((run) => run.recipients.filter((recipient) => channelFilter === "all" || recipient.channel === channelFilter).map((recipient) => [run.sentAt, run.kind, recipient.name, recipient.channel, statusLabels[recipient.status], recipient.rsvp ? "Yes" : "No"]))])}>Export</Button>
    </div>

    {data.messages.length > 0 && <section aria-label="Message drafts" className="overflow-hidden rounded-xl border border-border-subtle bg-white">
      <div className="border-b border-border-subtle px-4 py-2 text-xs font-semibold uppercase tracking-wide text-text-secondary">Drafts</div>
      {data.messages.map((message) => <button key={message.id} type="button" onClick={() => openDraft(message)} className="flex w-full items-center justify-between gap-4 border-b border-border-subtle px-4 py-3 text-left last:border-b-0 hover:bg-[#f7faf8]"><span className="min-w-0"><strong className="block truncate text-sm">{message.subject}</strong><span className="mt-0.5 block text-xs text-text-secondary">{message.kind ?? "General update"} · {(message.channels?.length ? message.channels : [message.channel]).join(" + ")} · {message.recipients} eligible guests · Saved {new Date(message.createdAt).toLocaleDateString()}</span></span><span className="shrink-0 text-xs font-semibold text-brand-primary">Open draft</span></button>)}
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
              {channels.map(({ name }) => <ChannelPreview key={name} channel={name} run={run} />)}
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border-subtle pt-4">
              <div className="flex flex-wrap items-center gap-1">{([{ id: "all", label: "All" }, { id: "seen", label: "Read / Opened" }, { id: "delivered", label: "Delivered only" }, { id: "pending", label: "No status yet" }, { id: "failed", label: "Failed" }] as const).map((filter) => <button key={filter.id} type="button" aria-pressed={deliveryFilter === filter.id} onClick={() => { setDeliveryFilter(filter.id); setShowAllRecipients(false); }} className={`rounded-lg px-2.5 py-1.5 text-xs font-medium ${deliveryFilter === filter.id ? "bg-[#e8f1ea] text-brand-primary" : "text-text-secondary hover:bg-[#f2f6f3]"}`}>{filter.label}</button>)}</div>
              {counts.failed > 0 && <button type="button" onClick={() => { setDeliveryFilter("failed"); notice("Failed recipients are shown below for review."); }} className="rounded-lg border border-border-subtle px-3 py-1.5 text-xs font-semibold text-text-primary hover:bg-[#f7faf8]">Review failed ({counts.failed})</button>}
            </div>
            <div className="mt-3 overflow-hidden rounded-xl border border-border-subtle">
              {visibleRecipients.length ? (showAllRecipients ? visibleRecipients : visibleRecipients.slice(0, 10)).map((recipient) => <div key={`${recipient.id}-${recipient.channel}`} className="flex flex-wrap items-center justify-between gap-2 border-b border-border-subtle px-3.5 py-2.5 text-[13px] last:border-b-0"><span className="font-medium text-text-primary">{recipient.name}</span><span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${statusTone[recipient.status]}`}>{recipient.channel} · {statusLabels[recipient.status]}</span></div>) : <p className="px-3.5 py-5 text-center text-xs text-text-secondary">No recipients match this filter.</p>}
              {!showAllRecipients && visibleRecipients.length > 10 && <button type="button" onClick={() => setShowAllRecipients(true)} className="w-full border-t border-border-subtle px-3.5 py-2 text-center text-xs font-semibold text-brand-primary hover:bg-[#f7faf8]">Show all {visibleRecipients.length} recipients</button>}
            </div>
          </div>}
        </article>;
      })}
    </section> : <div className="rounded-xl border border-dashed border-border-subtle bg-white px-5 py-10 text-center"><MessageSquareText className="mx-auto size-7 text-text-tertiary" /><p className="mt-3 text-sm font-semibold">{runs.length ? "No messages match these filters" : "No messages yet"}</p><p className="mt-1 text-xs text-text-secondary">{runs.length ? "Try another type or channel." : "Compose an invitation or update, then save or send it."}</p></div>}

    <Dialog.Root open={dialog} onOpenChange={(open) => { setDialog(open); if (!open) onCloseRequest(); }}><Dialog.Portal><Dialog.Overlay className="fixed inset-0 z-50 bg-[#172d23]/55 backdrop-blur-[2px]" /><Dialog.Content className="fixed left-1/2 top-1/2 z-50 flex h-[min(92dvh,980px)] w-[calc(100vw-1.5rem)] max-w-[1380px] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-border-subtle bg-white shadow-[var(--shadow-lg)] focus:outline-none">
      <header className="flex items-center justify-between gap-4 border-b border-border-subtle px-6 py-4"><div><Dialog.Title className="text-xl font-semibold tracking-tight">{composerTitle}</Dialog.Title><Dialog.Description className="mt-0.5 text-sm text-text-secondary">Choose the right guests, delivery channels and message. Preview updates as you edit.</Dialog.Description></div><Dialog.Close asChild><button type="button" aria-label="Close composer" className="flex size-10 shrink-0 items-center justify-center rounded-lg text-text-secondary hover:bg-background-subtle"><X className="size-5" /></button></Dialog.Close></header>
      <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(0,1fr)_minmax(420px,0.92fr)]">
        <div className="min-h-0 overflow-y-auto border-b border-border-subtle px-6 py-6 lg:border-b-0 lg:border-r">
          <div className="space-y-6">
            <section><h3 className="text-sm font-semibold text-text-primary">To</h3><div className="mt-3 flex flex-wrap gap-2">{audienceOptions.map((option) => <button key={option.value} type="button" onClick={() => setAudience(option.value)} className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${audience === option.value ? "border-[#173c2d] bg-[#173c2d] text-white" : "border-border-default bg-white text-text-secondary hover:border-[#9cb9a6] hover:text-brand-primary"}`}>{option.label} ({option.count})</button>)}</div></section>
            <section className="rounded-xl border border-[#f1d39b] bg-[#fff9ef] p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-semibold text-text-primary">Sending to {eligibleGuests.length} guest{eligibleGuests.length === 1 ? "" : "s"}</p><p className="mt-1 text-xs text-text-secondary">{deliveryCounts.Email} email · {deliveryCounts.WhatsApp} WhatsApp · {deliveryCounts.SMS} SMS</p></div><span className="rounded-lg bg-white px-3 py-2 text-xs font-semibold text-[#7c5a25]">{recipientDeliveries.length} message{recipientDeliveries.length === 1 ? "" : "s"}</span></div></section>
            <section><h3 className="text-sm font-semibold text-text-primary">Select channels</h3><div className="mt-3 grid gap-2 sm:grid-cols-3">{(["Email", "WhatsApp", "SMS"] as const).map((item) => { const active = channels.includes(item); const Icon = item === "Email" ? Mail : item === "WhatsApp" ? WhatsApp : MessageSquareText; return <button key={item} type="button" aria-pressed={active} onClick={() => setChannels((current) => current.includes(item) ? current.filter((channel) => channel !== item) : [...current, item])} className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left transition ${active ? "border-[#80bb91] bg-[#f0faf3] text-[#225b38]" : "border-border-subtle bg-white text-text-secondary hover:border-border-default"}`}><span className="flex items-center gap-2 text-sm font-semibold"><Icon className="size-4" />{item}</span><span className={`flex size-5 items-center justify-center rounded-full border ${active ? "border-[#25844c] bg-[#25844c] text-white" : "border-border-strong"}`}>{active && <Check className="size-3" />}</span></button>; })}</div><p className="mt-2 text-xs text-text-secondary">Email is free. WhatsApp and SMS use NXTEVNT credits.</p></section>
            <section className="overflow-hidden rounded-xl border border-border-subtle"><div className="flex items-center gap-2 border-b border-border-subtle bg-[#fafbfa] px-4 py-3 text-xs font-semibold uppercase tracking-wide text-text-secondary"><CircleDollarSign className="size-4" />Cost preview</div><div className="space-y-2 px-4 py-3 text-sm">{channels.map((item) => <div key={item} className="flex items-center justify-between"><span>{item} · {deliveryCounts[item]} message{deliveryCounts[item] === 1 ? "" : "s"}</span><strong className={item === "Email" ? "text-[#198754]" : "text-text-primary"}>{item === "Email" ? "Free" : `${(deliveryCounts[item] * 0.01).toFixed(2)} credits`}</strong></div>)}</div></section>
            {["Invitation", "Reminder"].includes(messageKind) && <div className="flex gap-3 rounded-xl border border-[#a9e7bc] bg-[#effcf3] p-4 text-sm leading-6 text-[#176c39]"><Globe2 className="mt-0.5 size-5 shrink-0" /><p>Each guest receives a personal link to the event RSVP page. The link is added automatically when you send.</p></div>}
            <section><h3 className="text-sm font-semibold text-text-primary">Invitation appearance</h3><div className="mt-3 grid grid-cols-2 gap-2"><button type="button" onClick={() => setAppearance("site")} className={`rounded-xl border px-4 py-3 text-sm font-semibold ${appearance === "site" ? "border-[#173c2d] text-text-primary" : "border-border-subtle text-text-secondary"}`}>Match event theme</button><button type="button" onClick={() => setAppearance("custom")} className={`rounded-xl border px-4 py-3 text-sm font-semibold ${appearance === "custom" ? "border-[#173c2d] text-text-primary" : "border-border-subtle text-text-secondary"}`}>Clean custom card</button></div></section>
            <Input label="Subject" required value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="Your invitation subject" />
            {channels.includes("Email") && <Input label="Reply-to email" required type="email" value={replyTo} onChange={(event) => setReplyTo(event.target.value)} placeholder="planner@example.com" helperText="Guest email replies will be sent here." />}
            <Textarea label="Message body" value={body} onChange={(event) => setBody(event.target.value)} rows={6} placeholder="Write your message…" />
            <p className="rounded-lg bg-[#f7f8f8] px-3 py-2 text-xs leading-5 text-text-secondary">Prototype note: sending records the invitation and delivery history in this browser. No external provider is contacted yet.</p>
          </div>
        </div>
        <aside className="min-h-0 overflow-y-auto bg-[#f5f7f6] px-5 py-6"><p className="mb-3 text-sm font-medium text-text-secondary">Preview · {eligibleGuests.length} guest{eligibleGuests.length === 1 ? "" : "s"}</p><div className={`mx-auto max-w-xl overflow-hidden rounded-2xl border p-3 shadow-sm ${appearance === "site" ? "border-[#dce7de] bg-[#edf4ef]" : "border-[#eee1c9] bg-[#fbf6ec]"}`}><div className="rounded-xl bg-[#fffefb] px-8 py-10 text-center sm:px-12">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#9a742e]">{previewHeadline}</p><h3 className="mt-7 font-serif text-4xl italic text-[#1f2c21]">{event.name}</h3><p className="mt-5 font-serif text-xl italic text-[#7a8377]">{messageKind === "Reminder" ? "We’d love to hear from you" : "Join us to celebrate"}</p><div className="mx-auto my-8 flex max-w-52 items-center gap-4 text-[#b79d68]"><span className="h-px flex-1 bg-current opacity-50" /><span>◆</span><span className="h-px flex-1 bg-current opacity-50" /></div><div className="grid grid-cols-2 gap-5"><div><CalendarDays className="mx-auto size-4 text-text-tertiary" /><p className="mt-2 text-[10px] font-bold uppercase tracking-[0.24em] text-text-tertiary">Date</p><p className="mt-1 text-sm font-semibold">{eventDate}</p></div><div><MapPin className="mx-auto size-4 text-text-tertiary" /><p className="mt-2 text-[10px] font-bold uppercase tracking-[0.24em] text-text-tertiary">Where</p><p className="mt-1 text-sm font-semibold">{event.city || event.location || "To be confirmed"}</p></div></div><div className="mt-10 text-left"><p className="text-base font-semibold">Dear {previewGuest},</p><p className="mt-4 whitespace-pre-line text-sm leading-7 text-[#596257]">{body || "Your message will appear here."}</p></div>{["Invitation", "Reminder", "General update"].includes(messageKind) && <div className="mt-8 rounded-lg bg-[#294f36] px-5 py-4 text-sm font-bold text-white">{previewCta}</div>}{messageKind === "Invitation" && <div className="mt-6 rounded-lg border border-dashed border-[#cbd3c9] bg-[#faf9f3] px-4 py-5"><p className="text-[10px] font-bold uppercase tracking-[0.24em] text-text-tertiary">Your guest passcode</p><p className="mt-2 font-mono text-lg font-bold tracking-[0.25em]">PREVIEW</p></div>}</div></div></aside>
      </div>
      <footer className="border-t border-border-subtle bg-white px-6 py-4">{error && <div role="alert" className="mb-3 rounded-xl border border-[#efbd64] bg-[#fff9e9] px-4 py-3 text-sm font-medium text-[#8b430f]">{error}</div>}<div className="flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-text-secondary">{recipientDeliveries.length} message{recipientDeliveries.length === 1 ? "" : "s"} · {totalCredits ? `${totalCredits.toFixed(2)} credits` : "free"}</p><div className="flex flex-wrap gap-2"><Dialog.Close asChild><Button type="button" variant="outline">Cancel</Button></Dialog.Close><Button type="button" variant="outline" onClick={saveDraft}>{draftId ? "Update draft" : "Save draft"}</Button><Button type="button" leadingIcon={<Send className="size-4" />} onClick={sendNow}>Send now</Button></div></div></footer>
    </Dialog.Content></Dialog.Portal></Dialog.Root>
  </div>;
}
