"use client";

import type { ReactNode } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { AlertTriangle, X } from "@/components/ui/icons";

import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";

type ConfirmationDialogProps = {
  trigger: ReactNode;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
};

export function ConfirmationDialog({ trigger, title, description, confirmLabel = "Confirm", cancelLabel = "Cancel", destructive }: ConfirmationDialogProps) {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-text-primary/35 backdrop-blur-[2px]" />
        <Dialog.Content className="fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-[var(--radius-xl)] border border-border-subtle bg-surface p-6 shadow-[var(--shadow-lg)]">
          <div className="mb-5 flex items-start gap-4 pr-8">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-warning-soft text-warning"><AlertTriangle aria-hidden="true" className="size-5" /></span>
            <div className="grid gap-1.5"><Dialog.Title className="type-heading-4 text-text-primary">{title}</Dialog.Title><Dialog.Description className="type-body text-text-secondary">{description}</Dialog.Description></div>
          </div>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Dialog.Close asChild><Button variant="ghost">{cancelLabel}</Button></Dialog.Close>
            <Dialog.Close asChild><Button variant={destructive ? "destructive" : "primary"}>{confirmLabel}</Button></Dialog.Close>
          </div>
          <Dialog.Close asChild><IconButton aria-label="Close dialog" variant="ghost" size="sm" className="absolute top-4 right-4" icon={<X className="size-4" />} /></Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function UnsavedChangesPrompt({ trigger }: { trigger: ReactNode }) {
  return <ConfirmationDialog trigger={trigger} title="Leave with unsaved changes?" description="The latest changes to this event have not been saved. If you leave now, they may be lost." confirmLabel="Leave page" cancelLabel="Keep editing" destructive />;
}
