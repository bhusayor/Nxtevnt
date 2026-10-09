"use client";

import { useId } from "react";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";

import { cn } from "@/lib/utils/cn";

type RadioOption = {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
};

type RadioGroupProps = {
  id?: string;
  name?: string;
  label?: string;
  options: RadioOption[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
  orientation?: "horizontal" | "vertical";
  className?: string;
};

export function RadioGroup({
  id,
  name,
  label,
  options,
  value,
  defaultValue,
  onValueChange,
  disabled,
  required,
  orientation = "vertical",
  className,
}: RadioGroupProps) {
  const generatedId = useId();
  const groupId = id ?? generatedId;

  return (
    <fieldset className={cn("grid gap-3", className)} disabled={disabled}>
      {label ? <legend className="type-label mb-1 text-text-primary">{label}</legend> : null}
      <RadioGroupPrimitive.Root
        id={groupId}
        name={name}
        value={value}
        defaultValue={defaultValue}
        onValueChange={onValueChange}
        required={required}
        disabled={disabled}
        orientation={orientation}
        className={cn("flex gap-4", orientation === "vertical" ? "flex-col" : "flex-row flex-wrap")}
      >
        {options.map((option) => {
          const optionId = `${groupId}-${option.value}`;
          return (
            <div key={option.value} className="flex items-start gap-3">
              <RadioGroupPrimitive.Item
                id={optionId}
                value={option.value}
                disabled={option.disabled}
                className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border border-border-strong bg-surface shadow-[var(--shadow-xs)] transition-colors duration-[var(--duration-fast)] hover:border-brand-primary data-[state=checked]:border-brand-primary disabled:cursor-not-allowed disabled:opacity-45"
              >
                <RadioGroupPrimitive.Indicator className="size-2.5 rounded-full bg-brand-primary" />
              </RadioGroupPrimitive.Item>
              <div className="grid gap-0.5">
                <label htmlFor={optionId} className={cn("type-label cursor-pointer text-text-primary", option.disabled && "cursor-not-allowed text-text-disabled")}>
                  {option.label}
                </label>
                {option.description ? <p className="type-body-small text-text-tertiary">{option.description}</p> : null}
              </div>
            </div>
          );
        })}
      </RadioGroupPrimitive.Root>
    </fieldset>
  );
}
