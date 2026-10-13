import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { LoaderCircle } from "@/components/ui/icons";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils/cn";

export const buttonVariants = cva(
  "button-touch-target inline-flex shrink-0 touch-manipulation items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius-md)] font-semibold transition-[color,background-color,border-color,box-shadow,transform] duration-[var(--duration-fast)] ease-[var(--ease-standard)] active:translate-y-px disabled:pointer-events-none disabled:translate-y-0 disabled:opacity-45",
  {
    variants: {
      variant: {
        primary: "bg-brand-primary text-text-inverse hover:bg-brand-primary-hover active:bg-brand-primary-active",
        secondary: "border border-border-default bg-surface text-text-primary hover:border-border-strong hover:bg-surface-subtle active:bg-background-subtle",
        outline: "border border-border-default bg-surface text-text-primary hover:border-border-strong hover:bg-surface-subtle active:bg-background-subtle",
        ghost: "bg-transparent text-text-secondary hover:bg-background-subtle hover:text-text-primary active:bg-surface-selected",
        soft: "bg-brand-secondary text-brand-primary hover:bg-brand-secondary-hover active:bg-brand-secondary-active",
        destructive: "bg-error text-text-inverse hover:bg-[#923838] active:bg-[#7f3030]",
      },
      size: {
        xs: "h-7 px-2.5 text-[0.6875rem] leading-4",
        sm: "h-8 px-3 text-xs leading-4",
        md: "h-10 px-4 text-sm leading-5",
        lg: "h-12 px-5 text-base leading-6",
        xl: "h-14 px-6 text-lg leading-7",
      },
      fullWidth: {
        true: "w-full",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    leadingIcon?: ReactNode;
    trailingIcon?: ReactNode;
    loading?: boolean;
  };

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, fullWidth, leadingIcon, trailingIcon, loading, disabled, children, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size, fullWidth }), className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> : leadingIcon}
      <span>{children}</span>
      {!loading && trailingIcon}
    </button>
  ),
);

Button.displayName = "Button";
