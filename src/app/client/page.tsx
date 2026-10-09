import type { Metadata } from "next";
import { RoleWorkspacePreview } from "@/components/planner/role-workspace-preview";

export const metadata: Metadata = { title: "Client workspace" };
export default function ClientPage() {
  return <RoleWorkspacePreview role="client" />;
}
