"use client";

import { useState, type FormEvent } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { DeleteConfirmation } from "@/components/ui/delete-confirmation";
import { Switch } from "@/components/ui/switch";
import { EventTierChip } from "@/components/planner/event-tier-chip";
import { budgetContext, replaceEventBudgetWithProposal, useBudgetStore, type BudgetGroup } from "@/lib/planner-budget";
import { updatePlannerEvent, type PlannerEvent } from "@/lib/planner-events";
import { addProposalGroup, addProposalItem, categoryKey, chooseEventProposal, comparisonRows, currentBudgetColumn, deleteEventProposal, duplicateEventProposal, eventClientTarget, eventProposals, proposalLimitForEvent, saveEventProposal, type BudgetProposal, type ComparisonRow, type ProposalLine } from "@/lib/budget-proposals";
import { saveProposalAsTemplate } from "@/lib/proposal-saved-templates";
import { cn } from "@/lib/utils/cn";
import { ComparisonAddGroup, ComparisonAddItem } from "./proposal-quick-add";
import { ProposalEditor } from "./proposal-editor";
import { ProposalCompactComparison } from "./proposal-compact-comparison";
import { ProposalDetail } from "./proposal-detail";
import { BudgetItemDialog } from "./budget-item-dialog";
import type { ProposalActions } from "./proposal-shared";

function updateProposalEvent(id: string, change: (event: PlannerEvent) => PlannerEvent) {
  let found = false;
  updatePlannerEvent(id, (current) => { found = true; return change(current); });
  if (!found) throw new Error("This event no longer exists. Return to Events and open it again.");
}

