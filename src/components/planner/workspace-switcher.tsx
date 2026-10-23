"use client";

import { useRouter } from "next/navigation";
import * as Select from "@radix-ui/react-select";
import { BriefcaseBusiness, CalendarRange, Check, ChevronDown, HeartHandshake } from "@/components/ui/icons";

export type WorkspaceRole = "planner" | "client" | "vendor";

const roles = [
  { value: "planner", title: "Planner", description: "Plan and manage events", icon: CalendarRange, tone: "bg-success-soft text-success" },
  { value: "client", title: "Client", description: "Bring your celebration to life", icon: HeartHandshake, tone: "bg-[var(--status-lavender-bg)] text-[var(--status-lavender-text)]" },
  { value: "vendor", title: "Vendor", description: "Manage your services and bookings", icon: BriefcaseBusiness, tone: "bg-info-soft text-info" },
] as const;

export function WorkspaceSwitcher({ role = "planner" }: { role?: WorkspaceRole }) {
  const router = useRouter();
  const current = roles.find((item) => item.value === role)!;
  const Icon = current.icon;

  function switchWorkspace(value: string) {
    window.sessionStorage.setItem("nxtevnt-account-type", value);
    router.push(value === "planner" ? "/planner" : `/${value}`);
  }

  return (
    <Select.Root value={role} onValueChange={switchWorkspace}>
      <Select.Trigger aria-label={`Switch workspace, ${current.title}`} className="flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-white/90 bg-white/85 px-2 text-xs font-semibold text-text-primary shadow-sm transition-colors hover:bg-white data-[state=open]:bg-surface-selected sm:h-10 sm:gap-2 sm:px-3">
        <span className={`flex size-6 shrink-0 items-center justify-center rounded-full ${current.tone}`}><Icon className="size-4" weight="bold" aria-hidden="true" /></span>
        <Select.Value><span className="sr-only sm:not-sr-only">{current.title}</span></Select.Value>
        <Select.Icon><ChevronDown className="size-4 text-text-secondary" weight="bold" aria-hidden="true" /></Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Content position="popper" align="end" sideOffset={8} className="z-50 w-72 overflow-hidden rounded-[var(--radius-lg)] border border-border-subtle bg-white p-1.5 shadow-[var(--shadow-md)]">
          <Select.Viewport>
            <p className="px-3 pt-2 pb-2.5 text-[0.625rem] font-semibold uppercase tracking-[0.12em] text-text-tertiary">Switch workspace</p>
            {roles.map((item) => {
              const RoleIcon = item.icon;
              return (
                <Select.Item key={item.value} value={item.value} className="relative flex cursor-pointer items-center gap-3 rounded-[var(--radius-md)] p-3 pr-8 outline-none data-[highlighted]:bg-background data-[state=checked]:bg-surface-selected">
                  <span className={`flex size-9 shrink-0 items-center justify-center rounded-[var(--radius-md)] ${item.tone}`}><RoleIcon className="size-5" weight="bold" aria-hidden="true" /></span>
                  <div><Select.ItemText><span className="text-sm font-semibold text-text-primary">{item.title}</span></Select.ItemText><p className="mt-0.5 text-[0.6875rem] text-text-secondary">{item.description}</p></div>
                  <Select.ItemIndicator className="absolute right-3 text-brand-primary"><Check className="size-4" weight="bold" aria-hidden="true" /></Select.ItemIndicator>
                </Select.Item>
              );
            })}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}
