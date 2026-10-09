"use client";

import { PasswordInput } from "@/components/ui/password-input";

type PasswordFieldProps = {
  id?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  error?: string;
  showRequirements?: boolean;
  autoComplete?: "current-password" | "new-password";
  disabled?: boolean;
};

export function PasswordField({
  id = "password",
  value = "",
  onValueChange,
  error,
  showRequirements = true,
  autoComplete = "current-password",
  disabled,
}: PasswordFieldProps) {
  return (
    <PasswordInput
      id={id}
      label="Password"
      required
      defaultValue={value}
      onValueChange={onValueChange}
      error={error}
      showRequirements={showRequirements}
      autoComplete={autoComplete}
      disabled={disabled}
    />
  );
}
