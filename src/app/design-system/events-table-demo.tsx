"use client";

import { useMemo, useState } from "react";
import { CalendarDays, MapPin } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { DataTable, TableActionItem, TableActions, TableBody, TableCell, TableHead, TableHeader, TablePagination, TableRow } from "@/components/ui/data-table";
import { StatusBadge, type ProductStatus } from "@/components/ui/status-badge";

type EventRecord = {
  name: string;
  initials: string;
  type: string;
  client: string;
  date: string;
  dateValue: number;
  location: string;
  status: ProductStatus;
  budget: number;
  progress: number;
};

const events: EventRecord[] = [
  { name: "Ada & Chidi’s Celebration", initials: "AC", type: "Wedding", client: "Ada Okafor", date: "18 Dec 2026", dateValue: 20261218, location: "Lagos", status: "upcoming", budget: 18500000, progress: 68 },
  { name: "Vela Annual Dinner", initials: "VA", type: "Corporate", client: "Vela Group", date: "04 Nov 2026", dateValue: 20261104, location: "Abuja", status: "in-progress", budget: 9200000, progress: 42 },
  { name: "Maya’s 40th", initials: "M4", type: "Private event", client: "Maya Bello", date: "22 Jan 2027", dateValue: 20270122, location: "Lagos", status: "prospect", budget: 4800000, progress: 16 },
  { name: "Northstar Launch", initials: "NL", type: "Brand event", client: "Northstar", date: "12 Sep 2026", dateValue: 20260912, location: "Accra", status: "completed", budget: 12750000, progress: 100 },
  { name: "Tomi & Jude", initials: "TJ", type: "Wedding", client: "Tomi Adeyemi", date: "14 Feb 2027", dateValue: 20270214, location: "Ibadan", status: "draft", budget: 7600000, progress: 8 },
  { name: "Founders’ Retreat", initials: "FR", type: "Corporate", client: "Kora Labs", date: "08 Mar 2027", dateValue: 20270308, location: "Abeokuta", status: "pending", budget: 6100000, progress: 25 },
];

type SortKey = "name" | "dateValue" | "budget" | "progress";

export function EventsTableDemo() {
  const [sortKey, setSortKey] = useState<SortKey>("dateValue");
  const [direction, setDirection] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const pageSize = 3;

  const sorted = useMemo(() => [...events].sort((a, b) => {
    const left = a[sortKey];
    const right = b[sortKey];
    const result = typeof left === "string" ? left.localeCompare(String(right)) : left - Number(right);
    return direction === "asc" ? result : -result;
  }), [sortKey, direction]);
  const visible = sorted.slice((page - 1) * pageSize, page * pageSize);

  const sort = (key: SortKey) => {
    if (key === sortKey) setDirection((current) => current === "asc" ? "desc" : "asc");
    else { setSortKey(key); setDirection("asc"); }
    setPage(1);
  };
  const sortDirection = (key: SortKey) => sortKey === key ? direction : undefined;

  const mobileContent = visible.map((event) => (
    <article key={event.name} className="grid gap-4 p-4">
      <div className="flex items-start gap-3"><span className="flex size-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-brand-secondary text-xs font-bold text-brand-primary">{event.initials}</span><div className="min-w-0 flex-1"><h3 className="type-label-large truncate text-text-primary">{event.name}</h3><p className="type-body-small text-text-tertiary">{event.client} · {event.type}</p></div><StatusBadge status={event.status} /></div>
      <div className="grid grid-cols-2 gap-3 text-xs text-text-secondary"><span className="flex items-center gap-1.5"><CalendarDays aria-hidden="true" className="size-3.5" />{event.date}</span><span className="flex items-center gap-1.5"><MapPin aria-hidden="true" className="size-3.5" />{event.location}</span><span className="font-semibold tabular-nums text-text-primary">₦{(event.budget / 1000000).toFixed(1)}m</span><span>{event.progress}% planned</span></div>
      <div className="flex items-center justify-between"><Badge>{event.type}</Badge><TableActions><TableActionItem>Open event</TableActionItem><TableActionItem>Duplicate</TableActionItem></TableActions></div>
    </article>
  ));

  return (
    <div>
      <DataTable aria-label="Events" mobileContent={mobileContent} containerClassName="rounded-none border-b-0">
        <TableHeader><TableRow className="hover:bg-surface-subtle"><TableHead sortable sortDirection={sortDirection("name")} onSort={() => sort("name")}>Event</TableHead><TableHead>Client</TableHead><TableHead sortable sortDirection={sortDirection("dateValue")} onSort={() => sort("dateValue")}>Date</TableHead><TableHead>Location</TableHead><TableHead>Status</TableHead><TableHead className="text-right" sortable sortDirection={sortDirection("budget")} onSort={() => sort("budget")}>Budget</TableHead><TableHead sortable sortDirection={sortDirection("progress")} onSort={() => sort("progress")}>Progress</TableHead><TableHead className="w-14"><span className="sr-only">Actions</span></TableHead></TableRow></TableHeader>
        <TableBody>{visible.map((event, index) => <TableRow key={event.name} aria-selected={index === 1}><TableCell><div className="flex min-w-52 items-center gap-3"><span className="flex size-8 shrink-0 items-center justify-center rounded-[var(--radius-sm)] border border-border-subtle bg-surface text-[0.625rem] font-bold text-brand-primary">{event.initials}</span><div><p className="font-semibold text-text-primary">{event.name}</p><p className="text-[0.6875rem] text-text-tertiary">{event.type}</p></div></div></TableCell><TableCell>{event.client}</TableCell><TableCell className="whitespace-nowrap">{event.date}</TableCell><TableCell>{event.location}</TableCell><TableCell><StatusBadge status={event.status} /></TableCell><TableCell className="text-right whitespace-nowrap font-medium tabular-nums text-text-primary">₦{event.budget.toLocaleString("en-NG")}</TableCell><TableCell><div className="flex min-w-24 items-center gap-2"><div className="h-1 flex-1 rounded-full bg-border-subtle"><div className="h-full rounded-full bg-brand-primary" style={{ width: `${event.progress}%` }} /></div><span className="w-8 text-right text-xs tabular-nums">{event.progress}%</span></div></TableCell><TableCell><TableActions><TableActionItem>Open event</TableActionItem><TableActionItem>Duplicate</TableActionItem><TableActionItem className="text-error">Archive</TableActionItem></TableActions></TableCell></TableRow>)}</TableBody>
      </DataTable>
      <div className="rounded-b-[var(--radius-lg)] border-x border-b border-border-default bg-surface"><TablePagination page={page} pageCount={2} itemLabel={`${events.length} events`} onPrevious={() => setPage((current) => Math.max(1, current - 1))} onNext={() => setPage((current) => Math.min(2, current + 1))} /></div>
    </div>
  );
}
