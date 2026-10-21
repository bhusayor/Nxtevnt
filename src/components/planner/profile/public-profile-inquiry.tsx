"use client";

import { useState, type FormEvent } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Check, MessageSquareText, Send, X } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { dateKey } from "@/lib/planner-dashboard";
import { savePlannerInquiry } from "@/lib/planner-business";

export type PublicInquiryRequest = { title: string; detail?: string; date?: string; eventType?: string };

// Mounted anew for each request so details from one package never leak into another.
export function PublicProfileInquiry({ request, brand, onClose }: { request: PublicInquiryRequest; brand: string; onClose: () => void }) {
  const [eventType, setEventType] = useState(request.eventType || "Wedding");
  const [otherType, setOtherType] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sent) return;
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") || "").trim();
    const email = String(form.get("email") || "").trim();
    const message = String(form.get("message") || "").trim();
    const date = String(form.get("date") || "");
    if (!name || !message || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || (eventType === "Other" && !otherType.trim())) { setError("Add your name, a valid email, event type and a short message."); return; }
    if (date && date < dateKey(new Date())) { setError("Choose today or a future event date."); return; }
    try {
      savePlannerInquiry({ id: crypto.randomUUID(), name, email, subject: request.title, message: [request.detail, message, date && `Preferred date: ${date}`].filter(Boolean).join("\n\n"), status: "open", createdAt: new Date().toISOString(), eventType: eventType === "Other" ? otherType.trim() : eventType });
      setError(""); setSent(true);
    } catch { setError("Your inquiry couldn’t be saved. Please try again."); }
  }
  return <Dialog.Root open onOpenChange={(open) => { if (!open) onClose(); }}><Dialog.Portal>
    <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
    <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[92dvh] w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl sm:p-7">
      <div className="flex items-start justify-between gap-4"><span className="flex size-11 items-center justify-center rounded-2xl border border-border-subtle bg-[#fafafa] text-brand-primary">{sent ? <Check className="size-5" aria-hidden="true" /> : <MessageSquareText className="size-5" aria-hidden="true" />}</span><Dialog.Close aria-label="Close inquiry" className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border-subtle hover:bg-[#f5f5f5]"><X className="size-4" aria-hidden="true" /></Dialog.Close></div>
      <Dialog.Title className="mt-5 text-xl font-semibold tracking-tight">{sent ? "Your inquiry is saved" : request.title}</Dialog.Title>
      <Dialog.Description className="mt-2 text-sm leading-6 text-text-secondary">{sent ? "Thanks for sharing your plans. This preview has saved your inquiry in this browser, without sending it to the planner." : `Tell ${brand} a little about your plans. You don’t need an account to inquire.`}</Dialog.Description>
      {!sent ? <form onSubmit={send} className="mt-5 space-y-4">
        {request.detail && <p className="rounded-xl border border-border-subtle bg-[#fafafa] p-3 text-xs leading-6 text-text-secondary">{request.detail}</p>}
        <div className="grid gap-4 sm:grid-cols-2"><Input name="name" label="Your name" required autoComplete="name" maxLength={100} placeholder="Full name" /><Input name="email" label="Email address" type="email" required autoComplete="email" maxLength={254} placeholder="you@example.com" /></div>
        <div className="grid gap-4 sm:grid-cols-2"><Select label="Event type" required value={eventType} onValueChange={setEventType} options={["Wedding", "Corporate", "Party", "Other"].map((value) => ({ label: value, value }))} /><Input label="Event date" optional name="date" type="date" min={dateKey(new Date())} defaultValue={request.date || ""} className="min-w-0 max-w-full" /></div>
        {eventType === "Other" && <Input label="What are you planning?" required value={otherType} maxLength={80} onChange={(event) => setOtherType(event.target.value)} placeholder="e.g. A family reunion" />}
        <Textarea name="message" label="Tell us about your plans" placeholder="The occasion, location, guest count, and what you’d love help with…" required maxLength={2000} rows={4} helperText="A short introduction is all you need to get started." />
        {error && <p role="alert" className="text-xs text-error">{error}</p>}
        <Button type="submit" fullWidth trailingIcon={<Send className="size-4" aria-hidden="true" />}>Send inquiry · Preview</Button>
        <p className="text-center text-[0.625rem] leading-5 text-text-tertiary">Preview only. No message, payment or booking is sent.</p>
      </form> : <div className="mt-5"><p className="rounded-xl border border-border-subtle bg-[#fafafa] p-4 text-xs leading-6 text-text-secondary">No booking has been made and no payment has been taken.</p><Button type="button" fullWidth className="mt-5" onClick={onClose}>Back to profile</Button></div>}
    </Dialog.Content>
  </Dialog.Portal></Dialog.Root>;
}
