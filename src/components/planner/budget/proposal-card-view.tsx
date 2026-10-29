"use client";

import { useId, useState } from "react";
import { useScrolledPast } from "@/lib/use-scrolled-past";
import { ProposalStickyHeader } from "./proposal-sticky-header";
import { ChevronDown, Pencil, FileText, Plus, Wallet } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { EventTierChip } from "@/components/planner/event-tier-chip";
import { BudgetGroupIcon } from "./budget-group-icon";
import { comparisonItemRows, comparisonRows, lineTotal, proposalRowDifference, proposalRowDiffers, proposalTotal, type BudgetProposal, type ComparisonColumn } from "@/lib/budget-proposals";
import { pricingDescription } from "@/lib/budget-pricing";
import { formatBudgetMoney } from "@/lib/planner-budget";
import { BudgetDifference, hasProposalItems, ProposalMenu, type ProposalActions } from "./proposal-shared";
import { proposalGridClass, proposalTheme } from "./proposal-appearance";
import { cn } from "@/lib/utils/cn";

export function ProposalCards({ current, proposals, currency, target, actions, differencesOnly = false, onOpenBudget, onCreate, eventId, eventName, tier }: { current: ComparisonColumn; proposals: BudgetProposal[]; currency: string; target: number | null; actions: ProposalActions; differencesOnly?: boolean; onOpenBudget: () => void; onCreate?: () => void; eventId?: string; eventName?: string; tier?: "standard" | "premium" }) {
  const cardHeader = useScrolledPast<HTMLElement>();
  const id = useId();
  // Collapse choices are shared across cards, so matching categories stay aligned.
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const columns = [current, ...proposals];
  const allRows = comparisonRows(columns);
  const visible = differencesOnly ? allRows.filter(proposalRowDiffers) : allRows;
  const rows = [...visible.filter((row) => row.shared), ...visible.filter((row) => !row.shared)];
  const allExpanded = rows.length > 0 && rows.every((row) => !collapsed.has(row.key));
  const toggle = (key: string) => setCollapsed((previous) => { const next = new Set(previous); if (next.has(key)) next.delete(key); else next.add(key); return next; });

  return <section aria-label="Budget and proposal cards" className="space-y-4">
    <ProposalStickyHeader columns={columns} currency={currency} visible={cardHeader.passed} />
    <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="text-lg font-semibold">Find the right feel for your event</h3><p className="mt-1 max-w-2xl text-sm leading-6 text-text-secondary">Explore the choices side by side. Categories and priced items open below, with your current budget as the reference.</p></div><button type="button" disabled={!rows.length} onClick={() => setCollapsed(allExpanded ? new Set(rows.map((row) => row.key)) : new Set())} className="min-h-10 shrink-0 text-sm font-semibold text-brand-primary hover:underline disabled:opacity-40">{allExpanded ? "Collapse all groups" : "Expand all groups"}</button></div>
    <div className={cn("grid items-stretch gap-4", proposalGridClass(eventId ? 4 : columns.length))}>{columns.map((column, index) => {
      const proposal = index > 0 ? proposals[index - 1] : null;
      const theme = proposalTheme(index);
      const priced = hasProposalItems(column);
      const total = proposalTotal(column);
      const missing = allRows.filter((row) => !row.cells[index]).length;
      const Icon = proposal ? FileText : Wallet;
      return <article key={column.id} aria-label={column.name + " category coverage"} className="flex min-w-0 flex-col overflow-hidden rounded-2xl border bg-white border-border-subtle shadow-[0_3px_16px_-8px_rgba(30,48,38,.14)]">
        <header ref={index === 0 ? cardHeader.ref : undefined} className="p-5" style={{ background: `linear-gradient(135deg, ${theme.soft}, #ffffff)` }}>
          <div className="flex min-h-10 items-center gap-3"><span className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-border-subtle bg-white text-text-secondary"><Icon className="size-5" aria-hidden="true" /></span><p className="min-w-0 flex-1 text-xs font-semibold uppercase tracking-[.12em] text-text-tertiary">{proposal ? "Proposal " + String(index).padStart(2, "0") : "Live budget"}</p>{proposal && <ProposalMenu proposal={proposal} actions={actions} />}</div>
          <h3 title={column.name} className="mt-2 h-7 truncate text-lg font-semibold leading-7">{column.name}</h3>
          <div className="mt-2 flex min-h-6 flex-wrap items-center gap-2"><span className="rounded-full border border-border-subtle bg-white px-2.5 py-1 text-xs font-semibold text-text-secondary">{proposal ? proposal.status === "ready" ? "Ready for review" : "Draft" : "Current plan"}</span><span className="text-xs text-text-secondary">{allRows.filter((row) => row.cells[index]).length} {allRows.filter((row) => row.cells[index]).length === 1 ? "group" : "groups"}</span></div>
          <div className="mt-3 min-h-16"><p className="break-words text-2xl font-semibold tracking-tight tabular-nums text-text-primary">{priced ? formatBudgetMoney(total, currency) : "Not priced yet"}</p><div className="mt-1.5">{priced && <BudgetDifference total={total} target={target} currency={currency} />}</div></div>
          <p title={proposal?.description} className="h-10 line-clamp-2 text-sm leading-5 text-text-secondary">{proposal ? proposal.description || "A different direction for the same event." : "Your live plan. Explore alternatives without changing these costs."}</p>
          <p className="mt-2 text-xs text-text-tertiary">{missing ? missing + (missing === 1 ? " group not added" : " groups not added") : "All comparison groups added"}</p>
        </header>
        <div className="border-y border-border-subtle px-5 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: theme.ink }}>{differencesOnly ? "What’s different" : "The details behind this option"}</div>
        <div className="divide-y divide-border-subtle">{rows.map((row, rowIndex) => {
          const cell = row.cells[index];
          const present = row.cells.filter(Boolean).length;
          const note = present === columns.length ? "In every budget" : cell && present === 1 ? "Only in this budget" : "In " + present + " of " + columns.length + " budgets";
          const open = !collapsed.has(row.key);
          const items = comparisonItemRows(row).filter((item) => !differencesOnly || item.different);
          const percentage = total > 0 && cell ? Math.max(0, Math.min(100, Math.round(cell.total / total * 100))) : 0;
          const panelId = `${id}-${index}-${rowIndex}`;
          return <section key={row.key} aria-label={`${row.name} in ${column.name}`}>
            <button type="button" aria-expanded={open} aria-controls={panelId} onClick={() => toggle(row.key)} className="block h-44 w-full px-5 py-4 text-left transition-colors hover:bg-background-subtle">
              <span className="flex items-start gap-2.5"><span className="flex size-8 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: theme.soft, color: theme.ink }}><BudgetGroupIcon name={row.name} /></span><span className="min-w-0 flex-1"><span title={row.name} className="block min-h-10 line-clamp-2 break-words text-sm font-semibold leading-5">{row.name}</span><span className="mt-1 block break-words text-base font-semibold tabular-nums">{cell ? cell.groups.some((group) => group.items.length) ? formatBudgetMoney(cell.total, currency) : "Not priced" : "Not added"}</span></span><ChevronDown className={cn("mt-1 size-4 shrink-0 text-text-tertiary transition-transform", !open && "-rotate-90")} aria-hidden="true" /></span>
              <span className="mt-3 block h-1 overflow-hidden rounded-full bg-[#edf0ee]" aria-hidden="true"><span className="block h-full rounded-full" style={{ width: `${percentage}%`, backgroundColor: theme.accent }} /></span>
              <span className="mt-2 block h-10 line-clamp-2 text-xs leading-5 text-text-tertiary">{cell && total > 0 ? `${percentage}% of this budget · ` : ""}{note}</span>
            </button>
            {differencesOnly && <p className="px-5 pb-3 text-xs font-medium text-[#896125]">{proposalRowDifference(row)}</p>}
            {open && <div id={panelId} className="border-t border-dashed border-border-subtle bg-white"><ul className="divide-y divide-dashed divide-border-subtle">{items.map((itemRow) => <li key={itemRow.key} className="px-5 py-3" style={{ minHeight: Math.max(1, ...itemRow.cells.map((entries) => entries.length)) * 112 + 24 }}>
              {itemRow.cells[index].length ? itemRow.cells[index].map((item, itemIndex) => <div key={item.id + itemIndex} className="h-28 space-y-1"><p title={item.name} className="h-5 truncate text-sm font-medium leading-5">{item.name}</p><p className="break-words text-sm font-semibold tabular-nums" style={{ color: theme.ink }}>{formatBudgetMoney(lineTotal(item), currency)}</p><p title={pricingDescription(item, (value) => formatBudgetMoney(value, currency))} className="truncate text-xs leading-5 text-text-secondary">{pricingDescription(item, (value) => formatBudgetMoney(value, currency))}</p><p title={item.vendor} className="truncate text-xs leading-5 text-text-tertiary">{item.vendor || "Vendor not specified"}</p></div>) : <div className="space-y-2 text-sm leading-5 text-text-tertiary"><p title={itemRow.name} className="line-clamp-2 break-words">{itemRow.name}</p><p>Not added here</p></div>}
            </li>)}</ul>{!items.length && <p className="min-h-20 px-5 py-4 text-sm leading-6 text-text-tertiary">{differencesOnly ? "No differing priced items in this group." : "No priced items in this group yet."}</p>}</div>}
          </section>;
        })}</div>
        {!rows.length && <p className="px-5 py-8 text-sm leading-6 text-text-tertiary">{differencesOnly ? "Your proposals match. Turn off Differences only to explore all the groups." : "Start with the costs that matter to this event."}</p>}
        <footer className="mt-auto border-t border-border-subtle p-5"><Button type="button" variant="outline" className="w-full" leadingIcon={<Pencil className="size-4" aria-hidden="true" />} onClick={() => proposal ? actions.onEdit(proposal) : onOpenBudget()}>{proposal ? "Edit proposal" : "Open budget"}</Button></footer>
      </article>;
    })}
    {eventId && onCreate && Array.from({ length: Math.max(0, 3 - proposals.length) }, (_, index) => {
      const slot = proposals.length + index + 1;
      if (tier !== "premium" && slot > 1) return <EventTierChip key={`slot-${slot}`} mode="locked-slot" slotNumber={slot} eventId={eventId} eventName={eventName || "this event"} tier={tier} />;
      const content = <><span className="flex size-11 items-center justify-center rounded-xl bg-[#eef4f0] text-brand-primary"><Plus className="size-5" aria-hidden="true" /></span><span className="mt-4 text-xs font-semibold uppercase tracking-wide text-text-tertiary">Proposal {String(slot).padStart(2, "0")}</span><span className="mt-2 text-sm font-semibold text-text-primary">{actions.canCreate ? "Create a proposal" : "Proposal in another currency"}</span><span className="mt-1 text-xs leading-5 text-text-secondary">{actions.canCreate ? "Explore another direction for your event." : "Change the currency above to view it."}</span>{actions.canCreate && <span className="mt-4 inline-flex min-h-8 items-center gap-1.5 rounded-lg border border-border-default px-3 text-xs font-semibold text-brand-primary"><Plus className="size-3.5" aria-hidden="true" />Create proposal</span>}</>;
      const className = "flex min-h-64 min-w-0 self-start flex-col items-center justify-center rounded-2xl border border-dashed border-border-default bg-white px-5 py-7 text-center";
      return actions.canCreate ? <button key={`slot-${slot}`} type="button" aria-label={`Create proposal ${String(slot).padStart(2, "0")}`} onClick={onCreate} className={cn(className, "transition-colors hover:border-brand-primary hover:bg-[#f7faf7] focus-visible:outline-2 focus-visible:outline-brand-primary")}>{content}</button> : <article key={`slot-${slot}`} aria-label={`Proposal ${String(slot).padStart(2, "0")} in another currency`} className={className}>{content}</article>;
    })}</div>
  </section>;
}
