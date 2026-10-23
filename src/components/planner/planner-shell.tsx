"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
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
import { addGuestMilestoneToExistingEvents } from "@/lib/planner-events";
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
  const creditLabel = credits.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const pathname = usePathname();
  const home = role === "planner" ? "/planner" : `/${role}`;
  const roleLabel = role[0].toUpperCase() + role.slice(1);
  const sectionLabel = pathname === home ? "Overview" : pathname.startsWith("/planner/events/") ? "Event workspace" : pathname.split("/").at(-1)!.replaceAll("-", " ");

  useEffect(() => {
    if (role === "planner") addGuestMilestoneToExistingEvents();
  }, [role]);

  return (
    <div className="app-canvas min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-border-subtle bg-surface lg:flex">
        <Link href={home} className="flex h-16 items-center gap-2 border-b border-border-subtle px-5" aria-label="NXTEVNT home">
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
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-2 px-3 sm:gap-3 sm:px-6 lg:px-10">
          <div className="flex min-w-0 items-center gap-3">
            <Dialog.Root open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <Dialog.Trigger asChild><button type="button" className="flex size-10 shrink-0 items-center justify-center rounded-full border border-white/80 bg-white/75 text-brand-primary shadow-sm backdrop-blur-xl transition-colors hover:bg-surface-selected focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary lg:hidden" aria-label="Open dashboard navigation"><LayoutDashboard aria-hidden="true" className="size-[22px]" weight="bold" /></button></Dialog.Trigger>
              <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 z-50 bg-[#17251d]/55 data-[state=open]:animate-in data-[state=closed]:animate-out lg:hidden" />
                <Dialog.Content className="fixed inset-y-0 left-0 z-50 flex w-[min(19rem,85vw)] flex-col overflow-hidden rounded-r-2xl bg-white shadow-2xl focus:outline-none lg:hidden" aria-describedby="mobile-navigation-description">
                  <Dialog.Title className="sr-only">Dashboard navigation</Dialog.Title><Dialog.Description id="mobile-navigation-description" className="sr-only">Navigate your NXTEVNT workspace.</Dialog.Description>
                  <div className="flex items-center justify-between gap-2 p-3"><Link href={home} onClick={() => setMobileMenuOpen(false)} className="flex h-12 flex-1 items-center gap-2 rounded-xl border border-border-subtle px-3" aria-label="NXTEVNT home"><BrandMark size="sm" /><span className="text-sm font-bold tracking-[-0.02em] text-text-primary">NXTEVNT</span></Link><Dialog.Close asChild><button type="button" aria-label="Close dashboard navigation" className="flex size-10 shrink-0 items-center justify-center rounded-lg text-text-secondary hover:bg-background-subtle"><X className="size-5" weight="bold" aria-hidden="true" /></button></Dialog.Close></div>
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
                    {role === "planner" && <Link href="/planner/credits" onClick={() => setMobileMenuOpen(false)} aria-current={pathname === "/planner/credits" ? "page" : undefined} className="mb-3 flex min-h-12 items-center gap-3 rounded-xl border border-[#eedec6] bg-[#fdf8ef] px-3 text-sm font-semibold text-[var(--credit-gold)] transition-colors hover:bg-[#faf0df] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"><Wallet className="size-5 shrink-0" weight="regular" aria-hidden="true" /><span className="flex-1">Credits</span><span className="rounded-full bg-white px-2.5 py-1 text-xs tabular-nums">{creditLabel} available</span></Link>}
                    <Link href="/planner/profile" onClick={() => setMobileMenuOpen(false)} className="flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm text-text-secondary hover:bg-background-subtle"><Settings2 className="size-5" weight="regular" aria-hidden="true" />Settings</Link>
                    <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm text-error hover:bg-error-soft"><X className="size-5" weight="regular" aria-hidden="true" />Back to sign in</Link>
                  </div>
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog.Root>
            <div className="hidden min-w-0 items-center gap-2 text-xs lg:flex">
              <span className="shrink-0 text-text-tertiary">{roleLabel} workspace</span>
              <span className="text-border-strong">/</span>
              <span className="truncate font-medium capitalize text-text-primary">{sectionLabel}</span>
            </div>
          </div>

          <div data-workspace-header-pill className="ml-auto flex shrink-0 items-center gap-1 rounded-full border border-white/80 bg-white/75 p-1 shadow-[0_2px_8px_rgba(31,42,35,.08),inset_0_1px_0_rgba(255,255,255,.9)] backdrop-blur-xl backdrop-saturate-150 sm:gap-2 sm:p-1.5">
            <Link href="/planner/credits" aria-label={`View credits, ${creditLabel} available`} title={`${creditLabel} credits available`} className="flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-white/90 bg-white/85 px-2.5 text-xs font-semibold tabular-nums text-[var(--credit-gold)] shadow-sm transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--credit-gold)] sm:h-10 sm:gap-2 sm:px-4 sm:text-sm">
              <Wallet aria-hidden="true" className="size-4 shrink-0 sm:size-[18px]" weight="regular" />
              <span>{creditLabel}</span>
            </Link>
            <WorkspaceSwitcher role={role} />
            <Link href="/planner/notifications" className="relative flex size-9 shrink-0 items-center justify-center rounded-full border border-white/90 bg-white/85 text-text-secondary shadow-sm transition-colors hover:bg-white sm:size-10" aria-label="Notifications">
              <Bell aria-hidden="true" className="size-5" weight="regular" />
              <span className="absolute right-1 top-1 size-1.5 rounded-full bg-error ring-2 ring-white" />
            </Link>
            <Link href="/planner/profile" aria-label="Amaka Okafor, view your profile" className="flex size-9 shrink-0 items-center justify-center rounded-full border-2 border-white bg-[#8299a2] text-xs font-semibold text-[#10242c] shadow-sm transition-shadow hover:ring-2 hover:ring-border-default sm:size-10">
              AO
            </Link>
          </div>
        </header>

        <main className="min-h-[calc(100vh-64px)] min-w-0 px-4 py-6 pb-[max(2rem,env(safe-area-inset-bottom))] sm:px-6 lg:px-10 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
