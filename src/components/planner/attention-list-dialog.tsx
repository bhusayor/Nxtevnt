"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "@/components/ui/icons";
import { AttentionActionRow } from "./attention-action-row";
import { InquiryList } from "./inquiry-list";
import type { AttentionItem, AttentionTab } from "./attention-queue-items";
import { cn } from "@/lib/utils/cn";

export { VendorReplyDialog } from "./vendor-reply-dialog";

export function AttentionListDialog({ open, title, description, items, tab, onClose, onOpen }: { open: boolean; title: string; description: string; items: AttentionItem[]; tab: AttentionTab; onClose: () => void; onOpen: (item: AttentionItem) => void }) {
  return <Dialog.Root open={open} onOpenChange={(value) => { if (!value) onClose(); }}><Dialog.Portal><Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" /><Dialog.Content className={cn("fixed left-1/2 top-1/2 z-50 flex max-h-[85dvh] w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl bg-white", tab === "inquiries" ? "max-w-6xl" : "max-w-2xl")}><header className="flex items-start justify-between gap-3 border-b border-border-subtle p-5"><div><Dialog.Title className="text-lg font-semibold">{title}</Dialog.Title><Dialog.Description className="mt-2 text-sm leading-6 text-text-secondary">{description}</Dialog.Description></div><Dialog.Close aria-label="Close all attention items" className="flex size-9 shrink-0 items-center justify-center rounded-full hover:bg-background-subtle"><X className="size-5" /></Dialog.Close></header><div className="min-h-0 overflow-y-auto px-5">{tab !== "inquiries" && <p className="pt-4 text-sm text-text-secondary">{items.length} {items.length === 1 ? "action" : "actions"}</p>}{items.length ? tab === "inquiries" ? <InquiryList items={items} onOpen={onOpen} /> : <div className="divide-y divide-border-subtle">{items.map((item) => <AttentionActionRow key={item.id} item={item} tab={tab} onOpen={onOpen} />)}</div> : <p className="py-10 text-sm leading-6 text-text-secondary">Nothing waiting in this view.</p>}</div></Dialog.Content></Dialog.Portal></Dialog.Root>;
}
