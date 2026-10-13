import type { ComponentType, ReactNode, SVGProps } from "react";
import {
  Bell,
  CalendarDays,
  CheckSquare2,
  ChevronDown,
  CircleDollarSign,
  FileStack,
  LayoutDashboard,
  Menu,
  Plus,
  Settings,
  Store,
  Users,
  UsersRound,
  WalletCards,
} from "@/components/ui/icons";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Divider } from "@/components/ui/divider";
import { IconButton } from "@/components/ui/icon-button";
import { BrandMark } from "@/components/nextevnt/brand-logo";
import { cn } from "@/lib/utils/cn";

type Icon = ComponentType<SVGProps<SVGSVGElement>>;

const navGroups = [
  { label: "Workspace", items: [["Overview", LayoutDashboard], ["Events", CalendarDays], ["Budget", WalletCards], ["Tasks", CheckSquare2]] as [string, Icon][] },
  { label: "Relationships", items: [["Vendors", Store], ["Clients", Users]] as [string, Icon][] },
  { label: "Operations", items: [["Availability", CalendarDays], ["Templates", FileStack], ["Team", UsersRound]] as [string, Icon][] },
];

export function DesktopSidebar({ collapsed = false, previewHover = false }: { collapsed?: boolean; previewHover?: boolean }) {
  return (
    <aside className={cn("flex h-[37rem] flex-col border border-border-default bg-surface py-3", collapsed ? "w-16" : "w-60")}>
      <div className={cn("mb-4 flex h-10 items-center gap-3 px-4", collapsed && "justify-center px-0")}><BrandMark />{!collapsed ? <div><p className="text-sm font-semibold leading-tight text-text-primary">Nxtevnt</p><p className="mt-0.5 text-[0.625rem] text-text-tertiary">Planner workspace</p></div> : null}</div>
      <nav className="grid flex-1 content-start gap-4 px-2" aria-label="Planner navigation">
        {navGroups.map((group) => <div key={group.label} className="grid gap-0.5">{!collapsed ? <p className="px-2 py-1.5 text-[0.625rem] font-semibold tracking-[0.08em] text-text-tertiary uppercase">{group.label}</p> : <Divider className="my-1" />}{group.items.map(([label, NavIcon]) => {
          const active = label === "Events";
          const hoverPreview = previewHover && label === "Overview";
          return <a key={label} href="#navigation" aria-label={collapsed ? label : undefined} className={cn("relative flex h-9 items-center gap-2.5 rounded-[var(--radius-md)] px-2.5 text-[0.8125rem] font-medium text-text-secondary transition-colors duration-150 hover:bg-background-subtle hover:text-text-primary", active && "bg-surface-selected font-semibold text-brand-primary before:absolute before:top-1.5 before:bottom-1.5 before:left-0 before:w-0.5 before:rounded-full before:bg-brand-primary", hoverPreview && "bg-background-subtle text-text-primary", collapsed && "justify-center px-0")}><NavIcon aria-hidden="true" className={cn("size-[1.125rem] shrink-0", active && "text-brand-primary")} />{!collapsed ? <span>{label}</span> : null}{hoverPreview && !collapsed ? <span className="ml-auto text-[0.625rem] font-normal text-text-tertiary">Hover</span> : null}</a>;
        })}</div>)}
      </nav>
      <div className="mx-2 border-t border-border-subtle pt-2">
        <button type="button" className={cn("flex w-full items-center gap-2.5 rounded-[var(--radius-md)] p-2 text-left transition-colors duration-150 hover:bg-background-subtle", collapsed && "justify-center")}><span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-secondary text-[0.6875rem] font-bold text-brand-primary">AO</span>{!collapsed ? <span className="min-w-0 flex-1"><span className="block truncate text-xs font-semibold text-text-primary">Amaka Okafor</span><span className="mt-0.5 block truncate text-[0.625rem] text-text-tertiary">Workspace owner</span></span> : null}{!collapsed ? <ChevronDown aria-hidden="true" className="size-3.5 text-text-tertiary" /> : null}</button>
      </div>
    </aside>
  );
}

