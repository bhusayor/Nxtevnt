"use client";

import { useState } from "react";
import Image from "next/image";
import { ImageIcon } from "@/components/ui/icons";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils/cn";

type CardMediaProps = {
  src?: string;
  alt: string;
  loading?: boolean;
  aspect?: "wide" | "landscape" | "square";
  className?: string;
  imageClassName?: string;
};

export function CardMedia({ src, alt, loading, aspect = "wide", className, imageClassName }: CardMediaProps) {
  const [failed, setFailed] = useState(false);
  const aspectClass = aspect === "square" ? "aspect-square" : aspect === "landscape" ? "aspect-[3/2]" : "aspect-[16/10]";

  if (loading) return <Skeleton className={cn(aspectClass, "w-full rounded-none", className)} />;

  return (
    <div className={cn("relative overflow-hidden bg-background-subtle", aspectClass, className)}>
      {src && !failed ? (
        <Image src={src} alt={alt} fill sizes="(max-width: 768px) 100vw, 33vw" onError={() => setFailed(true)} className={cn("object-cover", imageClassName)} />
      ) : (
        <div role="img" aria-label={alt || "Image unavailable"} className="flex size-full flex-col items-center justify-center gap-2 text-text-tertiary">
          <span className="flex size-10 items-center justify-center rounded-full bg-surface"><ImageIcon aria-hidden="true" className="size-5" /></span>
          <span className="type-label-small">Image unavailable</span>
        </div>
      )}
    </div>
  );
}
