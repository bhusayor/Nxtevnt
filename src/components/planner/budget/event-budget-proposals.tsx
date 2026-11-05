"use client";

import { useState } from "react";
import { FileText, Wallet } from "@/components/ui/icons";
import { BudgetWorkspace } from "./budget-workspace";
import { ProposalWorkspace } from "./proposal-workspace";
import type { PlannerEvent } from "@/lib/planner-events";
import { cn } from "@/lib/utils/cn";

export function EventBudgetProposals({ event, initialTab = "budget" }: { event: PlannerEvent; initialTab?: string }) {
  const [tab, setTab] = useState(initialTab === "proposals" || initialTab === "proposal" ? "proposals" : "budget");
  const navigation = <div role="tablist" aria-label="Budget and proposals" className="inline-flex max-w-full rounded-xl border border-border-subtle bg-white p-1">{[{ id: "budget", label: "Budget", icon: Wallet }, { id: "proposals", label: "Proposals", icon: FileText }].map((entry) => <button key={entry.id} type="button" role="tab" id={`budget-${entry.id}-tab`} aria-controls={`budget-${entry.id}-panel`} aria-selected={tab === entry.id} onClick={() => setTab(entry.id)} className={cn("inline-flex min-h-9 items-center gap-2 rounded-lg px-4 text-sm font-semibold", tab === entry.id ? "bg-[#eaf3ed] text-brand-primary" : "text-text-secondary hover:text-text-primary")}><entry.icon className="size-4" aria-hidden="true" />{entry.label}</button>)}</div>;
  return <div className="space-y-5">{tab === "budget" ? <BudgetWorkspace fixedEventId={event.id} embedded navigation={navigation} initialTab={initialTab} /> : <>{navigation}<div role="tabpanel" id="budget-proposals-panel" aria-labelledby="budget-proposals-tab"><ProposalWorkspace event={event} onOpenBudget={() => setTab("budget")} /></div></>}</div>;
}
