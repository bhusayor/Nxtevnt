"use client";

import { useId, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { ArrowUpDown, X } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import type { EventItem, EventTaskGroup } from "@/lib/planner-events";
import { cn } from "@/lib/utils/cn";

export function TaskMoveDialog({ task, groups, onClose, onMove }: {
  task: EventItem; groups: EventTaskGroup[]; onClose: () => void;
  onMove: (groupId: string | null) => boolean;
}) {
  const current = groups.some((group) => group.id === task.groupId) ? task.groupId! : "other";
  const [destination, setDestination] = useState(current);
  const [error, setError] = useState("");
  const name = useId();
  const options = [...groups.map((group) => ({ id: group.id, title: group.title, description: group.description })), { id: "other", title: "Other tasks", description: "No milestone" }];
  const valid = destination !== current && options.some((option) => option.id === destination);

  return <Dialog.Root open onOpenChange={(open) => { if (!open) onClose(); }}><Dialog.Portal>
    <Dialog.Overlay className="fixed inset-0 z-[60] bg-[#10231a]/50 backdrop-blur-[2px]" />
    <Dialog.Content className="fixed left-1/2 top-1/2 z-[60] flex max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl bg-white shadow-[var(--shadow-lg)] focus:outline-none">
      <header className="flex items-start justify-between gap-3 border-b border-border-subtle p-5 sm:px-6">
        <div><Dialog.Title className="text-lg font-semibold">Move task to a milestone</Dialog.Title><Dialog.Description className="mt-1 break-words text-sm leading-6 text-text-secondary">Choose where “{task.title}” belongs. Its status, dates and comments stay the same.</Dialog.Description></div>
        <Dialog.Close asChild><button type="button" aria-label="Close move task" className="flex size-10 shrink-0 items-center justify-center rounded-lg text-text-secondary hover:bg-background-subtle"><X className="size-5" aria-hidden="true" /></button></Dialog.Close>
      </header>
      <form className="flex min-h-0 flex-col" onSubmit={(event) => {
        event.preventDefault();
        if (!valid) return;
        try {
          if (onMove(destination === "other" ? null : destination)) onClose();
          else setError("This task couldn’t be moved. Check the milestone is still available and try again.");
        } catch { setError("This task couldn’t be moved. Please try again."); }
      }}>
        <fieldset className="min-h-0 space-y-2 overflow-y-auto p-5 sm:px-6"><legend className="sr-only">Destination milestone</legend>
          {options.map((option) => <label key={option.id} className={cn("flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors focus-within:ring-2 focus-within:ring-brand-primary/25", destination === option.id ? "border-brand-primary bg-[#f0f6f2]" : "border-border-subtle hover:bg-background-subtle", option.id === current && "cursor-default")}>
            <input type="radio" name={name} value={option.id} checked={destination === option.id} disabled={option.id === current} onChange={() => { setDestination(option.id); setError(""); }} className="mt-0.5 size-4 shrink-0 accent-brand-primary" />
            <span className="min-w-0 flex-1"><span className="block break-words text-sm font-semibold">{option.title}</span>{option.description && <span className="mt-1 block break-words text-sm leading-5 text-text-secondary">{option.description}</span>}</span>
            {option.id === current && <span className="shrink-0 text-sm text-text-secondary">Current</span>}
          </label>)}
        </fieldset>
        {error && <p role="alert" className="px-5 pb-4 text-sm text-error sm:px-6">{error}</p>}
        <footer className="flex shrink-0 justify-end gap-2 border-t border-border-subtle p-5 sm:px-6"><Button type="button" variant="outline" onClick={onClose}>Cancel</Button><Button type="submit" disabled={!valid} leadingIcon={<ArrowUpDown className="size-4" aria-hidden="true" />}>Move task</Button></footer>
      </form>
    </Dialog.Content>
  </Dialog.Portal></Dialog.Root>;
}
