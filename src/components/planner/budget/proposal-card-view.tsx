"use client";

import { useScrolledPast } from "@/lib/use-scrolled-past";
import { ProposalStickyHeader } from "./proposal-sticky-header";
import { Check, Pencil, Plus, Wallet } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { comparisonRows, proposalRowDifference, proposalRowDiffers, proposalTotal, type BudgetProposal, type ComparisonColumn } from "@/lib/budget-proposals";
import { formatBudgetMoney } from "@/lib/planner-budget";
import { BudgetDifference, hasProposalItems, ProposalMenu, type ProposalActions } from "./proposal-shared";
import { cn } from "@/lib/utils/cn";

export function ProposalCards({ current, proposals, currency, target, actions, onCreate, slots, differencesOnly = false, onOpenBudget }: { current: ComparisonColumn; proposals: BudgetProposal[]; currency: string; target: number | null; actions: ProposalActions; onCreate: () => void; slots: number; differencesOnly?: boolean; onOpenBudget: () => void }) {
  const cardHeader = useScrolledPast<HTMLElement>();
  const columns = [current, ...proposals];
  const allRows = comparisonRows(columns);
  const visible = differencesOnly ? allRows.filter(proposalRowDiffers) : allRows;
  const rows = [...visible.filter((row) => row.shared), ...visible.filter((row) => !row.shared)];
  return <section aria-label="Budget and proposal cards" className="space-y-3">
    <ProposalStickyHeader columns={columns} currency={currency} visible={cardHeader.passed} />
    <div><h3 className="text-sm font-semibold">Compare your budgets side by side</h3><p className="mt-1 text-xs leading-5 text-text-secondary">The current budget sits beside your proposals. Every card lists the same categories, in the same order.</p></div>
    <div className="grid items-stretch gap-2 sm:grid-cols-2 xl:grid-cols-4">{columns.map((column, index) => {
      const proposal = index > 0 ? proposals[index - 1] : null;
      const priced = hasProposalItems(column);
      const total = proposalTotal(column);
      const missing = allRows.filter((row) => !row.cells[index]).length;
      return <article key={column.id} aria-label={column.name + " category coverage"} className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-border-subtle bg-white">
        <header ref={index === 0 ? cardHeader.ref : undefined} className="p-4"><div className="flex min-h-14 items-start gap-1"><div className="min-w-0 flex-1"><p className="text-[0.625rem] font-semibold uppercase tracking-wider text-text-tertiary">{proposal ? "Proposal " + String(index).padStart(2, "0") : "Live budget"}</p><h3 title={column.name} className="mt-1.5 line-clamp-2 break-words text-sm font-semibold leading-5">{column.name}</h3></div>{proposal ? <ProposalMenu proposal={proposal} actions={actions} /> : <Wallet className="mt-0.5 size-4 shrink-0 text-brand-primary" aria-hidden="true" />}</div><div className="mt-2 flex min-h-6 flex-wrap items-center gap-2"><span className="rounded-md bg-[#edf1ef] px-2 py-1 text-[0.625rem] font-medium text-text-secondary">{proposal ? proposal.status === "ready" ? "Ready for review" : "Draft" : "Current plan"}</span><span className="text-[0.625rem] text-text-tertiary">{allRows.filter((row) => row.cells[index]).length} groups</span></div><div className="mt-3 min-h-12"><p className="break-words text-xl font-semibold tracking-tight tabular-nums xl:text-lg 2xl:text-xl">{priced ? formatBudgetMoney(total, currency) : "Not priced yet"}</p>{priced && <BudgetDifference total={total} target={target} currency={currency} />}</div><p title={proposal?.description} className="h-10 line-clamp-2 text-[0.6875rem] leading-5 text-text-secondary">{proposal ? proposal.description || "An alternative plan for this event." : "Your live planned costs. Proposals do not change these costs."}</p><p className="mt-2 text-[0.625rem] text-text-tertiary">{missing ? missing + (missing === 1 ? " group not added" : " groups not added") : "All comparison groups added"}</p></header>
        <div className="border-y border-border-subtle bg-[#f7f9f8] px-4 py-2.5 text-[0.625rem] font-semibold uppercase tracking-wider text-text-tertiary">{differencesOnly ? "Groups with proposal differences" : "Category coverage"}</div>
        <dl className="divide-y divide-border-subtle">{rows.map((row) => {
          const cell = row.cells[index];
          const present = row.cells.filter(Boolean).length;
          const note = present === columns.length ? "In every budget" : cell && present === 1 ? "Only in this budget" : "In " + present + " of " + columns.length + " budgets";
          return <div key={row.key} className={cn("flex min-h-24 flex-col px-4 py-3", !cell && "bg-[#fcfcfc]")}><dt className="flex min-h-5 items-start gap-2"><span className={cn("mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full", cell ? "bg-[#e8f2eb] text-[#4b785c]" : "border border-dashed border-[#cbd2cd] text-text-tertiary")}>{cell ? <Check className="size-2.5" aria-hidden="true" /> : <span aria-hidden="true">−</span>}</span><span title={row.name} className="line-clamp-2 break-words text-xs font-medium leading-5">{row.name}</span></dt><dd className="mt-1 pl-6 text-sm font-semibold tabular-nums">{cell ? cell.groups.some((group) => group.items.length) ? formatBudgetMoney(cell.total, currency) : "Not priced" : <span className="text-xs font-normal text-text-tertiary">Not added</span>}</dd><p className={cn("mt-1 pl-6 text-[0.625rem] leading-5", cell && present === 1 ? "font-medium text-[#986c35]" : "text-text-tertiary")}>{note}</p>{differencesOnly && <p className="pl-6 text-[0.625rem] leading-5 text-text-secondary">{proposalRowDifference(row)}</p>}</div>;
        })}</dl>
        {!rows.length && <p className="px-4 py-8 text-xs leading-6 text-text-tertiary">{differencesOnly ? "No differences between your proposals." : "No groups added yet."}</p>}
        <footer className="mt-auto border-t border-border-subtle p-4"><Button type="button" size="sm" variant="outline" leadingIcon={<Pencil className="size-3.5" aria-hidden="true" />} onClick={() => proposal ? actions.onEdit(proposal) : onOpenBudget()}>{proposal ? "Edit proposal" : "Open budget"}</Button></footer>
      </article>;
    })}{Array.from({ length: slots }, (_, index) => <button key={index} type="button" onClick={onCreate} className="flex min-h-56 flex-col items-center justify-center rounded-2xl border border-dashed border-[#d8e1dc] bg-[#fafcfb] p-5 text-center transition-colors hover:border-brand-primary focus-visible:outline-2 focus-visible:outline-brand-primary"><Plus className="size-6 text-brand-primary" aria-hidden="true" /><span className="mt-3 text-sm font-semibold">Create a proposal</span><span className="mt-2 text-xs leading-5 text-text-secondary">Add another direction to compare.</span></button>)}</div>
  </section>;
}
