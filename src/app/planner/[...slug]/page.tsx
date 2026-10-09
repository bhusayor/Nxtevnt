import Link from "next/link";
import { ArrowLeft, Construction } from "lucide-react";

export default async function PlannerPlaceholderPage({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  const title = slug.at(-1)?.replaceAll("-", " ") ?? "Planner";
  return (
    <div className="mx-auto max-w-2xl py-10">
      <div className="rounded-[var(--radius-lg)] border border-border-subtle bg-surface p-7 text-center">
        <span className="mx-auto flex size-11 items-center justify-center rounded-[var(--radius-lg)] bg-warning-soft text-warning"><Construction aria-hidden="true" className="size-5" /></span>
        <h1 className="mt-4 text-xl font-semibold capitalize text-text-primary">{title}</h1>
        <p className="mt-2 text-sm text-text-secondary">This area is prepared for the next product phase. Your Planner overview is ready now.</p>
        <Link href="/planner" className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-primary hover:underline"><ArrowLeft aria-hidden="true" className="size-4" />Back to overview</Link>
      </div>
    </div>
  );
}