export function TopNavigation() {
  return (
    <header className="flex h-15 items-center gap-3 border border-border-default bg-surface px-4">
      <IconButton aria-label="Open navigation" variant="ghost" size="sm" className="lg:hidden" icon={<Menu className="size-4" />} />
      <div className="hidden min-w-0 items-center gap-2 text-sm sm:flex"><span className="text-text-tertiary">Events</span><span className="text-border-strong">/</span><span className="truncate font-medium text-text-primary">All events</span></div>
      <div className="ml-auto flex items-center gap-1.5">
        <div className="hidden items-center -space-x-1.5 lg:flex" aria-label="3 team members"><span className="flex size-7 items-center justify-center rounded-full border-2 border-surface bg-[#d9e8e1] text-[0.5625rem] font-semibold text-brand-primary">AO</span><span className="flex size-7 items-center justify-center rounded-full border-2 border-surface bg-[#ece4f3] text-[0.5625rem] font-semibold text-[#66527f]">MB</span><span className="flex size-7 items-center justify-center rounded-full border-2 border-surface bg-[#e8edf0] text-[0.5625rem] font-semibold text-[#546875]">+2</span></div>
        <span className="mx-1 hidden h-5 w-px bg-border-subtle lg:block" />
        <Button size="sm" variant="outline" leadingIcon={<CircleDollarSign className="size-4" />}>24 credits</Button>
        <span className="relative"><IconButton aria-label="Notifications, 3 unread" variant="ghost" size="sm" icon={<Bell className="size-4" />} /><span className="absolute top-1 right-1 size-1.5 rounded-full bg-error ring-2 ring-surface" /></span>
        <button type="button" aria-label="Open planner account" className="flex h-9 items-center gap-2 rounded-[var(--radius-md)] px-1.5 transition-colors hover:bg-background-subtle"><span className="flex size-7 items-center justify-center rounded-full bg-brand-primary text-[0.625rem] font-bold text-text-inverse">AO</span><ChevronDown aria-hidden="true" className="hidden size-3.5 text-text-tertiary sm:block" /></button>
        <Button size="sm" className="ml-1 hidden sm:inline-flex" leadingIcon={<Plus className="size-4" />}>Create event</Button>
      </div>
    </header>
  );
}

export function MobileBottomNavigation() {
  const items: [string, Icon][] = [["Overview", LayoutDashboard], ["Events", CalendarDays], ["Tasks", CheckSquare2], ["More", Menu]];
  return <nav className="grid grid-cols-4 border border-border-default bg-surface px-2 py-1.5 shadow-[var(--shadow-md)]" aria-label="Mobile navigation">{items.map(([label, NavIcon]) => <a key={label} href="#navigation" className={cn("relative flex h-12 flex-col items-center justify-center gap-1 rounded-[var(--radius-md)] px-2 text-[0.625rem] font-medium text-text-tertiary", label === "Events" && "text-brand-primary before:absolute before:top-0 before:h-0.5 before:w-5 before:rounded-full before:bg-brand-primary")}><NavIcon aria-hidden="true" className="size-[1.125rem]" />{label}</a>)}</nav>;
}

export function Breadcrumbs({ items }: { items: string[] }) {
  return <nav aria-label="Breadcrumb"><ol className="flex flex-wrap items-center gap-2 text-xs text-text-tertiary">{items.map((item, index) => <li key={item} className="flex items-center gap-2">{index > 0 ? <span aria-hidden="true">/</span> : null}<a href="#navigation" aria-current={index === items.length - 1 ? "page" : undefined} className={cn("rounded-[var(--radius-xs)] hover:text-text-primary", index === items.length - 1 && "font-medium text-text-secondary")}>{item}</a></li>)}</ol></nav>;
}

export function Tabs({ items, active }: { items: string[]; active: string }) {
  return <div className="overflow-x-auto border-b border-border-subtle"><div role="tablist" className="flex min-w-max gap-6">{items.map((item) => <button key={item} type="button" role="tab" aria-selected={item === active} className={cn("relative pb-2.5 text-[0.8125rem] font-medium text-text-tertiary hover:text-text-primary", item === active && "font-semibold text-brand-primary after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-brand-primary")}>{item}</button>)}</div></div>;
}

export function PageHeader({ title, description, breadcrumbs, primaryAction, secondaryActions }: { title: string; description?: string; breadcrumbs?: string[]; primaryAction?: ReactNode; secondaryActions?: ReactNode }) {
  return <div className="grid gap-4 sm:flex sm:items-end sm:justify-between"><div className="grid gap-1.5">{breadcrumbs ? <Breadcrumbs items={breadcrumbs} /> : null}<h1 className="text-[1.625rem] font-semibold leading-tight tracking-[-0.025em] text-text-primary">{title}</h1>{description ? <p className="text-sm text-text-secondary">{description}</p> : null}</div>{primaryAction || secondaryActions ? <div className="flex flex-wrap items-center gap-2">{secondaryActions}{primaryAction}</div> : null}</div>;
}

export function SettingsSubNavigation() {
  const items = ["Account", "Business", "Booking preferences", "Notifications", "Security", "Billing", "Verification"];
  return <nav aria-label="Settings"><ul className="grid gap-0.5 sm:grid-cols-2 lg:grid-cols-1">{items.map((item) => <li key={item}><a href="#navigation" className={cn("flex h-9 items-center gap-2 rounded-[var(--radius-md)] px-2.5 text-[0.8125rem] font-medium text-text-secondary hover:bg-background-subtle hover:text-text-primary", item === "Business" && "bg-surface-selected font-semibold text-brand-primary")}><Settings aria-hidden="true" className="size-4" />{item}{item === "Verification" ? <Badge tone="warning" className="ml-auto">Action</Badge> : null}</a></li>)}</ul></nav>;
}
