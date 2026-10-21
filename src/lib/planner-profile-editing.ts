import { normalizeInstagram, type PlannerProfile } from "@/lib/planner-profile-types";

export type ProfileEditSection = "Business info" | "Portfolio" | "Services" | "Booking";
export const profileSlug = (value: string) => value.trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");

export function prepareProfileForSave(draft: PlannerProfile): { profile: PlannerProfile; error?: undefined; section?: undefined } | { error: string; section: ProfileEditSection; profile?: undefined } {
  const profile: PlannerProfile = {
    ...draft, brand: draft.brand.trim(), slug: profileSlug(draft.slug), about: draft.about.trim(), location: draft.location.trim(), coverage: draft.coverage.trim(), instagram: normalizeInstagram(draft.instagram), email: draft.email.trim(), phone: draft.phone.trim(), website: draft.website.trim(),
    portfolioFolders: draft.portfolioFolders.map((folder) => ({ ...folder, title: folder.title.trim(), description: folder.description.trim(), photos: folder.photos.map((photo) => ({ ...photo, title: photo.title.trim() })) })),
    packages: draft.packages.map((item) => ({ ...item, title: item.title.trim(), description: item.description.trim() })),
    rateCard: { ...draft.rateCard, lines: draft.rateCard.lines.map((line) => ({ ...line, title: line.title.trim(), description: line.description.trim() })) },
  };
  const fail = (error: string, section: ProfileEditSection = "Business info") => ({ error, section });
  if (!profile.brand) return fail("Add your brand name before saving.");
  if (profile.slug.length < 3 || profile.slug.length > 40) return fail("Choose a profile link with 3–40 letters, numbers or hyphens.");
  if (["planner", "login", "signup", "terms", "api"].includes(profile.slug)) return fail("Choose another profile link name.");
  if (profile.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email)) return fail("Enter a valid business email address.");
  if (profile.instagram && !/^[a-zA-Z0-9._]{1,30}$/.test(profile.instagram)) return fail("Enter a valid Instagram username or profile link.");
  if (profile.phone && !/^\+?[\d\s()-]{7,25}$/.test(profile.phone)) return fail("Enter a valid contact number.");
  if (profile.website && !/^https?:\/\/[^\s.]+\.[^\s]+$/i.test(profile.website)) return fail("Enter a full website address, including https://.");
  if (profile.portfolioFolders.some((folder) => !folder.title)) return fail("Give every portfolio folder a name.", "Portfolio");
  if (profile.packages.some((item) => !item.title)) return fail("Give every package a name, or remove the unused package.", "Services");
  if (profile.rateCard.lines.some((line) => !line.title)) return fail("Give each rate card service a name, or remove the unused service.", "Services");
  const money = [...profile.packages.map((item) => item.price), ...profile.rateCard.lines.map((line) => line.price), profile.consultation.price];
  if (money.some((value) => value && !/^\d{1,13}(\.\d{1,2})?$/.test(value))) return fail("Enter valid prices with up to two decimal places.", "Services");
  return { profile };
}
