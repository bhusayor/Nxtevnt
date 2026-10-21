"use client";

import { useState, type FormEvent } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { ClipboardCheck, X } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { taskPriorityTones, type TaskPriority } from "./task-priority-badge";
import { notePlainText } from "@/lib/event-notes";
import { usePlannerTeam } from "@/lib/planner-team";
import type { EventItem, EventNote, PlannerEvent } from "@/lib/planner-events";

export function NoteTaskDialog({ note, event, onClose, onCreate }: { note: EventNote; event: PlannerEvent; onClose: () => void; onCreate: (task: EventItem) => boolean }) {
  const team = usePlannerTeam();
  const [title, setTitle] = useState((note.title || notePlainText(note.body).split("\n").find((line) => line.trim()) || "Follow up on note").slice(0, 120));
  const [detail, setDetail] = useState(notePlainText(note.body).slice(0, 500));
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [assignee, setAssignee] = useState("unassigned");
  const [dueDate, setDueDate] = useState("");
  const [groupId, setGroupId] = useState("other");
  const [error, setError] = useState("");
  function submit(form: FormEvent<HTMLFormElement>) {
    form.preventDefault();
    if (!title.trim() || title.trim().length > 120 || detail.length > 500) { setError("Add a task title within 120 characters and details within 500 characters."); return; }
    if (onCreate({ id: crypto.randomUUID(), title: title.trim(), detail: detail.trim() || undefined, priority: priority as EventItem["priority"], assignee: assignee === "unassigned" ? undefined : assignee, dueDate: dueDate || undefined, groupId: groupId === "other" ? undefined : groupId, status: "todo", done: false })) onClose();
    else setError("This task couldn’t be saved. Please try again.");
  }
  return <Dialog.Root open onOpenChange={(open) => { if (!open) onClose(); }}><Dialog.Portal><Dialog.Overlay className="fixed inset-0 z-50 bg-[#10231a]/50 backdrop-blur-[2px]" /><Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90dvh] w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl bg-white p-5 shadow-[var(--shadow-lg)] sm:p-6">
    <div className="flex items-start justify-between gap-3"><div><Dialog.Title className="text-lg font-semibold">Create task from note</Dialog.Title><Dialog.Description className="mt-2 text-xs leading-6 text-text-secondary">Your note stays here. A linked, team-only task will appear in this event’s Tasks.</Dialog.Description></div><Dialog.Close aria-label="Close task dialog" className="flex size-9 shrink-0 items-center justify-center rounded-lg hover:bg-background-subtle"><X className="size-4" aria-hidden="true" /></Dialog.Close></div>
    <form onSubmit={submit} className="mt-5 space-y-4"><Input label="Task title" required maxLength={120} value={title} onChange={(change) => setTitle(change.target.value)} /><Textarea label="Task details" rows={3} maxLength={500} value={detail} onChange={(change) => setDetail(change.target.value)} /><p className="text-[0.6875rem] leading-5 text-text-tertiary">The full original note and its formatting are kept in Notes.</p>
      <div className="grid gap-4 sm:grid-cols-2"><Select label="Priority" value={priority} onValueChange={(value) => setPriority(value as TaskPriority)} className={taskPriorityTones[priority]} options={[{ label: "High", value: "high" }, { label: "Medium", value: "medium" }, { label: "Low", value: "low" }]} /><Input label="Due date" type="date" optional value={dueDate} onChange={(change) => setDueDate(change.target.value)} /></div>
      <Select label="Assignee" value={assignee} onValueChange={setAssignee} options={[{ label: "Unassigned", value: "unassigned" }, ...team.map((member) => ({ label: member.isOwner ? `${member.name} · You` : member.name, value: member.name }))]} />
      <Select label="Milestone" value={groupId} onValueChange={setGroupId} options={[{ label: "Other tasks · No milestone", value: "other" }, ...(event.taskGroups || []).map((group) => ({ label: group.title, value: group.id }))]} />
      {error && <p role="alert" className="text-xs text-error">{error}</p>}<div className="flex justify-end gap-2 border-t border-border-subtle pt-4"><Button type="button" variant="outline" size="sm" onClick={onClose}>Cancel</Button><Button type="submit" size="sm" disabled={!title.trim()} leadingIcon={<ClipboardCheck className="size-4" aria-hidden="true" />}>Create task</Button></div>
    </form>
  </Dialog.Content></Dialog.Portal></Dialog.Root>;
}
