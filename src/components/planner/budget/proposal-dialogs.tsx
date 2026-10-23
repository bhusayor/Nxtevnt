"use client";

import { useState, type FormEvent } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Search, X } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { BudgetAmountInput, formatBudgetAmountInput } from "./budget-amount-input";
import { cn } from "@/lib/utils/cn";

function DialogClose() { return <Dialog.Close asChild><button type="button" aria-label="Close dialog" className="flex size-10 shrink-0 items-center justify-center rounded-lg text-text-tertiary hover:bg-background-subtle"><X className="size-5" aria-hidden="true" /></button></Dialog.Close>; }
const overlay = "fixed inset-0 z-50 bg-[#10231a]/50 backdrop-blur-[2px]";
const content = "fixed left-1/2 top-1/2 z-50 max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl bg-white p-5 shadow-[var(--shadow-lg)] focus:outline-none sm:p-6";

export function ClientBudgetDialog({ target, currency, onClose, onSave }: { target: number | null; currency: string; onClose: () => void; onSave: (target: number | null) => void }) {
  const [amount, setAmount] = useState(target === null ? "" : formatBudgetAmountInput(String(target)));
  const [error, setError] = useState("");
  function save(event: FormEvent) { event.preventDefault(); const value = Number(amount.replaceAll(",", "")); try { if (amount.trim() && (!Number.isFinite(value) || value <= 0)) throw new Error("Enter a target greater than zero, or leave it blank to clear the target."); onSave(amount.trim() ? value : null); onClose(); } catch (problem) { setError(problem instanceof Error ? problem.message : "The target couldn’t be saved."); } }
  return <Dialog.Root open onOpenChange={(open) => { if (!open) onClose(); }}><Dialog.Portal><Dialog.Overlay className={overlay} /><Dialog.Content className={content}><div className="flex items-start justify-between gap-3"><div><Dialog.Title className="text-lg font-semibold">Client’s target budget</Dialog.Title><Dialog.Description className="mt-2 text-sm leading-5 text-text-secondary">The same target is used to compare every option in {currency}. Your event estimate won’t change.</Dialog.Description></div><DialogClose /></div><form onSubmit={save} className="mt-5 space-y-4"><BudgetAmountInput label={`Target amount (${currency})`} value={amount} onChange={setAmount} /><p className="text-xs leading-5 text-text-tertiary">Leave blank if the client hasn’t set a target yet.</p>{error && <p role="alert" className="text-sm text-error">{error}</p>}<div className="flex justify-end gap-2 border-t border-border-subtle pt-4"><Button type="button" variant="outline" onClick={onClose}>Cancel</Button><Button type="submit">Save target</Button></div></form></Dialog.Content></Dialog.Portal></Dialog.Root>;
}

export function MatchCategoryDialog({ category, choices, onClose, onSave }: { category: string; choices: { key: string; name: string }[]; onClose: () => void; onSave: (key: string, label: string) => void }) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState("");
  const [error, setError] = useState("");
  const visible = choices.filter((entry) => entry.name.toLocaleLowerCase().includes(search.toLocaleLowerCase()));
  const choice = choices.find((entry) => entry.key === selected);
  return <Dialog.Root open onOpenChange={(open) => { if (!open) onClose(); }}><Dialog.Portal><Dialog.Overlay className={overlay} /><Dialog.Content className={content}><div className="flex items-start justify-between gap-3"><div><Dialog.Title className="text-lg font-semibold">Line up this category</Dialog.Title><Dialog.Description className="mt-2 text-sm leading-5 text-text-secondary">Compare “{category}” alongside an existing category. Its items, name and costs are preserved.</Dialog.Description></div><DialogClose /></div><div className="relative mt-5"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-tertiary" aria-hidden="true" /><input type="search" aria-label="Search comparison categories" placeholder="Search categories" value={search} onChange={(event) => setSearch(event.target.value)} className="h-11 w-full rounded-lg border border-border-default pl-9 pr-3 text-sm outline-none focus:border-brand-primary" /></div><div role="radiogroup" aria-label="Compare alongside" className="mt-3 max-h-64 space-y-2 overflow-y-auto">{visible.map((entry) => <label key={entry.key} className={cn("flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm", entry.key === selected ? "border-brand-primary bg-[#f1f7f3]" : "border-border-subtle hover:bg-[#fafafa]")}><input type="radio" name="comparison-category" value={entry.key} checked={selected === entry.key} onChange={() => setSelected(entry.key)} className="accent-brand-primary" /><span className="break-words font-medium">{entry.name}</span></label>)}{!visible.length && <p className="py-6 text-center text-sm text-text-tertiary">No matching categories.</p>}</div>{error && <p role="alert" className="mt-4 text-sm text-error">{error}</p>}<div className="mt-5 flex justify-end gap-2 border-t border-border-subtle pt-4"><Button type="button" variant="outline" onClick={onClose}>Cancel</Button><Button type="button" disabled={!choice} onClick={() => { if (!choice) return; try { onSave(choice.key, choice.name); onClose(); } catch (problem) { setError(problem instanceof Error ? problem.message : "This category couldn’t be matched."); } }}>Match category</Button></div></Dialog.Content></Dialog.Portal></Dialog.Root>;
}
