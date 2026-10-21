"use client";

import { MoodboardImage } from "./moodboard-image";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "@/components/ui/icons";

export function EventPhotoViewer({ photo, onClose }: { photo: { src: string; title: string; detail?: string } | null; onClose: () => void }) {
  return <Dialog.Root open={Boolean(photo)} onOpenChange={(open) => { if (!open) onClose(); }}><Dialog.Portal>
    <Dialog.Overlay className="fixed inset-0 z-50 bg-[#102019]/85 backdrop-blur-sm" />
    <Dialog.Content className="fixed left-1/2 top-1/2 z-50 flex max-h-[92dvh] w-[calc(100vw-2rem)] max-w-5xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl bg-white shadow-xl focus:outline-none">
      <div className="flex items-start justify-between gap-4 p-4 sm:px-6"><div><Dialog.Title className="text-base font-semibold">{photo?.title || "Event photo"}</Dialog.Title><Dialog.Description className="mt-1 text-xs text-text-secondary">{photo?.detail || "Full image preview"}</Dialog.Description></div><Dialog.Close asChild><button type="button" aria-label="Close photo preview" className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border-subtle hover:bg-background-subtle"><X className="size-4" aria-hidden="true" /></button></Dialog.Close></div>
      {photo && <div className="relative h-[65dvh] min-h-40 bg-[#eef0eb]"><MoodboardImage source={photo.src} alt={photo.title} contain sizes="90vw" /></div>}
    </Dialog.Content>
  </Dialog.Portal></Dialog.Root>;
}
