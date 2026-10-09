"use client";

import { useId } from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";

import { cn } from "@/lib/utils/cn";

type SwitchProps = {
  id?: string;
  name?: string;
  label: string;
  description?: string;
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  required?: boolean;
  className?: string;
};

export function Switch({
  id,
  name,
  label,
  description,
  checked,
  defaultChecked,
  onCheckedChange,
  disabled,
  required,
  className,
}: SwitchProps) {
  const generatedId = useId();
  const switchId = id ?? generatedId;
  const descriptionId = description ? `${switchId}-description` : undefined;

  return (
    <div className={cn("flex items-start justify-between gap-5", className)}>
      <div className="grid gap-0.5">
        <label htmlFor={switchId} className={cn("type-label cursor-pointer text-text-primary", disabled && "cursor-not-allowed text-text-disabled")}>
          {label}
        </label>
        {description ? <p id={descriptionId} className="type-body-small max-w-md text-text-tertiary">{description}</p> : null}
      </div>
      <SwitchPrimitive.Root
        id={switchId}
        name={name}
        checked={checked}
        defaultChecked={defaultChecked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        required={required}
        aria-describedby={descriptionId}
        className="relative h-6 w-11 shrink-0 rounded-full bg-border-strong transition-colors duration-[var(--duration-normal)] data-[state=checked]:bg-brand-primary disabled:cursor-not-allowed disabled:opacity-45"
      >
        <SwitchPrimitive.Thumb className="block size-5 translate-x-0.5 rounded-full bg-surface shadow-[var(--shadow-sm)] transition-transform duration-[var(--duration-normal)] data-[state=checked]:translate-x-[1.375rem]" />
      </SwitchPrimitive.Root>
    </div>
  );
}
