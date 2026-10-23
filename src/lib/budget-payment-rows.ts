import { installmentPayments, itemBalance, paymentStatus, type BudgetItem } from "./planner-budget";

export type BudgetPaymentRow = { key: string; item: BudgetItem; amount: number; date: string; label: string; completed?: boolean };

function validDate(value: string) {
  const date = new Date(`${value}T12:00:00Z`);
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

/** Read-only schedule projection. Paid amounts are allocated oldest-first by the existing model. */
export function upcomingBudgetPaymentRows(items: BudgetItem[], { includePaid = false }: { includePaid?: boolean } = {}): BudgetPaymentRow[] {
  return items.flatMap((item) => {
    let remaining = Math.round(itemBalance(item) * 100);
    // Completed examples are opt-in for the review table, never normal upcoming payments.
    if (includePaid && paymentStatus(item) === "paid") {
      const date = item.installments.map((line) => line.dueDate).filter(validDate).sort().at(-1) || item.paymentDate;
      return validDate(date) ? [{ key: `${item.id}:paid`, item, amount: 0, date, label: "Paid in full", completed: true }] : [];
    }
    if (item.status === "cancelled" || !Number.isSafeInteger(remaining) || remaining <= 0) return [];
    if (!item.installments.length) return validDate(item.paymentDate) ? [{ key: `${item.id}:single`, item, amount: remaining / 100, date: item.paymentDate, label: "Single payment" }] : [];
    return installmentPayments(item).flatMap((line) => {
      if (!validDate(line.dueDate) || !Number.isFinite(line.due) || line.due <= 0 || remaining <= 0) return [];
      const cents = Math.min(remaining, Math.round(line.due * 100));
      if (cents <= 0) return [];
      remaining -= cents;
      return [{ key: `${item.id}:${line.id}`, item, amount: cents / 100, date: line.dueDate, label: `${line.percentage}% installment` }];
    });
  }).sort((a, b) => a.date.localeCompare(b.date) || a.key.localeCompare(b.key));
}

export function scheduledPaymentStatus(row: BudgetPaymentRow, today: string) {
  // Each line describes its own due date, not a different installment on the same item.
  return paymentStatus({ ...row.item, installments: [], paymentDate: row.date }, today);
}

export function budgetPaymentProgress(item: BudgetItem) {
  const total = Math.max(0, item.budgeted, item.invoiced);
  const paid = Math.max(0, item.paid);
  return { total, paid, balance: itemBalance(item), percent: total > 0 ? Math.max(0, Math.min(100, Math.round(paid / total * 100))) : 0 };
}
