"use client";

import { Plus, X } from "@/components/ui/icons";
import { Input } from "@/components/ui/input";
import { budgetToday, type BudgetInstallment } from "@/lib/planner-budget";
import { scheduleQuickDate } from "@/lib/budget-schedule";

export function PaymentScheduleFields({ lines, onChange, eventDate }: { lines: BudgetInstallment[]; onChange: (lines: BudgetInstallment[]) => void; eventDate?: string }) {
  const total = lines.reduce((sum, line) => sum + line.percentage, 0);
  const patch = (id: string, change: Partial<BudgetInstallment>) => onChange(lines.map((line) => line.id === id ? { ...line, ...change } : line));
  return <section className="space-y-4 border-t border-border-subtle pt-5" aria-label="Payment schedule">
    <header className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="text-sm font-semibold">Payment schedule</h3><p className="mt-1 text-sm leading-6 text-text-secondary">One payment or several installments—each share has one due date.</p></div><button type="button" onClick={() => onChange([...lines, { id: crypto.randomUUID(), percentage: Math.max(0, 100 - total), dueDate: "" }])} className="inline-flex min-h-10 items-center gap-1 text-sm font-semibold text-brand-primary hover:underline"><Plus className="size-4" aria-hidden="true" />Add payment</button></header>
    {lines.map((line, index) => <div key={line.id} className="space-y-3 rounded-xl border border-border-subtle p-3"><div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] items-end gap-2"><Input label={`Payment ${index + 1} (%)`} type="number" min="0.01" max="100" step="0.01" required value={line.percentage || ""} onChange={(change) => patch(line.id, { percentage: Number(change.target.value) })} /><Input label="Due date" type="date" required value={line.dueDate} onChange={(change) => patch(line.id, { dueDate: change.target.value })} /><button type="button" aria-label={`Remove payment ${index + 1}`} onClick={() => onChange(lines.filter((entry) => entry.id !== line.id))} className="flex size-10 items-center justify-center rounded-lg border border-border-subtle text-text-tertiary hover:text-error"><X className="size-4" aria-hidden="true" /></button></div><div className="flex flex-wrap gap-2">{([{ id: "month", label: "1 month before" }, { id: "week", label: "1 week before" }, { id: "today", label: "Today" }] as const).map((choice) => <button key={choice.id} type="button" disabled={choice.id !== "today" && !eventDate} onClick={() => patch(line.id, { dueDate: scheduleQuickDate(eventDate, choice.id, budgetToday()) })} className="min-h-8 rounded-full border border-border-subtle px-3 text-sm font-medium text-text-secondary hover:border-brand-primary hover:text-brand-primary disabled:opacity-40">{choice.label}</button>)}</div></div>)}
    <p className={`text-sm leading-5 ${total > 100 ? "text-error" : "text-text-secondary"}`}>{lines.length ? `${total.toLocaleString("en-NG", { maximumFractionDigits: 2 })}% scheduled${total < 100 ? ` · ${100 - total}% not scheduled yet` : ""}` : "No payments scheduled yet. Add a payment when the due date is known."}</p>
  </section>;
}
