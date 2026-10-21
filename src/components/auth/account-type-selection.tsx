"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowRight } from "@/components/ui/icons";

import { AuthFlowProgress } from "@/components/auth/auth-flow-progress";
import { cn } from "@/lib/utils/cn";

type AccountType = "planner" | "vendor" | "client";

type Role = {
  id: AccountType;
  title: string;
  description: string;
  image: string;
  cardClassName: string;
};

const roles: Role[] = [
  {
    id: "planner",
    title: "Event planner",
    description: "Plan events, manage clients, coordinate vendors, budgets, timelines and teams.",
    image: "/images/auth/role-planner-illustration.jpg",
    cardClassName: "bg-[#f6faf7]",
  },
  {
    id: "vendor",
    title: "Vendor",
    description: "Showcase your services, respond to opportunities and collaborate with planners.",
    image: "/images/auth/role-vendor-illustration.jpg",
    cardClassName: "bg-[#f6f9fc]",
  },
  {
    id: "client",
    title: "Client",
    description: "Discover trusted professionals and keep your event plans clear and connected.",
    image: "/images/auth/role-client-illustration.jpg",
    cardClassName: "bg-[#faf7fc]",
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
        <p className="type-caption text-brand-primary">Make NXTEVNT yours</p>
        <h1 className="type-heading-2 mt-2 text-text-primary">How will you use NXTEVNT?</h1>
        <p className="type-body mt-2 text-text-secondary">
          Choose the account that best matches what you want to do. You can update this later.
        </p>
      </header>

      <div className="mt-7 grid gap-3.5">
        {roles.map((role) => {
          return (
            <button
              key={role.id}
              type="button"
              onClick={() => chooseRole(role.id)}
              className={cn(
                "group relative flex min-h-[8.5rem] w-full items-center gap-3 rounded-[1.35rem] border border-border-default p-2.5 pr-3 text-left shadow-[var(--shadow-xs)] transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-brand-primary/45 hover:shadow-[var(--shadow-sm)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-primary/15 sm:gap-4 sm:p-3",
                role.cardClassName,
              )}
            >
              <span className="relative size-24 shrink-0 overflow-hidden rounded-[1rem] bg-white ring-1 ring-black/5 sm:size-[7.25rem]">
                <Image
                  src={role.image}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 96px, 116px"
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </span>

              <span className="min-w-0 flex-1 py-1">
                <span className="block text-base font-semibold tracking-[-0.015em] text-text-primary">{role.title}</span>
                <span className="mt-1 block text-[0.8125rem] leading-[1.35rem] text-text-secondary">{role.description}</span>
              </span>

              <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border-default bg-white text-text-secondary transition-all group-hover:border-brand-primary group-hover:bg-brand-primary group-hover:text-white">
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
