"use client";

import Link from "next/link";
import { ClipboardCheck, MessageCircleReply, MessageSquareText, Wallet } from "@/components/ui/icons";
import { cn } from "@/lib/utils/cn";
import type { AttentionItem, AttentionTab } from "./attention-queue-items";
import { AttentionQuickAction } from "./attention-quick-action";

export function AttentionActionRow({ item, tab, onOpen }: { item: AttentionItem; tab: AttentionTab; onOpen: (item: AttentionItem) => void }) {
  const Icon = tab === "tasks" ? ClipboardCheck : tab === "payments" ? Wallet : tab === "vendors" ? MessageCircleReply : MessageSquareText;
  const tone = tab === "tasks" ? "bg-[#f2eef8] text-[#80669a]" : tab === "payments" ? "bg-[#fcf2e3] text-[#976e38]" : "bg-[#edf4fa] text-[#4c7696]";
  const action = tab === "tasks" ? "View task" : tab === "payments" ? "View payment" : tab === "vendors" ? "Read reply" : "Read inquiry";
  const actionClass = "inline-flex min-h-11 shrink-0 items-center whitespace-nowrap rounded-sm text-sm font-semibold text-brand-primary underline decoration-brand-primary/30 underline-offset-4 transition-colors hover:decoration-brand-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-primary";
  return <div className="flex min-h-28 flex-wrap items-center gap-3 py-4 sm:flex-nowrap">
    <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl", tone)}><Icon weight="duotone" className="size-5" aria-hidden="true" /></span>
    <div className="min-w-0 flex-1"><p className="line-clamp-2 text-sm font-semibold leading-5">{item.title}</p><p className="mt-1 break-words text-sm leading-5 text-text-secondary">{item.context}</p><p className={cn("mt-1 text-sm leading-5", item.overdue ? "font-medium text-error" : "text-text-secondary")}>{item.detail}</p></div>
    <div className="flex shrink-0 flex-wrap items-center gap-3"><AttentionQuickAction item={item} />{item.href ? <Link href={item.href} aria-label={`${action}: ${item.title}`} className={actionClass}>{action}</Link> : <button type="button" aria-label={`${action}: ${item.title}`} onClick={() => onOpen(item)} className={actionClass}>{action}</button>}</div>
  </div>;
}
