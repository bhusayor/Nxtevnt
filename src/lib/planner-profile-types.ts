export type ProfileCurrency = "NGN" | "USD" | "GBP" | "EUR";
export type ProfilePhoto = { id: string; src: string; title: string };
export type PortfolioFolder = { id: string; title: string; description: string; cover: string; photos: ProfilePhoto[] };

export function normalizePortfolioFolders(value: unknown, legacyPhotos?: unknown): PortfolioFolder[] {
  const photos = (items: unknown): ProfilePhoto[] => Array.isArray(items) ? items.filter((item): item is ProfilePhoto => Boolean(item && typeof item.id === "string" && typeof item.src === "string" && item.src)).map((item) => ({ id: item.id, src: item.src, title: typeof item.title === "string" ? item.title : "" })) : [];
  if (Array.isArray(value)) return value.filter((item) => item && typeof item.id === "string").map((item) => {
    const images = photos(item.photos);
    return { id: item.id, title: typeof item.title === "string" && item.title.trim() ? item.title : "Untitled project", description: typeof item.description === "string" ? item.description : "", cover: typeof item.cover === "string" && item.cover ? item.cover : images[0]?.src || "", photos: images };
  });
  const previous = photos(legacyPhotos);
  return previous.length ? [{ id: "portfolio-previous-work", title: "Previous work", description: "", cover: previous[0].src, photos: previous }] : [];
}
export type ProfilePackage = { id: string; title: string; description: string; currency: ProfileCurrency; price: string; startingFrom: boolean };
export type RateCardLine = { id: string; title: string; description: string; price: string; unit: string };
export type ProfileDocument = { id: string; name: string; type: string; size: number };
export type PlannerBankAccount = { id: string; currency: ProfileCurrency; bank: string; number: string; name: string; verification: "preview" | "manual" };
export type ConsultationSettings = { enabled: boolean; duration: 30 | 60; location: "video" | "phone" | "in-person"; address: string; paid: boolean; currency: ProfileCurrency; price: string; bankAccountId: string };
export type BookingSettings = { requestToBook: boolean; instantBook: boolean; deposit: 25 | 50 | 100; cancellation: string; terms: string; showAvailability: boolean; blockedDates: string[] };
export type ProfileReview = { id: string; author: string; rating: number; body: string; createdAt: string };
export type ProfileMetric = { id: string; type: "view" | "contact" | "portfolio"; at: string };
export type PlannerProfile = {
  brand: string; location: string; coverage: string; instagram: string; specialties: string[]; about: string;
  slug: string; email: string; phone: string; website: string; banner: string; logo: string;
  portfolio: ProfilePhoto[]; portfolioFolders: PortfolioFolder[]; packages: ProfilePackage[];
  rateCard: { mode: "upload" | "create"; currency: ProfileCurrency; document: ProfileDocument | null; lines: RateCardLine[]; note: string };
  consultation: ConsultationSettings; accounts: PlannerBankAccount[]; booking: BookingSettings; reviews: ProfileReview[];
};

export const samplePlannerProfile: PlannerProfile = {
  brand: "Amara & Co. Events", location: "Lekki, Lagos, Nigeria", coverage: "Lagos, Abuja & destination celebrations", instagram: "amara.events.example",
  specialties: ["Wedding", "Corporate", "Private parties"],
  about: "We plan celebrations that feel like you. From intimate gatherings to beautifully considered weddings and brand experiences, we bring the people, details and moving parts together with a calm, personal approach.",
  slug: "amara-co-events", email: "hello@amaraevents.example", phone: "", website: "", banner: "/images/design-system/event-garden-reception.png", logo: "",
  portfolio: [], portfolioFolders: [],
  packages: [
    { id: "sample-wedding", title: "The wedding edit", description: "Full planning, vendor coordination and thoughtful support from the first conversation to the last guest.", currency: "NGN", price: "1500000", startingFrom: true },
    { id: "sample-corporate", title: "Corporate, thoughtfully planned", description: "A complete planning service for launches, company celebrations and memorable brand experiences.", currency: "NGN", price: "750000", startingFrom: true },
  ],
  rateCard: { mode: "create", currency: "NGN", document: null, lines: [], note: "" },
  consultation: { enabled: false, duration: 30, location: "video", address: "", paid: false, currency: "NGN", price: "", bankAccountId: "" },
  accounts: [], booking: { requestToBook: false, instantBook: false, deposit: 50, cancellation: "", terms: "", showAvailability: true, blockedDates: [] }, reviews: [],
};

export const specialtyColors = ["bg-[#eaf2e1] text-[#5c793c] border-[#dbe8cc]", "bg-[#e8f1fa] text-[#527a9b] border-[#d6e6f5]", "bg-[#f5eafa] text-[#8c629e] border-[#e9d8f0]", "bg-[#fff1de] text-[#a47a3c] border-[#f2e0c1]", "bg-[#fceaea] text-[#ad7272] border-[#f2d8d8]"];
export function specialtyTone(value: string) { return specialtyColors[[...value].reduce((sum, letter) => sum + letter.charCodeAt(0), 0) % specialtyColors.length]; }
export function normalizeInstagram(value: string) { return value.trim().replace(/^https?:\/\/(www\.)?instagram\.com\//i, "").replace(/^@/, "").replace(/\/$/, ""); }
