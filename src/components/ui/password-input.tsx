"use client";

import { useId, useState, type InputHTMLAttributes } from "react";
import { Eye, EyeOff } from "lucide-react";

import { FormField, fieldControlStyles } from "@/components/ui/form-field";
import { PasswordRequirements } from "@/components/nextevnt/password-requirements";
import { cn } from "@/lib/utils/cn";

type PasswordInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "value" | "defaultValue" | "onChange"> & {
  label?: string;
  helperText?: string;
  error?: string;
  showRequirements?: boolean;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
};

export function PasswordInput({ id, label = "Password", helperText, error, showRequirements = true, defaultValue = "", onValueChange, className, ...props }: PasswordInputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const [visible, setVisible] = useState(false);
  const [password, setPassword] = useState(String(defaultValue));

  return (
    <div className="grid gap-4">
      <FormField id={inputId} label={label} helperText={helperText} error={error} required={props.required}>
        <div className="relative">
          <input
            {...props}
            id={inputId}
            type={visible ? "text" : "password"}
            value={password}
            onChange={(event) => { setPassword(event.target.value); onValueChange?.(event.target.value); }}
            aria-invalid={error ? true : undefined}
            aria-describedby={error || helperText ? `${inputId}-message` : undefined}
            className={cn(fieldControlStyles, "h-10 pr-11", error && "border-error focus:border-error focus:ring-error/12", className)}
          />
          <button type="button" onClick={() => setVisible((current) => !current)} aria-label={visible ? "Hide password" : "Show password"} className="absolute top-1/2 right-2.5 flex size-7 -translate-y-1/2 items-center justify-center rounded-[var(--radius-sm)] text-text-tertiary hover:bg-background-subtle hover:text-text-primary">
            {visible ? <EyeOff aria-hidden="true" className="size-4" /> : <Eye aria-hidden="true" className="size-4" />}
          </button>
        </div>
      </FormField>
      {showRequirements ? <PasswordRequirements password={password} /> : null}
    </div>
  );
}
