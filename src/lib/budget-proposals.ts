import type { BudgetGroup, BudgetItem } from "@/lib/planner-budget";
import type { PlannerEvent } from "@/lib/planner-events";
import { itemPricing, pricingOptions, type PricedAs } from "@/lib/budget-pricing";

export type ProposalLine = { id: string; name: string; vendor: string; description?: string; pricedAs?: PricedAs; quantity: number; unitPrice: number };
export type ProposalGroup = { id: string; name: string; comparisonKey?: string; comparisonLabel?: string; items: ProposalLine[] };
export type BudgetProposal = { id: string; name: string; currency: string; description: string; status: "draft" | "ready"; groups: ProposalGroup[]; createdAt: string; updatedAt: string };
export type ComparisonColumn = { id: string; name: string; groups: ProposalGroup[] };
export type ComparisonCell = { groups: ProposalGroup[]; total: number };
export type ComparisonRow = { key: string; name: string; cells: (ComparisonCell | null)[]; different: boolean; shared: boolean };
export type ComparisonItemRow = { key: string; name: string; cells: ProposalLine[][]; different: boolean };

export const proposalLimit = 3;
export const proposalLimitForEvent = (event: Pick<PlannerEvent, "tier">) => event.tier === "premium" ? proposalLimit : 1;
export const categoryKey = (value: string) => value.normalize("NFKC").trim().toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
export const lineTotal = (line: ProposalLine) => Math.round((itemPricing(line) === "flat-fee" ? 1 : line.quantity) * line.unitPrice * 100) / 100;
export const groupTotal = (group: ProposalGroup) => group.items.reduce((sum, line) => sum + Math.round(lineTotal(line) * 100), 0) / 100;
export const proposalTotal = (proposal: Pick<BudgetProposal, "groups">) => proposal.groups.reduce((sum, group) => sum + Math.round(groupTotal(group) * 100), 0) / 100;

/** Read old, single-proposal line items without dropping them or inventing new proposals. */
export function eventProposals(event: PlannerEvent): BudgetProposal[] {
  if (Array.isArray(event.budgetProposals)) return event.budgetProposals;
  if (!event.sections.proposal?.length) return [];
  return [{ id: `legacy-proposal:${event.id}`, name: "Original proposal", currency: event.currency || "NGN", description: "Your previously saved proposal items.", status: "draft", createdAt: event.createdAt, updatedAt: event.createdAt, groups: [{ id: `legacy-proposal-group:${event.id}`, name: "Miscellaneous", items: event.sections.proposal.map((item) => ({ id: item.id, name: item.title, description: item.detail, vendor: "", quantity: 1, unitPrice: item.amount ?? 0 })) }] }];
}

function withProposals(event: PlannerEvent, proposals: BudgetProposal[]): PlannerEvent {
  return { ...event, budgetProposals: proposals, sections: { ...event.sections, proposal: [] } };
}

export function validateProposal(proposal: BudgetProposal) {
  if (!proposal.name.trim() || proposal.name.trim().length > 80) throw new Error("Give the proposal a name of 1–80 characters.");
  if (proposal.description.length > 500) throw new Error("Keep the description to 500 characters or fewer.");
  if (!["NGN", "USD", "GBP", "EUR"].includes(proposal.currency)) throw new Error("Choose a supported currency.");
  if (!["draft", "ready"].includes(proposal.status)) throw new Error("Choose a valid proposal status.");
  const names = new Set<string>();
  for (const group of proposal.groups) {
    const name = categoryKey(group.name);
    if (!name || group.name.length > 100) throw new Error("Give every category a name of 1–100 characters.");
    if (names.has(name)) throw new Error("Use a different name for each category in this proposal.");
    names.add(name);
    for (const item of group.items) {
      if (!item.name.trim() || item.name.length > 120) throw new Error("Give every item a name of 1–120 characters.");
      if (item.vendor.length > 150 || (item.description?.length ?? 0) > 500) throw new Error("Keep vendor names under 150 characters and item details under 500.");
      if (item.pricedAs && !pricingOptions.some((option) => option.value === item.pricedAs)) throw new Error("Choose a valid pricing method.");
      if (["per-guest", "per-trip"].includes(itemPricing(item)) && !Number.isInteger(item.quantity)) throw new Error("Guest and trip counts must be whole numbers.");
      if (!Number.isFinite(item.quantity) || item.quantity <= 0 || !Number.isFinite(item.unitPrice) || item.unitPrice < 0 || !Number.isSafeInteger(Math.round(item.quantity * item.unitPrice * 100))) throw new Error("Each item needs a quantity above zero and a valid, non-negative price.");
    }
  }
  if (proposal.status === "ready" && (!proposal.groups.length || proposal.groups.some((group) => !group.items.length) || proposalTotal(proposal) <= 0)) throw new Error("Add priced items to every category before marking the proposal ready for review.");
}

