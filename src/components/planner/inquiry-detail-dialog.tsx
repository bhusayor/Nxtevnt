"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { CalendarDays, Check, Mail, MapPin, MessageSquareText, Phone, Users, WhatsApp, X } from "@/components/ui/icons";
import { Button, buttonVariants } from "@/components/ui/button";
import type { PlannerInquiry } from "@/lib/planner-business";
import { inquiryBudget, inquiryContactLinks, inquiryFacts } from "@/lib/inquiry-details";
import { cn } from "@/lib/utils/cn";

const draftStorageKey = (id: string) => `nxtevnt.planner.inquiry-reply.${id}`;

type InquiryDialogProps = { inquiry: PlannerInquiry | null; error: string; example?: boolean; onClose: () => void; onResolve: () => void };

export function InquiryDetailDialog(props: InquiryDialogProps) {
  if (!props.inquiry) return null;
  return <InquiryDetailContent key={props.inquiry.id} {...props} inquiry={props.inquiry} />;
}

export function InquiryDetailContent({ inquiry, error, example = false, onClose, onResolve }: Omit<InquiryDialogProps, "inquiry"> & { inquiry: PlannerInquiry }) {
  const [draft, setDraft] = useState(() => { try { return typeof window === "undefined" ? "" : window.localStorage.getItem(draftStorageKey(inquiry.id)) ?? ""; } catch { return ""; } });
  const [draftNotice, setDraftNotice] = useState("");
  const facts = inquiryFacts(inquiry), links = inquiryContactLinks(inquiry);
  const sender = inquiry.senderType === "vendor" ? "Vendor" : "Client";
  const firstName = inquiry.name.trim().split(/\s+/)[0] || "there";
  const initials = inquiry.name.trim().split(/\s+/).slice(0, 2).map(n => n[0]).join("").toUpperCase();
  const budget = inquiryBudget(inquiry);
  const emailHref = links.email && draft.trim() ? `${links.email}&body=${encodeURIComponent(draft.trim())}` : links.email;
  function saveDraft() {
    try { window.localStorage.setItem(draftStorageKey(inquiry.id), draft.trim()); setDraftNotice("Draft saved in this browser."); }
    catch { setDraftNotice("Draft couldn’t be saved. Please try again."); }
  }
  return <Dialog.Root open onOpenChange={open => { if (!open) onClose(); }}><Dialog.Portal><Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" /><Dialog.Content className="fixed left-1/2 top-1/2 z-50 flex max-h-[85dvh] w-[calc(100vw-2rem)] max-w-xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-border-subtle bg-white shadow-2xl">
    <header className="flex shrink-0 items-start gap-3 border-b border-border-subtle bg-[#f7faf8] px-5 py-4"><span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-full bg-[#dde8e2] text-sm font-semibold text-brand-primary" aria-hidden="true">{initials}</span><div className="min-w-0 flex-1"><Dialog.Title className="break-words text-lg font-semibold tracking-tight">{inquiry.name}</Dialog.Title><Dialog.Description className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-text-secondary"><span>{sender} inquiry</span><span aria-hidden="true">·</span><span>{facts.eventType}</span><span aria-hidden="true">·</span><span>Received {facts.received}</span></Dialog.Description><p className="mt-1.5 break-words text-sm leading-5 text-text-secondary">{inquiry.subject}</p></div><Dialog.Close aria-label="Close inquiry" className="flex size-8 shrink-0 items-center justify-center rounded-full hover:bg-white"><X className="size-4" aria-hidden="true" /></Dialog.Close></header>
    <div className="min-h-0 overflow-y-auto overscroll-contain px-5 py-5"><dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">{[{ label: "Event date", value: facts.eventDate, icon: CalendarDays, note: "Preferred by client · not yet agreed" }, { label: "Came in via", value: facts.receivedVia, icon: MessageSquareText }, { label: "Location", value: facts.location, icon: MapPin }, { label: "Expected guests", value: facts.guests, icon: Users }].map(({ label, value, icon: Icon, note }) => <div key={label} className="min-w-0"><dt className="flex items-center gap-2 text-xs text-text-secondary"><Icon className="size-4 shrink-0 text-brand-primary" aria-hidden="true" />{label}</dt><dd className={cn("mt-1 break-words text-sm font-medium leading-5", value === "Not provided" && "font-normal text-text-tertiary")}>{value}</dd>{note && value !== "Not provided" && <dd className="mt-1 text-xs leading-5 text-text-secondary">{note}</dd>}</div>)}</dl>
      <section aria-label="Total event budget" className="mt-5 rounded-xl border border-[#ebdfc9] bg-[#fcf7ed] px-4 py-3"><h3 className="text-xs font-medium text-[#866238]">{sender === "Client" ? "Client’s" : "Sender’s"} total event budget</h3><p className={cn("mt-1 break-words text-lg font-semibold tracking-tight", budget === "Not provided" && "text-base font-normal text-text-secondary")}>{budget}</p><p className="mt-1 text-xs leading-5 text-text-secondary">For the whole event, not just your planning fee.</p></section>
      <section className="mt-5"><h3 className="text-sm font-semibold">Services {sender === "Client" ? "the client" : "the sender"} selected</h3>{facts.services.length ? <ul className="mt-2 flex flex-wrap gap-1.5">{facts.services.map((service, i) => <li key={`${service}-${i}`} className="inline-flex items-center gap-2 rounded-full border border-[#d8e4dc] bg-[#f0f6f2] px-2.5 py-1 text-xs text-brand-primary"><Check className="size-4 shrink-0" aria-hidden="true" />{service}</li>)}</ul> : <p className="mt-1.5 text-sm text-text-tertiary">Not provided</p>}</section>
      {typeof inquiry.requestDetail === "string" && inquiry.requestDetail && <p className="mt-5 break-words text-sm leading-6 text-text-secondary">Regarding: {inquiry.requestDetail}</p>}
      <section className="mt-5"><h3 className="flex items-center gap-2 text-sm font-semibold"><MessageSquareText className="size-5 text-brand-primary" aria-hidden="true" />A note from {firstName}</h3><p className="mt-2 whitespace-pre-wrap break-words border-l-2 border-border-default pl-4 text-sm leading-6 text-text-secondary">{typeof inquiry.message === "string" && inquiry.message ? inquiry.message : "No note provided."}</p></section>
      <dl aria-label="Contact details" className="mt-5 grid gap-3 border-t border-border-subtle pt-4 text-sm sm:grid-cols-2"><div className="min-w-0"><dt className="text-xs text-text-tertiary">Email</dt><dd className={cn("mt-1 break-words leading-5", !inquiry.email && "text-text-tertiary")}>{typeof inquiry.email === "string" && inquiry.email ? inquiry.email : "Not provided"}</dd></div><div className="min-w-0"><dt className="text-xs text-text-tertiary">Phone</dt><dd className={cn("mt-1 break-words leading-5", !inquiry.phone && "text-text-tertiary")}>{typeof inquiry.phone === "string" && inquiry.phone ? inquiry.phone : "Not provided"}</dd></div></dl>
      {error && <p role="alert" className="mt-4 rounded-xl bg-error-soft p-3 text-sm text-error">{error}</p>}
      <section aria-label="Your reply" className="mt-5 rounded-xl border border-border-subtle bg-[#f9faf9] p-4"><label htmlFor="inquiry-reply-draft" className="text-sm font-semibold">Your reply</label><textarea id="inquiry-reply-draft" value={draft} onChange={event => { setDraft(event.target.value); setDraftNotice(""); }} placeholder={`Hi ${firstName}, thanks for reaching out…`} rows={4} maxLength={5000} className="mt-2 min-h-28 w-full resize-y rounded-xl border border-border-default bg-white px-3 py-2.5 text-sm leading-6 text-text-primary outline-none placeholder:text-text-tertiary focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/15" /><div className="mt-2 flex flex-wrap items-center justify-between gap-2"><p role="status" className="text-xs text-text-secondary">{draftNotice || "Save a draft or reply by email."}</p><Button type="button" size="sm" onClick={saveDraft} disabled={!draft.trim()}>Save reply draft</Button></div></section>
    </div>
    <footer className="grid shrink-0 grid-cols-2 gap-2 border-t border-border-subtle bg-white px-4 py-3 sm:grid-cols-[1.25fr_1.35fr_.8fr_1.1fr] [&_a]:min-h-10 [&_a]:px-2.5 [&_button]:min-h-10 [&_button]:px-2.5 [&_button]:text-sm"><Button type="button" variant="ghost" onClick={onResolve}>Mark resolved</Button>{emailHref && !example ? <a href={emailHref} className={buttonVariants({ variant: "outline" })}><Mail className="size-4" aria-hidden="true" />Reply by email</a> : <Button type="button" variant="outline" disabled>Reply by email</Button>}{links.call && !example ? <a href={links.call} className={buttonVariants({ variant: "outline" })}><Phone className="size-4" aria-hidden="true" />Call</a> : <Button type="button" variant="outline" disabled leadingIcon={<Phone className="size-4" aria-hidden="true" />}>Call</Button>}{links.whatsapp && !example ? <a href={links.whatsapp} target="_blank" rel="noopener noreferrer" className={cn(buttonVariants(), "gap-2")}><WhatsApp className="size-4" aria-hidden="true" />WhatsApp</a> : <Button type="button" disabled leadingIcon={<WhatsApp className="size-4" aria-hidden="true" />}>WhatsApp</Button>}</footer>
  </Dialog.Content></Dialog.Portal></Dialog.Root>;
}
