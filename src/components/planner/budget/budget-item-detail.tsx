"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import * as Dialog from "@radix-ui/react-dialog";
import { CalendarDays, Download, Eye, FileImage, FileSpreadsheet, FileText, Pencil, StickyNote, X } from "lucide-react";

import { BudgetStatusBadge, VendorStatusBadge } from "@/components/planner/budget/budget-sections";
import { Button } from "@/components/ui/button";
import { getBudgetAttachment } from "@/lib/budget-attachments";
import { formatEventDate } from "@/lib/planner-events";
import { formatBudgetMoney, installmentPayments, itemBalance, type BudgetAttachment, type BudgetItem } from "@/lib/planner-budget";

type Preview = { kind: "image"; url: string; name: string } | { kind: "pdf"; url: string; name: string } | { kind: "text"; content: string; name: string };

function previewKind(attachment: BudgetAttachment): "image" | "pdf" | "text" | null {
  const name = attachment.name.toLowerCase();
  if (attachment.type.startsWith("image/") || /\.(png|jpe?g|webp|gif)$/.test(name)) return "image";
  if (attachment.type === "application/pdf" || name.endsWith(".pdf")) return "pdf";
  if (/\.(csv|txt)$/.test(name)) return "text";
  return null;
}

function formatFileSize(size: number) {
  return size < 1024 * 1024 ? `${Math.max(1, Math.round(size / 1024))} KB` : `${(size / 1024 / 1024).toFixed(1)} MB`;
}

function formatDueDate(date: string) {
  return date ? formatEventDate(date, { day: "numeric", month: "short", year: "numeric" }) : "Not set";
}

