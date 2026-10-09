"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Monitor, Smartphone } from "lucide-react";
import { UpcomingEvents } from "@/components/planner/upcoming-events";
import { overviewEvents } from "@/components/planner/overview-data";
import { Button } from "@/components/ui/button";

export default function PlannerLayoutPreview() {
  const [count, setCount] = useState(3);
  const [mobile, setMobile] = useState(false);
  return (
    <main className="min-h-screen bg-background px-4 py-8 sm:px-10">
      <Link href="/planner" className="inline-flex items-center gap-2 text-sm font-semibold text-brand-primary"><ArrowLeft className="size-4" aria-hidden="true" />Back to dashboard</Link>
      <h1 className="mt-6 text-2xl font-semibold">Upcoming event layouts</h1>
      <p className="mt-2 text-sm text-text-secondary">Check how the same component adapts to the number of events and the space available.</p>
      <div className="my-6 flex flex-wrap items-center gap-2" aria-label="Preview controls">
        {[0, 1, 2, 3].map((value) => <Button key={value} size="sm" variant={count === value ? "primary" : "outline"} onClick={() => setCount(value)} aria-pressed={count === value}>{value} {value === 1 ? "event" : "events"}</Button>)}
        <span className="mx-2 h-6 w-px bg-border-default" />
        <Button size="sm" variant={mobile ? "outline" : "primary"} aria-pressed={!mobile} onClick={() => setMobile(false)} leadingIcon={<Monitor className="size-4" aria-hidden="true" />}>Desktop</Button>
        <Button size="sm" variant={mobile ? "primary" : "outline"} aria-pressed={mobile} onClick={() => setMobile(true)} leadingIcon={<Smartphone className="size-4" aria-hidden="true" />}>Mobile width</Button>
      </div>
      <div className={mobile ? "mx-auto w-full max-w-[390px]" : "w-full"}>
        <UpcomingEvents events={overviewEvents.slice(0, count)} />
      </div>
    </main>
  );
}
