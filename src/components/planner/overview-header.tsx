import Link from "next/link";
import { CalendarDays, Plus, Sun } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { useBrowserReady } from "@/lib/planner-events";

export function OverviewHeader() {
  const ready = useBrowserReady();
  const now = ready ? new Date() : null;
  const date = now ? new Intl.DateTimeFormat("en-NG", { weekday: "long", month: "long", day: "numeric", timeZone: "Africa/Lagos" }).format(now) : "Your planner workspace";
  const hour = now ? Number(new Intl.DateTimeFormat("en-GB", { hour: "numeric", hourCycle: "h23", timeZone: "Africa/Lagos" }).format(now)) : null;
  const greeting = hour === null ? "Welcome back" : hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="mb-1.5 flex items-center gap-1.5 text-xs text-text-tertiary"><CalendarDays className="size-3.5" aria-hidden="true" />{date}</p>
        <h1 className="flex items-center gap-2.5 text-2xl font-semibold tracking-[-0.035em] text-text-primary sm:text-[1.75rem]">{greeting}, Amaka <Sun className="size-5 text-[#c9a458]" aria-hidden="true" strokeWidth={1.5} /></h1>
        <p className="mt-1.5 text-sm text-text-secondary">A little clarity for your next big moment.</p>
      </div>
      <Link href="/planner/create-event" className={buttonVariants({ size: "md" })}>
        <Plus aria-hidden="true" className="size-4" />
        Create event
      </Link>
    </header>
  );
}
