import type { Metadata } from "next";
import { RoleWorkspacePreview } from "@/components/planner/role-workspace-preview";

export const metadata: Metadata = { title: "Vendor workspace" };
export default function VendorPage() {
  return <RoleWorkspacePreview role="vendor" />;
}
