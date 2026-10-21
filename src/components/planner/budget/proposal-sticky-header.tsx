"use client";

import type { ComparisonColumn } from "@/lib/budget-proposals";
import { proposalTotal } from "@/lib/budget-proposals";
import { formatBudgetMoney } from "@/lib/planner-budget";
import { hasProposalItems } from "./proposal-shared";

export function ProposalStickyHeader({ columns, currency, visible }: { columns: ComparisonColumn[]; currency: string; visible: boolean }) {
  // Zero layout height: appearing/disappearing must not move the categories.
  return <div className="pointer-events-none sticky top-16 z-20 h-0" data-comparison-sticky={visible ? "visible" : "hidden"}>
    {visible && <div role="region" aria-label="Comparing current budget and proposals" className="pointer-events-auto absolute inset-x-0 top-0 overflow-x-auto rounded-xl border border-border-subtle bg-white shadow-[0_4px_16px_rgba(0,0,0,0.08)]"><div className="grid min-w-[560px] grid-cols-4 divide-x divide-border-subtle">{columns.map((column, index) => <div key={column.id} className="min-w-0 px-3 py-2.5"><p className="truncate text-[0.6875rem] font-semibold" title={column.name}>{column.name}</p><p className="mt-1 text-xs font-semibold tabular-nums">{hasProposalItems(column) ? formatBudgetMoney(proposalTotal(column), currency) : "Not priced yet"}</p><span className="sr-only">{index === 0 ? "Current budget" : `Proposal ${index}`}</span></div>)}</div></div>}
  </div>;
}
