import { Check } from "@/components/ui/icons";

import { cn } from "@/lib/utils/cn";

const steps = ["Account", "Verify", "Role"] as const;

export function AuthFlowProgress({ currentStep }: { currentStep: 2 | 3 }) {
  return (
    <ol className="flex items-start" aria-label={`Step ${currentStep} of 3`}>
      {steps.map((step, index) => {
        const stepNumber = index + 1;
        const complete = stepNumber < currentStep;
        const active = stepNumber === currentStep;

        return (
          <li key={step} className={cn("relative flex flex-1 flex-col gap-2 last:flex-none", index < steps.length - 1 && "pr-3")}>
            <div className="flex items-center">
              <span
                className={cn(
                  "relative z-10 flex size-6 shrink-0 items-center justify-center rounded-full border text-[0.6875rem] font-bold transition-colors",
                  complete && "border-brand-primary bg-brand-primary text-white",
                  active && "border-brand-primary bg-surface text-brand-primary ring-4 ring-brand-primary/10",
                  !complete && !active && "border-border-default bg-surface text-text-tertiary",
                )}
                aria-current={active ? "step" : undefined}
              >
                {complete ? <Check aria-hidden="true" className="size-3" weight="bold" /> : stepNumber}
              </span>
              {index < steps.length - 1 ? (
                <span className={cn("h-px w-full", complete ? "bg-brand-primary" : "bg-border-default")} aria-hidden="true" />
              ) : null}
            </div>
            <span className={cn("type-label-small", active ? "text-text-primary" : "text-text-tertiary")}>{step}</span>
          </li>
        );
      })}
    </ol>
  );
}
