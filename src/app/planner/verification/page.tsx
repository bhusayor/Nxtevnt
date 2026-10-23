import type { Metadata } from "next";
import { VerificationWorkspace } from "@/components/planner/verification/verification-workspace";

export const metadata: Metadata = {
  title: "Planner verification",
  description: "Complete your NXTEVNT planner verification.",
};

export default function PlannerVerificationPage() {
  return <VerificationWorkspace />;
}
