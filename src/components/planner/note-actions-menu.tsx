"use client";

import { ClipboardCheck, Pencil, Pin, Trash2 } from "@/components/ui/icons";
import { ActionMenu } from "@/components/ui/action-menu";

export function NoteActionsMenu({ title, pinned, taskHref, onEdit, onPin, onTask, onDelete }: { title: string; pinned: boolean; taskHref?: string; onEdit: () => void; onPin: () => void; onTask: () => void; onDelete: () => void }) {
  return <ActionMenu label={`More actions for ${title}`} items={[
    { label: "Edit note", icon: <Pencil />, onSelect: onEdit },
    { label: pinned ? "Unpin note" : "Pin note", icon: <Pin />, onSelect: onPin },
    { label: taskHref ? "View task" : "Mark as task", icon: <ClipboardCheck />, href: taskHref, onSelect: taskHref ? undefined : onTask },
    { label: "Delete note", icon: <Trash2 />, onSelect: onDelete, destructive: true },
  ]} />;
}
