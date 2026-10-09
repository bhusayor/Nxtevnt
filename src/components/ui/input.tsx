import { forwardRef, useId, type InputHTMLAttributes } from "react";

import { FormField, fieldControlStyles } from "@/components/ui/form-field";
import { cn } from "@/lib/utils/cn";

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  helperText?: string;
  error?: string;
  success?: string;
  optional?: boolean;
  recommended?: boolean;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ id, label, helperText, error, success, optional, recommended, required, className, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const messageId = error || success || helperText ? `${inputId}-message` : undefined;

    return (
      <FormField
        id={inputId}
        label={label}
        helperText={helperText}
        error={error}
        success={success}
        optional={optional}
        recommended={recommended}
        required={required}
      >
        <input
          ref={ref}
          id={inputId}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={messageId}
          className={cn(
            fieldControlStyles,
            "h-10",
            error && "border-error focus:border-error focus:ring-error/12",
            success && "border-success focus:border-success focus:ring-success/12",
            className,
          )}
          {...props}
        />
      </FormField>
    );
  },
);

Input.displayName = "Input";
