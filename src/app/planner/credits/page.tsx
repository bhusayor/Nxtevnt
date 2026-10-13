import type { Metadata } from "next";
import { CreditsPage } from "@/components/planner/credits-page";

export const metadata: Metadata = { title: "Credits", description: "Review your Nxtevnt Planner credits." };

export default async function Page({ searchParams }: PageProps<"/planner/credits">) {
  const { tab } = await searchParams;
  return <CreditsPage initialView={tab === "buy" ? "buy" : tab === "history" ? "history" : "overview"} />;
}
