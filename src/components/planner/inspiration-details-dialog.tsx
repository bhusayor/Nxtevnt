"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Check, ImageIcon, Pencil, Trash2, X } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { MoodboardImage } from "./moodboard-image";
import { EventDecisionDetails } from "./event-decision-details";
import type { EventItem, PlannerEvent } from "@/lib/planner-events";
import { currentEventDecisions, decisionIsSuperseded } from "@/lib/event-decisions";
import type { MoodboardBoard } from "@/lib/planner-moodboards";

type Props = {
  event: PlannerEvent; photo: EventItem; board: MoodboardBoard; locked: boolean; currentCover: boolean; busy?: boolean;
  onClose: () => void; onApprove: () => void; onEdit: () => void; onCover: () => void; onDelete: () => void;
};

/** Viewing an inspiration is read-only. Only Approve starts a new decision. */
export function InspirationDetailsDialog({ event, photo, board, locked, currentCover, busy, onClose, onApprove, onEdit, onCover, onDelete }: Props) {
  const decision = currentEventDecisions(event).find((item) => item.id === photo.designApproval?.decisionId || item.sourceMoodboardImageId === photo.id);
  const actions = <section aria-label="Inspiration actions" className="space-y-3 border-t border-border-subtle pt-4"><div className="flex flex-wrap gap-2"><Button type="button" size="sm" variant="outline" disabled={locked} leadingIcon={<Pencil className="size-3.5" />} onClick={onEdit}>Edit caption & notes</Button><Button type="button" size="sm" variant="outline" disabled={locked || currentCover} leadingIcon={<ImageIcon className="size-3.5" />} onClick={onCover}>{currentCover ? "Current board cover" : "Use as board cover"}</Button></div><button type="button" disabled={Boolean(board.archivedAt || event.cancelledAt || busy)} onClick={onDelete} className="inline-flex min-h-10 items-center gap-2 rounded-lg px-2 text-xs font-medium text-error hover:bg-error-soft disabled:opacity-45"><Trash2 className="size-4" aria-hidden="true" />Delete inspiration</button></section>;
  if (decision && !decisionIsSuperseded(event, decision.id)) return <EventDecisionDetails event={event} decisionId={decision.id} onClose={onClose} inspirationActions={actions} />;
  return <Dialog.Root open onOpenChange={(open) => { if (!open) onClose(); }}><Dialog.Portal>
    <Dialog.Overlay className="fixed inset-0 z-[90] bg-[#10231a]/50 backdrop-blur-[2px]" />
    <Dialog.Content className="fixed left-1/2 top-1/2 z-[90] max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-border-subtle bg-white shadow-[var(--shadow-lg)] focus:outline-none">
      <header className="flex items-start justify-between gap-4 border-b border-border-subtle p-5 sm:px-6"><div className="min-w-0"><p className="mb-2 text-[0.625rem] font-semibold uppercase tracking-wider text-brand-primary">Inspiration details</p><Dialog.Title className="break-words text-lg font-semibold tracking-tight">{photo.title}</Dialog.Title><Dialog.Description className="mt-1 text-xs text-text-secondary">{board.title} · {event.name}</Dialog.Description></div><Dialog.Close asChild><button type="button" aria-label="Close inspiration details" className="flex size-8 shrink-0 items-center justify-center rounded-full text-text-tertiary hover:bg-background-subtle"><X className="size-4" /></button></Dialog.Close></header>
      <MoodboardImage source={photo.image} alt={photo.title} natural sizes="576px" />
      <div className="space-y-5 p-5 sm:p-6"><dl className="grid grid-cols-2 gap-4 text-xs"><div><dt className="text-[0.625rem] text-text-tertiary">Added by</dt><dd className="mt-1 font-medium">{photo.imageAddedBy || "Not recorded"}</dd></div><div><dt className="text-[0.625rem] text-text-tertiary">Added on</dt><dd className="mt-1 font-medium">{photo.imageAddedAt ? new Date(photo.imageAddedAt).toLocaleString("en-NG", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "Not recorded"}</dd></div><div><dt className="text-[0.625rem] text-text-tertiary">Category</dt><dd className="mt-1 font-medium">{photo.imageCategory || "Other"}</dd></div></dl>{photo.detail && <p className="whitespace-pre-wrap break-words text-xs leading-6 text-text-secondary">{photo.detail}</p>}<section className="rounded-xl border border-border-subtle p-4"><h3 className="text-xs font-semibold">No decision recorded yet</h3><p className="mt-1 text-xs leading-5 text-text-secondary">Approve this inspiration to record a decision or request client confirmation.</p><Button type="button" size="sm" className="mt-3" disabled={locked} leadingIcon={<Check className="size-3.5" />} onClick={onApprove}>Approve inspiration</Button></section>{actions}</div>
    </Dialog.Content>
  </Dialog.Portal></Dialog.Root>;
}
