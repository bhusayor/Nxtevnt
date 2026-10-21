import type { Metadata } from "next";
import { PlannerProfilePage } from "@/components/planner/planner-profile";

export const metadata: Metadata = { title: "Planner profile", description: "Your planning brand, specialties and coverage on NXTEVNT." };
export default function ProfilePage() { return <PlannerProfilePage />; }
