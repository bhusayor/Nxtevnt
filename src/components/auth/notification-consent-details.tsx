"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";

export const notificationConsentText = "I agree to receive notifications from NXTEVNT via email and text message, including account alerts, event updates, and verification codes. Message and data rates may apply. Message frequency varies. Reply STOP to opt out of texts at any time.";

export function NotificationConsentDetails() {
  return <Dialog.Root>
    <Dialog.Trigger asChild><button type="button" className="inline-flex min-h-7 items-center rounded text-left text-xs font-semibold text-brand-primary underline decoration-brand-primary/35 underline-offset-2 hover:decoration-brand-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary">See more details<span className="sr-only"> about email and text notifications</span></button></Dialog.Trigger>
    <Dialog.Portal><Dialog.Overlay className="fixed inset-0 z-50 bg-[#10231a]/50 backdrop-blur-[2px]" /><Dialog.Content className="fixed left-1/2 top-1/2 z-50 flex max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-border-subtle bg-white shadow-[var(--shadow-lg)] focus:outline-none">
      <header className="flex items-center justify-between gap-4 border-b border-border-subtle px-5 py-4"><Dialog.Title className="text-base font-semibold">Email &amp; text notifications</Dialog.Title><Dialog.Close asChild><button type="button" aria-label="Close notification details" className="flex size-8 items-center justify-center rounded-full text-text-tertiary hover:bg-background-subtle"><X className="size-4" /></button></Dialog.Close></header>
      <div className="overflow-y-auto p-5"><Dialog.Description className="text-sm leading-7 text-text-secondary">{notificationConsentText}</Dialog.Description><p className="mt-4 text-xs leading-5 text-text-tertiary">Reading these details does not select the consent checkbox.</p></div>
      <footer className="flex justify-end border-t border-border-subtle px-5 py-4"><Dialog.Close asChild><Button type="button" size="sm">Done</Button></Dialog.Close></footer>
    </Dialog.Content></Dialog.Portal>
  </Dialog.Root>;
}
