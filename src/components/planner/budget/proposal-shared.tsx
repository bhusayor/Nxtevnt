"use client";

import { Copy, LinkBreak, NotebookPen, Pencil, Save, ShareNetwork, Star, Trash2, Wallet } from "@/components/ui/icons";
import { ActionMenu } from "@/components/ui/action-menu";
import { formatBudgetMoney } from "@/lib/planner-budget";
import type { BudgetProposal } from "@/lib/budget-proposals";
import { cn } from "@/lib/utils/cn";

export const proposalColors = ["#6088b5", "#9b82bd", "#cd9a52"];
export const hasProposalItems = (proposal: Pick<BudgetProposal, "groups">) => proposal.groups.some((group) => group.items.length > 0);
export type ProposalActions = { onEdit: (proposal: BudgetProposal) => void; onOpen: (proposal: BudgetProposal) => void; onRename: (proposal: BudgetProposal) => void; onShareToggle: (proposal: BudgetProposal) => void; onChoose: (proposal: BudgetProposal) => void; onUseLive: (proposal: BudgetProposal) => void; onSaveTemplate: (proposal: BudgetProposal) => void; onDuplicate: (proposal: BudgetProposal) => void; onDelete: (proposal: BudgetProposal) => void; canCreate: boolean };

export function BudgetDifference({ total, target, currency }: { total: number; target: number | null; currency: string }) {
  if (target === null) return <span className="text-xs text-text-tertiary">No client target set</span>;
  const difference = Math.round((target - total) * 100) / 100;
  return <span className={cn("text-xs font-medium", difference < 0 ? "text-[#ac7742]" : "text-[#4d7c62]")}>{difference === 0 ? "Matches the client target" : `${formatBudgetMoney(Math.abs(difference), currency)} ${difference > 0 ? "under" : "over"} target`}</span>;
}

export function ProposalMenu({ proposal, actions }: { proposal: BudgetProposal; actions: ProposalActions }) {
  return <ActionMenu label={`Actions for ${proposal.name}`} items={[
    { label: "Edit proposal", icon: <NotebookPen />, onSelect: () => actions.onOpen(proposal) },
    { label: "Rename", icon: <Pencil />, onSelect: () => actions.onRename(proposal) },
    { label: proposal.sharedAt ? "Stop sharing" : "Share with client", icon: proposal.sharedAt ? <LinkBreak /> : <ShareNetwork />, onSelect: () => actions.onShareToggle(proposal) },
    { label: "Mark as chosen", icon: <Star />, onSelect: () => actions.onChoose(proposal) },
    { label: "Use as live budget", icon: <Wallet />, onSelect: () => actions.onUseLive(proposal) },
    { label: "Save as template", icon: <Save />, onSelect: () => actions.onSaveTemplate(proposal) },
    { label: "Duplicate", icon: <Copy />, onSelect: () => actions.onDuplicate(proposal), disabled: !actions.canCreate },
    { label: "Delete", icon: <Trash2 />, onSelect: () => actions.onDelete(proposal), destructive: true },
  ]} />;
}
