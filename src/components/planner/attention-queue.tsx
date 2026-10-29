"use client";

import { useState } from "react";
import { ClipboardCheck, MessageCircleReply, MessageSquareText, Wallet } from "@/components/ui/icons";

import { Select } from "@/components/ui/select";
import { budgetContext, formatBudgetMoney, importBudgetData, legacyBudgetItems, useBudgetStore } from "@/lib/planner-budget";
import { resolvePlannerInquiry, usePlannerInquiries, type PlannerInquiry } from "@/lib/planner-business";
import { dashboardPayments } from "@/lib/planner-dashboard";
import { localEventToday } from "@/lib/event-weather";
import { attentionDateRange, attentionInRange } from "@/lib/attention-date-range";
import { formatEventDate, isEventCancelled, isTaskActive, isTaskComplete, usePlannerEvents } from "@/lib/planner-events";
import { cn } from "@/lib/utils/cn";

import { AttentionActionRow } from "./attention-action-row";
import { AttentionDateFilter } from "./attention-date-filter";
import { InquiryList } from "./inquiry-list";
import { InquiryDetailDialog } from "./inquiry-detail-dialog";
import { AttentionSamplePayment } from "./attention-sample-payment";
import { AttentionListDialog, VendorReplyDialog } from "./attention-list-dialog";
import { markVendorReplyRead, usePlannerVendorReplies, type PlannerVendorReply } from "@/lib/planner-vendor-replies";
import { vendorQuoteBudgetChange } from "@/lib/vendor-quote-budget";
import { attentionExamples, isSampleInquiry, isSampleVendorReply, type AttentionItem, type AttentionTab } from "./attention-queue-items";

