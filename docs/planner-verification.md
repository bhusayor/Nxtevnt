# Planner verification

The verification home has four independent check cards: Business verification, Phone/WhatsApp, Business email and Instagram account. The summary shows application readiness (0–4 checks prepared) separately from approval. Business verification opens a focused Identity → Business → Review flow; phone and email codes can be requested directly on their cards. Review includes all four checks and links back to missing information without losing current fields. The initial account-holder name is Amaka Okafor, as requested for the current UI; it is not proof of identity. Saved business-profile contact details and the Instagram account can prefill the form, but never prefill a verified result.

Registered businesses need their registration document (for example, a CAC certificate) plus individual identification (for example, a NIN slip). Independent planners retain the identity-only route and cannot receive a business-registration badge just by selecting it. Pending, ready for review, needs-info/declined and approved labels come from the evidence/application state; a fresh application is never labelled failed. Public badges and boosted-listing eligibility follow actual approval, not the readiness percentage.

## Instagram ownership

Instagram accepts a username or Instagram profile URL and binds each challenge and proof to the normalized account. The code flow explains copying a code, sending it from that account and checking confirmation. Generating/copying a code or checking a pending result never proves ownership. Account changes invalidate the result; stale responses and expired/replaced challenges are rejected. Instagram proofs and handles stay outside the saved-checkpoint allowlist.

The official receiving account is intentionally unconfigured, per the user’s request. The live service returns an honest unavailable error and no destination is invented. A configured provider may return a recipient profile URL; only a valid Instagram account URL is displayed. There is no automatic message, external request, password collection, public-profile update or badge issuance. The development walkthrough exposes a clearly labelled “Complete test confirmation” action to exercise the remaining UI without claiming real ownership. Its results are session-bound and rejected by the live readiness guard.

Run `node tests/verification-dashboard.test.cjs` for overview, route, Instagram and privacy coverage using synthetic fixtures only.

## Document examples

“View sample” is used only for educational document examples. NIN slip, national identity card, passport and driver’s licence each have their own explanatory modal. Illustrations have masked identifiers, no official seals, no real personal information and an explicit “not a valid document” label. Opening a sample never sets an upload reference, completes an identity check or approves an application.

NIN guidance: https://nimc.gov.ng/nin/. The slip example highlights the photograph, name and 11-digit identifier; it is a schematic, not a reproduction of an official document.

## Honest service boundary

### Local development walkthrough

The user-requested walkthrough is enabled only when `NODE_ENV === "development"`. It is labelled “Test mode · Nothing is sent”. Request code opens a 6-digit input and accepts `123456`, with a 15-second resend cooldown, 10-minute expiry, attempt limit and contact-bound single-use challenges. No email, SMS or WhatsApp message is sent. The Phone/WhatsApp check confirms the business phone number; it is not a WhatsApp account integration.

PDF/JPG/PNG uploads up to 5 MB are retained in memory only. Image previews use temporary blob URLs; removing or replacing a document revokes its URL. The on-page identity dialog goes through document review, face-photo capture/upload, a test checking state, and a result. “Take photo” requests the front camera (no audio) only after a user click and browser permission. A mirrored preview supports capture, review and retake; the saved JPEG uses the camera’s original orientation. Uploading a JPG/PNG remains available without camera permission. Camera tracks stop on capture, cancel, Back, leaving the step, or dialog unmount; late permission results are stopped and ignored. HTTPS or localhost is required, with clear permission, device and playback errors. No biometric matching occurs. Captured/uploaded face photos remain in memory, and their preview URLs are revoked when replaced or when the dialog closes. “Done” applies the test result; cancelling does not complete the application’s identity check.

Test results are explicitly marked `mode: "walkthrough"`, bound to the current session/contact/document, and rejected by `assertVerificationReady` unless the caller explicitly allows walkthrough mode. The test submission ends with an explanatory outcome, never a real review request or public badge. The production build selects the unavailable live service, not this fixed-code walkthrough.

Run `node tests/verification-walkthrough.test.cjs` for code, upload, identity-dialog and submission tests. Run `node tests/verification-face-camera.test.cjs` for permission, camera capture, retake, error and cleanup tests using mock media only. All fixtures are in memory; these tests make no network requests or persistent writes and never open a real camera.

### Live integration

`src/lib/verification-service.ts` defines the integration interface. Its live implementation remains intentionally unavailable until authenticated backend endpoints, secure uploads and actual providers are connected:

- Requesting a contact code cannot report that a message was sent without a valid provider challenge.
- There is no hardcoded accepted OTP in the live implementation. Code confirmation requires a provider result bound to the current channel/contact.
- The UI handles requesting, confirmation, resend cooldown, expiry, provider errors and stale responses after contact edits.
- Secure file selection is disabled while uploads are unavailable. Controls give an error on attempted action; no real document is collected or transmitted by the unavailable implementation.
- Uploads require an opaque server reference. Viewing an example is never an upload.
- Identity checks need a provider result bound to the current name, document and country. Changing those details invalidates the local result.
- No applicant-accessible reviewer controls or local approval simulation remain.
- Review shows pending checks and disables submission until all required checks are complete. Submission also revalidates the form rather than trusting button state.
- A submission outcome is shown only after a server/provider service response. No local action issues the public verified badge.

Users can prepare details and browse the roadmap while checks are pending. Independent planners skip company documents. Registered businesses have a separate registration-country field and representative-authorisation requirement. Payment setup is separate.

## Storage and migration

The existing browser progress key is retained for compatibility. Its allowlist now contains only navigation choices, route, document type, residence/registration countries and a timestamp. Legacy prototype choices may migrate, but simulated approvals, history, evidence flags and status never do.

Contact details, names, document references, verification proof tokens, business numbers and declarations are not written to localStorage/sessionStorage. Same-session fields stay in temporary memory and clear on refresh. The UI explains that saving progress saves choices, not private fields. Writes fail without changing the old checkpoint or in-memory draft; stale writes are rejected.

## Before live use

Connect authenticated server-side accounts, contact OTP delivery/verification with rate and attempt limits, provider-hosted identity capture and validated callbacks, business-registry checks, private encrypted document storage/scanning, a role-restricted reviewer queue, audit history, corrections/appeals, status retrieval and real notifications. Define and implement the privacy notice, retention/deletion policy and support process before collecting identity documents. Do not expose provider secrets or substitute browser state for server-authoritative proof.

`node tests/planner-verification.test.cjs` exercises the service contract, product copy, document examples, conditional routes, storage boundary and failure/stale-response cases using isolated fixtures only.
