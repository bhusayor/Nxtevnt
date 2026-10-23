"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Camera, X } from "@/components/ui/icons";
import { CoverPicker } from "@/components/planner/cover-picker";
import { Button } from "@/components/ui/button";
import { updatePlannerEvent, type PlannerEvent } from "@/lib/planner-events";

export function EventCoverEditor({ event }: { event: PlannerEvent }) {
  const [open, setOpen] = useState(false);
  const [image, setImage] = useState(event.image);
  const [error, setError] = useState("");
  return <Dialog.Root open={open} onOpenChange={(next) => { if (next) { setImage(event.image); setError(""); } setOpen(next); }}>
    <Dialog.Trigger asChild><button type="button" aria-label="Change event cover photo" title="Change cover photo" className="absolute bottom-5 right-5 flex size-11 items-center justify-center rounded-xl border border-white/50 bg-black/40 text-white shadow-sm backdrop-blur-md transition-colors hover:bg-black/65 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"><Camera className="size-5" aria-hidden="true" /></button></Dialog.Trigger>
    <Dialog.Portal><Dialog.Overlay className="fixed inset-0 z-50 bg-[#10231a]/55 backdrop-blur-[2px]" /><Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90dvh] w-[calc(100vw-2rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-border-subtle bg-white p-5 shadow-[var(--shadow-lg)] focus:outline-none sm:p-7">
      <div className="mb-6 flex items-start justify-between gap-3"><div><Dialog.Title className="text-lg font-semibold">Change cover photo</Dialog.Title><Dialog.Description className="mt-2 text-sm text-text-secondary">Choose a cover or upload a photo for {event.name}.</Dialog.Description></div><Dialog.Close asChild><button type="button" aria-label="Close cover editor" className="flex size-9 shrink-0 items-center justify-center rounded-lg hover:bg-background-subtle"><X className="size-4" aria-hidden="true" /></button></Dialog.Close></div>
      <CoverPicker key={open ? "open" : "closed"} value={image} onChange={setImage} />
      {error && <p role="alert" className="mt-4 text-sm text-error">{error}</p>}
      <div className="mt-6 flex justify-end gap-2 border-t border-border-subtle pt-4"><Dialog.Close asChild><Button type="button" variant="ghost">Cancel</Button></Dialog.Close><Button type="button" onClick={() => { try { updatePlannerEvent(event.id, (current) => ({ ...current, image })); setOpen(false); } catch { setError("This cover couldn’t be saved. Please try again."); } }}>Save cover</Button></div>
    </Dialog.Content></Dialog.Portal>
  </Dialog.Root>;
}
