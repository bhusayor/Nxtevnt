"use client";

import { useRef, useState } from "react";
import { ChevronDown, Link2, Plus } from "@/components/ui/icons";
import { comparisonItemRows, comparisonRows, lineTotal, proposalRowDifference, proposalRowDiffers, proposalTotal, type BudgetProposal, type ComparisonColumn, type ComparisonRow } from "@/lib/budget-proposals";
import { pricingDescription } from "@/lib/budget-pricing";
import { formatBudgetMoney } from "@/lib/planner-budget";
import { cn } from "@/lib/utils/cn";
import { BudgetDifference, hasProposalItems, ProposalMenu, type ProposalActions } from "./proposal-shared";
import { proposalTheme } from "./proposal-appearance";

export function ProposalTable({ current, proposals, currency, target, actions, differencesOnly, onMatch, onAddItem, onAddGroup }: { current: ComparisonColumn; proposals: BudgetProposal[]; currency: string; target: number | null; actions: ProposalActions; differencesOnly: boolean; onMatch: (row: ComparisonRow, proposalId: string, groupId: string) => void; onAddItem: (columnId: string, row: ComparisonRow) => void; onAddGroup: () => void }) {
  const scrollAreas = useRef<(HTMLDivElement | null)[]>([]);
  const [collapsedDifferences, setCollapsedDifferences] = useState<Set<string>>(new Set());
  const columns = [current, ...proposals];
  const allRows = comparisonRows(columns);
  const filtering = differencesOnly && proposals.length > 1;
  const rows = filtering ? allRows.filter(proposalRowDiffers) : allRows;
  const sections = [{ name: "In every budget", description: "These groups have been added to the current budget and every proposal.", rows: rows.filter((row) => row.shared) }, { name: "Not in every budget", description: "These groups are missing from one or more budgets. Not added means no cost has been entered there—not that it is free.", rows: rows.filter((row) => !row.shared) }];
  const isOpen = (key: string) => !collapsedDifferences.has(key);
  const allExpanded = rows.length > 0 && rows.every((row) => isOpen(row.key));
  function toggle(key: string) {
    const open = isOpen(key);
    setCollapsedDifferences((previous) => { const next = new Set(previous); if (open) next.add(key); else next.delete(key); return next; });
  }
  return <div className="space-y-3">
    <div className="flex items-start justify-between gap-3"><div><h3 className="text-sm font-semibold">Compare category by category</h3><p className="mt-1 text-sm leading-5 text-text-secondary">{filtering ? "Only proposal differences are shown. Changed groups open automatically; the live budget remains a reference." : "Read across a row to compare the same cost. Groups open with item, pricing and vendor details; collapse them for a lighter overview."}</p></div><button type="button" disabled={!rows.length} onClick={() => { setCollapsedDifferences(allExpanded ? new Set(rows.map((row) => row.key)) : new Set()); }} className="min-h-9 shrink-0 text-sm font-semibold text-brand-primary hover:underline disabled:opacity-40">{allExpanded ? "Collapse all" : "Expand all"}</button></div>
    {sections.map((section, sectionIndex) => (sectionIndex === 0 || section.rows.length > 0) && <section key={section.name} aria-label={section.name} className="space-y-3 pt-2">
      <header><h4 className="text-sm font-semibold uppercase tracking-wide text-text-secondary">{section.name} <span className="ml-1 rounded-md bg-[#f3f3f3] px-1.5 py-0.5 text-xs tabular-nums text-text-tertiary">{section.rows.length}</span></h4><p className="mt-1 text-sm leading-5 text-text-tertiary">{section.description}</p></header>
      <div ref={(element) => { scrollAreas.current[sectionIndex] = element; }} onScroll={(event) => { const left = event.currentTarget.scrollLeft; scrollAreas.current.forEach((area) => { if (area && area !== event.currentTarget && area.scrollLeft !== left) area.scrollLeft = left; }); }} className="max-h-[75dvh] overflow-auto rounded-xl border border-border-subtle bg-white" tabIndex={0} role="region" aria-label={section.name + " comparison table"}>
        <table className="w-full table-fixed border-collapse text-left text-sm" style={{ minWidth: 220 + columns.length * 240 }}>
          <caption className="sr-only">{section.name}. Current budget and {proposals.length} proposals in {currency}. Add item changes only its selected column.</caption>
          <colgroup><col style={{ width: 220 }} />{columns.map((column) => <col key={column.id} style={{ width: 240 }} />)}</colgroup>
          <ComparisonColumns columns={columns} proposals={proposals} currency={currency} target={target} actions={actions} compact={sectionIndex > 0} />
          <tbody>{section.rows.map((row) => {
            const proposalIndex = row.cells.findIndex((cell, index) => index > 0 && cell !== null);
            const group = proposalIndex > 0 ? row.cells[proposalIndex]?.groups[0] : undefined;
            return <CategoryRows key={row.key} row={row} columns={columns} currency={currency} open={isOpen(row.key)} filtering={filtering} onToggle={() => toggle(row.key)} onAddItem={onAddItem} match={!row.shared && group && allRows.length > 1 ? () => onMatch(row, proposals[proposalIndex - 1].id, group.id) : undefined} />;
          })}{!section.rows.length && <tr><td colSpan={columns.length + 1} className="px-6 py-8 text-center text-sm leading-6 text-text-secondary">{filtering ? rows.length === 0 ? "Your proposals match. Turn off Differences only to see all budget groups." : "No shared groups have proposal differences. See the separate section below." : "No groups have been added to every budget yet. Groups missing from a budget are listed separately below."}</td></tr>}
          {sectionIndex === 0 && <tr className="border-t border-border-subtle"><td className="sticky left-0 z-10 bg-white px-4 py-3"><button type="button" onClick={onAddGroup} className="inline-flex min-h-9 items-center gap-1.5 whitespace-nowrap text-sm font-semibold text-brand-primary hover:underline"><Plus className="size-3.5" aria-hidden="true" />Add budget group</button></td><td colSpan={columns.length} className="px-4 py-3 text-xs text-text-tertiary">Choose the budget or proposal to add it to.</td></tr>}
          </tbody>
        </table>
      </div>
    </section>)}
    <p className="text-sm leading-5 text-text-tertiary">Scroll sideways on smaller screens. Groups with matching names line up automatically. Use Match category to align different names. Adding an item changes only the budget in its column.</p>
  </div>;
}

