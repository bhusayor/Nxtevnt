"use client";

import { GripVertical } from "@/components/ui/icons";
import type { PlanDrag, TaskPlanDrag } from "./use-task-plan-drag";

export function TaskDragHandle({ controller, payload }: { controller: TaskPlanDrag; payload: PlanDrag }) {
  return <button type="button" {...controller.handle(payload)} aria-label={`Drag ${payload.kind}: ${payload.label}`} title="Drag to move · Alt + ↑ or ↓ to reorder" className="flex size-8 shrink-0 touch-none cursor-grab items-center justify-center rounded-lg text-text-tertiary transition-colors hover:bg-background-subtle hover:text-brand-primary focus-visible:outline-2 focus-visible:outline-brand-primary active:cursor-grabbing"><GripVertical className="size-4" aria-hidden="true" /></button>;
}
