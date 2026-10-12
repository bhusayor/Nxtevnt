"use client";

import { useState, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, CircleCheck, Clock3, CreditCard, MapPin, UserRound, UsersRound, Wallet, type LucideIcon } from "lucide-react";

import { CoverPicker } from "@/components/planner/cover-picker";
import { EventDatePicker, EventTimePicker } from "@/components/planner/event-date-time-fields";
import { Button } from "@/components/ui/button";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils/cn";
import { getCreditBalance, refundCreditUse, spendCreditForEvent, useCreditBalance, type CreditUsage } from "@/lib/planner-credits";
import { createPlannerEvent, eventCovers, formatEventDate, formatGroupedDigits, formatNaira, isCustomCover, useBrowserReady, type NewPlannerEvent } from "@/lib/planner-events";

const eventTypes = [
  { label: "Wedding", value: "Wedding" },
  { label: "Birthday & celebration", value: "Birthday & celebration" },
  { label: "Corporate event", value: "Corporate event" },
  { label: "Conference", value: "Conference" },
  { label: "Concert & performance", value: "Concert & performance" },
  { label: "Other", value: "Other event" },
];

const initial: NewPlannerEvent = {
  name: "", type: "", date: "", startTime: "", endTime: "", location: "",
  clientName: "", guestCount: "", budget: "", description: "", image: eventCovers[0].src,
};

type EssentialField = "name" | "type" | "otherType" | "date";

