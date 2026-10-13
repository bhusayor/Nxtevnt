"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  BriefcaseBusiness,
  CalendarCheck,
  CalendarDays,
  ClipboardCheck,
  ContactRound,
  CreditCard,
  FileStack,
  LayoutDashboard,
  Wallet,
  X,
  Settings2,
  UsersRound,
} from "@/components/ui/icons";

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
      { label: "Payment", href: "/planner/budget", icon: Wallet },
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

function isActive(pathname: string, href: string) {
  return href === "/planner" ? pathname === href : pathname.startsWith(href);
}

export function PlannerShell({ children, role = "planner" }: { children: ReactNode; role?: WorkspaceRole }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
                        <Icon aria-hidden="true" className={cn("size-5 shrink-0", active && "text-brand-primary")} weight={active ? "bold" : "regular"} />
                        <span className="flex-1">{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )) : <Link href={home} className="flex h-10 items-center gap-3 rounded-[var(--radius-md)] bg-surface-selected px-3 text-sm font-semibold text-brand-primary"><LayoutDashboard className="size-5" weight="bold" aria-hidden="true" />Overview</Link>}
          </div>
        </nav>

        <Link href="/planner/profile" className="mx-4 mb-5 flex items-center gap-3 border-t border-border-subtle pt-5 text-left">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#e3ebe5] text-xs font-bold text-brand-primary ring-2 ring-white">AO</span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold text-text-primary">Amaka Okafor</span>
            <span className="block truncate text-xs text-text-tertiary">Personal account</span>
          </span>
          <Settings2 aria-hidden="true" className="size-[18px] text-text-secondary" weight="regular" />
        </Link>
      </aside>

      <div className="lg:pl-60">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-border-subtle bg-white/95 px-4 backdrop-blur sm:px-6 lg:px-10">
          <div className="flex items-center gap-3">
            <Dialog.Root open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <Dialog.Trigger asChild><button type="button" className="flex size-10 items-center justify-center rounded-lg border border-border-subtle bg-white text-brand-primary transition-colors hover:bg-surface-selected focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary lg:hidden" aria-label="Open dashboard navigation"><LayoutDashboard aria-hidden="true" className="size-[22px]" weight="bold" /></button></Dialog.Trigger>
              <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 z-50 bg-[#17251d]/55 data-[state=open]:animate-in data-[state=closed]:animate-out lg:hidden" />
                <Dialog.Content className="fixed inset-y-0 left-0 z-50 flex w-[min(19rem,85vw)] flex-col overflow-hidden rounded-r-2xl bg-white shadow-2xl focus:outline-none lg:hidden" aria-describedby="mobile-navigation-description">
                  <Dialog.Title className="sr-only">Dashboard navigation</Dialog.Title><Dialog.Description id="mobile-navigation-description" className="sr-only">Navigate your Nxtevnt workspace.</Dialog.Description>
                  <div className="flex items-center justify-between gap-2 p-3"><Link href={home} onClick={() => setMobileMenuOpen(false)} className="flex h-12 flex-1 items-center gap-2 rounded-xl border border-border-subtle px-3" aria-label="Nxtevnt home"><BrandMark size="sm" /><span className="text-sm font-bold tracking-[-0.02em] text-text-primary">NXTEVNT</span></Link><Dialog.Close asChild><button type="button" aria-label="Close dashboard navigation" className="flex size-10 shrink-0 items-center justify-center rounded-lg text-text-secondary hover:bg-background-subtle"><X className="size-5" weight="bold" aria-hidden="true" /></button></Dialog.Close></div>
                  <nav className="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 py-4" aria-label="Mobile workspace navigation">
                    {role === "planner" ? navGroups.map((group) => (
                      <div key={group.label}>
                        <p className="mb-2 px-3 text-[0.625rem] font-bold uppercase tracking-[0.12em] text-text-tertiary">{group.label}</p>
                        <div className="space-y-1">
                          {group.items.map((item) => {
                            const Icon = item.icon;
                            const active = isActive(pathname, item.href);
                            return <Link key={item.href} href={item.href} onClick={() => setMobileMenuOpen(false)} aria-current={active ? "page" : undefined} className={cn("flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm transition-colors", active ? "bg-[#e7e9ee] font-semibold text-[#172b42]" : "text-text-secondary hover:bg-background-subtle hover:text-text-primary")}><Icon className="size-5 shrink-0" weight={active ? "bold" : "regular"} aria-hidden="true" /><span>{item.label}</span></Link>;
                          })}
                        </div>
                      </div>
                    )) : <Link href={home} onClick={() => setMobileMenuOpen(false)} className="flex min-h-11 items-center gap-3 rounded-lg bg-[#e7e9ee] px-3 text-sm font-semibold text-[#172b42]"><LayoutDashboard className="size-5" weight="bold" aria-hidden="true" />Overview</Link>}
                  </nav>
                  <div className="space-y-1 border-t border-border-subtle px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
                    {role === "planner" && <Link href="/planner/credits" onClick={() => setMobileMenuOpen(false)} aria-current={pathname === "/planner/credits" ? "page" : undefined} className="mb-3 flex min-h-12 items-center gap-3 rounded-xl border border-[#dce8dd] bg-[#f1f6f2] px-3 text-sm font-semibold text-brand-primary transition-colors hover:bg-[#e7f0e9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"><CreditCard className="size-5 shrink-0" weight="bold" aria-hidden="true" /><span className="flex-1">Credits</span><span className="rounded-full bg-white px-2.5 py-1 text-xs tabular-nums text-brand-primary">{credits} available</span></Link>}
                    <Link href="/planner/profile" onClick={() => setMobileMenuOpen(false)} className="flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm text-text-secondary hover:bg-background-subtle"><Settings2 className="size-5" weight="regular" aria-hidden="true" />Settings</Link>
                    <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm text-error hover:bg-error-soft"><X className="size-5" weight="regular" aria-hidden="true" />Back to sign in</Link>
                  </div>
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog.Root>
            <div className="hidden items-center gap-2 text-xs lg:flex">
              <span className="text-text-tertiary">{roleLabel} workspace</span>
              <span className="text-border-strong">/</span>
              <span className="font-medium capitalize text-text-primary">{sectionLabel}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/planner/credits" aria-label={`View credits, ${credits} available`} className="mr-1 hidden h-10 items-center gap-2 rounded-lg border border-transparent px-3 text-[0.8125rem] font-semibold text-text-primary transition-colors hover:border-border-subtle hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary lg:flex">
              <CreditCard aria-hidden="true" className="size-[18px] text-brand-primary" weight="bold" />
              {credits} {credits === 1 ? "credit" : "credits"}
            </Link>
            <Link href="/planner/notifications" className="relative flex size-10 items-center justify-center rounded-[var(--radius-md)] text-text-secondary transition-colors hover:bg-background" aria-label="Notifications">
              <Bell aria-hidden="true" className="size-5" weight="regular" />
              <span className="absolute top-2.5 right-2.5 size-1.5 rounded-full bg-error ring-2 ring-white" />
            </Link>
            <WorkspaceSwitcher role={role} />
            <Link href="/planner/profile" aria-label="Amaka Okafor, view your profile" className="ml-1 flex size-9 shrink-0 items-center justify-center rounded-full bg-[#e3ebe5] text-xs font-semibold text-brand-primary ring-2 ring-white transition-shadow hover:ring-border-default">
              AO
            </Link>
          </div>
        </header>

        <main className="min-h-[calc(100vh-64px)] min-w-0 px-4 py-6 pb-[max(2rem,env(safe-area-inset-bottom))] sm:px-6 lg:px-10 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
