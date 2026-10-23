"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Check, MoreHorizontal } from "@/components/ui/icons";
import { cn } from "@/lib/utils/cn";

export const actionMenuItemClassName = "flex min-h-11 w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-xs font-medium text-text-primary outline-none transition-colors hover:bg-background-subtle focus:bg-background-subtle disabled:pointer-events-none disabled:opacity-40";

type Action = { label: string; icon?: ReactNode; description?: string; href?: string; onSelect?: () => void; destructive?: boolean; disabled?: boolean; selected?: boolean };
const enabledMenuItems = ':is([role="menuitem"],[role="menuitemradio"]):not(:disabled)';

/** Shared, portalled action menu: never clipped by tables or cards. */
export function ActionMenu({ label, items, children, triggerContent, triggerClassName, contentClassName, heading, footer }: { label: string; items?: Action[]; children?: ReactNode; triggerContent?: ReactNode; triggerClassName?: string; contentClassName?: string; heading?: string; footer?: ReactNode }) {
  const id = useId();
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  useEffect(() => {
    if (!open) return;
    function place() {
      const rect = trigger.current?.getBoundingClientRect();
      if (!rect) return;
      const height = panel.current?.offsetHeight || 192;
      const width = panel.current?.offsetWidth || 240;
      setPosition({ left: Math.max(8, Math.min(window.innerWidth - width - 8, rect.right - width)), top: Math.max(8, rect.bottom + height + 8 > window.innerHeight ? rect.top - height - 6 : rect.bottom + 6) });
    }
    function outside(event: PointerEvent) {
      if (event.target instanceof Node && !panel.current?.contains(event.target) && !trigger.current?.contains(event.target)) setOpen(false);
    }
    function escape(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") { event.preventDefault(); setOpen(false); trigger.current?.focus(); }
    }
    place();
    (panel.current?.querySelector<HTMLElement>('[role="menuitemradio"][aria-checked="true"]:not(:disabled)') || panel.current?.querySelector<HTMLElement>(enabledMenuItems))?.focus();
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => { document.removeEventListener("pointerdown", outside); document.removeEventListener("keydown", escape); window.removeEventListener("resize", place); window.removeEventListener("scroll", place, true); };
  }, [open]);
  function navigate(event: KeyboardEvent<HTMLDivElement>) {
    const entries = Array.from(panel.current?.querySelectorAll<HTMLElement>(enabledMenuItems) || []);
    const index = entries.indexOf(document.activeElement as HTMLElement);
    if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key) && entries.length) {
      event.preventDefault();
      const next = event.key === "Home" ? 0 : event.key === "End" ? entries.length - 1 : (index + (event.key === "ArrowDown" ? 1 : -1) + entries.length) % entries.length;
      entries[next]?.focus();
    }
    if (event.key === "Tab") { event.preventDefault(); setOpen(false); trigger.current?.focus(); }
  }
  return <>
    <button ref={trigger} type="button" aria-label={label} aria-haspopup="menu" aria-expanded={open} aria-controls={open ? id : undefined} onClick={() => setOpen((value) => !value)} onKeyDown={(event) => { if (event.key === "ArrowDown" || event.key === "ArrowUp") { event.preventDefault(); setOpen(true); } }} className={cn("flex size-10 shrink-0 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-background-subtle focus-visible:outline-2 focus-visible:outline-brand-primary", triggerClassName)}>{triggerContent || <MoreHorizontal className="size-5" aria-hidden="true" />}</button>
    {open && createPortal(<div ref={panel} id={id} role="menu" aria-label={label} onKeyDown={navigate} onClick={(event) => { if (event.target instanceof Element && event.target.closest(enabledMenuItems)) { trigger.current?.focus(); setOpen(false); } }} style={position} className={cn("fixed z-[80] max-h-[calc(100dvh-1rem)] w-60 max-w-[calc(100vw-1rem)] overflow-y-auto rounded-xl border border-border-subtle bg-white p-1.5 shadow-[var(--shadow-lg)]", contentClassName)}>
      {heading && <p className="px-3 pb-1 pt-2 text-[0.625rem] font-semibold uppercase tracking-wider text-text-tertiary">{heading}</p>}
      {items?.map((item) => {
        const content = <>{item.icon && <span className="flex size-4 shrink-0 items-center justify-center [&>svg]:size-4" aria-hidden="true">{item.icon}</span>}<span className="min-w-0 flex-1"><span className="block">{item.label}</span>{item.description && <span className="mt-0.5 block text-[0.6875rem] font-normal leading-4 text-text-tertiary">{item.description}</span>}</span>{item.selected && <Check className="size-4 shrink-0 text-brand-primary" aria-hidden="true" />}</>;
        const className = cn(actionMenuItemClassName, item.selected && "bg-background-subtle", item.destructive && "text-error hover:bg-error-soft focus:bg-error-soft");
        const role = item.selected === undefined ? "menuitem" : "menuitemradio";
        return item.href && !item.disabled ? <Link key={item.label} role={role} aria-checked={item.selected} href={item.href} className={className} onClick={item.onSelect}>{content}</Link> : <button key={item.label} type="button" role={role} aria-checked={item.selected} disabled={item.disabled} className={className} onClick={item.onSelect}>{content}</button>;
      })}{children}
      {footer && <div className="mt-1 border-t border-border-subtle px-3 pb-2 pt-3 text-[0.6875rem] leading-5 text-text-tertiary">{footer}</div>}
    </div>, document.body)}
  </>;
}
