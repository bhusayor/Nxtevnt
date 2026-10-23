import type { Metadata } from "next";
import { TeamDirectory } from "@/components/planner/team-directory";

export const metadata: Metadata = { title: "Team", description: "Manage the names in your NXTEVNT planner team." };

export default function Page() { return <TeamDirectory />; }
