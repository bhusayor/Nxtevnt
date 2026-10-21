import { formatBudgetMoney } from "@/lib/planner-budget";
import type { PlannerInquiry } from "@/lib/planner-business";
import { dateKey } from "@/lib/planner-dashboard";
import { formatEventDate, type EventItem } from "@/lib/planner-events";

export type AttentionTab = "tasks" | "payments" | "inquiries";
export type AttentionItem = {
  id: string; title: string; context: string; detail: string; href?: string;
  inquiry?: PlannerInquiry; overdue?: boolean; eventId?: string; task?: EventItem;
  sample?: boolean;
  samplePayment?: { amount: number; currency: string; vendor: string; date: string; eventName: string };
};

export const isSampleInquiry = (inquiry: PlannerInquiry | null) => Boolean(inquiry?.id.startsWith("sample-attention-inquiry-"));

export function attentionExamples(today: string): Pick<Record<AttentionTab, AttentionItem[]>, "payments" | "inquiries"> {
  const day = (offset: number) => { const date = new Date(`${today}T12:00:00`); date.setDate(date.getDate() + offset); return dateKey(date); };
  const payments = [
    { title: "Venue deposit", vendor: "Sample venue", eventName: "Sample wedding", amount: 350000, offset: 0 },
    { title: "Décor installment", vendor: "Sample floral studio", eventName: "Sample wedding", amount: 180000, offset: 2 },
    { title: "Photography balance", vendor: "Sample photography team", eventName: "Sample birthday", amount: 120000, offset: 5 },
  ].map((payment, index): AttentionItem => {
    const date = day(payment.offset);
    return { id: `sample-attention-payment-${index}`, title: payment.title, context: `${payment.eventName} · ${payment.vendor}`, detail: `${formatBudgetMoney(payment.amount, "NGN")} · ${payment.offset === 0 ? "Due today" : `Due ${formatEventDate(date, { day: "numeric", month: "short" })}`}`, sample: true, samplePayment: { ...payment, date, currency: "NGN" } };
  });
  const inquiries = [
    { subject: "Are you available for our wedding?", name: "Sample wedding client", eventType: "Wedding", message: "We’re planning a wedding for about 200 guests in Lagos. Could you share your availability and full-planning packages?" },
    { subject: "A quote for our company dinner", name: "Sample corporate client", eventType: "Corporate", message: "We’d love support planning a company dinner for 80 guests. Please share a starting estimate for planning, décor and vendor coordination." },
    { subject: "I’d like to book a consultation", name: "Sample birthday client", eventType: "Party", message: "I’m planning a milestone birthday and would like to talk through the venue and style. What does your consultation include?" },
  ].map((example, index): AttentionItem => {
    const inquiry: PlannerInquiry = { ...example, id: `sample-attention-inquiry-${index}`, email: `sample-client-${index + 1}@example.com`, createdAt: `${today}T09:00:00.000Z`, status: "open" };
    return { id: inquiry.id, title: inquiry.subject, context: inquiry.name, detail: "Received today · Sample inquiry", inquiry, sample: true };
  });
  return { payments, inquiries };
}
