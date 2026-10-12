import type { Metadata } from "next";

import { BudgetPortfolio } from "@/components/planner/budget/budget-portfolio";

export const metadata: Metadata = {
  title: "Budget",
  description: "Manage event budgets, vendor costs, invoices and payments.",
};

export default function PlannerBudgetPage() {
  return <BudgetPortfolio />;
}
