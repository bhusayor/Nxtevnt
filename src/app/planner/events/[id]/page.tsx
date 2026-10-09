import type { Metadata } from "next";

import { EventWorkspace } from "@/components/planner/event-workspace";

export const metadata: Metadata = {
  title: "Event workspace",
  description: "Plan the details of your event in one place.",
};

export default async function EventPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ section?: string }> }) {
  const { id } = await params;
  const { section } = await searchParams;
  return <EventWorkspace key={`${id}-${section ?? "overview"}`} id={id} initialSection={section} />;
}
