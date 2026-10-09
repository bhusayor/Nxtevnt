import type { ReactNode } from "react";

import { cn } from "@/lib/utils/cn";

type DesignSystemSectionProps = {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  className?: string;
};

export function DesignSystemSection({ id, eyebrow, title, description, children, className }: DesignSystemSectionProps) {
  return (
    <section id={id} className={cn("scroll-mt-8 border-b border-border-subtle py-10 last:border-b-0 sm:py-12", className)}>
      <div className="mb-7 grid gap-3 lg:grid-cols-[minmax(0,0.72fr)_minmax(18rem,0.28fr)] lg:items-end lg:gap-10">
        <div>
          <p className="type-caption mb-3 text-brand-primary">{eyebrow}</p>
          <h2 className="type-heading-2 text-text-primary">{title}</h2>
        </div>
        <p className="type-body text-text-secondary">{description}</p>
      </div>
      {children}
    </section>
  );
}

type ShowcasePanelProps = {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
  tone?: "default" | "subtle" | "dark";
};

export function ShowcasePanel({ title, description, children, className, tone = "default" }: ShowcasePanelProps) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-md)] border p-5",
        tone === "default" && "border-border-subtle bg-surface",
        tone === "subtle" && "border-border-subtle bg-surface-subtle",
        tone === "dark" && "border-brand-primary-active bg-brand-primary-active text-text-inverse",
        className,
      )}
    >
      {title || description ? (
        <div className="mb-5 grid gap-1">
          {title ? <h3 className={cn("type-label-large", tone === "dark" ? "text-text-inverse" : "text-text-primary")}>{title}</h3> : null}
          {description ? <p className={cn("type-body-small", tone === "dark" ? "text-white/65" : "text-text-tertiary")}>{description}</p> : null}
        </div>
      ) : null}
      {children}
    </div>
  );
}
