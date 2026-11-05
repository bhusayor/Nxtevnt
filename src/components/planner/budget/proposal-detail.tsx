"use client";

import { useState } from "react";
import { ChevronDown, Pencil, Plus } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { itemPricing } from "@/lib/budget-pricing";
import { groupTotal, lineTotal, proposalTotal, type BudgetProposal, type ProposalLine } from "@/lib/budget-proposals";
import { formatBudgetMoney } from "@/lib/planner-budget";
import { cn } from "@/lib/utils/cn";
import { ProposalMenu, type ProposalActions } from "./proposal-shared";

type Props = {
  proposal: BudgetProposal;
  currency: string;
  target: number | null;
  actions: ProposalActions;
  onAddGroup: () => void;
  onAddItem: (groupId: string) => void;
  onEditItem: (groupId: string, item: ProposalLine) => void;
  onRenameGroup: (groupId: string, name: string) => string | null;
  onMakeDefault: () => void;
};

export function ProposalDetail({ proposal, currency, target, actions, onAddGroup, onAddItem, onEditItem, onRenameGroup, onMakeDefault }: Props) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [editingGroup, setEditingGroup] = useState<string | null>(null);
  const [groupName, setGroupName] = useState("");
  const [groupError, setGroupError] = useState("");
  const total = proposalTotal(proposal);
  const variance = target === null ? null : Math.round((target - total) * 100) / 100;
  const allCollapsed = proposal.groups.length > 0 && proposal.groups.every((group) => collapsed.has(group.id));
  const status = proposal.sharedAt ? "Shared with client" : "Draft";

  function toggleGroup(id: string) {
    setCollapsed((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return <section aria-label={`${proposal.name} details`} className="space-y-4">
    <header className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border-subtle bg-white p-4">
      <div className="min-w-0">
        <h3 className="truncate text-xl font-semibold">{proposal.name}</h3>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", proposal.sharedAt ? "bg-[#eaf2fa] text-[#416a91]" : "bg-[#f2f3f2] text-text-secondary")}>{status}</span>
          {proposal.chosenAt && <span className="rounded-full bg-[#fff3dc] px-2.5 py-1 text-xs font-semibold text-[#805c21]">Chosen</span>}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" size="sm" variant="outline" onClick={onMakeDefault}>Make this the default</Button>
        <Button type="button" size="sm" onClick={() => actions.onEdit(proposal)}>Edit proposal</Button>
        <ProposalMenu proposal={proposal} actions={actions} />
      </div>
    </header>

    <div className="grid gap-2 sm:grid-cols-3">
      <div className="rounded-xl border border-border-subtle bg-white px-4 py-3"><p className="text-xs font-medium text-text-secondary">Proposal total</p><p className="mt-1 text-lg font-semibold tabular-nums">{formatBudgetMoney(total, currency)}</p></div>
      <div className="rounded-xl border border-border-subtle bg-white px-4 py-3"><p className="text-xs font-medium text-text-secondary">Client budget</p><p className="mt-1 text-lg font-semibold tabular-nums">{target === null ? "Not set" : formatBudgetMoney(target, currency)}</p></div>
      <div className={cn("rounded-xl border px-4 py-3", variance !== null && variance < 0 ? "border-[#e7d3aa] bg-[#fff8e9]" : "border-[#dce9df] bg-[#f5faf6]")}>
        <p className="text-xs font-medium text-text-secondary">{variance === null ? "Budget position" : variance < 0 ? "Over budget" : variance > 0 ? "Under budget" : "On budget"}</p>
        <p className={cn("mt-1 text-lg font-semibold tabular-nums", variance !== null && variance < 0 ? "text-[#865b1e]" : "text-[#376849]")}>{variance === null ? "Set client budget" : formatBudgetMoney(Math.abs(variance), currency)}</p>
      </div>
    </div>

    <div className="flex flex-wrap items-center justify-between gap-2">
      <h4 className="text-base font-semibold">Budget groups</h4>
      <div className="flex items-center gap-3">
        {proposal.groups.length > 0 && <button type="button" onClick={() => setCollapsed(allCollapsed ? new Set() : new Set(proposal.groups.map((group) => group.id)))} className="text-sm font-semibold text-brand-primary hover:underline">{allCollapsed ? "Expand all" : "Collapse all"}</button>}
        <Button type="button" size="sm" variant="outline" leadingIcon={<Plus className="size-4" />} onClick={onAddGroup}>Add budget group</Button>
      </div>
    </div>

    {proposal.groups.map((group) => {
      const open = !collapsed.has(group.id);
      return <section key={group.id} className="overflow-hidden rounded-xl border border-border-subtle bg-white">
        <div className="flex items-center justify-between gap-3 bg-[#f6f9f7] px-4 py-3">
          {editingGroup === group.id ? <form onSubmit={(event) => { event.preventDefault(); const error = onRenameGroup(group.id, groupName); if (error) setGroupError(error); else { setEditingGroup(null); setGroupError(""); } }} className="flex min-w-0 flex-1 flex-wrap items-center gap-2"><input autoFocus aria-label="Group name" maxLength={100} value={groupName} onChange={(event) => { setGroupName(event.target.value); setGroupError(""); }} className="h-9 min-w-0 flex-1 rounded-lg border border-border-default bg-white px-2 text-sm outline-none focus:border-brand-primary" /><Button type="submit" size="sm" disabled={!groupName.trim()}>Save</Button><button type="button" onClick={() => { setEditingGroup(null); setGroupError(""); }} className="text-sm text-text-secondary hover:underline">Cancel</button>{groupError && <p role="alert" className="w-full text-xs text-error">{groupError}</p>}</form> : <button type="button" aria-expanded={open} aria-controls={`proposal-group-${group.id}`} onClick={() => toggleGroup(group.id)} className="flex min-w-0 flex-1 items-center gap-2 text-left font-semibold">
            <ChevronDown className={cn("size-4 shrink-0 transition-transform", !open && "-rotate-90")} aria-hidden="true" />
            <span className="truncate">{group.name}</span>
            <span className="shrink-0 text-xs font-normal text-text-tertiary">{group.items.length} {group.items.length === 1 ? "item" : "items"}</span>
          </button>}
          <span className="shrink-0 font-semibold tabular-nums">{formatBudgetMoney(groupTotal(group), currency)}</span>
          {editingGroup !== group.id && <button type="button" aria-label={`Rename ${group.name}`} title="Rename group" onClick={() => { setEditingGroup(group.id); setGroupName(group.name); setGroupError(""); }} className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-text-secondary hover:bg-white hover:text-brand-primary"><Pencil className="size-4" aria-hidden="true" /></button>}
        </div>
        {open && <div id={`proposal-group-${group.id}`} className="overflow-x-auto">
          <table className="w-full min-w-[780px] text-left text-sm">
            <thead className="border-b border-border-subtle text-xs uppercase tracking-wide text-text-tertiary"><tr>
              <th className="px-4 py-2">Item</th><th className="px-4 py-2">Vendor</th><th className="px-4 py-2">Priced as</th><th className="px-4 py-2 text-right">Unit price</th><th className="px-4 py-2 text-right">Quantity</th><th className="px-4 py-2 text-right">Total</th><th className="w-12 px-2 py-2"><span className="sr-only">Edit</span></th>
            </tr></thead>
            <tbody className="divide-y divide-border-subtle">
              {group.items.map((item) => <tr key={item.id}>
                <th scope="row" className="px-4 py-2.5 font-medium">{item.name}</th>
                <td className="px-4 py-2.5">{item.vendor || "—"}</td>
                <td className="px-4 py-2.5 capitalize">{itemPricing(item).replaceAll("-", " ")}</td>
                <td className="px-4 py-2.5 text-right tabular-nums">{formatBudgetMoney(item.unitPrice, currency)}</td>
                <td className="px-4 py-2.5 text-right tabular-nums">{item.quantity}</td>
                <td className="px-4 py-2.5 text-right font-semibold tabular-nums">{formatBudgetMoney(lineTotal(item), currency)}</td>
                <td className="px-2 py-1"><button type="button" aria-label={`Edit ${item.name}`} title="Edit item" onClick={() => onEditItem(group.id, item)} className="inline-flex size-9 items-center justify-center rounded-lg text-text-secondary hover:bg-background-subtle hover:text-brand-primary"><Pencil className="size-4" aria-hidden="true" /></button></td>
              </tr>)}
              <tr><td colSpan={7} className="px-4 py-1"><button type="button" onClick={() => onAddItem(group.id)} className="inline-flex min-h-9 items-center gap-1 text-sm font-semibold text-brand-primary hover:underline"><Plus className="size-3.5" aria-hidden="true" />Add item</button></td></tr>
            </tbody>
          </table>
        </div>}
      </section>;
    })}
    {!proposal.groups.length && <p className="rounded-xl border border-dashed border-border-subtle bg-white px-5 py-10 text-center text-sm text-text-secondary">Add a budget group to start this proposal.</p>}
  </section>;
}