function ComparisonColumns({ columns, proposals, currency, target, actions, compact }: { columns: ComparisonColumn[]; proposals: BudgetProposal[]; currency: string; target: number | null; actions: ProposalActions; compact: boolean }) {
  return <thead className="sticky top-0 z-20 bg-white"><tr><th scope="col" className="sticky left-0 z-10 border-b border-border-subtle bg-white p-4 align-top"><p className="font-semibold">Budget groups & items</p>{!compact && <p className="mt-2 text-xs font-normal leading-5 text-text-tertiary">Read across to compare the same cost.</p>}</th>{columns.map((column, index) => <th key={column.id} scope="col" className="border-b border-l border-border-subtle bg-white p-4 align-top font-normal"><div className="flex items-start gap-2"><div className="min-w-0 flex-1"><p className="text-xs font-medium uppercase tracking-wider text-text-tertiary">{index === 0 ? "Live budget" : "Proposal " + String(index).padStart(2, "0")}</p><p className="mt-1 break-words font-semibold">{column.name}</p></div>{index > 0 && !compact && <ProposalMenu proposal={proposals[index - 1]} actions={actions} />}</div><p className={cn("mt-2 break-words font-semibold tabular-nums", compact ? "text-sm" : "text-lg")}>{hasProposalItems(column) ? formatBudgetMoney(proposalTotal(column), currency) : "Not priced yet"}</p>{!compact && <div className="mt-1">{hasProposalItems(column) && <BudgetDifference total={proposalTotal(column)} target={target} currency={currency} />}</div>}</th>)}</tr></thead>;
}

