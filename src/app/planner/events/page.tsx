import type { Metadata } from "next";

import { PlannerEventsList } from "@/components/planner/planner-events-list";

export const metadata: Metadata = {
  title: "Events",
  description: "See and manage the events you are planning.",
};

export default function EventsPage() {
  return <PlannerEventsList />;
}
