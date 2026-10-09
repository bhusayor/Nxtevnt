import { forwardRef, useId, type InputHTMLAttributes } from "react";

import { FormField } from "@/components/ui/form-field";
import { cn } from "@/lib/utils/cn";

type PhoneInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label?: string;
  helperText?: string;
  error?: string;
  countryCode?: string;
};

export const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ id, label, helperText, error, countryCode = "+234", className, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    return (
      <FormField id={inputId} label={label} helperText={helperText} error={error}>
        <div className={cn("flex h-10 overflow-hidden rounded-[var(--radius-md)] border border-border-default bg-surface focus-within:border-brand-primary focus-within:ring-[3px] focus-within:ring-brand-primary/12", error && "border-error focus-within:border-error focus-within:ring-error/12", className)}>
          <span className="flex items-center border-r border-border-subtle bg-surface-subtle px-3 text-sm font-semibold text-text-secondary">{countryCode}</span>
          <input ref={ref} id={inputId} type="tel" inputMode="tel" aria-invalid={error ? true : undefined} aria-describedby={error || helperText ? `${inputId}-message` : undefined} className="min-w-0 flex-1 bg-transparent px-3.5 text-sm text-text-primary outline-none placeholder:text-text-disabled" {...props} />
        </div>
      </FormField>
    );
  },
);

PhoneInput.displayName = "PhoneInput";
