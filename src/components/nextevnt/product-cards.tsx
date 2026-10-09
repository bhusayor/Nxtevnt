import type { ReactNode } from "react";
import {
  ArrowRight,
  CalendarDays,
  Clock3,
  CreditCard,
  MapPin,
  MessageCircleReply,
  MoreHorizontal,
  Star,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CardMedia } from "@/components/ui/card-media";
import { IconButton } from "@/components/ui/icon-button";
import { StatusBadge } from "@/components/ui/status-badge";
import { VerificationBadge } from "@/components/ui/verification-badge";
import { cn } from "@/lib/utils/cn";

export function EventCard({ image = "/images/design-system/event-garden-reception.png", missingImage }: { image?: string; missingImage?: boolean }) {
  return (
    <article className="overflow-hidden rounded-[var(--radius-lg)] border border-border-default bg-surface">
      <CardMedia src={missingImage ? undefined : image} alt="Garden wedding reception at sunset" aspect="landscape" className="border-b border-border-subtle" />
      <div className="p-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2"><StatusBadge status="upcoming" showDot={false} /><span className="text-xs text-text-tertiary">Wedding</span></div>
          <IconButton aria-label="Event actions" variant="ghost" size="sm" icon={<MoreHorizontal className="size-4" />} />
        </div>
        <div className="flex flex-wrap items-center gap-2"><h3 className="text-[1.0625rem] font-semibold tracking-[-0.015em] text-text-primary">Ada & Chidi’s Celebration</h3><VerificationBadge label="Verified event" /></div>
        <div className="mt-3 grid gap-2 text-[0.8125rem] text-text-secondary">
          <span className="flex items-center gap-2"><CalendarDays aria-hidden="true" className="size-4 text-text-tertiary" />Friday, 18 December 2026</span>
          <span className="flex items-center gap-2"><MapPin aria-hidden="true" className="size-4 text-text-tertiary" />The Garden, Victoria Island</span>
          <span className="flex items-center gap-2"><Users aria-hidden="true" className="size-4 text-text-tertiary" />Ada Okafor</span>
        </div>
        <div className="mt-4 border-t border-border-subtle pt-4">
          <div className="mb-2 flex items-center justify-between text-xs"><span className="text-text-secondary">Planning progress</span><span className="font-semibold tabular-nums text-text-primary">68%</span></div>
          <div className="h-1 overflow-hidden rounded-full bg-background-subtle"><div className="h-full w-[68%] rounded-full bg-brand-primary" /></div>
        </div>
        <div className="mt-4 flex items-center justify-between gap-3">
          <p className="min-w-0 truncate text-xs text-text-secondary"><strong className="font-semibold text-text-primary">Next:</strong> Confirm venue payment</p>
          <Button variant="ghost" size="sm" className="-mr-2" trailingIcon={<ArrowRight className="size-3.5" />}>Open</Button>
        </div>
      </div>
    </article>
  );
}

export function VendorCard() {
  return (
    <article className="overflow-hidden rounded-[var(--radius-lg)] border border-border-default bg-surface">
      <CardMedia src="/images/design-system/vendor-floral-studio.png" alt="Floral designer arranging an event centerpiece" aspect="landscape" className="border-b border-border-subtle" />
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div><div className="flex flex-wrap items-center gap-2"><h3 className="text-[1.0625rem] font-semibold tracking-[-0.015em] text-text-primary">Maison Bloom</h3><VerificationBadge label="Verified vendor" /></div><p className="mt-1 text-[0.8125rem] text-text-secondary">Floral design & styling</p></div>
          <IconButton aria-label="Vendor actions" variant="ghost" size="sm" icon={<MoreHorizontal className="size-4" />} />
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-text-secondary">
          <span className="flex items-center gap-1.5"><MapPin aria-hidden="true" className="size-3.5 text-text-tertiary" />Victoria Island</span>
          <span className="flex items-center gap-1.5"><Star aria-hidden="true" className="size-3.5 fill-[#b8802e] text-[#b8802e]" /><strong className="font-semibold text-text-primary">4.9</strong> (42)</span>
        </div>
        <div className="mt-4 grid grid-cols-2 border-y border-border-subtle py-3 text-xs">
          <div><p className="text-text-tertiary">Typical pricing</p><p className="mt-1 font-semibold text-text-primary">From ₦650,000</p></div>
          <div className="border-l border-border-subtle pl-4"><p className="text-text-tertiary">Availability</p><p className="mt-1 font-semibold text-success">Available 18 Dec</p></div>
        </div>
        <div className="mt-4 flex items-center justify-between gap-2"><Button variant="ghost" size="sm" className="-ml-2">View profile</Button><Button variant="outline" size="sm">Request quote</Button></div>
      </div>
    </article>
  );
}