export function ProposalWorkspace({ event, onOpenBudget }: { event: PlannerEvent; onOpenBudget: () => void }) {
  const store = useBudgetStore();
  const currency = event.currency || "NGN";
  const [selectedTab, setSelectedTab] = useState("comparison");
  const [differencesOnly, setDifferencesOnly] = useState(false);
  const [editor, setEditor] = useState<{ proposal: BudgetProposal; fresh: boolean } | null>(null);
  const [deleting, setDeleting] = useState<BudgetProposal | null>(null);
  const [renaming, setRenaming] = useState<BudgetProposal | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [usingLive, setUsingLive] = useState<BudgetProposal | null>(null);
  const [dialogError, setDialogError] = useState("");
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [addingItem, setAddingItem] = useState<{ proposalId: string; groupId?: string; row: ComparisonRow; initial?: ProposalLine } | null>(null);
  const [liveGroup, setLiveGroup] = useState<BudgetGroup | null>(null);
  const [addingGroup, setAddingGroup] = useState(false);
  const all = eventProposals(event);
  const proposals = all.filter((proposal) => proposal.currency === currency);
  const limit = proposalLimitForEvent(event);
  const canCreate = all.length < limit;
  const { groups, items } = budgetContext([event], store, event.id, currency);
  const current = currentBudgetColumn(groups, items, currency);
  const target = eventClientTarget(event);
  const rows = comparisonRows([current, ...proposals]);
  const active = proposals.find((proposal) => proposal.id === selectedTab);

  function mutate(change: (current: PlannerEvent) => PlannerEvent, message: string) {
    try { updateProposalEvent(event.id, change); setError(""); setFeedback(message); return true; }
    catch (problem) { setError(problem instanceof Error ? problem.message : "This change couldn’t be saved."); return false; }
  }
  function create() {
    if (!canCreate) return;
    const now = new Date().toISOString(); let number = all.length + 1;
    while (all.some((entry) => entry.name.toLocaleLowerCase() === `proposal ${number}`)) number++;
    setEditor({ fresh: true, proposal: { id: crypto.randomUUID(), name: `Proposal ${number}`, currency, description: "", status: "draft", groups: [], createdAt: now, updatedAt: now } });
    setError("");
  }
  function saveTarget(amount: number) {
    try { updateProposalEvent(event.id, (latest) => ({ ...latest, targetBudget: String(amount) })); setFeedback("Client budget updated."); return null; }
    catch { return "The client budget couldn’t be saved. Try again."; }
  }
  function addItem(item: ProposalLine, groupId?: string) {
    if (!addingItem) return;
    if (addingItem.initial) {
      updateProposalEvent(event.id, (latest) => {
        const proposal = eventProposals(latest).find((entry) => entry.id === addingItem.proposalId);
        if (!proposal) throw new Error("This proposal no longer exists.");
        return saveEventProposal(latest, { ...proposal, groups: proposal.groups.map((group) => group.id === addingItem.groupId ? { ...group, items: group.items.map((line) => line.id === item.id ? item : line) } : group) }, proposal.updatedAt);
      });
    } else updateProposalEvent(event.id, (latest) => addProposalItem(latest, addingItem.proposalId, addingItem.row, item, groupId || addingItem.groupId));
    setFeedback(addingItem.initial ? "Item updated." : "Item added to the proposal."); setError("");
  }
  function openProposalItem(row: ComparisonRow, proposalId: string, groupId?: string, initial?: ProposalLine) {
    setAddingItem({ row, proposalId, groupId, initial });
  }
  function openLiveItem(row: ComparisonRow) {
    const existing = row.cells[0]?.groups[0];
    setLiveGroup(groups.find((group) => group.id === existing?.id) ?? { id: crypto.randomUUID(), eventId: event.id, currency, name: row.name, createdAt: new Date().toISOString() });
  }
  function addGroup(columnId: string, name: string) {
    if (!active || columnId !== active.id) throw new Error("Open the proposal again before adding a group.");
    if (!categoryKey(name) || name.length > 100) throw new Error("Give the group a name of 1–100 characters.");
    updateProposalEvent(event.id, (latest) => addProposalGroup(latest, active.id, name));
    setFeedback("Budget group added to the proposal."); setError("");
  }
  function renameGroup(groupId: string, name: string) {
    if (!active) return "Open the proposal again before renaming this group.";
    try {
      updateProposalEvent(event.id, (latest) => {
        const proposal = eventProposals(latest).find((entry) => entry.id === active.id);
        if (!proposal || !proposal.groups.some((group) => group.id === groupId)) throw new Error("This group no longer exists.");
        return saveEventProposal(latest, { ...proposal, groups: proposal.groups.map((group) => group.id === groupId ? { ...group, name: name.trim(), comparisonKey: undefined, comparisonLabel: undefined } : group) }, proposal.updatedAt);
      });
      setFeedback("Group renamed."); setError("");
      return null;
    } catch (problem) { return problem instanceof Error ? problem.message : "The group couldn’t be renamed."; }
  }
  function confirmUseLive() {
    if (!usingLive) return;
    let undo: (() => void) | undefined;
    try {
      undo = replaceEventBudgetWithProposal(event.id, currency, usingLive.groups);
      updateProposalEvent(event.id, (latest) => ({ ...latest, sections: { ...latest.sections, expenses: [] } }));
      setUsingLive(null); setDialogError(""); setFeedback(`${usingLive.name} is now the live budget.`); setSelectedTab("comparison");
    } catch (problem) {
      undo?.();
      setDialogError(problem instanceof Error ? problem.message : "The live budget couldn’t be replaced.");
    }
  }
  const actions: ProposalActions = {
    canCreate,
    onOpen: (proposal) => setSelectedTab(proposal.id),
    onEdit: (proposal) => { setEditor({ proposal, fresh: false }); setError(""); },
    onRename: (proposal) => { setRenaming(proposal); setRenameValue(proposal.name); setDialogError(""); },
    onShareToggle: (proposal) => { mutate((latest) => saveEventProposal(latest, { ...proposal, sharedAt: proposal.sharedAt ? undefined : new Date().toISOString() }, proposal.updatedAt), proposal.sharedAt ? "Proposal sharing stopped." : "Proposal sharing status updated."); },
    onChoose: (proposal) => { mutate((latest) => chooseEventProposal(latest, proposal.id), `${proposal.name} marked as chosen.`); },
    onUseLive: (proposal) => { setUsingLive(proposal); setDialogError(""); },
    onSaveTemplate: (proposal) => { try { saveProposalAsTemplate(proposal); setFeedback(`${proposal.name} saved as a reusable template.`); setError(""); } catch (problem) { setError(problem instanceof Error ? problem.message : "The template couldn’t be saved."); } },
    onDuplicate: (proposal) => { mutate((latest) => duplicateEventProposal(latest, proposal.id), "Proposal duplicated as a new draft."); },
    onDelete: (proposal) => { setDeleting(proposal); setError(""); },
  };
  return <div className="space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-3"><div role="tablist" aria-label="Proposal views" className="inline-flex max-w-full items-center gap-1 overflow-x-auto rounded-xl border border-border-subtle bg-white p-1"><button type="button" role="tab" aria-selected={!active} onClick={() => setSelectedTab("comparison")} className={cn("min-h-9 shrink-0 whitespace-nowrap rounded-lg px-3 text-sm font-semibold transition-colors", !active ? "bg-[#eaf3ed] text-brand-primary" : "text-text-secondary hover:bg-background-subtle")}>Comparison</button>{proposals.map((proposal) => <button key={proposal.id} type="button" role="tab" aria-selected={active?.id === proposal.id} onClick={() => setSelectedTab(proposal.id)} className={cn("min-h-9 max-w-44 shrink-0 truncate rounded-lg px-3 text-sm font-semibold transition-colors", active?.id === proposal.id ? "bg-[#eaf3ed] text-brand-primary" : "text-text-secondary hover:bg-background-subtle")}>{proposal.name}</button>)}</div>{limit === 1 && <EventTierChip mode="header" eventId={event.id} eventName={event.name} tier={event.tier} cancelled={Boolean(event.cancelledAt)} />}</div>
    <div className="flex flex-wrap items-center justify-between gap-3 text-sm"><span className="text-text-tertiary">{all.length} of {limit} proposals · {currency}</span>{!active && <Switch label="Differences only" checked={differencesOnly} disabled={proposals.length < 1} onCheckedChange={setDifferencesOnly} className="items-center gap-2 [&_label]:text-sm" />}</div>
    {error && <p role="alert" className="rounded-lg bg-error-soft px-4 py-3 text-sm text-error">{error}</p>}{feedback && <p role="status" className="text-sm text-brand-primary">{feedback}</p>}
    {all.length !== proposals.length && <p className="text-sm text-text-secondary">Some earlier proposals use a different currency and cannot be compared with this event.</p>}
    {active ? <ProposalDetail proposal={active} currency={currency} target={target} actions={actions}
      onAddGroup={() => setAddingGroup(true)}
      onAddItem={(groupId) => { const row = rows.find((entry) => entry.cells.some((cell) => cell?.groups.some((group) => group.id === groupId))); if (row) openProposalItem(row, active.id, groupId); }}
      onEditItem={(groupId, item) => { const row = rows.find((entry) => entry.cells.some((cell) => cell?.groups.some((group) => group.id === groupId))); if (row) openProposalItem(row, active.id, groupId, item); }}
      onRenameGroup={renameGroup}
      onMakeDefault={() => actions.onUseLive(active)} />
      : <ProposalCompactComparison current={current} proposals={proposals} currency={currency} target={target}
        invoiced={items.filter((item) => item.status !== "cancelled").reduce((sum, item) => sum + item.invoiced, 0)}
        differencesOnly={differencesOnly} actions={actions} eventId={event.id} eventName={event.name} tier={event.tier}
        onOpenProposal={setSelectedTab} onCreate={create}
        onAddItem={(row, proposalId) => {
          if (!proposalId) { openLiveItem(row); return; }
          const index = proposals.findIndex((proposal) => proposal.id === proposalId) + 1;
          openProposalItem(row, proposalId, row.cells[index]?.groups[0]?.id);
        }} onSaveTarget={saveTarget} />}

    {active && <button type="button" onClick={onOpenBudget} className="text-sm font-semibold text-brand-primary hover:underline">Open live budget</button>}
    {addingItem && <ComparisonAddItem guestCount={event.guestCount} key={addingItem.initial?.id ?? addingItem.proposalId + addingItem.row.key}
      column={proposals.find((proposal) => proposal.id === addingItem.proposalId)?.name || "Proposal"}
      category={addingItem.row.name} currency={currency}
      groups={addingItem.groupId ? proposals.find((proposal) => proposal.id === addingItem.proposalId)?.groups.filter((group) => group.id === addingItem.groupId) || [] : []}
      initial={addingItem.initial} onClose={() => setAddingItem(null)} onSave={addItem} />}
    {liveGroup && <BudgetItemDialog key={liveGroup.id} open onOpenChange={(open) => { if (!open) setLiveGroup(null); }}
      group={liveGroup} groups={groups} vendors={[...new Set(items.map((item) => item.vendor).filter(Boolean))]}
      onSaved={() => { setLiveGroup(null); setFeedback("Item added to the live budget."); }} />}

    {addingGroup && active && <ComparisonAddGroup columns={[active]} onClose={() => setAddingGroup(false)} onSave={addGroup} />}
    {editor && <ProposalEditor guestCount={event.guestCount} key={editor.proposal.id} initial={editor.proposal} fresh={editor.fresh} currentGroups={current.groups} onClose={() => setEditor(null)} onSave={(proposal) => { updateProposalEvent(event.id, (latest) => saveEventProposal(latest, proposal, editor.fresh ? undefined : editor.proposal.updatedAt)); setFeedback(editor.fresh ? "Proposal created." : "Proposal updated."); setSelectedTab(proposal.id); setError(""); return true; }} />}
    <DeleteConfirmation open={Boolean(deleting)} onOpenChange={(open) => { if (!open) setDeleting(null); }} title="Delete proposal?" description={`“${deleting?.name}” and its estimated items will be removed. Your live budget and payments won’t change.`} onConfirm={() => deleting ? mutate((latest) => deleteEventProposal(latest, deleting.id), "Proposal deleted.") : false} />
    <Dialog.Root open={Boolean(renaming)} onOpenChange={(open) => { if (!open) setRenaming(null); }}>{renaming && <Dialog.Portal><Dialog.Overlay className="fixed inset-0 z-[90] bg-[#10231a]/50" /><Dialog.Content className="fixed left-1/2 top-1/2 z-[90] w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-[var(--shadow-lg)]"><div className="flex justify-between gap-3"><Dialog.Title className="text-lg font-semibold">Rename proposal</Dialog.Title><Dialog.Close asChild><button type="button" aria-label="Close" className="text-text-tertiary"><X className="size-5" /></button></Dialog.Close></div><Dialog.Description className="mt-1 text-sm text-text-secondary">Choose a name for this option.</Dialog.Description><form onSubmit={(submit: FormEvent) => { submit.preventDefault(); if (mutate((latest) => saveEventProposal(latest, { ...renaming, name: renameValue }, renaming.updatedAt), "Proposal renamed.")) { setRenaming(null); setDialogError(""); } else setDialogError("The proposal couldn’t be renamed. Check the message below and try again."); }}><label className="mt-5 block text-sm font-semibold">Proposal name<input autoFocus maxLength={80} value={renameValue} onChange={(change) => setRenameValue(change.target.value)} className="mt-2 h-11 w-full rounded-lg border border-border-default px-3 text-sm outline-none focus:border-brand-primary" /></label>{dialogError && <p role="alert" className="mt-3 text-sm text-error">{dialogError}</p>}<div className="mt-5 flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setRenaming(null)}>Cancel</Button><Button type="submit" disabled={!renameValue.trim()}>Save name</Button></div></form></Dialog.Content></Dialog.Portal>}</Dialog.Root>
    <Dialog.Root open={Boolean(usingLive)} onOpenChange={(open) => { if (!open) setUsingLive(null); }}>{usingLive && <Dialog.Portal><Dialog.Overlay className="fixed inset-0 z-[90] bg-[#10231a]/50" /><Dialog.Content className="fixed left-1/2 top-1/2 z-[90] w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-[var(--shadow-lg)]"><div className="flex justify-between gap-3"><Dialog.Title className="text-lg font-semibold">Use this as the live budget?</Dialog.Title><Dialog.Close asChild><button type="button" aria-label="Close" className="text-text-tertiary"><X className="size-5" /></button></Dialog.Close></div><Dialog.Description className="mt-2 text-sm leading-6 text-text-secondary">Replace the current planned groups and items with {usingLive.name}. Invoices, payments and attached files cannot be replaced this way.</Dialog.Description>{dialogError && <p role="alert" className="mt-4 rounded-lg bg-error-soft p-3 text-sm text-error">{dialogError}</p>}<div className="mt-6 flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setUsingLive(null)}>Cancel</Button><Button type="button" onClick={confirmUseLive}>Use as live budget</Button></div></Dialog.Content></Dialog.Portal>}</Dialog.Root>
  </div>;
}