export function BudgetItemDetail({ item, groupName, eventName, open, onOpenChange, onEdit }: { item: BudgetItem; groupName: string; eventName: string; open: boolean; onOpenChange: (open: boolean) => void; onEdit: () => void }) {
  const [preview, setPreview] = useState<Preview | null>(null);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");
  const installments = installmentPayments(item);

  useEffect(() => () => { if (preview && "url" in preview) URL.revokeObjectURL(preview.url); }, [preview]);

  async function previewAttachment(attachment: BudgetAttachment) {
    const kind = previewKind(attachment);
    if (!kind) return;
    setError("");
    setBusyId(attachment.id);
    try {
      const blob = await getBudgetAttachment(attachment.id);
      if (!blob) { setError("This file isn’t available in this browser."); return; }
      if (kind === "text") { setPreview({ kind, name: attachment.name, content: await blob.text() }); return; }
      const mime = kind === "pdf" ? "application/pdf" : attachment.type || `image/${attachment.name.split(".").pop()?.toLowerCase() === "jpg" ? "jpeg" : attachment.name.split(".").pop()?.toLowerCase()}`;
      setPreview({ kind, name: attachment.name, url: URL.createObjectURL(blob.type ? blob : new Blob([blob], { type: mime })) });
    } catch { setError("This document couldn’t be previewed. Try downloading it."); }
    finally { setBusyId(""); }
  }

  async function downloadAttachment(attachment: BudgetAttachment) {
    setError("");
    setBusyId(attachment.id);
    try {
      const blob = await getBudgetAttachment(attachment.id);
      if (!blob) { setError("This file isn’t available in this browser."); return; }
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = attachment.name;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch { setError("This document couldn’t be downloaded. Please try again."); }
    finally { setBusyId(""); }
  }

  const metrics = [
    { label: "Budgeted", value: item.budgeted, tone: "bg-[#f2f7f3] border-[#dde9df]", hint: "Planned cost" },
    { label: "Invoiced", value: item.invoiced, tone: "bg-[#f2f5f9] border-[#e0e9f1]", hint: "Billed by vendor" },
    { label: "Paid", value: item.paid, tone: "bg-[#f6f3fa] border-[#e9e1f0]", hint: "Recorded payments" },
    { label: "Balance left", value: itemBalance(item), tone: "bg-[#fbf6ed] border-[#efe5d6]", hint: "Still to cover" },
  ];

  return <Dialog.Root open={open} onOpenChange={onOpenChange}><Dialog.Portal>
    <Dialog.Overlay className="fixed inset-0 z-50 bg-[#10231a]/55 backdrop-blur-[2px]" />
    <Dialog.Content className="fixed left-1/2 top-1/2 z-50 flex max-h-[min(94vh,1000px)] w-[calc(100vw-1.5rem)] max-w-5xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-xl bg-white shadow-[var(--shadow-lg)] focus:outline-none">
      <header className="flex items-start justify-between gap-4 border-b border-border-subtle px-5 py-5 sm:px-7"><div className="min-w-0"><p className="text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-text-tertiary">{eventName} <span className="mx-1">/</span> {groupName}</p><Dialog.Title className="mt-1 text-xl font-semibold tracking-tight text-text-primary sm:text-2xl">{item.name}</Dialog.Title><Dialog.Description className="mt-1 text-xs text-text-secondary">Budget item details, payment plan and supporting documents.</Dialog.Description><div className="mt-3 flex flex-wrap gap-2"><VendorStatusBadge status={item.vendorStatus} /><BudgetStatusBadge status={item.status} /></div></div><Dialog.Close asChild><button type="button" aria-label="Close details" className="flex size-9 shrink-0 items-center justify-center rounded-lg text-text-tertiary hover:bg-background-subtle"><X className="size-4" /></button></Dialog.Close></header>

      <div className="min-h-0 space-y-6 overflow-y-auto px-5 py-5 sm:px-7 sm:py-6">
        <section aria-label="Financial overview"><div className="flex flex-wrap items-end justify-between gap-2"><div><h3 className="text-sm font-semibold text-text-primary">Financial overview</h3><p className="mt-1 text-xs text-text-secondary">All amounts in {item.currency}. Figures are recorded here; no payment is processed.</p></div></div><div className="mt-3 grid grid-cols-2 gap-3 xl:grid-cols-4">{metrics.map((metric) => <div key={metric.label} className={`min-w-0 rounded-xl border p-4 ${metric.tone}`}><p className="text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-text-secondary">{metric.label}</p><p className="mt-2 break-words text-base font-semibold tracking-tight tabular-nums text-text-primary sm:text-lg" title={formatBudgetMoney(metric.value, item.currency)}>{formatBudgetMoney(metric.value, item.currency)}</p><p className="mt-1 text-[0.6875rem] text-text-tertiary">{metric.hint}</p></div>)}</div><p className="mt-2 text-[0.6875rem] leading-5 text-text-tertiary">Balance left uses the higher of budgeted or invoiced, minus paid. It is a planning balance, not an automatic charge.</p></section>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
          <div className="space-y-5">
            <section className="rounded-xl border border-border-subtle p-4"><h3 className="text-sm font-semibold">Vendor & payment</h3><div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-1"><div><p className="text-[0.6875rem] text-text-tertiary">Vendor</p><p className="mt-1 text-xs font-semibold">{item.vendor || "No vendor selected"}</p></div><div><p className="text-[0.6875rem] text-text-tertiary">Single payment due</p><p className="mt-1 flex items-center gap-1.5 text-xs font-semibold"><CalendarDays className="size-3.5 text-brand-primary" aria-hidden="true" />{formatDueDate(item.paymentDate)}</p></div></div></section>
            <section className="rounded-xl border border-border-subtle p-4"><h3 className="text-sm font-semibold">Installment plan</h3>{installments.length ? <div className="mt-3 divide-y divide-border-subtle">{installments.map((installment, index) => <div key={installment.id} className="flex flex-wrap items-start justify-between gap-2 py-3 text-xs first:pt-0 last:pb-0"><div><p className="font-semibold">Installment {index + 1} · {installment.percentage}%</p><p className="mt-1 text-text-tertiary">Due {formatDueDate(installment.dueDate)}</p></div><div className="text-right"><p className="font-semibold tabular-nums">{formatBudgetMoney(installment.amount, item.currency)}</p><p className="mt-1 text-text-tertiary">{formatBudgetMoney(installment.due, item.currency)} left</p></div></div>)}</div> : <p className="mt-2 text-xs leading-5 text-text-secondary">No installments scheduled. Add percentages and dates when you have a payment plan.</p>}</section>
            <section className="rounded-xl border border-border-subtle p-4"><div className="flex items-center gap-2"><StickyNote className="size-4 text-brand-primary" aria-hidden="true" /><h3 className="text-sm font-semibold">Notes</h3></div>{item.notes.trim() ? <p className="mt-3 whitespace-pre-wrap break-words text-xs leading-6 text-text-secondary">{item.notes}</p> : <p className="mt-2 text-xs text-text-tertiary">No note added to this item.</p>}</section>
          </div>

          <section className="min-w-0 rounded-xl border border-border-subtle p-4"><div className="flex flex-wrap items-center justify-between gap-2"><div><h3 className="text-sm font-semibold">Documents</h3><p className="mt-1 text-xs text-text-secondary">Preview supported files or download the original.</p></div><span className="rounded-full bg-[#f1f4f1] px-2.5 py-1 text-[0.6875rem] font-semibold text-text-secondary">{item.attachments.length} {item.attachments.length === 1 ? "file" : "files"}</span></div>
            {item.attachments.length ? <div className="mt-4 space-y-2">{item.attachments.map((attachment) => { const kind = previewKind(attachment); const Icon = kind === "image" ? FileImage : /\.(xlsm?|xlsx|csv)$/i.test(attachment.name) ? FileSpreadsheet : FileText; return <div key={attachment.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-border-subtle bg-[#fbfcfb] p-3"><span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white text-brand-primary"><Icon className="size-4" aria-hidden="true" /></span><div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold" title={attachment.name}>{attachment.name}</p><p className="mt-0.5 text-[0.6875rem] text-text-tertiary">{formatFileSize(attachment.size)} · {kind ? "Preview available" : "Download to open"}</p></div><div className="flex shrink-0 gap-1">{kind && <button type="button" onClick={() => void previewAttachment(attachment)} disabled={busyId === attachment.id} className="inline-flex min-h-9 items-center gap-1 rounded-md px-2 text-xs font-semibold text-brand-primary hover:bg-[#eaf3ed] disabled:opacity-50"><Eye className="size-3.5" aria-hidden="true" />Preview</button>}<button type="button" onClick={() => void downloadAttachment(attachment)} disabled={busyId === attachment.id} className="inline-flex min-h-9 items-center gap-1 rounded-md px-2 text-xs font-semibold text-text-secondary hover:bg-[#eef1ee] disabled:opacity-50"><Download className="size-3.5" aria-hidden="true" />Download</button></div></div>; })}</div> : <div className="mt-4 rounded-lg border border-dashed border-border-subtle bg-[#fafbfa] px-4 py-9 text-center"><FileText className="mx-auto size-6 text-text-tertiary" aria-hidden="true" /><p className="mt-2 text-xs font-semibold">No documents attached</p><p className="mt-1 text-[0.6875rem] text-text-tertiary">Add an invoice or supporting file when you edit this item.</p></div>}
            {error && <p role="alert" className="mt-3 rounded-lg bg-error-soft px-3 py-2 text-xs text-error">{error}</p>}
            {preview && <div className="mt-4 overflow-hidden rounded-lg border border-border-subtle"><div className="flex items-center justify-between gap-2 bg-[#f4f6f4] px-3 py-2"><p className="min-w-0 truncate text-xs font-semibold">Preview · {preview.name}</p><button type="button" onClick={() => setPreview(null)} aria-label="Close document preview" className="flex size-7 shrink-0 items-center justify-center rounded-md hover:bg-white"><X className="size-4" /></button></div>{preview.kind === "image" ? <div className="relative h-80 bg-[#eef0ee]"><Image src={preview.url} alt={`Preview of ${preview.name}`} fill unoptimized sizes="(min-width: 1024px) 500px, 100vw" className="object-contain" /></div> : preview.kind === "pdf" ? <iframe title={`Preview of ${preview.name}`} src={preview.url} className="h-[min(60vh,520px)] w-full bg-white" /> : <pre className="max-h-80 overflow-auto whitespace-pre-wrap break-words bg-white p-4 text-xs leading-5 text-text-secondary">{preview.content}</pre>}</div>}
            <p className="mt-3 text-[0.6875rem] leading-5 text-text-tertiary">PDF, images, CSV and text can be previewed here. Word and Excel files download to open in their own app; XLSM macros are never run here.</p>
          </section>
        </div>
      </div>
      <div className="flex justify-end gap-2 border-t border-border-subtle px-5 py-4 sm:px-7"><Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>Close</Button><Button type="button" size="sm" leadingIcon={<Pencil className="size-3.5" />} onClick={onEdit}>Edit item</Button></div>
    </Dialog.Content>
  </Dialog.Portal></Dialog.Root>;
}
