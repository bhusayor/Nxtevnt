"use client";

import { useState } from "react";
import { LogBudgetPayment } from "@/components/planner/budget/log-budget-payment";
import { Button } from "@/components/ui/button";
import { completePlannerTask } from "@/lib/planner-events";
import type { AttentionItem } from "./attention-queue-items";

export function AttentionQuickAction({ item }: { item: AttentionItem }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  if (item.sample || (!item.task && !item.budgetItem)) return null;
  return <div className="flex flex-col items-end gap-2">
    {item.task && item.eventId && <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm font-semibold text-brand-primary"><input type="checkbox" aria-label={`Mark complete: ${item.title}`} checked={false} className="size-5 accent-brand-primary" onChange={() => { try { completePlannerTask(item.eventId!, item.task!.id); setError(""); } catch (failure) { setError(failure instanceof Error ? failure.message : "Couldn’t complete this task. Please try again."); } }} />Complete</label>}
    {item.budgetItem && <><Button type="button" size="sm" variant="outline" onClick={() => setOpen(true)} aria-label={`Record payment: ${item.title}`}>Record payment</Button>{open && <LogBudgetPayment item={item.budgetItem} onClose={() => setOpen(false)} onSaved={() => setOpen(false)} />}</>}
    {error && <p role="alert" className="max-w-xs text-xs text-error">{error}</p>}
  </div>;
}
