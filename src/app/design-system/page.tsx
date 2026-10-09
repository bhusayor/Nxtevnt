import type { Metadata } from "next";

import { ComponentsSections } from "@/app/design-system/components-sections";
import { FoundationsSections } from "@/app/design-system/foundations-sections";
import { PatternsSections } from "@/app/design-system/patterns-sections";
import { DesignSystemNav } from "@/components/nextevnt/design-system-nav";
import { BrandMark } from "@/components/nextevnt/brand-logo";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Design System" };

export default function DesignSystemPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-white/10 bg-brand-primary-active text-text-inverse">
        <div className="mx-auto flex max-w-[96rem] items-center justify-between px-5 py-4 sm:px-8 lg:px-10">
          <a href="#brand" className="flex items-center gap-3 rounded-[var(--radius-sm)]">
            <BrandMark className="size-9 rounded-[var(--radius-md)]" />
            <span><span className="block text-sm font-semibold tracking-[-0.01em]">Nxtevnt</span><span className="block text-[0.6875rem] text-white/55">Design system · Phase 1D</span></span>
          </a>
          <Badge className="bg-white/10 text-white">Product patterns 1.1</Badge>
        </div>
      </header>

      <div className="mx-auto max-w-[96rem] lg:grid lg:grid-cols-[15rem_minmax(0,1fr)]">
        <DesignSystemNav />
        <main className="min-w-0 px-5 sm:px-8 lg:px-12 xl:px-16">
          <FoundationsSections />
          <ComponentsSections />
          <PatternsSections />
          <footer className="flex flex-col gap-2 py-10 sm:flex-row sm:items-center sm:justify-between"><p className="type-body-small text-text-tertiary">Nxtevnt Design System · Product patterns 1.1</p><a href="#brand" className="type-label text-brand-primary hover:text-brand-primary-hover">Back to top</a></footer>
        </main>
      </div>
    </div>
  );
}
