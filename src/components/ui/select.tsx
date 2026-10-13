"use client";

import { useId } from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown } from "@/components/ui/icons";

import { FormField, fieldControlStyles } from "@/components/ui/form-field";
import { cn } from "@/lib/utils/cn";

export type SelectOption = {
  label: string;
  value: string;
  disabled?: boolean;
};

type SelectProps = {
  id?: string;
  name?: string;
  label?: string;
  placeholder?: string;
  helperText?: string;
  error?: string;
  success?: string;
  required?: boolean;
  optional?: boolean;
  recommended?: boolean;
  disabled?: boolean;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  options: SelectOption[];
  className?: string;
};

export function Select({
  id,
  name,
  label,
  placeholder = "Select an option",
  helperText,
  error,
  success,
  required,
  optional,
  recommended,
  disabled,
  value,
  defaultValue,
  onValueChange,
  options,
  className,
}: SelectProps) {
  const generatedId = useId();
  const selectId = id ?? generatedId;
  const messageId = error || success || helperText ? `${selectId}-message` : undefined;

  return (
    <FormField
      id={selectId}
      label={label}
      helperText={helperText}
      error={error}
      success={success}
      required={required}
      optional={optional}
      recommended={recommended}
    >
      <SelectPrimitive.Root
        name={name}
        value={value}
        defaultValue={defaultValue}
        onValueChange={onValueChange}
        disabled={disabled}
        required={required}
      >
        <SelectPrimitive.Trigger
          id={selectId}
          aria-describedby={messageId}
          aria-invalid={error ? true : undefined}
          className={cn(
            fieldControlStyles,
            "flex h-10 items-center justify-between gap-3 text-left data-[placeholder]:text-text-disabled",
            error && "border-error focus:border-error focus:ring-error/12",
            success && "border-success focus:border-success focus:ring-success/12",
            className,
          )}
        >
          <SelectPrimitive.Value placeholder={placeholder} />
          <SelectPrimitive.Icon asChild>
            <ChevronDown aria-hidden="true" className="size-4 shrink-0 text-text-tertiary" />
          </SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>
        <SelectPrimitive.Portal>
          <SelectPrimitive.Content
            position="popper"
            sideOffset={6}
            className="z-50 max-h-72 min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-[var(--radius-md)] border border-border-default bg-surface p-1 shadow-[var(--shadow-md)]"
          >
            <SelectPrimitive.Viewport>
              {options.map((option) => (
                <SelectPrimitive.Item
                  key={option.value}
                  value={option.value}
                  disabled={option.disabled}
                  className="relative flex cursor-default select-none items-center rounded-[var(--radius-sm)] py-2 pr-8 pl-3 text-sm text-text-primary outline-none data-[disabled]:pointer-events-none data-[highlighted]:bg-surface-selected data-[disabled]:text-text-disabled"
                >
                  <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
                  <SelectPrimitive.ItemIndicator className="absolute right-2.5 text-brand-primary">
                    <Check aria-hidden="true" className="size-4" />
                  </SelectPrimitive.ItemIndicator>
                </SelectPrimitive.Item>
              ))}
            </SelectPrimitive.Viewport>
          </SelectPrimitive.Content>
        </SelectPrimitive.Portal>
      </SelectPrimitive.Root>
    </FormField>
  );
}
