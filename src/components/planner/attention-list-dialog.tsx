"use client";

import * as Dialog from "@radix-ui/react-dialog";
import Link from "next/link";
import { X } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { AttentionActionRow } from "./attention-action-row";
import type { AttentionItem, AttentionTab } from "./attention-queue-items";
import type { PlannerVendorReply } from "@/lib/planner-vendor-replies";

export function AttentionListDialog({ open, title, description, items, tab, onClose, onOpen }: { open: boolean; title: string; description: string; items: AttentionItem[]; tab: AttentionTab; onClose: () => void; onOpen: (item: AttentionItem) => void }) {
  return <Dialog.Root open={open} onOpenChange={(value) => { if (!value) onClose(); }}><Dialog.Portal><Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" /><Dialog.Content className="fixed left-1/2 top-1/2 z-50 flex max-h-[85dvh] w-[calc(100vw-2rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl bg-white"><header className="flex items-start justify-between gap-3 border-b border-border-subtle p-5"><div><Dialog.Title className="text-lg font-semibold">{title}</Dialog.Title><Dialog.Description className="mt-2 text-sm leading-6 text-text-secondary">{description}</Dialog.Description></div><Dialog.Close aria-label="Close all attention items" className="flex size-9 shrink-0 items-center justify-center rounded-full hover:bg-background-subtle"><X className="size-5" /></Dialog.Close></header><div className="min-h-0 overflow-y-auto px-5"><p className="pt-4 text-sm text-text-secondary">{items.length} {items.length === 1 ? "action" : "actions"}</p>{items.length ? <div className="divide-y divide-border-subtle">{items.map((item) => <AttentionActionRow key={item.id} item={item} tab={tab} onOpen={onOpen} />)}</div> : <p className="py-10 text-sm leading-6 text-text-secondary">Nothing waiting in this view.</p>}</div></Dialog.Content></Dialog.Portal></Dialog.Root>;
}

export function VendorReplyDialog({ reply, error, onClose, onRead }: { reply: PlannerVendorReply | null; error: string; onClose: () => void; onRead: () => void }) {
  return <Dialog.Root open={Boolean(reply)} onOpenChange={(value) => { if (!value) onClose(); }}><Dialog.Portal><Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" /><Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[85dvh] w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl bg-white p-6"><div className="flex items-start justify-between gap-3"><div><Dialog.Title className="text-lg font-semibold">{reply?.subject}</Dialog.Title><Dialog.Description className="mt-2 text-sm text-text-secondary">From {reply?.vendor}</Dialog.Description></div><Dialog.Close aria-label="Close vendor reply"><X className="size-5" /></Dialog.Close></div><p className="mt-5 whitespace-pre-wrap break-words text-sm leading-7">{reply?.message}</p>{error && <p role="alert" className="mt-3 text-sm text-error">{error}</p>}<div className="mt-6 flex flex-wrap items-center justify-between gap-3">{reply && <Link href={`/planner/events/${encodeURIComponent(reply.eventId)}`} className="text-sm font-semibold text-brand-primary hover:underline">Open event</Link>}<Button type="button" size="sm" onClick={onRead}>Mark as read</Button></div></Dialog.Content></Dialog.Portal></Dialog.Root>;
}
