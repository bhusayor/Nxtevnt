"use client";

import type { SelectHTMLAttributes } from "react";
import { ChevronDown } from "@/components/ui/icons";

import { cn } from "@/lib/utils/cn";

export function BudgetNativeSelect({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <span className="relative block min-w-0"><select {...props} className={cn("h-10 w-full appearance-none rounded-lg border border-border-default bg-white py-0 pl-3.5 pr-10 text-xs text-text-primary outline-none transition-colors hover:border-border-strong focus:border-brand-primary focus:ring-[3px] focus:ring-brand-primary/10 disabled:bg-background-subtle disabled:text-text-tertiary", className)}>{children}</select><ChevronDown aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-text-tertiary" /></span>;
}
