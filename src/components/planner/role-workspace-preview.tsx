import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, HeartHandshake } from "@/components/ui/icons";

import { PlannerShell } from "@/components/planner/planner-shell";
import { ClientQuestionnaires } from "@/components/planner/client-questionnaires";

export function RoleWorkspacePreview({ role }: { role: "client" | "vendor" }) {
  const vendor = role === "vendor";
  const Icon = vendor ? BriefcaseBusiness : HeartHandshake;
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <PlannerShell role={role}>
        {!vendor ? <ClientQuestionnaires /> :
        <div className="mx-auto max-w-5xl space-y-6">
          <div><p className="text-xs capitalize text-text-tertiary">{role} workspace</p><h1 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-text-primary">Welcome, Amaka</h1><p className="mt-2 text-sm text-text-secondary">{vendor ? "A home for your services and the people you work with." : "A home for your celebrations and the people who bring them to life."}</p></div>
          <section className="grid overflow-hidden rounded-[var(--radius-lg)] border border-border-subtle bg-white md:grid-cols-2">
            <div className="p-6 sm:p-8"><span className="flex size-10 items-center justify-center rounded-lg bg-info-soft text-info"><Icon className="size-5" aria-hidden="true" /></span><h2 className="mt-5 text-xl font-semibold text-text-primary">Your {role} workspace is selected</h2><p className="mt-3 text-sm leading-6 text-text-secondary">{vendor ? "Your services, enquiries and bookings will come together here as your vendor workspace becomes available." : "Your event requests, conversations and planning updates will come together here as your client workspace becomes available."}</p><Link href="/planner" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-brand-primary hover:underline">Open your planner workspace <ArrowRight className="size-4" aria-hidden="true" /></Link></div>
            <div className="relative min-h-64"><Image src={vendor ? "/images/design-system/vendor-floral-studio.png" : "/images/auth/nigerian-wedding-party.jpg"} alt={vendor ? "Floral arrangements by an event vendor" : "Guests celebrating at a Nigerian wedding"} fill sizes="(min-width: 768px) 40vw, 100vw" className="object-cover" /></div>
          </section>
        </div>}
      </PlannerShell>
    </Suspense>
  );
}
