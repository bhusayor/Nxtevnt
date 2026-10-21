"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { AgendaDialogFrame } from "./agenda-dialogs";
import { agendaExportRows, type AgendaExportAudience } from "@/lib/agenda-export";
import { eventAgenda, type AgendaTrack } from "@/lib/event-agenda";
import type { PlannerEvent } from "@/lib/planner-events";
import { cn } from "@/lib/utils/cn";

export function AgendaExportDialog({ event, track, ids, error, onClose, onExport }: { event: PlannerEvent; track: AgendaTrack; ids: string[]; error?: string; onClose: () => void; onExport: (audience: AgendaExportAudience, vendor?: string) => boolean }) {
  const [audience, setAudience] = useState<AgendaExportAudience>("planner");
  const vendors = (event.agendaSharing?.vendorRecipients || []).filter((vendor) => eventAgenda(event).some((item) => item.agenda.track === "vendor" && item.agenda.visibility === "vendors" && item.agenda.vendorTeam?.trim() === vendor));
  const [vendor, setVendor] = useState(vendors[0] || "");
  const rows = agendaExportRows(event, track, audience, ids, vendor);
  const options = track === "vendor" ? [{ value: "planner", title: "Planner copy", detail: "All selected activities, including internal notes." }, { value: "client", title: "Client copy", detail: "Only client-visible setup activities. No internal notes." }, { value: "vendor", title: "Vendor copy", detail: "Only that vendor’s shared activities. No internal notes." }] : [{ value: "planner", title: "Planner copy", detail: "All selected activities, including internal notes." }, { value: "client", title: "Client copy", detail: "Only published, client-visible activities. No internal notes." }];
  return <AgendaDialogFrame title="Export schedule as PDF" description="Choose the right copy, then select Save as PDF in your browser’s print dialog." onClose={onClose} footer={<><span className="mr-auto text-[0.625rem] text-text-tertiary">{rows.length} activities in this copy</span><Button type="button" variant="ghost" onClick={onClose}>Cancel</Button><Button type="button" disabled={!rows.length} onClick={() => { if (onExport(audience, vendor)) onClose(); }}>Continue to PDF</Button></>}><div className="space-y-3">{options.map((option) => <button key={option.value} type="button" aria-pressed={audience === option.value} onClick={() => setAudience(option.value as AgendaExportAudience)} className={cn("w-full rounded-xl border p-4 text-left", audience === option.value ? "border-brand-primary/40 bg-[#f5f8f5]" : "border-border-subtle")}><span className="block text-xs font-semibold">{option.title}</span><span className="mt-1 block text-xs leading-5 text-text-secondary">{option.detail}</span></button>)}{audience === "vendor" && <Select label="Vendor / team" value={vendor} onValueChange={setVendor} options={vendors.map((value) => ({ value, label: value }))} placeholder="Share the setup timeline with a vendor first" />}{!rows.length && <p className="rounded-lg bg-background-subtle p-3 text-xs leading-5 text-text-secondary">No activities are available for this copy. Check your filters and sharing settings.</p>}<p className="pt-2 text-[0.6875rem] leading-5 text-text-tertiary">Exports use your current search, date and visibility filters. Nothing is sent to a client or vendor.</p>{error && <p role="alert" className="text-xs text-error">{error}</p>}</div></AgendaDialogFrame>;
}
