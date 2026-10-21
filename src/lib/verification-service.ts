import type { ContactChannel, ContactProof, DocumentReceipt, IdentityProof, VerificationApplication, VerificationDraft } from "./verification-model";

export type ContactChallenge = { id: string; channel: ContactChannel; target: string; expiresAt: string; resendAt: string };
export type VerificationService = {
  mode?: "live" | "walkthrough";
  canUpload: boolean;
  requestCode: (channel: ContactChannel, target: string) => Promise<ContactChallenge>;
  confirmCode: (challenge: ContactChallenge, code: string) => Promise<ContactProof>;
  uploadDocument: (purpose: DocumentReceipt["purpose"], file: File) => Promise<DocumentReceipt>;
  startIdentityCheck: () => Promise<{ url: string }>;
  completeIdentityCheck?: (draft: VerificationDraft) => Promise<IdentityProof>;
  releaseDocument?: (reference: string) => void;
  submit: (draft: VerificationDraft) => Promise<VerificationApplication>;
};
// Fail closed until authenticated server endpoints/providers are configured.
// Never transmit data, accept a fixed OTP or generate a verification result here.
export const verificationService: VerificationService = {
  canUpload: false,
  async requestCode() { throw new Error("Code delivery isn’t available yet. Your contact details have not been verified. Please try again later."); },
  async confirmCode() { throw new Error("We can’t check this code right now. Please request a new code when the service is available."); },
  async uploadDocument() { throw new Error("Secure document uploads aren’t available yet. You can save your progress and return later."); },
  async startIdentityCheck() { throw new Error("Identity checks aren’t available yet. You can finish your details and return to this check later."); },
  async submit() { throw new Error("We can’t submit your application right now. Your information has not been sent for review."); },
};
