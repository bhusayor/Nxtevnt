"use client";

import { ActionMenu } from "@/components/ui/action-menu";
import { DeleteConfirmation } from "@/components/ui/delete-confirmation";

import { useState, type FormEvent } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { ArrowDown, ArrowUp, ArrowUpDown, CalendarDays, Check, ChevronDown, Clock3, Copy, Eye, EyeOff, FolderPlus, Kanban, List, MessageSquareText, Pencil, Plus, Search, Trash2, X } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SearchInput } from "@/components/ui/search-input";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { TaskTemplateControls } from "@/components/planner/task-template-controls";
import { TaskKanbanBoard } from "@/components/planner/task-kanban-board";
import { TaskDetailDialog } from "./task-detail-dialog";
import { TaskDragHandle } from "./task-drag-handle";
import { useTaskPlanDrag, type PlanDrop, type TaskPlanDrag } from "./use-task-plan-drag";
import { appendTaskComment, moveTaskInPlan, reorderMilestone, type TaskDestination } from "@/lib/planner-task-moves";
import { TaskPriorityBadge, taskPriorityTones, type TaskPriority } from "@/components/planner/task-priority-badge";
import { OverviewMetricCard } from "@/components/planner/overview-metric-card";
import { usePlannerTeam } from "@/lib/planner-team";
import { formatEventDate, isTaskActive, isTaskComplete, taskStatus, updatePlannerEvent, type EventItem, type EventTaskGroup, type PlannerEvent, type TaskStatus } from "@/lib/planner-events";
import { cn } from "@/lib/utils/cn";

type Editor = { kind: "milestone" | "task"; id?: string } | null;
type DeleteTarget = { kind: "milestone" | "task"; id: string; title: string } | null;

const statuses: { value: TaskStatus; label: string; tone: string }[] = [
  { value: "todo", label: "To do", tone: "bg-[#f0f2f3] text-[#607078]" },
  { value: "in-progress", label: "In progress", tone: "bg-[#eaf1ff] text-[#426fb0]" },
  { value: "completed", label: "Completed", tone: "bg-[#e9f5ec] text-[#36734c]" },
  { value: "blocked", label: "Blocked", tone: "bg-[#fff2e5] text-[#a96629]" },
];

