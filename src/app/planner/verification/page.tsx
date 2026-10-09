import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Building2, IdCard, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Planner verification",
  description: "Complete your Nxtevnt planner verification.",
};

const checks = [
  { title: "Identity details", description: "Confirm your legal name and identity document.", icon: IdCard },
  { title: "Business information", description: "Add your business registration or professional details.", icon: Building2 },
  { title: "Final review", description: "Review and submit your information to Nxtevnt.", icon: ShieldCheck },
] as const;

export default function PlannerVerificationPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/planner" className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-primary hover:underline"><ArrowLeft aria-hidden="true" className="size-4" />Back to overview</Link>
      <div className="mt-6 rounded-[var(--radius-lg)] border border-border-subtle bg-surface p-5 sm:p-7">
        <span className="flex size-11 items-center justify-center rounded-[var(--radius-lg)] bg-success-soft text-success"><ShieldCheck aria-hidden="true" className="size-5" /></span>
        <h1 className="mt-4 text-2xl font-semibold tracking-[-0.025em] text-text-primary">Verify your planner profile</h1>
        <p className="mt-2 max-w-xl text-sm leading-6 text-text-secondary">Complete these checks to strengthen client trust and qualify for the verified planner badge.</p>
        <div className="mt-7 divide-y divide-border-subtle border-y border-border-subtle">
          {checks.map((check, index) => { const Icon = check.icon; return <div key={check.title} className="flex items-center gap-4 py-4"><span className="flex size-9 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-background-subtle text-text-secondary"><Icon aria-hidden="true" className="size-[18px]" /></span><div className="min-w-0 flex-1"><h2 className="text-sm font-semibold text-text-primary">{check.title}</h2><p className="mt-0.5 text-xs text-text-tertiary">{check.description}</p></div><span className="flex size-6 items-center justify-center rounded-full border border-border-default text-[0.6875rem] font-semibold text-text-tertiary">{index + 1}</span></div>; })}
        </div>
        <button type="button" className="mt-6 inline-flex h-10 items-center rounded-[var(--radius-md)] bg-brand-primary px-4 text-sm font-semibold text-white hover:bg-brand-primary-hover">Begin identity check</button>
      </div>
    </div>
  );
}
