import { forwardRef, useId, type TextareaHTMLAttributes } from "react";

import { FormField, fieldControlStyles } from "@/components/ui/form-field";
import { cn } from "@/lib/utils/cn";

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  helperText?: string;
  error?: string;
  success?: string;
  optional?: boolean;
  recommended?: boolean;
};

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ id, label, helperText, error, success, optional, recommended, required, className, rows = 4, ...props }, ref) => {
    const generatedId = useId();
    const textareaId = id ?? generatedId;
    const messageId = error || success || helperText ? `${textareaId}-message` : undefined;

    return (
      <FormField
        id={textareaId}
        label={label}
        helperText={helperText}
        error={error}
        success={success}
        optional={optional}
        recommended={recommended}
        required={required}
      >
        <textarea
          ref={ref}
          id={textareaId}
          rows={rows}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={messageId}
          className={cn(
            fieldControlStyles,
            "min-h-24 resize-y py-2.5",
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

Textarea.displayName = "Textarea";
