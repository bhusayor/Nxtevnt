import { formatBudgetMoney } from "@/lib/planner-budget";
import type { PlannerInquiry } from "@/lib/planner-business";
import { dateKey } from "@/lib/planner-dashboard";
import { formatEventDate, type EventItem, type PlannerEvent } from "@/lib/planner-events";
import type { PlannerVendorReply } from "@/lib/planner-vendor-replies";
import type { BudgetItem } from "@/lib/planner-budget";

export type AttentionTab = "tasks" | "payments" | "inquiries" | "vendors";
export type AttentionItem = {
  id: string; title: string; context: string; detail: string; href?: string;
  filterDate?: string;
  inquiry?: PlannerInquiry; overdue?: boolean; eventId?: string; task?: EventItem;
  vendorReply?: PlannerVendorReply;
  budgetItem?: BudgetItem;
  sample?: boolean;
  samplePayment?: { amount: number; currency: string; vendor: string; date: string; eventName: string };
};

export const isSampleInquiry = (inquiry: PlannerInquiry | null) => Boolean(inquiry?.id.startsWith("sample-attention-inquiry-"));
export const isSampleVendorReply = (reply: PlannerVendorReply | null) => Boolean(reply?.id.startsWith("sample-attention-vendor-"));

export function attentionExamples(today: string, event?: PlannerEvent): Pick<Record<AttentionTab, AttentionItem[]>, "payments" | "inquiries" | "vendors"> {
  const day = (offset: number) => { const date = new Date(`${today}T12:00:00`); date.setDate(date.getDate() + offset); return dateKey(date); };
  const payments = [
    { title: "Venue deposit", vendor: "The Grand Hall", eventName: "Ada & Tunde’s wedding", amount: 350000, offset: 0 },
    { title: "Décor installment", vendor: "Bloom & Co Decor", eventName: "Ada & Tunde’s wedding", amount: 180000, offset: 2 },
    { title: "Photography balance", vendor: "Lens & Light", eventName: "Favour’s birthday", amount: 120000, offset: 5 },
  ].map((payment, index): AttentionItem => {
    const date = day(payment.offset);
    return { id: `sample-attention-payment-${index}`, title: payment.title, context: `${payment.eventName} · ${payment.vendor}`, detail: `${formatBudgetMoney(payment.amount, "NGN")} · ${payment.offset === 0 ? "Due today" : `Due ${formatEventDate(date, { day: "numeric", month: "short" })}`}`, sample: true, samplePayment: { ...payment, date, currency: "NGN" } };
  });
  const inquiries = [
    { subject: "Are you available for our wedding?", name: "Ada Okeke", eventType: "Wedding", eventDate: day(45), location: "Lagos, Nigeria", guestCount: 200, budgetMin: 25000000, budgetMax: 30000000, services: ["Full planning", "Venue sourcing", "Vendor coordination"], message: "We’re planning a wedding for about 200 guests in Lagos. Could you share your availability and full-planning packages?" },
    { subject: "A quote for our company dinner", name: "Daniel Akinwale", eventType: "Corporate", eventDate: day(60), location: "Victoria Island, Lagos", guestCount: 80, budgetMin: 8000000, budgetMax: 12000000, services: ["Full planning", "Décor & styling"], message: "We’d love support planning a company dinner for 80 guests. Please share a starting estimate for planning, décor and vendor coordination." },
    { subject: "I’d like to book a consultation", name: "Favour Adeyemi", eventType: "Party", eventDate: day(90), location: "Abuja, Nigeria", guestCount: 50, budgetMin: 4000000, budgetMax: 6000000, services: ["Venue sourcing", "Vendor coordination"], message: "I’m planning a milestone birthday and would like to talk through the venue and style. What does your consultation include?" },
  ].map((example, index): AttentionItem => {
    const inquiry: PlannerInquiry = { ...example, id: `sample-attention-inquiry-${index}`, email: `client-${index + 1}@example.com`, createdAt: `${day(-index)}T09:00:00.000Z`, receivedVia: "NXTEVNT profile", currency: "NGN", status: "open" };
    return { id: inquiry.id, title: inquiry.subject, context: inquiry.name, detail: `Received ${formatEventDate(inquiry.createdAt.slice(0, 10), { day: "numeric", month: "short", year: "numeric" })}`, inquiry, sample: true };
  });
  const vendors: AttentionItem[] = event ? (() => {
    const reply: PlannerVendorReply = {
      id: `sample-attention-vendor-${event.id}`, eventId: event.id, vendor: "Bloomhouse NG", subject: "Reception florals & styling",
      category: "Florals & styling", requestedService: "Reception florals & styling", requestedEventDate: event.date,
      receivedVia: "Quote response", originalRequest: `Please confirm availability for ${event.name}. We need floral centrepieces, a welcome arrangement and stage florals. Please share your quote, including setup and collection.`,
      message: "Thank you for thinking of Bloomhouse! We're available on your requested date and would love to take this on. I've attached our proposed floral package. Once the look is agreed, we can finalise the scope and payment terms.",
      acceptedRequest: true, quotedAmount: 2500000,
      attachments: [{ id: "sample-bloomhouse-floral-quote", name: "Bloomhouse-floral-quote.pdf", type: "application/pdf", size: 1752, sourceUrl: "/quotes/bloomhouse-floral-quote.pdf" }],
      createdAt: `${day(-1)}T09:00:00.000Z`, status: "unread",
    };
    return [{ id: reply.id, title: reply.subject, context: `${reply.vendor} · ${event.name}`, detail: `Received ${formatEventDate(reply.createdAt.slice(0, 10), { day: "numeric", month: "short" })}`, vendorReply: reply, eventId: event.id, sample: true }];
  })() : [];
  return { payments, inquiries, vendors };
}
