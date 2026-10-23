"use client";

import { ChevronDown, Circle, CircleDashed, LockSimple } from "@/components/ui/icons";
import { ActionMenu } from "@/components/ui/action-menu";
import { budgetStatuses, vendorStatuses, type PaymentStatus, type VendorStatus } from "@/lib/planner-budget";
import { cn } from "@/lib/utils/cn";

const paymentTones: Record<PaymentStatus, string> = {
  unpaid: "bg-[#f1f2f1] text-[#66716c]", upcoming: "bg-[#f2eef9] text-[#745d90]",
  "partially-paid": "bg-[#eaf2fa] text-[#4b7092]", paid: "bg-[#e8f5ef] text-[#376e55]",
  overdue: "bg-[#fbeceb] text-[#a35250]", cancelled: "bg-[#f5eeee] text-[#8d6565]",
};
const vendorTones: Record<VendorStatus, string> = { "not-sourced": "bg-[#f1f2f1] text-[#66716c]", sourcing: "bg-[#fcf3e5] text-[#8b6637]", booked: "bg-[#eaf4ed] text-[#416b4d]" };
const badgeClass = "inline-flex w-fit items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-1 text-sm font-semibold leading-5";

export function BudgetStatusBadge({ status }: { status: PaymentStatus }) {
  return <span className={cn(badgeClass, paymentTones[status])}>{status === "cancelled" ? "Cancelled" : budgetStatuses.find((item) => item.value === status)?.label ?? status}</span>;
}

export function VendorStatusBadge({ status }: { status: VendorStatus }) {
  return <span className={cn(badgeClass, vendorTones[status])}>{vendorStatuses.find((item) => item.value === status)?.label ?? status}</span>;
}

export function BookingStatusButton({ status, name, onStatusChange }: { status: VendorStatus; name: string; onStatusChange: (status: VendorStatus) => void }) {
  const label = vendorStatuses.find((entry) => entry.value === status)?.label;
  const icons = { "not-sourced": <CircleDashed />, sourcing: <Circle />, booked: <LockSimple /> };
  return <ActionMenu contentClassName="[&_[role=menuitem]]:text-sm [&_[role=menuitemradio]]:text-sm [&>p]:text-xs [&>div]:text-xs" label={`Booking status for ${name}: ${label}`} heading="Booking status" footer="Set by you. A vendor isn’t required to mark something as booked." triggerContent={<>{label}<ChevronDown className="size-3 shrink-0 opacity-60" aria-hidden="true" /></>} triggerClassName={cn(badgeClass, "h-8 w-auto transition-shadow hover:ring-2 hover:ring-brand-primary/15", vendorTones[status])} items={vendorStatuses.map((entry) => ({ label: entry.label, icon: icons[entry.value], selected: entry.value === status, onSelect: () => { if (entry.value !== status) onStatusChange(entry.value); } }))} />;
}
