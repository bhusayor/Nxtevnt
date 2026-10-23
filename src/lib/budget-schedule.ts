import type { BudgetInstallment, BudgetItem } from "./planner-budget";

/** Existing installment plans take precedence over the old single-date field. */
export function budgetPaymentSchedule(item: Pick<BudgetItem, "id" | "installments" | "paymentDate">): BudgetInstallment[] {
  return item.installments.length ? item.installments.map((line) => ({ ...line })) : item.paymentDate ? [{ id: `single:${item.id}`, percentage: 100, dueDate: item.paymentDate }] : [];
}

export function validateBudgetSchedule(lines: BudgetInstallment[]) {
  const ids = new Set<string>();
  for (const line of lines) {
    const date = new Date(`${line.dueDate}T12:00:00Z`);
    if (!line.id || ids.has(line.id)) return "Each scheduled payment needs its own line.";
    ids.add(line.id);
    if (!Number.isFinite(line.percentage) || line.percentage <= 0 || line.percentage > 100) return "Each scheduled payment needs a percentage above zero and no more than 100%.";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(line.dueDate) || !Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== line.dueDate) return "Each scheduled payment needs a valid due date.";
  }
  return lines.reduce((sum, line) => sum + line.percentage, 0) > 100.001 ? "Scheduled payments cannot exceed 100% in total." : "";
}

export function scheduleQuickDate(eventDate: string | undefined, choice: "month" | "week" | "today", today: string) {
  if (choice === "today") return today;
  if (!eventDate || !/^\d{4}-\d{2}-\d{2}$/.test(eventDate)) return "";
  const date = new Date(`${eventDate}T12:00:00Z`);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== eventDate) return "";
  if (choice === "week") date.setUTCDate(date.getUTCDate() - 7);
  else {
    const day = date.getUTCDate();
    date.setUTCDate(1); date.setUTCMonth(date.getUTCMonth() - 1);
    const last = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
    date.setUTCDate(Math.min(day, last));
  }
  return date.toISOString().slice(0, 10);
}
