"use client";

import { useState, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, CalendarDays, Check, CircleCheck, Clock3, CreditCard, ImageIcon, MapPin, Plus, UserRound, UsersRound, Wallet, type PhosphorIcon } from "@/components/ui/icons";

import { CoverPicker } from "@/components/planner/cover-picker";
import { AdvancedSection, CreateEventAdvanced } from "@/components/planner/create-event-advanced";
import { EventDatePicker, EventTimePicker, EventTimeZonePicker } from "@/components/planner/event-date-time-fields";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils/cn";
import { getCreditBalance, refundCreditUse, spendCreditForEvent, useCreditBalance, type CreditUsage } from "@/lib/planner-credits";
import { currencies, formatBudgetMoney, importBudgetData, type BudgetGroup, type BudgetItem } from "@/lib/planner-budget";
import { addPlannerClient, usePlannerClients } from "@/lib/planner-clients";
import { budgetTemplates, estimateBudget, milestoneDueDate } from "@/lib/event-setup-templates";
import { useMilestoneTemplates } from "@/lib/planner-task-templates";
import { createPlannerEvent, eventCovers, formatEventDate, isCustomCover, useBrowserReady, type NewPlannerEvent } from "@/lib/planner-events";

const eventTypes = [
  { label: "Wedding", value: "Wedding" },
  { label: "Corporate", value: "Corporate" },
  { label: "Party", value: "Party" },
  { label: "Other", value: "Other event" },
];

const initial: NewPlannerEvent = {
  name: "", type: "", date: "", startTime: "", endTime: "", location: "", city: "", currency: "NGN", timeZone: "Africa/Lagos", clientId: "",
  clientName: "", guestCount: "", budget: "", description: "", image: eventCovers[0].src,
  budgetTemplateId: "", targetBudget: "", milestoneTemplateId: "", assignedTeamMember: "", priority: "standard",
};

type EssentialField = "name" | "type" | "otherType" | "date" | "city";

