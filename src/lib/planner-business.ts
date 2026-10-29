"use client";

import { useSyncExternalStore } from "react";
import { normalizePortfolioFolders, samplePlannerProfile, type PlannerProfile, type ProfileMetric } from "@/lib/planner-profile-types";
export type { PlannerProfile } from "@/lib/planner-profile-types";

export type PlannerInquiry = {
  id: string; name: string; email: string; subject: string; message: string; createdAt: string; status: "open" | "closed";
  eventType?: string; eventId?: string; senderType?: "client" | "vendor";
  eventDate?: string; location?: string; guestCount?: number; phone?: string;
  budgetMin?: number; budgetMax?: number; currency?: string; services?: string[]; receivedVia?: string; requestDetail?: string;
};
const profileKey = "nxtevnt.planner.profile.v1";
const inquiryKey = "nxtevnt.planner.inquiries.v1";
const change = "nxtevnt:planner-business-changed";
const emptyProfile: PlannerProfile = samplePlannerProfile;
const emptyInquiries: readonly PlannerInquiry[] = [];
let profileRaw: string | null | undefined;
let cachedProfile = emptyProfile;
let inquiryRaw: string | null | undefined;
let cachedInquiries: readonly PlannerInquiry[] = emptyInquiries;

function read(key: string) { try { return window.localStorage.getItem(key); } catch { return null; } }
function subscribe(callback: () => void) {
  window.addEventListener(change, callback); window.addEventListener("storage", callback); window.addEventListener("nxtevnt-verification-change", callback);
  return () => { window.removeEventListener(change, callback); window.removeEventListener("storage", callback); window.removeEventListener("nxtevnt-verification-change", callback); };
}
function profileSnapshot() {
  const raw = read(profileKey);
  if (raw === profileRaw) return cachedProfile;
  profileRaw = raw;
  try {
    const parsed = JSON.parse(raw || "null");
    cachedProfile = parsed && typeof parsed === "object" ? {
      ...emptyProfile, ...parsed,
      ...Object.fromEntries(["brand", "location", "coverage", "instagram", "about", "slug", "email", "phone", "website", "banner", "logo"].map((field) => [field, typeof parsed[field] === "string" ? parsed[field] : emptyProfile[field as keyof PlannerProfile]])),
      specialties: Array.isArray(parsed.specialties) ? parsed.specialties.filter((value: unknown) => typeof value === "string") : emptyProfile.specialties,
      portfolio: [], portfolioFolders: normalizePortfolioFolders(parsed.portfolioFolders, parsed.portfolio), packages: Array.isArray(parsed.packages) ? parsed.packages : emptyProfile.packages,
      accounts: Array.isArray(parsed.accounts) ? parsed.accounts : [], reviews: Array.isArray(parsed.reviews) ? parsed.reviews : [],
      consultation: { ...emptyProfile.consultation, ...parsed.consultation }, booking: { ...emptyProfile.booking, ...parsed.booking }, rateCard: { ...emptyProfile.rateCard, ...parsed.rateCard },
    } : emptyProfile;
  } catch { cachedProfile = emptyProfile; }
  return cachedProfile;
}
function inquirySnapshot() {
  const raw = read(inquiryKey);
  if (raw === inquiryRaw) return cachedInquiries;
  inquiryRaw = raw;
  try { const parsed = JSON.parse(raw || "[]"); cachedInquiries = Array.isArray(parsed) ? parsed.filter((item): item is PlannerInquiry => item && typeof item.id === "string" && typeof item.subject === "string" && typeof item.name === "string" && typeof item.createdAt === "string" && ["open", "closed"].includes(item.status)) : emptyInquiries; }
  catch { cachedInquiries = emptyInquiries; }
  return cachedInquiries;
}
export function usePlannerProfile() { return useSyncExternalStore(subscribe, profileSnapshot, () => emptyProfile); }
export function useHasSavedPlannerProfile() { return useSyncExternalStore(subscribe, () => Boolean(read(profileKey)), () => false); }
export function savePlannerProfile(profile: PlannerProfile) {
  window.localStorage.setItem(profileKey, JSON.stringify(profile)); profileRaw = undefined; window.dispatchEvent(new Event(change));
}
export function updatePlannerProfile(update: (profile: PlannerProfile) => PlannerProfile) { savePlannerProfile(update(profileSnapshot())); }
export function usePlannerInquiries() { return useSyncExternalStore(subscribe, inquirySnapshot, () => emptyInquiries); }
export function savePlannerInquiry(inquiry: PlannerInquiry) {
  const current = inquirySnapshot();
  window.localStorage.setItem(inquiryKey, JSON.stringify(current.some((item) => item.id === inquiry.id) ? current.map((item) => item.id === inquiry.id ? inquiry : item) : [...current, inquiry]));
  inquiryRaw = undefined; window.dispatchEvent(new Event(change));
}
export function resolvePlannerInquiry(id: string) {
  const latest = inquirySnapshot().find(inquiry => inquiry.id === id);
  if (!latest) throw Error("This inquiry is no longer available.");
  savePlannerInquiry({ ...latest, status: "closed" });
}
function verificationSnapshot() { return read("nxtevnt-planner-verification-status") === "verified"; }
export function usePlannerVerified() { return useSyncExternalStore(subscribe, verificationSnapshot, () => false); }

const metricKey = "nxtevnt.planner.profile-metrics.v1";
const emptyMetrics: readonly ProfileMetric[] = [];
let metricRaw: string | null | undefined;
let cachedMetrics: readonly ProfileMetric[] = emptyMetrics;
function metricSnapshot() {
  const raw = read(metricKey);
  if (raw === metricRaw) return cachedMetrics;
  metricRaw = raw;
  try { const parsed = JSON.parse(raw || "[]"); cachedMetrics = Array.isArray(parsed) ? parsed.filter((item) => item && ["view", "contact", "portfolio"].includes(item.type) && typeof item.at === "string") : emptyMetrics; } catch { cachedMetrics = emptyMetrics; }
  return cachedMetrics;
}
export function useProfileMetrics() { return useSyncExternalStore(subscribe, metricSnapshot, () => emptyMetrics); }
export function recordProfileMetric(type: ProfileMetric["type"]) {
  try { window.localStorage.setItem(metricKey, JSON.stringify([...metricSnapshot().slice(-999), { id: crypto.randomUUID(), type, at: new Date().toISOString() }])); metricRaw = undefined; window.dispatchEvent(new Event(change)); } catch { /* Profile viewing can continue when storage is full. */ }
}
