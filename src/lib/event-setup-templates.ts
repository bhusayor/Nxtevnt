export type BudgetTemplate = {
  id: string;
  name: string;
  description: string;
  baselineGuests: number;
  items: { group: string; name: string; base: number; perGuest: number }[];
};

export const budgetTemplates: BudgetTemplate[] = [
  { id: "wedding", name: "Wedding celebration", description: "Reception, food, styling and the moments in between.", baselineGuests: 150, items: [
    { group: "Venue & Rentals", name: "Venue and rentals", base: 2200000, perGuest: 2500 },
    { group: "Catering & Drinks", name: "Catering and drinks", base: 300000, perGuest: 26000 },
    { group: "Decor & Styling", name: "Florals and styling", base: 1450000, perGuest: 3500 },
    { group: "Photography & Video", name: "Photography and film", base: 1250000, perGuest: 0 },
    { group: "Music & Entertainment", name: "Music and entertainment", base: 950000, perGuest: 0 },
  ] },
  { id: "celebration", name: "Birthday & celebration", description: "A warm starting point for a memorable party.", baselineGuests: 80, items: [
    { group: "Venue & Rentals", name: "Venue and rentals", base: 900000, perGuest: 1500 },
    { group: "Catering & Drinks", name: "Food and drinks", base: 150000, perGuest: 19000 },
    { group: "Decor & Styling", name: "Decor and styling", base: 650000, perGuest: 2500 },
    { group: "Music & Entertainment", name: "DJ and entertainment", base: 500000, perGuest: 0 },
    { group: "Photography & Video", name: "Photography", base: 400000, perGuest: 0 },
  ] },
  { id: "corporate", name: "Corporate gathering", description: "The essentials for a conference or company event.", baselineGuests: 120, items: [
    { group: "Venue & Rentals", name: "Venue and equipment", base: 1800000, perGuest: 1800 },
    { group: "Catering & Drinks", name: "Guest hospitality", base: 200000, perGuest: 15500 },
    { group: "Logistics & Transport", name: "Production and logistics", base: 1200000, perGuest: 1500 },
    { group: "Stationery & Printing", name: "Signage and print", base: 500000, perGuest: 1100 },
    { group: "Photography & Video", name: "Event coverage", base: 550000, perGuest: 0 },
  ] },
];

export function estimateBudget(template: BudgetTemplate, guests: number) {
  return template.items.map((item) => ({ ...item, amount: item.base + item.perGuest * guests }));
}

export const milestoneTemplates = [
  { id: "full", name: "Full planning journey", description: "From the first brief through event week.", milestones: [
    { title: "Confirm the brief and priorities", daysBefore: 120 },
    { title: "Shortlist and confirm the venue", daysBefore: 90 },
    { title: "Book key vendors", daysBefore: 60 },
    { title: "Review the budget and guest plan", daysBefore: 30 },
    { title: "Finalize the run of show", daysBefore: 14 },
    { title: "Complete the final vendor check-in", daysBefore: 7 },
  ] },
  { id: "focused", name: "Focused event plan", description: "A lean checklist for shorter planning windows.", milestones: [
    { title: "Confirm scope and venue", daysBefore: 45 },
    { title: "Book vendors and approve costs", daysBefore: 30 },
    { title: "Lock guest count and logistics", daysBefore: 14 },
    { title: "Share the final event timeline", daysBefore: 7 },
  ] },
];

export function milestoneDueDate(eventDate: string, daysBefore: number) {
  const due = new Date(`${eventDate}T12:00:00`);
  due.setDate(due.getDate() - daysBefore);
  return due.toLocaleDateString("sv-SE");
}
