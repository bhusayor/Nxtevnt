"use client";

import { useState } from "react";
import * as Select from "@radix-ui/react-select";
import { CalendarDays, CalendarRange, Check, ChevronDown, ClipboardCheck, MessageSquareText, Wallet } from "@/components/ui/icons";
import { OverviewMetricCard } from "@/components/planner/overview-metric-card";
import { legacyBudgetItems, useBudgetStore } from "@/lib/planner-budget";
import { usePlannerInquiries } from "@/lib/planner-business";
import { dashboardPayments, dashboardPeriod, dateKey, inPeriod } from "@/lib/planner-dashboard";
import { formatEventDate, isEventCancelled, isTaskActive, isTaskComplete, usePlannerEvents } from "@/lib/planner-events";

const presets = [{ value: "week", label: "This week" }, { value: "month", label: "This month" }, { value: "quarter", label: "This quarter" }, { value: "year", label: "This year" }, { value: "all", label: "All time" }, { value: "custom", label: "Custom dates" }];

export function WorkSnapshot() {
  const events = usePlannerEvents();
  const budgetStore = useBudgetStore();
  const inquiries = usePlannerInquiries();
  const [preset, setPreset] = useState("month");
  const [custom, setCustom] = useState(() => dashboardPeriod("month"));
  const period = preset === "custom" ? { ...custom, label: "Custom dates" } : dashboardPeriod(preset);
  const valid = !period.start || !period.end || period.start <= period.end;
  const activeEvents = events.filter((event) => !isEventCancelled(event));
  const openTasks = activeEvents.flatMap((event) => event.sections.tasks.filter((task) => isTaskActive(task) && !isTaskComplete(task) && (task.dueDate ? inPeriod(task.dueDate, period) : !period.start))).length;
  const payments = dashboardPayments(events, [...budgetStore.items, ...legacyBudgetItems(events, budgetStore)]);
  const vendorPaymentsDue = payments.filter((payment) => payment.date <= dateKey(new Date()) && inPeriod(payment.date, period)).length;
  const openInquiries = inquiries.filter((inquiry) => inquiry.status === "open" && inPeriod(inquiry.createdAt.slice(0, 10), period)).length;
  const range = period.start && period.end ? `${formatEventDate(period.start, { day: "numeric", month: "short" })} – ${formatEventDate(period.end, { day: "numeric", month: "short", year: "numeric" })}` : "Your whole workspace";
  const items = [
    { label: "Events", value: activeEvents.filter((event) => inPeriod(event.date, period)).length, detail: "Scheduled in this period", icon: CalendarRange, tone: "sage" as const },
    { label: "Open tasks", value: openTasks, detail: "Due in this period", icon: ClipboardCheck, tone: "lilac" as const },
    { label: "Vendor payments due", value: vendorPaymentsDue, detail: "Due by today in this period", icon: Wallet, tone: "amber" as const },
    { label: "Open inquiries", value: openInquiries, detail: "Received in this period", icon: MessageSquareText, tone: "blue" as const },
  ];
  return <section className="space-y-4" aria-label="Work snapshot">
    <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-lg font-semibold tracking-tight">Workspace overview</h2>
      <Select.Root value={preset} onValueChange={setPreset}><Select.Trigger aria-label="Overview time period" className="inline-flex min-h-11 max-w-full items-center gap-2.5 rounded-xl border border-border-subtle bg-white px-3 text-xs shadow-[0_2px_5px_-4px_#244c38] focus-visible:outline-2 focus-visible:outline-brand-primary"><span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-[#eff2f5] text-[#738091]"><CalendarDays className="size-4" aria-hidden="true" /></span><span className="font-semibold">{period.label}</span><span aria-hidden="true" className="text-text-tertiary">·</span><span className="min-w-0 truncate text-text-secondary">{range}</span><Select.Icon><ChevronDown className="size-3.5 shrink-0 text-text-tertiary" /></Select.Icon></Select.Trigger><Select.Portal><Select.Content position="popper" align="end" sideOffset={6} className="z-50 min-w-52 rounded-xl border border-border-subtle bg-white p-1.5 shadow-lg"><Select.Viewport>{presets.map((option) => <Select.Item key={option.value} value={option.value} className="relative cursor-default rounded-lg py-2.5 pl-3 pr-9 text-xs outline-none data-[highlighted]:bg-[#edf4ee]"><Select.ItemText>{option.label}</Select.ItemText><Select.ItemIndicator className="absolute right-3 top-3"><Check className="size-3.5 text-brand-primary" /></Select.ItemIndicator></Select.Item>)}</Select.Viewport></Select.Content></Select.Portal></Select.Root>
    </div>
    {preset === "custom" && <div className="flex flex-wrap items-end justify-end gap-3 rounded-xl border border-border-subtle bg-white p-3"><label className="min-w-0 flex-1 text-xs font-medium sm:max-w-48">From<input type="date" aria-label="Overview start date" value={custom.start} max={custom.end} onChange={(event) => event.target.value && setCustom((current) => ({ ...current, start: event.target.value }))} className="mt-1 block h-10 w-full min-w-0 rounded-lg border border-border-default bg-white px-3 text-xs" /></label><label className="min-w-0 flex-1 text-xs font-medium sm:max-w-48">To<input type="date" aria-label="Overview end date" min={custom.start} value={custom.end} onChange={(event) => event.target.value && setCustom((current) => ({ ...current, end: event.target.value }))} className="mt-1 block h-10 w-full min-w-0 rounded-lg border border-border-default bg-white px-3 text-xs" /></label>{!valid && <p role="alert" className="w-full text-xs text-error">Choose an end date after the start date.</p>}</div>}
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4 xl:gap-4" aria-live="polite">{items.map((item) => <OverviewMetricCard key={item.label} {...item} value={valid ? item.value : "—"} />)}</div>
  </section>;
}
