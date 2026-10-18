"use client";

import { useState, type FormEvent } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Pencil, X } from "@/components/ui/icons";

import { CoverPicker } from "@/components/planner/cover-picker";
import { Button } from "@/components/ui/button";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatGroupedDigits, updatePlannerEvent, type NewPlannerEvent, type PlannerEvent } from "@/lib/planner-events";
import { usePlannerTeam } from "@/lib/planner-team";

const knownTypes = ["Wedding", "Birthday & celebration", "Corporate event", "Conference", "Concert & performance"];
const eventTypes = [...knownTypes.map((value) => ({ label: value, value })), { label: "Other", value: "Other event" }];

function eventDetails(event: PlannerEvent): NewPlannerEvent {
  return {
    name: event.name, type: event.type, date: event.date, startTime: event.startTime,
    endTime: event.endTime, location: event.location, clientName: event.clientName,
    guestCount: event.guestCount, budget: event.budget, description: event.description, image: event.image,
    budgetTemplateId: event.budgetTemplateId, targetBudget: event.targetBudget,
    milestoneTemplateId: event.milestoneTemplateId, assignedTeamMember: event.assignedTeamMember, priority: event.priority,
  };
}

export function EventDetailsEditor({ event }: { event: PlannerEvent }) {
  const teamMembers = usePlannerTeam();
  const [open, setOpen] = useState(false);
  const [details, setDetails] = useState<NewPlannerEvent>(() => eventDetails(event));
  const [otherType, setOtherType] = useState(knownTypes.includes(event.type) ? "" : event.type);
  const [error, setError] = useState("");

  function setField<K extends keyof NewPlannerEvent>(field: K, value: NewPlannerEvent[K]) {
    setDetails((current) => ({ ...current, [field]: value }));
    if (error) setError("");
  }

  function save(formEvent: FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    if (!details.name.trim() || !details.type || !details.date) { setError("Name, type and date are required."); return; }
    if ((details.type === "Other event" || !knownTypes.includes(details.type)) && !otherType.trim()) { setError("Enter the event type."); return; }
    if (details.startTime && details.endTime && details.endTime <= details.startTime) { setError("The end time should be later than the start time."); return; }
    try {
      updatePlannerEvent(event.id, (current) => ({ ...current, ...details, name: details.name.trim(), type: details.type === "Other event" || !knownTypes.includes(details.type) ? otherType.trim() : details.type, location: details.location.trim(), clientName: details.clientName.trim(), description: details.description.trim() }));
      setOpen(false);
      setError("");
    } catch { setError("These changes couldn’t be saved in this browser. Please try again."); }
  }

  return <Dialog.Root open={open} onOpenChange={(next) => { if (next) { setDetails(eventDetails(event)); setOtherType(knownTypes.includes(event.type) ? "" : event.type); setError(""); } setOpen(next); }}>
    <Dialog.Trigger asChild><Button type="button" size="sm" variant="outline" leadingIcon={<Pencil className="size-3.5" aria-hidden="true" />}>Edit event</Button></Dialog.Trigger>
    <Dialog.Portal><Dialog.Overlay className="fixed inset-0 z-50 bg-[#10231a]/55 backdrop-blur-[2px]" /><Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[min(90vh,850px)] w-[calc(100vw-2rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-[1.25rem] border border-border-subtle bg-white shadow-[var(--shadow-lg)] focus:outline-none">
      <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-border-subtle bg-white px-5 py-4 sm:px-7"><div><Dialog.Title className="text-lg font-semibold tracking-tight">Edit event</Dialog.Title><Dialog.Description className="mt-1 text-xs text-text-secondary">Update the essentials and planning details without creating a new event or using another credit.</Dialog.Description></div><Dialog.Close asChild><button type="button" aria-label="Close editor" className="flex size-8 shrink-0 items-center justify-center rounded-lg text-text-tertiary hover:bg-background-subtle"><X className="size-4" aria-hidden="true" /></button></Dialog.Close></div>
      <form onSubmit={save} className="space-y-5 p-5 sm:p-7">
        <Input label="Event name" required value={details.name} onChange={(change) => setField("name", change.target.value)} />
        <div className="grid gap-5 sm:grid-cols-2"><Select label="Event type" options={eventTypes} value={knownTypes.includes(details.type) ? details.type : "Other event"} onValueChange={(value) => setField("type", value)} required /><Input label="Event date" type="date" required value={details.date} onChange={(change) => setField("date", change.target.value)} /></div>
        {(details.type === "Other event" || !knownTypes.includes(details.type)) && <Input label="What kind of event?" placeholder="e.g. Product launch" required value={otherType} onChange={(change) => setOtherType(change.target.value)} />}
        <Input label="Venue or location" optional placeholder="Where is it happening?" value={details.location} onChange={(change) => setField("location", change.target.value)} />
        <div className="grid gap-5 sm:grid-cols-2"><Input label="Start time" type="time" optional value={details.startTime} onChange={(change) => setField("startTime", change.target.value)} /><Input label="End time" type="time" optional value={details.endTime} onChange={(change) => setField("endTime", change.target.value)} /></div>
        <div className="grid gap-5 sm:grid-cols-2"><Input label="Client or host" optional value={details.clientName} onChange={(change) => setField("clientName", change.target.value)} /><Input label="Expected guests" type="number" min="0" optional value={details.guestCount} onChange={(change) => setField("guestCount", change.target.value)} /></div>
        <CurrencyInput label="Estimated budget" placeholder="0" value={formatGroupedDigits(details.budget)} onChange={(change) => setField("budget", change.target.value.replace(/[^0-9]/g, "").slice(0, 15))} />
        <div className="grid gap-5 sm:grid-cols-2"><CurrencyInput label="Client’s target budget" placeholder="0" value={formatGroupedDigits(details.targetBudget ?? "")} onChange={(change) => setField("targetBudget", change.target.value.replace(/[^0-9]/g, "").slice(0, 15))} /><Select label="Event priority" value={details.priority ?? "standard"} onValueChange={(value) => setField("priority", value as NewPlannerEvent["priority"])} options={[{ label: "High", value: "high" }, { label: "Standard", value: "standard" }, { label: "Low", value: "low" }]} /></div>
        <Select label="Team lead" value={details.assignedTeamMember || "unassigned"} onValueChange={(value) => setField("assignedTeamMember", value === "unassigned" ? "" : value)} options={[{ label: "No lead assigned", value: "unassigned" }, ...teamMembers.map((member) => ({ label: member.isOwner ? `${member.name} · You` : member.name, value: member.name }))]} />
        <Textarea label="About this event" optional rows={3} value={details.description} onChange={(change) => setField("description", change.target.value)} />
        <CoverPicker value={details.image} onChange={(src) => setField("image", src)} />
        {error && <p role="alert" className="rounded-lg bg-error-soft px-3 py-2 text-xs text-error">{error}</p>}
        <div className="flex flex-col-reverse gap-2 border-t border-border-subtle pt-5 sm:flex-row sm:justify-end"><Dialog.Close asChild><Button type="button" variant="ghost">Cancel</Button></Dialog.Close><Button type="submit">Save changes</Button></div>
      </form>
    </Dialog.Content></Dialog.Portal>
  </Dialog.Root>;
}
