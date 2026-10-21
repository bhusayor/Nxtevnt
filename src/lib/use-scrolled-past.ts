"use client";

import { useEffect, useState } from "react";

// The workspace header is 64px tall. A section behind it is no longer visible.
export const workspaceStickyTop = 64;
export const sectionHasPassed = (bottom: number, top = workspaceStickyTop) => bottom <= top;

/** Tracks a section's bottom, including after resizing, loading or filtering. */
export function useScrolledPast<T extends HTMLElement = HTMLDivElement>(top = workspaceStickyTop) {
  const [element, ref] = useState<T | null>(null);
  const [passed, setPassed] = useState(false);
  useEffect(() => {
    if (!element) { setPassed(false); return; }
    let frame = 0;
    const measure = () => { frame = 0; setPassed(sectionHasPassed(element.getBoundingClientRect().bottom, top)); };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(measure); };
    measure();
    window.addEventListener("scroll", schedule, { passive: true, capture: true });
    window.addEventListener("resize", schedule);
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(schedule);
    observer?.observe(element);
    if (element.parentElement) observer?.observe(element.parentElement);
    return () => { cancelAnimationFrame(frame); window.removeEventListener("scroll", schedule, true); window.removeEventListener("resize", schedule); observer?.disconnect(); };
  }, [element, top]);
  return { ref, passed: element !== null && passed };
}
