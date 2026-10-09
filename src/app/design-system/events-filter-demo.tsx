"use client";

import { useState } from "react";
import { ArrowUpDown, CalendarRange, SlidersHorizontal, UserRound } from "lucide-react";

import { DateInput } from "@/components/ui/date-time-input";
import { ActiveFilters, FilterBar, FilterChip, FilterDropdown, MobileFilterSheet, ViewSwitcher } from "@/components/ui/filter-bar";
import { SearchInput } from "@/components/ui/search-input";
import { Select } from "@/components/ui/select";

const statusOptions = [{ label: "All statuses", value: "all" }, { label: "Upcoming", value: "upcoming" }, { label: "Prospect", value: "prospect" }, { label: "Completed", value: "completed" }];
const eventTypes = [{ label: "All event types", value: "all" }, { label: "Wedding", value: "wedding" }, { label: "Corporate", value: "corporate" }, { label: "Private event", value: "private" }];
const clients = [{ label: "All clients", value: "all" }, { label: "Ada Okafor", value: "ada" }, { label: "Vela Group", value: "vela" }];
const sortOptions = [{ label: "Soonest date", value: "date" }, { label: "Event name", value: "name" }, { label: "Highest budget", value: "budget" }];
const dateOptions = [{ label: "Any date", value: "all" }, { label: "This month", value: "month" }, { label: "This quarter", value: "quarter" }, { label: "This year", value: "year" }];

type ActiveChip = { key: "status" | "date" | "eventType" | "client"; label: string };

export function EventsFilterDemo() {
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"list" | "grid">("list");
  const [status, setStatus] = useState("upcoming");
  const [date, setDate] = useState("quarter");
  const [eventType, setEventType] = useState("all");
  const [client, setClient] = useState("all");
  const [sort, setSort] = useState("date");
  const [chips, setChips] = useState<ActiveChip[]>([{ key: "status", label: "Upcoming" }, { key: "date", label: "This quarter" }]);

  const updateChip = (key: ActiveChip["key"], label?: string) => setChips((current) => label ? [...current.filter((chip) => chip.key !== key), { key, label }] : current.filter((chip) => chip.key !== key));
  const optionLabel = (options: { label: string; value: string }[], value: string) => options.find((option) => option.value === value)?.label;
  const removeChip = (key: ActiveChip["key"]) => {
    if (key === "status") setStatus("all");
    if (key === "date") setDate("all");
    if (key === "eventType") setEventType("all");
    if (key === "client") setClient("all");
    updateChip(key);
  };
  const clearFilters = () => { setStatus("all"); setDate("all"); setEventType("all"); setClient("all"); setChips([]); };

  const filterFields = <><Select label="Status" value={status} onValueChange={(value) => { setStatus(value); updateChip("status", value === "all" ? undefined : optionLabel(statusOptions, value)); }} options={statusOptions} /><Select label="Event type" value={eventType} onValueChange={(value) => { setEventType(value); updateChip("eventType", value === "all" ? undefined : optionLabel(eventTypes, value)); }} options={eventTypes} /><Select label="Client" value={client} onValueChange={(value) => { setClient(value); updateChip("client", value === "all" ? undefined : optionLabel(clients, value)); }} options={clients} /><div className="grid grid-cols-2 gap-3"><DateInput label="From" defaultValue="2026-10-08" /><DateInput label="To" defaultValue="2027-01-31" /></div><Select label="Sort by" value={sort} onValueChange={setSort} options={sortOptions} /></>;

  return (
    <div className="overflow-hidden rounded-[var(--radius-lg)] border border-border-default bg-surface">
      <div className="flex flex-col gap-3 p-3 lg:flex-row lg:items-center">
        <div className="min-w-0 flex-1 lg:max-w-[17rem]"><SearchInput className="h-9 shadow-none" value={search} onChange={(event) => setSearch(event.target.value)} onClear={() => setSearch("")} placeholder="Search events…" /></div>
        <FilterBar activeCount={chips.length} mobileFilters={filterFields}>
          <FilterDropdown label="Status" value={status} options={statusOptions} active={status !== "all"} onValueChange={(value) => { setStatus(value); updateChip("status", value === "all" ? undefined : optionLabel(statusOptions, value)); }} />
          <FilterDropdown label="Date" value={date} options={dateOptions} active={date !== "all"} icon={<CalendarRange className="size-3.5" />} onValueChange={(value) => { setDate(value); updateChip("date", value === "all" ? undefined : optionLabel(dateOptions, value)); }} />
          <FilterDropdown label="Event type" value={eventType} options={eventTypes} active={eventType !== "all"} onValueChange={(value) => { setEventType(value); updateChip("eventType", value === "all" ? undefined : optionLabel(eventTypes, value)); }} />
          <FilterDropdown label="Client" value={client} options={clients} active={client !== "all"} icon={<UserRound className="size-3.5" />} onValueChange={(value) => { setClient(value); updateChip("client", value === "all" ? undefined : optionLabel(clients, value)); }} />
          <FilterDropdown label="Sort" value={sort} options={sortOptions} align="end" icon={<ArrowUpDown className="size-3.5" />} onValueChange={setSort} />
        </FilterBar>
        <div className="hidden lg:block"><ViewSwitcher value={view} onChange={setView} /></div>
        <div className="flex items-center justify-between lg:hidden"><span className="inline-flex items-center gap-2 text-xs font-semibold text-text-tertiary"><SlidersHorizontal className="size-3.5" />{chips.length} active</span><ViewSwitcher value={view} onChange={setView} /></div>
      </div>
      {chips.length ? <div className="border-t border-border-subtle px-3 py-2.5"><ActiveFilters count={chips.length} onClear={clearFilters}>{chips.map((chip) => <FilterChip key={chip.key} onRemove={() => removeChip(chip.key)}>{chip.label}</FilterChip>)}</ActiveFilters></div> : null}
      <div className="hidden items-center justify-between border-t border-border-subtle bg-surface-subtle px-3 py-2.5 lg:flex"><p className="text-xs text-text-tertiary">On smaller layouts, the toolbar collapses to a single filter control.</p><MobileFilterSheet activeCount={chips.length}>{filterFields}</MobileFilterSheet></div>
    </div>
  );
}
