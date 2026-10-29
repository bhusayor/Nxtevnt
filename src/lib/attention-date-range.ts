import type { AttentionItem } from "@/components/planner/attention-queue-items";

export type AttentionRange = { start: string; end: string; label: string; valid: boolean };
export function attentionDateRange(preset: string, start: string, end: string, today: string): AttentionRange {
  const day = (offset: number) => { const d = new Date(`${today}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + offset); return d.toISOString().slice(0, 10); };
  if (preset === "today") return { start: today, end: today, label: "Today", valid: true };
  if (preset === "week") return { start: today, end: day(6), label: "Next 7 days", valid: true };
  if (preset === "month") { const d = new Date(`${today}T12:00:00Z`); return { start: `${today.slice(0, 7)}-01`, end: new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0, 12)).toISOString().slice(0, 10), label: "This month", valid: true }; }
  if (preset === "custom") {
    const validDay = (s: string) => !s || /^\d{4}-\d{2}-\d{2}$/.test(s) && Number.isFinite(Date.parse(`${s}T12:00:00Z`)) && new Date(`${s}T12:00:00Z`).toISOString().slice(0, 10) === s;
    return { start, end, label: start && end ? `${start} – ${end}` : start ? `From ${start}` : end ? `Until ${end}` : "Custom dates", valid: validDay(start) && validDay(end) && (!start || !end || start <= end) };
  }
  return { start: "", end: "", label: "All dates", valid: true };
}
export function attentionInRange(item: AttentionItem, range: AttentionRange) {
  if (!range.valid) return false;
  if (!range.start && !range.end) return true;
  const date = item.task?.dueDate || item.samplePayment?.date || item.inquiry?.createdAt?.slice(0, 10) || item.vendorReply?.createdAt?.slice(0, 10) || item.filterDate || "";
  return typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date) && Number.isFinite(Date.parse(`${date}T12:00:00Z`)) && new Date(`${date}T12:00:00Z`).toISOString().slice(0, 10) === date && (!range.start || date >= range.start) && (!range.end || date <= range.end);
}
