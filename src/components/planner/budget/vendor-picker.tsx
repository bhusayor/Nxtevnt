"use client";

import { useRef, useState } from "react";
import { Search } from "lucide-react";

export function VendorPicker({ value, onChange, vendors }: { value: string; onChange: (value: string) => void; vendors: string[] }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const root = useRef<HTMLDivElement>(null);
  const matches = vendors.filter((vendor) => vendor.toLowerCase().includes(query.trim().toLowerCase()));
  return <div ref={root} className="relative" onBlur={(event) => { if (!root.current?.contains(event.relatedTarget)) setOpen(false); }}>
    <label className="mb-2 block text-xs font-semibold text-text-primary">Vendor <span className="font-normal text-text-tertiary">Optional</span></label>
    <button type="button" aria-expanded={open} onClick={() => { setQuery(""); setOpen((current) => !current); }} className="flex h-10 w-full items-center justify-between gap-2 rounded-lg border border-border-default bg-white px-3.5 text-left text-xs hover:border-border-strong"><span className={value ? "truncate text-text-primary" : "truncate text-text-tertiary"}>{value || "Select or search a vendor"}</span><Search className="size-4 shrink-0 text-text-tertiary" /></button>
    {open && <div className="absolute left-0 right-0 top-[calc(100%+5px)] z-30 overflow-hidden rounded-lg border border-border-default bg-white shadow-[var(--shadow-md)]"><div className="border-b border-border-subtle p-2"><input autoFocus aria-label="Search vendors" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search saved vendors" className="h-9 w-full rounded-md border border-border-default px-3 text-xs outline-none focus:border-brand-primary" /></div><div className="max-h-40 overflow-y-auto p-1">{value && <button type="button" onClick={() => { onChange(""); setOpen(false); }} className="block w-full rounded-md px-3 py-2 text-left text-xs text-text-secondary hover:bg-background-subtle">No vendor yet</button>}{matches.map((vendor) => <button key={vendor} type="button" onClick={() => { onChange(vendor); setOpen(false); }} className="block w-full rounded-md px-3 py-2 text-left text-xs hover:bg-background-subtle">{vendor}</button>)}{!matches.length && <p className="px-3 py-2 text-xs text-text-tertiary">No saved vendor matches.</p>}{query.trim() && !vendors.some((vendor) => vendor.toLowerCase() === query.trim().toLowerCase()) && <button type="button" onClick={() => { onChange(query.trim()); setOpen(false); }} className="block w-full rounded-md px-3 py-2 text-left text-xs font-semibold text-brand-primary hover:bg-background-subtle">Use “{query.trim()}” for this item</button>}</div><p className="border-t border-border-subtle px-3 py-2 text-[0.6875rem] text-text-tertiary">Searches vendors already used in your budgets.</p></div>}
  </div>;
}
