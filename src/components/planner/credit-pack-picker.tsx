"use client";

import { ArrowRight, Check, Clock3, Gem, Rocket, CalendarDays, Ticket, type PhosphorIcon } from "@/components/ui/icons";

import { creditPacks, type CreditPackId } from "@/lib/planner-credits";
import { cn } from "@/lib/utils/cn";

const naira = (amount: number) => `₦${amount.toLocaleString("en-NG")}`;

const packStyles: Record<CreditPackId, { icon: PhosphorIcon; surface: string; foreground: string; muted: string; outline: string }> = {
  single: { icon: Ticket, surface: "bg-[#edf4f0]", foreground: "text-[#244e3c]", muted: "text-[#647c6d]", outline: "border-[#85a994]" },
  starter: { icon: CalendarDays, surface: "bg-[#f7f0e6]", foreground: "text-[#765a3b]", muted: "text-[#9f876c]", outline: "border-[#c7a47c]" },
  growth: { icon: Rocket, surface: "bg-[#244e3c]", foreground: "text-white", muted: "text-[#c7dfcd]", outline: "border-[#244e3c]" },
  pro: { icon: Gem, surface: "bg-[#f0eef8]", foreground: "text-[#51466c]", muted: "text-[#82799a]", outline: "border-[#a79ac3]" },
};

type CreditPackPickerProps = {
  balance: number;
  selectedPackId: CreditPackId;
  onSelect: (id: CreditPackId) => void;
  onContinue: () => void;
};

