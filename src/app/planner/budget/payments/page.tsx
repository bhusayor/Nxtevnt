import type { Metadata } from "next";
import { BudgetPortfolio } from "@/components/planner/budget/budget-portfolio";

export const metadata: Metadata = { title: "Upcoming payments", description: "Outstanding vendor payments across your events." };

export default function PaymentsPage() {
  return <BudgetPortfolio initialTab="payments" />;
}
