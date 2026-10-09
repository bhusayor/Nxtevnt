"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/utils/cn";

type DesignSystemNavGroup = {
  group: string;
  items: ReadonlyArray<readonly [string, string]>;
};

export const designSystemNavigation: ReadonlyArray<DesignSystemNavGroup> = [
  { group: "Foundations", items: [["brand", "Brand"], ["colors", "Colors"], ["typography", "Typography"], ["spacing", "Spacing"], ["radius", "Radius"], ["shadows", "Shadows"]] },
  { group: "Components", items: [["buttons", "Buttons"], ["forms", "Forms"], ["status", "Status"]] },
  { group: "Patterns", items: [["tables", "Tables"], ["filters", "Filters"], ["cards", "Cards"], ["feedback", "Feedback"], ["loading", "Loading"], ["navigation", "Navigation"]] },
];

export function DesignSystemNav() {
  const [active, setActive] = useState("brand");

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible) setActive(visible.target.id);
    }, { rootMargin: "-15% 0px -65% 0px", threshold: [0, 0.15, 0.5] });
    designSystemNavigation.flatMap((group) => group.items).forEach(([id]) => { const element = document.getElementById(id); if (element) observer.observe(element); });
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <aside className="hidden border-r border-border-subtle px-5 py-9 lg:block">
        <nav aria-label="Design system sections" className="sticky top-8 grid gap-6">
          {designSystemNavigation.map((group) => <div key={group.group}><p className="type-caption mb-2 px-3 text-text-tertiary">{group.group}</p><ul className="grid gap-0.5">{group.items.map(([id, label]) => <li key={id}><a href={`#${id}`} aria-current={active === id ? "location" : undefined} className={cn("relative block rounded-[var(--radius-sm)] px-3 py-1.5 text-[0.8125rem] font-medium text-text-secondary transition-colors hover:bg-background-subtle hover:text-text-primary", active === id && "bg-surface-selected text-brand-primary before:absolute before:top-1/2 before:left-0 before:h-4 before:w-0.5 before:-translate-y-1/2 before:rounded-full before:bg-brand-primary")}>{label}</a></li>)}</ul></div>)}
        </nav>
      </aside>
      <div className="sticky top-0 z-30 overflow-x-auto border-b border-border-subtle bg-background/95 px-5 py-2 backdrop-blur-sm lg:hidden">
        <nav aria-label="Design system sections"><ul className="flex min-w-max gap-1">{designSystemNavigation.flatMap((group) => group.items).map(([id, label]) => <li key={id}><a href={`#${id}`} aria-current={active === id ? "location" : undefined} className={cn("block rounded-full px-3 py-1.5 text-xs font-semibold text-text-tertiary", active === id && "bg-brand-primary text-text-inverse")}>{label}</a></li>)}</ul></nav>
      </div>
    </>
  );
}
