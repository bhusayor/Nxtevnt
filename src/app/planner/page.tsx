import type { Metadata } from "next";

import { PlannerOverview } from "@/components/planner/planner-overview";

export const metadata: Metadata = {
  title: "Planner overview",
  description: "See what needs your attention and what is happening next.",
};

export default function PlannerOverviewPage() {
  return <PlannerOverview />;
}
