"use client";

import { useRef, useState, type MouseEventHandler, type ReactNode } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Check, ClipboardCheck, Eye, UsersRound, Wallet, X, type PhosphorIcon } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { budgetTemplates, estimateBudget, milestoneDueDate, milestoneTemplates } from "@/lib/event-setup-templates";
import { formatEventDate, formatGroupedDigits, formatNaira, type NewPlannerEvent } from "@/lib/planner-events";
import { usePlannerTeam } from "@/lib/planner-team";
import { cn } from "@/lib/utils/cn";

type Field = "guestCount" | "budget" | "budgetTemplateId" | "targetBudget" | "milestoneTemplateId" | "assignedTeamMember" | "priority";
type Props = { values: NewPlannerEvent; onChange: (field: Field, value: string) => void; estimatedBudget: number | null };
type SampleKind = "budget" | "milestone";

const priorities = [
  { value: "high", label: "High", detail: "Shown first in your event lists.", dot: "bg-[#c98465]" },
  { value: "standard", label: "Standard", detail: "The everyday default for your events.", dot: "bg-[#779583]" },
  { value: "low", label: "Low", detail: "Shown after your higher-priority events.", dot: "bg-[#9aa6b6]" },
] as const;

export function AdvancedSection({ title, description, icon: Icon, action, children }: {
  title: string; description: string; icon: PhosphorIcon; action?: ReactNode; children: ReactNode;
}) {
  return (
    <section className="min-w-0 space-y-5 border-t border-border-subtle pt-7">
      <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#f0f4f1] text-brand-primary">
            <Icon className="size-[17px]" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
            <p className="mt-1 text-xs leading-5 text-text-secondary">{description}</p>
          </div>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function SampleButton({ onClick }: { onClick: MouseEventHandler<HTMLButtonElement> }) {
  return (
    <button type="button" onClick={onClick} className="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-lg px-2 text-xs font-semibold text-brand-primary transition-colors hover:bg-[#f0f5f1] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary">
      <Eye className="size-4" aria-hidden="true" />See samples
    </button>
  );
}

function AmountField({ label, value, onChange, helperText }: {
  label: string; value: string; onChange: (value: string) => void; helperText?: string;
}) {
  return <Input label={label} inputMode="numeric" placeholder="0" value={formatGroupedDigits(value)}
    onChange={(event) => onChange(event.target.value.replace(/\D/g, "").slice(0, 15))}
    helperText={helperText} className="tabular-nums" />;
}

export function CreateEventAdvanced({ values, onChange, estimatedBudget }: Props) {
  const [sampleKind, setSampleKind] = useState<SampleKind | null>(null);
  const [sampleId, setSampleId] = useState("");
  const sampleTrigger = useRef<HTMLButtonElement | null>(null);
  const teamMembers = usePlannerTeam();
  const budgetTemplate = budgetTemplates.find((template) => template.id === values.budgetTemplateId);
  const milestoneTemplate = milestoneTemplates.find((template) => template.id === values.milestoneTemplateId);
  const guests = Number(values.guestCount) || budgetTemplate?.baselineGuests || 0;
  const total = estimatedBudget ?? (values.budget ? Number(values.budget) : null);
  const target = Number(values.targetBudget || 0);
  const difference = total !== null && target > 0 ? total - target : null;
  const sampleBudget = budgetTemplates.find((template) => template.id === sampleId) ?? budgetTemplates[0];
  const sampleMilestone = milestoneTemplates.find((template) => template.id === sampleId) ?? milestoneTemplates[0];
  const sampleRows = estimateBudget(sampleBudget, sampleBudget.baselineGuests);
  const sampleTotal = sampleRows.reduce((sum, item) => sum + item.amount, 0);

  function openSamples(kind: SampleKind, trigger: HTMLButtonElement) {
    sampleTrigger.current = trigger;
    setSampleId(kind === "budget" ? values.budgetTemplateId || budgetTemplates[0].id : values.milestoneTemplateId || milestoneTemplates[0].id);
    setSampleKind(kind);
  }

  return <>
    <AdvancedSection title="Budget intelligence" description="Build a starting estimate for your event." icon={Wallet}
      action={<SampleButton onClick={(event) => openSamples("budget", event.currentTarget)} />}>
      <Select label="Budget template" options={[
        { label: "Start from scratch", value: "none" },
        ...budgetTemplates.map((template) => ({ label: template.name, value: template.id })),
      ]} value={values.budgetTemplateId || "none"} onValueChange={(value) => onChange("budgetTemplateId", value === "none" ? "" : value)} />
      <div className="grid items-start gap-5 @min-[520px]/event-form:grid-cols-2">
        <Input label="Guest count" inputMode="numeric" placeholder={String(budgetTemplate?.baselineGuests ?? 150)}
          helperText={budgetTemplate ? values.guestCount ? "Adjusts guest-dependent costs." : `Using ${budgetTemplate.baselineGuests} guests until you add a count.` : "How many people are you expecting?"}
          value={values.guestCount} onChange={(event) => {
            const digits = event.target.value.replace(/\D/g, "");
            onChange("guestCount", digits ? String(Math.min(100000, Number(digits))) : "");
          }} />
        <AmountField label="Client’s target budget (₦)" value={values.targetBudget ?? ""}
          onChange={(value) => onChange("targetBudget", value)} helperText="Optional · compare your estimate with their target." />
      </div>
      {!budgetTemplate && <AmountField label="Your estimated budget (₦)" value={values.budget}
        onChange={(value) => onChange("budget", value)} />}
      <div className="overflow-hidden rounded-xl border border-[#e0e9e2] bg-[#f4f8f4]" aria-live="polite">
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 @min-[520px]/event-form:p-5">
          <div>
            <p className="text-xs font-medium text-text-secondary">Estimated event budget</p>
            <p className="mt-2 break-all text-[1.6rem] font-semibold leading-tight tracking-[-0.035em] tabular-nums text-brand-primary">
              {total !== null ? formatNaira(total) : "—"}
            </p>
          </div>
          <div className="text-xs leading-5 text-text-secondary">
            {budgetTemplate ? <><p>{budgetTemplate.items.length} starting costs</p><p>{guests.toLocaleString("en-NG")} guests · NGN</p></>
              : <p>{total !== null ? "Your starting estimate · NGN" : "Choose a template or enter an estimate."}</p>}
          </div>
        </div>
        {difference !== null && <div className={cn("border-t px-4 py-3 text-xs font-medium @min-[520px]/event-form:px-5",
          difference > 0 ? "border-[#edddc9] bg-[#fbf4e9] text-[#916231]" : "border-[#e0e9e2] text-brand-primary")}>
          {difference === 0 ? "Right on the client’s target." : `${formatNaira(Math.abs(difference))} ${difference > 0 ? "over" : "under"} the client’s target`}
        </div>}
      </div>
    </AdvancedSection>

    <AdvancedSection title="Milestone template" description="Give your plan a head start with tasks timed to the event." icon={ClipboardCheck}
      action={<SampleButton onClick={(event) => openSamples("milestone", event.currentTarget)} />}>
      <Select label="Planning template" options={[
        { label: "Add tasks myself later", value: "none" },
        ...milestoneTemplates.map((template) => ({ label: template.name, value: template.id })),
      ]} value={values.milestoneTemplateId || "none"} onValueChange={(value) => onChange("milestoneTemplateId", value === "none" ? "" : value)} />
      {milestoneTemplate && <div className="flex items-start gap-2.5 rounded-lg bg-[#f7f5fa] px-4 py-3">
        <Check className="mt-0.5 size-4 shrink-0 text-[#756086]" aria-hidden="true" />
        <p className="text-xs leading-5 text-text-secondary"><span className="font-semibold text-text-primary">{milestoneTemplate.milestones.length} tasks ready to add.</span> Due dates are based on {values.date ? formatEventDate(values.date, { day: "numeric", month: "short", year: "numeric" }) : "your event date"}.</p>
      </div>}
    </AdvancedSection>

    <AdvancedSection title="Team & priority" description="Set the lead and choose where this event sits in your list." icon={UsersRound}>
      <div>
        <Select label="Assign a team member" options={[{ label: "No lead assigned yet", value: "unassigned" }, ...teamMembers.map((member) => ({ label: member.isOwner ? `${member.name} · You` : member.name, value: member.name }))]}
          value={values.assignedTeamMember || "unassigned"} onValueChange={(value) => onChange("assignedTeamMember", value === "unassigned" ? "" : value)} />
        <p className="mt-2 text-xs text-text-tertiary">{teamMembers.length === 1 ? "Only you are listed so far." : `${teamMembers.length} people available.`} <Link href="/planner/team" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 font-semibold text-brand-primary hover:underline">Manage team members<ArrowUpRight className="size-3" aria-hidden="true" /><span className="sr-only">(opens in a new tab)</span></Link></p>
      </div>
      <fieldset>
        <legend className="type-label text-text-primary">Event priority</legend>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {priorities.map((priority) => <label key={priority.value} className="min-w-0 cursor-pointer">
            <input type="radio" name="event-priority" value={priority.value} checked={(values.priority || "standard") === priority.value}
              onChange={() => onChange("priority", priority.value)} className="peer sr-only" />
            <span className="flex min-h-11 items-center justify-center gap-2 rounded-lg border border-border-subtle bg-white px-2 text-xs font-medium text-text-secondary transition-colors hover:border-border-strong peer-checked:border-brand-primary/55 peer-checked:bg-[#f0f5f1] peer-checked:font-semibold peer-checked:text-brand-primary peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand-primary">
              <span className={cn("size-1.5 shrink-0 rounded-full", priority.dot)} aria-hidden="true" />{priority.label}
            </span>
          </label>)}
        </div>
        <p className="mt-2 text-xs text-text-tertiary">{priorities.find((priority) => priority.value === (values.priority || "standard"))?.detail}</p>
      </fieldset>
    </AdvancedSection>

    <Dialog.Root open={sampleKind !== null} onOpenChange={(open) => { if (!open) setSampleKind(null); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-[#10231a]/45 backdrop-blur-[3px]" />
        <Dialog.Content onCloseAutoFocus={(event) => { event.preventDefault(); sampleTrigger.current?.focus(); }} className="fixed left-1/2 top-1/2 z-50 flex max-h-[min(90dvh,780px)] w-[calc(100vw-2rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl bg-white shadow-[var(--shadow-lg)] focus:outline-none">
          <div className="flex shrink-0 items-start justify-between gap-4 border-b border-border-subtle px-5 py-5 sm:px-7">
            <div>
              <Dialog.Title className="text-lg font-semibold tracking-tight">{sampleKind === "budget" ? "Find your starting budget" : "Choose your planning rhythm"}</Dialog.Title>
              <Dialog.Description className="mt-1 text-xs leading-5 text-text-secondary">{sampleKind === "budget" ? "Explore sample costs before choosing a template." : "Preview the tasks and dates that will shape your plan."}</Dialog.Description>
            </div>
            <Dialog.Close asChild><button type="button" aria-label="Close samples" className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#f5f6f5] text-text-secondary hover:bg-[#eaf0eb] focus-visible:outline-2 focus-visible:outline-brand-primary"><X className="size-4" /></button></Dialog.Close>
          </div>
          <div className="min-h-0 overflow-y-auto p-5 sm:p-7">
            <div className="flex gap-2 overflow-x-auto pb-2" role="group" aria-label="Sample templates">
              {(sampleKind === "budget" ? budgetTemplates : milestoneTemplates).map((template) => (
                <button key={template.id} type="button" onClick={() => setSampleId(template.id)} aria-pressed={sampleId === template.id}
                  className={cn("min-h-10 shrink-0 rounded-lg border px-3 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-brand-primary",
                    sampleId === template.id ? "border-brand-primary bg-brand-primary text-white" : "border-border-subtle text-text-secondary hover:bg-background-subtle")}>{template.name}</button>
              ))}
            </div>
            {sampleKind === "budget" ? <div className="mt-4">
              <div className="rounded-xl bg-[#f2f7f3] p-5">
                <p className="text-xs text-text-secondary">Sample estimate · {sampleBudget.baselineGuests} guests</p>
                <p className="mt-2 text-3xl font-semibold tracking-tight text-brand-primary">{formatNaira(sampleTotal)}</p>
                <p className="mt-2 text-xs leading-5 text-text-secondary">{sampleBudget.description}</p>
              </div>
              <div className="mt-5 flex justify-between gap-3 px-1 text-[0.625rem] font-semibold uppercase tracking-wider text-text-tertiary"><span>Starting costs</span><span>Estimate · NGN</span></div>
              <ul className="mt-2 divide-y divide-border-subtle">
                {sampleRows.map((item) => <li key={item.name} className="flex items-center justify-between gap-4 py-3.5 text-xs"><div className="min-w-0"><p className="font-medium text-text-primary">{item.name}</p><p className="mt-1 text-[0.6875rem] text-text-tertiary">{item.perGuest ? "Adjusts with guest count" : "Fixed starting cost"}</p></div><span className="shrink-0 font-semibold tabular-nums">{formatNaira(item.amount)}</span></li>)}
              </ul>
              <p className="mt-4 text-xs leading-5 text-text-tertiary">These sample estimates are a starting point. Update them as vendor quotes come in.</p>
            </div> : <div className="mt-4">
              <div className="rounded-xl bg-[#f5f2fa] p-5"><p className="text-sm font-semibold">{sampleMilestone.name}</p><p className="mt-1 text-xs leading-5 text-text-secondary">{sampleMilestone.description}</p><p className="mt-3 text-xs font-semibold text-[#756086]">{sampleMilestone.milestones.length} planning milestones</p></div>
              <ol className="mt-5">
                {sampleMilestone.milestones.map((milestone, index) => <li key={milestone.title} className="relative flex gap-3 pb-5 last:pb-0">
                  {index < sampleMilestone.milestones.length - 1 && <span className="absolute bottom-0 left-3 top-6 w-px bg-border-subtle" aria-hidden="true" />}
                  <span className="relative flex size-6 shrink-0 items-center justify-center rounded-full border border-border-subtle bg-white text-[0.625rem] font-semibold text-text-tertiary">{index + 1}</span>
                  <div className="min-w-0 pt-0.5"><p className="text-xs font-medium">{milestone.title}</p><p className="mt-1 text-[0.6875rem] text-text-tertiary">{milestone.daysBefore} days before{values.date ? ` · ${formatEventDate(milestoneDueDate(values.date, milestone.daysBefore), { day: "numeric", month: "short", year: "numeric" })}` : ""}</p></div>
                </li>)}
              </ol>
            </div>}
          </div>
          <div className="flex shrink-0 items-center justify-between gap-3 border-t border-border-subtle px-5 py-4 sm:px-7">
            <Dialog.Close asChild><Button type="button" variant="ghost" size="sm">Close</Button></Dialog.Close>
            <Button type="button" size="sm" trailingIcon={<ArrowRight className="size-4" aria-hidden="true" />} onClick={() => {
              onChange(sampleKind === "budget" ? "budgetTemplateId" : "milestoneTemplateId", sampleKind === "budget" ? sampleBudget.id : sampleMilestone.id);
              setSampleKind(null);
            }}>Use this template</Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  </>;
}
