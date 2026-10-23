"use client";

import { usePlannerEvents } from "@/lib/planner-events";
import { budgetPaymentSchedule, validateBudgetSchedule } from "@/lib/budget-schedule";
import { PaymentScheduleFields } from "./payment-schedule-fields";
import { BudgetItemReceipts } from "./budget-item-receipts";
import { PricingFields } from "./pricing-fields";
import { type PricedAs } from "@/lib/budget-pricing";
import { BudgetStatusBadge } from "./budget-status-badges";
import type { QuickBudgetDraft } from "./budget-quick-add";

import { ConfirmDeleteButton } from "@/components/ui/delete-confirmation";

import { useEffect, useRef, useState, type ChangeEvent, type DragEvent, type FormEvent } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { CheckCircle2, FileText, Plus, Trash2, UploadCloud, X } from "@/components/ui/icons";

import { BudgetNativeSelect } from "@/components/planner/budget/budget-controls";
import { BudgetAmountInput, formatBudgetAmountInput } from "@/components/planner/budget/budget-amount-input";
import { VendorPicker } from "@/components/planner/budget/vendor-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { deleteBudgetAttachments, saveBudgetAttachments, validateBudgetAttachment } from "@/lib/budget-attachments";
import { currencies, importBudgetData, paymentStatus, vendorStatuses, type BudgetAttachment, type BudgetGroup, type BudgetInstallment, type BudgetItem, type VendorStatus } from "@/lib/planner-budget";
import { cn } from "@/lib/utils/cn";