export function saveEventProposal(event: PlannerEvent, proposal: BudgetProposal, expectedUpdatedAt?: string): PlannerEvent {
  const proposals = eventProposals(event);
  const existing = proposals.find((entry) => entry.id === proposal.id);
  if (expectedUpdatedAt && (!existing || existing.updatedAt !== expectedUpdatedAt)) throw new Error("This proposal changed while you were editing. Close and reopen it to get the latest version.");
  if (!existing && proposals.length >= proposalLimitForEvent(event)) throw new Error(event.tier === "premium" ? "You can create up to three proposals per event. Edit or delete an existing proposal first." : "Standard events include one proposal. Upgrade this event to Premium for up to three proposals.");
  if (proposals.some((entry) => entry.id !== proposal.id && categoryKey(entry.name) === categoryKey(proposal.name))) throw new Error("A proposal already has this name. Give this option a different name.");
  validateProposal(proposal);
  const next = { ...proposal, name: proposal.name.trim(), description: proposal.description.trim(), createdAt: existing?.createdAt ?? proposal.createdAt, updatedAt: new Date().toISOString() };
  return withProposals(event, existing ? proposals.map((entry) => entry.id === next.id ? next : entry) : [...proposals, next]);
}

export function deleteEventProposal(event: PlannerEvent, id: string) {
  return withProposals(event, eventProposals(event).filter((proposal) => proposal.id !== id));
}

export function addProposalItem(event: PlannerEvent, proposalId: string, category: { key: string; name: string }, item: ProposalLine, groupId?: string) {
  const proposal = eventProposals(event).find((entry) => entry.id === proposalId);
  if (!proposal) throw new Error("This proposal no longer exists.");
  const group = groupId ? proposal.groups.find((entry) => entry.id === groupId) : proposal.groups.find((entry) => (entry.comparisonKey || categoryKey(entry.name)) === category.key);
  if (groupId && !group) throw new Error("This group no longer exists. Close and reopen Add item.");
  const groups = group ? proposal.groups.map((entry) => entry.id === group.id ? { ...entry, items: [...entry.items, item] } : entry) : [...proposal.groups, { id: crypto.randomUUID(), name: category.name, comparisonKey: category.key, items: [item] }];
  return saveEventProposal(event, { ...proposal, groups }, proposal.updatedAt);
}

export function addProposalGroup(event: PlannerEvent, proposalId: string, name: string) {
  const proposal = eventProposals(event).find((entry) => entry.id === proposalId);
  if (!proposal) throw new Error("This proposal no longer exists.");
  return saveEventProposal(event, { ...proposal, status: "draft", groups: [...proposal.groups, { id: crypto.randomUUID(), name: name.trim(), items: [] }] }, proposal.updatedAt);
}

export function copyProposalGroups(groups: ProposalGroup[]): ProposalGroup[] {
  return groups.map((group) => ({ ...group, id: crypto.randomUUID(), items: group.items.map((item) => ({ ...item, id: crypto.randomUUID() })) }));
}

export function duplicateEventProposal(event: PlannerEvent, id: string) {
  const proposals = eventProposals(event);
  const source = proposals.find((proposal) => proposal.id === id);
  if (!source) throw new Error("This proposal no longer exists.");
  let name = `${source.name.slice(0, 68)} copy`, number = 2;
  while (proposals.some((entry) => categoryKey(entry.name) === categoryKey(name))) name = `${source.name.slice(0, 65)} copy ${number++}`;
  const now = new Date().toISOString();
  return saveEventProposal(event, { ...source, id: crypto.randomUUID(), name, status: "draft", groups: copyProposalGroups(source.groups), createdAt: now, updatedAt: now });
}

