import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CalendarDays, CheckCheck, ClipboardList, Plus } from "lucide-react";

import { ProfileCompletionPrompt } from "@/components/planner/profile-completion-prompt";
import { VerificationPrompt } from "@/components/planner/verification-prompt";
import { WorkSnapshot } from "@/components/planner/work-snapshot";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

const firstSteps = [
  { number: "01", title: "Add the essentials", description: "Name, type and date", icon: CalendarDays },
  { number: "02", title: "Shape the plan", description: "Notes, budget and tasks", icon: ClipboardList },
  { number: "03", title: "Keep things moving", description: "See what needs attention", icon: CheckCheck },
];

export function EmptyPlannerOverview() {
  return <div className="space-y-7">
    <WorkSnapshot />

    <section aria-labelledby="first-event-title" className="grid min-w-0 overflow-hidden rounded-[1.5rem] border border-[#dce9de] bg-gradient-to-br from-[#f0f7f1] via-[#f8faf6] to-[#fbf5ed] shadow-[0_14px_44px_-36px_rgba(35,70,48,0.28)] lg:grid-cols-[minmax(0,1.08fr)_minmax(360px,0.92fr)]">
      <div className="flex min-w-0 flex-col justify-between px-6 py-7 sm:px-9 sm:py-9 lg:px-11 lg:py-11">
        <div>
          <span className="inline-flex items-center rounded-full border border-[#d5e6d9] bg-white/80 px-3 py-1.5 text-[0.6875rem] font-semibold text-[#416b4d]">Your starting point</span>
          <h2 id="first-event-title" className="mt-5 max-w-xl text-[1.75rem] font-semibold leading-[1.18] tracking-[-0.045em] text-text-primary sm:text-[2.25rem] lg:text-[2.5rem]">Let’s make room for your first event.</h2>
          <p className="mt-4 max-w-lg text-sm leading-6 text-text-secondary">Start with just the name, type and date. Once it’s created, you’ll have one place to organise the details, people and decisions that bring it to life.</p>
          <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2">
            <Link href="/planner/create-event" className={cn(buttonVariants({ size: "lg" }), "shadow-[0_8px_20px_-12px_rgba(27,67,45,0.7)]")}><Plus className="size-4" aria-hidden="true" />Create your first event</Link>
            <span className="text-xs text-text-secondary">Only the essentials are required</span>
          </div>
        </div>

        <div className="mt-9 border-t border-[#dbe8dc] pt-5">
          <p className="mb-3 text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-[#68846f]">What happens next</p>
          <div className="grid gap-3 sm:grid-cols-3">
            {firstSteps.map((step) => {
              const Icon = step.icon;
              return <div key={step.number} className="flex min-w-0 items-start gap-2.5"><span className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-[#dce9de] bg-white/80 text-[#52765b]"><Icon className="size-4" strokeWidth={1.7} aria-hidden="true" /></span><div className="min-w-0"><p className="text-[0.6875rem] font-semibold leading-4 text-text-primary">{step.title}</p><p className="mt-0.5 text-[0.625rem] leading-4 text-text-secondary">{step.description}</p></div></div>;
            })}
          </div>
        </div>
      </div>

      <div className="relative min-h-64 overflow-hidden bg-[#26372d] lg:min-h-[430px]">
        <Image src="/images/auth/nigerian-wedding-party.jpg" alt="Friends celebrating together at a Nigerian wedding party" fill priority sizes="(min-width: 1024px) 42vw, 100vw" className="object-cover object-center" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#07190f]/65 via-transparent to-transparent" aria-hidden="true" />
        <div className="absolute bottom-5 left-5 right-5 rounded-xl border border-white/30 bg-white/15 p-4 text-white shadow-lg backdrop-blur-xl sm:bottom-6 sm:left-6 sm:right-6">
          <p className="text-[0.625rem] font-semibold uppercase tracking-[0.13em] text-white/80">Your next moment</p>
          <p className="mt-1 text-sm font-medium leading-5">A great event begins with a plan worth sharing.</p>
        </div>
      </div>
    </section>

    <section aria-labelledby="setup-title" className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-2"><div><h2 id="setup-title" className="text-lg font-semibold tracking-[-0.025em] text-text-primary">Make the workspace yours</h2><p className="mt-1 text-xs text-text-secondary">A couple of things you can complete whenever you’re ready.</p></div><span className="inline-flex items-center gap-1 text-[0.6875rem] text-text-tertiary">Your event can be created first <ArrowRight className="size-3.5" aria-hidden="true" /></span></div>
      <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(300px,0.55fr)]"><VerificationPrompt /><ProfileCompletionPrompt /></div>
    </section>
  </div>;
}
