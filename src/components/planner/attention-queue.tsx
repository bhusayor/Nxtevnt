"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { ClipboardCheck, MessageCircleReply, MessageSquareText, Wallet, X } from "@/components/ui/icons";

import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { formatBudgetMoney, legacyBudgetItems, useBudgetStore } from "@/lib/planner-budget";
import { savePlannerInquiry, usePlannerInquiries, type PlannerInquiry } from "@/lib/planner-business";
import { dashboardPayments } from "@/lib/planner-dashboard";
import { localEventToday } from "@/lib/event-weather";
import { formatEventDate, isEventCancelled, isTaskActive, isTaskComplete, usePlannerEvents } from "@/lib/planner-events";
import { cn } from "@/lib/utils/cn";

import { AttentionActionRow } from "./attention-action-row";
import { AttentionSamplePayment } from "./attention-sample-payment";
import { AttentionListDialog, VendorReplyDialog } from "./attention-list-dialog";
import { markVendorReplyRead, usePlannerVendorReplies, type PlannerVendorReply } from "@/lib/planner-vendor-replies";
import { attentionExamples, isSampleInquiry, type AttentionItem, type AttentionTab } from "./attention-queue-items";

export function AttentionQueue() {
  const events = usePlannerEvents();
  const budget = useBudgetStore();
  const inquiries = usePlannerInquiries();
  const replies = usePlannerVendorReplies();
  const [allOpen, setAllOpen] = useState(false);
  const [selectedReply, setSelectedReply] = useState<PlannerVendorReply | null>(null);
  const [tab, setTab] = useState<AttentionTab>("tasks");
  const [eventFilter, setEventFilter] = useState("all");
  const [selected, setSelected] = useState<PlannerInquiry | null>(null);
  const [error, setError] = useState("");
  const [examplesEnabled, setExamplesEnabled] = useState(true);
  const [hiddenExamples, setHiddenExamples] = useState<string[]>([]);
  const [selectedPayment, setSelectedPayment] = useState<AttentionItem | null>(null);
  const today = localEventToday();
  const activeEvents = events.filter((event) => !isEventCancelled(event));
  const selectedEvent = activeEvents.some((event) => event.id === eventFilter) ? eventFilter : "all";
  const tasks = activeEvents.filter((event) => selectedEvent === "all" || event.id === selectedEvent).flatMap((event) => event.sections.tasks.filter((task) => isTaskActive(task) && !isTaskComplete(task)).map((task) => ({ ...task, event }))).sort((a, b) => (a.dueDate || "9999").localeCompare(b.dueDate || "9999") || Number(b.priority === "high") - Number(a.priority === "high"));
  const budgetItems = [...budget.items, ...legacyBudgetItems(events, budget)];
  const payments = dashboardPayments(events, budgetItems).filter((payment) => selectedEvent === "all" || payment.event.id === selectedEvent);
  const openInquiries = inquiries.filter((inquiry) => inquiry.status === "open" && (!inquiry.eventId || activeEvents.some((event) => event.id === inquiry.eventId)) && (selectedEvent === "all" || inquiry.eventId === selectedEvent)).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const unreadReplies = replies.filter((reply) => reply.status === "unread" && activeEvents.some((event) => event.id === reply.eventId) && (selectedEvent === "all" || reply.eventId === selectedEvent)).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const items: Record<AttentionTab, AttentionItem[]> = {
    vendors: unreadReplies.map((reply) => ({ id: reply.id, title: reply.subject, context: `${reply.vendor} · ${activeEvents.find((event) => event.id === reply.eventId)!.name}`, detail: `Received ${formatEventDate(reply.createdAt.slice(0, 10), { day: "numeric", month: "short" })}`, vendorReply: reply, eventId: reply.eventId })),
    tasks: tasks.map((task) => ({ id: task.id, title: task.title, context: task.event.name, detail: task.dueDate ? `${task.dueDate < today ? "Overdue" : "Due"} ${formatEventDate(task.dueDate, { day: "numeric", month: "short", year: "numeric" })}` : "No due date", overdue: Boolean(task.dueDate && task.dueDate < today), href: `/planner/events/${task.event.id}?section=tasks&task=${task.id}`, task, eventId: task.event.id })),
    payments: payments.map((payment) => ({ id: payment.id, title: payment.vendor || payment.title, context: `${payment.event.name} · ${payment.title}`, detail: `${formatBudgetMoney(payment.amount, payment.currency)} · ${payment.date < today ? "Overdue" : "Due"} ${formatEventDate(payment.date, { day: "numeric", month: "short" })}`, overdue: payment.date < today, budgetItem: budgetItems.find((item) => item.id === payment.itemId), eventId: payment.event.id, href: `/planner/events/${payment.event.id}?section=budget` })),
    inquiries: openInquiries.map((inquiry) => ({ id: inquiry.id, title: inquiry.subject, context: inquiry.name, detail: `Received ${formatEventDate(inquiry.createdAt.slice(0, 10), { day: "numeric", month: "short" })}`, inquiry })),
  };
  const examples = attentionExamples(today);
  const showingExamples = (category: AttentionTab) => (category === "payments" || category === "inquiries") && selectedEvent === "all" && examplesEnabled && items[category].length === 0;
  const displayItems = (category: AttentionTab): AttentionItem[] => showingExamples(category) && (category === "payments" || category === "inquiries") ? examples[category].filter((item) => !hiddenExamples.includes(item.id)) : items[category];
  const visible = displayItems(tab);
  const previewing = showingExamples(tab);
  const canPreview = (tab === "payments" || tab === "inquiries") && selectedEvent === "all" && items[tab].length === 0;
  const Icon = tab === "tasks" ? ClipboardCheck : tab === "payments" ? Wallet : tab === "vendors" ? MessageCircleReply : MessageSquareText;
  const empty = tab === "tasks" ? ["No upcoming tasks", "Tasks you add to your events will appear here, with the nearest deadlines first."] : tab === "payments" ? ["No upcoming payments", "Add a due date or installment to a booked vendor’s payment to track it here."] : tab === "vendors" ? ["No unread vendor replies", "Vendor replies will appear here when your vendor messaging feed is connected."] : ["No open client inquiries", "New client inquiries will appear here so you can keep every conversation moving."];
  const tabLabels = { tasks: "Upcoming tasks", payments: "Upcoming payments", inquiries: "Client inquiries", vendors: "Vendor replies" };
  function openItem(action: AttentionItem) { setAllOpen(false); setError(""); if (action.vendorReply) setSelectedReply(action.vendorReply); else if (action.samplePayment) setSelectedPayment(action); else setSelected(action.inquiry || null); }
  return <>
    <section className="flex h-[680px] min-h-0 min-w-0 flex-col overflow-hidden rounded-2xl border border-border-subtle bg-white" aria-labelledby="attention-title">
      <div className="flex shrink-0 flex-wrap items-start justify-between gap-3 px-5 pt-5 sm:px-6"><div><h2 id="attention-title" className="text-lg font-semibold tracking-tight">Needs your attention</h2><p className="mt-1 text-sm text-text-secondary">Your next actions, nearest deadlines first.</p></div><div className="w-full min-w-0 sm:w-52"><Select ariaLabel="Filter attention by event" value={selectedEvent} onValueChange={setEventFilter} options={[{ label: "All events", value: "all" }, ...activeEvents.map((event) => ({ label: event.name, value: event.id }))]} className="h-10 text-sm [&>span:first-child]:truncate" /></div></div>
      <div className="mt-4 flex shrink-0 gap-4 overflow-x-auto border-b border-border-subtle px-5 sm:px-6" role="tablist" aria-label="Attention categories">{([{ id: "tasks", label: "Upcoming tasks" }, { id: "payments", label: "Upcoming payments" }, { id: "inquiries", label: "Client inquiries" }, { id: "vendors", label: "Vendor replies" }] as const).map((option) => <button key={option.id} type="button" role="tab" id={`attention-${option.id}`} aria-selected={tab === option.id} aria-controls="attention-content" onClick={() => { setTab(option.id); setError(""); }} className={cn("inline-flex min-h-11 shrink-0 items-center gap-2 border-b-2 text-sm font-semibold", tab === option.id ? "border-brand-primary text-brand-primary" : "border-transparent text-text-secondary hover:text-text-primary")}><span>{option.label}</span><span aria-label={`${displayItems(option.id).length} actions`} className="rounded-full bg-[#f0f3f0] px-1.5 py-0.5 text-xs font-medium tabular-nums">{displayItems(option.id).length}</span></button>)}</div>
      <div key={`${tab}-${selectedEvent}`} role="tabpanel" id="attention-content" aria-labelledby={`attention-${tab}`} tabIndex={visible.length ? 0 : undefined} className="min-h-0 flex-1 overflow-y-auto overscroll-contain [scrollbar-gutter:stable] focus-visible:-outline-offset-2">
        {visible.length ? <div className="divide-y divide-border-subtle px-5 sm:px-6">{visible.map((item) => <AttentionActionRow key={item.id} item={item} tab={tab} onOpen={openItem} />)}</div> : <div className="flex h-full flex-col items-center justify-center px-6 py-8 text-center"><span className={cn("flex size-12 items-center justify-center rounded-2xl", tab === "tasks" ? "bg-[#f2eef8] text-[#80669a]" : tab === "payments" ? "bg-[#fcf2e3] text-[#976e38]" : "bg-[#edf4fa] text-[#4c7696]")}><Icon weight="duotone" className="size-6" aria-hidden="true" /></span><h3 className="mt-4 text-sm font-semibold">{empty[0]}</h3><p className="mt-2 max-w-sm text-sm leading-6 text-text-secondary">{empty[1]}</p></div>}
      </div>
      <div className="flex min-h-12 shrink-0 flex-wrap items-center justify-between gap-x-3 gap-y-1 border-t border-border-subtle bg-[#fcfdfb] px-5 text-xs text-text-tertiary py-2 sm:px-6 sm:py-0" role="status">{error ? <span className="text-error">{error}</span> : previewing ? <><span>Your next actions, nearest deadlines first.</span><button type="button" onClick={() => { setExamplesEnabled(false); setHiddenExamples([]); }} className="min-h-9 shrink-0 font-semibold text-brand-primary hover:underline">Hide items</button>{hiddenExamples.length > 0 && <button type="button" onClick={() => setHiddenExamples([])} className="min-h-9 shrink-0 font-semibold text-brand-primary hover:underline">Reset</button>}</> : <><span>{visible.length > 4 ? `${visible.length} actions · Scroll to see all.` : "Your next actions will appear here automatically."}</span>{canPreview && <button type="button" onClick={() => { setExamplesEnabled(true); setHiddenExamples([]); }} className="min-h-9 shrink-0 font-semibold text-brand-primary hover:underline">Show items</button>}</>}</div>
      <div className="flex justify-end border-t border-border-subtle px-5 py-2 sm:px-6"><button type="button" aria-label={`See all ${tabLabels[tab].toLowerCase()}`} onClick={() => setAllOpen(true)} className="min-h-10 text-sm font-semibold text-brand-primary hover:underline">See all →</button></div>
    </section>
    <AttentionListDialog open={allOpen} title={`All ${tabLabels[tab].toLowerCase()}`} description={`${selectedEvent === "all" ? "All events" : activeEvents.find((event) => event.id === selectedEvent)?.name || "Selected event"} · ${tab === "vendors" ? "Unread vendor messages. The messaging feed is not connected yet." : "All actions in this category. No date range is applied."}`} items={visible} tab={tab} onClose={() => setAllOpen(false)} onOpen={openItem} />
    <VendorReplyDialog reply={selectedReply} error={error} onClose={() => setSelectedReply(null)} onRead={() => { if (!selectedReply) return; try { markVendorReplyRead(selectedReply.id); setSelectedReply(null); setError(""); } catch (problem) { setError(problem instanceof Error ? problem.message : "This reply couldn’t be updated."); } }} />
    <Dialog.Root open={Boolean(selected)} onOpenChange={(open) => { if (!open) setSelected(null); }}><Dialog.Portal><Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" /><Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90dvh] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl bg-white p-6"><div className="flex justify-between gap-3"><Dialog.Title className="text-lg font-semibold">{selected?.subject}</Dialog.Title><Dialog.Close aria-label="Close inquiry"><X className="size-5" /></Dialog.Close></div><Dialog.Description className="mt-2 text-sm text-text-secondary">{`From ${selected?.name} · ${selected?.email}`}</Dialog.Description><p className="mt-5 whitespace-pre-wrap text-sm leading-7">{selected?.message}</p>{error && <p role="alert" className="mt-3 text-xs text-error">{error}</p>}<div className="mt-6 flex flex-wrap justify-end gap-2"><Button variant="outline" size="sm" onClick={() => { if (!selected) return; if (isSampleInquiry(selected)) { setHiddenExamples((current) => [...current, selected.id]); setSelected(null); return; } try { savePlannerInquiry({ ...selected, status: "closed" }); setSelected(null); } catch { setError("This inquiry couldn’t be updated. Please try again."); } }}>Mark resolved</Button>{isSampleInquiry(selected) ? <Button type="button" variant="outline" size="sm" disabled title="Email replies are not connected.">Reply by email</Button> : selected?.email && <a href={`mailto:${encodeURIComponent(selected.email)}?subject=${encodeURIComponent(`Re: ${selected.subject}`)}`} className="inline-flex min-h-8 items-center rounded-lg bg-brand-primary bg-[image:var(--action-primary-gradient)] hover:bg-[image:var(--action-primary-gradient-hover)] active:bg-[image:var(--action-primary-gradient-active)] px-3 text-xs font-semibold text-white">Reply by email</a>}</div></Dialog.Content></Dialog.Portal></Dialog.Root>
    <AttentionSamplePayment item={selectedPayment} onClose={() => setSelectedPayment(null)} />
  </>;
}
