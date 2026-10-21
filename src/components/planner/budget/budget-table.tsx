"use client";

import { useRef, useState } from "react";
import { ActionMenu } from "@/components/ui/action-menu";
import { ChevronDown, ChevronRight, CircleDollarSign, Eye, FileText, Pencil, StickyNote, Trash2 } from "@/components/ui/icons";
import { BudgetGroupIcon } from "./budget-group-icon";
import { BudgetQuickAdd, type QuickBudgetDraft } from "./budget-quick-add";
import { BookingStatusButton, BudgetStatusBadge } from "./budget-status-badges";
import { formatBudgetMoney, itemBalance, paymentStatus, type BudgetGroup, type BudgetItem, type VendorStatus } from "@/lib/planner-budget";
import type { PlannerEvent } from "@/lib/planner-events";
import { cn } from "@/lib/utils/cn";

function groupTone(name: string) {
  const lower = name.toLowerCase();
  if (lower.includes("cater")) return "bg-[#faecec] text-[#9a6365]";
  if (lower.includes("venue")) return "bg-[#fcf0e5] text-[#9d7047]";
  if (lower.includes("music") || lower.includes("entertain")) return "bg-[#f3eff9] text-[#78608e]";
  if (lower.includes("photo")) return "bg-[#f9edf3] text-[#986b82]";
  return "bg-[#eaf4ef] text-[#517a63]";
}

type Props = { groups: BudgetGroup[]; items: BudgetItem[]; events: readonly PlannerEvent[]; currency: string; portfolio: boolean; expanded: Set<string>; onToggle: (id: string) => void; onAddItem: (group: BudgetGroup, draft?: QuickBudgetDraft) => void; onQuickAdd: (group: BudgetGroup, draft: QuickBudgetDraft) => string | undefined; onChangeBooking: (item: BudgetItem, status: VendorStatus) => void; onLogPayment: (item: BudgetItem) => void; onViewItem: (item: BudgetItem) => void; onEditItem: (item: BudgetItem) => void; onDeleteItem: (item: BudgetItem) => void };

function ItemActions({ item, onViewItem, onEditItem, onDeleteItem, onLogPayment }: Pick<Props, "onViewItem" | "onEditItem" | "onDeleteItem" | "onLogPayment"> & { item: BudgetItem }) {
  return <ActionMenu label={`Actions for ${item.name}`} items={[
    { label: "View details", icon: <Eye />, onSelect: () => onViewItem(item) },
    { label: "Edit item", icon: <Pencil />, onSelect: () => onEditItem(item) },
    { label: "Log a payment", icon: <CircleDollarSign />, onSelect: () => onLogPayment(item), disabled: itemBalance(item) <= 0 || item.status === "cancelled" },
    { label: "Delete item", icon: <Trash2 />, onSelect: () => onDeleteItem(item), destructive: true },
  ]} />;
}

function PaymentCell({ item, onLogPayment }: { item: BudgetItem; onLogPayment: Props["onLogPayment"] }) {
  return <div className="space-y-1"><BudgetStatusBadge status={paymentStatus(item)} />{itemBalance(item) > 0 && item.status !== "cancelled" && <button type="button" onClick={() => onLogPayment(item)} className="flex min-h-8 items-center gap-1.5 whitespace-nowrap text-[0.6875rem] font-semibold text-brand-primary hover:underline"><CircleDollarSign className="size-3.5" aria-hidden="true" />Log a payment</button>}</div>;
}

