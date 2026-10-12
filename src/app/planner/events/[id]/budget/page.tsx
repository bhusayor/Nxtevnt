import type { Metadata } from "next";

import { BudgetWorkspace } from "@/components/planner/budget/budget-workspace";

export const metadata: Metadata = {
  title: "Event budget",
  description: "Review an event’s budget, bookings and payments.",
};

export default async function EventBudgetPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <BudgetWorkspace fixedEventId={id} />;
}