function CategoryRows({ row, columns, currency, open, filtering, onToggle, match, onAddItem }: { row: ComparisonRow; columns: ComparisonColumn[]; currency: string; open: boolean; filtering: boolean; onToggle: () => void; match?: () => void; onAddItem: (columnId: string, row: ComparisonRow) => void }) {
  const included = row.cells.flatMap((cell, index) => cell ? [columns[index].name] : []);
  const different = proposalRowDiffers(row);
  const itemRows = comparisonItemRows(row).filter((item) => !filtering || item.different);
  const maximum = Math.max(...row.cells.map((cell) => cell?.total ?? 0), 1);
  return <>
    <tr className="border-t border-border-subtle bg-white"><th scope="row" className="sticky left-0 z-10 bg-white p-4 align-top font-normal"><button type="button" aria-expanded={open} onClick={onToggle} className="flex min-h-8 items-start gap-2 text-left font-semibold"><ChevronDown className={cn("mt-0.5 size-3.5 shrink-0 transition-transform", !open && "-rotate-90")} aria-hidden="true" /><span className="break-words">{row.name}</span></button><p className="mt-1 text-sm leading-5 text-text-tertiary" title={"Added in " + included.join(", ")}>{row.shared ? "In every budget" : "Added in " + included.length + " of " + columns.length + " budgets"}</p>{columns.length > 2 && row.cells.slice(1).some(Boolean) && <span className={cn("mt-2 inline-block rounded-md px-2 py-1 text-xs font-medium", different ? "bg-[#fff1dd] text-[#88622e]" : "bg-[#f3f3f3] text-text-secondary")}>{proposalRowDifference(row)}</span>}{match && <button type="button" onClick={match} className="mt-2 inline-flex min-h-8 items-center gap-1 text-sm font-medium text-brand-primary hover:underline"><Link2 className="size-3" aria-hidden="true" />Match category</button>}</th>{row.cells.map((cell, index) => <td key={index} className={cn("border-l border-border-subtle p-4 align-top", filtering && index > 0 && different && "bg-[#fffbf3]")}>{cell ? <><p className="font-semibold tabular-nums">{cell.groups.some((group) => group.items.length) ? formatBudgetMoney(cell.total, currency) : "Not priced"}</p><div className="mt-2 h-1 overflow-hidden rounded-full bg-[#eeeeee]" aria-hidden="true"><span className="block h-full rounded-full bg-[#a3a3a3]" style={{ width: (cell.total / maximum * 100) + "%", backgroundColor: proposalTheme(index).accent }} /></div><p className="mt-2 text-xs text-text-tertiary">{cell.groups.reduce((sum, group) => sum + group.items.length, 0)} items</p></> : <><p className="text-xs text-text-tertiary">Not added</p><p className="mt-2 text-sm leading-5 text-text-tertiary">No cost planned here yet.</p></>}</td>)}</tr>
    {open && itemRows.map((itemRow) => <tr key={itemRow.key} className="border-t border-dashed border-border-subtle"><th scope="row" className="sticky left-0 z-10 bg-white px-4 py-4 align-top text-sm font-medium"><span className="block pl-5 break-words">{itemRow.name}</span>{filtering && <span className="mt-1 block pl-5 text-xs font-normal text-text-tertiary">Item differs</span>}</th>{itemRow.cells.map((items, index) => <td key={index} className="border-l border-border-subtle p-4 align-top">{items.length ? <div className="space-y-4">{items.map((item, itemIndex) => <div key={item.id + "-" + itemIndex}><p className="font-semibold tabular-nums">{formatBudgetMoney(lineTotal(item), currency)}</p><p className="mt-1 text-sm leading-5 text-text-tertiary">{pricingDescription(item, (value) => formatBudgetMoney(value, currency))}</p><p className="mt-1 break-words text-sm leading-5 text-text-secondary">{item.vendor || "Vendor not specified"}</p>{item.description && <p className="mt-1 break-words text-sm leading-5 text-text-secondary">{item.description}</p>}</div>)}</div> : <span className="text-xs text-text-tertiary">Not added</span>}</td>)}</tr>)}
    {open && !itemRows.length && <tr><td colSpan={columns.length + 1} className="border-t border-dashed border-border-subtle px-6 py-4 text-xs text-text-tertiary">{filtering ? "Category coverage differs; no differing items have been priced yet." : "No items added to this group yet."}</td></tr>}
    <tr className="border-t border-dashed border-border-subtle"><td className="sticky left-0 z-10 bg-white px-4 py-1.5"><span className="sr-only">Add an item to {row.name}</span></td>{columns.map((column) => <td key={column.id} className="border-l border-border-subtle px-4 py-1.5"><button type="button" aria-label={"Add item to " + row.name + " in " + column.name} onClick={() => onAddItem(column.id, row)} className="inline-flex min-h-8 items-center gap-1 text-sm font-medium text-brand-primary hover:underline"><Plus className="size-3" aria-hidden="true" />Add item</button></td>)}</tr>
  </>;
}