export function BudgetTable(props: Props) {
  const { groups, items, events, currency, portfolio, expanded, onToggle, onAddItem, onQuickAdd, onChangeBooking, onLogPayment, onViewItem } = props;
  const [drafts, setDrafts] = useState<Record<string, QuickBudgetDraft>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const submittedDrafts = useRef(new WeakSet<QuickBudgetDraft>());
  const eventNames = new Map(events.map((event) => [event.id, event.name]));
  function changeDraft(id: string, draft?: QuickBudgetDraft) {
    setDrafts((current) => { const next = { ...current }; if (draft) next[id] = draft; else delete next[id]; return next; });
    setErrors((current) => ({ ...current, [id]: "" }));
  }
  function quickAdd(group: BudgetGroup) {
    const draft = drafts[group.id];
    if (!draft || submittedDrafts.current.has(draft)) return;
    submittedDrafts.current.add(draft);
    const error = onQuickAdd(group, draft);
    if (error) { submittedDrafts.current.delete(draft); setErrors((current) => ({ ...current, [group.id]: error })); }
    else changeDraft(group.id);
  }
  const quickRow = (group: BudgetGroup) => <BudgetQuickAdd groupName={group.name} currency={group.currency} draft={drafts[group.id]} error={errors[group.id]} onChange={(draft) => changeDraft(group.id, draft)} onSave={() => quickAdd(group)} onDetails={() => { onAddItem(group, drafts[group.id]); changeDraft(group.id); }} />;
  const count = (group: BudgetGroup, groupItems: BudgetItem[]) => <>{groupItems.length} {groupItems.length === 1 ? "item" : "items"}{portfolio ? ` · ${eventNames.get(group.eventId ?? "") ?? "General"}` : ""}</>;

  return <div className="overflow-hidden rounded-xl border border-border-subtle bg-white">
    <div className="hidden overflow-x-auto md:block"><table className="w-full min-w-[1040px] border-collapse text-left text-xs"><thead className="border-b border-border-subtle bg-[#fafbfa] text-[0.625rem] font-semibold uppercase tracking-[0.08em] text-text-tertiary"><tr><th className="min-w-56 px-4 py-3">Budget item</th><th className="min-w-36 px-3 py-3">Vendor</th>{["Budgeted", "Invoiced", "Paid", "Balance"].map((label) => <th key={label} className="px-3 py-3 text-right">{label}</th>)}<th className="min-w-36 px-3 py-3">Payment status</th><th className="w-12 px-2 py-3"><span className="sr-only">Actions</span></th></tr></thead>
      {groups.map((group) => {
        const groupItems = items.filter((item) => item.groupId === group.id);
        const open = expanded.has(group.id);
        return <tbody key={group.id} className="border-b border-border-subtle last:border-b-0"><tr className="bg-[#f8faf8]"><td className="px-4 py-3"><button type="button" onClick={() => onToggle(group.id)} aria-expanded={open} className="flex items-center gap-2 text-left font-semibold text-text-primary">{open ? <ChevronDown className="size-4 shrink-0 text-text-tertiary" /> : <ChevronRight className="size-4 shrink-0 text-text-tertiary" />}<span className={cn("flex size-7 shrink-0 items-center justify-center rounded-md", groupTone(group.name))}><BudgetGroupIcon name={group.name} className="size-3.5" /></span><span>{group.name}<span className="mt-0.5 block text-[0.6875rem] font-normal text-text-tertiary">{count(group, groupItems)}</span></span></button></td><td className="px-3 py-3 text-text-tertiary">—</td>{["budgeted", "invoiced", "paid", "balance"].map((field) => <td key={field} className="whitespace-nowrap px-3 py-3 text-right font-semibold tabular-nums">{formatBudgetMoney(groupItems.reduce((sum, item) => sum + (field === "balance" ? itemBalance(item) : item[field as "budgeted" | "invoiced" | "paid"]), 0), currency)}</td>)}<td colSpan={2} /></tr>
          {open && <>{groupItems.map((item) => <tr key={item.id} className="border-t border-border-subtle transition-colors hover:bg-[#fcfdfc]"><td className="max-w-72 px-4 py-3 pl-11"><button type="button" onClick={() => onViewItem(item)} className="max-w-full break-words text-left font-semibold leading-5 hover:text-brand-primary hover:underline">{item.name}</button>{item.notes.trim() && <span className="mt-1 flex items-start gap-1 text-[0.6875rem] leading-5 text-text-secondary" title={item.notes}><StickyNote className="mt-1 size-3 shrink-0" aria-hidden="true" /><span className="line-clamp-2 break-words">{item.notes}</span></span>}{item.attachments.length > 0 && <span className="mt-1 flex items-center gap-1 text-[0.6875rem] text-text-tertiary"><FileText className="size-3" aria-hidden="true" />{item.attachments.length} {item.attachments.length === 1 ? "document" : "documents"}</span>}</td><td className="px-3 py-3"><p className="mb-1 max-w-40 truncate text-text-secondary" title={item.vendor}>{item.vendor || "No vendor"}</p><BookingStatusButton name={item.name} status={item.vendorStatus} onStatusChange={(status) => onChangeBooking(item, status)} /></td>{["budgeted", "invoiced", "paid", "balance"].map((field) => <td key={field} className="whitespace-nowrap px-3 py-3 text-right tabular-nums">{formatBudgetMoney(field === "balance" ? itemBalance(item) : item[field as "budgeted" | "invoiced" | "paid"], currency)}</td>)}<td className="px-3 py-3"><PaymentCell item={item} onLogPayment={onLogPayment} /></td><td className="px-2 py-2"><ItemActions {...props} item={item} /></td></tr>)}<tr className="border-t border-dashed border-border-subtle bg-[#fcfdfc]"><td colSpan={8} className="px-4 py-0 pl-11">{quickRow(group)}</td></tr></>}
        </tbody>;
      })}
    </table></div>
    <div className="divide-y divide-border-subtle md:hidden">{groups.map((group) => {
      const groupItems = items.filter((item) => item.groupId === group.id);
      const open = expanded.has(group.id);
      return <section key={group.id}><button type="button" onClick={() => onToggle(group.id)} aria-expanded={open} className="flex min-h-16 w-full items-center gap-2 bg-[#f8faf8] px-4 py-3 text-left">{open ? <ChevronDown className="size-4 shrink-0 text-text-tertiary" /> : <ChevronRight className="size-4 shrink-0 text-text-tertiary" />}<span className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg", groupTone(group.name))}><BudgetGroupIcon name={group.name} /></span><span className="min-w-0"><span className="block text-xs font-semibold">{group.name}</span><span className="text-[0.6875rem] text-text-tertiary">{count(group, groupItems)}</span></span></button>{open && <div className="divide-y divide-border-subtle">{groupItems.map((item) => <article key={item.id} className="p-4"><div className="flex items-start gap-2"><div className="min-w-0 flex-1"><button type="button" onClick={() => onViewItem(item)} className="break-words text-left text-sm font-semibold hover:text-brand-primary">{item.name}</button><p className="mt-1 text-xs text-text-secondary">{item.vendor || "No vendor yet"}</p></div><ItemActions {...props} item={item} /></div>{item.notes.trim() && <p className="mt-2 line-clamp-2 break-words text-xs leading-5 text-text-secondary"><StickyNote className="mr-1 inline size-3.5" aria-hidden="true" />{item.notes}</p>}<div className="mt-3 flex flex-wrap items-center justify-between gap-3"><BookingStatusButton name={item.name} status={item.vendorStatus} onStatusChange={(status) => onChangeBooking(item, status)} /><PaymentCell item={item} onLogPayment={onLogPayment} /></div><dl className="mt-4 grid grid-cols-2 gap-3 text-xs">{["budgeted", "invoiced", "paid", "balance"].map((field) => <div key={field}><dt className="capitalize text-text-tertiary">{field}</dt><dd className="mt-1 break-words font-semibold tabular-nums">{formatBudgetMoney(field === "balance" ? itemBalance(item) : item[field as "budgeted" | "invoiced" | "paid"], currency)}</dd></div>)}</dl><div className="mt-3 flex flex-wrap items-center justify-between gap-2">{item.attachments.length > 0 && <span className="inline-flex items-center gap-1 text-[0.6875rem] text-text-tertiary"><FileText className="size-3" aria-hidden="true" />{item.attachments.length} files</span>}<button type="button" onClick={() => onViewItem(item)} className="min-h-9 text-xs font-semibold text-brand-primary hover:underline">View details</button></div></article>)}<div className="px-4 py-0">{quickRow(group)}</div></div>}</section>;
    })}</div>
  </div>;
}
