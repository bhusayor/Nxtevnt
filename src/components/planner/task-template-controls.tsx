"use client";

import { ActionMenu } from "@/components/ui/action-menu";

import { useState, type FormEvent } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Check, ChevronDown, ClipboardCheck, Plus, Save, X } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { milestoneDueDate, milestoneTemplates } from "@/lib/event-setup-templates";
import { savePlannerTaskTemplate, useMilestoneTemplates } from "@/lib/planner-task-templates";
import { updatePlannerEvent, type EventItem, type EventTaskGroup, type PlannerEvent } from "@/lib/planner-events";
import { cn } from "@/lib/utils/cn";

export function TaskTemplateControls({ event, onError }: { event: PlannerEvent; onError: (message: string) => void }) {
  const templates = useMilestoneTemplates();
  const [dialog, setDialog] = useState<"load" | "save" | null>(null);
  const [selectedId, setSelectedId] = useState(templates[0]?.id ?? "");
  const [templateName, setTemplateName] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const selected = templates.find((template) => template.id === selectedId) ?? templates[0];



  function openDialog(kind: "load" | "save") {
    setError(""); setSuccess(""); setDialog(kind);
    if (kind === "save") setTemplateName("");
  }

  function loadTemplate() {
    if (!selected) return;
    try {
      const groups: EventTaskGroup[] = selected.milestones.map((milestone) => ({
        id: crypto.randomUUID(), title: milestone.title, description: milestone.description,
        dueDate: milestone.daysBefore === undefined ? undefined : milestoneDueDate(event.date, milestone.daysBefore),
      }));
      const tasks: EventItem[] = selected.milestones.flatMap((milestone, index) => milestone.tasks.map((task) => ({
        id: crypto.randomUUID(), groupId: groups[index].id, title: task.title, detail: task.detail,
        dueDate: task.daysBefore === undefined ? undefined : milestoneDueDate(event.date, task.daysBefore),
        status: "todo" as const, done: false, priority: task.priority ?? "medium", clientVisible: task.clientVisible ?? false,
      })));
      updatePlannerEvent(event.id, (current) => ({
        ...current,
        taskGroups: [...(current.taskGroups ?? []), ...groups],
        sections: { ...current.sections, tasks: [...current.sections.tasks, ...tasks] },
      }));
      setDialog(null); onError(""); setSuccess(`${selected.name} added: ${groups.length} milestones and ${tasks.length} tasks.`);
    } catch { setError("We couldn’t load this template in your browser. Please try again."); }
  }

  function saveTemplate(formEvent: FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    try {
      const saved = savePlannerTaskTemplate(event, templateName);
      setSelectedId(saved.id); setDialog(null); onError(""); setSuccess(`“${saved.name}” is ready to use on future events.`);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "We couldn’t save this template."); }
  }

  return <>
    <ActionMenu label="Task templates" triggerClassName="w-auto gap-2 border border-border-default bg-white px-3 text-xs font-semibold" triggerContent={<><ClipboardCheck className="size-4 text-brand-primary" aria-hidden="true" />Templates<ChevronDown className="size-3.5 text-text-tertiary" aria-hidden="true" /></>} items={[
      { label: "Load a template", description: "Add milestones to this event", icon: <Plus />, onSelect: () => openDialog("load") },
      { label: "Save current plan", description: "Reuse it for future events", icon: <Save />, onSelect: () => openDialog("save") },
    ]} />
    {success && <p role="status" className="w-full text-xs font-medium text-brand-primary">{success}</p>}

    <Dialog.Root open={dialog === "load"} onOpenChange={(open) => { if (!open) setDialog(null); }}><Dialog.Portal><Dialog.Overlay className="fixed inset-0 z-50 bg-[#10231a]/50 backdrop-blur-[2px]" /><Dialog.Content className="fixed inset-x-0 bottom-0 z-50 flex max-h-[90dvh] flex-col overflow-hidden rounded-t-2xl bg-white shadow-[var(--shadow-lg)] focus:outline-none sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:w-[min(38rem,calc(100vw-2rem))] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl"><div className="flex items-start justify-between gap-3 border-b border-border-subtle px-5 py-5 sm:px-6"><div><Dialog.Title className="text-lg font-semibold">Load a task template</Dialog.Title><Dialog.Description className="mt-1 text-xs leading-5 text-text-secondary">Choose a ready-made plan or one you saved. It adds new milestones without replacing your current tasks.</Dialog.Description></div><Dialog.Close asChild><button type="button" aria-label="Close" className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border-subtle"><X className="size-4" aria-hidden="true" /></button></Dialog.Close></div><div className="min-h-0 space-y-2 overflow-y-auto p-5 sm:p-6">{templates.map((template) => {
      const count = template.milestones.reduce((sum, milestone) => sum + milestone.tasks.length, 0);
      const isBuiltIn = milestoneTemplates.some((item) => item.id === template.id);
      return <div key={template.id} className={cn("rounded-xl border p-3 transition-colors", selected?.id === template.id ? "border-brand-primary bg-[#f2f7f3]" : "border-border-subtle bg-white")}><button type="button" onClick={() => setSelectedId(template.id)} aria-pressed={selected?.id === template.id} className="w-full text-left"><span className="flex items-center gap-2 text-sm font-semibold text-text-primary">{template.name}{selected?.id === template.id && <Check className="size-4 text-brand-primary" aria-hidden="true" />}</span><span className="mt-1 block text-xs leading-5 text-text-secondary">{template.description}</span><span className="mt-1.5 block text-[0.6875rem] font-medium text-text-tertiary">{template.milestones.length} milestones · {count} tasks · {isBuiltIn ? "Nxtevnt template" : "Saved by you"}</span></button></div>;
    })}{selected && <div className="rounded-xl bg-[#fafbfa] p-4"><p className="text-[0.6875rem] font-semibold uppercase tracking-wide text-text-tertiary">Inside this template</p><ul className="mt-3 space-y-2">{selected.milestones.map((milestone) => <li key={milestone.title} className="flex justify-between gap-4 text-xs"><span className="font-medium text-text-primary">{milestone.title}</span><span className="shrink-0 text-text-tertiary">{milestone.tasks.length} tasks</span></li>)}</ul></div>}{error && <p role="alert" className="rounded-lg bg-error-soft px-3 py-2 text-xs text-error">{error}</p>}</div><div className="flex justify-end gap-2 border-t border-border-subtle px-5 py-4 sm:px-6"><Button type="button" variant="outline" onClick={() => setDialog(null)}>Cancel</Button><Button type="button" onClick={loadTemplate} disabled={!selected}>Add to event</Button></div></Dialog.Content></Dialog.Portal></Dialog.Root>

    <Dialog.Root open={dialog === "save"} onOpenChange={(open) => { if (!open) setDialog(null); }}><Dialog.Portal><Dialog.Overlay className="fixed inset-0 z-50 bg-[#10231a]/50 backdrop-blur-[2px]" /><Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-[var(--shadow-lg)] focus:outline-none"><Dialog.Title className="text-lg font-semibold">Save this plan as a template</Dialog.Title><Dialog.Description className="mt-2 text-xs leading-5 text-text-secondary">Milestones, task titles, dates relative to this event, priorities and client visibility will be saved. Comments, statuses and assignees stay with this event.</Dialog.Description><form onSubmit={saveTemplate} className="mt-5 space-y-4"><Input label="Template name" placeholder="e.g. Wedding planning essentials" value={templateName} onChange={(input) => setTemplateName(input.target.value)} maxLength={80} required />{error && <p role="alert" className="rounded-lg bg-error-soft px-3 py-2 text-xs text-error">{error}</p>}<div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setDialog(null)}>Cancel</Button><Button type="submit">Save template</Button></div></form></Dialog.Content></Dialog.Portal></Dialog.Root>
  </>;
}