export function AttentionQueue({ inquiriesOnly = false }: { inquiriesOnly?: boolean } = {}) {
  const events = usePlannerEvents();
  const budget = useBudgetStore();
  const inquiries = usePlannerInquiries();
  const replies = usePlannerVendorReplies();
  const [allOpen, setAllOpen] = useState(false);
  const [selectedReply, setSelectedReply] = useState<PlannerVendorReply | null>(null);
  const [tab, setTab] = useState<AttentionTab>(inquiriesOnly ? "inquiries" : "tasks");
  const [eventFilter, setEventFilter] = useState("all");
  const [selected, setSelected] = useState<PlannerInquiry | null>(null);
  const [error, setError] = useState("");
  const [hiddenExamples, setHiddenExamples] = useState<string[]>([]);
  const [selectedPayment, setSelectedPayment] = useState<AttentionItem | null>(null);
  const [datePreset, setDatePreset] = useState("all");
  const [rangeStart, setRangeStart] = useState("");
  const [rangeEnd, setRangeEnd] = useState("");
  const today = localEventToday();
  const dateRange = attentionDateRange(datePreset, rangeStart, rangeEnd, today);
  const activeEvents = events.filter((event) => !isEventCancelled(event));
  const replyEvent = activeEvents.find((event) => event.id === selectedReply?.eventId);
  const replyBudget = replyEvent ? budgetContext(events, budget, replyEvent.id, replyEvent.currency || "NGN") : { groups: [], items: [] };
  const selectedEvent = activeEvents.some((event) => event.id === eventFilter) ? eventFilter : "all";
  const tasks = activeEvents.filter((event) => selectedEvent === "all" || event.id === selectedEvent).flatMap((event) => event.sections.tasks.filter((task) => isTaskActive(task) && !isTaskComplete(task)).map((task) => ({ ...task, event }))).sort((a, b) => (a.dueDate || "9999").localeCompare(b.dueDate || "9999") || Number(b.priority === "high") - Number(a.priority === "high"));
  const budgetItems = [...budget.items, ...legacyBudgetItems(events, budget)];
  const payments = dashboardPayments(events, budgetItems).filter((payment) => selectedEvent === "all" || payment.event.id === selectedEvent);
  const openInquiries = inquiries.filter((inquiry) => inquiry.status === "open" && (inquiriesOnly || !inquiry.eventId || activeEvents.some((event) => event.id === inquiry.eventId)) && (selectedEvent === "all" || inquiry.eventId === selectedEvent)).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const unreadReplies = replies.filter((reply) => reply.status === "unread" && activeEvents.some((event) => event.id === reply.eventId) && (selectedEvent === "all" || reply.eventId === selectedEvent)).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const items: Record<AttentionTab, AttentionItem[]> = {
    vendors: unreadReplies.map((reply) => ({ id: reply.id, title: reply.subject, context: `${reply.vendor} · ${activeEvents.find((event) => event.id === reply.eventId)!.name}`, detail: `Received ${formatEventDate(reply.createdAt.slice(0, 10), { day: "numeric", month: "short" })}`, vendorReply: reply, eventId: reply.eventId })),
    tasks: tasks.map((task) => ({ id: task.id, title: task.title, context: task.event.name, detail: task.dueDate ? `${task.dueDate < today ? "Overdue" : "Due"} ${formatEventDate(task.dueDate, { day: "numeric", month: "short", year: "numeric" })}` : "No due date", overdue: Boolean(task.dueDate && task.dueDate < today), href: `/planner/events/${task.event.id}?section=tasks&task=${task.id}`, task, eventId: task.event.id })),
    payments: payments.map((payment) => ({ id: payment.id, filterDate: payment.date, title: payment.vendor || payment.title, context: `${payment.event.name} · ${payment.title}`, detail: `${formatBudgetMoney(payment.amount, payment.currency)} · ${payment.date < today ? "Overdue" : "Due"} ${formatEventDate(payment.date, { day: "numeric", month: "short" })}`, overdue: payment.date < today, budgetItem: budgetItems.find((item) => item.id === payment.itemId), eventId: payment.event.id, href: `/planner/events/${payment.event.id}?section=budget` })),
    inquiries: openInquiries.map((inquiry) => ({ id: inquiry.id, title: inquiry.subject, context: inquiriesOnly ? `${inquiry.senderType === "vendor" ? "Vendor" : "Client"} · ${inquiry.name}` : inquiry.name, detail: `Received ${formatEventDate(inquiry.createdAt.slice(0, 10), { day: "numeric", month: "short" })}`, inquiry })),
  };
  const sampleEvent = activeEvents.find(event => (event.currency || "NGN") === "NGN");
  const examples = attentionExamples(today, sampleEvent);
  const showingExamples = (category: AttentionTab) => !inquiriesOnly && items[category].length === 0 && (category === "vendors" ? Boolean(sampleEvent && (selectedEvent === "all" || selectedEvent === sampleEvent.id) && !budget.items.some(item => item.id === `vendor-quote:sample-attention-vendor-${sampleEvent.id}`)) : selectedEvent === "all");
  const displayItems = (category: AttentionTab): AttentionItem[] => (category !== "tasks" && showingExamples(category) ? examples[category].filter(item => !hiddenExamples.includes(item.id)) : items[category]).filter(item => attentionInRange(item, dateRange));
  const visible = displayItems(tab);
  const Icon = tab === "tasks" ? ClipboardCheck : tab === "payments" ? Wallet : tab === "vendors" ? MessageCircleReply : MessageSquareText;
  const empty = tab === "tasks" ? ["No upcoming tasks", "Tasks you add to your events will appear here, with the nearest deadlines first."] : tab === "payments" ? ["No upcoming payments", "Add a due date or installment to a booked vendor’s payment to track it here."] : tab === "vendors" ? ["No unread vendor replies", "Vendor replies will appear here when they arrive."] : [inquiriesOnly ? "No open inquiries" : "No open client inquiries", inquiriesOnly ? "New client and vendor inquiries will appear here." : "New client inquiries will appear here so you can keep every conversation moving."];
  const tabLabels = { tasks: "Upcoming tasks", payments: "Upcoming payments", inquiries: inquiriesOnly ? "Open inquiries" : "Client inquiries", vendors: "Vendor replies" };
  function openItem(action: AttentionItem) { setAllOpen(false); setError(""); if (action.vendorReply) setSelectedReply(action.vendorReply); else if (action.samplePayment) setSelectedPayment(action); else setSelected(action.inquiry || null); }
  return <>
    <section className="flex h-[680px] min-h-0 min-w-0 flex-col overflow-hidden rounded-2xl border border-border-subtle bg-white" aria-labelledby="attention-title">
      <div className="grid shrink-0 gap-3 px-5 pt-5 sm:px-6 xl:grid-cols-[minmax(0,1fr)_auto]"><div><h2 id="attention-title" className="text-lg font-semibold tracking-tight">{inquiriesOnly ? "Open inquiries" : "Needs your attention"}</h2><p className="mt-1 text-sm text-text-secondary">{inquiriesOnly ? "Active client and vendor inquiries" : "Your next actions, nearest deadlines first."}</p></div>{!inquiriesOnly && <div className="flex min-w-0 gap-2"><div className="min-w-0 flex-1 sm:w-44 sm:flex-none"><Select ariaLabel="Filter attention by event" value={selectedEvent} onValueChange={setEventFilter} options={[{ label: "All events", value: "all" }, ...activeEvents.map((event) => ({ label: event.name, value: event.id }))]} className="h-10 text-sm [&>span:first-child]:truncate" /></div><AttentionDateFilter preset={datePreset} onPreset={setDatePreset} /></div>}</div>
      {!inquiriesOnly && datePreset === "custom" && <div role="group" aria-label="Attention date range" className="mx-5 mt-3 grid shrink-0 grid-cols-2 gap-3 rounded-xl border border-border-subtle bg-[#f8faf8] p-3 sm:mx-6"><label className="min-w-0 text-xs font-medium text-text-secondary">From<input type="date" aria-label="Attention start date" value={rangeStart} max={rangeEnd || undefined} onChange={event => setRangeStart(event.target.value)} className="mt-1 h-10 w-full min-w-0 rounded-lg border border-border-default bg-white px-2 text-sm" /></label><label className="min-w-0 text-xs font-medium text-text-secondary">To<input type="date" aria-label="Attention end date" value={rangeEnd} min={rangeStart || undefined} onChange={event => setRangeEnd(event.target.value)} className="mt-1 h-10 w-full min-w-0 rounded-lg border border-border-default bg-white px-2 text-sm" /></label></div>}
      {!inquiriesOnly && datePreset !== "all" && <div className="mt-2 flex shrink-0 flex-wrap items-center justify-between gap-2 px-5 text-xs text-text-secondary sm:px-6"><p role={dateRange.valid ? "status" : "alert"}>{dateRange.valid ? `${tab === "tasks" || tab === "payments" ? "Due dates" : "Received dates"} · ${dateRange.label}` : "Choose an end date on or after the start date."}</p><button type="button" onClick={() => { setDatePreset("all"); setRangeStart(""); setRangeEnd(""); }} className="min-h-8 font-semibold text-brand-primary hover:underline">Clear date filter</button></div>}
      {!inquiriesOnly && <div className="mt-4 flex shrink-0 gap-4 overflow-x-auto border-b border-border-subtle px-5 sm:px-6" role="tablist" aria-label="Attention categories">{([{ id: "tasks", label: "Upcoming tasks" }, { id: "payments", label: "Upcoming payments" }, { id: "inquiries", label: "Client inquiries" }, { id: "vendors", label: "Vendor replies" }] as const).map((option) => <button key={option.id} type="button" role="tab" id={`attention-${option.id}`} aria-selected={tab === option.id} aria-controls="attention-content" onClick={() => { setTab(option.id); setError(""); }} className={cn("inline-flex min-h-11 shrink-0 items-center gap-2 border-b-2 text-sm font-semibold", tab === option.id ? "border-brand-primary text-brand-primary" : "border-transparent text-text-secondary hover:text-text-primary")}><span>{option.label}</span><span aria-label={`${displayItems(option.id).length} actions`} className="rounded-full bg-[#f0f3f0] px-1.5 py-0.5 text-xs font-medium tabular-nums">{displayItems(option.id).length}</span></button>)}</div>}
      <div key={`${tab}-${selectedEvent}-${datePreset}-${rangeStart}-${rangeEnd}`} role={inquiriesOnly ? "region" : "tabpanel"} id="attention-content" aria-labelledby={inquiriesOnly ? "attention-title" : `attention-${tab}`} tabIndex={visible.length ? 0 : undefined} className="min-h-0 flex-1 overflow-y-auto overscroll-contain [scrollbar-gutter:stable] focus-visible:-outline-offset-2">
        {visible.length ? inquiriesOnly ? <div className="px-5 sm:px-6"><InquiryList items={visible} onOpen={openItem} /></div> : <div className="divide-y divide-border-subtle px-5 sm:px-6">{visible.map((item) => <AttentionActionRow key={item.id} item={item} tab={tab} onOpen={openItem} />)}</div> : <div className="flex h-full flex-col items-center justify-center px-6 py-8 text-center"><span className={cn("flex size-12 items-center justify-center rounded-2xl", tab === "tasks" ? "bg-[#f2eef8] text-[#80669a]" : tab === "payments" ? "bg-[#fcf2e3] text-[#976e38]" : "bg-[#edf4fa] text-[#4c7696]")}><Icon weight="duotone" className="size-6" aria-hidden="true" /></span><h3 className="mt-4 text-sm font-semibold">{empty[0]}</h3><p className="mt-2 max-w-sm text-sm leading-6 text-text-secondary">{empty[1]}</p></div>}
      </div>
      <div className="flex justify-end border-t border-border-subtle px-5 py-2 sm:px-6"><button type="button" aria-label={`See all ${tabLabels[tab].toLowerCase()}`} onClick={() => setAllOpen(true)} className="min-h-10 text-sm font-semibold text-brand-primary hover:underline">See all →</button></div>
    </section>
    <AttentionListDialog open={allOpen} title={`All ${tabLabels[tab].toLowerCase()}`} description={`${selectedEvent === "all" ? "All events" : activeEvents.find((event) => event.id === selectedEvent)?.name || "Selected event"} · ${dateRange.label} · ${tab === "vendors" ? "Unread vendor replies matching your filters." : "Actions matching your event and date filters."}`} items={visible} tab={tab} onClose={() => setAllOpen(false)} onOpen={openItem} />
    <VendorReplyDialog reply={selectedReply} event={replyEvent} groups={replyBudget.groups} items={replyBudget.items} error={error} onClose={() => setSelectedReply(null)} onRead={() => { if (!selectedReply) return; if (isSampleVendorReply(selectedReply)) { setHiddenExamples(current => [...current, selectedReply.id]); setSelectedReply(null); setError(""); return; } try { markVendorReplyRead(selectedReply.id); setSelectedReply(null); setError(""); } catch (problem) { setError(problem instanceof Error ? problem.message : "This reply couldn’t be updated."); } }} onAddQuote={(destination) => { if (!selectedReply || !replyEvent) throw Error("The event for this reply isn’t available."); const change = vendorQuoteBudgetChange(selectedReply, replyEvent, replyBudget.groups, replyBudget.items, destination); importBudgetData(change.groups, change.items); if (isSampleVendorReply(selectedReply)) setHiddenExamples(current => [...current, selectedReply.id]); else try { markVendorReplyRead(selectedReply.id); } catch { /* The quote was saved; a read marker can be retried separately. */ } setSelectedReply(null); setError(""); }} />
    <InquiryDetailDialog inquiry={selected} error={error} example={isSampleInquiry(selected)} onClose={() => setSelected(null)} onResolve={() => { if (!selected) return; if (isSampleInquiry(selected)) { setHiddenExamples(current => [...current, selected.id]); setSelected(null); return; } try { resolvePlannerInquiry(selected.id); setSelected(null); } catch { setError("This inquiry couldn’t be updated. Please try again."); } }} />
    <AttentionSamplePayment item={selectedPayment} onClose={() => setSelectedPayment(null)} />
  </>;
}
