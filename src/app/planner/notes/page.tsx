import type { Metadata } from "next";
import { PlannerNotesPage } from "@/components/planner/planner-notes-page";

export const metadata: Metadata = { title: "Notes", description: "Personal, lead and event notebooks in NXTEVNT Planner." };

export default function Page() { return <PlannerNotesPage />; }
