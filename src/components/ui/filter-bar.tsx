"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Check, ChevronDown, LayoutGrid, List, SlidersHorizontal, X } from "@/components/ui/icons";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { cn } from "@/lib/utils/cn";

export function FilterBar({ children, mobileFilters, activeCount = 0, className }: { children: ReactNode; mobileFilters?: ReactNode; activeCount?: number; className?: string }) {
  return (
    <div className={cn("grid gap-3", className)}>
      <div className="hidden min-w-0 items-center gap-2 lg:flex">{children}</div>
      <div className="flex items-center gap-2 lg:hidden">
        {mobileFilters ? <MobileFilterSheet activeCount={activeCount}>{mobileFilters}</MobileFilterSheet> : null}
      </div>
    </div>
  );
}

export function FilterChip({ children, onRemove }: { children: ReactNode; onRemove?: () => void }) {
  return <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-[var(--radius-sm)] bg-surface-selected py-1 pr-1.5 pl-2 text-xs font-medium text-brand-primary">{children}{onRemove ? <button type="button" onClick={onRemove} aria-label={`Remove ${String(children)} filter`} className="flex size-4 items-center justify-center rounded-[var(--radius-xs)] hover:bg-brand-primary/10"><X aria-hidden="true" className="size-3" /></button> : null}</span>;
}

export function ActiveFilters({ children, count, onClear }: { children: ReactNode; count: number; onClear?: () => void }) {
  return <div className="flex flex-wrap items-center gap-2"><span className="text-xs font-medium text-text-tertiary">Active</span>{children}<Button variant="ghost" size="sm" onClick={onClear} className="h-7 px-2 text-xs">Clear all ({count})</Button></div>;
}

export function FilterMenuButton({ children, active = false, icon }: { children: ReactNode; active?: boolean; icon?: ReactNode }) {
  return <Button type="button" variant="outline" size="sm" leadingIcon={icon} trailingIcon={<ChevronDown aria-hidden="true" className="size-3.5 text-text-tertiary" />} className={cn("h-9 px-3 font-medium", active && "border-brand-primary/30 bg-surface-selected text-brand-primary")}>{children}</Button>;
}

export type FilterDropdownOption = { label: string; value: string };

export function FilterDropdown({ label, value, options, onValueChange, active = false, icon, align = "start" }: { label: string; value: string; options: FilterDropdownOption[]; onValueChange: (value: string) => void; active?: boolean; icon?: ReactNode; align?: "start" | "end" }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button type="button" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((current) => !current)} className={cn("inline-flex h-9 items-center gap-1.5 whitespace-nowrap rounded-[var(--radius-md)] border border-border-default bg-surface px-3 text-[0.6875rem] font-medium text-text-secondary transition-colors hover:border-border-strong hover:bg-surface-subtle hover:text-text-primary focus-visible:outline-none", active && "border-brand-primary/30 bg-surface-selected text-brand-primary", open && "border-brand-primary ring-[3px] ring-brand-primary/10")}>
        {icon}<span>{label}</span><ChevronDown aria-hidden="true" className={cn("size-3.5 text-text-tertiary transition-transform", open && "rotate-180")} />
      </button>
      {open ? <div role="menu" aria-label={`${label} filter`} className={cn("absolute top-full z-30 mt-1 min-w-44 overflow-hidden rounded-[var(--radius-md)] border border-border-default bg-surface p-1 shadow-[var(--shadow-md)]", align === "end" ? "right-0" : "left-0")}>
        {options.map((option) => <button key={option.value} type="button" role="menuitemradio" aria-checked={option.value === value} onClick={() => { onValueChange(option.value); setOpen(false); }} className={cn("flex h-8 w-full items-center justify-between gap-4 rounded-[var(--radius-sm)] px-2.5 text-left text-xs text-text-secondary transition-colors hover:bg-background-subtle hover:text-text-primary", option.value === value && "bg-surface-selected font-medium text-brand-primary")}><span className="whitespace-nowrap">{option.label}</span>{option.value === value ? <Check aria-hidden="true" className="size-3.5" /> : null}</button>)}
      </div> : null}
    </div>
  );
}

export function ViewSwitcher({ value = "list", onChange }: { value?: "list" | "grid"; onChange?: (value: "list" | "grid") => void }) {
  return <div className="inline-flex h-9 rounded-[var(--radius-md)] border border-border-default bg-surface p-0.5" aria-label="View options"><IconButton aria-label="List view" size="sm" variant="ghost" className={cn("size-8", value === "list" && "bg-surface-selected text-brand-primary")} onClick={() => onChange?.("list")} icon={<List className="size-4" />} /><IconButton aria-label="Grid view" size="sm" variant="ghost" className={cn("size-8", value === "grid" && "bg-surface-selected text-brand-primary")} onClick={() => onChange?.("grid")} icon={<LayoutGrid className="size-4" />} /></div>;
}

export function MobileFilterSheet({ children, activeCount }: { children: ReactNode; activeCount: number }) {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild><Button variant="outline" size="sm" className="h-9" leadingIcon={<SlidersHorizontal className="size-4" />}>Filters{activeCount ? <Badge tone="brand" className="px-1.5 py-0.5">{activeCount}</Badge> : null}</Button></Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-text-primary/35" />
        <Dialog.Content className="fixed inset-x-0 bottom-0 z-50 max-h-[88vh] overflow-y-auto rounded-t-[var(--radius-xl)] bg-surface p-5 shadow-[var(--shadow-lg)]">
          <div className="mb-6 flex items-start justify-between gap-4"><div><Dialog.Title className="type-heading-3 text-text-primary">Filter events</Dialog.Title><Dialog.Description className="type-body-small mt-1 text-text-secondary">Narrow the event list using one or more filters.</Dialog.Description></div><Dialog.Close asChild><IconButton aria-label="Close filters" variant="ghost" size="sm" icon={<X className="size-4" />} /></Dialog.Close></div>
          <div className="grid gap-5">{children}</div>
          <div className="sticky bottom-0 mt-6 grid grid-cols-2 gap-2 border-t border-border-subtle bg-surface pt-4"><Dialog.Close asChild><Button variant="ghost">Clear all</Button></Dialog.Close><Dialog.Close asChild><Button>Show results</Button></Dialog.Close></div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
