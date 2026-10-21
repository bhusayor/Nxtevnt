"use client";

import { useState } from "react";
import { LayoutGrid, List, Plus, Scale, Wallet } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { DeleteConfirmation } from "@/components/ui/delete-confirmation";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { BudgetWorkspace } from "./budget-workspace";
import { ComparisonAddGroup, ComparisonAddItem } from "./proposal-quick-add";
import { ProposalEditor } from "./proposal-editor";
import { MatchCategoryDialog } from "./proposal-dialogs";
import { ProposalCards, ProposalTable } from "./proposal-comparison";
import { addBudgetGroups, budgetContext, currencies, importBudgetData, useBudgetStore } from "@/lib/planner-budget";
import { updatePlannerEvent, type PlannerEvent } from "@/lib/planner-events";
import { addProposalGroup, addProposalItem, categoryKey, comparisonRows, currentBudgetColumn, deleteEventProposal, duplicateEventProposal, eventClientTarget, eventProposals, matchProposalCategory, proposalLimit, saveEventProposal, type BudgetProposal, type ComparisonRow, type ProposalLine } from "@/lib/budget-proposals";
import { cn } from "@/lib/utils/cn";

function updateProposalEvent(id: string, change: (event: PlannerEvent) => PlannerEvent) {
  let found = false;
  updatePlannerEvent(id, (current) => { found = true; return change(current); });
  if (!found) throw new Error("This event no longer exists. Return to Events and open the event again.");
}

export function EventBudgetProposals({ event, initialTab = "budget" }: { event: PlannerEvent; initialTab?: string }) {
  const [tab, setTab] = useState(initialTab === "proposals" || initialTab === "proposal" ? "proposals" : "budget");
  return <div className="space-y-5"><div role="tablist" aria-label="Budget and proposals" className="inline-flex max-w-full rounded-xl border border-border-subtle bg-white p-1">{[{ id: "budget", label: "Budget", icon: Wallet }, { id: "proposals", label: "Proposals", icon: Scale }].map((entry) => <button key={entry.id} type="button" role="tab" id={`budget-${entry.id}-tab`} aria-controls={`budget-${entry.id}-panel`} aria-selected={tab === entry.id} onClick={() => setTab(entry.id)} className={cn("inline-flex min-h-9 items-center gap-2 rounded-lg px-4 text-xs font-semibold", tab === entry.id ? "bg-[#eaf3ed] text-brand-primary" : "text-text-secondary hover:text-text-primary")}><entry.icon className="size-4" aria-hidden="true" />{entry.label}</button>)}</div><div role="tabpanel" id={`budget-${tab}-panel`} aria-labelledby={`budget-${tab}-tab`}>{tab === "budget" ? <BudgetWorkspace fixedEventId={event.id} embedded /> : <ProposalWorkspace event={event} onOpenBudget={() => setTab("budget")} />}</div></div>;
}

