"use client";

import { useEffect, useLayoutEffect, useRef, useState, type TransitionEvent } from "react";

type Panel = "milestones" | "tasks";
type Phase = "idle" | "sliding" | "settling";
const panelWeights = { milestones: [3.25, 1], tasks: [1.15, 3] } as const;

/** Render the destination immediately, at its final content width, while panels resize. */
export function useSummaryMotion() {
  const [expanded, setExpanded] = useState<Panel>("milestones");
  const [contentWidths, setContentWidths] = useState<Partial<Record<Panel, number>> | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [height, setHeight] = useState<number | null>(null);
  const frame = useRef<HTMLDivElement>(null);
  const grid = useRef<HTMLDivElement>(null);

  function finishImmediately(panel: Panel) {
    setExpanded(panel); setContentWidths(null); setHeight(null); setPhase("idle");
  }
  function select(panel: Panel) {
    if (panel === expanded) return;
    if (typeof window === "undefined" || window.matchMedia("(prefers-reduced-motion: reduce)").matches || !window.matchMedia("(min-width: 80rem)").matches || !frame.current || !grid.current) {
      finishImmediately(panel); return;
    }
    const gridStyle = window.getComputedStyle(grid.current);
    const available = grid.current.getBoundingClientRect().width - (parseFloat(gridStyle.columnGap) || 0);
    const weights = panelWeights[panel];
    const widths: Partial<Record<Panel, number>> = {};
    for (const content of grid.current.querySelectorAll<HTMLElement>("[data-summary-content]")) {
      const id = content.dataset.summaryContent;
      if ((id !== "milestones" && id !== "tasks") || !content.parentElement) continue;
      const style = window.getComputedStyle(content.parentElement);
      const inset = [style.paddingLeft, style.paddingRight, style.borderLeftWidth, style.borderRightWidth].reduce((sum, value) => sum + (parseFloat(value) || 0), 0);
      widths[id] = Math.max(0, available * weights[id === "milestones" ? 0 : 1] / (weights[0] + weights[1]) - inset);
    }
    if (!widths.milestones || !widths.tasks) { finishImmediately(panel); return; }
    setHeight(frame.current.getBoundingClientRect().height);
    setContentWidths(widths);
    setExpanded(panel);
    setPhase("sliding");
  }
  function finishSlide() { setContentWidths(null); setPhase("settling"); }
  function releaseHeight() { setHeight(null); setPhase("idle"); }

  useEffect(() => {
    // Fallbacks also handle interrupted transitions and unchanged target heights.
    if (phase === "idle") return;
    const timer = window.setTimeout(() => {
      if (phase === "sliding") { setContentWidths(null); setPhase("settling"); }
      else releaseHeight();
    }, phase === "sliding" ? 360 : 260);
    return () => window.clearTimeout(timer);
  }, [phase, expanded]);

  useLayoutEffect(() => {
    if (phase === "settling" && grid.current) setHeight(grid.current.getBoundingClientRect().height);
  }, [phase]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const motionChanged = () => { if (media.matches) finishImmediately(expanded); };
    const resized = () => finishImmediately(expanded);
    media.addEventListener("change", motionChanged);
    window.addEventListener("resize", resized);
    return () => { media.removeEventListener("change", motionChanged); window.removeEventListener("resize", resized); };
  }, [expanded]);

  return {
    frame, grid, expanded, layout: expanded, contentWidths, phase, height, select,
    isResizing: phase === "sliding",
    onGridTransitionEnd(event: TransitionEvent<HTMLDivElement>) {
      if (phase === "sliding" && event.target === event.currentTarget && event.propertyName === "grid-template-columns") finishSlide();
    },
    onFrameTransitionEnd(event: TransitionEvent<HTMLDivElement>) {
      if (phase === "settling" && event.target === event.currentTarget && event.propertyName === "height") releaseHeight();
    },
  };
}
