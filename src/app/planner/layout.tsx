import type { ReactNode } from "react";
import { Suspense } from "react";

import { PlannerShell } from "@/components/planner/planner-shell";

export default function PlannerLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<div className="app-canvas min-h-screen" />}>
      <PlannerShell>{children}</PlannerShell>
    </Suspense>
  );
}
