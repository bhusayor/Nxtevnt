"use client";

import { DeleteConfirmation } from "@/components/ui/delete-confirmation";

import { useEffect, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Download, FileText, LoaderCircle, Plus, Trash2, UploadCloud, X } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { getBudgetAttachment, saveBudgetAttachments, validateBudgetAttachment } from "@/lib/budget-attachments";
import { currencies } from "@/lib/planner-budget";
import type { PlannerProfile, ProfileCurrency } from "@/lib/planner-profile-types";
import { cn } from "@/lib/utils/cn";
import { ProfileTextField, ProfileMoneyField, ProfileSection, type ProfileUpdate } from "./profile-fields";

export function ProfileRateCard({ profile, update }: { profile: PlannerProfile; update: ProfileUpdate }) {
  const rate = profile.rateCard;
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<{ url: string; type: string; name: string } | null>(null);
  const [removing, setRemoving] = useState("");
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview.url); }, [preview]);
  const patch = (change: Partial<typeof rate>) => update((current) => ({ ...current, rateCard: { ...current.rateCard, ...change } }));
  async function upload(file?: File) {
    if (!file || busy) return;
    const problem = validateBudgetAttachment(file);
    if (problem) { setError(problem); return; }
    setBusy(true); setError("");
    const document = { id: `profile-rate:${crypto.randomUUID()}`, name: file.name, type: file.type || (file.name.toLowerCase().endsWith(".pdf") ? "application/pdf" : "application/octet-stream"), size: file.size };
    try { await saveBudgetAttachments([{ attachment: document, file }]); patch({ document }); }
    catch (problem) { setError(problem instanceof Error ? problem.message : "The rate card couldn’t be uploaded."); }
    finally { setBusy(false); if (input.current) input.current.value = ""; }
  }
  async function open(download = false) {
    if (!rate.document) return;
    setError("");
    try {
      const file = await getBudgetAttachment(rate.document.id);
      if (!file) throw new Error("This document is no longer stored in this browser. Upload it again.");
      const url = URL.createObjectURL(file);
      if (download) { const link = document.createElement("a"); link.href = url; link.download = rate.document.name; link.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1500); }
      else setPreview({ url, type: rate.document.type, name: rate.document.name });
    } catch (problem) { setError(problem instanceof Error ? problem.message : "This rate card couldn’t be opened."); }
  }
  return <ProfileSection title="Rate card" description="Upload your existing rate card or create a clear list of services and prices." icon={FileText}>
    <div className="mb-5 inline-flex rounded-xl bg-[#f4f4f4] p-1">{([{ value: "create", label: "Create rate card" }, { value: "upload", label: "Upload a file" }] as const).map((option) => <button key={option.value} type="button" aria-pressed={rate.mode === option.value} onClick={() => patch({ mode: option.value })} className={cn("min-h-9 rounded-lg px-3 text-xs font-semibold", rate.mode === option.value ? "bg-white text-brand-primary shadow-sm" : "text-text-secondary")}>{option.label}</button>)}</div>
    {rate.mode === "upload" ? <><input ref={input} type="file" aria-label="Upload rate card document" accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.xls,.xlsx,.xlsm,.csv,.txt" disabled={busy} className="sr-only" onChange={(event) => void upload(event.target.files?.[0])} /><button type="button" aria-busy={busy} disabled={busy} onClick={() => input.current?.click()} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); void upload(event.dataTransfer.files[0]); }} className="flex min-h-40 w-full flex-col items-center justify-center rounded-2xl border border-dashed border-border-default bg-[#fafafa] p-5 text-center">{busy ? <LoaderCircle className="size-6 text-brand-primary motion-safe:animate-spin" /> : <UploadCloud className="size-6 text-text-secondary" />}<span className="mt-3 text-sm font-semibold">{busy ? "Uploading your rate card…" : "Drag your rate card here, or click to upload"}</span><span className="mt-2 text-xs text-text-tertiary">PDF, image, Word or Excel (including XLSM) · up to 15 MB</span>{busy && <span className="mt-4 h-1.5 w-32 overflow-hidden rounded-full bg-[#e8e8e8]"><span className="block h-full w-2/3 rounded-full bg-brand-primary motion-safe:animate-pulse" /></span>}</button>{rate.document && <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border-subtle bg-white p-4"><div className="flex min-w-0 items-center gap-3"><FileText className="size-6 shrink-0 text-text-secondary" /><div className="min-w-0"><p className="break-words text-xs font-semibold">{rate.document.name}</p><p className="mt-1 text-[0.6875rem] text-text-tertiary">{(rate.document.size / 1024 / 1024).toFixed(1)} MB</p></div></div><div className="flex gap-3">{(rate.document.type.startsWith("image/") || rate.document.type === "application/pdf") && <button type="button" onClick={() => void open()} className="text-xs font-semibold text-brand-primary hover:underline">Preview</button>}<button type="button" onClick={() => void open(true)} aria-label="Download rate card" className="flex size-8 items-center justify-center rounded-lg hover:bg-background-subtle"><Download className="size-4" /></button></div></div>}</> : <div className="space-y-4"><div className="max-w-60"><Select label="Rate card currency" value={rate.currency} onValueChange={(value) => patch({ currency: value as ProfileCurrency })} options={currencies.map((currency) => ({ value: currency.code, label: currency.label }))} className="text-xs" /></div>{rate.lines.map((line) => <div key={line.id} className="rounded-2xl border border-border-subtle bg-white p-4"><div className="flex items-start gap-2"><div className="min-w-0 flex-1"><ProfileTextField label="Service" value={line.title} maxLength={100} placeholder="e.g. On-the-day coordination" onSave={(title) => update((current) => ({ ...current, rateCard: { ...current.rateCard, lines: current.rateCard.lines.map((item) => item.id === line.id ? { ...item, title } : item) } }))} /><ProfileTextField label="Description" value={line.description} maxLength={400} placeholder="What is included?" onSave={(description) => update((current) => ({ ...current, rateCard: { ...current.rateCard, lines: current.rateCard.lines.map((item) => item.id === line.id ? { ...item, description } : item) } }))} /></div><button type="button" aria-label={`Remove rate ${line.title || "item"}`} onClick={() => setRemoving(line.id)} className="flex size-8 shrink-0 items-center justify-center rounded-lg text-text-tertiary hover:bg-error-soft hover:text-error"><Trash2 className="size-4" /></button></div><div className="mt-3 grid gap-3 sm:grid-cols-2"><ProfileMoneyField label="Price" currency={rate.currency} value={line.price} onSave={(price) => update((current) => ({ ...current, rateCard: { ...current.rateCard, lines: current.rateCard.lines.map((item) => item.id === line.id ? { ...item, price } : item) } }))} /><Select label="Pricing unit" value={line.unit} onValueChange={(unit) => update((current) => ({ ...current, rateCard: { ...current.rateCard, lines: current.rateCard.lines.map((item) => item.id === line.id ? { ...item, unit } : item) } }))} options={["Per event", "Per day", "Per hour", "Per guest", "Flat fee"].map((value) => ({ value, label: value }))} className="text-xs" /></div><DeleteConfirmation open={removing === line.id} onOpenChange={(open) => { if (!open) setRemoving(""); }} title="Delete rate card service?" description={`“${line.title || "This service"}” will be removed from your profile draft. Save your profile to apply this change, or cancel profile editing to restore it.`} onConfirm={() => update((current) => ({ ...current, rateCard: { ...current.rateCard, lines: current.rateCard.lines.filter((item) => item.id !== line.id) } }))} /></div>)}{!rate.lines.length && <p className="rounded-xl border border-dashed border-border-subtle px-5 py-8 text-center text-xs leading-6 text-text-secondary">Add individual services, their prices and what each includes.</p>}<Button type="button" size="sm" variant="outline" leadingIcon={<Plus className="size-3.5" />} onClick={() => patch({ lines: [...rate.lines, { id: crypto.randomUUID(), title: "", description: "", price: "", unit: "Per event" }] })}>Add service to rate card</Button><ProfileTextField label="Rate card note" multiline value={rate.note} placeholder="Add any details clients should know about your rates." onSave={(note) => patch({ note })} maxLength={1000} /></div>}
    {error && <p role="alert" className="mt-3 text-xs text-error">{error}</p>}
    <Dialog.Root open={Boolean(preview)} onOpenChange={(value) => { if (!value) setPreview(null); }}><Dialog.Portal><Dialog.Overlay className="fixed inset-0 z-50 bg-black/65" /><Dialog.Content className="fixed left-1/2 top-1/2 z-50 flex h-[85dvh] w-[calc(100vw-2rem)] max-w-4xl -translate-x-1/2 -translate-y-1/2 flex-col rounded-2xl bg-white p-4"><div className="mb-3 flex items-center justify-between gap-3"><div><Dialog.Title className="text-sm font-semibold">{preview?.name}</Dialog.Title><Dialog.Description className="sr-only">Your uploaded rate card preview.</Dialog.Description></div><Dialog.Close aria-label="Close rate card preview" className="flex size-8 items-center justify-center"><X className="size-5" /></Dialog.Close></div>{preview?.type.startsWith("image/") ? <div className="min-h-0 flex-1"><img src={preview.url} alt={preview.name} className="h-full w-full object-contain" /></div> : preview && <iframe src={preview.url} title={preview.name} className="min-h-0 flex-1 rounded-lg border border-border-subtle" />}</Dialog.Content></Dialog.Portal></Dialog.Root>
  </ProfileSection>;
}
