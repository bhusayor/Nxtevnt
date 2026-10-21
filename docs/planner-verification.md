# Planner verification

The planner has a four-step application flow: Contact → Identity → Business → Review. User-facing language describes the actual actions, not a simulated verification exercise. The initial account-holder name is Amaka Okafor, as requested for the current UI; it is not proof of identity. Saved business-profile contact details can prefill the form.

## Document examples

“View sample” is used only for educational document examples. NIN slip, national identity card, passport and driver’s licence each have their own explanatory modal. Illustrations have masked identifiers, no official seals, no real personal information and an explicit “not a valid document” label. Opening a sample never sets an upload reference, completes an identity check or approves an application.

NIN guidance: https://nimc.gov.ng/nin/. The slip example highlights the photograph, name and 11-digit identifier; it is a schematic, not a reproduction of an official document.

## Honest service boundary

### Local development walkthrough

The user-requested walkthrough is enabled only when `NODE_ENV === "development"`. It is labelled “Test mode · Nothing is sent”. Request code opens a 6-digit input and accepts `123456`, with a 15-second resend cooldown, 10-minute expiry, attempt limit and contact-bound single-use challenges. No email or SMS is sent.

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
