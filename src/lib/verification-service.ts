import type { ContactChannel, ContactProof, DocumentReceipt, IdentityProof, InstagramProof, VerificationApplication, VerificationDraft } from "./verification-model";

export type ContactChallenge = { id: string; channel: ContactChannel; target: string; expiresAt: string; resendAt: string };
export type InstagramChallenge = { id: string; handle: string; code: string; expiresAt: string; recipientUrl?: string };
export type InstagramConfirmation = { status: "pending" } | { status: "verified"; proof: InstagramProof };
export type VerificationService = {
  mode?: "live" | "walkthrough";
  canUpload: boolean;
  requestCode: (channel: ContactChannel, target: string) => Promise<ContactChallenge>;
  confirmCode: (challenge: ContactChallenge, code: string) => Promise<ContactProof>;
  uploadDocument: (purpose: DocumentReceipt["purpose"], file: File) => Promise<DocumentReceipt>;
  startIdentityCheck: () => Promise<{ url: string }>;
  completeIdentityCheck?: (draft: VerificationDraft) => Promise<IdentityProof>;
  releaseDocument?: (reference: string) => void;
  requestInstagramCode?: (handle: string) => Promise<InstagramChallenge>;
  checkInstagram?: (challenge: InstagramChallenge) => Promise<InstagramConfirmation>;
  confirmInstagramWalkthrough?: (challenge: InstagramChallenge) => Promise<InstagramProof>;
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
  async requestInstagramCode() { throw new Error("The official Instagram verification destination is not configured yet. Your account has not been verified."); },
  async checkInstagram() { throw new Error("Instagram confirmation isn’t connected yet. Your account has not been verified."); },
  async submit() { throw new Error("We can’t submit your application right now. Your information has not been sent for review."); },
};
