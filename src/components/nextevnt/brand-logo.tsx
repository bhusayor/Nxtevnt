import Image from "next/image";

import { cn } from "@/lib/utils/cn";

const logoSrc = "/images/brand/nxtevnt-logo.png";

export function BrandMark({ size = "sm", className }: { size?: "sm" | "md"; className?: string }) {
  const medium = size === "md";
  return (
    <span className={cn("relative block shrink-0 overflow-hidden bg-white", medium ? "size-12" : "size-8", className)} aria-hidden="true">
      <Image
        src={logoSrc}
        alt=""
        width={500}
        height={500}
        className={cn("absolute max-w-none", medium ? "-top-6 -left-9 size-[120px]" : "-top-4 -left-6 size-20")}
      />
    </span>
  );
}

export function BrandLogo({ className, priority = false }: { className?: string; priority?: boolean }) {
  return <Image src={logoSrc} alt="NXTEVNT" width={500} height={500} priority={priority} className={cn("h-auto w-full", className)} />;
}
