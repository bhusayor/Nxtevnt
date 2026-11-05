import { budgetTemplates, estimateBudget, type BudgetTemplate } from "@/lib/event-setup-templates";
import type { ProposalGroup } from "@/lib/budget-proposals";

const premiumTemplates: BudgetTemplate[] = [
  { id: "premium-wedding", name: "Signature wedding", description: "A fuller wedding plan with guest experience, production and finishing touches.", baselineGuests: 150, items: [
    { group: "Venue & Rentals", name: "Venue hire and setup", base: 3000000, perGuest: 0 },
    { group: "Venue & Rentals", name: "Guest seating and rentals", base: 350000, perGuest: 3500 },
    { group: "Catering & Drinks", name: "Reception catering", base: 400000, perGuest: 32000 },
    { group: "Catering & Drinks", name: "Drinks and service", base: 180000, perGuest: 9000 },
    { group: "Decor & Styling", name: "Ceremony and reception styling", base: 2100000, perGuest: 2500 },
    { group: "Photography & Video", name: "Photography and film", base: 1850000, perGuest: 0 },
    { group: "Music & Entertainment", name: "Music and entertainment", base: 1400000, perGuest: 0 },
    { group: "Guest Experience", name: "Guest welcome and favours", base: 200000, perGuest: 4500 },
    { group: "Planning & Coordination", name: "Event day coordination", base: 900000, perGuest: 0 },
  ] },
  { id: "premium-corporate", name: "Flagship corporate event", description: "Production, hospitality and coverage for a larger company gathering.", baselineGuests: 120, items: [
    { group: "Venue & Rentals", name: "Venue and technical equipment", base: 2800000, perGuest: 1800 },
    { group: "Catering & Drinks", name: "Guest hospitality", base: 300000, perGuest: 21000 },
    { group: "Production", name: "Stage, sound and lighting", base: 1800000, perGuest: 0 },
    { group: "Logistics & Transport", name: "Transport and logistics", base: 1000000, perGuest: 2000 },
    { group: "Stationery & Printing", name: "Branding and signage", base: 750000, perGuest: 1200 },
    { group: "Photography & Video", name: "Photography and video coverage", base: 950000, perGuest: 0 },
    { group: "Planning & Coordination", name: "Production management", base: 850000, perGuest: 0 },
  ] },
  { id: "premium-celebration", name: "Signature celebration", description: "A party plan with layered styling, entertainment and guest touches.", baselineGuests: 80, items: [
    { group: "Venue & Rentals", name: "Venue and guest rentals", base: 1500000, perGuest: 2200 },
    { group: "Catering & Drinks", name: "Food and drinks", base: 250000, perGuest: 25000 },
    { group: "Decor & Styling", name: "Decor and floral styling", base: 1150000, perGuest: 3000 },
    { group: "Music & Entertainment", name: "Live entertainment", base: 1050000, perGuest: 0 },
    { group: "Photography & Video", name: "Photo and video coverage", base: 750000, perGuest: 0 },
    { group: "Guest Experience", name: "Guest welcome and favours", base: 125000, perGuest: 3500 },
    { group: "Planning & Coordination", name: "Event day coordination", base: 550000, perGuest: 0 },
  ] },
];

export const proposalStartingTemplates = [
  ...budgetTemplates.map((template) => ({ template, premium: false })),
  ...premiumTemplates.map((template) => ({ template, premium: true })),
];

export function proposalGroupsFromTemplate(template: BudgetTemplate, guestCount: string | undefined, currency: string): ProposalGroup[] {
  const parsedGuests = Number(guestCount);
  const guests = Number.isSafeInteger(parsedGuests) && parsedGuests > 0 ? parsedGuests : template.baselineGuests;
  const groups = new Map<string, ProposalGroup>();
  for (const item of estimateBudget(template, guests)) {
    const group = groups.get(item.group) ?? { id: crypto.randomUUID(), name: item.group, items: [] };
    group.items.push({ id: crypto.randomUUID(), name: item.name, vendor: "", description: "", pricedAs: "flat-fee", quantity: 1, unitPrice: currency === "NGN" ? item.amount : 0 });
    groups.set(item.group, group);
  }
  return [...groups.values()];
}
