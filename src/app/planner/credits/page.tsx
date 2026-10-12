import type { Metadata } from "next";
import { CreditsPage } from "@/components/planner/credits-page";

export const metadata: Metadata = { title: "Credits", description: "Review your Nxtevnt Planner credits." };

export default function Page() { return <CreditsPage />; }
