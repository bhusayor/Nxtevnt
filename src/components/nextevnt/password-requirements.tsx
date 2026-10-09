import { Check, X } from "lucide-react";

import { passwordRequirements } from "@/lib/validation/password";
import { cn } from "@/lib/utils/cn";

type PasswordRequirementsProps = {
  password: string;
  className?: string;
};

export function PasswordRequirements({ password, className }: PasswordRequirementsProps) {
  return (
    <div className={cn("grid gap-2", className)} aria-live="polite">
      <p className="type-label text-text-primary">Password must contain</p>
      <ul className="grid gap-1.5 sm:grid-cols-2">
        {passwordRequirements.map((requirement) => {
          const satisfied = requirement.test(password);
          const Icon = satisfied ? Check : X;

          return (
            <li key={requirement.id} className={cn("flex items-center gap-2 text-xs", satisfied ? "text-success" : "text-text-tertiary")}>
              <span className={cn("flex size-4 items-center justify-center rounded-full", satisfied ? "bg-success-soft text-success" : "bg-error-soft text-error")} aria-hidden="true">
                <Icon className="size-2.5" strokeWidth={3} />
              </span>
              {requirement.label}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
