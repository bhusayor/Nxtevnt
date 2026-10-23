import Link from "next/link";
import { ShieldCheck } from "@/components/ui/icons";

export function ProfileStatus({ verified }: { verified: boolean }) {
  return verified ? <span className="text-xs font-medium text-[#3473b5]">Verified planner</span> : <Link href="/planner/verification" className="inline-flex items-center gap-1.5 rounded-full bg-[#fff4df] px-2.5 py-1 text-xs font-semibold text-[#9b773e] hover:bg-[#ffedca]"><ShieldCheck className="size-3" aria-hidden="true" />Verification pending</Link>;
}
