"use client";

import { useEffect, useRef, useState } from "react";
import type { PhosphorIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils/cn";

type Tone = "neutral" | "sage" | "lilac" | "amber" | "blue" | "rose";

const tones: Record<Tone, { icon: string; track: string; fill: string; footer: string }> = {
  neutral: { icon: "bg-[#eef1f0] text-[#58655f]", track: "bg-[#e8ecea]", fill: "bg-[#7b8981]", footer: "bg-[#f4f6f5] text-[#58655f]" },
  sage: { icon: "bg-[#eaf3ed] text-[#37634a]", track: "bg-[#e8f0e9]", fill: "bg-[#5f9871]", footer: "bg-[#f1f7f2] text-[#42634e]" },
  lilac: { icon: "bg-[#f1edf8] text-[#705987]", track: "bg-[#eee9f5]", fill: "bg-[#8b72a8]", footer: "bg-[#f7f4fb] text-[#705987]" },
  amber: { icon: "bg-[#faf0e2] text-[#90683b]", track: "bg-[#f5ebdb]", fill: "bg-[#d69a52]", footer: "bg-[#fdf8ef] text-[#8a6537]" },
  blue: { icon: "bg-[#eaf2f8] text-[#446d8b]", track: "bg-[#e6eff6]", fill: "bg-[#6891b0]", footer: "bg-[#f1f7fb] text-[#446d8b]" },
  rose: { icon: "bg-[#faecec] text-[#a34c4c]", track: "bg-[#f6e7e7]", fill: "bg-[#bf7777]", footer: "bg-[#fdf5f5] text-[#a34c4c]" },
};

type MetricCardProps = {
  label: string;
  value: string | number;
  detail: string;
  icon: PhosphorIcon;
  tone?: Tone;
  progress?: { value: number; label: string };
  animateCurrency?: boolean;
  compact?: boolean;
  className?: string;
};

function countTarget(value: string | number, animateCurrency: boolean) {
  if (typeof value === "number" && Number.isInteger(value) && value >= 0) return { number: value, prefix: "", suffix: "", grouped: value >= 1000 };
  const currency = animateCurrency ? /^(₦)(\d[\d,]*)$/.exec(String(value)) : null;
  if (currency) {
    const number = Number(currency[2].replaceAll(",", ""));
    return Number.isSafeInteger(number) ? { number, prefix: currency[1], suffix: "", grouped: true } : null;
  }
  const match = /^(\d[\d,]*)(%| of \d[\d,]*|\/\d[\d,]*| overdue)?$/.exec(String(value));
  if (!match) return null;
  const number = Number(match[1].replaceAll(",", ""));
  return Number.isSafeInteger(number) ? { number, prefix: "", suffix: match[2] ?? "", grouped: match[1].includes(",") } : null;
}

function AnimatedMetricValue({ value, animateCurrency }: { value: string | number; animateCurrency: boolean }) {
  const [display, setDisplay] = useState<string | number>(value);
  const element = useRef<HTMLSpanElement>(null);
  const current = useRef(0);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const target = countTarget(value, animateCurrency);
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    let observer: IntersectionObserver | undefined;
    const finish = () => {
      cancelAnimationFrame(frame);
      current.current = target?.number ?? 0;
      setDisplay(value);
    };

    if (!target || target.number === 0 || media.matches || document.hidden) {
      frame = requestAnimationFrame(finish);
      return () => cancelAnimationFrame(frame);
    }

    const renderNumber = (number: number) => `${target.prefix}${target.grouped ? number.toLocaleString("en-NG") : number}${target.suffix}`;
    const animate = () => {
      observer?.disconnect();
      const start = hasAnimated.current ? current.current : 0;
      hasAnimated.current = true;
      if (start === target.number) { finish(); return; }
      const startedAt = performance.now();
      const tick = (now: number) => {
        const fraction = Math.min(1, (now - startedAt) / 620);
        const eased = 1 - (1 - fraction) ** 3;
        const next = Math.round(start + (target.number - start) * eased);
        current.current = next;
        setDisplay(renderNumber(next));
        if (fraction < 1) frame = requestAnimationFrame(tick);
        else setDisplay(value);
      };
      frame = requestAnimationFrame(tick);
    };
    const motionChanged = () => { if (media.matches) finish(); };
    media.addEventListener("change", motionChanged);
    if (typeof IntersectionObserver === "undefined" || !element.current) animate();
    else {
      observer = new IntersectionObserver((entries) => {
        if (entries.some((entry) => entry.isIntersecting)) animate();
      }, { threshold: 0.15 });
      observer.observe(element.current);
    }
    return () => {
      observer?.disconnect();
      media.removeEventListener("change", motionChanged);
      cancelAnimationFrame(frame);
    };
  }, [value, animateCurrency]);

  return <><span className="sr-only">{value}</span><span ref={element} aria-hidden="true">{display}</span></>;
}

export function OverviewMetricCard({ label, value, detail, icon: Icon, tone = "sage", progress, animateCurrency = false, compact, className }: MetricCardProps) {
  const palette = tones[tone];
  const percent = progress ? Math.max(0, Math.min(100, progress.value)) : 0;
  const content = <>
    <div className="flex items-start justify-between gap-2">
      <span className="pt-0.5 text-[0.6875rem] font-semibold uppercase leading-4 tracking-[0.08em] text-text-secondary">{label}</span>
      <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-xl", palette.icon)}><Icon className="size-[18px]" weight="bold" aria-hidden="true" /></span>
    </div>
    <strong className={cn("mt-3 block break-words font-semibold leading-tight tracking-[-0.045em] tabular-nums text-text-primary", compact ? "text-[1.375rem] sm:text-[1.5rem]" : "text-[1.875rem] sm:text-[2.125rem]")}><AnimatedMetricValue value={value} animateCurrency={animateCurrency} /></strong>
    {progress && <div className="mt-3" role="progressbar" aria-label={progress.label} aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}><div className={cn("h-1.5 overflow-hidden rounded-full", palette.track)}><span className={cn("metric-card-progress block h-full origin-left rounded-full motion-safe:transition-[width] motion-safe:duration-500", palette.fill)} style={{ width: `${percent}%` }} /></div></div>}
    <div className="mt-auto pt-4">
      <div className={cn("flex min-h-10 items-center rounded-xl px-3 py-2.5 text-[0.6875rem] font-medium leading-4", palette.footer)}>{detail}</div>
    </div>
  </>;
  return <div className={cn("metric-card-enter flex min-w-0 flex-col rounded-2xl border border-border-subtle bg-white p-4 text-left shadow-[0_8px_26px_-23px_rgba(20,45,30,.35)] sm:p-5", className)}>{content}</div>;
}
