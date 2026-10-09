import type { ReactNode } from "react";
import { Suspense } from "react";

import { PlannerShell } from "@/components/planner/planner-shell";

export default function PlannerLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <PlannerShell>{children}</PlannerShell>
    </Suspense>
  );
}
