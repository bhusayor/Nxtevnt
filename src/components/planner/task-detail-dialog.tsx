"use client";

import { useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { CalendarDays, Eye, MessageSquareText, Pencil, Send, X } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { TaskPriorityBadge } from "./task-priority-badge";
import { TaskMoveDialog } from "./task-move-dialog";
import { taskColumns } from "./task-kanban-board";
import { formatEventDate, taskStatus, type EventItem, type EventTaskGroup, type TaskStatus } from "@/lib/planner-events";

export function TaskDetailDialog({ task, groups, eventName, focusComments, onClose, onEdit, onMove, onStatus, onComment }: {
  task: EventItem; groups: EventTaskGroup[]; eventName: string; focusComments?: boolean;
  onClose: () => void; onEdit: () => void; onMove: (groupId: string | null) => boolean;
  onStatus: (status: TaskStatus) => boolean; onComment: (body: string) => boolean;
}) {
  const [body, setBody] = useState("");
  const [moving, setMoving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const input = useRef<HTMLTextAreaElement>(null);
  const comments = task.comments ?? [];
  const groupId = groups.some((group) => group.id === task.groupId) ? task.groupId! : "other";
  return <><Dialog.Root open onOpenChange={(open) => { if (!open) onClose(); }}><Dialog.Portal>
    <Dialog.Overlay className="fixed inset-0 z-50 bg-[#10231a]/50 backdrop-blur-[2px]" />
    <Dialog.Content onOpenAutoFocus={(event) => { if (focusComments) { event.preventDefault(); input.current?.focus(); } }} className="fixed inset-x-0 bottom-0 z-50 flex max-h-[92dvh] flex-col overflow-hidden rounded-t-2xl bg-white shadow-[var(--shadow-lg)] focus:outline-none sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:w-[min(40rem,calc(100vw-2rem))] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl">
      <header className="flex items-start justify-between gap-4 border-b border-border-subtle px-5 py-5 sm:px-6"><div className="min-w-0"><p className="mb-2 truncate text-[0.6875rem] text-text-tertiary">{eventName}</p><Dialog.Title className="break-words text-lg font-semibold leading-7">{task.title}</Dialog.Title><Dialog.Description className="mt-1 text-xs text-text-secondary">Task details and team conversation</Dialog.Description></div><Dialog.Close asChild><button type="button" aria-label="Close task details" className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border-subtle"><X className="size-4" aria-hidden="true" /></button></Dialog.Close></header>
      <div className="min-h-0 space-y-6 overflow-y-auto px-5 py-5 sm:px-6">
        <div className="grid gap-4 sm:grid-cols-2"><Select label="Status" value={taskStatus(task)} options={taskColumns.map((entry) => ({ label: entry.label, value: entry.value }))} onValueChange={(value) => { if (!onStatus(value as TaskStatus)) setError("Couldn’t update the status. Please try again."); else { setError(""); setNotice("Status updated."); } }} /><div><p className="text-sm font-medium text-text-primary">Milestone</p><button type="button" aria-label={`Move ${task.title} to another milestone`} onClick={() => setMoving(true)} className="mt-1.5 flex min-h-11 w-full items-center justify-between gap-3 rounded-lg border border-border-default bg-white px-3 text-left text-sm hover:border-brand-primary"><span className="truncate">{groups.find((group) => group.id === groupId)?.title || "Other tasks"}</span><span className="shrink-0 font-semibold text-brand-primary">Move</span></button></div></div>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-4 rounded-xl border border-border-subtle p-4 text-xs"><div><dt className="text-text-tertiary">Assignee</dt><dd className="mt-1.5 font-medium">{task.assignee || "Unassigned"}</dd></div><div><dt className="text-text-tertiary">Priority</dt><dd className="mt-1.5"><TaskPriorityBadge priority={task.priority} showSuffix /></dd></div><div><dt className="text-text-tertiary">Due date</dt><dd className="mt-1.5 flex items-center gap-1.5"><CalendarDays className="size-3.5 shrink-0" aria-hidden="true" />{task.dueDate ? formatEventDate(task.dueDate, { day: "numeric", month: "short", year: "numeric" }) : "No due date"}</dd></div><div><dt className="text-text-tertiary">Visibility</dt><dd className="mt-1.5 flex items-center gap-1.5"><Eye className="size-3.5 shrink-0" aria-hidden="true" />{task.clientVisible ? "Client-visible" : "Team only"}</dd></div></dl>
        <section><div className="flex items-center justify-between"><h3 className="text-sm font-semibold">Details</h3><button type="button" onClick={onEdit} className="inline-flex min-h-8 items-center gap-1.5 text-xs font-semibold text-brand-primary hover:underline"><Pencil className="size-3.5" aria-hidden="true" />Edit task</button></div><p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-text-secondary">{task.detail || "No extra details added yet."}</p></section>
        <section className="border-t border-border-subtle pt-5"><h3 className="flex items-center gap-2 text-sm font-semibold"><MessageSquareText className="size-4" aria-hidden="true" />Comments <span className="text-xs font-normal text-text-tertiary">{comments.length}</span></h3><div className="mt-4 space-y-4">{comments.length ? comments.map((entry) => <article key={entry.id} className="flex gap-3"><span aria-hidden="true" className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#edf1ef] text-[0.625rem] font-semibold text-brand-primary">{entry.author.split(" ").map((part) => part[0]).slice(0, 2).join("")}</span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-baseline gap-x-2 gap-y-1"><p className="text-xs font-semibold">{entry.author}</p><time dateTime={entry.createdAt} className="text-[0.625rem] text-text-tertiary">{new Date(entry.createdAt).toLocaleString("en-NG", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</time></div><p className="mt-1.5 whitespace-pre-wrap break-words text-xs leading-5 text-text-secondary">{entry.body}</p></div></article>) : <p className="rounded-xl border border-dashed border-border-subtle p-4 text-xs leading-5 text-text-tertiary">No comments yet. Share an update or ask the team a question.</p>}</div>
          <form className="mt-5" onSubmit={(event) => { event.preventDefault(); if (!body.trim()) return; if (onComment(body)) { setBody(""); setError(""); setNotice("Comment posted."); input.current?.focus(); } else setError("Couldn’t post your comment. Please try again."); }}><label htmlFor={`comment-${task.id}`} className="text-xs font-medium">Add a comment</label><textarea ref={input} id={`comment-${task.id}`} value={body} onChange={(event) => setBody(event.target.value)} maxLength={1000} rows={3} placeholder="Share a helpful update…" className="mt-2 w-full resize-y rounded-xl border border-border-subtle p-3 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10" /><div className="mt-2 flex items-center justify-between gap-3"><span className="text-[0.625rem] text-text-tertiary">{body.length}/1,000</span><Button type="submit" size="sm" disabled={!body.trim()} leadingIcon={<Send className="size-3.5" aria-hidden="true" />}>Post comment</Button></div></form>
        </section>
        {error && <p role="alert" className="text-xs text-error">{error}</p>}<p role="status" className="sr-only">{notice}</p>
      </div>
    </Dialog.Content>
  </Dialog.Portal></Dialog.Root>{moving && <TaskMoveDialog key={`${task.id}:${task.groupId ?? "other"}`} task={task} groups={groups} onClose={() => setMoving(false)} onMove={(destination) => { const saved = onMove(destination); if (saved) { setError(""); setNotice("Milestone updated."); } return saved; }} />}</>;
}
