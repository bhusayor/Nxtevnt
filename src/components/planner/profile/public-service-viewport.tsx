"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

/** Keep the service panel at the height of its first four packages. */
export function PublicServiceViewport({ packageCount, children }: { packageCount: number; children: ReactNode }) {
  const content = useRef<HTMLDivElement>(null);
  const [limit, setLimit] = useState<number>();
  const scrollable = packageCount > 4;

  useEffect(() => {
    if (!scrollable || !content.current) return;
    const element = content.current;
    const cards = Array.from(element.querySelectorAll<HTMLElement>("[data-service-package]")).slice(0, 4);
    const measure = () => {
      const top = element.getBoundingClientRect().top;
      const height = Math.ceil(Math.max(...cards.map((card) => card.getBoundingClientRect().bottom - top)));
      if (height > 0 && Number.isFinite(height)) setLimit(height);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    cards.forEach((card) => observer.observe(card));
    return () => observer.disconnect();
  }, [scrollable, packageCount]);

  return <div role={scrollable ? "region" : undefined} aria-label={scrollable ? "Service packages and rate card. Scroll for more." : undefined} tabIndex={scrollable ? 0 : undefined} style={scrollable && limit ? { maxHeight: limit } : undefined} className={cn("mt-5 min-h-0 overflow-y-auto [scrollbar-gutter:stable]", scrollable && "max-h-[44rem] overscroll-y-contain rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary")}><div ref={content} className="space-y-5">{children}</div></div>;
}
