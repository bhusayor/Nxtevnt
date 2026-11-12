"use client";

import { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import Image from "next/image";
import { Copy, Download, Send, X } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import type { PlannerEvent } from "@/lib/planner-events";
import { toDataURL } from "@/vendor/qrcode/lib/browser";

type FormKind = "collect" | "rsvp";

export function EventFormShareDialog({ event, kind, open, onOpenChange }: { event: PlannerEvent; kind: FormKind; open: boolean; onOpenChange: (open: boolean) => void }) {
  const url = typeof window === "undefined" ? "" : new URL(`/guest/${encodeURIComponent(event.id)}/${kind}`, window.location.origin).toString();
  const [qr, setQr] = useState("");
  const [copied, setCopied] = useState<"link" | "message" | null>(null);
  const isCollect = kind === "collect";
  const title = isCollect ? "Share the collector" : "Share the RSVP form";
  const message = isCollect
    ? `Hi! You’re warmly invited to ${event.name}. Please tell us who’s coming so we can plan properly: ${url}`
    : `Hi! Please let us know if you can join us for ${event.name}: ${url}`;

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    toDataURL(url, { width: 224, margin: 2, color: { dark: "#183d30", light: "#ffffff" } }).then((image) => { if (!cancelled) setQr(image); }).catch(() => { if (!cancelled) setQr(""); });
    return () => { cancelled = true; };
  }, [url, open]);

  async function copy(value: string, what: "link" | "message") {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(what);
      window.setTimeout(() => setCopied(null), 2200);
    } catch { setCopied(null); }
  }

  return <Dialog.Root open={open} onOpenChange={onOpenChange}><Dialog.Portal>
    <Dialog.Overlay className="fixed inset-0 z-[80] bg-[#172d23]/45 backdrop-blur-[2px]" />
    <Dialog.Content className="fixed left-1/2 top-1/2 z-[81] max-h-[min(90dvh,680px)] w-[calc(100vw-2rem)] max-w-[640px] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-border-subtle bg-white p-5 shadow-[var(--shadow-lg)] focus:outline-none sm:p-6">
      <div className="flex items-start justify-between gap-4"><div><Dialog.Title className="text-lg font-semibold text-text-primary">{title}</Dialog.Title><Dialog.Description className="mt-1 text-sm text-text-secondary">{isCollect ? "Collect doesn’t message guests. Share the link your own way." : "Share this link so guests can respond to your invitation."}</Dialog.Description></div><Dialog.Close asChild><button type="button" aria-label="Close share dialog" className="flex size-8 shrink-0 items-center justify-center rounded-lg text-text-secondary hover:bg-background-subtle"><X className="size-4" /></button></Dialog.Close></div>
      <div className="mt-5 grid gap-5 sm:grid-cols-[minmax(0,1fr)_150px]">
        <div className="min-w-0 space-y-4">
          <div><label htmlFor="event-form-share-link" className="mb-1.5 block text-xs font-semibold text-text-primary">Form link</label><div className="flex gap-2"><input id="event-form-share-link" readOnly value={url} onFocus={(event) => event.currentTarget.select()} className="h-10 min-w-0 flex-1 truncate rounded-lg border border-border-default bg-[#f8faf8] px-3 text-xs text-text-primary" /><button type="button" onClick={() => void copy(url, "link")} aria-label="Copy form link" title="Copy form link" className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-border-default text-text-secondary hover:bg-[#f3f7f4] hover:text-brand-primary"><Copy className="size-4" /></button></div>{copied === "link" && <p role="status" className="mt-1 text-xs text-brand-primary">Link copied</p>}</div>
          <div><label htmlFor="event-form-share-message" className="mb-1.5 block text-xs font-semibold text-text-primary">WhatsApp message</label><textarea id="event-form-share-message" readOnly value={message} className="min-h-28 w-full resize-none rounded-lg border border-border-default bg-[#f8faf8] px-3 py-2 text-sm leading-5 text-text-primary" /></div>
          <div className="flex flex-wrap gap-2"><Button type="button" size="sm" variant="outline" leadingIcon={<Copy className="size-3.5" />} onClick={() => void copy(message, "message")}>{copied === "message" ? "Copied" : "Copy WhatsApp message"}</Button><a href={`mailto:?subject=${encodeURIComponent(event.name)}&body=${encodeURIComponent(message)}`} className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border-default px-3 text-xs font-semibold text-text-primary hover:bg-[#f3f7f4]"><Send className="size-3.5" />Send to myself</a><a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex h-8 items-center rounded-lg border border-border-default px-3 text-xs font-semibold text-text-primary hover:bg-[#f3f7f4]">Open public form</a></div>
        </div>
        <div className="flex flex-col items-center gap-2"><div className="flex size-[150px] items-center justify-center rounded-xl border border-border-subtle bg-white p-2">{qr ? <Image unoptimized src={qr} alt="QR code for the form link" width={134} height={134} /> : <span className="text-center text-xs text-text-tertiary">Preparing QR code</span>}</div>{qr && <a href={qr} download={`${event.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-${kind}-qr.png`} className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium text-brand-primary hover:bg-[#f3f7f4]"><Download className="size-3.5" />Download QR</a>}</div>
      </div>
      {isCollect && <p className="mt-4 border-t border-border-subtle pt-3 text-xs text-text-secondary">Invitations are sent from the Guest list once names are in.</p>}
    </Dialog.Content>
  </Dialog.Portal></Dialog.Root>;
}
