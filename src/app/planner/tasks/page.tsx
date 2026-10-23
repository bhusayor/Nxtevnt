import type { Metadata } from "next";
import { PlannerTasksPage } from "@/components/planner/planner-tasks-page";

export const metadata: Metadata = { title: "Tasks", description: "Organise event tasks into milestones in NXTEVNT Planner." };

export default function Page() { return <PlannerTasksPage />; }
