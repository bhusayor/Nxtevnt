import { BedDouble, Building2, Camera, ClipboardList, Folder, Music2, Palette, Printer, ShieldCheck, Shirt, Truck, UtensilsCrossed } from "lucide-react";

import { cn } from "@/lib/utils/cn";

export function BudgetGroupIcon({ name, className }: { name: string; className?: string }) {
  const lower = name.toLowerCase();
  const Icon = lower.includes("venue") ? Building2 : lower.includes("cater") ? UtensilsCrossed : lower.includes("decor") ? Palette : lower.includes("music") || lower.includes("entertain") ? Music2 : lower.includes("photo") ? Camera : lower.includes("attire") || lower.includes("beauty") ? Shirt : lower.includes("logistics") || lower.includes("transport") ? Truck : lower.includes("stationery") || lower.includes("printing") ? Printer : lower.includes("security") ? ShieldCheck : lower.includes("accommodation") ? BedDouble : lower.includes("planning") ? ClipboardList : Folder;
  return <Icon aria-hidden="true" className={cn("size-4", className)} strokeWidth={1.8} />;
}
