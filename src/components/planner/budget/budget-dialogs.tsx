"use client";

import { useState, type FormEvent } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { FileSpreadsheet, Plus, X } from "@/components/ui/icons";
import { BudgetNativeSelect } from "./budget-controls";
import { BudgetGroupIcon } from "./budget-group-icon";
import { BudgetTemplatePicker } from "./budget-template-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { PlannerEvent } from "@/lib/planner-events";
import { addBudgetGroups, budgetGroupNames, type BudgetGroup, type BudgetItem } from "@/lib/planner-budget";
import { budgetNameKey } from "@/lib/budget-template-plan";
import { cn } from "@/lib/utils/cn";

export function AddBudgetGroupDialog({ open, onOpenChange, events, targetEventId, currency, existing, existingItems, onAdded }: { open: boolean; onOpenChange: (open: boolean) => void; events: readonly PlannerEvent[]; targetEventId: string | null; currency: string; existing: BudgetGroup[]; existingItems: BudgetItem[]; onAdded: (ids: string[]) => void }) {
  const [mode, setMode] = useState<"template" | "groups">("template");
  const [selected, setSelected] = useState<string[]>([]);
  const [custom, setCustom] = useState("");
  const [eventId, setEventId] = useState(targetEventId ?? "");
  const [error, setError] = useState("");
  const currentEventId = targetEventId ?? (eventId || null);
  const event = events.find((entry) => entry.id === currentEventId);
  const already = new Set(existing.filter((group) => group.eventId === currentEventId && group.currency === currency).map((group) => budgetNameKey(group.name)));
  const available = budgetGroupNames.filter((name) => !already.has(budgetNameKey(name)));
  const cleanCustom = custom.trim();
  const customAvailable = Boolean(cleanCustom && !already.has(budgetNameKey(cleanCustom)) && !selected.some((name) => budgetNameKey(name) === budgetNameKey(cleanCustom)));
  function close(next: boolean) { if (!next) { setMode("template"); setSelected([]); setCustom(""); setError(""); setEventId(targetEventId ?? ""); } onOpenChange(next); }
  function add(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (cleanCustom.length > 100) { setError("Keep group names to 100 characters or fewer."); return; }
    if (cleanCustom && !customAvailable) { setError("This group is already added or selected."); return; }
    const names = [...selected.filter((name) => !already.has(budgetNameKey(name))), ...(customAvailable ? [cleanCustom] : [])];
    if (!names.length) return;
    const groups: BudgetGroup[] = names.map((name) => ({ id: crypto.randomUUID(), name, eventId: currentEventId, currency, createdAt: new Date().toISOString() }));
    try { addBudgetGroups(groups); onAdded(groups.map((group) => group.id)); close(false); }
    catch { setError("These groups couldn’t be saved in this browser. Please try again."); }
  }
  return <Dialog.Root open={open} onOpenChange={close}><Dialog.Portal><Dialog.Overlay className="fixed inset-0 z-50 bg-[#10231a]/50 backdrop-blur-[2px]" /><Dialog.Content className="fixed left-1/2 top-1/2 z-50 flex max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl bg-white shadow-[var(--shadow-lg)] focus:outline-none">
    <header className="flex items-start justify-between gap-3 border-b border-border-subtle px-5 py-4 sm:px-6"><div><Dialog.Title className="text-lg font-semibold tracking-tight">Add budget groups</Dialog.Title><Dialog.Description className="mt-1 text-sm leading-5 text-text-secondary">Use a template for a head start, or choose your own groups.</Dialog.Description></div><Dialog.Close asChild><button type="button" aria-label="Close dialog" className="flex size-9 shrink-0 items-center justify-center rounded-lg text-text-tertiary hover:bg-background-subtle"><X className="size-4" aria-hidden="true" /></button></Dialog.Close></header>
    <div className="space-y-4 px-5 pt-4 sm:px-6"><div className="flex items-center justify-between gap-3 rounded-xl border border-border-subtle bg-[#fafafa] px-3 py-3"><div className="min-w-0 flex-1">{targetEventId === null ? <label className="block text-xs font-medium text-text-tertiary">Budget for<BudgetNativeSelect value={eventId} onChange={(change) => { setEventId(change.target.value); setSelected([]); setCustom(""); setError(""); }} className="mt-1 text-sm font-semibold"><option value="">General / no event</option>{events.map((entry) => <option key={entry.id} value={entry.id}>{entry.name}</option>)}</BudgetNativeSelect></label> : <><p className="text-xs text-text-tertiary">Adding to</p><p className="mt-1 break-words text-sm font-semibold">{event?.name ?? "This event"}</p></>}</div><span className="rounded-md border border-border-subtle bg-white px-2 py-1 text-xs font-semibold text-text-secondary">{currency}</span></div><div role="tablist" aria-label="How to add budget groups" className="flex gap-1 rounded-lg bg-[#f4f4f4] p-1">{[{ id: "template", label: "Pick from a template", icon: FileSpreadsheet }, { id: "groups", label: "Choose groups", icon: Plus }].map((tab) => <button key={tab.id} type="button" role="tab" id={"add-budget-" + tab.id} aria-selected={mode === tab.id} aria-controls={"add-budget-" + tab.id + "-panel"} onClick={() => { setMode(tab.id as typeof mode); setError(""); }} className={cn("flex min-h-10 flex-1 items-center justify-center gap-2 rounded-md px-2 text-sm font-semibold", mode === tab.id ? "bg-white text-text-primary shadow-sm" : "text-text-secondary hover:text-text-primary")}><tab.icon className="size-3.5 shrink-0" aria-hidden="true" />{tab.label}</button>)}</div></div>
    {mode === "template" ? <div role="tabpanel" id="add-budget-template-panel" aria-labelledby="add-budget-template" className="flex min-h-0 flex-1 flex-col"><BudgetTemplatePicker key={String(currentEventId) + currency} eventId={currentEventId} currency={currency} guestCount={event?.guestCount} groups={existing} items={existingItems} onAdded={onAdded} onClose={() => close(false)} /></div> : <form onSubmit={add} role="tabpanel" id="add-budget-groups-panel" aria-labelledby="add-budget-groups" className="flex min-h-0 flex-1 flex-col"><div className="min-h-0 space-y-4 overflow-y-auto px-5 py-5 sm:px-6"><div className="flex items-center justify-between gap-2"><p className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">Suggested groups</p><button type="button" onClick={() => setSelected(selected.length === available.length ? [] : [...available])} className="min-h-8 text-sm font-semibold text-brand-primary hover:underline">{selected.length === available.length ? "Clear selection" : "Select all"}</button></div><div className="grid gap-2 sm:grid-cols-2">{budgetGroupNames.map((name) => { const disabled = already.has(budgetNameKey(name)); const checked = selected.includes(name); return <label key={name} className={cn("flex min-h-12 items-center gap-2.5 rounded-lg border px-3 py-2 text-sm", disabled ? "border-border-subtle bg-[#fafafa] text-text-tertiary" : checked ? "border-brand-primary bg-white text-brand-primary" : "cursor-pointer border-border-subtle hover:border-border-strong")}><span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-[#f5f5f5]"><BudgetGroupIcon name={name} /></span><span className="min-w-0 flex-1">{name}</span>{disabled ? <span className="shrink-0 text-xs">Already added</span> : <input type="checkbox" checked={checked} onChange={() => setSelected((current) => checked ? current.filter((item) => item !== name) : [...current, name])} className="accent-brand-primary" />}</label>; })}</div><div className="border-t border-border-subtle pt-4"><Input label="Add your own group" maxLength={100} placeholder="e.g. Guest gifting" value={custom} onChange={(change) => { setCustom(change.target.value); setError(""); }} /></div><p className="text-xs leading-5 text-text-tertiary">This adds empty groups. Choose a template if you also want starter items.</p>{error && <p role="alert" className="text-sm text-error">{error}</p>}</div><footer className="flex justify-end gap-2 border-t border-border-subtle px-5 py-4 sm:px-6"><Button type="button" variant="outline" onClick={() => close(false)}>Cancel</Button><Button type="submit" disabled={!selected.length && !customAvailable}>Add groups</Button></footer></form>}
  </Dialog.Content></Dialog.Portal></Dialog.Root>;
}