function ProposalWorkspace({ event, onOpenBudget }: { event: PlannerEvent; onOpenBudget: () => void }) {
  const store = useBudgetStore();
  const [currency, setCurrency] = useState(event.currency || "NGN");
  const [view, setView] = useState<"cards" | "table">("cards");
  const [differencesOnly, setDifferencesOnly] = useState(false);
  const [editor, setEditor] = useState<{ proposal: BudgetProposal; fresh: boolean } | null>(null);
  const [deleting, setDeleting] = useState<BudgetProposal | null>(null);
  const [matching, setMatching] = useState<{ proposalId: string; groupId: string; key: string; name: string } | null>(null);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [addingItem, setAddingItem] = useState<{ columnId: string; row: ComparisonRow } | null>(null);
  const [addingGroup, setAddingGroup] = useState(false);
  const all = eventProposals(event);
  const proposals = all.filter((proposal) => proposal.currency === currency);
  const { groups, items } = budgetContext([event], store, event.id, currency);
  const current = currentBudgetColumn(groups, items, currency);
  const target = currency === (event.currency || "NGN") ? eventClientTarget(event) : null;
  const rows = comparisonRows([current, ...proposals]);
  const canCreate = all.length < proposalLimit;
  const filtering = differencesOnly && proposals.length > 1;
  function mutate(change: (current: PlannerEvent) => PlannerEvent, message: string) { try { updateProposalEvent(event.id, change); setError(""); setFeedback(message); return true; } catch (problem) { setError(problem instanceof Error ? problem.message : "This change couldn’t be saved. Please try again."); return false; } }
  function create() {
    if (!canCreate) return;
    const now = new Date().toISOString(); let number = all.length + 1;
    while (all.some((entry) => entry.name.toLocaleLowerCase() === `proposal ${number}`)) number++;
    setError(""); setEditor({ fresh: true, proposal: { id: crypto.randomUUID(), name: `Proposal ${number}`, currency, description: "", status: "draft", groups: [], createdAt: now, updatedAt: now } });
  }
  function addItem(item: ProposalLine, groupId?: string) {
    if (!addingItem) return;
    const { columnId, row } = addingItem;
    if (columnId !== "current") updateProposalEvent(event.id, (latest) => addProposalItem(latest, columnId, row, item, groupId));
    else {
      const existing = groupId ? groups.find((group) => group.id === groupId) : groups.find((group) => categoryKey(group.name) === row.key);
      if (groupId && !existing) throw new Error("This group no longer exists. Close and reopen Add item.");
      const group = existing ?? { id: crypto.randomUUID(), name: row.name, currency, eventId: event.id, createdAt: new Date().toISOString() };
      importBudgetData(existing ? [] : [group], [{ id: item.id, groupId: group.id, eventId: event.id, currency, name: item.name, vendor: item.vendor, vendorStatus: "not-sourced", pricedAs: item.pricedAs, quantity: item.quantity, unitPrice: item.unitPrice, budgeted: Math.round(item.quantity * item.unitPrice * 100) / 100, invoiced: 0, paid: 0, paymentDate: "", notes: item.description || "", status: "unpaid", installments: [], attachments: [], payments: [], createdAt: new Date().toISOString() }]);
    }
    setFeedback("Item added. The category and comparison totals have updated."); setError("");
  }
  function addGroup(columnId: string, name: string) {
    if (!categoryKey(name) || name.length > 100) throw new Error("Give the group a name of 1–100 characters.");
    if (columnId !== "current") updateProposalEvent(event.id, (latest) => addProposalGroup(latest, columnId, name));
    else {
      if (groups.some((group) => categoryKey(group.name) === categoryKey(name))) throw new Error("This group already exists in the current budget.");
      addBudgetGroups([{ id: crypto.randomUUID(), name, currency, eventId: event.id, createdAt: new Date().toISOString() }]);
    }
    setFeedback("Budget group added. Use Add item to price it."); setError("");
  }
  const actions = { canCreate, onEdit: (proposal: BudgetProposal) => { setError(""); setEditor({ proposal, fresh: false }); }, onDuplicate: (proposal: BudgetProposal) => { mutate((current) => duplicateEventProposal(current, proposal.id), "Proposal duplicated as a new draft."); }, onDelete: (proposal: BudgetProposal) => { setError(""); setDeleting(proposal); } };
  return <div className="space-y-5"><header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start"><div><h2 className="text-xl font-semibold tracking-tight">One event. A few possibilities.</h2><p className="mt-2 max-w-xl text-xs leading-6 text-text-secondary">Create up to three proposals and compare the choices before you commit. Your current budget stays the baseline.</p></div><Button type="button" size="sm" disabled={!canCreate} onClick={create} leadingIcon={<Plus className="size-3.5" aria-hidden="true" />}>Create proposal</Button></header>
    <div className="flex flex-wrap items-center justify-between gap-3"><div role="group" aria-label="Proposal comparison view" className="inline-flex rounded-lg border border-border-subtle bg-white p-1">{[{ id: "cards", label: "Cards", icon: LayoutGrid }, { id: "table", label: "Table", icon: List }].map((entry) => <button key={entry.id} type="button" aria-pressed={view === entry.id} onClick={() => setView(entry.id as "cards" | "table")} className={cn("inline-flex min-h-8 items-center gap-1.5 rounded-md px-3 text-xs font-semibold", view === entry.id ? "bg-brand-primary text-white" : "text-text-secondary hover:bg-background-subtle")}><entry.icon className="size-3.5" aria-hidden="true" />{entry.label}</button>)}</div><div className="flex flex-wrap items-center gap-4"><Switch label="Differences only" checked={filtering} disabled={proposals.length < 2} onCheckedChange={setDifferencesOnly} className="items-center gap-2 [&_label]:text-[0.6875rem]" /><div className="w-28"><Select ariaLabel="Proposal comparison currency" value={currency} onValueChange={setCurrency} options={currencies.map((entry) => ({ label: entry.code, value: entry.code }))} className="h-9 text-xs" /></div><p className="flex items-center gap-2 text-[0.6875rem] text-text-tertiary"><span className="flex gap-1" aria-hidden="true">{[0, 1, 2].map((index) => <span key={index} className={cn("h-1.5 w-4 rounded-full", index < all.length ? "bg-[#769582]" : "bg-[#e4eae6]")} />)}</span>{all.length} of 3 proposals</p></div></div>
    {error && <p role="alert" className="rounded-lg bg-error-soft px-4 py-3 text-xs leading-5 text-error">{error}</p>}{feedback && <p role="status" className="text-xs text-brand-primary">{feedback}</p>}
    {all.length !== proposals.length && <p className="text-xs leading-5 text-text-secondary">Showing {proposals.length} proposals in {currency}. Change the currency to see your other options; different currencies aren’t added together.</p>}
    {view === "cards" ? <ProposalCards current={current} proposals={proposals} currency={currency} target={target} actions={actions} onCreate={create} slots={proposalLimit - all.length} differencesOnly={filtering} onOpenBudget={onOpenBudget} /> : <ProposalTable current={current} proposals={proposals} currency={currency} target={target} actions={actions} differencesOnly={filtering} onAddGroup={() => setAddingGroup(true)} onAddItem={(columnId, row) => setAddingItem({ columnId, row })} onMatch={(row, proposalId, groupId) => setMatching({ proposalId, groupId, key: row.key, name: row.name })} />}
    <p className="text-[0.6875rem] leading-5 text-text-tertiary">Proposals are saved to this event in your browser. “Ready for review” is an internal status; nothing is sent to the client automatically.</p>
    {addingItem && <ComparisonAddItem key={addingItem.columnId + addingItem.row.key} column={[current, ...proposals].find((column) => column.id === addingItem.columnId)?.name || "Budget"} category={addingItem.row.name} currency={currency} groups={addingItem.row.cells[[current, ...proposals].findIndex((column) => column.id === addingItem.columnId)]?.groups || []} onClose={() => setAddingItem(null)} onSave={addItem} />}
    {addingGroup && <ComparisonAddGroup columns={[current, ...proposals]} onClose={() => setAddingGroup(false)} onSave={addGroup} />}
    {editor && <ProposalEditor key={editor.proposal.id} initial={editor.proposal} fresh={editor.fresh} currentGroups={current.groups} onClose={() => setEditor(null)} onSave={(proposal) => { updateProposalEvent(event.id, (current) => saveEventProposal(current, proposal, editor.fresh ? undefined : editor.proposal.updatedAt)); setFeedback(editor.fresh ? "Proposal created. You can now compare it with your budget." : "Proposal updated."); setError(""); return true; }} />}
    {matching && <MatchCategoryDialog category={matching.name} choices={rows.filter((row) => row.key !== matching.key).map((row) => ({ key: row.key, name: row.name }))} onClose={() => setMatching(null)} onSave={(key, label) => { updateProposalEvent(event.id, (current) => matchProposalCategory(current, matching.proposalId, matching.groupId, key, label)); setFeedback("Category matched. Your costs and item details are unchanged."); }} />}
    <DeleteConfirmation open={Boolean(deleting)} onOpenChange={(open) => { if (!open) setDeleting(null); }} title="Delete proposal?" description={`“${deleting?.name}” and its estimated items will be removed from this event. Your live budget and payments won’t change. This can’t be undone.`} error={error} onConfirm={() => deleting ? mutate((current) => deleteEventProposal(current, deleting.id), "Proposal deleted. You can create another option.") : false} />
  </div>;
}
