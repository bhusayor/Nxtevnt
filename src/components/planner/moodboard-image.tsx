"use client";

import Image from "next/image";
import { ImageIcon, LoaderCircle } from "@/components/ui/icons";
import { useMoodboardImage } from "@/lib/moodboard-images";
import { cn } from "@/lib/utils/cn";

export function MoodboardImage({ source, alt, contain = false, natural = false, sizes = "(min-width: 1280px) 30vw, (min-width: 640px) 45vw, 100vw" }: { source?: string; alt: string; contain?: boolean; natural?: boolean; sizes?: string }) {
  const { src, loading, error } = useMoodboardImage(source);
  return src ? natural ? <Image src={src} alt={alt} width={1200} height={900} unoptimized sizes={sizes} className="block h-auto w-full" style={{ width: "100%", height: "auto" }} /> : <Image src={src} alt={alt} fill unoptimized sizes={sizes} className={cn(contain ? "object-contain" : "object-cover", "transition-transform duration-500 motion-reduce:transition-none")} /> : <span role={error ? "status" : undefined} title={error} className={cn(natural ? "relative flex min-h-48 w-full" : "absolute inset-0 flex", "flex-col items-center justify-center gap-2 bg-[#f4f3ef] px-4 text-center text-text-tertiary")}>{loading ? <LoaderCircle className="size-5 motion-safe:animate-spin" aria-label="Loading photo" /> : <ImageIcon className="size-7" aria-hidden="true" />}{error && <span className="max-w-44 text-[0.625rem] leading-4">Image unavailable in this browser</span>}</span>;
}