export function currentBudgetColumn(groups: BudgetGroup[], items: BudgetItem[], currency: string): ComparisonColumn {
  return { id: "current", name: "Current budget", groups: groups.filter((group) => group.currency === currency).map((group) => ({ id: group.id, name: group.name, items: items.filter((item) => item.groupId === group.id && item.status !== "cancelled" && item.currency === currency).map((item) => ({ id: item.id, name: item.name, vendor: item.vendor, description: item.notes, pricedAs: item.pricedAs ?? "flat-fee", quantity: item.pricedAs && item.pricedAs !== "flat-fee" ? item.quantity ?? 1 : 1, unitPrice: item.unitPrice ?? item.budgeted })) })) };
}

export function comparisonRows(columns: ComparisonColumn[]): ComparisonRow[] {
  const rows = new Map<string, ComparisonRow>();
  columns.forEach((column, index) => column.groups.forEach((group) => {
    const key = group.comparisonKey || categoryKey(group.name);
    const row = rows.get(key) ?? { key, name: group.comparisonLabel || group.name, cells: columns.map(() => null), different: false, shared: false };
    const cell = row.cells[index] ?? { groups: [], total: 0 };
    cell.groups.push(group); cell.total = Math.round((cell.total + groupTotal(group)) * 100) / 100;
    row.cells[index] = cell; rows.set(key, row);
  }));
  return [...rows.values()].map((row) => {
    const signatures = row.cells.map(comparisonCellSignature);
    return { ...row, different: new Set(signatures).size > 1, shared: row.cells.every(Boolean) };
  });
}

const itemSignature = (item: ProposalLine) => [categoryKey(item.name), categoryKey(item.vendor), itemPricing(item), itemPricing(item) === "flat-fee" ? 1 : item.quantity, item.unitPrice, (item.description || "").trim().replace(/\s+/g, " ")];
const itemsSignature = (items: ProposalLine[]) => JSON.stringify(items.map(itemSignature).sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b))));

export function comparisonCellSignature(cell: ComparisonCell | null) {
  return cell ? JSON.stringify({ total: cell.total, items: itemsSignature(cell.groups.flatMap((group) => group.items)) }) : null;
}

/** Proposal-to-proposal differences deliberately exclude the live budget column. */
export function proposalRowDiffers(row: ComparisonRow) {
  const cells = row.cells.slice(1);
  return cells.length > 1 && new Set(cells.map(comparisonCellSignature)).size > 1;
}

export function proposalRowDifference(row: ComparisonRow) {
  if (!proposalRowDiffers(row)) return "Same in every proposal";
  const cells = row.cells.slice(1);
  if (cells.some((cell) => cell === null)) return "Category differs";
  return new Set(cells.map((cell) => cell?.total)).size > 1 ? "Costs differ" : "Items or details differ";
}

/** Align items by name too, so quantity/vendor/detail changes stay visible at equal totals. */
export function comparisonItemRows(row: ComparisonRow): ComparisonItemRow[] {
  const rows = new Map<string, ComparisonItemRow>();
  row.cells.forEach((cell, index) => cell?.groups.forEach((group) => group.items.forEach((item) => {
    const key = categoryKey(item.name);
    const entry = rows.get(key) ?? { key, name: item.name, cells: row.cells.map(() => []), different: false };
    entry.cells[index].push(item); rows.set(key, entry);
  })));
  return [...rows.values()].map((entry) => ({ ...entry, different: entry.cells.length > 2 && new Set(entry.cells.slice(1).map(itemsSignature)).size > 1 }));
}

export function matchProposalCategory(event: PlannerEvent, proposalId: string, groupId: string, key: string, label: string) {
  const proposal = eventProposals(event).find((entry) => entry.id === proposalId);
  if (!proposal || !proposal.groups.some((group) => group.id === groupId)) throw new Error("This proposal category no longer exists.");
  return saveEventProposal(event, { ...proposal, groups: proposal.groups.map((group) => group.id === groupId ? { ...group, comparisonKey: key, comparisonLabel: label } : group) }, proposal.updatedAt);
}

export function eventClientTarget(event: PlannerEvent) {
  const amount = Number((event.targetBudget || (!event.budgetTemplateId ? event.budget : "") || "").replaceAll(",", ""));
  return Number.isFinite(amount) && amount > 0 ? amount : null;
}
