"use client";

import { useState } from "react";
import { CalendarDays, Eye, MessageSquareText, Pencil, Plus } from "@/components/ui/icons";
import { TaskPriorityBadge } from "@/components/planner/task-priority-badge";
import { Select } from "@/components/ui/select";
import { formatEventDate, taskStatus, type EventItem, type EventTaskGroup, type TaskStatus } from "@/lib/planner-events";
import { cn } from "@/lib/utils/cn";

export const taskColumns: { value: TaskStatus; label: string; tone: string; dot: string; surface: string }[] = [
  { value: "todo", label: "To do", tone: "text-[#607078]", dot: "bg-[#95a5ab]", surface: "bg-[#f5f7f7]" },
  { value: "in-progress", label: "In progress", tone: "text-[#426fb0]", dot: "bg-[#6d9bd8]", surface: "bg-[#f1f5fc]" },
  { value: "completed", label: "Completed", tone: "text-[#36734c]", dot: "bg-[#6ab181]", surface: "bg-[#eff7f1]" },
  { value: "blocked", label: "Blocked", tone: "text-[#a96629]", dot: "bg-[#dfa460]", surface: "bg-[#fff7ec]" },
];

export function TaskKanbanBoard({ tasks, groups, today, onMove, onEdit, onCreate }: {
  tasks: EventItem[];
  groups: EventTaskGroup[];
  today: string;
  onMove: (taskId: string, status: TaskStatus) => void;
  onEdit: (task: EventItem) => void;
  onCreate: (status: TaskStatus) => void;
}) {
  const [dropTarget, setDropTarget] = useState<TaskStatus | null>(null);
  const groupNames = new Map(groups.map((group) => [group.id, group.title]));

  return <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-4" aria-label="Task Kanban board">
    {taskColumns.map((column) => {
      const columnTasks = tasks.filter((task) => taskStatus(task) === column.value);
      return <section key={column.value} aria-label={`${column.label} tasks`} onDragOver={(event) => { event.preventDefault(); event.dataTransfer.dropEffect = "move"; setDropTarget(column.value); }} onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setDropTarget(null); }} onDrop={(event) => { event.preventDefault(); const taskId = event.dataTransfer.getData("text/task-id"); if (taskId) onMove(taskId, column.value); setDropTarget(null); }} className={cn("flex min-h-64 min-w-0 flex-col rounded-2xl border border-border-subtle p-3 transition-colors", column.surface, dropTarget === column.value && "border-brand-primary ring-2 ring-brand-primary/20")}>
        <div className="flex items-center justify-between gap-2 px-1 py-1"><div className="flex items-center gap-2"><span className={cn("size-2 rounded-full", column.dot)} /><h3 className={cn("text-sm font-semibold", column.tone)}>{column.label}</h3><span className="flex min-w-5 items-center justify-center rounded-full bg-white px-1.5 py-0.5 text-[0.625rem] font-semibold text-text-secondary">{columnTasks.length}</span></div><button type="button" onClick={() => onCreate(column.value)} aria-label={`Add task to ${column.label}`} title={`Add task to ${column.label}`} className="flex size-9 items-center justify-center text-text-secondary transition-colors hover:text-brand-primary focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-brand-primary sm:size-8"><Plus className="size-3.5" aria-hidden="true" /></button></div>
        <div className="mt-2 flex-1 space-y-2.5">{columnTasks.map((task) => {
          const overdue = Boolean(task.dueDate && task.dueDate < today && column.value !== "completed");
          return <article key={task.id} draggable onDragStart={(event) => { event.dataTransfer.setData("text/task-id", task.id); event.dataTransfer.effectAllowed = "move"; }} onDragEnd={() => setDropTarget(null)} className="rounded-xl border border-[#e4eae6] bg-white p-3.5 shadow-[0_4px_12px_-10px_rgba(25,43,31,.3)] focus-within:border-brand-primary/35">
            <div className="flex items-start justify-between gap-2"><p className="min-w-0 truncate text-[0.625rem] font-semibold uppercase tracking-wide text-text-tertiary">{task.groupId ? groupNames.get(task.groupId) ?? "Other tasks" : "Other tasks"}</p><button type="button" onClick={() => onEdit(task)} aria-label={`Edit ${task.title}`} className="-mr-1 -mt-1 flex size-7 shrink-0 items-center justify-center rounded-lg text-text-tertiary hover:bg-[#eef5f0] hover:text-brand-primary"><Pencil className="size-3.5" aria-hidden="true" /></button></div>
            <h4 className="mt-1 text-sm font-semibold leading-5 text-text-primary">{task.title}</h4>{task.detail && <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-text-secondary">{task.detail}</p>}
            <div className="mt-3 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[0.6875rem] text-text-tertiary"><TaskPriorityBadge priority={task.priority} />{task.assignee && <span className="truncate">{task.assignee}</span>}{task.dueDate && <span className={cn("inline-flex items-center gap-1", overdue && "font-semibold text-[#a96038]")}><CalendarDays className="size-3.5" aria-hidden="true" />{formatEventDate(task.dueDate, { day: "numeric", month: "short" })}</span>}{task.clientVisible && <Eye className="size-3.5 text-[#4a7693]" aria-label="Client-visible" />}{Boolean(task.comments?.length) && <span className="inline-flex items-center gap-1"><MessageSquareText className="size-3.5" aria-hidden="true" />{task.comments?.length}</span>}</div>
            <div className="mt-3 border-t border-border-subtle pt-3"><Select ariaLabel={`Move ${task.title} to status`} value={column.value} onValueChange={(status) => onMove(task.id, status as TaskStatus)} options={taskColumns.map((entry) => ({ label: entry.label, value: entry.value }))} className="h-9 text-xs" /></div>
          </article>;
        })}{columnTasks.length === 0 && <p className="rounded-xl border border-dashed border-[#dce5df] bg-white/60 px-3 py-7 text-center text-xs leading-5 text-text-tertiary">No tasks here yet.<br />Drop a card or add one above.</p>}</div>
      </section>;
    })}
  </div>;
}
