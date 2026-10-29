"use client";

import { useState, type FormEvent } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { CalendarDays, CheckCircle2, FileText, LockSimple, Mail, MapPin, MessageSquareText, Phone, Wallet, WhatsApp, X } from "@/components/ui/icons";
import { Button, buttonVariants } from "@/components/ui/button";
import type { PlannerEvent } from "@/lib/planner-events";
import { formatEventDate } from "@/lib/planner-events";
import type { BudgetGroup, BudgetItem } from "@/lib/planner-budget";
import { inquiryPhone } from "@/lib/inquiry-details";
import type { PlannerVendorReply } from "@/lib/planner-vendor-replies";
import type { VendorQuoteDestination } from "@/lib/vendor-quote-budget";

const draftKey = (id: string) => `nxtevnt.planner.vendor-reply-draft.${id}`;
const validEmail = (value: string | undefined) => value && /^[^\s@?&#]+@[^\s@?&#]+\.[^\s@?&#]+$/.test(value) ? value : null;
const safeQuoteUrl = (value: string | undefined) => value && /^\/quotes\/[\w./-]+\.pdf$/.test(value) && !value.includes("..") ? value : null;

type Props = {
  reply: PlannerVendorReply | null; event?: PlannerEvent; groups?: BudgetGroup[]; items?: BudgetItem[];
  error: string; onClose: () => void; onRead: () => void; onAddQuote?: (destination: VendorQuoteDestination) => void;
};

export function VendorReplyDialog(props: Props) {
  if (!props.reply) return null;
  return <VendorReplyContent key={props.reply.id} {...props} reply={props.reply} />;
}

function VendorReplyContent({ reply, event, groups = [], items = [], error, onClose, onRead, onAddQuote }: Omit<Props, "reply"> & { reply: PlannerVendorReply }) {
  const [draft, setDraft] = useState(() => { try { return typeof window === "undefined" ? "" : window.localStorage.getItem(draftKey(reply.id)) ?? ""; } catch { return ""; } });
  const [draftNotice, setDraftNotice] = useState("");
  const [amount, setAmount] = useState(reply.quotedAmount ? String(reply.quotedAmount) : "");
  const [groupId, setGroupId] = useState(() => (/floral|styling|decor/i.test(reply.category || reply.subject) ? groups.find(group => /decor|floral|styling/i.test(group.name))?.id : undefined) ?? groups[0]?.id ?? "new");
  const [groupName, setGroupName] = useState("");
  const [itemId, setItemId] = useState("new");
  const [itemName, setItemName] = useState(reply.requestedService || reply.subject);
  const [quoteError, setQuoteError] = useState("");
  const currency = event?.currency || "NGN";
  const selectedItems = items.filter(item => item.groupId === groupId && item.eventId === event?.id);
  const phone = inquiryPhone(reply.phone), email = validEmail(reply.email);
  const emailHref = email ? `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(`Re: ${reply.subject}`)}${draft.trim() ? `&body=${encodeURIComponent(draft.trim())}` : ""}` : null;
  const whatsappHref = phone ? `https://wa.me/${phone.slice(1)}?text=${encodeURIComponent(draft.trim() || `Hi ${reply.vendor}, thanks for your quote for ${event?.name || "our event"}.`)}` : null;
  const received = Number.isFinite(Date.parse(reply.createdAt)) ? formatEventDate(reply.createdAt.slice(0, 10), { day: "numeric", month: "short", year: "numeric" }) : "Date not provided";
  const requestedDate = reply.requestedEventDate && Number.isFinite(Date.parse(reply.requestedEventDate)) ? formatEventDate(reply.requestedEventDate, { day: "numeric", month: "short", year: "numeric" }) : event?.date ? formatEventDate(event.date, { day: "numeric", month: "short", year: "numeric" }) : "Not provided";

  function saveDraft() {
    try { window.localStorage.setItem(draftKey(reply.id), draft.trim()); setDraftNotice("Draft saved in this browser."); }
    catch { setDraftNotice("Draft couldn’t be saved. Please try again."); }
  }
  function addQuote(eventForm: FormEvent<HTMLFormElement>) {
    eventForm.preventDefault(); setQuoteError("");
    try {
      if (!event || !onAddQuote) throw Error("The event budget isn’t available.");
      onAddQuote({ groupId, groupName, itemId, itemName, amount: Number(amount.replaceAll(",", "")) });
    } catch (problem) { setQuoteError(problem instanceof Error ? problem.message : "The quote couldn’t be added to the budget."); }
  }

  return <Dialog.Root open onOpenChange={open => { if (!open) onClose(); }}><Dialog.Portal><Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" /><Dialog.Content className="fixed left-1/2 top-1/2 z-50 flex max-h-[88dvh] w-[calc(100vw-2rem)] max-w-3xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-border-subtle bg-white shadow-2xl">
    <header className="flex shrink-0 items-start gap-3 border-b border-border-subtle bg-[#f7faf8] px-5 py-4 sm:px-6"><span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#dfe9e4] text-sm font-semibold text-brand-primary" aria-hidden="true">{reply.vendor.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join("").toUpperCase()}</span><div className="min-w-0 flex-1"><p className="text-xs text-text-secondary">Vendor reply · Received {received}</p><Dialog.Title className="mt-1 break-words text-lg font-semibold tracking-tight">{reply.vendor}</Dialog.Title><Dialog.Description className="mt-0.5 break-words text-sm text-text-secondary">{reply.category || reply.subject}</Dialog.Description></div><Dialog.Close aria-label="Close vendor reply" className="flex size-8 shrink-0 items-center justify-center rounded-full hover:bg-white"><X className="size-4" aria-hidden="true" /></Dialog.Close></header>
    <div className="min-h-0 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6">
      <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2"><div><dt className="flex items-center gap-2 text-xs text-text-secondary"><CalendarDays className="size-4 text-brand-primary" aria-hidden="true" />Event</dt><dd className="mt-1 text-sm font-semibold">{event?.name || "Event not available"}</dd></div><div><dt className="flex items-center gap-2 text-xs text-text-secondary"><MessageSquareText className="size-4 text-brand-primary" aria-hidden="true" />Came in via</dt><dd className="mt-1 text-sm font-medium">{reply.receivedVia || "Vendor reply"}</dd></div><div><dt className="flex items-center gap-2 text-xs text-text-secondary"><CalendarDays className="size-4 text-brand-primary" aria-hidden="true" />Requested event date</dt><dd className="mt-1 text-sm font-medium">{requestedDate}</dd></div><div><dt className="flex items-center gap-2 text-xs text-text-secondary"><MapPin className="size-4 text-brand-primary" aria-hidden="true" />Requested service</dt><dd className="mt-1 text-sm font-medium">{reply.requestedService || reply.subject}</dd></div></dl>
      {reply.originalRequest && <section className="mt-5 border-t border-border-subtle pt-4"><h3 className="text-sm font-semibold">Your original request</h3><p className="mt-2 whitespace-pre-wrap break-words border-l-2 border-border-default pl-4 text-sm leading-6 text-text-secondary">{reply.originalRequest}</p></section>}
      <section className="mt-5 rounded-xl border border-[#d7e8dd] bg-[#f1f7f3] p-4"><div className="flex flex-wrap items-center justify-between gap-2"><h3 className="text-sm font-semibold">{reply.vendor}’s response</h3>{reply.acceptedRequest && <span className="inline-flex items-center gap-1.5 text-sm font-medium text-[#26865a]"><CheckCircle2 className="size-4" aria-hidden="true" />Accepted request</span>}</div><p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6">{reply.message}</p>{reply.acceptedRequest && <p className="mt-2 text-xs text-text-secondary">Request accepted · booking and payment terms still to be agreed.</p>}</section>
      {Boolean(reply.attachments?.length) && <section className="mt-5"><h3 className="text-sm font-semibold">Attachments <span className="ml-1 font-normal text-text-tertiary">{reply.attachments!.length}</span></h3><ul className="mt-2 space-y-2">{reply.attachments!.map(file => <li key={file.id} className="flex items-center gap-3 rounded-xl border border-border-subtle px-3 py-3"><FileText className="size-5 shrink-0 text-[#4679a4]" aria-hidden="true" /><span className="min-w-0 flex-1 truncate text-sm font-medium" title={file.name}>{safeQuoteUrl(file.sourceUrl) ? <a href={safeQuoteUrl(file.sourceUrl)!} target="_blank" rel="noopener noreferrer" className="hover:text-brand-primary hover:underline">{file.name}</a> : file.name}</span><span className="shrink-0 text-xs text-text-tertiary">{Math.max(1, Math.round(file.size / 1024))} KB</span></li>)}</ul></section>}
      <section className="mt-5 border-t border-border-subtle pt-4"><label htmlFor="vendor-reply-draft" className="text-sm font-semibold">Your reply</label><textarea id="vendor-reply-draft" value={draft} onChange={change => { setDraft(change.target.value); setDraftNotice(""); }} rows={3} maxLength={5000} placeholder={`Hi ${reply.vendor}, thanks for getting back to us…`} className="mt-2 min-h-24 w-full resize-y rounded-xl border border-border-default bg-white px-3 py-2.5 text-sm leading-6 outline-none placeholder:text-text-tertiary focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/15" /><div className="mt-2 flex flex-wrap items-center justify-between gap-2"><p role="status" className="text-xs text-text-secondary">{draftNotice || "Save a draft or reply using a contact option below."}</p><Button type="button" size="sm" variant="outline" disabled={!draft.trim()} onClick={saveDraft}>Save reply draft</Button></div></section>
      <form onSubmit={addQuote} className="mt-5 space-y-4 border-t border-border-subtle pt-4"><h3 className="flex items-center gap-2 text-sm font-semibold"><Wallet className="size-5 text-brand-primary" aria-hidden="true" />Add quote to event budget</h3><div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_8rem]"><label className="text-sm font-medium">Quoted amount<input type="text" inputMode="decimal" value={amount} onChange={change => setAmount(change.target.value.replace(/[^\d.,]/g, "").slice(0, 18))} placeholder="0" className="mt-1.5 h-11 w-full rounded-lg border border-border-default bg-white px-3 tabular-nums outline-none focus:border-brand-primary" /></label><label className="text-sm font-medium">Currency<input value={currency} readOnly aria-label="Event currency" className="mt-1.5 h-11 w-full rounded-lg border border-border-subtle bg-[#f5f6f5] px-3 text-text-secondary" /></label></div><p className="flex items-center gap-1.5 text-xs text-text-secondary"><LockSimple className="size-4" aria-hidden="true" />Currency matches the originating event.</p><label className="block text-sm font-medium">Budget group<select value={groupId} onChange={change => { setGroupId(change.target.value); setItemId("new"); }} className="mt-1.5 h-11 w-full rounded-lg border border-border-default bg-white px-3 outline-none focus:border-brand-primary">{groups.map(group => <option key={group.id} value={group.id}>{group.name}</option>)}<option value="new">+ Create a new group</option></select></label>{groupId === "new" && <label className="block text-sm font-medium">New group name<input value={groupName} onChange={change => setGroupName(change.target.value)} placeholder="e.g. Decor & Styling" maxLength={100} className="mt-1.5 h-11 w-full rounded-lg border border-border-default px-3 outline-none focus:border-brand-primary" /></label>}<label className="block text-sm font-medium">Budget item<select value={itemId} onChange={change => setItemId(change.target.value)} className="mt-1.5 h-11 w-full rounded-lg border border-border-default bg-white px-3 outline-none focus:border-brand-primary"><option value="new">+ Create a new item</option>{selectedItems.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>{itemId === "new" && <label className="block text-sm font-medium">New item name<input value={itemName} onChange={change => setItemName(change.target.value)} maxLength={120} placeholder="e.g. Reception florals & styling" className="mt-1.5 h-11 w-full rounded-lg border border-border-default px-3 outline-none focus:border-brand-primary" /></label>}<p className="rounded-lg border-l-2 border-brand-primary bg-[#f4f7f5] px-3 py-2 text-xs leading-5 text-text-secondary">The item will be marked Sourcing with {reply.vendor} attached. Booking and payment terms remain open.</p>{quoteError && <p role="alert" className="text-sm text-error">{quoteError}</p>}<Button type="submit" disabled={!event || !onAddQuote}>Add to budget</Button></form>
      {error && <p role="alert" className="mt-4 text-sm text-error">{error}</p>}
    </div>
    <footer className="flex shrink-0 flex-wrap justify-end gap-2 border-t border-border-subtle bg-white px-5 py-3 sm:px-6"><Button type="button" variant="ghost" size="sm" onClick={onRead}>Mark as read</Button>{emailHref ? <a href={emailHref} className={buttonVariants({ variant: "outline", size: "sm" })}><Mail className="size-4" aria-hidden="true" />Reply by email</a> : <Button type="button" variant="outline" size="sm" disabled>Reply by email</Button>}{phone ? <a href={`tel:${phone}`} className={buttonVariants({ variant: "outline", size: "sm" })}><Phone className="size-4" aria-hidden="true" />Call</a> : <Button type="button" variant="outline" size="sm" disabled>Call</Button>}{whatsappHref ? <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className={buttonVariants({ size: "sm" })}><WhatsApp className="size-4" aria-hidden="true" />WhatsApp</a> : <Button type="button" size="sm" disabled>WhatsApp</Button>}</footer>
  </Dialog.Content></Dialog.Portal></Dialog.Root>;
}
