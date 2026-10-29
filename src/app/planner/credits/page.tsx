import type { Metadata } from "next";
import { CreditsPage } from "@/components/planner/credits-page";

export const metadata: Metadata = { title: "Credits", description: "Review your NXTEVNT Planner credits." };

export default async function Page({ searchParams }: PageProps<"/planner/credits">) {
  const { tab, returnTo } = await searchParams;
  const returnToEvent = typeof returnTo === "string" && /^\/planner\/events\/[A-Za-z0-9%_-]+$/.test(returnTo) ? returnTo : undefined;
  return <CreditsPage initialView={tab === "buy" ? "buy" : tab === "history" ? "history" : "overview"} returnTo={returnToEvent} />;
}
