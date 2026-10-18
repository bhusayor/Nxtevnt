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

export type MilestoneTemplate = {
  id: string;
  name: string;
  description: string;
  milestones: { title: string; description?: string; daysBefore?: number; tasks: { title: string; daysBefore?: number; detail?: string; priority?: "high" | "medium" | "low"; clientVisible?: boolean }[] }[];
};

export const guestCommunicationsMilestone: MilestoneTemplate["milestones"][number] = {
  title: "Guest communications & RSVPs",
  description: "Keep invitations, guest updates and responses moving together.",
  daysBefore: 21,
  tasks: [
    { title: "Draft invitations and the RSVP plan", daysBefore: 60 },
    { title: "Share event details with guests", daysBefore: 35 },
    { title: "Review responses and follow up", daysBefore: 21 },
  ],
};

export const milestoneTemplates: MilestoneTemplate[] = [
  { id: "full", name: "Full planning journey", description: "A thoughtful path from the first conversation to event day.", milestones: [
    { title: "Discovery & direction", daysBefore: 120, tasks: [
      { title: "Gather the client brief and priorities", daysBefore: 120 },
      { title: "Agree on the event vision and scope", daysBefore: 110 },
    ] },
    { title: "Venue & key vendors", daysBefore: 90, tasks: [
      { title: "Shortlist and visit venues", daysBefore: 100 },
      { title: "Confirm the venue booking", daysBefore: 90 },
      { title: "Book priority vendors", daysBefore: 75 },
    ] },
    { title: "Design & decor", daysBefore: 60, tasks: [
      { title: "Gather styling inspiration", daysBefore: 75 },
      { title: "Finalize the colour palette", daysBefore: 65 },
      { title: "Approve the decor direction", daysBefore: 60 },
    ] },
    { title: "Guests & experience", daysBefore: 30, tasks: [
      { title: "Review the guest count and seating plan", daysBefore: 35 },
      { title: "Confirm menu and guest experience", daysBefore: 30 },
    ] },
    guestCommunicationsMilestone,
    { title: "Final preparations", daysBefore: 7, tasks: [
      { title: "Finalize the run of show", daysBefore: 14 },
      { title: "Check in with every vendor", daysBefore: 7 },
      { title: "Share the final event timeline", daysBefore: 3 },
    ] },
  ] },
  { id: "focused", name: "Focused event plan", description: "A lighter structure for a shorter planning window.", milestones: [
    { title: "Plan the essentials", daysBefore: 45, tasks: [
      { title: "Confirm the brief and budget", daysBefore: 45 },
      { title: "Secure the venue", daysBefore: 40 },
    ] },
    { title: "Bring the team together", daysBefore: 25, tasks: [
      { title: "Book vendors and approve costs", daysBefore: 30 },
      { title: "Agree on the styling direction", daysBefore: 25 },
    ] },
    { ...guestCommunicationsMilestone, tasks: guestCommunicationsMilestone.tasks.map((task, index) => ({ ...task, daysBefore: [40, 30, 21][index] })) },
    { title: "Ready for the day", daysBefore: 7, tasks: [
      { title: "Lock guest count and logistics", daysBefore: 14 },
      { title: "Share the final event timeline", daysBefore: 7 },
    ] },
  ] },
];

export function milestoneDueDate(eventDate: string, daysBefore: number) {
  const due = new Date(`${eventDate}T12:00:00`);
  due.setDate(due.getDate() - daysBefore);
  return due.toLocaleDateString("sv-SE");
}
