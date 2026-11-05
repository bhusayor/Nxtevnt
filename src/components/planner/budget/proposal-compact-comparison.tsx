"use client";

import { Fragment, useState, type FormEvent } from "react";
import { ChevronDown, Pencil, Plus } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { EventTierChip } from "@/components/planner/event-tier-chip";
import { comparisonRows, compactComparisonRowDiffers, lineTotal, proposalTotal, type BudgetProposal, type ComparisonColumn, type ComparisonRow } from "@/lib/budget-proposals";
import { formatBudgetMoney } from "@/lib/planner-budget";
import { cn } from "@/lib/utils/cn";
import { ProposalMenu, type ProposalActions } from "./proposal-shared";
import { proposalTheme } from "./proposal-appearance";

type Props = {
  current: ComparisonColumn;
  proposals: BudgetProposal[];
  currency: string;
  target: number | null;
  invoiced: number;
  differencesOnly: boolean;
  actions: ProposalActions;
  eventId: string;
  eventName: string;
  tier?: "standard" | "premium";
  onOpenProposal: (id: string) => void;
  onCreate: () => void;
  onAddItem: (row: ComparisonRow, proposalId: string | null) => void;
  onSaveTarget: (amount: number) => string | null;
};

function difference(total: number, target: number | null, currency: string) {
  if (target === null) return "Set client budget";
  const amount = Math.round((target - total) * 100) / 100;
  if (amount === 0) return "On target";
  return (amount < 0 ? "Over by " : "Under by ") + formatBudgetMoney(Math.abs(amount), currency);
}

function differenceTone(total: number, target: number | null) {
  if (target === null || total === target) return "text-text-secondary";
  return total > target ? "text-[#b43e49]" : "text-[#16865b]";
}

