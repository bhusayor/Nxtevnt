import type { ReactNode } from "react";
import { CalendarPlus, Check, CircleAlert, CloudOff, FileClock, Info, SearchX, TriangleAlert, X } from "@/components/ui/icons";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

type FeedbackTone = "success" | "warning" | "error" | "info";

const toneConfig = {
  success: { icon: Check, iconStyles: "bg-success-soft text-success", accent: "bg-success" },
  warning: { icon: TriangleAlert, iconStyles: "bg-warning-soft text-warning", accent: "bg-warning" },
  error: { icon: CircleAlert, iconStyles: "bg-error-soft text-error", accent: "bg-error" },
  info: { icon: Info, iconStyles: "bg-info-soft text-info", accent: "bg-info" },
};

export function Toast({ tone = "info", title, children, action, meta, dismissible = true }: { tone?: FeedbackTone; title: string; children?: ReactNode; action?: ReactNode; meta?: string; dismissible?: boolean }) {
  const config = toneConfig[tone];
  const Icon = config.icon;
  return (
    <div role={tone === "error" ? "alert" : "status"} className="relative flex w-full max-w-md items-start gap-3 overflow-hidden rounded-[var(--radius-lg)] border border-border-default bg-surface px-4 py-3.5 text-text-primary shadow-[var(--shadow-lg)]">
      <span aria-hidden="true" className={cn("absolute inset-y-0 left-0 w-[3px]", config.accent)} />
      <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-[var(--radius-md)]", config.iconStyles)}><Icon aria-hidden="true" className="size-4" /></span>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3"><p className="text-[0.8125rem] font-semibold leading-5 text-text-primary">{title}</p>{meta ? <span className="shrink-0 text-[0.6875rem] text-text-tertiary">{meta}</span> : null}</div>
        {children ? <div className="mt-0.5 text-xs leading-5 text-text-secondary">{children}</div> : null}
        {action ? <div className="mt-2 -ml-2">{action}</div> : null}
      </div>
      {dismissible ? <button type="button" aria-label="Dismiss notification" className="-mt-1 -mr-1 flex size-7 shrink-0 items-center justify-center rounded-[var(--radius-md)] text-text-tertiary transition-colors hover:bg-background-subtle hover:text-text-primary"><X aria-hidden="true" className="size-3.5" /></button> : null}
    </div>
  );
}

export function InlineFeedback({ tone = "info", children }: { tone?: FeedbackTone; children: ReactNode }) {
  const config = toneConfig[tone];
  const Icon = config.icon;
  return <p role={tone === "error" ? "alert" : "status"} className={cn("flex items-center gap-2 text-xs font-medium", tone === "success" && "text-success", tone === "warning" && "text-warning", tone === "error" && "text-error", tone === "info" && "text-info")}><Icon aria-hidden="true" className="size-3.5 shrink-0" />{children}</p>;
}

type StatePanelProps = {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
  compact?: boolean;
};

export function StatePanel({ icon, title, description, action, compact }: StatePanelProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center rounded-[var(--radius-lg)] border border-dashed border-border-default bg-surface-subtle px-6 text-center", compact ? "min-h-52 py-7" : "min-h-72 py-10")}>
      <span className="mb-4 flex size-11 items-center justify-center rounded-full bg-surface-selected text-brand-primary">{icon ?? <Info aria-hidden="true" className="size-5" />}</span>
      <h3 className="type-heading-4 text-text-primary">{title}</h3>
      <p className="type-body-small mt-1.5 max-w-sm text-text-secondary">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function EmptyState({ filtered = false }: { filtered?: boolean }) {
  return <StatePanel compact icon={filtered ? <SearchX aria-hidden="true" className="size-5" /> : <CalendarPlus aria-hidden="true" className="size-5" />} title={filtered ? "No results match these filters" : "No events yet"} description={filtered ? "Try adjusting or clearing your filters to see more events." : "Your events will appear here once you start planning."} action={<Button size="sm" variant={filtered ? "outline" : "primary"}>{filtered ? "Clear filters" : "Create your first event"}</Button>} />;
}

export function ErrorState() {
  return <StatePanel compact icon={<CircleAlert aria-hidden="true" className="size-5" />} title="Could not load your events" description="Something went wrong while loading this information." action={<Button size="sm" variant="outline">Try again</Button>} />;
}

export function SuccessState() {
  return <StatePanel compact icon={<Check aria-hidden="true" className="size-5" />} title="Everything is up to date" description="Your latest changes have been saved successfully." action={<Button size="sm" variant="outline">Continue</Button>} />;
}

export function OfflineState() {
  return <StatePanel compact icon={<CloudOff aria-hidden="true" className="size-5" />} title="You’re offline" description="Changes will sync when your connection returns." action={<Button size="sm" variant="outline">Retry connection</Button>} />;
}

export function DraftRestoredMessage() {
  return (
    <div className="flex flex-col gap-3 rounded-[var(--radius-md)] border border-info/20 bg-info-soft px-4 py-3 text-info sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3"><FileClock aria-hidden="true" className="mt-0.5 size-4.5 shrink-0" /><div><p className="type-label-large">Draft restored</p><p className="type-body-small opacity-85">We restored the event details you entered 12 minutes ago.</p></div></div>
      <Button size="sm" variant="ghost" className="self-start text-info hover:bg-info/10">Dismiss</Button>
    </div>
  );
}
