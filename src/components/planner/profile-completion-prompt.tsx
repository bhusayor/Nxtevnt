import Link from "next/link";
import { ArrowUpRight } from "@/components/ui/icons";

export function ProfileCompletionPrompt({ profileComplete = false }: { profileComplete?: boolean }) {
  if (profileComplete) return null;
  return (
    <section className="flex items-center gap-4 rounded-xl border border-[#e8e1f0] bg-[#f3eff8] px-5 py-5" aria-label="Profile completion">
      <div className="relative size-11 shrink-0" role="progressbar" aria-label="Profile completion" aria-valuenow={70} aria-valuemin={0} aria-valuemax={100}>
        <svg className="size-11 -rotate-90" viewBox="0 0 36 36" aria-hidden="true"><circle cx="18" cy="18" r="15" fill="none" stroke="var(--status-lavender-bg)" strokeWidth="3" /><circle cx="18" cy="18" r="15" fill="none" stroke="var(--status-lavender-text)" strokeWidth="3" pathLength="100" strokeDasharray="70 100" strokeLinecap="round" /></svg>
        <span className="absolute inset-0 flex items-center justify-center text-[0.625rem] font-semibold text-[var(--status-lavender-text)]">70%</span>
      </div>
      <div className="min-w-0 flex-1"><h2 className="text-sm font-semibold text-text-primary">Make your profile stand out</h2><p className="mt-1 text-xs leading-5 text-text-secondary">Add your services and portfolio.</p><Link href="/planner/profile" className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-brand-primary hover:underline">Complete profile<ArrowUpRight className="size-3.5" aria-hidden="true" /></Link></div>
    </section>
  );
}
