"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { ArrowRight, ChevronDown, Crown, X } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { estimateBudget } from "@/lib/event-setup-templates";
import { formatBudgetMoney } from "@/lib/planner-budget";
import { proposalStartingTemplates } from "@/lib/proposal-templates";
import { cn } from "@/lib/utils/cn";

type Props = {
  initialTemplateId: string;
  guestCount?: string;
  currency: string;
  onClose: () => void;
  onUse: (templateId: string) => void;
};

type StartingTemplateEntry = (typeof proposalStartingTemplates)[number];

function TemplatePickerSection({ entries, premium, selectedId, onSelect }: { entries: StartingTemplateEntry[]; premium: boolean; selectedId: string; onSelect: (id: string) => void }) {
  if (!entries.length) return null;
  const title = premium ? "Premium templates" : "Budget templates";
  return <section aria-label={title} className={cn(premium && "border-t border-[#eadfca] pt-4")}>
    <h3 className={cn("mb-2 flex items-center gap-1.5 px-2 text-[0.6875rem] font-bold uppercase tracking-wider", premium ? "text-[#876427]" : "text-text-tertiary")}>
      {premium && <Crown className="size-3.5" weight="fill" aria-hidden="true" />}{title}
    </h3>
    <div className={cn("space-y-1 rounded-xl p-1", premium ? "bg-[#fff9ed]" : "bg-[#f5f8f5]")}>
      {entries.map(({ template }) => {
        const selected = selectedId === template.id;
        return <button key={template.id} type="button" aria-pressed={selected} onClick={() => onSelect(template.id)} className={cn("flex min-h-11 w-full items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors focus-visible:outline-2 focus-visible:outline-brand-primary", selected ? "font-semibold" : "font-medium", premium ? selected ? "border-[#d7b86d] bg-[#fff0c5] text-[#674819]" : "border-transparent text-[#6f5930] hover:bg-[#ffedc9]" : selected ? "border-brand-primary bg-brand-primary text-white" : "border-transparent text-text-secondary hover:bg-white")}>
          {premium && <Crown className="size-3.5 shrink-0 text-[#a6792d]" weight="fill" aria-hidden="true" />}
          <span className="min-w-0">{template.name}</span>
        </button>;
      })}
    </div>
  </section>;
}

