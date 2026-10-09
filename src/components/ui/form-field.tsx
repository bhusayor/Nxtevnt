import type { HTMLAttributes, ReactNode } from "react";
import { CheckCircle2, CircleAlert } from "lucide-react";

import { cn } from "@/lib/utils/cn";

export type FieldState = "default" | "error" | "success";

type FormFieldProps = HTMLAttributes<HTMLDivElement> & {
  id: string;
  label?: string;
  helperText?: string;
  error?: string;
  success?: string;
  required?: boolean;
  optional?: boolean;
  recommended?: boolean;
  children: ReactNode;
};

export function FormField({
  id,
  label,
  helperText,
  error,
  success,
  required,
  optional,
  recommended,
  children,
  className,
  ...props
}: FormFieldProps) {
  const message = error ?? success ?? helperText;
  const messageId = message ? `${id}-message` : undefined;

  return (
    <div className={cn("grid gap-2", className)} {...props}>
      {label ? (
        <div className="flex items-baseline justify-between gap-3">
          <label htmlFor={id} className="type-label text-text-primary">
            {label}
            {required ? <span className="ml-1 text-error" aria-hidden="true">*</span> : null}
          </label>
          {recommended ? <span className="type-label-small text-brand-primary">Recommended</span> : null}
          {!recommended && optional ? <span className="type-label-small text-text-tertiary">Optional</span> : null}
        </div>
      ) : null}
      {children}
      {message ? (
        <p
          id={messageId}
          className={cn(
            "flex items-start gap-1.5 text-xs leading-5",
            error && "text-error",
            success && "text-success",
            !error && !success && "text-text-tertiary",
          )}
          role={error ? "alert" : undefined}
        >
          {error ? <CircleAlert aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" /> : null}
          {success ? <CheckCircle2 aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" /> : null}
          {message}
        </p>
      ) : null}
    </div>
  );
}

export const fieldControlStyles =
  "w-full rounded-[var(--radius-md)] border border-border-default bg-surface px-3.5 text-sm text-text-primary transition-[border-color,box-shadow,background-color] duration-[var(--duration-fast)] placeholder:text-text-disabled hover:border-border-strong focus:border-brand-primary focus:outline-none focus:ring-[3px] focus:ring-brand-primary/12 disabled:cursor-not-allowed disabled:bg-background-subtle disabled:text-text-disabled";
