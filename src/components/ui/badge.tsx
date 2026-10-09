import type { HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils/cn";

const badgeVariants = cva(
  "inline-flex w-fit items-center gap-1.5 rounded-[var(--radius-full)] px-2.5 py-1 text-xs font-semibold leading-none",
  {
    variants: {
      tone: {
        neutral: "bg-background-subtle text-text-secondary",
        success: "bg-success-soft text-success",
        warning: "bg-warning-soft text-warning",
        error: "bg-error-soft text-error",
        info: "bg-info-soft text-info",
        brand: "bg-surface-selected text-brand-primary",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
);

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>;

export function Badge({ tone, className, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}
