"use client";

import { useRef, useState, type ButtonHTMLAttributes, type ReactNode } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Trash2, X } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";

export function matchesDeleteConfirmation(value: string, name: string) {
  const text = value.trim();
  return Boolean(text) && (text === name.trim() || text === "DELETE");
}

type Props = { open: boolean; onOpenChange: (open: boolean) => void; title: string; description: ReactNode; onConfirm: (confirmation: string) => boolean | void | Promise<boolean | void>; confirmLabel?: string; confirmationName?: string; error?: string; busy?: boolean };

export function DeleteConfirmation({ open, onOpenChange, ...props }: Props) {
  // Remount the form on each opening, so confirmation text and errors never carry over.
  return <Dialog.Root open={open} onOpenChange={(value) => { if (!props.busy) onOpenChange(value); }}>{open && <DeleteConfirmationContent {...props} onOpenChange={onOpenChange} />}</Dialog.Root>;
}

function DeleteConfirmationContent({ title, description, onConfirm, onOpenChange, confirmLabel = "Delete", confirmationName, error, busy = false }: Omit<Props, "open">) {
  const [confirmation, setConfirmation] = useState("");
  const [pending, setPending] = useState(false);
  const [failure, setFailure] = useState("");
  const submitting = useRef(false);
  const returnFocus = useRef<HTMLElement | null>(typeof document === "undefined" ? null : document.activeElement as HTMLElement | null);
  const working = busy || pending;
  const allowed = confirmationName === undefined || matchesDeleteConfirmation(confirmation, confirmationName);
  async function submit() {
    if (!allowed || working || submitting.current) return;
    submitting.current = true; setPending(true); setFailure("");
    try {
      const result = await onConfirm(confirmation);
      if (result === false) setFailure("This couldn’t be deleted. Please try again.");
      else onOpenChange(false);
    } catch { setFailure("This couldn’t be deleted. Please try again."); }
    finally { submitting.current = false; setPending(false); }
  }
  return <Dialog.Portal><Dialog.Overlay className="fixed inset-0 z-[90] bg-[#10231a]/50 backdrop-blur-[2px]" /><Dialog.Content onCloseAutoFocus={(event) => { if (returnFocus.current?.isConnected) { event.preventDefault(); returnFocus.current.focus(); } }} onEscapeKeyDown={(event) => { if (working) event.preventDefault(); }} onPointerDownOutside={(event) => { if (working) event.preventDefault(); }} className="fixed left-1/2 top-1/2 z-[90] max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-border-subtle bg-white p-5 shadow-[var(--shadow-lg)] focus:outline-none sm:p-6">
    <div className="flex items-start justify-between gap-3"><span className="flex size-12 items-center justify-center rounded-xl bg-error-soft text-error"><Trash2 className="size-6" aria-hidden="true" /></span><button type="button" disabled={working} aria-label="Close delete confirmation" onClick={() => onOpenChange(false)} className="flex size-10 shrink-0 items-center justify-center rounded-lg text-text-tertiary hover:bg-background-subtle focus-visible:outline-2 focus-visible:outline-brand-primary disabled:opacity-40"><X className="size-5" aria-hidden="true" /></button></div>
    <Dialog.Title className="mt-4 break-words text-lg font-semibold text-text-primary">{title}</Dialog.Title><Dialog.Description className="mt-2 break-words text-sm leading-6 text-text-secondary">{description}</Dialog.Description>
    <form onSubmit={(event) => { event.preventDefault(); event.stopPropagation(); void submit(); }}>
      {confirmationName !== undefined && <label className="mt-5 block text-xs font-medium leading-5 text-text-secondary">Type <span className="break-words font-semibold text-text-primary">{confirmationName}</span> or <span className="font-semibold text-text-primary">DELETE</span> to confirm.<input aria-label="Confirm event deletion" autoComplete="off" spellCheck={false} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} disabled={working} className="mt-2 h-11 w-full rounded-lg border border-border-default bg-white px-3 text-sm text-text-primary outline-none focus:border-error focus:ring-2 focus:ring-error/15" /></label>}
      {(error || failure) && <p role="alert" className="mt-4 rounded-lg bg-error-soft px-3 py-2 text-xs leading-5 text-error">{error || failure}</p>}
      <div className="mt-6 flex flex-col-reverse gap-2 border-t border-border-subtle pt-5 sm:flex-row sm:justify-end"><Button type="button" variant="outline" disabled={working} onClick={() => onOpenChange(false)} className="min-h-11 sm:min-w-24">Cancel</Button><Button type="submit" variant="destructive" disabled={!allowed || working} aria-busy={working} className="min-h-11 sm:min-w-24">{working ? "Deleting…" : confirmLabel}</Button></div>
    </form>
  </Dialog.Content></Dialog.Portal>;
}

export function ConfirmDeleteButton({ confirmationTitle, description, onConfirm, confirmLabel, children, ...props }: Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onClick"> & { confirmationTitle: string; description: ReactNode; onConfirm: Props["onConfirm"]; confirmLabel?: string }) {
  const [open, setOpen] = useState(false);
  return <><button {...props} type="button" onClick={() => setOpen(true)}>{children}</button><DeleteConfirmation open={open} onOpenChange={setOpen} title={confirmationTitle} description={description} onConfirm={onConfirm} confirmLabel={confirmLabel} /></>;
}
