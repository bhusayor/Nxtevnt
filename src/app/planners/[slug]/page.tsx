import type { Metadata } from "next";
import { PublicProfilePreview } from "@/components/planner/profile/public-profile-preview";

export const metadata: Metadata = {
  title: { absolute: "Planner profile preview · NXTEVNT" },
  description: "Explore your planner’s portfolio, services, pricing and availability, then start a conversation about your event.",
  robots: { index: false, follow: false },
};
export default async function PlannerPreviewPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <PublicProfilePreview slug={slug} />;
}
