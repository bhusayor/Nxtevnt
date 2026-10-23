"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Check, ChevronDown, CreditCard, LoaderCircle, Search, X } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { currencies } from "@/lib/planner-budget";
import type { ProfileCurrency } from "@/lib/planner-profile-types";
import { cn } from "@/lib/utils/cn";
import type { ProfileUpdate } from "./profile-fields";

const banks: Record<ProfileCurrency, string[]> = {
  NGN: ["Access Bank", "Fidelity Bank", "First Bank of Nigeria", "FCMB", "Guaranty Trust Bank", "Kuda", "Moniepoint", "OPay", "Palmpay", "Stanbic IBTC Bank", "Sterling Bank", "United Bank for Africa", "Union Bank", "Wema Bank", "Zenith Bank"],
  USD: ["Bank of America", "Chase", "Citibank", "HSBC", "Wise"],
  GBP: ["Barclays", "HSBC", "Lloyds Bank", "Monzo", "NatWest", "Revolut", "Wise"],
  EUR: ["BNP Paribas", "Deutsche Bank", "N26", "Revolut", "Santander", "Wise"],
};

function BankPicker({ currency, value, onChange }: { currency: ProfileCurrency; value: string; onChange: (value: string) => void }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); };
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") { event.stopPropagation(); setOpen(false); } };
    document.addEventListener("pointerdown", close); document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("pointerdown", close); document.removeEventListener("keydown", escape); };
  }, [open]);
  const matches = banks[currency].filter((bank) => bank.toLowerCase().includes(search.toLowerCase()));
  return <div ref={root} className="relative"><p className="mb-1.5 text-sm font-medium">Bank name</p><button type="button" aria-expanded={open} aria-label="Choose bank" onClick={() => setOpen(!open)} className="flex h-10 w-full items-center justify-between rounded-lg border border-border-default px-3 text-left text-sm"><span className={value ? "" : "text-text-tertiary"}>{value || "Choose your bank"}</span><ChevronDown className="size-4 text-text-tertiary" /></button>{open && <div className="absolute inset-x-0 top-[calc(100%+6px)] z-20 rounded-xl border border-border-subtle bg-white p-2 shadow-xl"><div className="relative"><Search className="absolute left-3 top-3 size-4 text-text-tertiary" /><input autoFocus type="search" aria-label="Search banks" placeholder="Search bank names" value={search} onChange={(event) => setSearch(event.target.value)} className="h-10 w-full rounded-lg border border-border-default pl-9 pr-3 text-xs outline-none focus:border-brand-primary" /></div><div className="mt-1 max-h-44 overflow-y-auto">{matches.map((bank) => <button key={bank} type="button" onClick={() => { onChange(bank); setOpen(false); setSearch(""); }} className={cn("flex min-h-10 w-full items-center justify-between rounded-lg px-3 text-left text-xs hover:bg-[#f5f5f5]", value === bank && "bg-[#f5f5f5] font-semibold text-brand-primary")}>{bank}{value === bank && <Check className="size-3.5" />}</button>)}{!matches.length && <p className="p-3 text-xs text-text-tertiary">No matching bank. Try another name.</p>}</div></div>}</div>;
}

