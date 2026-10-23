"use client";

import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { BudgetAmountInput } from "./budget-amount-input";
import { countLabels, pricingOptions, rateLabels, type PricedAs } from "@/lib/budget-pricing";
import { cn } from "@/lib/utils/cn";

export function PricingFields({ pricedAs, quantity, price, currency, onChange, guestCount }: { pricedAs: PricedAs; quantity: string; price: string; currency: string; guestCount?: string; onChange: (change: { pricedAs?: PricedAs; quantity?: string; price?: string }) => void }) {
  return <div className={cn("grid items-start gap-3", pricedAs === "flat-fee" ? "sm:grid-cols-2" : "sm:grid-cols-3")}>
    <Select label="Priced as" value={pricedAs} onValueChange={(value) => onChange({ pricedAs: value as PricedAs, ...(value === "flat-fee" ? { quantity: "1" } : value === "per-guest" ? { quantity: guestCount || "0" } : {}) })} options={pricingOptions} />
    {pricedAs !== "flat-fee" && <Input label={countLabels[pricedAs]} required type="number" min={pricedAs === "per-quantity" ? "0.001" : "1"} step={pricedAs === "per-quantity" ? "any" : "1"} readOnly={pricedAs === "per-guest"} helperText={pricedAs === "per-guest" ? Number(guestCount) > 0 ? "From this event’s guest count. Change it in Edit event." : "Set the event’s guest count before pricing per guest." : undefined} value={pricedAs === "per-guest" ? guestCount || "0" : quantity} onChange={(event) => onChange({ quantity: event.target.value })} />}
    <BudgetAmountInput label={`${rateLabels[pricedAs]} (${currency})`} value={price} onChange={(value) => onChange({ price: typeof value === "function" ? value(price) : value })} />
  </div>;
}
