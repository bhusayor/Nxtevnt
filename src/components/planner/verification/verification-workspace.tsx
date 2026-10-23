"use client";

import { useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { useBrowserReady } from "@/lib/planner-events";
import { useHasSavedPlannerProfile, usePlannerProfile } from "@/lib/planner-business";
import type { PlannerProfile } from "@/lib/planner-profile-types";
import { readVerificationMemoryDraft, saveVerificationCheckpoint, useVerificationCheckpoint } from "@/lib/planner-verification";
import { assertVerificationReady, createVerificationDraft, firstIncompleteVerificationStep, pendingVerificationChecks, verificationCheckpoint, verificationStepErrors, verificationSteps, type DocumentReceipt, type VerificationApplication, type VerificationCheckpoint, type VerificationDraft, type VerificationErrors } from "@/lib/verification-model";
import { verificationService, type VerificationService } from "@/lib/verification-service";
import { verificationWalkthrough } from "@/lib/verification-walkthrough";
import { IdentityCheckDialog } from "./identity-check-dialog";
import { VerificationBusinessFields, VerificationIdentityFields } from "./verification-fields";
import { VerificationDashboard } from "./verification-dashboard";
import { VerificationReviewFields } from "./verification-review";
import { VerificationOutcome } from "./verification-outcome";

const stepCopy = [
  { title: "Let’s confirm your contact details", description: "Check your email and phone number, then request a verification code for each." },
  { title: "Put a person behind the profile", description: "Confirm your name, choose an identity document and complete the required checks." },
  { title: "Tell us how you plan", description: "Choose the route that fits you. We’ll only ask for the information that route needs." },
  { title: "Review your application", description: "Check your information and finish any pending checks before submitting." },
];
export function VerificationWorkspace() {
  const ready = useBrowserReady(), profile = usePlannerProfile(), hasProfile = useHasSavedPlannerProfile(), checkpoint = useVerificationCheckpoint();
  if (!ready) return <div className="mx-auto max-w-5xl rounded-2xl border border-border-subtle bg-white p-8 text-sm text-text-secondary" role="status">Loading your verification roadmap…</div>;
  return <VerificationFlow profile={hasProfile ? profile : undefined} checkpoint={checkpoint} service={process.env.NODE_ENV === "development" ? verificationWalkthrough : verificationService} />;
}
export function VerificationFlow({ profile, checkpoint, service = verificationService }: { profile?: PlannerProfile; checkpoint: VerificationCheckpoint; service?: VerificationService }) {
  const router = useRouter(), heading = useRef<HTMLHeadingElement>(null), form = useRef<HTMLFormElement>(null), busyRef = useRef(false);
  const [draft, setDraft] = useState<VerificationDraft>(() => readVerificationMemoryDraft() || createVerificationDraft(profile, checkpoint));
  const draftRef = useRef(draft); draftRef.current = draft;
  const [step, setStep] = useState(checkpoint.step), [errors, setErrors] = useState<VerificationErrors>({}), [error, setError] = useState(""), [notice, setNotice] = useState("");
  const [submitting, setSubmitting] = useState(false), [checkingIdentity, setCheckingIdentity] = useState(false), [application, setApplication] = useState<VerificationApplication | null>(null);
  const [identityOpen, setIdentityOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [previousApplication, setPreviousApplication] = useState<VerificationApplication | null>(null);
  const pending = pendingVerificationChecks(draft), incomplete = firstIncompleteVerificationStep(draft);
  function update(patch: Partial<VerificationDraft>) {
    if (busyRef.current || application) return;
    const current = draftRef.current, next = { ...current, ...patch, ...(!("accurate" in patch) ? { accurate: false } : {}) };
    if ("instagram" in patch && patch.instagram !== current.instagram) next.instagramProof = undefined;
    for (const key of ["identityDocument", "registrationDocument", "authorityDocument"] as const) if (key in patch && current[key]?.reference && current[key]?.reference !== next[key]?.reference) service.releaseDocument?.(current[key]!.reference);
    draftRef.current = next; setDraft(next); setErrors({}); setError(""); setNotice("");
  }
  function go(next: number) {
    if (busyRef.current || application) return;
    setErrors({}); setError(""); setNotice("");
    if (next === 0 || next === 4) { setDetailsOpen(false); requestAnimationFrame(() => { if (typeof document === "undefined") return; const card = document.getElementById(next === 4 ? "verification-instagram" : "verification-phone"); card?.scrollIntoView({ block: "start", behavior: "smooth" }); card?.querySelector<HTMLInputElement>("input")?.focus({ preventScroll: true }); }); return; }
    if (![1, 2, 3].includes(next)) return;
    setStep(next); setDetailsOpen(true); requestAnimationFrame(() => { heading.current?.focus(); heading.current?.scrollIntoView({ block: "start" }); });
  }
  function saveChoices(nextStep: number, destination?: string) { try { saveVerificationCheckpoint(verificationCheckpoint(draft, nextStep, new Date().toISOString()), draft, checkpoint); setError(""); setNotice("Your progress has been saved."); if (destination) router.push(destination); return true; } catch (problem) { setError(problem instanceof Error ? problem.message : "Your progress couldn’t be saved. Please try again."); return false; } }
  async function submit(e: FormEvent) {
    e.preventDefault(); if (busyRef.current) return;
    const issues = verificationStepErrors(draft, step); setErrors(issues);
    if (Object.keys(issues).length) { setError("Check the highlighted fields. You don’t need to start over."); requestAnimationFrame(() => form.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()); return; }
    if (step < 3) { if (saveChoices(step + 1)) go(step + 1); return; }
    try { assertVerificationReady(draft, service.mode === "walkthrough"); } catch (problem) { if (incomplete < 3) go(incomplete); setError(problem instanceof Error ? problem.message : "Complete the pending checks before submitting."); return; }
    busyRef.current = true; setSubmitting(true); setError("");
    try { const result = await service.submit(draft); if (!result.id || !["submitted", "under-review", "needs-info", "approved", "declined"].includes(result.status) || !Number.isInteger(result.revision) || result.revision < 1) throw new Error("We couldn’t confirm the submission. Please check its status before trying again."); setApplication(result); setDetailsOpen(false); }
    catch (problem) { setError(problem instanceof Error ? problem.message : "Your application couldn’t be submitted. Please try again."); }
    finally { busyRef.current = false; setSubmitting(false); }
  }
  async function upload(purpose: DocumentReceipt["purpose"], file: File) {
    const current = draftRef.current;
    const signature = (value: VerificationDraft) => purpose === "identity" ? JSON.stringify([value.documentType, value.legalName, value.country]) : JSON.stringify([value.kind, value.registrationCountry, value.registeredName, value.registrationNumber, value.capacity]);
    const started = signature(current);
    if (!service.canUpload) throw new Error("Secure document uploads aren’t available yet. Please try again later.");
    const receipt = await service.uploadDocument(purpose, file);
    if (started !== signature(draftRef.current)) { service.releaseDocument?.(receipt.reference); throw new Error("Your document details changed. Please upload again for the current details."); }
    if (!receipt.reference || receipt.purpose !== purpose || !receipt.name) throw new Error("We couldn’t confirm this upload. Please try again.");
    if (purpose === "identity") update({ identityDocument: receipt, identityProof: undefined });
    else if (purpose === "registration") update({ registrationDocument: receipt });
    else update({ authorityDocument: receipt });
  }
  async function startIdentity() {
    if (!draft.identityDocument || busyRef.current) return;
    const issues = verificationStepErrors(draft, 1);
    if (Object.keys(issues).length) { setErrors(issues); setError("Check your identity details before starting."); return; }
    if (service.mode === "walkthrough") { setError(""); setIdentityOpen(true); return; }
    busyRef.current = true; setCheckingIdentity(true); setError("");
    try { saveVerificationCheckpoint(verificationCheckpoint(draft, step, new Date().toISOString()), draft, checkpoint); const result = await service.startIdentityCheck(); const url = new URL(result.url); if (url.protocol !== "https:") throw new Error("We couldn’t open a secure identity check. Please try again."); window.location.assign(url.toString()); }
    catch (problem) { setError(problem instanceof Error ? problem.message : "Your identity check couldn’t start. Please try again."); }
    finally { busyRef.current = false; setCheckingIdentity(false); }
  }
  return <div className="mx-auto max-w-5xl space-y-5 pb-6">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <Link href="/planner" className="inline-flex min-h-8 items-center gap-1.5 text-xs font-semibold text-brand-primary hover:underline"><ArrowLeft className="size-3.5" />Back to overview</Link>
      {service.mode === "walkthrough" && <span className="rounded-full border border-[#e6decd] bg-[#fcf8ed] px-2.5 py-1.5 text-[0.625rem] text-[#8b754e]">Test mode · Nothing is sent</span>}
    </div>
    {!detailsOpen ? <>
      <VerificationDashboard draft={draft} errors={errors} update={update} service={service} application={application} onBusiness={() => go(Object.keys(verificationStepErrors(draft, 1)).length || pending.some((item) => item.step === 1) ? 1 : 2)} onReview={() => go(3)} onRetry={() => { if (application?.status !== "needs-info" && application?.status !== "declined") return; setPreviousApplication(application); setApplication(null); setStep(1); setDetailsOpen(true); setError(""); setErrors({}); }} />
      {application && <VerificationOutcome application={application} />}
      {error && <p role="alert" className="rounded-xl bg-error-soft p-3 text-xs text-error">{error}</p>}
      {!application && <div className="flex flex-wrap items-center justify-between gap-3 px-1"><p className="max-w-xl text-[0.625rem] leading-5 text-text-tertiary">Your private fields and images stay in temporary memory. Saving progress keeps your step choices, not your documents or verification results.</p><button type="button" onClick={() => saveChoices(step, "/planner")} className="min-h-9 text-xs font-semibold text-brand-primary hover:underline">Save progress &amp; exit</button></div>}
    </> : <div className="mx-auto max-w-3xl space-y-4">
      <button type="button" disabled={submitting || checkingIdentity} onClick={() => { setDetailsOpen(false); setError(""); }} className="inline-flex min-h-9 items-center gap-1.5 text-xs font-semibold text-brand-primary hover:underline disabled:opacity-40"><ArrowLeft className="size-3.5" />All verification checks</button>
      <div><h1 className="text-xl font-semibold tracking-tight">Business verification</h1><p className="mt-2 text-xs leading-6 text-text-secondary">Three short sections. Add your documents, then review everything before submitting.</p></div>
      {previousApplication && <aside className="rounded-xl border border-[#e8dfcc] bg-[#fcfaf4] p-4"><h2 className="text-xs font-semibold">Previous review · {previousApplication.id}</h2><p className="mt-2 text-xs leading-6 text-text-secondary">{previousApplication.reason || "Review your information and finish the required checks before trying again."}</p><p className="mt-2 text-[0.625rem] leading-5 text-text-tertiary">Your existing details are still here. The previous result is kept here while you prepare corrections.</p></aside>}
      <nav aria-label="Business verification roadmap" className="rounded-xl border border-border-subtle bg-white p-3"><ol className="grid grid-cols-3 gap-2">{[1, 2, 3].map((index) => {
        const complete = index < 3 && !Object.keys(verificationStepErrors(draft, index)).length && !pending.some((item) => item.step === index);
        return <li key={index}><button type="button" aria-current={step === index ? "step" : undefined} onClick={() => go(index)} className={`flex min-h-10 w-full items-center justify-center gap-2 rounded-lg px-2 text-xs font-semibold ${step === index ? "bg-[#edf3ee] text-brand-primary" : "text-text-tertiary hover:bg-background-subtle"}`}><span className="flex size-5 shrink-0 items-center justify-center rounded-full border border-current/20 text-[0.625rem]">{complete ? <Check className="size-3" /> : index}</span>{verificationSteps[index].title}</button></li>;
      })}</ol></nav>
      <form ref={form} noValidate onSubmit={(event) => { void submit(event); }} className="overflow-hidden rounded-2xl border border-border-subtle bg-white shadow-[0_3px_12px_-9px_rgba(30,55,35,.2)]">
        <fieldset disabled={submitting || checkingIdentity} className="min-w-0">
          <header className="border-b border-border-subtle p-5 sm:p-6"><p className="text-[0.625rem] font-semibold uppercase tracking-wider text-[#8b7858]">Section {step} of 3 · {verificationSteps[step].title}</p><h2 ref={heading} tabIndex={-1} className="mt-3 scroll-mt-24 text-lg font-semibold tracking-tight focus:outline-none">{stepCopy[step].title}</h2><p className="mt-2 text-xs leading-6 text-text-secondary">{stepCopy[step].description}</p></header>
          <div className="p-5 sm:p-6">
            {error && <p role="alert" className="mb-5 rounded-xl bg-error-soft px-3 py-2.5 text-xs leading-5 text-error">{error}</p>}
            {step === 1 ? <VerificationIdentityFields draft={draft} errors={errors} update={update} service={service} onUpload={upload} onIdentityCheck={() => { void startIdentity(); }} checkingIdentity={checkingIdentity} /> : step === 2 ? <VerificationBusinessFields draft={draft} errors={errors} update={update} service={service} onUpload={upload} profile={profile} onProfile={() => saveChoices(step, "/planner/profile")} /> : <VerificationReviewFields draft={draft} errors={errors} update={update} profile={profile} onEdit={go} />}
          </div>
          <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-border-subtle bg-[#fdfefb] px-5 py-4 sm:px-6"><div className="flex items-center gap-1">{step > 1 && <Button type="button" size="sm" variant="ghost" leadingIcon={<ArrowLeft className="size-3" />} onClick={() => go(step - 1)}>Back</Button>}<button type="button" onClick={() => saveChoices(step, "/planner")} className="min-h-9 px-2 text-xs font-semibold text-text-secondary hover:text-brand-primary">Save progress &amp; exit</button></div><Button type="submit" size="sm" disabled={submitting || step === 3 && pending.length > 0} loading={submitting} trailingIcon={step < 3 ? <ArrowRight className="size-3.5" /> : <Check className="size-3.5" />}>{step === 3 ? "Submit for verification" : `Continue to ${verificationSteps[step + 1].title.toLowerCase()}`}</Button></footer>
        </fieldset>
      </form>
      <p className="px-1 text-[0.625rem] leading-5 text-text-tertiary">{step < 3 ? `Next up: ${verificationSteps[step].next}. ` : "Complete the pending checks above to submit your application. "}You can return to the other checks without starting over.</p>
    </div>}
    {notice && <p role="status" className="px-1 text-xs text-brand-primary">{notice}</p>}
    {identityOpen && service.mode === "walkthrough" && <IdentityCheckDialog draft={draft} service={service} onClose={() => setIdentityOpen(false)} onComplete={(proof) => {
      const current = draftRef.current;
      if (proof.mode !== "walkthrough" || proof.documentReference !== current.identityDocument?.reference || proof.legalName !== current.legalName.trim() || proof.country !== current.country || proof.documentType !== current.documentType) { setError("Your details changed. Please restart the identity check."); setIdentityOpen(false); return; }
      update({ identityProof: proof }); setIdentityOpen(false); setNotice("Identity flow complete for this test session.");
    }} />}
  </div>;
}
