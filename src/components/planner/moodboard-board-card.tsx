"use client";

import { ArrowRight, Folder, ImageIcon, MessageSquareText } from "@/components/ui/icons";
import { MoodboardImage } from "./moodboard-image";
import { ActionMenu } from "@/components/ui/action-menu";
import type { EventItem } from "@/lib/planner-events";
import type { MoodboardBoard } from "@/lib/planner-moodboards";

export function moodboardDate(date: string) {
  return new Date(date).toLocaleDateString("en-NG", { day: "numeric", month: "short" });
}

export function MoodboardBoardCard({ board, items, onOpen, actions }: { board: MoodboardBoard; items: EventItem[]; onOpen: () => void; actions: React.ComponentProps<typeof ActionMenu>["items"] }) {
  const photos = items.filter((item) => item.image && !item.imageArchivedAt);
  const imageCount = items.filter((item) => item.image).length;
  const cover = photos.find((photo) => photo.id === board.coverId) ?? photos[0];
  const thumbnails = photos.filter((photo) => photo.id !== cover?.id).slice(0, 2);
  const commentCount = board.activity.filter((entry) => entry.kind === "comment").length + items.reduce((count, item) => count + (item.comments?.length ?? 0), 0);
  return <article className="group relative flex h-72 min-w-0 flex-col overflow-hidden rounded-2xl border border-border-subtle bg-white transition-shadow hover:shadow-[0_8px_28px_-16px_rgba(25,43,31,.22)]">
    <button type="button" onClick={onOpen} aria-label={`Open moodboard: ${board.title}`} className="absolute inset-0 z-0 rounded-2xl text-left focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-brand-primary" />
    <div className="pointer-events-none relative h-36 shrink-0 overflow-hidden bg-[#f1f0eb]">
      {cover ? <div className={`absolute inset-0 grid gap-1 ${thumbnails.length === 2 ? "grid-cols-[1fr_.32fr]" : "grid-cols-1"}`}><div className="relative min-w-0"><MoodboardImage source={cover.image} alt={cover.title} /></div>{thumbnails.length === 2 && <div className="grid grid-rows-2 gap-1">{thumbnails.map((photo) => <div key={photo.id} className="relative min-h-0"><MoodboardImage source={photo.image} alt={photo.title} /></div>)}</div>}</div> : <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[radial-gradient(ellipse_at_top,#faf8f3,#efeee9)]"><span className="flex size-14 items-center justify-center rounded-2xl border border-white bg-white/80 text-[#8c8679]"><Folder className="size-7" weight="duotone" aria-hidden="true" /></span><span className="text-xs text-text-tertiary">A little room for inspiration</span></div>}
      <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1.5 text-[0.625rem] font-medium text-text-primary shadow-sm"><Folder className="size-3" aria-hidden="true" />{board.archivedAt ? "Archived" : board.source === "client" ? "Client’s" : "Planner"}</span>
      <span className="absolute bottom-3 right-3 inline-flex items-center gap-1 rounded-lg bg-[#14251d]/75 px-2 py-1 text-[0.625rem] text-white backdrop-blur-sm"><ImageIcon className="size-3" aria-hidden="true" />{imageCount}/50</span>
    </div>
    <div className="pointer-events-none relative z-10 flex flex-1 flex-col p-3"><div className="flex items-start justify-between gap-3"><h3 className="min-w-0 flex-1 truncate text-sm font-semibold text-text-primary">{board.title}</h3><span className="pointer-events-auto -mr-2 -mt-2"><ActionMenu label={`More actions for ${board.title}`} items={actions} /></span></div><p className="mt-1 line-clamp-1 text-xs leading-5 text-text-secondary">{board.description || "Collect the spaces, colours and thoughtful details that bring this idea to life."}</p><div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-border-subtle pt-2.5 text-[0.625rem] text-text-tertiary"><span>Updated {moodboardDate(board.updatedAt)}</span><span className="inline-flex items-center gap-1.5"><MessageSquareText className="size-3.5" aria-hidden="true" />{commentCount} {commentCount === 1 ? "comment" : "comments"}</span></div><p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-brand-primary">Open board<ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" aria-hidden="true" /></p></div>
  </article>;
}
