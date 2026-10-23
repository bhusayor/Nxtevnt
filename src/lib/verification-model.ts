import type { PlannerProfile } from "./planner-profile-types";

export const verificationSteps = [
  { title: "Contact", description: "Confirm how we can reach you", next: "your identity" },
  { title: "Identity", description: "Show that it’s really you", next: "your planning business" },
  { title: "Business", description: "Tell us how you work", next: "a final review" },
  { title: "Review", description: "Check once, then submit", next: "your submission status" },
] as const;
export type DocumentType = "" | "nin" | "national-id" | "passport" | "drivers-license";
export type ContactChannel = "email" | "phone";
export type ContactProof = { channel: ContactChannel; target: string; proofToken: string; verifiedAt: string; mode?: "walkthrough" };
export type InstagramProof = { handle: string; proofToken: string; verifiedAt: string; mode?: "walkthrough" };
export type DocumentReceipt = { reference: string; name: string; purpose: "identity" | "registration" | "authority"; previewUrl?: string; mode?: "walkthrough" };
export type IdentityProof = { proofToken: string; legalName: string; country: string; documentType: DocumentType; documentReference?: string; mode?: "walkthrough" };
export type VerificationStatus = "submitted" | "under-review" | "needs-info" | "approved" | "declined";
export type VerificationApplication = { id: string; status: VerificationStatus; submittedAt: string; updatedAt: string; revision: number; reason?: string; badgeScope?: "identity" | "identity-and-business"; mode?: "walkthrough" };
/** Only navigation choices may enter browser storage. Proofs and review outcomes are server-owned. */
export type VerificationCheckpoint = { mode: "workflow"; step: number; kind: "" | "independent" | "registered"; documentType: DocumentType; country: string; registrationCountry: string; updatedAt?: string };
export type VerificationDraft = {
  email: string; phone: string; emailProof?: ContactProof; phoneProof?: ContactProof;
  instagram: string; instagramProof?: InstagramProof;
  legalName: string; country: string; documentType: DocumentType; identityDocument?: DocumentReceipt; identityProof?: IdentityProof;
  kind: VerificationCheckpoint["kind"]; brand: string; location: string; registeredName: string; registrationNumber: string; registrationCountry: string;
  capacity: "owner" | "representative"; registrationDocument?: DocumentReceipt; authorityDocument?: DocumentReceipt; accurate: boolean;
};
export const emptyVerificationCheckpoint: VerificationCheckpoint = { mode: "workflow", step: 0, kind: "", documentType: "", country: "Nigeria", registrationCountry: "Nigeria" };
export const verificationCountries = ["Nigeria", "Ghana", "United Kingdom", "Other country"];
export const identityDocumentOptions = [{ value: "nin", label: "NIN slip" }, { value: "national-id", label: "National identity card" }, { value: "passport", label: "International passport" }, { value: "drivers-license", label: "Driver’s licence" }];
export function normalizeVerificationPhone(value: string) { return value.replace(/[\s().-]/g, ""); }
export function normalizeVerificationContact(channel: ContactChannel, value: string) { return channel === "email" ? value.trim().toLowerCase() : normalizeVerificationPhone(value); }
export function validVerificationPhone(value: string) { return /^\+[1-9]\d{7,14}$/.test(normalizeVerificationPhone(value)); }
export function validVerificationEmail(value: string) { return value.length <= 200 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()); }
export function hasContactProof(channel: ContactChannel, target: string, proof?: ContactProof) { return Boolean(proof && proof.channel === channel && proof.target === normalizeVerificationContact(channel, target) && proof.proofToken && Number.isFinite(Date.parse(proof.verifiedAt))); }
export function hasIdentityProof(draft: VerificationDraft) { const proof = draft.identityProof; return Boolean(proof?.proofToken && proof.legalName === draft.legalName.trim() && proof.documentType === draft.documentType && proof.country === draft.country && (!proof.documentReference || proof.documentReference === draft.identityDocument?.reference)); }
export function normalizeInstagramHandle(value = "") {
  let handle = value.trim();
  if (/^(https?:\/\/|www\.)/i.test(handle)) {
    try { const url = new URL(handle.startsWith("www.") ? `https://${handle}` : handle); if (!["instagram.com", "www.instagram.com"].includes(url.hostname.toLowerCase()) || url.protocol !== "https:" || url.username || url.password) return ""; const parts = url.pathname.split("/").filter(Boolean); if (parts.length !== 1) return ""; handle = parts[0]; } catch { return ""; }
  }
  handle = handle.replace(/^@/, "").toLowerCase();
  return /^[a-z0-9_](?:[a-z0-9_.]{0,28}[a-z0-9_])?$/.test(handle) && !handle.includes("..") && !["accounts", "explore", "direct", "reel", "reels", "p", "stories"].includes(handle) ? handle : "";
}
export function hasInstagramProof(value: string, proof?: InstagramProof) { const handle = normalizeInstagramHandle(value); return Boolean(handle && proof?.handle === handle && proof.proofToken && Number.isFinite(Date.parse(proof.verifiedAt))); }
export function businessVerificationReady(draft: VerificationDraft) {
  return !Object.keys(verificationStepErrors(draft, 1)).length && !Object.keys(verificationStepErrors(draft, 2)).length && !pendingVerificationChecks(draft).some((item) => item.step === 1 || item.step === 2);
}
export function createVerificationDraft(profile?: PlannerProfile, checkpoint = emptyVerificationCheckpoint): VerificationDraft {
  return { email: profile?.email || "", phone: profile?.phone || "", instagram: profile?.instagram || "", legalName: "Amaka Okafor", country: checkpoint.country, documentType: checkpoint.documentType, kind: checkpoint.kind, brand: profile?.brand || "", location: profile?.location || "", registeredName: "", registrationNumber: "", registrationCountry: checkpoint.registrationCountry, capacity: "owner", accurate: false };
}
export type VerificationErrors = Partial<Record<keyof VerificationDraft, string>>;
/** Prepare details while checks are pending; submission separately requires verified evidence. */
export function verificationStepErrors(draft: VerificationDraft, step: number): VerificationErrors {
  const errors: VerificationErrors = {};
  if (step === 0) { if (!validVerificationEmail(draft.email)) errors.email = "Enter an email address, for example hello@yourbrand.com."; if (!validVerificationPhone(draft.phone)) errors.phone = "Include your country code, for example +234 801 234 5678."; }
  if (step === 1) {
    if (draft.legalName.trim().length < 2 || draft.legalName.length > 160) errors.legalName = "Enter your full name as it appears on your ID.";
    if (!verificationCountries.includes(draft.country)) errors.country = "Choose your country of residence.";
    if (!identityDocumentOptions.some((option) => option.value === draft.documentType)) errors.documentType = "Choose one identity document.";
  }
  if (step === 2) {
    if (!["independent", "registered"].includes(draft.kind)) errors.kind = "Choose how you work. Independent planners don’t need company-registration documents.";
    if (!draft.brand.trim() || draft.brand.length > 120) errors.brand = "Enter the name clients know you by.";
    if (!draft.location.trim() || draft.location.length > 200) errors.location = "Enter your business city and state, for example Lekki, Lagos.";
    if (draft.kind === "registered") {
      if (!verificationCountries.includes(draft.registrationCountry)) errors.registrationCountry = "Choose where your business is registered.";
      if (draft.registeredName.trim().length < 2 || draft.registeredName.length > 160) errors.registeredName = "Use the legal name on your registration document.";
      if (!/^[A-Za-z0-9 /-]{3,40}$/.test(draft.registrationNumber.trim())) errors.registrationNumber = "Enter the number on your registration record.";
      if (!["owner", "representative"].includes(draft.capacity)) errors.capacity = "Choose your relationship to the business.";
    }
  }
  if (step === 3 && !draft.accurate) errors.accurate = "Confirm that the information you provided is accurate.";
  return errors;
}
export function pendingVerificationChecks(draft: VerificationDraft) {
  const pending: { key: string; label: string; step: number }[] = [];
  if (!hasContactProof("email", draft.email, draft.emailProof)) pending.push({ key: "email", label: "Verify your email address", step: 0 });
  if (!hasContactProof("phone", draft.phone, draft.phoneProof)) pending.push({ key: "phone", label: "Verify your phone number", step: 0 });
  if (!hasInstagramProof(draft.instagram, draft.instagramProof)) pending.push({ key: "instagram", label: "Confirm your Instagram account", step: 4 });
  if (!draft.identityDocument?.reference || draft.identityDocument.purpose !== "identity") pending.push({ key: "identityDocument", label: "Upload your identity document", step: 1 });
  if (!hasIdentityProof(draft)) pending.push({ key: "identityProof", label: "Complete your identity check", step: 1 });
  if (draft.kind === "registered") {
    if (!draft.registrationDocument?.reference || draft.registrationDocument.purpose !== "registration") pending.push({ key: "registrationDocument", label: "Upload your registration document", step: 2 });
    if (draft.capacity === "representative" && (!draft.authorityDocument?.reference || draft.authorityDocument.purpose !== "authority")) pending.push({ key: "authorityDocument", label: "Add proof that you can act for the business", step: 2 });
  }
  return pending;
}
export function firstIncompleteVerificationStep(draft: VerificationDraft) { return [0, 1, 2, 3].find((step) => Object.keys(verificationStepErrors(draft, step)).length) ?? 3; }
export function assertVerificationReady(draft: VerificationDraft, allowWalkthrough = false) {
  for (const step of [0, 1, 2, 3]) if (Object.keys(verificationStepErrors(draft, step)).length) throw new Error(`Complete ${verificationSteps[step].title.toLowerCase()} before submitting.`);
  const pending = pendingVerificationChecks(draft); if (pending.length) throw new Error(`Before submitting: ${pending[0].label.toLowerCase()}.`);
  if (!allowWalkthrough && [draft.emailProof, draft.phoneProof, draft.instagramProof, draft.identityProof, draft.identityDocument, draft.registrationDocument, draft.authorityDocument].some((entry) => entry?.mode === "walkthrough")) throw new Error("Test results cannot be used for a live verification application.");
}
export function verificationDocumentFileError(file: { size: number; type: string; name: string }) {
  if (!file.size) return "This file is empty. Choose another file.";
  if (file.size > 5 * 1024 * 1024) return "Choose a file smaller than 5 MB.";
  if (!/\.(pdf|jpe?g|png)$/i.test(file.name) || !["application/pdf", "image/jpeg", "image/png"].includes(file.type)) return "Choose a PDF, JPG or PNG file.";
  return "";
}
export function verificationCheckpoint(draft: VerificationDraft, step: number, at: string): VerificationCheckpoint {
  if (!Number.isInteger(step) || step < 0 || step > 3) throw new Error("Choose a valid verification step.");
  return sanitizeVerificationCheckpoint({ mode: "workflow", step, kind: draft.kind, documentType: draft.documentType, country: draft.country, registrationCountry: draft.registrationCountry, updatedAt: at });
}
export function sanitizeVerificationCheckpoint(input: unknown): VerificationCheckpoint {
  if (!input || typeof input !== "object") return emptyVerificationCheckpoint;
  const value = input as Omit<Partial<VerificationCheckpoint>, "mode"> & { mode?: string };
  // Preserve harmless choices from earlier drafts; never import simulated approvals or evidence.
  if (value.mode !== "workflow" && value.mode !== "preview") return emptyVerificationCheckpoint;
  return { mode: "workflow", step: Number.isInteger(value.step) && value.step! >= 0 && value.step! <= 3 ? value.step! : 0, kind: value.kind === "registered" || value.kind === "independent" ? value.kind : "", documentType: identityDocumentOptions.some((option) => option.value === value.documentType) ? value.documentType! : "", country: verificationCountries.includes(value.country || "") ? value.country! : "Nigeria", registrationCountry: verificationCountries.includes(value.registrationCountry || "") ? value.registrationCountry! : "Nigeria", updatedAt: typeof value.updatedAt === "string" && Number.isFinite(Date.parse(value.updatedAt)) ? new Date(value.updatedAt).toISOString() : undefined };
}
