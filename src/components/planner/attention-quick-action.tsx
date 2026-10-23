"use client";

import { useState } from "react";
import { LogBudgetPayment } from "@/components/planner/budget/log-budget-payment";
import { Button } from "@/components/ui/button";
import type { AttentionItem } from "./attention-queue-items";

export function AttentionQuickAction({ item }: { item: AttentionItem }) {
  const [open, setOpen] = useState(false);
  if (item.sample || !item.budgetItem) return null;
  return <div className="flex flex-col items-end gap-2">
    {item.budgetItem && <><Button type="button" size="sm" variant="outline" onClick={() => setOpen(true)} aria-label={`Record payment: ${item.title}`}>Record payment</Button>{open && <LogBudgetPayment item={item.budgetItem} onClose={() => setOpen(false)} onSaved={() => setOpen(false)} />}</>}
  </div>;
}
