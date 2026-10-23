"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Download, Eye, ReceiptText, X } from "@/components/ui/icons";
import { getBudgetAttachment } from "@/lib/budget-attachments";
import { formatBudgetMoney, type BudgetAttachment, type BudgetPayment } from "@/lib/planner-budget";
import { formatEventDate } from "@/lib/planner-events";

type ReceiptPreview = { url: string; name: string; type: string };
const previewTypes = ["application/pdf", "image/jpeg", "image/png", "image/webp"];

/** Payment receipts stay linked to their recorded payments; viewing never edits the ledger. */
export function BudgetItemReceipts({ payments, currency }: { payments: BudgetPayment[]; currency: string }) {
  const receipts = payments.flatMap((payment) => payment.receipt ? [{ payment, receipt: payment.receipt }] : []);
  const [preview, setPreview] = useState<ReceiptPreview | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const request = useRef(0);
  const previewUrl = useRef("");

  useEffect(() => () => { request.current++; if (previewUrl.current) URL.revokeObjectURL(previewUrl.current); }, []);

  function closePreview() {
    request.current++;
    if (previewUrl.current) URL.revokeObjectURL(previewUrl.current);
    previewUrl.current = ""; setPreview(null); setBusy("");
  }

  async function openReceipt(receipt: BudgetAttachment, download: boolean) {
    const attempt = ++request.current;
    setBusy(receipt.id); setError("");
    try {
      const file = await getBudgetAttachment(receipt.id);
      if (attempt !== request.current) return;
      if (!file) { setError("This receipt isn’t available in this browser. Open it in the browser where it was uploaded."); return; }
      if (!download && !previewTypes.includes(receipt.type)) { setError("This receipt can’t be previewed. Download it instead."); return; }
      const url = URL.createObjectURL(new Blob([file], { type: previewTypes.includes(receipt.type) ? receipt.type : "application/octet-stream" }));
      if (download) {
        try {
          const link = document.createElement("a");
          link.href = url; link.download = receipt.name;
          document.body.appendChild(link); link.click(); link.remove();
        } finally { window.setTimeout(() => URL.revokeObjectURL(url), 60_000); }
      } else {
        if (previewUrl.current) URL.revokeObjectURL(previewUrl.current);
        previewUrl.current = url;
        setPreview({ url, name: receipt.name, type: receipt.type });
      }
    } catch { if (attempt === request.current) setError("This receipt couldn’t be opened. Please try again."); }
    finally { if (attempt === request.current) setBusy(""); }
  }

  return <div className="space-y-3" aria-label="Payment receipts">
    <p className="text-sm leading-6 text-text-secondary">Receipts attached when you log a payment appear here, alongside this item’s documents. Stored in this browser.</p>
    {receipts.length ? <ul className="space-y-3">{receipts.map(({ payment, receipt }) => <li key={`${payment.id}:${receipt.id}`} className="rounded-xl border border-border-subtle p-3 sm:p-4">
      <div className="flex items-start gap-3"><ReceiptText className="mt-0.5 size-5 shrink-0 text-brand-primary" aria-hidden="true" /><div className="min-w-0 flex-1"><p className="break-words text-sm font-semibold">{receipt.name}</p><p className="mt-1 text-sm leading-6 text-text-secondary">{formatBudgetMoney(payment.amount, currency)} · {formatEventDate(payment.date, { day: "numeric", month: "short", year: "numeric" })}</p><p className="mt-1 text-xs text-text-tertiary">{Math.max(1, Math.round(receipt.size / 1024)).toLocaleString("en-NG")} KB{payment.reference ? ` · ${payment.reference}` : ""}</p></div></div>
      <div className="mt-3 flex flex-wrap gap-2">{previewTypes.includes(receipt.type) && <button type="button" disabled={Boolean(busy)} onClick={() => void openReceipt(receipt, false)} aria-label={`Preview receipt ${receipt.name}`} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-border-subtle px-3 text-sm font-semibold text-brand-primary hover:bg-background-subtle disabled:opacity-50"><Eye className="size-4" aria-hidden="true" />Preview</button>}<button type="button" disabled={Boolean(busy)} onClick={() => void openReceipt(receipt, true)} aria-label={`Download receipt ${receipt.name}`} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-border-subtle px-3 text-sm font-semibold text-text-secondary hover:bg-background-subtle disabled:opacity-50"><Download className="size-4" aria-hidden="true" />Download</button>{busy === receipt.id && <span role="status" className="self-center text-sm text-text-tertiary">Opening…</span>}</div>
    </li>)}</ul> : <div className="rounded-xl border border-dashed border-border-strong px-4 py-7 text-center"><ReceiptText className="mx-auto size-6 text-text-tertiary" aria-hidden="true" /><p className="mt-3 text-sm font-semibold">No receipts yet</p><p className="mt-1 text-sm leading-6 text-text-secondary">Use Log a payment on the budget row to attach a receipt to a payment you’ve made.</p></div>}
    {error && <p role="alert" className="rounded-lg bg-error-soft p-3 text-sm leading-6 text-error">{error}</p>}
    {preview && <section aria-label={`Receipt preview: ${preview.name}`} className="overflow-hidden rounded-xl border border-border-subtle"><header className="flex items-center justify-between gap-3 border-b border-border-subtle p-3"><p className="min-w-0 break-words text-sm font-semibold">{preview.name}</p><button type="button" aria-label="Close receipt preview" onClick={closePreview} className="flex size-10 shrink-0 items-center justify-center rounded-lg text-text-secondary hover:bg-background-subtle"><X className="size-4" aria-hidden="true" /></button></header>{preview.type === "application/pdf" ? <iframe src={preview.url} title={`Receipt: ${preview.name}`} className="h-[min(55dvh,480px)] w-full bg-background-subtle" /> : <div className="relative h-[min(55dvh,480px)] bg-background-subtle"><Image src={preview.url} alt={`Receipt: ${preview.name}`} fill unoptimized sizes="(min-width: 640px) 576px, 90vw" className="object-contain" /></div>}</section>}
  </div>;
}