export function BankAccountDialog({ currency: initialCurrency, update }: { currency: ProfileCurrency; update: ProfileUpdate }) {
  const [open, setOpen] = useState(false);
  const [currency, setCurrency] = useState(initialCurrency);
  const [bank, setBank] = useState("");
  const [number, setNumber] = useState("");
  // Sensitive identity details are transient: never include BVN in saved profile data.
  const [bvn, setBvn] = useState("");
  const [accountName, setAccountName] = useState("");
  const [error, setError] = useState("");
  const eligible = Boolean(bank) && (currency === "NGN"
    ? /^\d{10}$/.test(number) && /^\d{11}$/.test(bvn)
    : /^[A-Z0-9]{8,34}$/.test(number));
  const checking = open && eligible && !accountName;

  useEffect(() => {
    if (!eligible || !open) return;
    // Prototype only. Replace with a server-side bank/BVN verification provider.
    // This response deliberately cannot be mistaken for a verified account owner.
    const timer = window.setTimeout(() => setAccountName("TEST ACCOUNT HOLDER"), 900);
    return () => window.clearTimeout(timer);
  }, [eligible, bank, number, bvn, currency, open]);

  function changeOpen(value: boolean) {
    setBvn(""); setAccountName(""); setError("");
    if (value) { setCurrency(initialCurrency); setBank(""); setNumber(""); }
    setOpen(value);
  }

  function invalidate() { setAccountName(""); setError(""); }

  function save(event: FormEvent) {
    event.preventDefault();
    if (!eligible || !accountName || checking) {
      setError(currency === "NGN" ? "Choose a bank, enter 10 account digits and 11 BVN digits, then wait for the check." : "Choose a bank and enter a valid account number, then wait for the check.");
      return;
    }
    const account = { id: crypto.randomUUID(), currency, bank, number, name: accountName, verification: "preview" as const };
    const saved = update((current) => ({ ...current, accounts: [...current.accounts, account], consultation: current.consultation.currency === currency ? { ...current.consultation, bankAccountId: account.id } : current.consultation }));
    if (saved) changeOpen(false);
    else setError("Your account couldn’t be saved. Please try again.");
  }

  return <Dialog.Root open={open} onOpenChange={changeOpen}>
    <Dialog.Trigger asChild><button type="button" className="inline-flex min-h-9 items-center text-xs font-semibold text-brand-primary underline-offset-4 hover:underline focus-visible:rounded focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-primary">Add new bank account</button></Dialog.Trigger>
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-50 bg-[#12251b]/50 backdrop-blur-sm" />
      <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90dvh] w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl bg-white p-6">
        <div className="flex items-start justify-between gap-3">
          <span className="flex size-11 items-center justify-center rounded-2xl bg-[#f5f5f5] text-text-secondary"><CreditCard className="size-5" /></span>
          <Dialog.Close aria-label="Close bank account form" className="flex size-8 items-center justify-center rounded-lg hover:bg-background-subtle"><X className="size-4" /></Dialog.Close>
        </div>
        <Dialog.Title className="mt-4 text-lg font-semibold">Add bank account</Dialog.Title>
        <Dialog.Description className="mt-1 text-xs leading-5 text-text-secondary">Choose where consultation payments should go.</Dialog.Description>
        <form onSubmit={save} className="mt-5 space-y-4">
          <Select label="Account currency" value={currency} onValueChange={(value) => { invalidate(); setCurrency(value as ProfileCurrency); setBank(""); setNumber(""); setBvn(""); }} options={currencies.map((item) => ({ value: item.code, label: item.label }))} />
          <BankPicker currency={currency} value={bank} onChange={(value) => { invalidate(); setBank(value); }} />
          <Input label={currency === "NGN" ? "Account number" : "Account number / IBAN"} required autoComplete="off" inputMode={currency === "NGN" ? "numeric" : "text"} pattern={currency === "NGN" ? "[0-9]{10}" : "[A-Z0-9]{8,34}"} maxLength={currency === "NGN" ? 10 : 34} placeholder={currency === "NGN" ? "10-digit account number" : "Your account number or IBAN"} value={number} onChange={(event) => { invalidate(); setNumber(event.target.value.replace(currency === "NGN" ? /\D/g : /[^A-Z0-9]/gi, "").toUpperCase()); }} />
          {currency === "NGN" && <div><Input label="Bank Verification Number (BVN)" type="password" required autoComplete="off" inputMode="numeric" pattern="[0-9]{11}" maxLength={11} placeholder="11-digit BVN" value={bvn} onChange={(event) => { invalidate(); setBvn(event.target.value.replace(/\D/g, "")); }} /><p className="mt-1.5 text-[0.6875rem] leading-5 text-text-tertiary">Your BVN is not saved to your profile.</p></div>}
          <div role="status" aria-live="polite" className="rounded-xl border border-border-subtle bg-[#fafafa] p-4">
            <div className="flex items-center justify-between gap-3"><span className="text-xs font-medium text-text-secondary">Account check</span><span className="rounded-full border border-border-default bg-white px-2 py-0.5 text-[0.625rem] font-medium text-text-secondary">Test mode · no live verification</span></div>
            {checking ? <p className="mt-3 flex items-center gap-2 text-sm text-text-secondary"><LoaderCircle className="size-4 motion-safe:animate-spin" aria-hidden="true" />Checking…</p> : accountName ? <p className="mt-3 text-sm font-semibold">{accountName}</p> : <p className="mt-3 text-xs leading-5 text-text-tertiary">{currency === "NGN" ? "Enter your bank, account number and BVN to check the account." : "Enter your bank and account number to check the account."}</p>}
          </div>
          {error && <p role="alert" className="text-xs text-error">{error}</p>}
          <div className="flex justify-end gap-2 pt-2"><Button size="sm" type="button" variant="outline" onClick={() => changeOpen(false)}>Cancel</Button><Button size="sm" type="submit" disabled={!eligible || checking || !accountName}>Save account</Button></div>
        </form>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}
