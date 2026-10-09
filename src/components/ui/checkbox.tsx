"use client";

import { useId, type ReactNode } from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check } from "lucide-react";

import { cn } from "@/lib/utils/cn";

type CheckboxProps = {
  id?: string;
  name?: string;
  label: ReactNode;
  description?: string;
  error?: string;
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean | "indeterminate") => void;
  disabled?: boolean;
  required?: boolean;
  className?: string;
};

export function Checkbox({
  id,
  name,
  label,
  description,
  error,
  checked,
  defaultChecked,
  onCheckedChange,
  disabled,
  required,
  className,
}: CheckboxProps) {
  const generatedId = useId();
  const checkboxId = id ?? generatedId;
  const descriptionId = description || error ? `${checkboxId}-description` : undefined;

  return (
    <div className={cn("flex items-start gap-3", className)}>
      <CheckboxPrimitive.Root
        id={checkboxId}
        name={name}
        checked={checked}
        defaultChecked={defaultChecked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        required={required}
        aria-describedby={descriptionId}
        aria-invalid={error ? true : undefined}
        className={cn(
          "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-[var(--radius-xs)] border border-border-strong bg-surface text-text-inverse shadow-[var(--shadow-xs)] transition-colors duration-[var(--duration-fast)] hover:border-brand-primary data-[state=checked]:border-brand-primary data-[state=checked]:bg-brand-primary disabled:cursor-not-allowed disabled:opacity-45",
          error && "border-error",
        )}
      >
        <CheckboxPrimitive.Indicator>
          <Check aria-hidden="true" className="size-3.5" strokeWidth={3} />
        </CheckboxPrimitive.Indicator>
      </CheckboxPrimitive.Root>
      <div className="grid gap-0.5">
        <label htmlFor={checkboxId} className={cn("type-label cursor-pointer text-text-primary", disabled && "cursor-not-allowed text-text-disabled")}>
          {label}
          {required ? <span className="ml-1 text-error" aria-hidden="true">*</span> : null}
        </label>
        {description || error ? (
          <p id={descriptionId} className={cn("type-body-small text-text-tertiary", error && "text-error")} role={error ? "alert" : undefined}>
            {error ?? description}
          </p>
        ) : null}
      </div>
    </div>
  );
}
