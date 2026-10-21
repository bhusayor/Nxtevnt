"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { ReceiptText, X } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { formatBudgetMoney } from "@/lib/planner-budget";
import { formatEventDate } from "@/lib/planner-events";
import type { AttentionItem } from "./attention-queue-items";

export function AttentionSamplePayment({ item, onClose }: { item: AttentionItem | null; onClose: () => void }) {
  const payment = item?.samplePayment;
  return <Dialog.Root open={Boolean(payment)} onOpenChange={(open) => { if (!open) onClose(); }}><Dialog.Portal><Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" /><Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-xl"><div className="flex justify-between gap-4"><span className="flex size-11 items-center justify-center rounded-xl bg-[#fcf2e3] text-[#976e38]"><ReceiptText className="size-5" weight="duotone" aria-hidden="true" /></span><Dialog.Close aria-label="Close payment example" className="flex size-8 items-center justify-center rounded-full hover:bg-[#f5f5f5]"><X className="size-4" /></Dialog.Close></div><p className="mt-5 text-[0.625rem] font-semibold uppercase tracking-widest text-[#976e38]">Sample payment · Preview only</p><Dialog.Title className="mt-2 text-xl font-semibold">{item?.title}</Dialog.Title><Dialog.Description className="mt-2 text-xs leading-6 text-text-secondary">An example of a payment to watch. This isn’t a real balance or payment request.</Dialog.Description>{payment && <><div className="mt-5 rounded-xl border border-border-subtle bg-[#fafafa] p-4"><p className="text-xs text-text-secondary">Amount due</p><p className="mt-2 text-3xl font-semibold tracking-tight">{formatBudgetMoney(payment.amount, payment.currency)}</p></div><dl className="mt-5 grid grid-cols-2 gap-5 text-xs"><div><dt className="text-text-tertiary">Event</dt><dd className="mt-2 font-medium">{payment.eventName}</dd></div><div><dt className="text-text-tertiary">Vendor</dt><dd className="mt-2 font-medium">{payment.vendor}</dd></div><div><dt className="text-text-tertiary">Due date</dt><dd className="mt-2 font-medium">{formatEventDate(payment.date)}</dd></div><div><dt className="text-text-tertiary">Currency</dt><dd className="mt-2 font-medium">{payment.currency}</dd></div></dl></>}<Button type="button" className="mt-6" fullWidth variant="outline" onClick={onClose}>Close preview</Button></Dialog.Content></Dialog.Portal></Dialog.Root>;
}
