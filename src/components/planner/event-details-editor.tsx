"use client";

import { useState, type FormEvent } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import Link from "next/link";
import { Pencil, X } from "@/components/ui/icons";

import { CoverPicker } from "@/components/planner/cover-picker";
import { EventTimeZonePicker } from "@/components/planner/event-date-time-fields";
import { Button } from "@/components/ui/button";
import { budgetContext, currencies, formatBudgetMoney, repriceBudgetGuestItems, useBudgetStore } from "@/lib/planner-budget";
import { perGuestItemCount, repriceProposalGuestItems } from "@/lib/event-guest-pricing";
import { addPlannerClient, usePlannerClients } from "@/lib/planner-clients";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { hasAttachedClient, updatePlannerEvent, type NewPlannerEvent, type PlannerEvent } from "@/lib/planner-events";
import { usePlannerTeam } from "@/lib/planner-team";

const knownTypes = ["Wedding", "Corporate", "Party"];
const eventTypes = [...knownTypes.map((value) => ({ label: value, value })), { label: "Other", value: "Other event" }];

function BudgetReference({ label, amount, currency, href }: { label: string; amount: number | null; currency: string; href: string }) {
  return <div className="min-w-0"><p className="text-xs font-medium text-text-primary">{label}</p><div className="mt-2 flex min-h-12 flex-wrap items-center justify-between gap-x-4 gap-y-1 rounded-lg border border-border-subtle bg-[#f4f6f4] px-3 py-2.5"><span className="text-sm font-semibold tabular-nums text-text-secondary">{amount === null ? "Not set" : formatBudgetMoney(amount, currency)}</span><Link href={href} className="text-xs font-semibold text-brand-primary underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-brand-primary">Edit in Budget</Link></div></div>;
}

function eventDetails(event: PlannerEvent): NewPlannerEvent {
  return {
    name: event.name, type: event.type, date: event.date, startTime: event.startTime,
    endTime: event.endTime, location: event.location, city: event.city || "", currency: event.currency || "NGN", timeZone: event.timeZone || "Africa/Lagos", clientId: event.clientId, clientName: event.clientName,
    guestCount: event.guestCount, budget: event.budget, description: event.description, image: event.image,
    budgetTemplateId: event.budgetTemplateId, targetBudget: event.targetBudget,
    milestoneTemplateId: event.milestoneTemplateId, assignedTeamMember: event.assignedTeamMember, priority: event.priority,
  };
}