function PreviewRow({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return <div className="flex items-start gap-3 py-2.5"><span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-[#f1f5f1] text-brand-primary"><Icon className="size-3.5" aria-hidden="true" /></span><div className="min-w-0 flex-1"><p className="text-[0.625rem] font-semibold uppercase tracking-wide text-text-tertiary">{label}</p><p className={cn("mt-0.5 break-words text-xs font-medium", value === "Not added yet" ? "text-text-tertiary" : "text-text-primary")}>{value}</p></div></div>;
}

export function CreateEventForm() {
  const router = useRouter();
  const ready = useBrowserReady();
  const credits = useCreditBalance();
  const [step, setStep] = useState<1 | 2>(1);
  const [values, setValues] = useState<NewPlannerEvent>(initial);
  const [otherType, setOtherType] = useState("");
  const [errors, setErrors] = useState<Partial<Record<EssentialField, string>>>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

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
    setErrors(next);
    const first = Object.keys(next)[0];
    if (first) window.setTimeout(() => document.getElementById(`event-${first}`)?.focus(), 0);
    return Object.keys(next).length === 0;
  }

  function saveEvent() {
    if (!validateEssentials()) { setStep(1); return; }
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
      const created = createPlannerEvent({
        ...values,
        name: values.name.trim(),
        type: values.type === "Other event" ? otherType.trim() : values.type,
        location: values.location.trim(),
        clientName: values.clientName.trim(),
        description: values.description.trim(),
      }, eventId);
      eventSaved = true;
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
      {ready && credits < 1 && <div className="mt-6 flex flex-wrap items-center gap-4 rounded-xl border border-[#efd6bd] bg-[#fff8ed] p-4 sm:p-5" role="alert"><span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-white text-[#a66c36]"><CreditCard className="size-5" aria-hidden="true" /></span><div className="min-w-0 flex-1"><p className="text-sm font-semibold text-text-primary">You’re low on event credits</p><p className="mt-1 text-xs leading-5 text-text-secondary">You can fill in the essentials now. Purchase a credit to continue and create this event.</p></div><Link href="/planner/credits" className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg border border-[#e9c9a5] bg-white px-4 text-xs font-semibold text-[#85572e] transition-colors hover:bg-[#fff3e2]">Purchase credits <ArrowRight className="size-3.5" aria-hidden="true" /></Link></div>}
      <div className="mt-7 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px] xl:gap-8">
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

          <form onSubmit={onSubmit} noValidate className="p-5 sm:p-8">
            {step === 1 ? (
              <div className="space-y-6">
                <div><h2 className="text-xl font-semibold tracking-tight">The essentials</h2><p className="mt-1 text-sm text-text-secondary">Just enough to create a home for your event.</p></div>
                <Input id="event-name" label="Event name" placeholder="e.g. Ada & Tunde’s wedding" autoComplete="off" required value={values.name} onChange={(event) => setField("name", event.target.value)} error={errors.name} />
                <div className="grid gap-5 sm:grid-cols-2">
                  <Select id="event-type" label="Event type" placeholder="Choose a type" required options={eventTypes} value={values.type} onValueChange={(value) => { setField("type", value); if (!isCustomCover(values.image)) setField("image", value === "Wedding" ? eventCovers[1].src : value === "Corporate event" || value === "Conference" ? eventCovers[2].src : value === "Birthday & celebration" ? eventCovers[3].src : eventCovers[0].src); }} error={errors.type} />
                  <EventDatePicker id="event-date" value={values.date} onChange={(date) => setField("date", date)} error={errors.date} />
                </div>
                {values.type === "Other event" && <Input id="event-otherType" label="What kind of event?" placeholder="e.g. Product launch" required value={otherType} onChange={(event) => { setOtherType(event.target.value); if (errors.otherType) setErrors((current) => ({ ...current, otherType: undefined })); }} error={errors.otherType} />}
                <Input id="event-location" label="Venue or location" placeholder="e.g. Victoria Island, Lagos" helperText="It’s fine if the venue is not confirmed yet." optional value={values.location} onChange={(event) => setField("location", event.target.value)} />
              </div>
            ) : (
              <div className="space-y-6">
                <div><h2 className="text-xl font-semibold tracking-tight">Advanced details</h2><p className="mt-1 text-sm text-text-secondary">Add what you know now. Everything here is optional and editable later.</p></div>
                <div className="grid gap-5 sm:grid-cols-2"><EventTimePicker id="event-start-time" label="Start time" value={values.startTime} onChange={(time) => setField("startTime", time)} /><EventTimePicker id="event-end-time" label="End time" value={values.endTime} onChange={(time) => setField("endTime", time)} /></div>
                <div className="grid gap-5 sm:grid-cols-2"><Input id="event-client" label="Client or host" placeholder="e.g. Ada Okoye" optional value={values.clientName} onChange={(event) => setField("clientName", event.target.value)} /><Input id="event-guests" label="Expected guests" type="number" min="0" placeholder="e.g. 150" optional value={values.guestCount} onChange={(event) => setField("guestCount", event.target.value)} /></div>
                <CurrencyInput id="event-budget" label="Estimated budget" placeholder="0" value={formatGroupedDigits(values.budget)} onChange={(event) => setField("budget", event.target.value.replace(/[^0-9]/g, "").slice(0, 15))} />
                <Textarea id="event-description" label="A little about this event" placeholder="The vision, priorities, or anything worth remembering…" optional rows={3} value={values.description} onChange={(event) => setField("description", event.target.value)} />
                <CoverPicker value={values.image} onChange={(src) => setField("image", src)} />
              </div>
            )}

            {saveError && <p role="alert" className="mt-6 rounded-lg bg-error-soft px-4 py-3 text-xs text-error">{saveError} {credits < 1 && <Link href="/planner/credits" className="font-semibold underline">View credits</Link>}</p>}
            <div className="mt-8 flex flex-col-reverse gap-3 border-t border-border-subtle pt-6 sm:flex-row sm:items-center sm:justify-between">
              {step === 1 ? <Link href="/planner/events" className="inline-flex min-h-10 items-center justify-center px-3 text-sm font-semibold text-text-secondary hover:text-text-primary">Cancel</Link> : <Button type="button" variant="ghost" onClick={() => { setStep(1); setSaveError(""); }} leadingIcon={<ArrowLeft className="size-4" aria-hidden="true" />}>Back</Button>}
              <Button type="submit" disabled={saving || !ready || credits < 1} trailingIcon={step === 1 ? <ArrowRight className="size-4" aria-hidden="true" /> : <CircleCheck className="size-4" aria-hidden="true" />}>{step === 1 ? "Continue with 1 credit" : saving ? "Creating…" : "Create event"}</Button>
            </div>
          </form>
        </div>

        <aside className="overflow-hidden rounded-[1.25rem] border border-border-subtle bg-white lg:sticky lg:top-24" aria-label="Live event preview">
          <div className="relative h-44"><Image src={values.image} alt="Selected event cover" fill unoptimized={isCustomCover(values.image)} sizes="340px" className="object-cover" /><span className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" /><span className="absolute bottom-4 left-5 rounded-full border border-white/30 bg-white/15 px-2.5 py-1 text-[0.625rem] font-semibold text-white backdrop-blur-sm">Live preview</span></div>
          <div className="px-5 pb-4 pt-5"><p className="text-[0.625rem] font-bold uppercase tracking-[0.12em] text-brand-primary">Your event at a glance</p><h3 className={cn("mt-2 break-words text-lg font-semibold tracking-tight", !values.name && "text-text-tertiary")}>{values.name.trim() || "Your event name"}</h3><p className="mt-1 text-xs text-text-secondary">{values.type === "Other event" ? otherType.trim() || "Other event" : values.type || "Event type not selected"}</p>
            <div className="mt-4 divide-y divide-border-subtle border-y border-border-subtle">
              <PreviewRow icon={Clock3} label="Date" value={values.date ? formatEventDate(values.date) : "Not added yet"} />
              <PreviewRow icon={MapPin} label="Location" value={values.location.trim() || "Not added yet"} />
              <PreviewRow icon={Clock3} label="Start time" value={values.startTime || "Not added yet"} />
              <PreviewRow icon={Clock3} label="End time" value={values.endTime || "Not added yet"} />
              <PreviewRow icon={UserRound} label="Client or host" value={values.clientName.trim() || "Not added yet"} />
              <PreviewRow icon={UsersRound} label="Expected guests" value={values.guestCount ? Number(values.guestCount).toLocaleString("en-NG") : "Not added yet"} />
              <PreviewRow icon={Wallet} label="Estimated budget" value={values.budget ? formatNaira(Number(values.budget)) : "Not added yet"} />
            </div>
            <div className="pt-4"><p className="text-[0.625rem] font-semibold uppercase tracking-wide text-text-tertiary">About this event</p><p className={cn("mt-1 break-words text-xs leading-5", values.description.trim() ? "text-text-secondary" : "text-text-tertiary")}>{values.description.trim() || "Add a short description when you’re ready."}</p></div>
          </div>
          <div className="border-t border-[#e5ece6] bg-[#f3f7f3] px-5 py-3 text-[0.6875rem] text-[#526f5b]">This preview updates as you fill the form.</div>
        </aside>
      </div>
    </div>
  );
}