export function ProposalCompactComparison({ current, proposals, currency, target, invoiced, differencesOnly, actions, eventId, eventName, tier, onOpenProposal, onCreate, onAddItem, onSaveTarget }: Props) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [editingTarget, setEditingTarget] = useState(false);
  const [targetValue, setTargetValue] = useState("");
  const [targetError, setTargetError] = useState("");
  const columns = [current, ...proposals];
  const rows = comparisonRows(columns).filter((row) => !differencesOnly || compactComparisonRowDiffers(row));
  const allExpanded = rows.length > 0 && rows.every((row) => expanded.has(row.key));

  function saveTarget(event: FormEvent) {
    event.preventDefault();
    const amount = Number(targetValue.replaceAll(",", ""));
    if (!Number.isSafeInteger(amount) || amount <= 0) { setTargetError("Enter a client budget above zero."); return; }
    const error = onSaveTarget(amount);
    if (error) setTargetError(error);
    else { setTargetError(""); setEditingTarget(false); }
  }
  function toggle(key: string) {
    setExpanded((previous) => {
      const next = new Set(previous);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  return <section aria-label="Proposal comparison" className="space-y-3">
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border-subtle bg-white px-4 py-3">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="font-medium text-text-secondary">Client budget</span>
        {editingTarget ? <form onSubmit={saveTarget} className="flex flex-wrap items-center gap-2"><input autoFocus aria-label="Client budget amount" inputMode="numeric" value={targetValue} onChange={(event) => { setTargetValue(event.target.value.replace(/[^\d]/g, "").slice(0, 15).replace(/\B(?=(\d{3})+(?!\d))/g, ",")); setTargetError(""); }} className="h-9 w-36 rounded-lg border border-border-default px-2 text-sm font-semibold tabular-nums outline-none focus:border-brand-primary" placeholder="Amount" /><Button type="submit" size="sm">Save</Button><button type="button" onClick={() => { setEditingTarget(false); setTargetError(""); }} className="text-sm text-text-secondary hover:underline">Cancel</button></form> : <><strong className="font-semibold tabular-nums">{target === null ? "Not set" : formatBudgetMoney(target, currency)}</strong><button type="button" aria-label={target === null ? "Set client budget" : "Edit client budget"} onClick={() => { setTargetValue(target === null ? "" : target.toLocaleString("en-NG")); setEditingTarget(true); }} className="inline-flex size-8 items-center justify-center rounded-lg text-brand-primary hover:bg-background-subtle"><Pencil className="size-4" aria-hidden="true" /></button></>}
      </div>
      <button type="button" disabled={!rows.length} onClick={() => setExpanded(allExpanded ? new Set() : new Set(rows.map((row) => row.key)))} className="min-h-9 text-sm font-semibold text-brand-primary hover:underline disabled:opacity-40">{allExpanded ? "Collapse all" : "Expand all"}</button>
      {targetError && <p role="alert" className="w-full text-xs text-error">{targetError}</p>}
    </div>

    <div className="overflow-x-auto rounded-xl border border-border-subtle bg-white">
      <table className="w-full table-fixed border-collapse text-left text-sm" style={{ minWidth: 1150 }}>
        <caption className="sr-only">Budget groups, current budget and three proposal slots in {currency}</caption>
        <colgroup><col style={{ width: "20%" }} />{[0, 1, 2, 3].map((index) => <col key={index} style={{ width: "20%" }} />)}</colgroup>
        <thead><tr>
          <th scope="col" className="border-b border-border-subtle bg-[#fafbf9] p-3 align-top text-xs font-semibold uppercase tracking-wide text-text-secondary">Budget groups</th>
          <th scope="col" className="border-b border-l border-r border-border-subtle bg-[#fafbf9] p-3 align-top"><div className="flex min-h-10 items-start"><p className="font-semibold">Current budget</p></div><p className="mt-1 text-lg font-semibold tabular-nums">{formatBudgetMoney(proposalTotal(current), currency)}</p><p className="mt-1 text-xs font-medium text-text-secondary">Invoiced so far {formatBudgetMoney(invoiced, currency)}</p><p className={cn("mt-1 text-xs font-semibold", differenceTone(proposalTotal(current), target))}>{difference(proposalTotal(current), target, currency)}</p><span className="mt-2 inline-flex rounded-full bg-[#eaf3ed] px-2 py-0.5 text-xs font-semibold text-brand-primary">Live with client</span></th>
          {[0, 1, 2].map((index) => {
            const proposal = proposals[index];
            const slot = index + 1;
            const locked = tier !== "premium" && slot > 1;
            if (!proposal) return <th key={slot} scope="col" className="p-2 align-top">
              {locked ? <div className="flex min-h-28 flex-col items-center justify-center rounded-lg border border-[#eadbb8] bg-[#fffaf0] px-2 py-2 text-center">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#8b672d]">Proposal {String(slot).padStart(2, "0")} · Premium</p>
                <p className="mt-1 text-xs font-normal text-text-secondary">More options with Premium</p>
                <div className="mt-1.5"><EventTierChip mode="comparison-slot" slotNumber={slot} eventId={eventId} eventName={eventName} tier={tier} /></div>
              </div> : <button type="button" onClick={onCreate} disabled={!actions.canCreate} className="flex min-h-28 w-full flex-col items-center justify-center rounded-lg border border-dashed border-border-default bg-white px-2 py-2 text-center transition-colors hover:border-brand-primary hover:bg-[#f8fbf8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary disabled:opacity-50">
                <span className="flex size-7 items-center justify-center rounded-lg bg-[#edf4ef] text-brand-primary"><Plus className="size-3.5" aria-hidden="true" /></span>
                <span className="mt-1.5 text-xs font-semibold uppercase tracking-wide text-text-tertiary">Proposal {String(slot).padStart(2, "0")}</span>
                <strong className="mt-0.5 text-sm font-semibold text-brand-primary">Create a proposal</strong>
              </button>}
            </th>;
            const theme = proposalTheme(slot);
            return <th key={proposal.id} scope="col" className="border-b border-l border-r border-border-subtle p-3 align-top" style={{ backgroundImage: `linear-gradient(135deg, ${theme.soft} 0%, #ffffff 88%)` }}>
              <div className="flex min-h-10 items-start justify-between gap-1">
                <button type="button" onClick={() => onOpenProposal(proposal.id)} className="min-w-0 truncate text-left font-semibold hover:underline" style={{ color: theme.ink }} title={proposal.name}>{proposal.name}</button>
                <ProposalMenu proposal={proposal} actions={actions} />
              </div>
              <p className="mt-1 text-lg font-semibold tabular-nums">{formatBudgetMoney(proposalTotal(proposal), currency)}</p><p className="mt-1 text-xs font-medium text-text-secondary">Estimate</p><p className={cn("mt-1 text-xs font-semibold", differenceTone(proposalTotal(proposal), target))}>{difference(proposalTotal(proposal), target, currency)}</p><span className={cn("mt-2 inline-flex rounded-full px-2 py-0.5 text-xs font-semibold", proposal.sharedAt ? "bg-[#eaf2fa] text-[#416a91]" : "bg-[#f2f3f2] text-text-secondary")}>{proposal.sharedAt ? "Shared with client" : "Draft"}</span>{proposal.chosenAt && <span className="ml-1 text-xs font-semibold text-[#916c25]">Chosen</span>}
            </th>;
          })}
        </tr></thead>
        <tbody>
          {rows.map((row, rowIndex) => {
            const open = expanded.has(row.key);
            const live = row.cells[0]?.total ?? 0;
            const lastRow = rowIndex === rows.length - 1;
            return <Fragment key={row.key}>
              <tr>
                <th scope="row" className={cn("border-t border-border-subtle p-3 font-semibold", lastRow && !open && "border-b")}><button type="button" aria-expanded={open} onClick={() => toggle(row.key)} className="flex w-full items-center gap-2 text-left"><ChevronDown className={cn("size-4 shrink-0 text-text-tertiary transition-transform", !open && "-rotate-90")} aria-hidden="true" />{row.name}</button></th>
                {[0, 1, 2, 3].map((index) => {
                  const column = columns[index];
                  if (!column) return <td key={index} className="p-3" />;
                  const cell = row.cells[index];
                  const amount = cell?.total ?? 0;
                  const total = proposalTotal(column);
                  const delta = Math.round((amount - live) * 100) / 100;
                  return <td key={index} className={cn("border-t border-l border-r border-border-subtle p-3 align-top", lastRow && !open && "border-b")}><span className="font-semibold tabular-nums">{cell ? formatBudgetMoney(amount, currency) : "—"}</span>{cell && <span className="ml-2 text-xs text-text-tertiary">{total > 0 ? Math.round(amount / total * 100) : 0}%</span>}{index > 0 && delta !== 0 && <span className={cn("mt-1 inline-flex rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums", delta > 0 ? "bg-[#fcecee] text-[#b43e49]" : "bg-[#e8f7ef] text-[#16865b]")} title={delta > 0 ? "Above current budget" : "Below current budget"}>{(delta > 0 ? "+" : "−") + formatBudgetMoney(Math.abs(delta), currency)}</span>}</td>;
                })}
              </tr>
              {open && <tr className="text-xs">
                <td aria-label={row.name + " items"} className={cn("border-t border-border-subtle bg-[#fcfdfc] px-3 py-2", lastRow && "border-b")} />
                {[0, 1, 2, 3].map((index) => {
                  const column = columns[index];
                  if (!column) return <td key={index} className="px-3 py-2" />;
                  const items = (row.cells[index]?.groups ?? []).flatMap((group) => group.items).sort((a, b) => lineTotal(b) - lineTotal(a));
                  return <td key={column.id} className={cn("border-t border-l border-r border-border-subtle bg-[#fcfdfc] px-3 py-2 align-top", lastRow && "border-b")}>
                    <button type="button" onClick={() => onAddItem(row, index === 0 ? null : proposals[index - 1].id)} className="inline-flex min-h-8 items-center gap-1 font-semibold text-brand-primary hover:underline"><Plus className="size-3" aria-hidden="true" />Add item</button>
                    {items.map((item) => <div key={item.id} className="flex items-start justify-between gap-2 py-1.5 text-text-secondary"><span className="min-w-0 break-words">{item.name}</span><strong className="shrink-0 font-semibold tabular-nums text-text-primary">{formatBudgetMoney(lineTotal(item), currency)}</strong></div>)}
                  </td>;
                })}
              </tr>}
            </Fragment>;
          })}
          {!rows.length && <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-text-secondary">{differencesOnly ? "No differences to show." : "Add budget groups or create a proposal to start comparing."}</td></tr>}
        </tbody>
      </table>
    </div>
  </section>;
}
