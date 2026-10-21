"use client";

import { useEffect, useRef } from "react";
import { Plus, X } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PricingFields } from "./pricing-fields";
import { formatBudgetMoney } from "@/lib/planner-budget";
import type { PricedAs } from "@/lib/budget-pricing";

export type QuickBudgetDraft = { name: string; amount: string; notes: string; pricedAs?: PricedAs; quantity?: string };

export function BudgetQuickAdd({ groupName, currency, draft, error, onChange, onSave, onDetails }: { groupName: string; currency: string; draft?: QuickBudgetDraft; error?: string; onChange: (draft?: QuickBudgetDraft) => void; onSave: () => void; onDetails: () => void }) {
  const input = useRef<HTMLInputElement>(null);
  const active = Boolean(draft);
  useEffect(() => { if (active && input.current?.getClientRects().length) input.current.focus(); }, [active]);
  if (!draft) return <button type="button" onClick={() => onChange({ name: "", amount: "", notes: "" })} className="inline-flex min-h-8 items-center gap-1.5 text-xs font-semibold text-text-tertiary transition-colors hover:text-brand-primary focus-visible:outline-2 focus-visible:outline-brand-primary" aria-label={`Quick add item to ${groupName}`}><Plus className="size-4" aria-hidden="true" />Add item</button>;
  const total = (draft.pricedAs && draft.pricedAs !== "flat-fee" ? Number(draft.quantity ?? "1") : 1) * Number(draft.amount.replaceAll(",", ""));
  return <form aria-label={`Quick add to ${groupName}`} onSubmit={(event) => { event.preventDefault(); onSave(); }} className="space-y-3 py-1">
    <div className="space-y-3"><Input ref={input} label="Item name" required maxLength={120} placeholder="e.g. Reception florals" value={draft.name} onChange={(event) => onChange({ ...draft, name: event.target.value })} /><PricingFields pricedAs={draft.pricedAs ?? "flat-fee"} quantity={draft.quantity ?? "1"} price={draft.amount} currency={currency} onChange={(change) => onChange({ ...draft, ...(change.pricedAs ? { pricedAs: change.pricedAs } : {}), ...(change.quantity !== undefined ? { quantity: change.quantity } : {}), ...(change.price !== undefined ? { amount: change.price } : {}) })} /><p className="text-xs text-text-secondary">Item total <strong className="ml-2 tabular-nums text-text-primary">{formatBudgetMoney(Number.isFinite(total) ? Math.round(total * 100) / 100 : 0, currency)}</strong></p></div>
    <Input label="Description" optional maxLength={500} placeholder="A short note about this cost" value={draft.notes} onChange={(event) => onChange({ ...draft, notes: event.target.value })} />
    {error && <p role="alert" className="text-xs text-error">{error}</p>}
    <div className="flex flex-wrap items-center gap-3"><Button type="submit" size="sm" disabled={!draft.name.trim()} leadingIcon={<Plus className="size-3.5" aria-hidden="true" />}>Add item</Button><button type="button" onClick={onDetails} className="min-h-10 text-xs font-semibold text-brand-primary hover:underline">More details</button><button type="button" onClick={() => onChange()} className="ml-auto inline-flex min-h-10 items-center gap-1 text-xs text-text-secondary hover:text-text-primary"><X className="size-3.5" aria-hidden="true" />Cancel</button></div>
  </form>;
}
