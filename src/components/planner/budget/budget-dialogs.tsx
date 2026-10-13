"use client";

import { useState, type FormEvent } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Plus, X } from "@/components/ui/icons";

import { BudgetNativeSelect } from "@/components/planner/budget/budget-controls";
import { BudgetGroupIcon } from "@/components/planner/budget/budget-group-icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { PlannerEvent } from "@/lib/planner-events";
import { addBudgetGroups, budgetGroupNames, type BudgetGroup } from "@/lib/planner-budget";
import { cn } from "@/lib/utils/cn";

export function AddBudgetGroupDialog({ open, onOpenChange, events, targetEventId, currency, existing, onAdded }: { open: boolean; onOpenChange: (open: boolean) => void; events: readonly PlannerEvent[]; targetEventId: string | null; currency: string; existing: BudgetGroup[]; onAdded: (ids: string[]) => void }) {
  const [selected, setSelected] = useState<string[]>([]);
  const [custom, setCustom] = useState("");
  const [eventId, setEventId] = useState(targetEventId ?? "");
  const [error, setError] = useState("");
  const currentEventId = targetEventId ?? (eventId || null);
  const already = new Set(existing.filter((group) => group.eventId === currentEventId && group.currency === currency).map((group) => group.name.toLowerCase()));
  const available = budgetGroupNames.filter((name) => !already.has(name.toLowerCase()));
  const cleanCustom = custom.trim();
  const customAvailable = cleanCustom && !already.has(cleanCustom.toLowerCase()) && !selected.some((name) => name.toLowerCase() === cleanCustom.toLowerCase());

  function close(next: boolean) { if (!next) { setSelected([]); setCustom(""); setError(""); setEventId(targetEventId ?? ""); } onOpenChange(next); }
  function add(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (cleanCustom && !customAvailable) { setError("This group is already added or selected."); return; }
    const names = [...selected.filter((name) => !already.has(name.toLowerCase())), ...(customAvailable ? [cleanCustom] : [])];
    if (!names.length) return;
    const groups: BudgetGroup[] = names.map((name) => ({ id: crypto.randomUUID(), name, eventId: currentEventId, currency, createdAt: new Date().toISOString() }));
    try { addBudgetGroups(groups); onAdded(groups.map((group) => group.id)); close(false); }
    catch { setError("These groups couldn’t be saved in this browser. Please try again."); }
  }

  return <Dialog.Root open={open} onOpenChange={close}><Dialog.Portal><Dialog.Overlay className="fixed inset-0 z-50 bg-[#10231a]/50 backdrop-blur-[2px]" /><Dialog.Content className="fixed left-1/2 top-1/2 z-50 flex max-h-[min(90vh,760px)] w-[calc(100vw-2rem)] max-w-xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-xl bg-white shadow-[var(--shadow-lg)] focus:outline-none"><div className="flex items-start justify-between gap-3 border-b border-border-subtle px-5 py-4 sm:px-6"><div><Dialog.Title className="text-lg font-semibold tracking-tight">Add budget groups</Dialog.Title><Dialog.Description className="mt-1 text-xs leading-5 text-text-secondary">Choose the groups you need. You can add more later.</Dialog.Description></div><Dialog.Close asChild><button type="button" aria-label="Close dialog" className="flex size-8 shrink-0 items-center justify-center rounded-md text-text-tertiary hover:bg-background-subtle"><X className="size-4" /></button></Dialog.Close></div><form onSubmit={add} className="flex min-h-0 flex-1 flex-col"><div className="min-h-0 overflow-y-auto px-5 py-5 sm:px-6">
    {targetEventId === null && <label className="mb-5 block text-xs font-semibold">Budget for<BudgetNativeSelect value={eventId} onChange={(change) => { setEventId(change.target.value); setSelected([]); }} className="mt-2 font-normal"><option value="">General / no event</option>{events.map((entry) => <option key={entry.id} value={entry.id}>{entry.name}</option>)}</BudgetNativeSelect></label>}
    <div className="flex items-center justify-between gap-2"><p className="text-[0.6875rem] font-semibold uppercase tracking-wider text-text-tertiary">Suggested groups</p><button type="button" onClick={() => setSelected(selected.length === available.length ? [] : [...available])} className="text-xs font-semibold text-brand-primary hover:underline">{selected.length === available.length ? "Clear selection" : "Select all"}</button></div>
    <div className="mt-3 grid gap-2 sm:grid-cols-2">{budgetGroupNames.map((name) => { const disabled = already.has(name.toLowerCase()); const checked = selected.includes(name); return <label key={name} className={cn("flex min-h-12 items-center gap-2.5 rounded-lg border px-3 py-2 text-xs", disabled ? "border-border-subtle bg-[#f8f9f8] text-text-tertiary" : checked ? "border-[#9cb9a4] bg-[#f2f8f3] text-brand-primary" : "cursor-pointer border-border-subtle hover:border-border-strong")}><span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-[#f2f5f2]"><BudgetGroupIcon name={name} /></span><span className="min-w-0 flex-1">{name}</span>{disabled ? <span className="shrink-0 text-[0.625rem]">Already added</span> : <input type="checkbox" checked={checked} onChange={() => setSelected((current) => checked ? current.filter((item) => item !== name) : [...current, name])} className="accent-brand-primary" />}</label>; })}</div>
    <div className="mt-5 border-t border-border-subtle pt-5"><div className="flex items-end gap-2"><span className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-border-subtle bg-[#f7f8f7] text-text-secondary"><BudgetGroupIcon name="custom" /></span><Input label="Add your own" placeholder="Custom group name" value={custom} onChange={(change) => { setCustom(change.target.value); setError(""); }} /></div></div>{error && <p role="alert" className="mt-3 text-xs text-error">{error}</p>}
  </div><div className="flex justify-end gap-2 border-t border-border-subtle px-5 py-4 sm:px-6"><Button type="button" variant="outline" size="md" onClick={() => close(false)}>Cancel</Button><Button type="submit" size="md" disabled={!selected.length && !customAvailable} leadingIcon={<Plus className="size-4" />}>Add groups</Button></div></form></Dialog.Content></Dialog.Portal></Dialog.Root>;
}
