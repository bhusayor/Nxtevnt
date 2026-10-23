"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { formatBudgetMoney, type BudgetItem } from "@/lib/planner-budget";
import type { BudgetPaymentDemo as DemoData } from "@/lib/budget-payment-demo";
import { PaymentProgress, UpcomingPayments } from "./upcoming-payments";
import { PaystackTestCheckout } from "./paystack-test-checkout";

export function BudgetPaymentDemo({ data, currency }: { data: DemoData; currency: string }) {
  const [selected, setSelected] = useState<{ item: BudgetItem; amount?: number; pay: boolean } | null>(null);
  return <div className="space-y-4">
    <UpcomingPayments items={data.items} groups={data.groups} currency={currency} defaultShowAll showControls={false} includePaid onView={(item) => setSelected({ item, pay: false })} onPay={(item, amount) => setSelected({ item, amount, pay: true })} />
    <Dialog.Root open={Boolean(selected)} onOpenChange={(open) => { if (!open) setSelected(null); }}><Dialog.Portal><Dialog.Overlay className="fixed inset-0 z-50 bg-[#10231a]/50 backdrop-blur-[2px]" /><Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl bg-white p-5 shadow-[var(--shadow-lg)] focus:outline-none sm:p-6">
      <header className="flex items-start justify-between gap-3"><div><Dialog.Title className="text-lg font-semibold">{selected?.item.name || "Payment details"}</Dialog.Title><Dialog.Description className="mt-1 text-sm leading-6 text-text-secondary">Review the item total, payment progress and remaining balance.</Dialog.Description></div><Dialog.Close asChild><button type="button" aria-label="Close payment details" className="flex size-10 shrink-0 items-center justify-center rounded-lg text-text-secondary hover:bg-background-subtle"><X className="size-5" aria-hidden="true" /></button></Dialog.Close></header>
      {selected && (selected.pay ? <PaystackTestCheckout key={`${selected.item.id}:${selected.amount}`} item={selected.item} initialAmount={selected.amount} /> : <div className="mt-5 space-y-5"><p className="text-sm text-text-secondary">{selected.item.vendor}</p><div className="rounded-xl border border-border-subtle p-4"><p className="text-sm text-text-secondary">Item total</p><p className="mt-1 text-xl font-semibold tabular-nums">{formatBudgetMoney(selected.item.budgeted, currency)}</p><div className="mt-4"><PaymentProgress item={selected.item} currency={currency} /></div></div>{selected.item.paid < Math.max(selected.item.budgeted, selected.item.invoiced) && <Button type="button" className="w-full" onClick={() => setSelected({ ...selected, pay: true })}>Pay</Button>}</div>)}
    </Dialog.Content></Dialog.Portal></Dialog.Root>
  </div>;
}
