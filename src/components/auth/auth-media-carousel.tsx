"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils/cn";

const slides = [
  {
    src: "/images/auth/nigerian-traditional-wedding.jpg",
    alt: "A Nigerian couple sharing a first dance in traditional wedding attire",
    title: "Plan the moments people remember.",
    description: "Keep events, clients, vendors, budgets and tasks together.",
    position: "center 54%",
  },
  {
    src: "/images/auth/nigerian-wedding-party.jpg",
    alt: "Guests celebrating with a couple at a joyful Nigerian wedding reception",
    title: "From first brief to final guest.",
    description: "Run every stage of your planning workflow with clarity.",
    position: "center center",
  },
  {
    src: "/images/auth/lagos-nightlife.jpg",
    alt: "A DJ performing beneath vivid blue and red lights at a Lagos party",
    title: "Less admin. More planning.",
    description: "Stay focused on the experience while Nxtevnt keeps the work organised.",
    position: "center 42%",
  },
  {
    src: "/images/auth/gala-dinner.jpg",
    alt: "An elegant candlelit reception table with floral arrangements",
    title: "Every detail, beautifully coordinated.",
    description: "Your events, vendors, clients and team stay connected.",
    position: "center center",
  },
] as const;

export function AuthMediaCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [interactionPaused, setInteractionPaused] = useState(false);
  const [documentHidden, setDocumentHidden] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const paused = interactionPaused || documentHidden || reducedMotion;

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const update = () => setDocumentHidden(document.hidden);
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);

  useEffect(() => {
    if (paused) return;
    timerRef.current = setInterval(() => {
      setActiveIndex((current) => (current + 1) % slides.length);
    }, 5500);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [paused]);

  return (
    <section
      className="relative h-full min-h-[15rem] overflow-hidden rounded-[1.4rem] bg-brand-primary shadow-[var(--shadow-sm)]"
      aria-label="Featured event photography"
      aria-roledescription="carousel"
      onMouseEnter={() => setInteractionPaused(true)}
      onMouseLeave={() => setInteractionPaused(false)}
      onFocusCapture={() => setInteractionPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setInteractionPaused(false);
      }}
    >
      {slides.map((slide, index) => (
        <div
          key={slide.src}
          aria-hidden={index !== activeIndex}
          className={cn(
            "absolute inset-0 transition-opacity duration-700 ease-out",
            index === activeIndex ? "z-0 opacity-100" : "pointer-events-none opacity-0",
          )}
        >
          <Image
            src={slide.src}
            alt={index === activeIndex ? slide.alt : ""}
            fill
            priority={index === 0}
            sizes="(min-width: 1024px) 52vw, (min-width: 768px) 42vw, 100vw"
            className="object-cover"
            style={{ objectPosition: slide.position }}
          />
        </div>
      ))}

      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,20,17,0.02)_0%,rgba(10,20,17,0.04)_48%,rgba(10,20,17,0.38)_100%)]" />

      <div className="absolute inset-x-4 bottom-4 z-10 min-h-[12.25rem] text-white">
        <div className="min-h-[12.25rem] rounded-[1.75rem] border border-white/30 bg-[linear-gradient(135deg,rgba(255,255,255,0.29),rgba(255,255,255,0.14))] p-6 pb-7 shadow-[0_18px_45px_rgba(7,18,14,0.22)] backdrop-blur-xl">
          <p className="text-lg font-semibold leading-tight tracking-[-0.025em] drop-shadow-sm sm:text-2xl lg:text-[1.75rem]">
            {slides[activeIndex].title}
          </p>
          <p className="mt-2 max-w-lg text-xs leading-5 text-white/85 sm:text-sm sm:leading-6">
            {slides[activeIndex].description}
          </p>

          <div className="mt-4 flex items-center gap-1.5" aria-label={`Slide ${activeIndex + 1} of ${slides.length}`}>
            {slides.map((slide, index) => (
              <button
                key={slide.src}
                type="button"
                onClick={() => setActiveIndex(index)}
                aria-label={`Show slide ${index + 1}`}
                aria-current={index === activeIndex ? "true" : undefined}
                className="group flex h-7 items-center"
              >
                <span className={cn("block h-1 rounded-full transition-all", index === activeIndex ? "w-7 bg-white" : "w-3.5 bg-white/45 group-hover:bg-white/75")} />
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
