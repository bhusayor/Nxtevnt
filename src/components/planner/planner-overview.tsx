"use client";

import { AttentionQueue } from "@/components/planner/attention-queue";
import { EmptyPlannerOverview } from "@/components/planner/empty-planner-overview";
import { OverviewHeader } from "@/components/planner/overview-header";
import { EventLineup } from "@/components/planner/event-lineup";
import { PlannerProfileCard } from "@/components/planner/planner-profile";
import { UpcomingEvents } from "@/components/planner/upcoming-events";
import { VerificationPrompt } from "@/components/planner/verification-prompt";
import { WorkSnapshot } from "@/components/planner/work-snapshot";
import { useBrowserReady, usePlannerEvents } from "@/lib/planner-events";

export function PlannerOverview() {
  const events = usePlannerEvents();
  const ready = useBrowserReady();
  return <div className="w-full min-w-0 space-y-6 lg:space-y-7">
    <OverviewHeader showCreateAction={ready && events.length > 0} isEmpty={ready && events.length === 0} />
    {!ready ? <div className="h-72 animate-pulse rounded-xl bg-white" aria-label="Loading your workspace" /> : <>
      <VerificationPrompt />
      <WorkSnapshot />
      {events.length ? <UpcomingEvents /> : <EmptyPlannerOverview showSummary={false} />}
      <div className="grid min-w-0 items-stretch gap-6 xl:grid-cols-[minmax(0,1fr)_320px] 2xl:grid-cols-[minmax(0,1fr)_360px]"><AttentionQueue /><PlannerProfileCard /></div>
      <EventLineup />
    </>}
  </div>;
}
