"use client";

import type { HTMLAttributes, ReactNode, TableHTMLAttributes, ThHTMLAttributes, TdHTMLAttributes } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight } from "@/components/ui/icons";

import { ActionMenu, actionMenuItemClassName } from "@/components/ui/action-menu";
import { IconButton } from "@/components/ui/icon-button";
import { cn } from "@/lib/utils/cn";

type SortDirection = "asc" | "desc" | undefined;

type DataTableProps = TableHTMLAttributes<HTMLTableElement> & {
  mobileContent?: ReactNode;
  containerClassName?: string;
};

export function DataTable({ children, mobileContent, containerClassName, className, ...props }: DataTableProps) {
  return (
    <div className={cn("overflow-hidden rounded-[var(--radius-lg)] border border-border-default bg-surface", containerClassName)}>
      <div className="hidden overflow-x-auto md:block">
        <table className={cn("w-full border-collapse text-left", className)} {...props}>{children}</table>
      </div>
      {mobileContent ? <div className="divide-y divide-border-subtle md:hidden">{mobileContent}</div> : null}
    </div>
  );
}

export function TableHeader({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={cn("border-b border-border-default bg-surface-subtle", className)} {...props} />;
}

export function TableBody({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={cn("divide-y divide-border-subtle", className)} {...props} />;
}

type TableHeadProps = ThHTMLAttributes<HTMLTableCellElement> & {
  sortable?: boolean;
  sortDirection?: SortDirection;
  onSort?: () => void;
};

export function TableHead({ children, sortable, sortDirection, onSort, className, ...props }: TableHeadProps) {
  const Icon = sortDirection === "asc" ? ArrowUp : sortDirection === "desc" ? ArrowDown : ArrowUpDown;
  return (
    <th scope="col" aria-sort={sortDirection === "asc" ? "ascending" : sortDirection === "desc" ? "descending" : undefined} className={cn("h-10 whitespace-nowrap px-4 text-[0.6875rem] font-semibold tracking-[0.025em] text-text-tertiary uppercase", className)} {...props}>
      {sortable ? <button type="button" onClick={onSort} className="inline-flex items-center gap-1.5 rounded-[var(--radius-xs)] hover:text-text-primary"><span>{children}</span><Icon aria-hidden="true" className="size-3.5 text-text-tertiary" /></button> : children}
    </th>
  );
}

export function TableRow({ className, ...props }: HTMLAttributes<HTMLTableRowElement>) {
  return <tr className={cn("transition-colors hover:bg-surface-subtle aria-selected:bg-surface-selected", className)} {...props} />;
}

export function TableCell({ className, ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn("h-12 px-4 py-2 align-middle text-[0.8125rem] text-text-secondary", className)} {...props} />;
}

export function TableActions({ children, label = "Row actions" }: { children: ReactNode; label?: string }) {
  return <div className="ml-auto w-fit"><ActionMenu label={label}>{children}</ActionMenu></div>;
}

export function TableActionItem({ className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type="button" role="menuitem" className={cn(actionMenuItemClassName, className)} {...props} />;
}

type TablePaginationProps = {
  page: number;
  pageCount: number;
  itemLabel?: string;
  onPrevious?: () => void;
  onNext?: () => void;
};

export function TablePagination({ page, pageCount, itemLabel = "results", onPrevious, onNext }: TablePaginationProps) {
  return (
    <div className="flex flex-col gap-3 border-t border-border-subtle px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between">
      <p className="type-body-small text-text-tertiary">Page {page} of {pageCount} · {itemLabel}</p>
      <div className="flex items-center gap-2">
        <IconButton aria-label="Previous page" variant="outline" size="sm" disabled={page <= 1} onClick={onPrevious} icon={<ChevronLeft className="size-4" />} />
        <IconButton aria-label="Next page" variant="outline" size="sm" disabled={page >= pageCount} onClick={onNext} icon={<ChevronRight className="size-4" />} />
      </div>
    </div>
  );
}
