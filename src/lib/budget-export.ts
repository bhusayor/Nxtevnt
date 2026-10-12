"use client";

import type { BudgetGroup, BudgetItem } from "@/lib/planner-budget";

function csvCell(value: string | number) {
  const raw = String(value);
  const safe = /^[\s]*[=+\-@]/.test(raw) ? `'${raw}` : raw;
  return `"${safe.replaceAll('"', '""')}"`;
}

export function downloadBudgetCsv(groups: BudgetGroup[], items: BudgetItem[], currency: string, events: readonly { id: string; name: string }[]) {
  const groupNames = new Map(groups.map((group) => [group.id, group.name]));
  const eventNames = new Map(events.map((event) => [event.id, event.name]));
  const header = ["Event", "Currency", "Budget Group", "Budget Item", "Vendor", "Vendor Status", "Budgeted Amount", "Invoiced", "Paid", "Status", "Payment Date", "Installments", "Documents", "Notes"];
  const rows = items.map((item) => [eventNames.get(item.eventId ?? "") ?? "General", currency, groupNames.get(item.groupId) ?? "Miscellaneous", item.name, item.vendor, item.vendorStatus, item.budgeted, item.invoiced, item.paid, item.status, item.paymentDate, item.installments.map((entry) => `${entry.percentage}% due ${entry.dueDate}`).join("; "), item.attachments.map((entry) => entry.name).join("; "), item.notes]);
  const csv = [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");
  const url = URL.createObjectURL(new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `nxtevnt-budget-${currency.toLowerCase()}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