const guestSizes = [50, 100, 150, 250, 500] as const;
function PreviewRow({ icon: Icon, label, value, required = false }: { icon: PhosphorIcon; label: string; value: string; required?: boolean }) {
  return <div className="flex items-start gap-3 py-2.5"><span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-[#f1f5f1] text-brand-primary"><Icon className="size-3.5" aria-hidden="true" /></span><div className="min-w-0 flex-1"><p className="text-[0.625rem] font-semibold uppercase tracking-wide text-text-tertiary">{label}{required && <span className="ml-0.5 text-error" aria-label="required">*</span>}</p><p className={cn("mt-0.5 break-words text-xs font-medium", value === "Not added yet" ? "text-text-tertiary" : "text-text-primary")}>{value}</p></div></div>;
}

export function CreateEventForm() {
  const router = useRouter();
  const ready = useBrowserReady();
  const credits = useCreditBalance();
  const milestoneTemplates = useMilestoneTemplates();
  const clients = usePlannerClients();
  const [step, setStep] = useState<1 | 2>(1);
  const [values, setValues] = useState<NewPlannerEvent>(initial);
  const [otherType, setOtherType] = useState("");
  const [errors, setErrors] = useState<Partial<Record<EssentialField, string>>>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [creatingClient, setCreatingClient] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [newClientEmail, setNewClientEmail] = useState("");
  const [clientError, setClientError] = useState("");
  const selectedBudgetTemplate = budgetTemplates.find((template) => template.id === values.budgetTemplateId);
  const estimatedRows = values.currency === "NGN" && selectedBudgetTemplate ? estimateBudget(selectedBudgetTemplate, Number(values.guestCount) || selectedBudgetTemplate.baselineGuests) : null;
  const estimatedBudget = estimatedRows ? estimatedRows.reduce((sum, item) => sum + item.amount, 0) : null;

  function setField<K extends keyof NewPlannerEvent>(field: K, value: NewPlannerEvent[K]) {
    setValues((current) => ({ ...current, [field]: value }));
    if (field in errors) setErrors((current) => ({ ...current, [field]: undefined }));
  }

  function validateEssentials() {
    const next: Partial<Record<EssentialField, string>> = {};
    if (!values.name.trim()) next.name = "Give this event a name.";
    if (!values.type) next.type = "Choose an event type.";
    if (values.type === "Other event" && !otherType.trim()) next.otherType = "Tell us what kind of event this is.";
    if (!values.date) next.date = "Choose an event date.";
    else if (values.date < new Date().toLocaleDateString("sv-SE")) next.date = "Choose today or a future date.";
    if (!values.city?.trim()) next.city = "Add the city where your event will take place.";
    setErrors(next);
    const first = Object.keys(next)[0];
    if (first) window.setTimeout(() => document.getElementById(`event-${first}`)?.focus(), 0);
    return Object.keys(next).length === 0;
  }

  function saveEvent() {
    if (!validateEssentials()) { setStep(1); return; }
    if (creatingClient) { setClientError("Save this client or cancel before creating the event."); return; }
    if (getCreditBalance() < 1) { setSaveError("You need one credit to create an event. Purchase credits to continue."); return; }
    if (values.startTime && values.endTime && values.endTime <= values.startTime) {
      setSaveError("The end time should be later than the start time.");
      return;
    }
    setSaving(true);
    setSaveError("");
    let usage: CreditUsage | null = null;
    let eventSaved = false;
    try {
      const eventId = crypto.randomUUID();
      usage = spendCreditForEvent(eventId, values.name);
      if (!usage) { setSaveError("You need one credit to create an event."); setSaving(false); return; }
      const milestoneTemplate = milestoneTemplates.find((template) => template.id === values.milestoneTemplateId);
      const taskGroups = milestoneTemplate?.milestones.map((milestone) => ({
        id: crypto.randomUUID(), title: milestone.title, description: milestone.description,
        dueDate: milestone.daysBefore === undefined ? undefined : milestoneDueDate(values.date, milestone.daysBefore),
      })) ?? [];
      const initialTasks = milestoneTemplate?.milestones.flatMap((milestone, index) => milestone.tasks.map((task) => ({
        id: crypto.randomUUID(), title: task.title, groupId: taskGroups[index].id,
        detail: task.detail, dueDate: task.daysBefore === undefined ? undefined : milestoneDueDate(values.date, task.daysBefore),
        status: "todo" as const, priority: task.priority ?? "medium" as const, clientVisible: task.clientVisible ?? false, done: false,
      }))) ?? [];
      const created = createPlannerEvent({
        ...values,
        budget: estimatedBudget !== null ? String(estimatedBudget) : values.budget,
        guestCount: values.guestCount || (selectedBudgetTemplate ? String(selectedBudgetTemplate.baselineGuests) : ""),
        name: values.name.trim(),
        type: values.type === "Other event" ? otherType.trim() : values.type,
        location: values.location.trim(),
        city: values.city?.trim(),
        clientName: values.clientName.trim(),
        description: values.description.trim(),
        assignedTeamMember: values.assignedTeamMember?.trim(),
      }, eventId, initialTasks, taskGroups);
      eventSaved = true;
      if (estimatedRows) {
        const groups: BudgetGroup[] = [...new Set(estimatedRows.map((row) => row.group))].map((name) => ({ id: crypto.randomUUID(), name, eventId, currency: values.currency || "NGN", createdAt: created.createdAt }));
        const items: BudgetItem[] = estimatedRows.map((row) => ({ id: crypto.randomUUID(), groupId: groups.find((group) => group.name === row.group)!.id, eventId, name: row.name, vendor: "", vendorStatus: "not-sourced", currency: values.currency || "NGN", budgeted: row.amount, invoiced: 0, paid: 0, paymentDate: "", notes: "Starting estimate from the selected template. Adjust as quotes arrive.", status: "not-started", installments: [], attachments: [], createdAt: created.createdAt }));
        importBudgetData(groups, items);
      }
      router.push(`/planner/events/${created.id}`);
    } catch {
      if (usage && !eventSaved) refundCreditUse(usage.id);
      setSaving(false);
      setSaveError(eventSaved ? "Your event was saved, but we couldn’t open it. Find it in All events." : "We couldn’t save your event in this browser. Check that site storage is available and try again.");
    }
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (step === 1) {
      if (getCreditBalance() < 1) { setSaveError("You need one credit to continue. Purchase a credit to create this event."); return; }
      if (validateEssentials()) { setStep(2); setSaveError(""); window.scrollTo({ top: 0, behavior: "smooth" }); }
    } else saveEvent();
  }

  return (
    <div className="mx-auto w-full max-w-[1280px] pb-8">
      <Link href="/planner/events" className="inline-flex min-h-10 items-center gap-2 text-xs font-semibold text-text-secondary transition-colors hover:text-brand-primary"><ArrowLeft className="size-4" aria-hidden="true" />All events</Link>
      <div className="mt-3"><p className="mb-2 text-[0.6875rem] font-bold uppercase tracking-[0.14em] text-brand-primary">Planner workspace / New event</p><h1 className="text-[1.75rem] font-semibold tracking-[-0.045em] text-text-primary sm:text-[2rem]">Let&apos;s bring it to life.</h1><p className="mt-2 text-sm text-text-secondary">Start with the essentials. You can refine every detail later.</p></div>
      {ready && credits < 1 && <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-[#efd6bd] bg-[#fff8ed] p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-5 sm:p-5" role="alert">
        <div className="flex min-w-0 items-start gap-3"><span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#a66c36] shadow-sm"><CreditCard className="size-5" aria-hidden="true" /></span><div className="min-w-0"><p className="text-sm font-semibold leading-5 text-text-primary">You’re out of event credits</p><p className="mt-1 text-xs leading-5 text-text-secondary">Fill in the essentials now. You’ll need 1 credit to continue and create this event.</p></div></div>
        <Link href="/planner/credits?tab=buy" className="inline-flex min-h-11 w-full shrink-0 items-center justify-center gap-2 rounded-lg border border-[#e9c9a5] bg-white px-4 text-xs font-semibold text-[#85572e] transition-colors hover:bg-[#fff3e2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a66c36] sm:w-auto">Buy credits <ArrowRight className="size-4" aria-hidden="true" /></Link>
      </div>}
      <div className="mt-7 grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_320px] xl:gap-8">
        <div className="min-w-0 overflow-hidden rounded-[1.25rem] border border-border-subtle bg-white shadow-[0_12px_35px_-30px_rgba(19,40,30,.3)]">
          <div className="border-b border-border-subtle px-5 py-5 sm:px-8">
            <ol className="flex items-center gap-3" aria-label="Event creation progress">
              {[{ number: 1, label: "The essentials" }, { number: 2, label: "Advanced details", sub: "Optional" }].map((item, index) => (
                <li key={item.number} className="flex min-w-0 flex-1 items-center gap-3">
                  <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold", step > item.number ? "bg-brand-primary text-white" : step === item.number ? "bg-brand-primary text-white" : "bg-background-subtle text-text-tertiary")}>{step > item.number ? <Check className="size-4" aria-hidden="true" /> : item.number}</span>
                  <span className="min-w-0"><span className={cn("block truncate text-xs font-semibold sm:text-sm", step === item.number ? "text-text-primary" : "text-text-tertiary")}>{item.label}</span>{item.sub && <span className="block text-[0.625rem] text-text-tertiary">{item.sub}</span>}</span>
                  {index === 0 && <span className="ml-auto hidden h-px min-w-4 flex-1 bg-border-subtle sm:block" aria-hidden="true" />}
                </li>
              ))}
            </ol>
          </div>

          <form onSubmit={onSubmit} noValidate className="@container/event-form p-5 sm:p-8">
            {step === 1 ? (
              <div className="space-y-7">
                <div><h2 className="text-xl font-semibold tracking-tight">The essentials</h2><p className="mt-1.5 text-sm leading-6 text-text-secondary">Just enough to create a home for your event.</p></div>
                <AdvancedSection title="Event information" description="The name, type, date and place your plan will grow around." icon={CalendarDays}>
                  <Input id="event-name" label="Event name" placeholder="e.g. Ada & Tunde’s wedding" autoComplete="off" required value={values.name} onChange={(event) => setField("name", event.target.value)} error={errors.name} />
                  <div className="grid gap-5 sm:grid-cols-2">
                    <Select id="event-type" label="Event type" placeholder="Choose a type" required options={eventTypes} value={values.type} onValueChange={(value) => { setField("type", value); if (!isCustomCover(values.image)) setField("image", value === "Wedding" ? eventCovers[1].src : value === "Corporate" ? eventCovers[2].src : value === "Party" ? eventCovers[3].src : eventCovers[0].src); }} error={errors.type} />
                    <EventDatePicker id="event-date" value={values.date} onChange={(date) => setField("date", date)} error={errors.date} />
                  </div>
                  {values.type === "Other event" && <Input id="event-otherType" label="What kind of event?" placeholder="e.g. Product launch" required value={otherType} onChange={(event) => { setOtherType(event.target.value); if (errors.otherType) setErrors((current) => ({ ...current, otherType: undefined })); }} error={errors.otherType} />}
                  <div className="grid gap-5 sm:grid-cols-2">
                    <Input id="event-city" label="City" placeholder="e.g. Lagos" required value={values.city || ""} onChange={(event) => setField("city", event.target.value)} error={errors.city} />
                    <Select id="event-currency" label="Event currency" required options={currencies.map((currency) => ({ label: currency.label, value: currency.code }))} value={values.currency || "NGN"} onValueChange={(value) => { setField("currency", value); if (value !== "NGN") setField("budgetTemplateId", ""); }} />
                  </div>
                  <div className="grid items-start gap-5 sm:grid-cols-2">
                    <Input id="event-location" label="Venue" placeholder="e.g. The Balmoral" helperText="You can confirm the venue later." optional value={values.location} onChange={(event) => setField("location", event.target.value)} />
                    <div>
                      <Input id="event-guests" label="Guest size" inputMode="numeric" placeholder="e.g. 150" optional value={values.guestCount || ""} onChange={(event) => { const digits = event.target.value.replace(/\D/g, ""); setField("guestCount", digits ? String(Math.min(100000, Number(digits))) : ""); }} />
                      <div className="mt-2"><p className="text-[0.6875rem] font-medium text-text-tertiary">Quick guest sizes</p><div className="mt-1.5 flex flex-wrap gap-1.5">{guestSizes.map((size) => <button key={size} type="button" aria-pressed={values.guestCount === String(size)} onClick={() => setField("guestCount", values.guestCount === String(size) ? "" : String(size))} className={cn("min-h-8 rounded-full border px-3 text-[0.6875rem] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary", values.guestCount === String(size) ? "border-brand-primary bg-brand-primary text-white" : "border-border-subtle bg-white text-text-secondary hover:border-brand-primary hover:text-brand-primary")}>{size.toLocaleString("en-NG")}</button>)}</div></div>
                    </div>
                  </div>
                </AdvancedSection>
              </div>
            ) : (
              <div className="space-y-7">
                <div><h2 className="text-xl font-semibold tracking-tight">Advanced details</h2><p className="mt-1.5 text-sm leading-6 text-text-secondary">A starting budget, a plan and a point person. All optional.</p></div>
                <AdvancedSection title="Event details" description="A little more about the day and who it’s for." icon={Clock3}>
                  <div className="grid gap-5 @min-[520px]/event-form:grid-cols-3"><EventTimePicker id="event-start-time" label="Start time" value={values.startTime} onChange={(time) => setField("startTime", time)} /><EventTimePicker id="event-end-time" label="End time" value={values.endTime} onChange={(time) => setField("endTime", time)} /><EventTimeZonePicker id="event-time-zone" value={values.timeZone || "Africa/Lagos"} onChange={(value) => setField("timeZone", value)} /></div>
                  <p className="-mt-2 text-xs text-text-tertiary">Both times use the selected local time zone.</p>
                  <div className="space-y-3"><Select label="Client or host" placeholder="Choose an existing client" value={creatingClient ? "new" : values.clientId || "none"} options={[{ label: "No client yet", value: "none" }, ...clients.map((client) => ({ label: client.name, value: client.id })), { label: "+ Create a new client", value: "new" }]} onValueChange={(value) => { setClientError(""); if (value === "new") { setCreatingClient(true); return; } setCreatingClient(false); const client = clients.find((entry) => entry.id === value); setField("clientId", client?.id || ""); setField("clientName", client?.name || ""); }} />
                    {creatingClient && <div className="rounded-xl border border-[#dce9df] bg-[#f7faf7] p-4"><p className="mb-3 text-xs font-semibold text-text-primary">New client</p><div className="grid gap-3 sm:grid-cols-2"><Input label="Client name" value={newClientName} onChange={(event) => setNewClientName(event.target.value)} placeholder="e.g. Ada Okoye" /><Input label="Email" optional type="email" value={newClientEmail} onChange={(event) => setNewClientEmail(event.target.value)} placeholder="ada@example.com" /></div>{clientError && <p role="alert" className="mt-2 text-xs text-error">{clientError}</p>}<div className="mt-3 flex gap-2"><Button type="button" size="sm" onClick={() => { try { const client = addPlannerClient(newClientName, newClientEmail); setField("clientId", client.id); setField("clientName", client.name); setCreatingClient(false); setNewClientName(""); setNewClientEmail(""); setClientError(""); } catch (error) { setClientError(error instanceof Error ? error.message : "Couldn’t save this client."); } }} leadingIcon={<Plus className="size-4" />}>Save client</Button><Button type="button" size="sm" variant="ghost" onClick={() => setCreatingClient(false)}>Cancel</Button></div></div>}
                  </div>
                </AdvancedSection>
                <CreateEventAdvanced values={values} onChange={(field, value) => setField(field, value)} estimatedBudget={estimatedBudget} />
                <AdvancedSection title="Finishing touches" description="Give the event its own look and a little context." icon={ImageIcon}>
                  <Textarea id="event-description" label="About this event" placeholder="The vision, priorities, or anything worth remembering…" rows={3} value={values.description} onChange={(event) => setField("description", event.target.value)} />
                  <CoverPicker value={values.image} onChange={(src) => setField("image", src)} />
                </AdvancedSection>
              </div>
            )}

            {saveError && <p role="alert" className="mt-6 rounded-lg bg-error-soft px-4 py-3 text-xs text-error">{saveError} {credits < 1 && <Link href="/planner/credits?tab=buy" className="font-semibold underline">Buy credits</Link>}</p>}
            <div className="mt-8 flex flex-col-reverse gap-3 border-t border-border-subtle pt-6 sm:flex-row sm:items-center sm:justify-between">
              {step === 1 ? <Link href="/planner/events" className="inline-flex min-h-10 items-center justify-center px-3 text-sm font-semibold text-text-secondary hover:text-text-primary">Cancel</Link> : <Button type="button" variant="ghost" onClick={() => { setStep(1); setSaveError(""); }} leadingIcon={<ArrowLeft className="size-4" aria-hidden="true" />}>Back</Button>}
              <Button type="submit" disabled={saving || !ready || credits < 1} trailingIcon={step === 1 ? <ArrowRight className="size-4" aria-hidden="true" /> : <CircleCheck className="size-4" aria-hidden="true" />}>{step === 1 ? "Continue with 1 credit" : saving ? "Creating…" : "Create event"}</Button>
            </div>
          </form>
        </div>

        <aside className="overflow-hidden rounded-[1.25rem] border border-border-subtle bg-white xl:sticky xl:top-24" aria-label="Live event preview">
          <div className="relative h-44"><Image src={values.image} alt="Selected event cover" fill unoptimized={isCustomCover(values.image)} sizes="340px" className="object-cover" /><span className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" /><span className="absolute bottom-4 left-5 rounded-full border border-white/30 bg-white/15 px-2.5 py-1 text-[0.625rem] font-semibold text-white backdrop-blur-sm">Live preview</span></div>
          <div className="px-5 pb-4 pt-5"><p className="text-[0.625rem] font-bold uppercase tracking-[0.12em] text-brand-primary">Your event at a glance</p><p className="mt-2 text-[0.625rem] font-semibold uppercase text-text-tertiary">Event name <span className="text-error" aria-label="required">*</span></p><h3 className={cn("mt-1 break-words text-lg font-semibold tracking-tight", !values.name && "text-text-tertiary")}>{values.name.trim() || "Your event name"}</h3><p className="mt-2 text-[0.625rem] font-semibold uppercase text-text-tertiary">Event type <span className="text-error" aria-label="required">*</span></p><p className="mt-0.5 text-xs text-text-secondary">{values.type === "Other event" ? otherType.trim() || "Other event" : values.type || "Event type not selected"}</p>
            <div className="mt-4 divide-y divide-border-subtle border-y border-border-subtle">
              <PreviewRow icon={Clock3} label="Date" required value={values.date ? formatEventDate(values.date) : "Not added yet"} />
              <PreviewRow icon={MapPin} label="City" required value={values.city?.trim() || "Not added yet"} />
              <PreviewRow icon={MapPin} label="Venue" value={values.location.trim() || "Not added yet"} />
              <PreviewRow icon={Wallet} label="Event currency" required value={values.currency || "NGN"} />
              <PreviewRow icon={Clock3} label="Start time" value={values.startTime ? `${values.startTime} · ${values.timeZone || "Africa/Lagos"}` : "Not added yet"} />
              <PreviewRow icon={Clock3} label="End time" value={values.endTime ? `${values.endTime} · ${values.timeZone || "Africa/Lagos"}` : "Not added yet"} />
              <PreviewRow icon={UserRound} label="Client or host" value={values.clientName.trim() || "Not added yet"} />
              <PreviewRow icon={UsersRound} label="Expected guests" value={values.guestCount ? Number(values.guestCount).toLocaleString("en-NG") : selectedBudgetTemplate ? `${selectedBudgetTemplate.baselineGuests.toLocaleString("en-NG")} suggested` : "Not added yet"} />
              <PreviewRow icon={Wallet} label="Estimated budget" value={estimatedBudget !== null ? formatBudgetMoney(estimatedBudget, values.currency || "NGN") : values.budget ? formatBudgetMoney(Number(values.budget), values.currency || "NGN") : "Not added yet"} />
              <PreviewRow icon={UserRound} label="Team lead" value={values.assignedTeamMember?.trim() || "Not added yet"} />
              <PreviewRow icon={Check} label="Priority" value={`${(values.priority || "standard")[0].toUpperCase()}${(values.priority || "standard").slice(1)}`} />
            </div>
            <div className="pt-4"><p className="text-[0.625rem] font-semibold uppercase tracking-wide text-text-tertiary">About this event</p><p className={cn("mt-1 break-words text-xs leading-5", values.description.trim() ? "text-text-secondary" : "text-text-tertiary")}>{values.description.trim() || "Add a short description when you’re ready."}</p></div>
          </div>
          <div className="border-t border-[#e5ece6] bg-[#f3f7f3] px-5 py-3 text-[0.6875rem] text-[#526f5b]">This preview updates as you fill the form.</div>
        </aside>
      </div>
    </div>
  );
}
