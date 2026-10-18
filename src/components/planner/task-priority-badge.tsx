import type { EventItem } from "@/lib/planner-events";
import { cn } from "@/lib/utils/cn";

export type TaskPriority = NonNullable<EventItem["priority"]>;

export const taskPriorityTones: Record<TaskPriority, string> = {
  high: "border-[#f1d4cf] bg-[#fcece9] text-[#9b4e47]",
  medium: "border-[#f3e2c9] bg-[#fff4e4] text-[#94652f]",
  low: "border-[#d8e7f2] bg-[#edf5fb] text-[#4d708c]",
};

export function TaskPriorityBadge({ priority = "medium", showSuffix = false }: { priority?: TaskPriority; showSuffix?: boolean }) {
  const label = priority[0].toUpperCase() + priority.slice(1);
  return <span className={cn("inline-flex w-fit items-center rounded-full border px-2.5 py-1 text-[0.625rem] font-semibold leading-4", taskPriorityTones[priority])}>{label}{showSuffix ? " priority" : ""}</span>;
}