export function ProposalTemplateSamples({ initialTemplateId, guestCount, currency, onClose, onUse }: Props) {
  const [selectedId, setSelectedId] = useState(initialTemplateId || proposalStartingTemplates[0].template.id);
  const [search, setSearch] = useState("");
  const [expandedGroup, setExpandedGroup] = useState("");
  const visible = proposalStartingTemplates.filter(({ template }) => `${template.name} ${template.description}`.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()));
  const budgetTemplates = visible.filter((entry) => !entry.premium);
  const premiumTemplates = visible.filter((entry) => entry.premium);
  const selected = proposalStartingTemplates.find(({ template }) => template.id === selectedId);
  const template = selected?.template;
  const parsedGuests = Number(guestCount);
  const guests = template && Number.isSafeInteger(parsedGuests) && parsedGuests > 0 ? parsedGuests : template?.baselineGuests ?? 0;
  const rows = template ? estimateBudget(template, guests) : [];
  const groups = [...new Set(rows.map((item) => item.group))].map((name) => {
    const items = rows.filter((item) => item.group === name);
    return { name, items, amount: items.reduce((sum, item) => sum + item.amount, 0) };
  });
  const total = rows.reduce((sum, item) => sum + item.amount, 0);
  const selectedVisible = Boolean(template && visible.some(({ template: entry }) => entry.id === template.id));

  return <Dialog.Root open onOpenChange={(open) => { if (!open) onClose(); }}><Dialog.Portal>
    <Dialog.Overlay className="fixed inset-0 z-[60] bg-[#10231a]/55 backdrop-blur-[3px]" />
    <Dialog.Content className="fixed left-1/2 top-1/2 z-[61] flex max-h-[min(90dvh,780px)] w-[calc(100vw-2rem)] max-w-3xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl bg-white shadow-[var(--shadow-lg)] focus:outline-none">
      <header className="flex shrink-0 items-start justify-between gap-4 border-b border-border-subtle px-5 py-5 sm:px-7"><div><Dialog.Title className="text-lg font-semibold tracking-tight">Find your starting budget</Dialog.Title><Dialog.Description className="mt-1 text-sm leading-5 text-text-secondary">Explore costs before choosing a proposal template.</Dialog.Description></div><Dialog.Close asChild><button type="button" aria-label="Close template samples" className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#f5f6f5] text-text-secondary hover:bg-[#eaf0eb] focus-visible:outline-2 focus-visible:outline-brand-primary"><X className="size-4" aria-hidden="true" /></button></Dialog.Close></header>
      <div className="grid min-h-0 gap-5 overflow-y-auto p-5 sm:grid-cols-[230px_minmax(0,1fr)] sm:p-7">
        <div className="min-w-0">
          <Input label="Search templates" placeholder="Find a template…" value={search} onChange={(event) => setSearch(event.target.value)} />
          <div className="mt-4 space-y-5 pr-1" aria-label="Proposal templates">
            <TemplatePickerSection entries={budgetTemplates} premium={false} selectedId={selectedId} onSelect={(id) => { setSelectedId(id); setExpandedGroup(""); }} />
            <TemplatePickerSection entries={premiumTemplates} premium selectedId={selectedId} onSelect={(id) => { setSelectedId(id); setExpandedGroup(""); }} />
            {!visible.length && <p className="px-2 py-4 text-sm text-text-secondary">No matching templates.</p>}
          </div>
        </div>
        <div className="min-w-0">{template && selectedVisible ? <><div className="rounded-xl bg-[#f2f7f3] p-5"><p className="text-sm text-text-secondary">Starting estimate · {guests.toLocaleString("en-NG")} guests · NGN</p><p className="mt-2 text-2xl font-semibold tracking-tight tabular-nums text-brand-primary">{formatBudgetMoney(total, "NGN")}</p><p className="mt-2 text-sm leading-5 text-text-secondary">{template.description}</p></div><div className="mt-5 flex justify-between gap-3 px-1 text-xs font-semibold uppercase tracking-wider text-text-tertiary"><span>Starting costs</span><span>Estimate · NGN</span></div><ul className="mt-2 divide-y divide-border-subtle">{groups.map((group, index) => { const expanded = expandedGroup === group.name; const panelId = `proposal-sample-${template.id}-${index}`; return <li key={group.name}><button id={`${panelId}-trigger`} type="button" aria-expanded={expanded} aria-controls={panelId} onClick={() => setExpandedGroup(expanded ? "" : group.name)} className="flex min-h-16 w-full items-center justify-between gap-3 rounded-lg px-1 py-3 text-left hover:bg-background-subtle focus-visible:outline-2 focus-visible:outline-brand-primary"><span className="min-w-0"><span className="block text-sm font-semibold text-text-primary">{group.name}</span><span className="mt-1 block text-xs text-text-tertiary">{group.items.length} {group.items.length === 1 ? "item" : "items"}</span></span><span className="flex shrink-0 items-center gap-2"><span className="text-sm font-semibold tabular-nums">{formatBudgetMoney(group.amount, "NGN")}</span><ChevronDown className={cn("size-4 text-text-tertiary transition-transform", expanded && "rotate-180")} aria-hidden="true" /></span></button><div id={panelId} role="region" aria-labelledby={`${panelId}-trigger`} hidden={!expanded} className="mb-3 ml-4 mr-5"><ul className="divide-y divide-border-subtle/60">{group.items.map((item) => <li key={item.name} className="py-2.5"><div className="flex items-start justify-between gap-3 text-sm text-text-secondary"><span className="min-w-0">{item.name}</span><span className="shrink-0 tabular-nums">{formatBudgetMoney(item.amount, "NGN")}</span></div><p className="mt-1 text-xs leading-5 text-text-tertiary">{item.perGuest ? `${item.base ? `${formatBudgetMoney(item.base, "NGN")} base + ` : ""}${formatBudgetMoney(item.perGuest, "NGN")} × ${guests.toLocaleString("en-NG")} guests` : "Flat fee"}</p></li>)}</ul></div></li>; })}</ul><p className="mt-4 text-xs leading-5 text-text-tertiary">{currency === "NGN" ? "These are starting estimates. Review them before sharing the proposal." : `These estimates are in NGN. In your ${currency} proposal, items begin at zero for you to price.`}</p></> : <p className="rounded-xl border border-dashed border-border-subtle px-5 py-10 text-center text-sm text-text-secondary">Select a matching template to preview its costs.</p>}</div>
      </div>
      <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-border-subtle px-5 py-4 sm:px-7"><Dialog.Close asChild><Button type="button" variant="ghost" size="sm">Close</Button></Dialog.Close><Button type="button" size="sm" disabled={!selectedVisible} trailingIcon={<ArrowRight className="size-4" aria-hidden="true" />} onClick={() => { if (template) onUse(template.id); }}>Use this template</Button></footer>
    </Dialog.Content>
  </Dialog.Portal></Dialog.Root>;
}
