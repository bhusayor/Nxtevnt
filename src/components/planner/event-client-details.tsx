"use client";

import { useState, type FormEvent } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Mail, Pencil, Phone, UserRound, X } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updatePlannerClientContact, type PlannerClient } from "@/lib/planner-clients";

export function EventClientDetails({ client, name, lead }: { client?: PlannerClient; name: string; lead?: string }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!client) return;
    try { updatePlannerClientContact(client, { email, phone }); setOpen(false); }
    catch (failure) { setError(failure instanceof Error ? failure.message : "Couldn’t save these contact details. Please try again."); }
  }

  return <section aria-label="Client contact details" className="mt-5 rounded-xl border border-border-subtle bg-white p-4">
    <div className="flex items-start justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3"><span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#f6f0e8] text-[#8c6a43]"><UserRound className="size-5" aria-hidden="true" /></span><div className="min-w-0"><p className="text-xs text-text-secondary">Client / host</p><p className="mt-0.5 break-words text-sm font-semibold">{client?.name || name || "Not added yet"}</p>{lead && <p className="mt-1 break-words text-xs text-text-secondary">{lead} · Lead planner</p>}</div></div>
      {client && <Dialog.Root open={open} onOpenChange={(next) => { if (next) { setEmail(client.email || ""); setPhone(client.phone || ""); setError(""); } setOpen(next); }}>
        <Dialog.Trigger asChild><Button type="button" variant="ghost" size="sm" className="shrink-0" leadingIcon={<Pencil className="size-3.5" aria-hidden="true" />}>Edit details</Button></Dialog.Trigger>
        <Dialog.Portal><Dialog.Overlay className="fixed inset-0 z-50 bg-[#10231a]/55 backdrop-blur-[2px]" /><Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90dvh] w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-border-subtle bg-white p-5 shadow-[var(--shadow-lg)] focus:outline-none sm:p-6">
          <div className="flex items-start justify-between gap-3"><div><Dialog.Title className="text-lg font-semibold">Client contact details</Dialog.Title><Dialog.Description className="mt-2 text-sm leading-6 text-text-secondary">Update how to reach {client.name}. These details are shared across their events.</Dialog.Description></div><Dialog.Close asChild><button type="button" aria-label="Close contact editor" className="flex size-9 shrink-0 items-center justify-center rounded-lg hover:bg-background-subtle"><X className="size-4" aria-hidden="true" /></button></Dialog.Close></div>
          <form onSubmit={save} className="mt-5 space-y-4"><Input label="Contact number" type="tel" autoComplete="tel" placeholder="e.g. +234 801 234 5678" optional value={phone} onChange={(event) => { setPhone(event.target.value); setError(""); }} /><Input label="Email address" type="email" autoComplete="email" optional value={email} onChange={(event) => { setEmail(event.target.value); setError(""); }} />{error && <p role="alert" className="text-sm text-error">{error}</p>}<div className="flex justify-end gap-2 border-t border-border-subtle pt-4"><Dialog.Close asChild><Button type="button" variant="ghost">Cancel</Button></Dialog.Close><Button type="submit">Save details</Button></div></form>
        </Dialog.Content></Dialog.Portal>
      </Dialog.Root>}
    </div>
    <dl className="mt-4 grid gap-4 border-t border-border-subtle pt-4 sm:grid-cols-2">
      {[{ label: "Contact number", icon: Phone, value: client?.phone, href: client?.phone ? `tel:${client.phone.replace(/[^+\d]/g, "")}` : undefined }, { label: "Email address", icon: Mail, value: client?.email, href: client?.email ? `mailto:${client.email}` : undefined }].map(({ label, icon: Icon, value, href }) => <div key={label} className="flex min-w-0 items-start gap-2"><Icon className="mt-0.5 size-4 shrink-0 text-[#9b7c4c]" aria-hidden="true" /><div className="min-w-0"><dt className="text-xs text-text-secondary">{label}</dt><dd className="mt-1 break-words text-sm font-medium">{value ? <a href={href} className="rounded-sm hover:text-brand-primary hover:underline focus-visible:outline-2 focus-visible:outline-brand-primary">{value}</a> : <span className="font-normal text-text-tertiary">Not added yet</span>}</dd></div></div>)}
    </dl>
  </section>;
}
