"use client";

import { Archive, ClipboardCheck, Pencil, Pin, Trash2 } from "@/components/ui/icons";
import { ActionMenu } from "@/components/ui/action-menu";

export function NoteActionsMenu({ title, pinned, taskHref, onEdit, onPin, onTask, onArchive, onDelete }: { title: string; pinned: boolean; taskHref?: string; onEdit: () => void; onPin: () => void; onTask: () => void; onArchive: () => void; onDelete: () => void }) {
  return <ActionMenu label={`More actions for ${title}`} items={[
    { label: "Edit note", icon: <Pencil />, onSelect: onEdit },
    { label: pinned ? "Unpin note" : "Pin note", icon: <Pin />, onSelect: onPin },
    { label: taskHref ? "View task" : "Mark as task", icon: <ClipboardCheck />, href: taskHref, onSelect: taskHref ? undefined : onTask },
    { label: "Archive note", icon: <Archive />, onSelect: onArchive },
    { label: "Delete note", icon: <Trash2 />, onSelect: onDelete, destructive: true },
  ]} />;
}