export function EventDetailsEditor({ event, className, open: controlledOpen, onOpenChange, hideTrigger = false }: { event: PlannerEvent; className?: string; open?: boolean; onOpenChange?: (open: boolean) => void; hideTrigger?: boolean }) {
  const teamMembers = usePlannerTeam();
  const clients = usePlannerClients();
  const budget = useBudgetStore();
  const currency = event.currency || "NGN";
  const budgeted = budgetContext([event], budget, event.id, currency).items.reduce((total, item) => total + item.budgeted, 0);
  const clientBudget = Number(event.targetBudget || (!event.budgetTemplateId ? event.budget : "")) || null;
  const budgetHref = `/planner/events/${encodeURIComponent(event.id)}?section=budget`;
  const clientFixed = hasAttachedClient(event);
  const affectedGuestItems = perGuestItemCount(event, budget.items);
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = (value: boolean) => { setInternalOpen(value); onOpenChange?.(value); };
  const [details, setDetails] = useState<NewPlannerEvent>(() => eventDetails(event));
  const [otherType, setOtherType] = useState(knownTypes.includes(event.type) ? "" : event.type);
  const [error, setError] = useState("");
  const [creatingClient, setCreatingClient] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [newClientEmail, setNewClientEmail] = useState("");
  const [confirmGuestPricing, setConfirmGuestPricing] = useState(false);
  const clientChoices = details.clientId && details.clientName && !clients.some(client => client.id === details.clientId)
    ? [...clients, { id: details.clientId, name: details.clientName }] : clients;

  function setField<K extends keyof NewPlannerEvent>(field: K, value: NewPlannerEvent[K]) {
    setDetails((current) => ({ ...current, [field]: value }));
    if (error) setError("");
  }

  function selectClient(value: string) {
    if (clientFixed) return;
    if (value === "new") { setCreatingClient(true); return; }
    const client = clientChoices.find(entry => entry.id === value);
    if (value !== "none" && !client) return;
    setDetails(current => ({ ...current, clientId: client?.id || "", clientName: client?.name || "" }));
    setCreatingClient(false);
    setError("");
  }

  function saveClient() {
    if (clientFixed) return;
    try {
      const client = addPlannerClient(newClientName, newClientEmail);
      setDetails(current => ({ ...current, clientId: client.id, clientName: client.name }));
      setCreatingClient(false);
      setNewClientName("");
      setNewClientEmail("");
      setError("");
    } catch (problem) { setError(problem instanceof Error ? problem.message : "Couldn’t save this client."); }
  }

  function save(formEvent: FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    if (!details.name.trim() || !details.type || !details.date) { setError("Name, type and date are required."); return; }
    if (creatingClient) { setError("Save the new client or cancel before saving this event."); return; }
    if ((details.type === "Other event" || !knownTypes.includes(details.type)) && !otherType.trim()) { setError("Enter the event type."); return; }
    if (details.startTime && details.endTime && details.endTime <= details.startTime) { setError("The end time should be later than the start time."); return; }
    if (details.guestCount && (!Number.isSafeInteger(Number(details.guestCount)) || Number(details.guestCount) < 0 || Number(details.guestCount) > 100000)) { setError("Enter a whole-number guest count between 0 and 100,000."); return; }
    if (Number(details.guestCount) !== Number(event.guestCount) && affectedGuestItems > 0) { setConfirmGuestPricing(true); return; }
    commit(false);
  }

  function commit(reprice: boolean) {
    let rollback: (() => void) | undefined;
    try {
      if (reprice) rollback = repriceBudgetGuestItems(event.id, Number(details.guestCount));
      let found = false;
      updatePlannerEvent(event.id, (current) => { found = true; const next = { ...current, ...details, budget: current.budget, targetBudget: current.targetBudget, clientId: hasAttachedClient(current) ? current.clientId : details.clientId, name: details.name.trim(), type: details.type === "Other event" || !knownTypes.includes(details.type) ? otherType.trim() : details.type, location: details.location.trim(), clientName: hasAttachedClient(current) ? current.clientName : details.clientName.trim(), description: details.description.trim() }; return reprice ? repriceProposalGuestItems(next, Number(details.guestCount)) : next; });
      if (!found) throw new Error("This event no longer exists.");
      setConfirmGuestPricing(false);
      setOpen(false);
      setError("");
    } catch (failure) { try { rollback?.(); } catch { setError("The guest-count update could not be completed. Check the event and budget before trying again."); return; } setError(failure instanceof Error ? failure.message : "These changes couldn’t be saved in this browser. Please try again."); }
  }

  return <Dialog.Root open={open} onOpenChange={(next) => { if (next) { setDetails(eventDetails(event)); setOtherType(knownTypes.includes(event.type) ? "" : event.type); setCreatingClient(false); setError(""); } setOpen(next); }}>
    {!hideTrigger && <Dialog.Trigger asChild><Button type="button" size="sm" variant="outline" className={className} leadingIcon={<Pencil className="size-3.5" aria-hidden="true" />}>Edit event</Button></Dialog.Trigger>}
    <Dialog.Portal><Dialog.Overlay className="fixed inset-0 z-50 bg-[#10231a]/55 backdrop-blur-[2px]" /><Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[min(90vh,850px)] w-[calc(100vw-2rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-[1.25rem] border border-border-subtle bg-white shadow-[var(--shadow-lg)] focus:outline-none">
      <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-border-subtle bg-white px-5 py-4 sm:px-7"><div><Dialog.Title className="text-lg font-semibold tracking-tight">Edit event</Dialog.Title><Dialog.Description className="mt-1 text-xs text-text-secondary">Update the essentials and planning details without creating a new event or using another credit.</Dialog.Description></div><Dialog.Close asChild><button type="button" aria-label="Close editor" className="flex size-8 shrink-0 items-center justify-center rounded-lg text-text-tertiary hover:bg-background-subtle"><X className="size-4" aria-hidden="true" /></button></Dialog.Close></div>
      <form onSubmit={save} className="space-y-5 p-5 sm:p-7">
        <Input label="Event name" required value={details.name} onChange={(change) => setField("name", change.target.value)} />
        <div className="grid gap-5 sm:grid-cols-2"><Select label="Event type" options={eventTypes} value={knownTypes.includes(details.type) ? details.type : "Other event"} onValueChange={(value) => setField("type", value)} required /><Input label="Event date" type="date" required value={details.date} onChange={(change) => setField("date", change.target.value)} /></div>
        {(details.type === "Other event" || !knownTypes.includes(details.type)) && <Input label="What kind of event?" placeholder="e.g. Product launch" required value={otherType} onChange={(change) => setOtherType(change.target.value)} />}
        <div className="grid gap-5 sm:grid-cols-2"><Input label="City" optional placeholder="e.g. Lagos" value={details.city || ""} onChange={(change) => setField("city", change.target.value)} /><Select label="Event currency" options={currencies.map((currency) => ({ label: currency.label, value: currency.code }))} value={details.currency || "NGN"} onValueChange={(value) => setField("currency", value)} /></div>
        <Input label="Venue" optional placeholder="Where is it happening?" value={details.location} onChange={(change) => setField("location", change.target.value)} />
        <div className="grid gap-5 sm:grid-cols-2"><Input label="Start time" type="time" optional value={details.startTime} onChange={(change) => setField("startTime", change.target.value)} /><Input label="End time" type="time" optional value={details.endTime} onChange={(change) => setField("endTime", change.target.value)} /></div>
        <EventTimeZonePicker id="edit-event-time-zone" value={details.timeZone || "Africa/Lagos"} onChange={(value) => setField("timeZone", value)} />
        <div className="grid items-start gap-5 sm:grid-cols-2"><div className="min-w-0">{clientFixed ? <div className="grid gap-2"><p className="type-label text-text-primary">Client or host</p><div className="flex h-10 items-center rounded-lg border border-border-subtle bg-[#f4f6f4] px-3 text-sm font-semibold text-text-secondary">{event.clientName || clients.find(client => client.id === event.clientId)?.name || "Attached client"}</div></div> : <Select label="Client or host" value={creatingClient ? "new" : details.clientId || clients.find((client) => client.name === details.clientName)?.id || "none"} options={[{ label: "No client yet", value: "none" }, ...clientChoices.map((client) => ({ label: client.name, value: client.id })), { label: "+ Create a new client", value: "new" }]} onValueChange={selectClient} />}<p className="mt-1.5 text-xs leading-5 text-text-tertiary">{clientFixed ? "Clients can’t be changed once added; create a new event instead." : "Once you add a client, they can’t be changed. You can leave this blank for now."}</p></div><Input label="Expected guests" type="number" min="0" optional value={details.guestCount} onChange={(change) => setField("guestCount", change.target.value)} /></div>
        {creatingClient && <div className="rounded-xl border border-border-subtle bg-[#f7faf7] p-4"><div className="grid gap-3 sm:grid-cols-2"><Input label="Client name" value={newClientName} onChange={(change) => setNewClientName(change.target.value)} /><Input label="Email" optional type="email" value={newClientEmail} onChange={(change) => setNewClientEmail(change.target.value)} /></div><div className="mt-3 flex gap-2"><Button type="button" size="sm" onClick={saveClient}>Save client</Button><Button type="button" size="sm" variant="ghost" onClick={() => setCreatingClient(false)}>Cancel</Button></div></div>}
        <BudgetReference label="Estimated budget" amount={budgeted} currency={currency} href={budgetHref} />
        <div className="grid gap-5 sm:grid-cols-2"><BudgetReference label="Client’s target budget" amount={clientBudget} currency={currency} href={budgetHref} /><Select label="Event priority" value={details.priority === "low" ? "standard" : details.priority ?? "standard"} onValueChange={(value) => setField("priority", value as NewPlannerEvent["priority"])} options={[{ label: "Standard", value: "standard" }, { label: "High", value: "high" }, { label: "Highest", value: "highest" }]} /></div>
        <Select label="Team lead" value={details.assignedTeamMember || "unassigned"} onValueChange={(value) => setField("assignedTeamMember", value === "unassigned" ? "" : value)} options={[{ label: "No lead assigned", value: "unassigned" }, ...teamMembers.map((member) => ({ label: member.isOwner ? `${member.name} · You` : member.name, value: member.name }))]} />
        <Textarea label="About this event" optional rows={3} value={details.description} onChange={(change) => setField("description", change.target.value)} />
        <CoverPicker value={details.image} onChange={(src) => setField("image", src)} event={event} />
        {error && <p role="alert" className="rounded-lg bg-error-soft px-3 py-2 text-xs text-error">{error}</p>}
        <div className="flex flex-col-reverse gap-2 border-t border-border-subtle pt-5 sm:flex-row sm:justify-end"><Dialog.Close asChild><Button type="button" variant="ghost">Cancel</Button></Dialog.Close><Button type="submit">Save changes</Button></div>
      </form>
    </Dialog.Content></Dialog.Portal>
    <Dialog.Root open={confirmGuestPricing} onOpenChange={setConfirmGuestPricing}><Dialog.Portal><Dialog.Overlay className="fixed inset-0 z-[60] bg-[#10231a]/55 backdrop-blur-[2px]" /><Dialog.Content className="fixed left-1/2 top-1/2 z-[60] w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-[var(--shadow-lg)]"><Dialog.Title className="text-lg font-semibold">Update per-guest costs?</Dialog.Title><Dialog.Description className="mt-3 text-sm leading-6 text-text-secondary">{affectedGuestItems} items are priced per guest. Update their budgeted amounts?</Dialog.Description><p className="mt-3 text-sm leading-6 text-text-secondary">Guest count: {event.guestCount || "not set"} → {details.guestCount || "not set"}. Budgeted amounts and proposal estimates update. Invoiced amounts and recorded payments never change.</p>{error && <p role="alert" className="mt-3 text-sm text-error">{error}</p>}<div className="mt-5 flex flex-wrap justify-end gap-2"><Button type="button" variant="ghost" onClick={() => setConfirmGuestPricing(false)}>Back</Button><Button type="button" variant="outline" onClick={() => commit(false)}>Keep current amounts</Button><Button type="button" disabled={Number(details.guestCount) <= 0} onClick={() => commit(true)}>Update amounts</Button></div></Dialog.Content></Dialog.Portal></Dialog.Root>
  </Dialog.Root>;
}
