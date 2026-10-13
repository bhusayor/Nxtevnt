import { AlertCircle, Check, Cloud, CloudOff, LoaderCircle } from "@/components/ui/icons";

import { cn } from "@/lib/utils/cn";

type AutosaveState = "saving" | "saved" | "failed";

export function AutosaveStatus({ state, className }: { state: AutosaveState; className?: string }) {
  const config = {
    saving: { label: "Saving…", icon: LoaderCircle, styles: "text-text-tertiary", iconClass: "animate-spin" },
    saved: { label: "Saved", icon: Check, styles: "text-success", iconClass: "" },
    failed: { label: "Failed to save", icon: AlertCircle, styles: "text-error", iconClass: "" },
  }[state];
  const Icon = config.icon;
  return <span role="status" className={cn("inline-flex items-center gap-1.5 text-xs font-semibold", config.styles, className)}><Icon aria-hidden="true" className={cn("size-3.5", config.iconClass)} />{config.label}</span>;
}

export function UnsavedChangesIndicator({ unsaved = true }: { unsaved?: boolean }) {
  const Icon = unsaved ? CloudOff : Cloud;
  return <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold", unsaved ? "bg-warning-soft text-warning" : "bg-success-soft text-success")}><Icon aria-hidden="true" className="size-3.5" />{unsaved ? "Unsaved changes" : "All changes saved"}</span>;
}
