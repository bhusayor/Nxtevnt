"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { BudgetAmountInput, formatBudgetAmountInput } from "./budget-amount-input";
import { formatBudgetMoney, itemBalance, type BudgetItem } from "@/lib/planner-budget";

/** Local interaction prototype only. Never calls Paystack or writes a budget payment. */
export function PaystackTestCheckout({ item, initialAmount }: { item: BudgetItem; initialAmount?: number }) {
  const balance = itemBalance(item);
  const openingAmount = initialAmount !== undefined && Number.isFinite(initialAmount) && initialAmount > 0 ? Math.min(initialAmount, balance) : balance;
  const [amount, setAmount] = useState(formatBudgetAmountInput(String(openingAmount)));
  const [step, setStep] = useState<"review" | "checkout" | "success" | "declined">("review");
  const [testReference, setTestReference] = useState("");
  const [error, setError] = useState("");
  const value = Number(amount.replaceAll(",", ""));
  const valid = Number.isFinite(value) && value > 0 && value <= balance && Number.isSafeInteger(Math.round(value * 100)) && Math.abs(value * 100 - Math.round(value * 100)) < .001 && item.status !== "cancelled";

  function review(event: FormEvent) {
    event.preventDefault();
    if (!valid) { setError("Enter an amount above zero, no more than the balance, with up to two decimal places."); return; }
    setError(""); setStep("checkout");
  }

  return <section className="mt-5 space-y-4" aria-label="Paystack test payment">
    <div className="rounded-xl border border-[#e5d3a5] bg-[#fffbef] p-4 text-sm leading-6">
      <p className="font-semibold text-[#805d21]">Paystack · Test flow</p>
      <p className="mt-1 text-text-secondary">Test mode. No money moves, no bank or card details are collected, and your paid balance stays unchanged.</p>
    </div>
    {step === "review" && <form onSubmit={review} className="space-y-4">
      <div className="rounded-xl border border-border-subtle p-4 text-sm">
        <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-semibold">{item.vendor || "Vendor"}</h3><span className="rounded-full bg-[#edf4ef] px-2.5 py-1 text-xs font-semibold text-brand-primary">Test mode</span></div>
        <p className="mt-3 text-text-secondary">Test Bank · Account ending 0000</p>
        <p className="mt-1 text-text-tertiary">Placeholder bank details for this walkthrough only.</p>
      </div>
      <BudgetAmountInput label={`Test payment amount (${item.currency})`} value={amount} onChange={setAmount} />
      <div className="flex flex-wrap gap-2">{[{ share: 1, label: "Full balance" }, { share: .5, label: "50% of balance" }, { share: .25, label: "25% of balance" }].map((chip) => <button key={chip.share} type="button" onClick={() => { setAmount(formatBudgetAmountInput(String(Math.round(balance * chip.share * 100) / 100))); setError(""); }} className="min-h-9 rounded-full border border-border-subtle px-3 text-sm font-semibold text-brand-primary hover:border-brand-primary">{chip.label}</button>)}</div>
      {error && <p role="alert" className="text-sm text-error">{error}</p>}
      <Button type="submit" disabled={!valid} className="w-full">Continue to test checkout</Button>
    </form>}
    {step === "checkout" && <div className="space-y-4 rounded-xl border border-border-subtle p-5" aria-label="Test checkout">
      <p className="text-sm font-semibold text-text-secondary">PAYSTACK CHECKOUT PREVIEW</p>
      <p className="text-2xl font-semibold tabular-nums">{formatBudgetMoney(value, item.currency)}</p>
      <p className="text-sm leading-6 text-text-secondary">For {item.name}. Choose a test outcome to preview what happens next.</p>
      <Button type="button" className="w-full" onClick={() => { setTestReference(`TEST-${crypto.randomUUID().slice(0, 8).toUpperCase()}`); setStep("success"); }}>Simulate successful payment</Button>
      <Button type="button" variant="outline" className="w-full" onClick={() => setStep("declined")}>Simulate declined payment</Button>
      <button type="button" onClick={() => setStep("review")} className="min-h-10 w-full text-sm font-semibold text-text-secondary hover:underline">Cancel test checkout</button>
    </div>}
    {step === "success" && <div role="status" className="space-y-3 rounded-xl border border-[#c8dfcf] bg-[#f4f9f5] p-5">
      <h3 className="text-lg font-semibold text-brand-primary">Test payment successful</h3>
      <p className="text-xl font-semibold tabular-nums">{formatBudgetMoney(value, item.currency)}</p>
      <p className="break-all text-sm text-text-secondary">Reference: {testReference}</p>
      <p className="text-sm leading-6 text-text-secondary">No real payment was made. This test has not changed the item’s payments, receipts or balance.</p>
      <Button type="button" variant="outline" onClick={() => setStep("review")}>Run another test</Button>
    </div>}
    {step === "declined" && <div role="status" className="space-y-3 rounded-xl border border-[#ebcccc] bg-[#fff8f7] p-5">
      <h3 className="text-lg font-semibold text-error">Test payment declined</h3>
      <p className="text-sm leading-6 text-text-secondary">This is a simulated failure. Nothing was charged or recorded. You can try again or close this window.</p>
      <Button type="button" variant="outline" onClick={() => setStep("review")}>Try again</Button>
    </div>}
  </section>;
}
