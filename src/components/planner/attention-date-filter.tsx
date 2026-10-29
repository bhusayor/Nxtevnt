"use client";

import { Select } from "@/components/ui/select";

export function AttentionDateFilter({ preset, onPreset }: { preset: string; onPreset: (value: string) => void }) {
  return <div className="min-w-0 flex-1 sm:w-40 sm:flex-none"><Select ariaLabel="Filter attention by date" value={preset} onValueChange={onPreset} options={[{ value: "all", label: "All dates" }, { value: "today", label: "Today" }, { value: "week", label: "Next 7 days" }, { value: "month", label: "This month" }, { value: "custom", label: "Custom dates" }]} className="h-10 text-sm" /></div>;
}