export function BudgetItemDialog({ open, onOpenChange, group, groups, vendors, initial, draft, onSaved }: { open: boolean; onOpenChange: (open: boolean) => void; group: BudgetGroup; groups: BudgetGroup[]; vendors: string[]; initial?: BudgetItem | null; draft?: QuickBudgetDraft; onSaved: (currency: string) => void }) {
  const event = usePlannerEvents().find((entry) => entry.id === group.eventId);
  const guestCount = event?.guestCount || "";
  const [name, setName] = useState(initial?.name ?? draft?.name ?? "");
  const [vendor, setVendor] = useState(initial?.vendor ?? "");
  const [vendorStatus, setVendorStatus] = useState<VendorStatus>(initial?.vendorStatus ?? "not-sourced");
  const [currency, setCurrency] = useState(initial?.currency ?? group.currency);
  const [pricedAs, setPricedAs] = useState<PricedAs>(initial?.pricedAs ?? draft?.pricedAs ?? "flat-fee");
  const [quantity, setQuantity] = useState(String(initial?.quantity ?? draft?.quantity ?? 1));
  const [unitPrice, setUnitPrice] = useState(initial?.unitPrice !== undefined ? formatBudgetAmountInput(String(initial.unitPrice)) : initial?.budgeted ? formatBudgetAmountInput(String(initial.budgeted / (initial.pricedAs && initial.pricedAs !== "flat-fee" && initial.quantity && initial.quantity > 0 ? initial.quantity : 1))) : draft?.amount ?? "");
  const effectiveQuantity = pricedAs === "per-guest" ? Number(guestCount) : pricedAs === "flat-fee" ? 1 : Number(quantity);
  const calculatedBudget = Math.round(effectiveQuantity * Number(unitPrice.replaceAll(",", "")) * 100) / 100;
  const budgeted = formatBudgetAmountInput(String(Number.isFinite(calculatedBudget) ? calculatedBudget : 0));
  const [invoiced, setInvoiced] = useState(initial?.invoiced ? formatBudgetAmountInput(String(initial.invoiced)) : "");
  const [paid, setPaid] = useState(initial?.paid ? formatBudgetAmountInput(String(initial.paid)) : "");
  const paymentDate = "";
  const [fileTab, setFileTab] = useState<"documents" | "receipts">("documents");
  const payments = initial?.payments ?? [];
  const receiptCount = payments.filter((payment) => payment.receipt).length;
  const [notes, setNotes] = useState(initial?.notes ?? draft?.notes ?? "");
  const [installments, setInstallments] = useState<BudgetInstallment[]>(initial ? budgetPaymentSchedule(initial) : []);
  const [attachments, setAttachments] = useState<BudgetAttachment[]>(initial?.attachments ?? []);
  const [uploads, setUploads] = useState<{ id: string; name: string; percent: number; phase: "reading" | "storing" }[]>([]);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const stagedIds = useRef(new Set<string>());
  const uploading = useRef(false);
  const active = useRef(true);
  const currentPaymentStatus = paymentStatus({ budgeted: Number(budgeted.replaceAll(",", "")) || 0, invoiced: Number(invoiced.replaceAll(",", "")) || 0, paid: Number(paid.replaceAll(",", "")) || 0, installments, paymentDate, status: initial?.status ?? "unpaid" });

  useEffect(() => {
    const pendingIds = stagedIds.current;
    active.current = true;
    return () => { active.current = false; void deleteBudgetAttachments([...pendingIds]).catch(() => undefined); pendingIds.clear(); };
  }, []);

  function close(next: boolean) {
    if (next) { onOpenChange(true); return; }
    if (saving || uploading.current) return;
    const uncommitted = [...stagedIds.current];
    stagedIds.current.clear();
    void deleteBudgetAttachments(uncommitted).catch(() => undefined);
    onOpenChange(false);
  }

  function readWithProgress(file: File, id: string) {
    return new Promise<void>((resolve, reject) => {
      const reader = new FileReader();
      reader.onprogress = (event) => { if (event.lengthComputable) setUploads((current) => current.map((entry) => entry.id === id ? { ...entry, percent: Math.round(event.loaded / event.total * 100) } : entry)); };
      reader.onload = () => resolve();
      reader.onerror = () => reject(new Error(`Couldn’t read ${file.name}. Try adding it again.`));
      reader.readAsArrayBuffer(file);
    });
  }

  async function addFiles(files: File[]) {
    if (!files.length || uploading.current) return;
    const invalid = files.map(validateBudgetAttachment).find(Boolean);
    if (invalid) { setError(invalid); return; }
    const entries = files.map((file) => ({ attachment: { id: crypto.randomUUID(), name: file.name, type: file.type, size: file.size }, file }));
    uploading.current = true;
    setError("");
    setUploads(entries.map((entry) => ({ id: entry.attachment.id, name: entry.file.name, percent: 0, phase: "reading" })));
    for (const entry of entries) {
      try {
        await readWithProgress(entry.file, entry.attachment.id);
        if (!active.current) break;
        setUploads((current) => current.map((upload) => upload.id === entry.attachment.id ? { ...upload, percent: 100, phase: "storing" } : upload));
        await saveBudgetAttachments([entry]);
        if (!active.current) { await deleteBudgetAttachments([entry.attachment.id]).catch(() => undefined); break; }
        stagedIds.current.add(entry.attachment.id);
        setAttachments((current) => [...current, entry.attachment]);
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : `Couldn’t add ${entry.file.name}.`);
      } finally {
        setUploads((current) => current.filter((upload) => upload.id !== entry.attachment.id));
      }
    }
    uploading.current = false;
  }
  function selectFiles(event: ChangeEvent<HTMLInputElement>) { void addFiles(Array.from(event.target.files ?? [])); event.target.value = ""; }
  function dropFiles(event: DragEvent<HTMLButtonElement>) { event.preventDefault(); setDragging(false); void addFiles(Array.from(event.dataTransfer.files)); }
  function removeAttachment(id: string) { setAttachments((current) => current.filter((item) => item.id !== id)); if (stagedIds.current.delete(id)) void deleteBudgetAttachments([id]).catch(() => undefined); }
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (uploading.current) { setError("Wait for your documents to finish uploading before saving."); return; }
    if (!name.trim()) { setError("Give this item a name."); return; }
    if (!Number.isFinite(Number(unitPrice.replaceAll(",", ""))) || Number(unitPrice.replaceAll(",", "")) < 0 || !Number.isSafeInteger(Math.round(calculatedBudget * 100)) || (pricedAs !== "flat-fee" && (!Number.isFinite(effectiveQuantity) || effectiveQuantity <= 0)) || (["per-guest", "per-trip"].includes(pricedAs) && !Number.isInteger(effectiveQuantity))) { setError("Enter a valid price and count. Guests and trips must be whole numbers above zero."); return; }
    const amounts = [budgeted, invoiced, paid].map((value) => value.trim() ? Number(value.replaceAll(",", "")) : 0);
    if (amounts.some((value) => !Number.isFinite(value) || value < 0)) { setError("Amounts must be zero or more."); return; }
    if (notes.trim().length > 500) { setError("Keep item notes to 500 characters or fewer. Use Event Notes for longer discussion."); return; }
    const scheduleError = validateBudgetSchedule(installments);
    if (scheduleError) { setError(scheduleError); return; }
    setSaving(true); setError("");
    try {
      const destination = groups.find((entry) => entry.name.toLowerCase() === group.name.toLowerCase() && entry.eventId === group.eventId && entry.currency === currency) ?? { ...group, id: crypto.randomUUID(), currency, createdAt: new Date().toISOString() };
      const item: BudgetItem = { id: initial?.id ?? crypto.randomUUID(), groupId: destination.id, eventId: destination.eventId, name: name.trim(), vendor: vendor.trim(), vendorStatus, currency, budgeted: amounts[0], pricedAs, quantity: effectiveQuantity, unitPrice: Number(unitPrice.replaceAll(",", "")), invoiced: amounts[1], paid: amounts[2], paymentDate, notes: notes.trim(), status: currentPaymentStatus, installments, attachments, payments: initial?.payments ?? [], createdAt: initial?.createdAt ?? new Date().toISOString() };
      importBudgetData(groups.some((entry) => entry.id === destination.id) ? [] : [destination], [item]);
      await deleteBudgetAttachments((initial?.attachments ?? []).filter((old) => !attachments.some((entry) => entry.id === old.id)).map((entry) => entry.id)).catch(() => undefined);
      stagedIds.current.clear();
      onSaved(currency); onOpenChange(false);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "This item couldn’t be saved. Please try again.");
    } finally { setSaving(false); }
  }

  return <Dialog.Root open={open} onOpenChange={close}><Dialog.Portal><Dialog.Overlay className="fixed inset-0 z-50 bg-[#10231a]/50 backdrop-blur-[2px]" /><Dialog.Content className="fixed left-1/2 top-1/2 z-50 flex max-h-[min(92vh,900px)] w-[calc(100vw-2rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-xl bg-white shadow-[var(--shadow-lg)] focus:outline-none"><div className="flex items-start justify-between gap-3 border-b border-border-subtle px-5 py-4 sm:px-6"><div><Dialog.Title className="text-lg font-semibold tracking-tight">{initial ? "Edit budget item" : "Add budget item"}</Dialog.Title><Dialog.Description className="mt-1 text-sm leading-5 text-text-secondary">In {group.name}. Keep the figures current as your plan changes.</Dialog.Description></div><Dialog.Close asChild><button type="button" aria-label="Close dialog" className="flex size-8 shrink-0 items-center justify-center rounded-md text-text-tertiary hover:bg-background-subtle"><X className="size-4" /></button></Dialog.Close></div><form onSubmit={(event) => void save(event)} className="flex min-h-0 flex-1 flex-col"><div className="min-h-0 space-y-6 overflow-y-auto px-5 py-5 sm:px-6">
    <section className="space-y-4"><p className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">Item & vendor</p><Input label="Item name" required placeholder="e.g. Reception draping & florals" value={name} onChange={(change) => setName(change.target.value)} /><div className="grid gap-4 sm:grid-cols-2"><VendorPicker value={vendor} onChange={setVendor} vendors={vendors} /><label className="text-sm font-semibold text-text-primary">Booking status<BudgetNativeSelect value={vendorStatus} onChange={(change) => setVendorStatus(change.target.value as VendorStatus)} className="mt-2">{vendorStatuses.map((entry) => <option key={entry.value} value={entry.value}>{entry.label}</option>)}</BudgetNativeSelect></label></div></section>
    <section className="space-y-4 border-t border-border-subtle pt-5"><div><p className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">Money & status</p><p className="mt-1 text-sm text-text-secondary">Budgeted is the planned commitment; invoiced is what the vendor has billed; paid is what you’ve recorded as paid.</p></div><div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-semibold text-text-primary">Currency<BudgetNativeSelect value={currency} onChange={(change) => setCurrency(change.target.value)} className="mt-2">{currencies.map((entry) => <option key={entry.code} value={entry.code}>{entry.label}</option>)}</BudgetNativeSelect></label><div><p className="text-sm font-semibold text-text-primary">Payment status</p><div className="mt-2 flex min-h-11 items-center"><BudgetStatusBadge status={currentPaymentStatus} /></div><p className="mt-1 text-xs leading-5 text-text-tertiary">Updates from amounts paid and payment due dates.</p></div></div><PricingFields guestCount={guestCount} pricedAs={pricedAs} quantity={quantity} price={unitPrice} currency={currency} onChange={(change) => { if (change.pricedAs) setPricedAs(change.pricedAs); if (change.quantity !== undefined) setQuantity(change.quantity); if (change.price !== undefined) setUnitPrice(change.price); }} /><div className="rounded-lg bg-[#f6f8f7] p-3 text-sm">Budgeted total <strong className="float-right tabular-nums">{budgeted || "0"} {currency}</strong></div><div className="grid gap-4 sm:grid-cols-2"><BudgetAmountInput label="Invoiced" value={invoiced} onChange={setInvoiced} /><BudgetAmountInput label="Paid" value={paid} onChange={setPaid} /></div></section>
    <PaymentScheduleFields lines={installments} onChange={setInstallments} eventDate={event?.date} />
    <section className="space-y-3 border-t border-border-subtle pt-5"><div><h3 className="text-sm font-semibold text-text-primary">Documents & receipts</h3></div><div role="group" aria-label="Item files" className="flex flex-wrap gap-2">{([{ id: "documents", label: "Documents", count: attachments.length }, { id: "receipts", label: "Receipts", count: receiptCount }] as const).map((tab) => <button key={tab.id} type="button" aria-pressed={fileTab === tab.id} onClick={() => setFileTab(tab.id)} className={cn("min-h-10 rounded-lg border px-3 text-sm font-semibold transition-colors", fileTab === tab.id ? "border-brand-primary bg-[#edf4ef] text-brand-primary" : "border-border-subtle text-text-secondary hover:bg-background-subtle")}>{tab.label} <span className="ml-1 tabular-nums">{tab.count}</span></button>)}</div><div hidden={fileTab !== "documents"} className="space-y-3"><p className="text-sm leading-6 text-text-secondary">Attach invoices, images, contracts or supporting files. Stored in this browser.</p><input ref={fileInput} type="file" multiple accept=".pdf,.png,.jpg,.jpeg,.webp,.gif,.doc,.docx,.xls,.xlsx,.xlsm,.csv,.txt" onChange={selectFiles} className="sr-only" /><button type="button" onClick={() => fileInput.current?.click()} onDragOver={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={dropFiles} disabled={uploads.length > 0 || saving} className={cn("flex min-h-36 w-full flex-col items-center justify-center rounded-xl border border-dashed px-4 py-5 text-center transition-colors", dragging ? "border-brand-primary bg-[#f0f7f2]" : "border-[#b8c9bd] bg-[#f9fbf9] hover:border-brand-primary hover:bg-[#f3f8f4]", (uploads.length > 0 || saving) && "cursor-wait opacity-70")}><span className="flex size-10 items-center justify-center rounded-xl bg-white text-brand-primary shadow-sm"><UploadCloud className="size-5" /></span><span className="mt-3 text-sm font-semibold text-text-primary">Drag files here or click to upload</span><span className="mt-1 text-sm text-text-secondary">Add an invoice, image or supporting document</span></button><p className="text-center text-xs leading-5 text-text-tertiary">PDF, PNG, JPG, WEBP, GIF, DOC, DOCX, XLS, XLSX, XLSM, CSV, TXT · Max 15 MB per file</p>{uploads.length > 0 && <ul aria-live="polite" className="space-y-2">{uploads.map((upload) => <li key={upload.id} className="rounded-lg border border-[#c8d9cd] bg-[#f7faf8] px-3 py-3 text-sm"><div className="flex items-center gap-2"><span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-white text-brand-primary"><UploadCloud className="size-4 animate-pulse" /></span><span className="min-w-0 flex-1 truncate font-semibold">{upload.name}</span><span className="text-text-secondary">{upload.phase === "storing" ? "Saving…" : `${upload.percent}%`}</span></div><div role="progressbar" aria-label={`Adding ${upload.name}`} aria-valuenow={upload.percent} aria-valuemin={0} aria-valuemax={100} className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#e2ebe4]"><span className={cn("block h-full rounded-full bg-brand-primary transition-[width] duration-300", upload.phase === "storing" && "animate-pulse")} style={{ width: `${upload.percent}%` }} /></div></li>)}</ul>}{attachments.length > 0 && <ul className="space-y-2">{attachments.map((attachment) => <li key={attachment.id} className="flex items-center gap-2 rounded-lg border border-border-subtle px-3 py-2 text-sm"><CheckCircle2 className="size-4 shrink-0 text-brand-primary" /><FileText className="size-4 shrink-0 text-text-tertiary" /><span className="min-w-0 flex-1 truncate">{attachment.name}</span><span className="text-text-tertiary">{attachment.size < 1024 * 1024 ? `${Math.max(1, Math.round(attachment.size / 1024))} KB` : `${(attachment.size / 1024 / 1024).toFixed(1)} MB`}</span><ConfirmDeleteButton confirmationTitle="Delete attachment?" description={`“${attachment.name}” will be removed from this item’s draft documents. Save the item to apply the change.`} onConfirm={() => removeAttachment(attachment.id)} aria-label={`Remove ${attachment.name}`} className="flex size-10 shrink-0 items-center justify-center rounded-lg text-text-tertiary hover:bg-error-soft hover:text-error"><X className="size-4" aria-hidden="true" /></ConfirmDeleteButton></li>)}</ul>}</div>{fileTab === "receipts" && <BudgetItemReceipts payments={payments} currency={initial?.currency ?? currency} />}</section>
    {fileTab === "documents" && attachments.length > 0 && <fieldset className="space-y-3 rounded-xl border border-border-subtle p-4"><legend className="px-1 text-sm font-semibold">File folders</legend><p className="text-sm text-text-secondary">Mark invoices so they appear in Files → Invoices. Other documents appear in Budget attachments.</p>{attachments.map(attachment => <label key={attachment.id} className="flex flex-wrap items-center justify-between gap-2 text-sm"><span className="min-w-0 flex-1 break-words">{attachment.name}</span><select aria-label={`File folder for ${attachment.name}`} value={attachment.category || "document"} disabled={saving} onChange={change => setAttachments(current => current.map(entry => entry.id === attachment.id ? { ...entry, category: change.target.value as "document" | "invoice" } : entry))} className="h-10 rounded-lg border border-border-subtle bg-white px-2 text-sm"><option value="document">Budget attachments</option><option value="invoice">Invoices</option></select></label>)}</fieldset>}
    <Textarea label="Notes" optional rows={3} maxLength={500} helperText={`Keep this brief (up to 500 characters). Use Event Notes for longer discussion. ${notes.length}/500`} placeholder="Add a short payment, invoice or booking note…" value={notes} onChange={(change) => setNotes(change.target.value)} />{error && <p role="alert" className="text-sm text-error">{error}</p>}
  </div><div className="flex justify-end gap-2 border-t border-border-subtle px-5 py-4 sm:px-6"><Button type="button" variant="outline" size="md" disabled={saving || uploads.length > 0} onClick={() => close(false)}>Cancel</Button><Button type="submit" size="md" disabled={saving || uploads.length > 0}>{saving ? "Saving…" : initial ? "Save changes" : "Save item"}</Button></div></form></Dialog.Content></Dialog.Portal></Dialog.Root>;
}
