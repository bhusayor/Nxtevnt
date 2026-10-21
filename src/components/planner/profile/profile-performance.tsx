"use client";

import { useState } from "react";
import { Eye, ImageIcon, MessageSquareText, UsersRound } from "@/components/ui/icons";
import { OverviewMetricCard } from "@/components/planner/overview-metric-card";
import { Select } from "@/components/ui/select";
import { usePlannerInquiries, useProfileMetrics } from "@/lib/planner-business";
import { ProfileSection } from "./profile-fields";

export function ProfilePerformance() {
  const records = useProfileMetrics();
  const inquiries = usePlannerInquiries();
  const [period, setPeriod] = useState("30");
  const now = Date.now();
  const start = now - Number(period) * 86_400_000;
  const metrics = records.filter((metric) => Date.parse(metric.at) >= start && Date.parse(metric.at) <= now);
  const inquiryCount = inquiries.filter((inquiry) => Date.parse(inquiry.createdAt) >= start && Date.parse(inquiry.createdAt) <= now).length;
  const views = metrics.filter((metric) => metric.type === "view").length;
  const bars = Array.from({ length: 7 }, (_, index) => {
    const first = start + Number(period) * 86_400_000 / 7 * index;
    const last = start + Number(period) * 86_400_000 / 7 * (index + 1);
    return { label: new Date(first).toLocaleDateString("en-NG", { day: "numeric", month: "short" }), count: metrics.filter((metric) => metric.type === "view" && Date.parse(metric.at) >= first && Date.parse(metric.at) < last).length };
  });
  const max = Math.max(1, ...bars.map((bar) => bar.count));
  return <div className="space-y-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-semibold">Profile performance</h2><p className="mt-1 text-xs text-text-secondary">See how people explore your profile and start a conversation.</p></div><div className="w-40"><Select ariaLabel="Profile analytics period" value={period} onValueChange={setPeriod} options={[{ label: "Last 7 days", value: "7" }, { label: "Last 30 days", value: "30" }, { label: "Last 90 days", value: "90" }]} className="text-xs" /></div></div><div className="grid grid-cols-2 gap-3 xl:grid-cols-4"><OverviewMetricCard label="Profile views" value={views} detail="Visits to your profile preview" icon={Eye} tone="sage" compact /><OverviewMetricCard label="Contact actions" value={metrics.filter((metric) => metric.type === "contact").length} detail="Social and contact clicks" icon={UsersRound} tone="blue" compact /><OverviewMetricCard label="Inquiries" value={inquiryCount} detail="Client conversations started" icon={MessageSquareText} tone="lilac" compact /><OverviewMetricCard label="Portfolio views" value={metrics.filter((metric) => metric.type === "portfolio").length} detail="Portfolio collections opened" icon={ImageIcon} tone="amber" compact /></div><ProfileSection title="Profile visits" description={`Activity over the last ${period} days.`}><div className="grid grid-cols-7 items-end gap-3">{bars.map((bar) => <div key={bar.label} className="flex min-w-0 flex-col items-center"><span className="mb-2 text-xs font-semibold text-[#688650]">{bar.count}</span><div className="flex h-32 w-full max-w-14 items-end"><div className="w-full rounded-t-lg bg-linear-to-t from-[#91ad74] to-[#c6d8b1]" style={{ height: `${Math.max(2, bar.count / max * 100)}%` }} /></div><span className="mt-3 whitespace-nowrap text-[0.625rem] text-text-tertiary">{bar.label}</span></div>)}</div>{!views && <p className="mt-6 text-center text-xs leading-6 text-text-secondary">Your activity will appear here as your profile preview gets visits.</p>}</ProfileSection></div>;
}
