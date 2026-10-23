"use client";

import { Pencil } from "@/components/ui/icons";
import { formatBudgetMoney } from "@/lib/planner-budget";

export { ProposalCards } from "./proposal-card-view";
export { ProposalTable } from "./proposal-table-view";
export { BudgetDifference, proposalColors, type ProposalActions } from "./proposal-shared";

export function ClientTargetControl({ target, currency, targetCurrency, canEditTarget, onEditTarget }: { target: number | null; currency: string; targetCurrency: string; canEditTarget: boolean; onEditTarget: () => void }) {
  return <section aria-label="Client target budget" className="flex flex-wrap items-center justify-between gap-x-5 gap-y-2 rounded-xl border border-border-subtle bg-white px-4 py-3">
    <div className="flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-1"><h3 className="text-sm font-medium text-text-secondary">Client’s target budget</h3><p className="break-words text-base font-semibold tabular-nums">{target !== null ? formatBudgetMoney(target, currency) : canEditTarget ? "Not set" : "Available in " + targetCurrency}</p><p className="text-xs text-text-tertiary">{canEditTarget ? "Used to compare each proposal." : "Switch to " + targetCurrency + " to edit and compare the target."}</p></div>
    {canEditTarget && <button type="button" onClick={onEditTarget} className="inline-flex min-h-9 shrink-0 items-center gap-1.5 text-sm font-semibold text-brand-primary hover:underline focus-visible:outline-2 focus-visible:outline-brand-primary"><Pencil className="size-3.5" aria-hidden="true" />{target === null ? "Set target" : "Edit target"}</button>}
  </section>;
}
