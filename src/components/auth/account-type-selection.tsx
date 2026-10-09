"use client";

import { useRouter } from "next/navigation";
import { ArrowRight, BriefcaseBusiness, CalendarRange, Handshake, type LucideIcon } from "lucide-react";

import { AuthFlowProgress } from "@/components/auth/auth-flow-progress";
import { cn } from "@/lib/utils/cn";

type AccountType = "planner" | "vendor" | "client";

type Role = {
  id: AccountType;
  title: string;
  description: string;
  icon: LucideIcon;
  iconClassName: string;
};

const roles: Role[] = [
  {
    id: "planner",
    title: "Event planner",
    description: "Plan events, manage clients, coordinate vendors, budgets, timelines and teams.",
    icon: CalendarRange,
    iconClassName: "bg-success-soft text-success",
  },
  {
    id: "vendor",
    title: "Vendor",
    description: "Showcase your services, respond to opportunities and collaborate with planners.",
    icon: BriefcaseBusiness,
    iconClassName: "bg-info-soft text-info",
  },
  {
    id: "client",
    title: "Client",
    description: "Discover trusted professionals and keep your event plans clear and connected.",
    icon: Handshake,
    iconClassName: "bg-[var(--status-lavender-bg)] text-[var(--status-lavender-text)]",
  },
];

export function AccountTypeSelection() {
  const router = useRouter();

  function chooseRole(role: AccountType) {
    window.sessionStorage.setItem("nxtevnt-account-type", role);
    router.push(role === "planner" ? "/planner" : `/${role}`);
  }

  return (
    <div className="w-full">
      <AuthFlowProgress currentStep={3} />

      <header className="mt-8">
        <p className="type-caption text-brand-primary">Make Nxtevnt yours</p>
        <h1 className="type-heading-2 mt-2 text-text-primary">How will you use Nxtevnt?</h1>
        <p className="type-body mt-2 text-text-secondary">
          Choose the account that best matches what you want to do. You can update this later.
        </p>
      </header>

      <div className="mt-7 grid gap-3">
        {roles.map((role) => {
          const Icon = role.icon;
          return (
            <button
              key={role.id}
              type="button"
              onClick={() => chooseRole(role.id)}
              className="group relative flex items-center gap-4 rounded-[var(--radius-xl)] border border-border-default bg-surface p-4 text-left shadow-[var(--shadow-xs)] transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-brand-primary/45 hover:shadow-[var(--shadow-sm)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-primary/15"
            >
              <span className={cn("flex size-12 shrink-0 items-center justify-center rounded-[var(--radius-lg)] transition-transform duration-200 group-hover:scale-105", role.iconClassName)}>
                <Icon aria-hidden="true" className="size-6" strokeWidth={1.8} />
              </span>

              <span className="min-w-0 flex-1">
                <span className="block text-base font-semibold tracking-[-0.015em] text-text-primary">{role.title}</span>
                <span className="mt-1 block text-xs leading-5 text-text-secondary">{role.description}</span>
              </span>

              <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border-default bg-surface text-text-secondary transition-all group-hover:border-brand-primary group-hover:bg-brand-primary group-hover:text-white">
                <ArrowRight aria-hidden="true" className="size-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            </button>
          );
        })}
      </div>

      <p className="type-body-small mt-5 text-center text-text-tertiary">Choose a role to continue to your dashboard.</p>
    </div>
  );
}
