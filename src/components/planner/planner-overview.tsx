"use client";

import { AttentionQueue } from "@/components/planner/attention-queue";
import { EmptyPlannerOverview } from "@/components/planner/empty-planner-overview";
import { OverviewHeader } from "@/components/planner/overview-header";
import { PlanningToolkit } from "@/components/planner/planning-toolkit";
import { UpcomingEvents } from "@/components/planner/upcoming-events";
import { VerificationPrompt } from "@/components/planner/verification-prompt";
import { WeekSchedule } from "@/components/planner/week-schedule";
import { WorkSnapshot } from "@/components/planner/work-snapshot";
import { useBrowserReady, usePlannerEvents } from "@/lib/planner-events";

export function PlannerOverview() {
  const events = usePlannerEvents();
  const ready = useBrowserReady();
  return <div className="w-full min-w-0 space-y-6 lg:space-y-7">
    <OverviewHeader showCreateAction={ready && events.length > 0} isEmpty={ready && events.length === 0} />
    {!ready ? <div className="h-72 animate-pulse rounded-xl bg-white" aria-label="Loading your workspace" /> : events.length === 0 ? <EmptyPlannerOverview /> : <>
      <VerificationPrompt />
      <WorkSnapshot />
      <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_320px] 2xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="contents min-w-0 xl:order-2 xl:block xl:space-y-6"><div className="order-2 min-w-0"><AttentionQueue /></div><div className="order-4 min-w-0"><WeekSchedule /></div></div>
        <div className="order-3 min-w-0 xl:order-3"><PlanningToolkit /></div>
        <div className="order-1 min-w-0 xl:order-first xl:col-span-2"><UpcomingEvents /></div>
      </div>
    </>}
  </div>;
}
