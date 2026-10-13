import { BadgeCheck, Check } from "@/components/ui/icons";

import { cn } from "@/lib/utils/cn";

export function VerificationBadge({ label = "Verified", className }: { label?: string; className?: string }) {
  return (
    <span className={cn("relative inline-flex size-[1.125rem] shrink-0 items-center justify-center", className)} title={label} aria-label={label}>
      <BadgeCheck aria-hidden="true" className="absolute inset-0 size-full fill-[var(--verification)] text-[var(--verification)]" />
      <Check aria-hidden="true" className="relative size-2.5 stroke-[3.25] text-white" />
    </span>
  );
}
