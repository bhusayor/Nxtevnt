import type { Metadata } from "next";

import { EventWorkspace } from "@/components/planner/event-workspace";

export const metadata: Metadata = {
  title: "Event workspace",
  description: "Plan the details of your event in one place.",
};

export default async function EventPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ section?: string; tab?: string; action?: string; task?: string }> }) {
  const { id } = await params;
  const { section, tab, action, task } = await searchParams;
  return <EventWorkspace key={`${id}-${section ?? "overview"}-${tab ?? "notes"}-${action ?? ""}-${task ?? ""}`} id={id} initialSection={section} initialTab={tab} initialAction={action} initialTaskId={task} />;
}
