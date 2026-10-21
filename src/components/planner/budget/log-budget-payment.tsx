"use client";

import { useRef, useState, type FormEvent } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { CircleDollarSign, X } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { BudgetAmountInput, formatBudgetAmountInput } from "./budget-amount-input";
import { BudgetNativeSelect } from "./budget-controls";
import { budgetToday, formatBudgetMoney, itemBalance, recordBudgetPayment, type BudgetItem, type BudgetPayment } from "@/lib/planner-budget";

export function LogBudgetPayment({ item, onClose, onSaved }: { item: BudgetItem; onClose: () => void; onSaved: (item: BudgetItem) => void }) {
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(budgetToday());
  const [method, setMethod] = useState<BudgetPayment["method"]>("bank-transfer");
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const paymentId = useRef<string | null>(null);
  const lock = useRef(false);
  const value = Number(amount.replaceAll(",", ""));
  const balance = itemBalance(item);
  function save(event: FormEvent) {
    event.preventDefault();
    if (lock.current) return;
    lock.current = true; setSaving(true); setError("");
    try {
      paymentId.current ??= crypto.randomUUID();
      const next = recordBudgetPayment(item, { id: paymentId.current, amount: value, date, method, reference, note, createdAt: new Date().toISOString() });
      onSaved(next); onClose();
    } catch (problem) { setError(problem instanceof Error ? problem.message : "This payment couldn’t be saved. Please try again."); }
    finally { lock.current = false; setSaving(false); }
  }
  return <Dialog.Root open onOpenChange={(open) => { if (!open && !saving) onClose(); }}><Dialog.Portal><Dialog.Overlay className="fixed inset-0 z-50 bg-[#10231a]/50 backdrop-blur-[2px]" /><Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl bg-white p-5 shadow-[var(--shadow-lg)] focus:outline-none sm:p-6">
    <div className="flex items-start justify-between gap-3"><span className="flex size-11 items-center justify-center rounded-xl bg-[#eaf3ed] text-brand-primary"><CircleDollarSign className="size-6" aria-hidden="true" /></span><Dialog.Close asChild><button type="button" disabled={saving} aria-label="Close payment form" className="flex size-10 items-center justify-center rounded-lg text-text-tertiary hover:bg-background-subtle"><X className="size-5" aria-hidden="true" /></button></Dialog.Close></div>
    <Dialog.Title className="mt-4 text-lg font-semibold">Log a payment</Dialog.Title><Dialog.Description className="mt-1 text-xs leading-5 text-text-secondary">Record a payment already made for {item.name}. This does not send money to the vendor.</Dialog.Description>
    <div className="mt-4 rounded-xl border border-border-subtle bg-[#fafafa] p-4"><p className="text-xs font-semibold">{item.vendor || "Vendor not yet added"}</p><div className="mt-3 grid grid-cols-2 gap-3 text-xs"><div><p className="text-text-tertiary">Already paid</p><p className="mt-1 font-semibold tabular-nums">{formatBudgetMoney(item.paid, item.currency)}</p></div><div><p className="text-text-tertiary">Balance left</p><p className="mt-1 font-semibold tabular-nums">{formatBudgetMoney(balance, item.currency)}</p></div></div></div>
    <form onSubmit={save} className="mt-5 space-y-4"><div><BudgetAmountInput label={`Payment amount (${item.currency})`} value={amount} onChange={setAmount} /><button type="button" onClick={() => setAmount(formatBudgetAmountInput(String(balance)))} className="mt-2 text-xs font-semibold text-brand-primary hover:underline">Use remaining balance</button></div><div className="grid gap-4 sm:grid-cols-2"><Input label="Payment date" type="date" required max={budgetToday()} value={date} onChange={(event) => setDate(event.target.value)} /><label className="text-xs font-semibold">Payment method<BudgetNativeSelect value={method} onChange={(event) => setMethod(event.target.value as BudgetPayment["method"])} className="mt-2"><option value="bank-transfer">Bank transfer</option><option value="cash">Cash</option><option value="card">Card</option><option value="other">Other</option></BudgetNativeSelect></label></div><Input label="Payment reference" optional maxLength={120} placeholder="Transaction reference or receipt number" value={reference} onChange={(event) => setReference(event.target.value)} /><Textarea label="Note" optional maxLength={500} rows={2} placeholder="e.g. Venue deposit" value={note} onChange={(event) => setNote(event.target.value)} />
      {value > 0 && value <= balance && <p className="rounded-lg bg-[#f2f7f3] px-3 py-2.5 text-xs text-brand-primary">Balance after this payment: <span className="font-semibold tabular-nums">{formatBudgetMoney(Math.max(0, balance - value), item.currency)}</span></p>}{error && <p role="alert" className="text-xs leading-5 text-error">{error}</p>}
      <div className="flex justify-end gap-2 border-t border-border-subtle pt-4"><Button type="button" variant="outline" disabled={saving} onClick={onClose}>Cancel</Button><Button type="submit" disabled={!amount || value <= 0 || !Number.isFinite(value) || !date || saving}>{saving ? "Saving…" : "Log payment"}</Button></div>
    </form>
  </Dialog.Content></Dialog.Portal></Dialog.Root>;
}