export function CreditPackPicker({ balance, selectedPackId, onSelect, onContinue }: CreditPackPickerProps) {
  const selectedPack = creditPacks.find((pack) => pack.id === selectedPackId)!;
  const savings = selectedPack.originalPrice - selectedPack.price;

  return <div className="space-y-6">
    <section className="relative isolate overflow-hidden rounded-[1.5rem] border border-[#e5e8de] bg-gradient-to-r from-[#f1f6ec] via-[#f9f7ef] to-[#f7eee6] px-6 py-8 sm:px-9 sm:py-10">
      <div className="pointer-events-none absolute -right-20 -top-28 size-72 rounded-full border-[45px] border-white/50" aria-hidden="true" />
      <div className="relative max-w-2xl">
        <span className="inline-flex items-center gap-2 rounded-full border border-[#d7e4d5] bg-white/70 px-3 py-1.5 text-[0.6875rem] font-semibold text-brand-primary"><CalendarDays className="size-3.5" aria-hidden="true" />Room for your next moment</span>
        <h2 className="mt-5 max-w-xl text-[1.75rem] font-semibold leading-tight tracking-[-0.045em] text-text-primary sm:text-[2.25rem]">Every great event starts with a little room to create.</h2>
        <p className="mt-3 max-w-xl text-sm leading-6 text-text-secondary">Choose the number of events you&apos;re planning for. One credit opens one event workspace; purchased credits stay available for 12 months.</p>
      </div>
    </section>

    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_310px] xl:grid-cols-[minmax(0,1fr)_330px]">
      <section aria-labelledby="credit-packs-heading">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-2"><div><p className="text-[0.6875rem] font-bold uppercase tracking-[0.13em] text-brand-primary">A plan for every pace</p><h3 id="credit-packs-heading" className="mt-1 text-lg font-semibold tracking-tight text-text-primary">Choose your credit pack</h3></div><p className="text-xs text-text-tertiary">Select a pack to see your total</p></div>
        <div className="grid gap-4 sm:grid-cols-2">{creditPacks.map((pack, index) => {
          const style = packStyles[pack.id];
          const Icon = style.icon;
          const selected = selectedPackId === pack.id;
          return <button key={pack.id} type="button" aria-pressed={selected} onClick={() => onSelect(pack.id)} className={cn("group relative flex min-h-[236px] w-full flex-col overflow-hidden rounded-[1.25rem] border p-5 text-left transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_30px_-20px_rgba(25,52,38,.4)] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-brand-primary/35 sm:p-6", style.surface, style.foreground, selected ? `${style.outline} shadow-[0_12px_30px_-20px_rgba(25,52,38,.4)] ring-2 ring-brand-primary/15` : "border-transparent") }>
            <div className="flex w-full items-start justify-between gap-2"><span className={cn("flex size-10 items-center justify-center rounded-xl", pack.id === "growth" ? "bg-white/15" : "bg-white/75")}><Icon className="size-5" aria-hidden="true" /></span><span className={cn("flex size-7 items-center justify-center rounded-full border transition-colors", selected ? pack.id === "growth" ? "border-white bg-white text-brand-primary" : "border-brand-primary bg-brand-primary text-white" : pack.id === "growth" ? "border-white/40" : "border-current/30")}>{selected && <Check className="size-4" aria-hidden="true" />}</span></div>
            <div className="mt-4 flex items-baseline gap-2"><span className="text-[2.5rem] font-semibold leading-none tracking-[-0.07em]">{String(pack.count).padStart(2, "0")}</span><span className={cn("text-sm font-medium", style.muted)}>{pack.count === 1 ? "event" : "events"}</span></div>
            <div className="mt-auto pt-5"><div className="flex flex-wrap items-center gap-2"><span className="text-sm font-semibold">{pack.name}</span>{pack.id === "growth" && <span className="rounded-full bg-[#cce5ba] px-2 py-0.5 text-[0.625rem] font-bold uppercase tracking-wide text-[#244e3c]">Popular</span>}{pack.id === "pro" && <span className="rounded-full bg-white/75 px-2 py-0.5 text-[0.625rem] font-bold text-[#51466c]">Best value</span>}</div><div className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-1"><strong className="text-xl tracking-tight">{naira(pack.price)}</strong><span className={cn("text-xs line-through", style.muted)}>{naira(pack.originalPrice)}</span></div><p className={cn("mt-1 text-[0.6875rem]", style.muted)}>{pack.count === 1 ? "For the next one on your calendar" : `${naira(Math.round(pack.price / pack.count))} per event · ${pack.savings}`}</p></div>
            <span className="sr-only">Option {index + 1} of {creditPacks.length}{selected ? ", selected" : ""}</span>
          </button>;
        })}</div>
      </section>

      <aside className="overflow-hidden rounded-[1.25rem] border border-border-subtle bg-white shadow-[0_18px_45px_-35px_rgba(26,57,40,.45)] lg:sticky lg:top-24" aria-label="Selected credit pack summary">
        <div className="border-b border-border-subtle bg-[#f8faf7] px-5 py-5 sm:px-6"><p className="text-[0.6875rem] font-bold uppercase tracking-[0.12em] text-brand-primary">Your selection</p><h3 className="mt-2 text-xl font-semibold tracking-tight text-text-primary">{selectedPack.name}</h3><p className="mt-1 text-xs text-text-secondary">{selectedPack.count} {selectedPack.count === 1 ? "credit" : "credits"} for the moments ahead</p></div>
        <div className="space-y-4 px-5 py-5 sm:px-6"><div className="flex justify-between gap-3 text-xs"><span className="text-text-secondary">Regular price</span><span className="text-text-tertiary line-through">{naira(selectedPack.originalPrice)}</span></div><div className="flex justify-between gap-3 text-xs"><span className="text-text-secondary">Pack savings</span><span className="font-semibold text-[#27875a]">−{naira(savings)}</span></div><div className="border-t border-border-subtle pt-4"><div className="flex items-end justify-between gap-3"><span className="text-sm font-semibold text-text-primary">Total</span><span className="text-2xl font-semibold tracking-tight text-text-primary">{naira(selectedPack.price)}</span></div><p className="mt-1 text-right text-[0.6875rem] text-text-tertiary">{naira(Math.round(selectedPack.price / selectedPack.count))} per event</p></div><div className="rounded-xl bg-[#eef5ef] px-4 py-3 text-xs leading-5 text-[#456b52]">Your balance will go from <strong>{balance}</strong> to <strong>{balance + selectedPack.count} credits</strong> after completion.</div><button type="button" onClick={onContinue} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-brand-primary bg-[image:var(--action-primary-gradient)] hover:bg-[image:var(--action-primary-gradient-hover)] active:bg-[image:var(--action-primary-gradient-active)] px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-primary-hover focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-brand-primary/25">Continue to payment <ArrowRight className="size-4" aria-hidden="true" /></button><p className="text-center text-[0.6875rem] leading-4 text-text-tertiary">Test checkout · No real payment or card details</p></div>
        <div className="flex items-center gap-2 border-t border-border-subtle px-5 py-4 text-[0.6875rem] text-text-secondary sm:px-6"><Clock3 className="size-4 shrink-0 text-brand-primary" aria-hidden="true" />Credits are valid for 12 months from purchase.</div>
      </aside>
    </div>
  </div>;
}
