"use client";

import { useRef, useState, type FormEvent } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { CircleDollarSign, X } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { BudgetAmountInput, formatBudgetAmountInput } from "./budget-amount-input";
import { BudgetNativeSelect } from "./budget-controls";
import { PaystackTestCheckout } from "./paystack-test-checkout";
import { deleteBudgetAttachments, saveBudgetAttachments, validateBudgetReceipt } from "@/lib/budget-attachments";
import { budgetToday, formatBudgetMoney, itemBalance, recordBudgetPayment, type BudgetItem, type BudgetPayment } from "@/lib/planner-budget";

export function LogBudgetPayment({ item, onClose, onSaved, initialAmount, initialPath = "record" }: { item: BudgetItem; onClose: () => void; onSaved: (item: BudgetItem) => void; initialAmount?: number; initialPath?: "record" | "app" }) {
  const openingAmount = initialAmount !== undefined && Number.isFinite(initialAmount) && initialAmount > 0 ? Math.min(initialAmount, itemBalance(item)) : undefined;
  const [amount, setAmount] = useState(openingAmount === undefined ? "" : formatBudgetAmountInput(String(openingAmount)));
  const [date, setDate] = useState(budgetToday());
  const [method, setMethod] = useState<BudgetPayment["method"]>("bank-transfer");
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const paymentId = useRef<string | null>(null);
  const lock = useRef(false);
  const [receipt, setReceipt] = useState<File | null>(null);
  const [path, setPath] = useState<"record" | "app">(initialPath);
  const value = Number(amount.replaceAll(",", ""));
  const balance = itemBalance(item);
  async function save(event: FormEvent) {
    event.preventDefault();
    if (lock.current) return;
    lock.current = true; setSaving(true); setError("");
    let uploadedReceiptId: string | undefined;
    let recorded = false;
    try {
      if (path !== "record") throw new Error("Pay in app is not connected yet. No money has been sent.");
      if (receipt && validateBudgetReceipt(receipt)) throw new Error(validateBudgetReceipt(receipt));
      paymentId.current ??= crypto.randomUUID();
      const attachment = receipt ? { id: crypto.randomUUID(), name: receipt.name, type: receipt.type, size: receipt.size } : undefined;
      if (attachment && receipt) { uploadedReceiptId = attachment.id; await saveBudgetAttachments([{ attachment, file: receipt }]); }
      const next = recordBudgetPayment(item, { id: paymentId.current, amount: value, date, method, reference, note, receipt: attachment, createdAt: new Date().toISOString() });
      recorded = true;
      if (attachment && !next.payments?.some((payment) => payment.receipt?.id === attachment.id)) await deleteBudgetAttachments([attachment.id]).catch(() => {});
      onSaved(next); onClose();
    } catch (problem) { if (uploadedReceiptId && !recorded) await deleteBudgetAttachments([uploadedReceiptId]).catch(() => {}); setError(problem instanceof Error ? problem.message : "This payment couldn’t be saved. Please try again."); }
    finally { lock.current = false; setSaving(false); }
  }
  return <Dialog.Root open onOpenChange={(open) => { if (!open && !lock.current) onClose(); }}><Dialog.Portal><Dialog.Overlay className="fixed inset-0 z-50 bg-[#10231a]/50 backdrop-blur-[2px]" /><Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl bg-white p-5 shadow-[var(--shadow-lg)] focus:outline-none sm:p-6">
    <div className="flex items-start justify-between gap-3"><span className="flex size-11 items-center justify-center rounded-xl bg-[#eaf3ed] text-brand-primary"><CircleDollarSign className="size-6" aria-hidden="true" /></span><Dialog.Close asChild><button type="button" disabled={saving} aria-label="Close payment form" className="flex size-10 items-center justify-center rounded-lg text-text-tertiary hover:bg-background-subtle"><X className="size-5" aria-hidden="true" /></button></Dialog.Close></div>
    <Dialog.Title className="mt-4 text-lg font-semibold">{path === "app" ? "Pay in app · Test" : "Log a payment"}</Dialog.Title><Dialog.Description className="mt-1 text-sm leading-5 text-text-secondary">{path === "app" ? `Preview a test payment for ${item.name}. This walkthrough does not send money.` : `Record a payment already made for ${item.name}. This does not send money to the vendor.`}</Dialog.Description>
    <div className="mt-4 rounded-xl border border-border-subtle bg-[#fafafa] p-4"><p className="text-sm font-semibold">{item.vendor || "Vendor not yet added"}</p><div className="mt-3 grid grid-cols-2 gap-3 text-sm"><div><p className="text-text-tertiary">Already paid</p><p className="mt-1 font-semibold tabular-nums">{formatBudgetMoney(item.paid, item.currency)}</p></div><div><p className="text-text-tertiary">Balance left</p><p className="mt-1 font-semibold tabular-nums">{formatBudgetMoney(balance, item.currency)}</p></div></div></div>
    <div role="group" aria-label="Payment path" className="mt-5 grid grid-cols-2 gap-2 rounded-xl border border-border-subtle p-1">{([{ id: "record", label: "Log a payment" }, { id: "app", label: "Pay in app" }] as const).map((option) => <button key={option.id} type="button" aria-pressed={path === option.id} onClick={() => { setPath(option.id); setError(""); }} className={`min-h-11 rounded-lg px-3 text-sm font-semibold ${path === option.id ? "bg-brand-primary text-white" : "text-text-secondary hover:bg-background-subtle"}`}>{option.label}</button>)}</div>
    {path === "app" ? <PaystackTestCheckout item={item} initialAmount={openingAmount} /> : <form onSubmit={(event) => void save(event)} className="mt-5 space-y-4"><div><BudgetAmountInput label={`Payment amount (${item.currency})`} value={amount} onChange={setAmount} /><div className="mt-2 flex flex-wrap gap-2">{[{ share: 1, label: "Full balance" }, { share: .5, label: "50% of balance" }, { share: .25, label: "25% of balance" }].map((chip) => <button key={chip.share} type="button" onClick={() => setAmount(formatBudgetAmountInput(String(Math.round(balance * chip.share * 100) / 100)))} className="min-h-9 rounded-full border border-border-subtle px-3 text-sm font-semibold text-brand-primary hover:border-brand-primary">{chip.label}</button>)}</div></div><div className="grid gap-4 sm:grid-cols-2"><Input label="Payment date" type="date" required max={budgetToday()} value={date} onChange={(event) => setDate(event.target.value)} /><label className="text-sm font-semibold">Payment method<BudgetNativeSelect value={method} onChange={(event) => setMethod(event.target.value as BudgetPayment["method"])} className="mt-2"><option value="bank-transfer">Bank transfer</option><option value="cash">Cash</option><option value="card">Card</option><option value="other">Other</option></BudgetNativeSelect></label></div><Input label="Payment reference" optional maxLength={120} placeholder="Transaction reference or receipt number" value={reference} onChange={(event) => setReference(event.target.value)} /><Textarea label="Note" optional maxLength={500} rows={2} placeholder="e.g. Venue deposit" value={note} onChange={(event) => setNote(event.target.value)} />
      <div className="rounded-xl border border-dashed border-border-strong p-4"><label className="block text-sm font-semibold">Receipt <span className="font-normal text-text-tertiary">Optional</span><input type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" disabled={saving} onChange={(change) => { const file = change.target.files?.[0]; if (file) { const invalid = validateBudgetReceipt(file); if (invalid) setError(invalid); else { setReceipt(file); setError(""); } } change.target.value = ""; }} className="mt-3 block w-full text-sm text-text-secondary" /></label><p className="mt-2 text-sm text-text-tertiary">PDF, JPG, PNG or WebP · Up to 15 MB. Saved beside this item’s documents.</p>{receipt && <div className="mt-3 flex items-center justify-between gap-3 text-sm"><span className="min-w-0 truncate">{receipt.name}</span><button type="button" disabled={saving} onClick={() => setReceipt(null)} className="min-h-9 font-semibold text-brand-primary hover:underline">Remove</button></div>}</div>
      {value > 0 && value <= balance && <p className="rounded-lg bg-[#f2f7f3] px-3 py-2.5 text-sm text-brand-primary">Balance after this payment: <span className="font-semibold tabular-nums">{formatBudgetMoney(Math.max(0, balance - value), item.currency)}</span></p>}{error && <p role="alert" className="text-sm leading-5 text-error">{error}</p>}
      <div className="flex justify-end gap-2 border-t border-border-subtle pt-4"><Button type="button" variant="outline" disabled={saving} onClick={onClose}>Cancel</Button><Button type="submit" disabled={!amount || value <= 0 || !Number.isFinite(value) || !date || saving}>{saving ? "Saving…" : "Log payment"}</Button></div>
    </form>}
  </Dialog.Content></Dialog.Portal></Dialog.Root>;
}
