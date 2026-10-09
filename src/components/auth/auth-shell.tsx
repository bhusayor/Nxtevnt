import type { ReactNode } from "react";
import Link from "next/link";

import { AuthMediaCarousel } from "@/components/auth/auth-media-carousel";
import { BrandMark } from "@/components/nextevnt/brand-logo";

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-white p-0 md:bg-[radial-gradient(circle_at_12%_10%,rgba(255,255,255,0.65),transparent_34%),linear-gradient(135deg,#dbe9e2_0%,#f4e8dc_52%,#dfbfa8_100%)] md:p-6 lg:p-8">
      <div className="grid w-full max-w-[70rem] overflow-hidden bg-white md:min-h-[44rem] md:grid-cols-[47%_53%] md:rounded-[1.75rem] md:border md:border-white/70 md:shadow-[0_30px_90px_rgba(37,78,63,0.18)]">
        <div className="order-1 hidden p-3 md:order-2 md:block md:min-h-[44rem]">
          <AuthMediaCarousel />
        </div>

        <section className="order-2 flex min-h-screen flex-col px-6 py-7 sm:px-10 sm:py-9 md:order-1 md:min-h-0 md:px-9 lg:px-12">
          <Link href="/" className="inline-flex w-fit items-center gap-2 rounded-[var(--radius-md)] text-text-primary" aria-label="Nxtevnt home">
            <BrandMark size="sm" />
            <span className="text-base font-bold tracking-[-0.025em]">NXTEVNT</span>
          </Link>
          <div className="flex flex-1 items-center justify-center py-9 md:py-7">
            <div className="w-full max-w-[25rem]">{children}</div>
          </div>
        </section>
      </div>
    </main>
  );
}
