import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils/cn";

export type ProductStatus =
  | "upcoming"
  | "past"
  | "completed"
  | "prospect"
  | "draft"
  | "cancelled"
  | "pending"
  | "paid"
  | "overdue"
  | "partially-paid"
  | "viewed"
  | "responded"
  | "accepted"
  | "declined"
  | "expired"
  | "verified"
  | "unverified"
  | "pending-verification"
  | "action-required"
  | "to-do"
  | "in-progress"
  | "blocked";

const statusStyle: Record<ProductStatus, string> = {
  upcoming: "bg-[var(--status-blue-bg)] text-[var(--status-blue-text)]",
  past: "bg-[var(--status-gray-bg)] text-[var(--status-gray-text)]",
  completed: "bg-[var(--status-green-bg)] text-[var(--status-green-text)]",
  prospect: "bg-[var(--status-lavender-bg)] text-[var(--status-lavender-text)]",
  draft: "bg-[var(--status-gray-bg)] text-[var(--status-gray-text)]",
  cancelled: "bg-[var(--status-rose-bg)] text-[var(--status-rose-text)]",
  pending: "bg-[var(--status-amber-bg)] text-[var(--status-amber-text)]",
  paid: "bg-[var(--status-mint-bg)] text-[var(--status-mint-text)]",
  overdue: "bg-[var(--status-rose-bg)] text-[var(--status-rose-text)]",
  "partially-paid": "bg-[var(--status-blue-bg)] text-[var(--status-blue-text)]",
  viewed: "bg-[var(--status-blue-gray-bg)] text-[var(--status-blue-gray-text)]",
  responded: "bg-[var(--status-lavender-bg)] text-[var(--status-lavender-text)]",
  accepted: "bg-[var(--status-mint-bg)] text-[var(--status-mint-text)]",
  declined: "bg-[var(--status-rose-bg)] text-[var(--status-rose-text)]",
  expired: "bg-[var(--status-gray-bg)] text-[var(--status-gray-text)]",
  verified: "bg-[var(--status-green-bg)] text-[var(--status-green-text)]",
  unverified: "bg-[var(--status-gray-bg)] text-[var(--status-gray-text)]",
  "pending-verification": "bg-[var(--status-amber-bg)] text-[var(--status-amber-text)]",
  "action-required": "bg-[var(--status-peach-bg)] text-[var(--status-peach-text)]",
  "to-do": "bg-[var(--status-gray-bg)] text-[var(--status-gray-text)]",
  "in-progress": "bg-[var(--status-blue-bg)] text-[var(--status-blue-text)]",
  blocked: "bg-[var(--status-rose-bg)] text-[var(--status-rose-text)]",
};

const statusLabel: Record<ProductStatus, string> = {
  upcoming: "Upcoming",
  past: "Past",
  completed: "Completed",
  prospect: "Prospect",
  draft: "Draft",
  cancelled: "Cancelled",
  pending: "Pending",
  paid: "Paid",
  overdue: "Overdue",
  "partially-paid": "Partially paid",
  viewed: "Viewed",
  responded: "Responded",
  accepted: "Accepted",
  declined: "Declined",
  expired: "Expired",
  verified: "Verified",
  unverified: "Unverified",
  "pending-verification": "Pending verification",
  "action-required": "Action required",
  "to-do": "To do",
  "in-progress": "In progress",
  blocked: "Blocked",
};

type StatusBadgeProps = HTMLAttributes<HTMLSpanElement> & {
  status: ProductStatus;
  showDot?: boolean;
};

export function StatusBadge({ status, showDot = true, children, className, ...props }: StatusBadgeProps) {
  return (
    <span className={cn("inline-flex w-fit items-center gap-1.5 whitespace-nowrap rounded-[var(--radius-sm)] px-2 py-1 text-[0.6875rem] font-semibold leading-none", statusStyle[status], className)} {...props}>
      {showDot ? <span aria-hidden="true" className="size-1.5 rounded-full bg-current opacity-75" /> : null}
      {children ?? statusLabel[status]}
    </span>
  );
}
