"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  BriefcaseBusiness,
  CalendarCheck,
  CalendarDays,
  CircleDollarSign,
  ClipboardCheck,
  ContactRound,
  CreditCard,
  FileStack,
  LayoutDashboard,
  Menu,
  Settings2,
  UsersRound,
} from "lucide-react";

import { BrandMark } from "@/components/nextevnt/brand-logo";
import { WorkspaceSwitcher, type WorkspaceRole } from "@/components/planner/workspace-switcher";
import { useCreditBalance } from "@/lib/planner-credits";
import { cn } from "@/lib/utils/cn";

const navGroups = [
  {
    label: "Workspace",
    items: [
      { label: "Overview", href: "/planner", icon: LayoutDashboard },
      { label: "Events", href: "/planner/events", icon: CalendarDays },
      { label: "Budget", href: "/planner/budget", icon: CircleDollarSign },
      { label: "Tasks", href: "/planner/tasks", icon: ClipboardCheck },
    ],
  },
  {
    label: "Relationships",
    items: [
      { label: "Vendors", href: "/planner/vendors", icon: BriefcaseBusiness },
      { label: "Clients", href: "/planner/clients", icon: ContactRound },
    ],
  },
  {
    label: "Operations",
    items: [
      { label: "Availability", href: "/planner/availability", icon: CalendarCheck },
      { label: "Questionnaires", href: "/planner/settings/questionnaires", icon: FileStack },
      { label: "Team", href: "/planner/team", icon: UsersRound },
    ],
  },
] as const;

const mobileNav = [
  { label: "Overview", href: "/planner", icon: LayoutDashboard },
  { label: "Events", href: "/planner/events", icon: CalendarDays },
  { label: "Tasks", href: "/planner/tasks", icon: ClipboardCheck },
  { label: "More", href: "/planner/more", icon: Menu },
] as const;

function isActive(pathname: string, href: string) {
  return href === "/planner" ? pathname === href : pathname.startsWith(href);
}

export function PlannerShell({ children, role = "planner" }: { children: ReactNode; role?: WorkspaceRole }) {
  const credits = useCreditBalance();
  const pathname = usePathname();
  const home = role === "planner" ? "/planner" : `/${role}`;
  const roleLabel = role[0].toUpperCase() + role.slice(1);
  const sectionLabel = pathname === home ? "Overview" : pathname.startsWith("/planner/events/") ? "Event workspace" : pathname.split("/").at(-1)!.replaceAll("-", " ");

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-border-subtle bg-surface lg:flex">
        <Link href={home} className="flex h-16 items-center gap-2 border-b border-border-subtle px-5" aria-label="Nxtevnt home">
          <BrandMark size="sm" />
          <span className="text-[0.9375rem] font-bold tracking-[-0.02em] text-text-primary">NXTEVNT</span>
        </Link>

        <nav className="flex-1 overflow-y-auto px-4 py-7" aria-label={`${roleLabel} navigation`}>
          <div className="space-y-6">
            {role === "planner" ? navGroups.map((group) => (
              <div key={group.label}>
                <p className="mb-2 px-3 text-[0.625rem] font-bold uppercase tracking-[0.12em] text-text-tertiary">{group.label}</p>
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(pathname, item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "relative flex h-10 items-center gap-3 rounded-[var(--radius-md)] px-3 text-sm transition-colors duration-150",
                          active
                            ? "bg-surface-selected font-semibold text-brand-primary"
                            : "text-text-secondary hover:bg-background-subtle hover:text-text-primary",
                        )}
                      >
                        <Icon aria-hidden="true" className={cn("size-[18px]", active && "text-brand-primary")} strokeWidth={1.8} />
                        <span className="flex-1">{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )) : <Link href={home} className="flex h-10 items-center gap-3 rounded-[var(--radius-md)] bg-surface-selected px-3 text-sm font-semibold text-brand-primary"><LayoutDashboard className="size-[18px]" aria-hidden="true" />Overview</Link>}
          </div>
        </nav>

        <Link href="/planner/profile" className="mx-4 mb-5 flex items-center gap-3 border-t border-border-subtle pt-5 text-left">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#e3ebe5] text-xs font-bold text-brand-primary ring-2 ring-white">AO</span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold text-text-primary">Amaka Okafor</span>
            <span className="block truncate text-xs text-text-tertiary">Personal account</span>
          </span>
          <Settings2 aria-hidden="true" className="size-4 text-text-tertiary" />
        </Link>
      </aside>

      <div className="lg:pl-60">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-border-subtle bg-white/95 px-4 backdrop-blur sm:px-6 lg:px-10">
          <div className="flex items-center gap-3">
            <Link href={home} className="flex items-center gap-2 lg:hidden" aria-label="Nxtevnt home">
              <BrandMark size="sm" />
              <span className="hidden text-sm font-bold text-text-primary sm:inline">NXTEVNT</span>
            </Link>
            <div className="hidden items-center gap-2 text-xs lg:flex">
              <span className="text-text-tertiary">{roleLabel} workspace</span>
              <span className="text-border-strong">/</span>
              <span className="font-medium capitalize text-text-primary">{sectionLabel}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/planner/credits" className="mr-1 hidden h-9 items-center gap-2 rounded-[var(--radius-md)] px-2 text-xs font-medium text-text-secondary transition-colors hover:bg-background lg:flex">
              <CreditCard aria-hidden="true" className="size-4" />
              {credits} {credits === 1 ? "credit" : "credits"}
            </Link>
            <Link href="/planner/notifications" className="relative flex size-10 items-center justify-center rounded-[var(--radius-md)] text-text-secondary transition-colors hover:bg-background" aria-label="Notifications">
              <Bell aria-hidden="true" className="size-[18px]" />
              <span className="absolute top-2.5 right-2.5 size-1.5 rounded-full bg-error ring-2 ring-white" />
            </Link>
            <WorkspaceSwitcher role={role} />
            <Link href="/planner/profile" aria-label="Amaka Okafor, view your profile" className="ml-1 flex size-9 shrink-0 items-center justify-center rounded-full bg-[#e3ebe5] text-xs font-semibold text-brand-primary ring-2 ring-white transition-shadow hover:ring-border-default">
              AO
            </Link>
          </div>
        </header>

        <main className="min-h-[calc(100vh-64px)] min-w-0 px-4 py-6 pb-[calc(6rem+env(safe-area-inset-bottom))] sm:px-6 lg:px-10 lg:py-8">{children}</main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 grid min-h-16 grid-cols-4 border-t border-border-subtle bg-white/95 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden" aria-label="Mobile planner navigation">
        {(role === "planner" ? mobileNav : [{ label: "Overview", href: home, icon: LayoutDashboard }, { label: "Profile", href: "/planner/profile", icon: ContactRound }]).map((item) => {
          const Icon = item.icon;
          const active = isActive(pathname, item.href);
          return (
            <Link key={item.href} href={item.href} className={cn("flex min-h-16 flex-col items-center justify-center gap-1 text-[0.625rem] font-medium", active ? "text-brand-primary" : "text-text-tertiary")}>
              <Icon aria-hidden="true" className="size-5" strokeWidth={active ? 2.2 : 1.8} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