export function TemplateCard({ missingImage }: { missingImage?: boolean }) {
  return (
    <article className="flex gap-4 rounded-[var(--radius-lg)] border border-border-default bg-surface p-3">
      <CardMedia src={missingImage ? undefined : "/images/design-system/template-agenda.png"} alt="Elegant event agenda template preview" aspect="landscape" className="w-32 shrink-0 rounded-[var(--radius-md)] sm:w-40" />
      <div className="flex min-w-0 flex-1 flex-col py-1">
        <div className="flex items-start justify-between gap-2"><p className="type-caption text-text-tertiary">Run of show</p><IconButton aria-label="Template actions" variant="ghost" size="sm" className="-mt-1 -mr-1" icon={<MoreHorizontal className="size-4" />} /></div>
        <h3 className="mt-1 text-sm font-semibold leading-snug text-text-primary">Classic Wedding Agenda</h3>
        <p className="mt-2 text-xs text-text-secondary">12 items · Updated 3 days ago</p>
        <Button variant="ghost" size="sm" className="mt-auto w-fit -ml-2">Use template</Button>
      </div>
    </article>
  );
}

export function PlannerProfileCard() {
  return (
    <article className="overflow-hidden rounded-[var(--radius-lg)] border border-border-default bg-surface">
      <CardMedia src="/images/design-system/event-garden-reception.png" alt="Signature event by Amaka Events" className="aspect-[3/1]" imageClassName="object-[center_62%]" />
      <div className="flex items-start gap-4 p-5"><span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-brand-secondary text-sm font-bold text-brand-primary">AE</span><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><h3 className="font-semibold text-text-primary">Amaka Events</h3><VerificationBadge label="Verified planner" /></div><p className="mt-1 flex items-center gap-1.5 text-xs text-text-secondary"><MapPin aria-hidden="true" className="size-3.5" />Lagos, Nigeria</p><div className="mt-3 flex flex-wrap gap-1.5"><Badge>Weddings</Badge><Badge>Corporate</Badge></div></div><Button variant="outline" size="sm">Edit</Button></div>
    </article>
  );
}

const dashboardActions = [
  { label: "Overdue tasks", value: "5", context: "2 due today", icon: Clock3, tone: "text-[var(--status-rose-text)] bg-[var(--status-rose-bg)]" },
  { label: "Payments due", value: "3", context: "₦1.2m this week", icon: CreditCard, tone: "text-[var(--status-amber-text)] bg-[var(--status-amber-bg)]" },
  { label: "Vendor replies", value: "8", context: "4 unread", icon: MessageCircleReply, tone: "text-[var(--status-blue-text)] bg-[var(--status-blue-bg)]" },
];

export function DashboardActionCard({ index = 0 }: { index?: number }) {
  const action = dashboardActions[index] ?? dashboardActions[0];
  const ActionIcon = action.icon;
  return <button type="button" className="group flex min-h-24 w-full items-start gap-3 rounded-[var(--radius-md)] border border-border-default bg-surface p-4 text-left transition-colors hover:border-border-strong hover:bg-surface-subtle"><span className={cn("flex size-8 shrink-0 items-center justify-center rounded-[var(--radius-md)]", action.tone)}><ActionIcon aria-hidden="true" className="size-4" /></span><span className="min-w-0 flex-1"><span className="flex items-start justify-between gap-3"><span className="text-sm font-medium text-text-secondary">{action.label}</span><strong className="text-xl font-semibold tabular-nums text-text-primary">{action.value}</strong></span><span className="mt-2 block text-xs text-text-tertiary">{action.context}</span></span></button>;
}

const metrics = [
  { label: "Budget", value: "₦8.2m", context: "Approved" },
  { label: "Spent", value: "₦3.1m", context: "38% of budget" },
  { label: "Committed", value: "₦1.4m", context: "4 outstanding" },
  { label: "Remaining", value: "₦3.7m", context: "Available" },
];

export function SummaryMetricGroup() {
  return <div className="overflow-hidden rounded-[var(--radius-lg)] border border-border-default bg-surface"><div className="flex items-center justify-between border-b border-border-subtle px-5 py-3.5"><div><h3 className="text-sm font-semibold text-text-primary">Event budget</h3><p className="mt-0.5 text-xs text-text-tertiary">Ada & Chidi’s Celebration</p></div><Button variant="ghost" size="sm">View budget</Button></div><div className="grid sm:grid-cols-2 lg:grid-cols-4">{metrics.map((metric, index) => <div key={metric.label} className={cn("px-5 py-4", index > 0 && "border-t border-border-subtle sm:border-l", index === 2 && "sm:border-l-0 lg:border-l", index > 1 && "lg:border-t-0")}><p className="text-xs font-medium text-text-tertiary">{metric.label}</p><p className="mt-1.5 text-xl font-semibold tracking-[-0.02em] tabular-nums text-text-primary">{metric.value}</p><p className="mt-1 text-xs text-text-tertiary">{metric.context}</p></div>)}</div></div>;
}

export function MetricCard({ label, value, change, positive = true }: { label: string; value: string; change?: string; positive?: boolean }) {
  return <div className="border-l border-border-subtle px-4"><p className="text-xs font-medium text-text-tertiary">{label}</p><p className="mt-1 text-xl font-semibold tracking-tight text-text-primary">{value}</p>{change ? <p className={cn("mt-1 text-xs", positive ? "text-success" : "text-error")}>{change}</p> : null}</div>;
}

export function ProductCardSection({ children }: { children: ReactNode }) {
  return <div className="grid gap-4">{children}</div>;
}
