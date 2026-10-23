"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Search, Check } from "@/components/ui/icons";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { BudgetGroupIcon } from "./budget-group-icon";
import { budgetTemplates } from "@/lib/event-setup-templates";
import { budgetTemplateSections, planBudgetTemplate } from "@/lib/budget-template-plan";
import { formatBudgetMoney, importBudgetData, type BudgetGroup, type BudgetItem } from "@/lib/planner-budget";
import { cn } from "@/lib/utils/cn";

export function BudgetTemplatePicker({ eventId, currency, guestCount, groups, items, onAdded, onClose }: { eventId: string | null; currency: string; guestCount?: string; groups: BudgetGroup[]; items: BudgetItem[]; onAdded: (ids: string[]) => void; onClose: () => void }) {
  const body = useRef<HTMLDivElement>(null);
  const preview = useRef<HTMLDivElement>(null);
  const [search, setSearch] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [estimates, setEstimates] = useState(false);
  const [guests, setGuests] = useState(guestCount || "");
  const [error, setError] = useState("");
  const template = budgetTemplates.find((entry) => entry.id === templateId);
  const visible = budgetTemplates.filter((entry) => `${entry.name} ${entry.description}`.toLowerCase().includes(search.trim().toLowerCase()));
  const sections = template ? budgetTemplateSections(template, eventId, currency, Number(guests), estimates, groups, items) : [];
  const chosen = sections.filter((section) => selected.includes(section.name));
  const newGroups = chosen.filter((section) => !section.groupId).length;
  const newItems = chosen.flatMap((section) => section.items).filter((item) => !item.alreadyAdded).length;
  function showPreview() {
    if (!body.current || !preview.current) return;
    const offset = preview.current.getBoundingClientRect().top - body.current.getBoundingClientRect().top;
    body.current.scrollTo({ top: body.current.scrollTop + offset - 16, behavior: "auto" });
  }
  useEffect(() => { if (templateId) showPreview(); }, [templateId]);
  function save(event: FormEvent) {
    event.preventDefault(); if (!template) return;
    try { const plan = planBudgetTemplate(template, selected, eventId, currency, Number(guests), estimates, groups, items); if (!plan.groups.length && !plan.items.length) throw new Error("These groups and starter items are already in this budget."); importBudgetData(plan.groups, plan.items); onAdded(plan.groupIds); onClose(); }
    catch (problem) { setError(problem instanceof Error ? problem.message : "This template couldn’t be added. Please try again."); }
  }
  return <form onSubmit={save} className="flex min-h-0 flex-1 flex-col"><div ref={body} className="min-h-0 space-y-5 overflow-y-auto px-5 py-5 sm:px-6">
    <div><div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-tertiary" aria-hidden="true" /><input aria-label="Search budget templates" type="search" placeholder="Search budget templates" value={search} onChange={(event) => setSearch(event.target.value)} className="h-10 w-full rounded-lg border border-border-default bg-white pl-9 pr-3 text-sm outline-none focus:border-brand-primary" /></div><p className="mt-2 text-xs leading-5 text-text-tertiary">Select a template to see its groups.</p><div role="radiogroup" aria-label="Budget template" className="mt-3 max-h-[min(50dvh,26rem)] space-y-2 overflow-y-auto pr-1">{visible.map((entry) => <label key={entry.id} className={cn("flex cursor-pointer items-center gap-3 rounded-xl border p-3", entry.id === templateId ? "border-brand-primary bg-[#fafafa]" : "border-border-subtle hover:border-border-strong")}><span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border-subtle bg-white"><BudgetGroupIcon name={entry.id === "corporate" ? "planning" : "decor"} /></span><span className="min-w-0 flex-1"><span className="block text-sm font-semibold">{entry.name}</span><span className="mt-1 block text-xs leading-5 text-text-tertiary">{entry.description}</span></span><input type="radio" name="budget-template" value={entry.id} checked={entry.id === templateId} onChange={() => { setTemplateId(entry.id); setSelected([...new Set(entry.items.map((item) => item.group))]); if (!guests) setGuests(String(entry.baselineGuests)); setError(""); }} className="accent-brand-primary" /></label>)}{!visible.length && <p className="py-5 text-center text-sm text-text-tertiary">No templates match your search.</p>}</div></div>
    {template && <div ref={preview} className="space-y-5"><div className="flex items-center justify-between gap-3"><h3 className="text-sm font-semibold">Template preview</h3><button type="button" onClick={() => body.current?.scrollTo({ top: 0, behavior: "auto" })} className="min-h-8 text-xs font-semibold text-brand-primary hover:underline">Change template</button></div><div className="rounded-xl border border-border-subtle p-4"><Switch label="Use template estimates" checked={estimates} disabled={currency !== "NGN"} onCheckedChange={(value) => { setEstimates(value); setError(""); }} className="[&_label]:text-sm" /><p className="mt-2 text-xs leading-5 text-text-tertiary">{currency !== "NGN" ? `Starter items will begin at 0 ${currency}. Template estimates are available in NGN only; no currency conversion is applied.` : estimates ? "Starting estimates adjust to your guest count. Review them before booking." : "Starter items begin at ₦0, ready for your own prices. Existing amounts are never replaced."}</p>{estimates && <div className="mt-3"><Input label="Guest count" required type="number" min="1" step="1" value={guests} onChange={(event) => setGuests(event.target.value)} /></div>}</div>
      <div><div className="flex items-center justify-between gap-3"><h3 className="text-sm font-semibold">{template.name} · Groups</h3><button type="button" onClick={() => setSelected(selected.length === sections.length ? [] : sections.map((section) => section.name))} className="min-h-8 text-xs font-semibold text-brand-primary hover:underline">{selected.length === sections.length ? "Clear selection" : "Select all"}</button></div><div className="mt-2 divide-y divide-border-subtle rounded-xl border border-border-subtle">{sections.map((section) => <label key={section.name} className="flex cursor-pointer items-start gap-3 p-3"><input type="checkbox" checked={selected.includes(section.name)} onChange={() => setSelected((previous) => previous.includes(section.name) ? previous.filter((name) => name !== section.name) : [...previous, section.name])} className="mt-1 accent-brand-primary" /><span className="min-w-0 flex-1"><span className="flex flex-wrap items-center gap-2 text-sm font-semibold">{section.name}{section.groupId && <span className="text-xs font-normal text-text-tertiary">Group exists</span>}</span>{section.items.map((item) => <span key={item.name} className="mt-1.5 flex items-start justify-between gap-3 text-xs leading-5 text-text-secondary"><span className="min-w-0">{item.name}</span><span className="shrink-0 tabular-nums">{item.alreadyAdded ? <span className="inline-flex items-center gap-1 text-text-tertiary"><Check className="size-3" aria-hidden="true" />Already added</span> : formatBudgetMoney(Number.isFinite(item.amount) ? item.amount : 0, currency)}</span></span>)}</span></label>)}</div></div></div>}
    {error && <p role="alert" className="text-sm leading-5 text-error">{error}</p>}
  </div><footer className="flex flex-wrap items-center justify-between gap-3 border-t border-border-subtle px-5 py-4 sm:px-6"><p className="text-xs text-text-tertiary">{template ? `${newGroups} new groups · ${newItems} new starter items` : "Choose a template to continue."}</p><div className="flex gap-2"><Button type="button" variant="outline" onClick={onClose}>Cancel</Button><Button type="submit" disabled={!selected.length || !newGroups && !newItems}>Add selection</Button></div></footer></form>;
}
