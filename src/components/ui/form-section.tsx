import type { ReactNode } from "react";

import { cn } from "@/lib/utils/cn";

type FormSectionProps = {
  title: string;
  description?: string;
  children: ReactNode;
  actions?: ReactNode;
  className?: string;
};

export function FormSection({ title, description, children, actions, className }: FormSectionProps) {
  return (
    <section className={cn("grid gap-6 rounded-[var(--radius-lg)] border border-border-subtle bg-surface p-5 sm:p-6", className)}>
      <div className="flex items-start justify-between gap-5">
        <div className="grid gap-1"><h3 className="type-heading-4 text-text-primary">{title}</h3>{description ? <p className="type-body-small max-w-2xl text-text-secondary">{description}</p> : null}</div>
        {actions}
      </div>
      <div className="grid gap-5">{children}</div>
    </section>
  );
}
