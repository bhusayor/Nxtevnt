import type { PlannerInquiry } from "./planner-business";
import { currencies, formatBudgetMoney } from "./planner-budget";
import { formatEventDate } from "./planner-events";

export const inquiryServices = ["Full planning", "Venue sourcing", "Décor & styling", "Vendor coordination"];
const text = (value: unknown) => typeof value === "string" ? value.trim() : "";
function validDay(value: string) { return /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(`${value}T12:00:00Z`)) && new Date(`${value}T12:00:00Z`).toISOString().slice(0, 10) === value; }
export function inquiryPhone(value: unknown) {
  const input = text(value); if (!/^(?:\+|00)[\d\s().-]+$/.test(input)) return null;
  const phone = input.replace(/^00/, "+").replace(/[\s().-]/g, "");
  return /^\+[1-9]\d{7,14}$/.test(phone) ? phone : null;
}
export function inquiryContactLinks(inquiry: PlannerInquiry) {
  const phone = inquiryPhone(inquiry.phone), email = text(inquiry.email);
  return {
    call: phone ? `tel:${phone}` : null,
    whatsapp: phone ? `https://wa.me/${phone.slice(1)}?text=${encodeURIComponent(`Hi ${inquiry.name}, thanks for your inquiry about ${inquiry.subject}.`)}` : null,
    email: /^[^\s@?&#]+@[^\s@?&#]+\.[^\s@?&#]+$/.test(email) ? `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(`Re: ${inquiry.subject}`)}` : null,
  };
}
export function inquiryFacts(inquiry: PlannerInquiry) {
  // Only recover the explicitly labelled date from older records. Never infer event facts from prose.
  const date = text(inquiry.eventDate) || text(inquiry.message).match(/(?:^|\n)Preferred date:\s*(\d{4}-\d{2}-\d{2})(?:\s|$)/)?.[1] || "";
  const received = text(inquiry.createdAt).slice(0, 10);
  const guests = inquiry.guestCount;
  return {
    received: validDay(received) ? formatEventDate(received, { day: "numeric", month: "short", year: "numeric" }) : "Date not provided",
    eventType: text(inquiry.eventType) || "Not provided",
    eventDate: validDay(date) ? formatEventDate(date, { day: "numeric", month: "short", year: "numeric" }) : "Not provided",
    location: text(inquiry.location) || "Not provided",
    guests: typeof guests === "number" && Number.isSafeInteger(guests) && guests > 0 ? `${guests.toLocaleString("en-NG")} guests` : "Not provided",
    receivedVia: text(inquiry.receivedVia) || "Not provided",
    services: Array.isArray(inquiry.services) ? inquiry.services.filter((s): s is string => typeof s === "string" && Boolean(s.trim())).map(s => s.trim()) : [],
  };
}
export function inquiryBudget(inquiry: PlannerInquiry) {
  const currency = currencies.some(c => c.code === inquiry.currency) ? inquiry.currency! : "NGN";
  const valid = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value) && value >= 0;
  const min = valid(inquiry.budgetMin) ? inquiry.budgetMin : null, max = valid(inquiry.budgetMax) ? inquiry.budgetMax : null;
  if (min !== null && max !== null) return max < min ? "Not provided" : min === max ? formatBudgetMoney(min, currency) : `${formatBudgetMoney(min, currency)} – ${formatBudgetMoney(max, currency)}`;
  return min !== null ? `From ${formatBudgetMoney(min, currency)}` : max !== null ? `Up to ${formatBudgetMoney(max, currency)}` : "Not provided";
}
export function prepareInquiryDetails(input: { eventDate: string; location: string; phone: string; guestCount: string; budgetMin: string; budgetMax: string; currency: string; services: string[] }) {
  const eventDate = input.eventDate.trim(), location = input.location.trim(), phone = input.phone.trim();
  if (eventDate && !validDay(eventDate)) throw Error("Choose a valid event date.");
  if (location.length > 250) throw Error("Keep the location under 250 characters.");
  if (phone && !inquiryPhone(phone)) throw Error("Add a phone number with its country code, for example +234.");
  const number = (value: string, label: string) => { if (!value.trim()) return undefined; const n = Number(value); if (!Number.isFinite(n) || n < 0 || n > Number.MAX_SAFE_INTEGER) throw Error(`Add a valid ${label}.`); return n; };
  const guestCount = number(input.guestCount, "guest count"), budgetMin = number(input.budgetMin, "minimum budget"), budgetMax = number(input.budgetMax, "maximum budget");
  if (guestCount !== undefined && (!Number.isInteger(guestCount) || guestCount < 1)) throw Error("Guest count must be a whole number greater than zero.");
  if (budgetMin !== undefined && budgetMax !== undefined && budgetMax < budgetMin) throw Error("The maximum budget must be at least the minimum budget.");
  if (!currencies.some(c => c.code === input.currency)) throw Error("Choose a supported budget currency.");
  if (input.services.length > 20 || input.services.some(s => typeof s !== "string" || s.length > 250)) throw Error("Choose valid planning services.");
  return { eventDate: eventDate || undefined, location: location || undefined, phone: phone ? inquiryPhone(phone)! : undefined, guestCount, budgetMin, budgetMax, currency: input.currency, services: [...new Set(input.services.map(s => s.trim()).filter(Boolean))] };
}
