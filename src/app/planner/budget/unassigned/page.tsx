import type { Metadata } from "next";

import { BudgetWorkspace } from "@/components/planner/budget/budget-workspace";

export const metadata: Metadata = {
  title: "Unassigned budget costs",
  description: "Review budget costs that are not connected to an event.",
};

export default function UnassignedBudgetPage() {
  return <BudgetWorkspace unassignedOnly />;
}
