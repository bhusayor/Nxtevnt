import type { Metadata } from "next";
import Link from "next/link";
import { AttentionQueue } from "@/components/planner/attention-queue";

export const metadata: Metadata = { title: "Inquiries", description: "Active client and vendor inquiries, across all dates." };

export default function InquiriesPage() {
  return <div className="mx-auto w-full max-w-5xl space-y-5"><Link href="/planner" className="inline-flex min-h-10 items-center text-sm font-semibold text-brand-primary hover:underline">← Back to overview</Link><h1 className="text-3xl font-semibold tracking-tight">Inquiries</h1><AttentionQueue inquiriesOnly /></div>;
}
