import { forwardRef, useId, type InputHTMLAttributes } from "react";

import { FormField } from "@/components/ui/form-field";
import { cn } from "@/lib/utils/cn";

type CurrencyInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label?: string;
  helperText?: string;
  error?: string;
  success?: string;
  currency?: "NGN" | "USD" | "GBP" | "EUR";
};

const symbols = { NGN: "₦", USD: "$", GBP: "£", EUR: "€" };

export const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ id, label, helperText, error, success, currency = "NGN", className, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    return (
      <FormField id={inputId} label={label} helperText={helperText} error={error} success={success}>
        <div className={cn("flex h-10 overflow-hidden rounded-[var(--radius-md)] border border-border-default bg-surface transition-[border-color,box-shadow] focus-within:border-brand-primary focus-within:ring-[3px] focus-within:ring-brand-primary/12", error && "border-error focus-within:border-error focus-within:ring-error/12", className)}>
          <span className="flex min-w-13 items-center justify-center border-r border-border-subtle bg-surface-subtle px-3 text-sm font-semibold text-text-secondary" aria-hidden="true">{symbols[currency]}</span>
          <input ref={ref} id={inputId} type="text" inputMode="decimal" aria-invalid={error ? true : undefined} aria-describedby={error || success || helperText ? `${inputId}-message` : undefined} className="min-w-0 flex-1 bg-transparent px-3.5 text-right text-sm font-medium tabular-nums text-text-primary outline-none placeholder:text-text-disabled disabled:bg-background-subtle" {...props} />
          <span className="flex items-center px-3 text-xs font-semibold text-text-tertiary">{currency}</span>
        </div>
      </FormField>
    );
  },
);

CurrencyInput.displayName = "CurrencyInput";