function TaskRow({ task, today, milestoneId, controller, onToggle, onOpen, onEdit, onDelete }: { task: EventItem; today: string; milestoneId: string | null; controller: TaskPlanDrag; onToggle: () => void; onOpen: () => void; onEdit: () => void; onDelete: () => void }) {
  const status = taskStatus(task);
  const statusInfo = statuses.find((entry) => entry.value === status)!;
  const overdue = Boolean(task.dueDate && task.dueDate < today && isTaskActive(task) && !isTaskComplete(task));
  const target: PlanDrop = { kind: "task", taskId: task.id, groupId: milestoneId };
  return <li data-plan-draggable {...controller.drop(target)} className={cn("flex items-start gap-2 border-t border-border-subtle px-3 py-4 first:border-t-0 sm:gap-3 sm:px-4", controller.highlight(target), controller.drag?.id === task.id && "opacity-45")}>
    <TaskDragHandle controller={controller} payload={{ kind: "task", id: task.id, label: task.title }} />
    <button type="button" onClick={onToggle} aria-label={`${isTaskComplete(task) ? "Mark incomplete" : "Mark complete"}: ${task.title}`} aria-pressed={isTaskComplete(task)} className={cn("mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary", isTaskComplete(task) ? "border-brand-primary bg-brand-primary text-white" : "border-[#c7d2cb] text-transparent hover:border-brand-primary")}><Check className="size-3" weight="bold" aria-hidden="true" /></button>
    <div className="min-w-0 flex-1"><button type="button" onClick={onOpen} className={cn("text-left text-sm font-medium leading-5 hover:text-brand-primary hover:underline focus-visible:outline-2 focus-visible:outline-brand-primary", isTaskComplete(task) ? "text-text-tertiary line-through" : "text-text-primary")}>{task.title}</button>{task.detail && <p className="mt-1 text-xs leading-5 text-text-secondary">{task.detail}</p>}<div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5"><span className={cn("rounded-full px-2 py-1 text-[0.625rem] font-semibold", statusInfo.tone)}>{statusInfo.label}</span><TaskPriorityBadge priority={task.priority} showSuffix />{task.assignee && <span className="text-[0.6875rem] text-text-secondary">{task.assignee}</span>}{task.dueDate && <span className={cn("inline-flex items-center gap-1 text-[0.6875rem]", overdue ? "font-semibold text-[#a96038]" : "text-text-tertiary")}><CalendarDays className="size-3.5" aria-hidden="true" />{overdue ? "Overdue" : "Due"} {formatEventDate(task.dueDate, { day: "numeric", month: "short" })}</span>}{task.clientVisible && <span className="inline-flex items-center gap-1 text-[0.6875rem] text-[#4a7693]"><Eye className="size-3.5" aria-hidden="true" />Client-visible</span>}{Boolean(task.comments?.length) && <span className="inline-flex items-center gap-1 text-[0.6875rem] text-text-tertiary"><MessageSquareText className="size-3.5" aria-hidden="true" />{task.comments?.length}</span>}</div></div>
    <ActionMenu label={`More actions for ${task.title}`} items={[{ label: "View details & comments", icon: <MessageSquareText />, onSelect: onOpen }, { label: "Edit task", icon: <Pencil />, onSelect: onEdit }, { label: "Move to milestone…", icon: <ArrowUpDown />, onSelect: onOpen }, { label: "Delete task", icon: <Trash2 />, destructive: true, onSelect: onDelete }]} />
  </li>;
}

export function TaskWorkspace({ event, initialTaskId }: { event: PlannerEvent; initialTaskId?: string }) {
  const groups = event.taskGroups ?? [];
  const tasks = event.sections.tasks ?? [];
  const initialTask = tasks.find((task) => task.id === initialTaskId);
  const teamMembers = usePlannerTeam();
  const groupIds = new Set(groups.map((group) => group.id));
  const today = new Date().toLocaleDateString("sv-SE");
  const activeTasks = tasks.filter(isTaskActive);
  const blocked = activeTasks.filter((task) => taskStatus(task) === "blocked").length;
  const visibleToClient = activeTasks.filter((task) => task.clientVisible).length;
  const pendingDue = activeTasks.filter((task) => !isTaskComplete(task) && task.dueDate).sort((first, second) => first.dueDate!.localeCompare(second.dueDate!));
  const overdue = pendingDue.filter((task) => task.dueDate! < today).length;
  const nextDue = pendingDue.find((task) => task.dueDate! >= today);

  const [collapsedIds, setCollapsedIds] = useState<string[]>([]);
  const [editor, setEditor] = useState<Editor>(initialTask ? { kind: "task", id: initialTask.id } : null);
  const [deleting, setDeleting] = useState<DeleteTarget>(null);
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "all">("all");
  const [view, setView] = useState<"milestones" | "kanban">("milestones");
  const [milestoneFilter, setMilestoneFilter] = useState("all");
  const [selectedTask, setSelectedTask] = useState<{ id: string; focusComments?: boolean } | null>(null);
  const [feedback, setFeedback] = useState("");
  const [search, setSearch] = useState("");
  const [title, setTitle] = useState(initialTask?.title ?? "");
  const [detail, setDetail] = useState(initialTask?.detail ?? "");
  const [dueDate, setDueDate] = useState(initialTask?.dueDate ?? "");
  const [groupId, setGroupId] = useState(initialTask?.groupId && groupIds.has(initialTask.groupId) ? initialTask.groupId : "other");
  const [draftStatus, setDraftStatus] = useState<TaskStatus>(initialTask ? taskStatus(initialTask) : "todo");
  const [priority, setPriority] = useState<TaskPriority>(initialTask?.priority ?? "medium");
  const [assignee, setAssignee] = useState(initialTask?.assignee ?? "unassigned");
  const [clientVisible, setClientVisible] = useState(initialTask?.clientVisible ?? false);
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const [pageError, setPageError] = useState("");



  const filtering = statusFilter !== "all" || Boolean(search.trim());
  const filteredTasks = tasks.filter((task) => (statusFilter === "all" || taskStatus(task) === statusFilter) && `${task.title} ${task.detail ?? ""} ${task.assignee ?? ""}`.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()));
  const selectedMilestone = milestoneFilter === "other" || groupIds.has(milestoneFilter) ? milestoneFilter : "all";
  const boardTasks = filteredTasks.filter((task) => selectedMilestone === "all" || (selectedMilestone === "other" ? !task.groupId || !groupIds.has(task.groupId) : task.groupId === selectedMilestone));
  const detailTask = tasks.find((task) => task.id === selectedTask?.id);
  const filteredGroups = filtering ? groups.filter((group) => filteredTasks.some((task) => task.groupId === group.id)) : groups;
  const otherTasks = filteredTasks.filter((task) => !task.groupId || !groupIds.has(task.groupId));
  const allCollapsed = groups.every((group) => collapsedIds.includes(group.id)) && (otherTasks.length === 0 || collapsedIds.includes("other"));
  const editingTask = editor?.kind === "task" ? tasks.find((task) => task.id === editor.id) : undefined;
  const assigneeOptions = [{ label: "Unassigned", value: "unassigned" }, ...teamMembers.map((member) => ({ label: member.isOwner ? `${member.name} · You` : member.name, value: member.name }))];
  if (assignee !== "unassigned" && !assigneeOptions.some((option) => option.value === assignee)) assigneeOptions.push({ label: `${assignee} · Not in team`, value: assignee });

  function updatePlan(change: (current: PlannerEvent) => PlannerEvent, message: string) {
    try {
      let found = false;
      updatePlannerEvent(event.id, (current) => { found = true; return change(current); });
      if (!found) throw new Error("This event no longer exists. Return to Events and open it again.");
      setPageError(""); setFeedback(message); return true;
    } catch (problem) { setPageError(problem instanceof Error ? problem.message : "We couldn’t save that change. Please try again."); return false; }
  }
  function relocateTask(taskId: string, destination: TaskDestination) {
    const saved = updatePlan((current) => moveTaskInPlan(current, taskId, destination), "Task moved. Your changes are saved.");
    if (saved && Object.prototype.hasOwnProperty.call(destination, "groupId")) setCollapsedIds((current) => current.filter((id) => id !== (destination.groupId || "other")));
    return saved;
  }
  const dragController = useTaskPlanDrag(event.id, (source, target, placement) => {
    if (source.kind === "milestone") {
      if (target.kind === "milestone" && target.groupId) updatePlan((current) => reorderMilestone(current, source.id, target.groupId!, placement), "Milestone order saved.");
    } else if (target.kind === "milestone") relocateTask(source.id, { groupId: target.groupId });
    else if (target.kind === "task") relocateTask(source.id, { groupId: target.groupId, relativeTaskId: target.taskId, placement });
    else relocateTask(source.id, { status: target.status, ...(target.kind === "kanban-task" ? { relativeTaskId: target.taskId, placement } : {}) });
  }, (source, direction) => {
    if (source.kind === "milestone") {
      const adjacent = groups[groups.findIndex((group) => group.id === source.id) + direction];
      if (adjacent) updatePlan((current) => reorderMilestone(current, source.id, adjacent.id, direction === -1 ? "before" : "after"), "Milestone order saved.");
    } else {
      const task = tasks.find((entry) => entry.id === source.id);
      if (!task) return;
      const siblings = view === "kanban" ? boardTasks.filter((entry) => taskStatus(entry) === taskStatus(task)) : tasks.filter((entry) => (groupIds.has(entry.groupId || "") ? entry.groupId : undefined) === (groupIds.has(task.groupId || "") ? task.groupId : undefined));
      const adjacent = siblings[siblings.findIndex((entry) => entry.id === source.id) + direction];
      if (adjacent) relocateTask(source.id, { relativeTaskId: adjacent.id, placement: direction === -1 ? "before" : "after" });
    }
  });
  function openDetails(task: EventItem, focusComments = false) { setSelectedTask({ id: task.id, focusComments }); }

  function openMilestone(group?: EventTaskGroup) {
    setTitle(group?.title ?? ""); setDetail(group?.description ?? ""); setDueDate(group?.dueDate ?? ""); setError(""); setEditor({ kind: "milestone", id: group?.id });
  }

  function openTask(task?: EventItem, defaultGroupId = "other", defaultStatus: TaskStatus = "todo") {
    setTitle(task?.title ?? ""); setDetail(task?.detail ?? "");
    setDueDate(task?.dueDate ?? (defaultGroupId === "other" ? "" : groups.find((group) => group.id === defaultGroupId)?.dueDate ?? ""));
    setGroupId(task?.groupId && groupIds.has(task.groupId) ? task.groupId : defaultGroupId);
    setDraftStatus(task ? taskStatus(task) : defaultStatus); setPriority(task?.priority ?? "medium"); setAssignee(task?.assignee || "unassigned");
    setClientVisible(task?.clientVisible ?? false); setComment(""); setError(""); setEditor({ kind: "task", id: task?.id });
  }

  function saveEditor(formEvent: FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    if (!editor) return;
    const cleanTitle = title.trim();
    if (!cleanTitle) { setError(editor.kind === "milestone" ? "Give this milestone a name." : "Give this task a title."); return; }
    if (cleanTitle.length > 120 || detail.trim().length > 500 || comment.trim().length > 1000) { setError("Please shorten the title, details or comment."); return; }
    try {
      if (editor.kind === "milestone") {
        const entry: EventTaskGroup = { id: editor.id ?? crypto.randomUUID(), title: cleanTitle, description: detail.trim() || undefined, dueDate: dueDate || undefined };
        updatePlannerEvent(event.id, (current) => ({ ...current, taskGroups: editor.id ? (current.taskGroups ?? []).map((group) => group.id === editor.id ? entry : group) : [...(current.taskGroups ?? []), entry] }));
        setCollapsedIds((current) => current.filter((id) => id !== entry.id));
      } else {
        const newComment = comment.trim() ? { id: crypto.randomUUID(), body: comment.trim(), author: teamMembers[0]?.name ?? "Planner", createdAt: new Date().toISOString() } : null;
        const entry: EventItem = { id: editor.id ?? crypto.randomUUID(), title: cleanTitle, detail: detail.trim() || undefined, dueDate: dueDate || undefined,
          groupId: groupId !== "other" && groupIds.has(groupId) ? groupId : undefined, status: draftStatus, done: draftStatus === "completed", priority,
          assignee: assignee === "unassigned" ? undefined : assignee, clientVisible,
          comments: newComment ? [newComment] : [],
        };
        updatePlannerEvent(event.id, (current) => ({ ...current, sections: { ...current.sections, tasks: editor.id ? current.sections.tasks.map((task) => task.id === editor.id ? { ...task, ...entry, comments: [...(task.comments ?? []), ...(newComment ? [newComment] : [])] } : task) : [...current.sections.tasks, entry] } }));
        if (entry.groupId) setCollapsedIds((current) => current.filter((id) => id !== entry.groupId));
      }
      setEditor(null); setPageError("");
    } catch { setError("We couldn’t save this in your browser. Please try again."); }
  }

  function moveTask(taskId: string, nextStatus: TaskStatus) {
    return relocateTask(taskId, { status: nextStatus });
  }

  function toggleTask(task: EventItem) { moveTask(task.id, isTaskComplete(task) ? "todo" : "completed"); }

  function duplicateMilestone(group: EventTaskGroup) {
    try {
      const newId = crypto.randomUUID();
      updatePlannerEvent(event.id, (current) => ({
        ...current,
        taskGroups: [...(current.taskGroups ?? []), { ...group, id: newId, title: `${group.title} copy` }],
        sections: { ...current.sections, tasks: [...current.sections.tasks, ...current.sections.tasks.filter((task) => task.groupId === group.id).map((task) => ({ ...task, id: crypto.randomUUID(), groupId: newId, status: "todo" as const, done: false, comments: [] }))] },
      }));
      setPageError("");
    } catch { setPageError("We couldn’t duplicate that milestone. Please try again."); }
  }

  function deleteSelected() {
    if (!deleting) return;
    try {
      if (deleting.kind === "task") updatePlannerEvent(event.id, (current) => ({ ...current, sections: { ...current.sections, tasks: current.sections.tasks.filter((task) => task.id !== deleting.id) } }));
      else updatePlannerEvent(event.id, (current) => ({ ...current, taskGroups: (current.taskGroups ?? []).filter((group) => group.id !== deleting.id), sections: { ...current.sections, tasks: current.sections.tasks.map((task) => task.groupId === deleting.id ? { ...task, groupId: undefined } : task) } }));
      setDeleting(null); setPageError(""); return true;
    } catch { setPageError("We couldn’t remove this item. Please try again."); return false; }
  }

  return <div className="space-y-5">
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      <OverviewMetricCard label="Blocked tasks" value={blocked} detail={blocked ? "Waiting on a decision or dependency" : "Nothing holding up the plan"} icon={Clock3} tone="amber" />
      <OverviewMetricCard label="Client visibility" value={`${visibleToClient}/${activeTasks.length}`} detail="Marked for the future client task view" icon={visibleToClient ? Eye : EyeOff} tone="blue" />
      <OverviewMetricCard label="Due dates" value={overdue ? `${overdue} overdue` : nextDue ? formatEventDate(nextDue.dueDate!, { day: "numeric", month: "short" }) : "—"} detail={overdue ? nextDue ? `Next: ${formatEventDate(nextDue.dueDate!, { day: "numeric", month: "short" })}` : "Review overdue tasks" : nextDue ? "Next unfinished task due" : "No upcoming due dates"} icon={CalendarDays} tone="lilac" compact />
    </div>

    <div className="flex flex-wrap items-end justify-between gap-3"><div><h3 className="text-base font-semibold text-text-primary">{view === "milestones" ? "Milestones" : "Kanban board"}</h3><p className="mt-1 text-xs text-text-secondary">{view === "milestones" ? "Drag tasks between milestones, or use the handles to reorder your plan." : "Filter by milestone, then drag tasks between stages. Open a card for details."}</p></div><div className="flex flex-wrap items-center gap-2">{view === "kanban" && <div className="w-48 sm:w-52"><Select ariaLabel="Filter Kanban by milestone" value={selectedMilestone} onValueChange={setMilestoneFilter} options={[{ label: "All milestones", value: "all" }, ...groups.map((group) => ({ label: group.title, value: group.id })), { label: "Other tasks", value: "other" }]} className="h-11 text-xs" /></div>}<div role="group" aria-label="Task view" className="flex rounded-lg border border-border-subtle bg-white p-1"><button type="button" aria-label="Milestones view" title="Milestones view" aria-pressed={view === "milestones"} onClick={() => setView("milestones")} className={cn("flex size-9 items-center justify-center rounded-md transition-colors", view === "milestones" ? "bg-brand-primary text-white" : "text-text-secondary hover:bg-background-subtle")}><List className="size-[18px]" aria-hidden="true" /></button><button type="button" aria-label="Kanban board view" title="Kanban board view" aria-pressed={view === "kanban"} onClick={() => setView("kanban")} className={cn("flex size-9 items-center justify-center rounded-md transition-colors", view === "kanban" ? "bg-brand-primary text-white" : "text-text-secondary hover:bg-background-subtle")}><Kanban className="size-5" weight="duotone" aria-hidden="true" /></button></div><TaskTemplateControls event={event} onError={setPageError} /><Button type="button" size="sm" leadingIcon={<Plus className="size-4" aria-hidden="true" />} onClick={() => openMilestone()}>Add milestone</Button></div></div>

    <div className="flex flex-col gap-2 sm:flex-row sm:items-center"><div className="min-w-0 flex-1"><SearchInput aria-label="Search tasks" placeholder="Search tasks or assignees" value={search} onChange={(input) => setSearch(input.target.value)} onClear={() => setSearch("")} /></div><div className="w-full shrink-0 sm:w-48"><Select ariaLabel="Filter tasks by status" value={statusFilter} onValueChange={(value) => setStatusFilter(value as TaskStatus | "all")} options={[{ label: "All statuses", value: "all" }, ...statuses.map((status) => ({ label: status.label, value: status.value }))]} /></div>{view === "milestones" && (groups.length > 0 || tasks.length > 0) && <button type="button" onClick={() => setCollapsedIds(allCollapsed ? [] : [...groups.map((group) => group.id), "other"])} className="min-h-10 shrink-0 rounded-lg px-3 text-xs font-semibold text-text-secondary hover:bg-white hover:text-brand-primary">{allCollapsed ? "Expand all" : "Collapse all"}</button>}</div>
    <p role="status" className="sr-only">{feedback}</p>
    {dragController.drag && <p className="pointer-events-none fixed bottom-5 left-1/2 z-40 w-max max-w-[calc(100vw-2rem)] -translate-x-1/2 rounded-xl border border-border-subtle bg-white px-4 py-3 text-xs text-text-secondary shadow-lg">Moving <span className="font-semibold">{dragController.drag.label}</span> · Drop into a highlighted position. Press Escape to cancel.</p>}
    {pageError && <p role="alert" className="rounded-lg bg-error-soft px-4 py-3 text-xs text-error">{pageError}</p>}

    {groups.length === 0 && tasks.length === 0 ? <div className="rounded-2xl border border-dashed border-[#dce7df] bg-white px-6 py-12 text-center sm:py-16"><span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-[#edf5ef] text-brand-primary"><FolderPlus className="size-7" aria-hidden="true" /></span><h4 className="mt-5 text-lg font-semibold tracking-tight">Give your plan some structure</h4><p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-text-secondary">Create a milestone for each stage or workstream, then add the tasks that bring it to life.</p><Button type="button" className="mt-6" leadingIcon={<Plus className="size-4" aria-hidden="true" />} onClick={() => openMilestone()}>Create milestone</Button></div>
    : filtering && filteredTasks.length === 0 ? <div className="rounded-2xl border border-border-subtle bg-white px-6 py-12 text-center"><Search className="mx-auto size-7 text-text-tertiary" aria-hidden="true" /><h4 className="mt-4 text-base font-semibold">No matching tasks</h4><p className="mt-2 text-xs text-text-secondary">Try another status or search term.</p><button type="button" onClick={() => { setSearch(""); setStatusFilter("all"); }} className="mt-4 text-xs font-semibold text-brand-primary hover:underline">Clear filters</button></div>
    : view === "kanban" ? <TaskKanbanBoard tasks={boardTasks} groups={groups} today={today} controller={dragController} onMove={moveTask} onEdit={(task) => openTask(task)} onOpen={openDetails} onCreate={(status) => openTask(undefined, selectedMilestone === "all" ? "other" : selectedMilestone, status)} />
    : <div className="space-y-3">
      {filteredGroups.map((group) => {
        const allGroupTasks = tasks.filter((task) => task.groupId === group.id);
        const visibleTasks = filteredTasks.filter((task) => task.groupId === group.id);
        const collapsed = collapsedIds.includes(group.id);
        const milestoneDrop: PlanDrop = { kind: "milestone", groupId: group.id };
        const groupIndex = groups.findIndex((entry) => entry.id === group.id);
        return <section key={group.id} data-plan-draggable aria-label={group.title} {...dragController.drop(milestoneDrop)} className={cn("overflow-visible rounded-2xl border border-border-subtle bg-white shadow-[0_8px_24px_-22px_rgba(20,45,30,.35)]", dragController.highlight(milestoneDrop), dragController.drag?.id === group.id && "opacity-45")}>
          <div data-plan-drag-preview className="flex items-start gap-2 px-4 py-4 sm:items-center sm:gap-3 sm:px-5">
            <TaskDragHandle controller={dragController} payload={{ kind: "milestone", id: group.id, label: group.title }} />
            <button type="button" aria-label={`${collapsed ? "Expand" : "Collapse"} ${group.title}`} aria-expanded={!collapsed} aria-controls={`milestone-${group.id}`} onClick={() => setCollapsedIds((current) => collapsed ? current.filter((id) => id !== group.id) : [...current, group.id])} className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg text-text-secondary hover:bg-[#eef5f0] focus-visible:outline-2 focus-visible:outline-brand-primary sm:mt-0"><ChevronDown className={cn("size-4 transition-transform", collapsed && "-rotate-90")} aria-hidden="true" /></button>
            <div className="min-w-0 flex-1"><button type="button" onClick={() => openMilestone(group)} aria-label={`Edit ${group.title} milestone`} className="group/title inline-flex max-w-full items-center gap-1.5 text-left text-sm font-semibold text-text-primary hover:text-brand-primary"><span className="truncate">{group.title}</span><Pencil className="size-3.5 shrink-0 text-text-tertiary group-hover/title:text-brand-primary" aria-hidden="true" /></button><p className="mt-1 text-[0.6875rem] text-text-tertiary">{allGroupTasks.length} {allGroupTasks.length === 1 ? "task" : "tasks"}{group.dueDate ? ` · Target ${formatEventDate(group.dueDate, { day: "numeric", month: "short", year: "numeric" })}` : ""}</p></div>
            <ActionMenu label={`More actions for ${group.title}`} items={[
              { label: "Add task", icon: <Plus />, onSelect: () => openTask(undefined, group.id, statusFilter === "all" ? "todo" : statusFilter) },
              { label: "Edit", icon: <Pencil />, onSelect: () => openMilestone(group) },
              { label: "Duplicate", icon: <Copy />, onSelect: () => duplicateMilestone(group) },
              { label: "Move up", icon: <ArrowUp />, disabled: groupIndex === 0, onSelect: () => updatePlan((current) => reorderMilestone(current, group.id, groups[groupIndex - 1].id, "before"), "Milestone order saved.") },
              { label: "Move down", icon: <ArrowDown />, disabled: groupIndex === groups.length - 1, onSelect: () => updatePlan((current) => reorderMilestone(current, group.id, groups[groupIndex + 1].id, "after"), "Milestone order saved.") },
              { label: "Delete milestone", icon: <Trash2 />, destructive: true, onSelect: () => setDeleting({ kind: "milestone", id: group.id, title: group.title }) },
            ]} />
          </div>
          <div id={`milestone-${group.id}`} hidden={collapsed} className="overflow-hidden rounded-b-2xl">{group.description && <p className="px-5 py-3 text-xs leading-5 text-text-secondary">{group.description}</p>}{visibleTasks.length ? <ul className="border-t border-border-subtle">{visibleTasks.map((task) => <TaskRow key={task.id} task={task} today={today} milestoneId={group.id} controller={dragController} onOpen={() => openDetails(task)} onToggle={() => toggleTask(task)} onEdit={() => openTask(task)} onDelete={() => setDeleting({ kind: "task", id: task.id, title: task.title })} />)}</ul> : <p className="border-t border-border-subtle px-5 pt-5 text-xs text-text-tertiary">No tasks in this milestone yet.</p>}<div className="border-t border-border-subtle px-4 sm:px-5"><button type="button" onClick={() => openTask(undefined, group.id, statusFilter === "all" ? "todo" : statusFilter)} className="inline-flex min-h-11 items-center gap-1 px-0 text-sm font-semibold text-text-tertiary transition-colors hover:text-brand-primary focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-brand-primary sm:min-h-8"><Plus className="size-4" aria-hidden="true" />Add task</button></div></div>
        </section>;
      })}
      {(otherTasks.length > 0 || dragController.drag?.kind === "task") && <section aria-label="Other tasks" {...dragController.drop({ kind: "milestone", groupId: null })} className={cn("overflow-hidden rounded-2xl border border-border-subtle bg-white", dragController.highlight({ kind: "milestone", groupId: null }))}><button type="button" aria-expanded={!collapsedIds.includes("other")} aria-controls="other-event-tasks" onClick={() => setCollapsedIds((current) => current.includes("other") ? current.filter((id) => id !== "other") : [...current, "other"])} className="flex min-h-16 w-full items-center gap-3 px-4 text-left sm:px-5"><ChevronDown className={cn("size-4 text-text-tertiary transition-transform", collapsedIds.includes("other") && "-rotate-90")} aria-hidden="true" /><span className="min-w-0 flex-1"><span className="block text-sm font-semibold">Other tasks</span><span className="mt-0.5 block text-[0.6875rem] text-text-tertiary">{otherTasks.length} without a milestone · Drop tasks here to remove their milestone</span></span></button><div id="other-event-tasks" hidden={collapsedIds.includes("other")}><ul className="border-t border-border-subtle">{otherTasks.map((task) => <TaskRow key={task.id} task={task} today={today} milestoneId={null} controller={dragController} onOpen={() => openDetails(task)} onToggle={() => toggleTask(task)} onEdit={() => openTask(task)} onDelete={() => setDeleting({ kind: "task", id: task.id, title: task.title })} />)}</ul></div></section>}
    </div>}

    <Dialog.Root open={editor !== null} onOpenChange={(open) => { if (!open) setEditor(null); }}><Dialog.Portal><Dialog.Overlay className="fixed inset-0 z-50 bg-[#10231a]/50 backdrop-blur-[2px]" /><Dialog.Content className="fixed inset-x-0 bottom-0 z-50 flex max-h-[90dvh] flex-col overflow-hidden rounded-t-2xl bg-white shadow-[var(--shadow-lg)] focus:outline-none sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:w-[min(36rem,calc(100vw-2rem))] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl"><div className="flex items-start justify-between gap-3 border-b border-border-subtle px-5 py-5 sm:px-6"><div><Dialog.Title className="text-lg font-semibold">{editor?.id ? "Edit" : "Add"} {editor?.kind === "milestone" ? "milestone" : "task"}</Dialog.Title><Dialog.Description className="mt-1 text-xs leading-5 text-text-secondary">{editor?.kind === "milestone" ? "Give this stage a clear purpose and target date." : "Make the next step clear for everyone working on this event."}</Dialog.Description></div><Dialog.Close asChild><button type="button" aria-label="Close" className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border-subtle"><X className="size-4" aria-hidden="true" /></button></Dialog.Close></div><form onSubmit={saveEditor} className="min-h-0 space-y-5 overflow-y-auto px-5 py-5 sm:px-6">
      <Input label={editor?.kind === "milestone" ? "Milestone name" : "Task title"} placeholder={editor?.kind === "milestone" ? "e.g. Design & decor" : "e.g. Gather styling inspiration"} value={title} onChange={(input) => setTitle(input.target.value)} maxLength={120} required />
      <Textarea label={editor?.kind === "milestone" ? "Milestone description" : "Task details"} placeholder={editor?.kind === "milestone" ? "What should this stage achieve?" : "What needs to happen?"} value={detail} onChange={(input) => setDetail(input.target.value)} maxLength={500} rows={2} optional />
      {editor?.kind === "milestone" ? <Input label="Target date" type="date" value={dueDate} onChange={(input) => setDueDate(input.target.value)} optional /> : <>
        <div className="grid gap-4 sm:grid-cols-2"><Select label="Status" value={draftStatus} onValueChange={(value) => setDraftStatus(value as TaskStatus)} options={statuses.map((status) => ({ label: status.label, value: status.value }))} /><Select label="Priority" value={priority} onValueChange={(value) => setPriority(value as TaskPriority)} options={[{ label: "High", value: "high" }, { label: "Medium", value: "medium" }, { label: "Low", value: "low" }]} className={taskPriorityTones[priority]} /></div>
        <div className="grid gap-4 sm:grid-cols-2"><Select label="Assignee" value={assignee} onValueChange={setAssignee} options={assigneeOptions} /><Input label="Due date" type="date" value={dueDate} onChange={(input) => setDueDate(input.target.value)} optional /></div>
        <Select label="Milestone" value={groupId} onValueChange={setGroupId} options={[{ label: "Other tasks · no milestone", value: "other" }, ...groups.map((group) => ({ label: group.title, value: group.id }))]} />
        <div className="rounded-xl border border-border-subtle bg-[#f8faf8] p-4"><Switch label="Client-visible" description="Marks this task for the future client task view. No notification is sent now." checked={clientVisible} onCheckedChange={setClientVisible} /></div>
        {editingTask?.comments?.length ? <div><p className="text-xs font-semibold text-text-primary">Comments</p><div className="mt-2 max-h-36 space-y-2 overflow-y-auto">{editingTask.comments.map((entry) => <div key={entry.id} className="rounded-lg bg-[#f7f8f7] px-3 py-2"><p className="text-[0.6875rem] font-semibold text-text-primary">{entry.author} <span className="font-normal text-text-tertiary">· {new Date(entry.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}</span></p><p className="mt-1 whitespace-pre-wrap text-xs leading-5 text-text-secondary">{entry.body}</p></div>)}</div></div> : null}
        <Textarea label={editingTask ? "Add a comment" : "Comment"} placeholder="Add an update or helpful context for the team…" value={comment} onChange={(input) => setComment(input.target.value)} maxLength={1000} rows={2} optional />
      </>}
      {error && <p role="alert" className="rounded-lg bg-error-soft px-3 py-2 text-xs text-error">{error}</p>}
      <div className="flex justify-end gap-2 border-t border-border-subtle pt-5"><Button type="button" variant="outline" onClick={() => setEditor(null)}>Cancel</Button><Button type="submit">{editor?.id ? "Save changes" : editor?.kind === "milestone" ? "Create milestone" : "Add task"}</Button></div>
    </form></Dialog.Content></Dialog.Portal></Dialog.Root>

    {detailTask && <TaskDetailDialog key={detailTask.id} task={detailTask} groups={groups} eventName={event.name} focusComments={selectedTask?.focusComments} onClose={() => setSelectedTask(null)} onEdit={() => { setSelectedTask(null); openTask(detailTask); }} onMove={(groupId) => relocateTask(detailTask.id, { groupId })} onStatus={(status) => moveTask(detailTask.id, status)} onComment={(body) => updatePlan((current) => appendTaskComment(current, detailTask.id, { id: crypto.randomUUID(), body, author: teamMembers[0]?.name ?? "Planner", createdAt: new Date().toISOString() }), "Comment posted.")} />}

    <DeleteConfirmation open={deleting !== null} onOpenChange={(open) => { if (!open) setDeleting(null); }} title={deleting?.kind === "milestone" ? "Delete milestone?" : "Delete task?"} description={deleting?.kind === "milestone" ? `“${deleting.title}” will be removed. Its tasks will move to Other tasks, so no work is lost.` : `“${deleting?.title}” will be permanently removed from this event. This can’t be undone.`} error={pageError} onConfirm={deleteSelected} />
  </div>;
}
