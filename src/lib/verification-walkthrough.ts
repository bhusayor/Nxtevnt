import { assertVerificationReady, hasIdentityProof, hasInstagramProof, normalizeInstagramHandle, normalizeVerificationContact, validVerificationEmail, validVerificationPhone, verificationDocumentFileError, verificationStepErrors, type ContactProof, type DocumentReceipt, type IdentityProof, type InstagramProof } from "./verification-model";
import type { ContactChallenge, InstagramChallenge, VerificationService } from "./verification-service";

/** Local development only. Files and test results never leave memory or issue a public badge. */
export function createVerificationWalkthrough({ now = Date.now, id = () => crypto.randomUUID() }: { now?: () => number; id?: () => string } = {}): VerificationService {
  const challenges = new Map<string, { challenge: ContactChallenge; attempts: number; used: boolean }>();
  const latest = new Map<string, string>(), contacts = new Map<string, ContactProof>();
  const documents = new Map<string, { receipt: DocumentReceipt; file: File }>(), identities = new Map<string, IdentityProof>();
  const instagramChallenges = new Map<string, InstagramChallenge>(), instagramResults = new Map<string, InstagramProof>();
  function ownedInstagram(challenge: InstagramChallenge) { const issued = instagramChallenges.get(challenge.id); if (!issued || issued.handle !== challenge.handle || issued.code !== challenge.code || now() >= Date.parse(issued.expiresAt)) throw new Error("This Instagram code expired or changed. Request a new code."); return issued; }
  const contactKey = (channel: string, target: string) => `${channel}:${target}`;
  function ownsDocument(receipt: DocumentReceipt | undefined, purpose: DocumentReceipt["purpose"]) { return Boolean(receipt && documents.get(receipt.reference)?.receipt.purpose === purpose); }
  return {
    mode: "walkthrough", canUpload: true,
    async requestCode(channel, value) {
      if (channel !== "email" && channel !== "phone") throw new Error("Choose email or phone.");
      if (!(channel === "email" ? validVerificationEmail(value) : validVerificationPhone(value))) throw new Error("Enter valid contact details before requesting a code.");
      const target = normalizeVerificationContact(channel, value), key = contactKey(channel, target), previousId = latest.get(key), previous = previousId ? challenges.get(previousId) : undefined;
      if (previous && now() < Date.parse(previous.challenge.resendAt)) throw new Error("Please wait before requesting another code.");
      if (previousId) challenges.delete(previousId);
      const challenge: ContactChallenge = { id: `walkthrough-${id()}`, channel, target, expiresAt: new Date(now() + 10 * 60_000).toISOString(), resendAt: new Date(now() + 15_000).toISOString() };
      challenges.set(challenge.id, { challenge, attempts: 0, used: false }); latest.set(key, challenge.id); return { ...challenge };
    },
    async confirmCode(challenge, code) {
      const record = challenges.get(challenge.id);
      if (!record || record.used || record.challenge.target !== challenge.target || record.challenge.channel !== challenge.channel || latest.get(contactKey(challenge.channel, challenge.target)) !== challenge.id) throw new Error("Request a new code for these contact details.");
      if (now() >= Date.parse(record.challenge.expiresAt)) throw new Error("This code has expired. Request a new one.");
      if (record.attempts >= 5) throw new Error("Too many attempts. Request a new code.");
      record.attempts++;
      if (code !== "123456") throw new Error("Use 123456 for this test walkthrough.");
      record.used = true;
      const proof: ContactProof = { channel: challenge.channel, target: challenge.target, proofToken: `walkthrough-${id()}`, verifiedAt: new Date(now()).toISOString(), mode: "walkthrough" };
      contacts.set(proof.proofToken, proof); return { ...proof };
    },
    async uploadDocument(purpose, file) {
      if (!["identity", "registration", "authority"].includes(purpose)) throw new Error("Choose a valid document type.");
      const error = verificationDocumentFileError(file); if (error) throw new Error(error);
      const receipt: DocumentReceipt = { reference: `walkthrough-${id()}`, name: file.name, purpose, mode: "walkthrough", previewUrl: file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined };
      documents.set(receipt.reference, { receipt, file }); return { ...receipt };
    },
    releaseDocument(reference) { const document = documents.get(reference); if (document?.receipt.previewUrl) URL.revokeObjectURL(document.receipt.previewUrl); documents.delete(reference); },
    async startIdentityCheck() { throw new Error("Open the on-page identity walkthrough instead."); },
    async completeIdentityCheck(draft) {
      if (Object.keys(verificationStepErrors(draft, 1)).length) throw new Error("Check your name, country and document type first.");
      if (!ownsDocument(draft.identityDocument, "identity")) throw new Error("Upload an identity document before starting the check.");
      const proof: IdentityProof = { proofToken: `walkthrough-${id()}`, legalName: draft.legalName.trim(), country: draft.country, documentType: draft.documentType, documentReference: draft.identityDocument!.reference, mode: "walkthrough" };
      identities.set(proof.proofToken, proof); return { ...proof };
    },
    async requestInstagramCode(value) {
      const handle = normalizeInstagramHandle(value); if (!handle) throw new Error("Enter your Instagram username or profile link.");
      for (const [key, item] of instagramChallenges) if (item.handle === handle) { instagramChallenges.delete(key); instagramResults.delete(key); }
      const challenge: InstagramChallenge = { id: `walkthrough-${id()}`, handle, code: `NX-${id().replace(/[^a-z0-9]/gi, "").slice(-8).toUpperCase().padStart(8, "0")}`, expiresAt: new Date(now() + 10 * 60_000).toISOString() };
      instagramChallenges.set(challenge.id, challenge); return { ...challenge };
    },
    async checkInstagram(challenge) {
      ownedInstagram(challenge); const proof = instagramResults.get(challenge.id); return proof ? { status: "verified", proof: { ...proof } } : { status: "pending" };
    },
    async confirmInstagramWalkthrough(challenge) {
      const issued = ownedInstagram(challenge);
      const proof: InstagramProof = { handle: issued.handle, proofToken: `walkthrough-${id()}`, verifiedAt: new Date(now()).toISOString(), mode: "walkthrough" };
      instagramResults.set(challenge.id, proof); return { ...proof };
    },
    async submit(draft) {
      assertVerificationReady(draft, true);
      for (const proof of [draft.emailProof!, draft.phoneProof!]) { const issued = contacts.get(proof.proofToken); if (!issued || issued.target !== proof.target || issued.channel !== proof.channel) throw new Error("Verify your contact details in this session before continuing."); }
      const instagram = [...instagramResults.values()].find((proof) => proof.proofToken === draft.instagramProof?.proofToken);
      if (!instagram || !hasInstagramProof(draft.instagram, instagram)) throw new Error("Complete the Instagram check in this session before continuing.");
      const issued = draft.identityProof && identities.get(draft.identityProof.proofToken);
      if (!issued || !hasIdentityProof({ ...draft, identityProof: issued }) || !ownsDocument(draft.identityDocument, "identity")) throw new Error("Complete the identity check in this session before continuing.");
      if (draft.kind === "registered" && (!ownsDocument(draft.registrationDocument, "registration") || draft.capacity === "representative" && !ownsDocument(draft.authorityDocument, "authority"))) throw new Error("Add the required business documents in this session.");
      const at = new Date(now()).toISOString(); return { id: `TEST-${id()}`, status: "submitted", submittedAt: at, updatedAt: at, revision: 1, mode: "walkthrough" };
    },
  };
}
export const verificationWalkthrough = createVerificationWalkthrough();
