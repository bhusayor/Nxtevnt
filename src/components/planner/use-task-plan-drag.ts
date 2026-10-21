"use client";

import { useEffect, useRef, useState, type DragEvent, type PointerEvent } from "react";
import type { TaskStatus } from "@/lib/planner-events";

export type PlanDrag = { kind: "task" | "milestone"; id: string; label: string };
export type PlanDrop = { kind: "milestone"; groupId: string | null } | { kind: "task"; groupId: string | null; taskId: string } | { kind: "status"; status: TaskStatus } | { kind: "kanban-task"; status: TaskStatus; taskId: string };
export type PlanPlacement = "before" | "after";
type Hover = { target: PlanDrop; placement: PlanPlacement };
const mime = "application/x-nxtevnt-task-plan";
const valid = (drag: PlanDrag, target: PlanDrop) => drag.kind === "task" || target.kind === "milestone" && target.groupId !== null;
const key = (target: PlanDrop) => JSON.stringify(target);

/** Shared drop targets for the milestone list and Kanban; scope prevents cross-event moves. */
export function useTaskPlanDrag(scope: string, onDrop: (drag: PlanDrag, target: PlanDrop, placement: PlanPlacement) => void, onNudge: (drag: PlanDrag, direction: -1 | 1) => void) {
  const active = useRef<PlanDrag | null>(null);
  const hover = useRef<Hover | null>(null);
  const touch = useRef<{ x: number; y: number; payload: PlanDrag } | null>(null);
  const [drag, setDrag] = useState<PlanDrag | null>(null);
  const [over, setOver] = useState<Hover | null>(null);
  const reset = () => { active.current = null; hover.current = null; touch.current = null; setDrag(null); setOver(null); };
  useEffect(() => {
    const cancel = (event: KeyboardEvent) => { if (event.key === "Escape") reset(); };
    window.addEventListener("keydown", cancel);
    window.addEventListener("blur", reset);
    return () => { window.removeEventListener("keydown", cancel); window.removeEventListener("blur", reset); };
  }, [scope]);
  function mark(target: PlanDrop, element: HTMLElement, y: number) {
    const rect = element.getBoundingClientRect();
    const next: Hover = { target, placement: y > rect.top + rect.height / 2 ? "after" : "before" };
    hover.current = next; setOver(next);
  }
  function finish() {
    const source = active.current, destination = hover.current;
    reset();
    if (source && destination && valid(source, destination.target)) onDrop(source, destination.target, destination.placement);
  }
  function inspectTouch(event: PointerEvent<HTMLButtonElement>) {
    let element = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>("[data-plan-drop]");
    while (element) {
      const target = JSON.parse(element.dataset.planDrop!) as PlanDrop;
      if (element.dataset.planScope === scope && active.current && valid(active.current, target)) { mark(target, element, event.clientY); return; }
      element = element.parentElement?.closest<HTMLElement>("[data-plan-drop]");
    }
    hover.current = null; setOver(null);
  }
  function handle(payload: PlanDrag) {
    return {
      draggable: true,
      onClick: (event: React.MouseEvent<HTMLButtonElement>) => event.stopPropagation(),
      onDragStart: (event: DragEvent<HTMLButtonElement>) => {
        event.stopPropagation(); active.current = payload; setDrag(payload);
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData(mime, JSON.stringify({ scope, ...payload }));
        const card = event.currentTarget.closest<HTMLElement>("[data-plan-drag-preview]") ?? event.currentTarget.closest<HTMLElement>("[data-plan-draggable]");
        if (card) event.dataTransfer.setDragImage(card, 24, 24);
      },
      onDragEnd: reset,
      onKeyDown: (event: React.KeyboardEvent<HTMLButtonElement>) => {
        if (event.altKey && (event.key === "ArrowUp" || event.key === "ArrowDown")) { event.preventDefault(); onNudge(payload, event.key === "ArrowUp" ? -1 : 1); }
      },
      onPointerDown: (event: PointerEvent<HTMLButtonElement>) => {
        if (event.pointerType === "mouse" || event.button !== 0) return;
        event.currentTarget.setPointerCapture(event.pointerId);
        touch.current = { x: event.clientX, y: event.clientY, payload };
      },
      onPointerMove: (event: PointerEvent<HTMLButtonElement>) => {
        if (!touch.current) return;
        if (!active.current && Math.hypot(event.clientX - touch.current.x, event.clientY - touch.current.y) < 8) return;
        event.preventDefault(); active.current = touch.current.payload; setDrag(active.current); inspectTouch(event);
        if (event.clientY < 96) window.scrollBy(0, -16);
        else if (event.clientY > window.innerHeight - 64) window.scrollBy(0, 16);
      },
      onPointerUp: (event: PointerEvent<HTMLButtonElement>) => {
        if (!touch.current) return;
        if (active.current) inspectTouch(event);
        finish();
      },
      // Browsers also emit pointercancel when a *mouse* starts native HTML drag.
      // Only cancel our touch gesture here, not the native drag that just began.
      onPointerCancel: () => { if (touch.current) reset(); },
    };
  }
  function drop(target: PlanDrop) {
    return {
      "data-plan-drop": key(target), "data-plan-scope": scope,
      onDragOver: (event: DragEvent<HTMLElement>) => {
        if (!active.current || !valid(active.current, target)) return;
        event.preventDefault(); event.stopPropagation(); event.dataTransfer.dropEffect = "move"; mark(target, event.currentTarget, event.clientY);
      },
      onDragLeave: (event: DragEvent<HTMLElement>) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null) && hover.current && key(hover.current.target) === key(target)) { hover.current = null; setOver(null); }
      },
      onDrop: (event: DragEvent<HTMLElement>) => {
        if (!active.current || !valid(active.current, target)) return;
        event.preventDefault(); event.stopPropagation();
        try { if (JSON.parse(event.dataTransfer.getData(mime)).scope !== scope) { reset(); return; } } catch { reset(); return; }
        mark(target, event.currentTarget, event.clientY); finish();
      },
    };
  }
  function highlight(target: PlanDrop) {
    if (!over || key(over.target) !== key(target)) return "";
    if (target.kind === "task" || target.kind === "kanban-task" || drag?.kind === "milestone") return over.placement === "before" ? "ring-2 ring-brand-primary/30 border-t-brand-primary" : "ring-2 ring-brand-primary/30 border-b-brand-primary";
    return "ring-2 ring-brand-primary/30 border-brand-primary";
  }
  return { drag, handle, drop, highlight };
}

export type TaskPlanDrag = ReturnType<typeof useTaskPlanDrag>;
