"use client";

import Link from "next/link";
import { Clock3, ShieldCheck } from "@/components/ui/icons";
import type { VerificationApplication } from "@/lib/verification-model";

export function VerificationOutcome({ application }: { application: VerificationApplication }) {
  const copy = application.mode === "walkthrough" ? { title: "Your application walkthrough is complete", description: "You’ve completed the verification flow in test mode. No application was sent for review, and no real verification badge has been issued." } : {
    submitted: { title: "Your application has been submitted", description: "You can return here to check its status. If we need anything else, we’ll explain what to update." },
    "under-review": { title: "Your application is being reviewed", description: "Your information is being checked. You don’t need to submit another application." },
    "needs-info": { title: "We need a little more information", description: "Review the request below before updating your application." },
    approved: { title: "Your verification is complete", description: application.badgeScope === "identity-and-business" ? "Your identity and business registration have been verified." : "Your identity has been verified. Business verification is a separate check." },
    declined: { title: "We couldn’t complete your verification", description: "Review the reason below before requesting help or submitting corrected information." },
  }[application.status];
  return <section className="mx-auto max-w-3xl rounded-2xl border border-border-subtle bg-white p-6 sm:p-8"><span className="flex size-12 items-center justify-center rounded-2xl bg-[#f0f4eb] text-brand-primary">{application.status === "approved" ? <ShieldCheck className="size-6" /> : <Clock3 className="size-6" />}</span><h2 className="mt-5 text-xl font-semibold">{copy.title}</h2><p className="mt-3 text-xs leading-6 text-text-secondary">{copy.description}</p>{application.reason && <p className="mt-5 rounded-xl border border-border-subtle bg-background-subtle p-4 text-xs leading-6">{application.reason}</p>}<p className="mt-5 text-[0.6875rem] text-text-tertiary">Application {application.id} · Revision {application.revision}</p><Link href="/planner" className="mt-6 inline-flex min-h-9 items-center text-xs font-semibold text-brand-primary hover:underline">Back to overview</Link></section>;
}
