import type { HTMLAttributes, ReactNode } from "react";
import { CircleAlert, CircleCheck, Info, TriangleAlert } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils/cn";

const alertVariants = cva("flex items-start gap-3 rounded-[var(--radius-md)] border px-4 py-3.5", {
  variants: {
    tone: {
      neutral: "border-border-default bg-surface-subtle text-text-secondary",
      success: "border-success/20 bg-success-soft text-success",
      warning: "border-warning/20 bg-warning-soft text-warning",
      error: "border-error/20 bg-error-soft text-error",
      info: "border-info/20 bg-info-soft text-info",
    },
  },
  defaultVariants: { tone: "neutral" },
});

const alertIcons = {
  neutral: Info,
  success: CircleCheck,
  warning: TriangleAlert,
  error: CircleAlert,
  info: Info,
};

type AlertProps = HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof alertVariants> & {
    title?: string;
    icon?: ReactNode;
  };

export function Alert({ tone = "neutral", title, icon, children, className, ...props }: AlertProps) {
  const Icon = alertIcons[tone ?? "neutral"];

  return (
    <div role={tone === "error" ? "alert" : "status"} className={cn(alertVariants({ tone }), className)} {...props}>
      <span className="mt-0.5 shrink-0" aria-hidden="true">{icon ?? <Icon className="size-4.5" />}</span>
      <div className="grid min-w-0 gap-0.5">
        {title ? <p className="type-label-large text-current">{title}</p> : null}
        <div className="type-body-small text-current opacity-90">{children}</div>
      </div>
    </div>
  );
}
