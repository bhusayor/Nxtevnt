export type PricedAs = "flat-fee" | "per-guest" | "per-quantity" | "per-trip";

export const pricingOptions: { value: PricedAs; label: string }[] = [
  { value: "flat-fee", label: "Flat fee" },
  { value: "per-guest", label: "Per guest" },
  { value: "per-quantity", label: "Per quantity" },
  { value: "per-trip", label: "Per trip" },
];
export const countLabels: Record<PricedAs, string> = { "flat-fee": "", "per-guest": "Number of guests", "per-quantity": "Quantity", "per-trip": "Number of trips" };
export const rateLabels: Record<PricedAs, string> = { "flat-fee": "Price", "per-guest": "Price per guest", "per-quantity": "Price per unit", "per-trip": "Price per trip" };
export function itemPricing(item: { pricedAs?: PricedAs; quantity?: number }): PricedAs {
  return item.pricedAs ?? (item.quantity !== undefined && item.quantity !== 1 ? "per-quantity" : "flat-fee");
}
export function pricingDescription(item: { pricedAs?: PricedAs; quantity: number; unitPrice: number }, money: (value: number) => string) {
  const kind = itemPricing(item);
  if (kind === "flat-fee") return "Flat fee";
  const unit = kind === "per-guest" ? "guest" : kind === "per-trip" ? "trip" : "unit";
  return `${item.quantity.toLocaleString()} ${unit}${item.quantity === 1 ? "" : "s"} × ${money(item.unitPrice)}`;
}
