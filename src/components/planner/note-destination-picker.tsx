"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Check, Folder, Handshake, Link2, LockSimple, Plus, Search, Users, X } from "@/components/ui/icons";
import { usePlannerClients } from "@/lib/planner-clients";
import { addPlannerProspect, usePlannerProspects } from "@/lib/planner-prospects";
import { useWorkspaceNotes } from "@/lib/planner-workspace-notes";
import type { PlannerEvent } from "@/lib/planner-events";
import { cn } from "@/lib/utils/cn";

type Tab = "prospects" | "clients" | "events";

export function destinationLabel(value: string, events: readonly PlannerEvent[], clients: readonly { id: string; name: string }[], prospects: readonly { id: string; name: string }[]) {
  if (value === "mine") return "My notebook";
  if (value === "leads") return "Leads";
  if (value.startsWith("event:")) return events.find((event) => event.id === value.slice(6))?.name || "Event notebook";
  if (value.startsWith("prospect:")) return prospects.find((person) => person.id === value.slice(9))?.name || "Prospect notebook";
  if (value.startsWith("client:")) return clients.find((person) => person.id === value.slice(7))?.name || "Client notebook";
  return "Choose notebook or person…";
}

export function NoteDestinationPicker({ value, onChange, events, className, compact = false, initialTab = "prospects", triggerContent }: {
  value: string;
  onChange: (value: string) => void;
  events: readonly PlannerEvent[];
  className?: string;
  compact?: boolean;
  initialTab?: Tab;
  triggerContent?: ReactNode;
}) {
  const clients = usePlannerClients();
  const prospects = usePlannerProspects();
  const notes = useWorkspaceNotes();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>(initialTab);
  const [query, setQuery] = useState("");
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [error, setError] = useState("");
  const container = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const [dialogHost, setDialogHost] = useState<HTMLElement | null>(null);
  const [position, setPosition] = useState({ top: 0, left: 0, maxHeight: 480 });
  const attach = useCallback((node: HTMLDivElement | null) => {
    container.current = node;
    setDialogHost(node?.closest<HTMLElement>("[data-note-dialog]") || null);
  }, []);
  useLayoutEffect(() => {
    if (!open) return;
    function place() {
      const trigger = container.current?.getBoundingClientRect();
      const dialog = container.current?.closest<HTMLElement>("[data-note-dialog]")?.getBoundingClientRect();
      if (!trigger || !dialog) return;
      const panelWidth = compact ? 350 : 550;
      const panelHeight = compact ? 370 : 480;
      const desiredHeight = panel.current?.scrollHeight || panelHeight;
      const below = window.innerHeight - trigger.bottom - 16;
      const above = trigger.top - 16;
      const openAbove = below < desiredHeight && above > below;
      const maxHeight = Math.min(panelHeight, Math.max(180, openAbove ? above : below));
      const height = Math.min(desiredHeight, maxHeight);
      setPosition({
        top: openAbove ? trigger.top - dialog.top - height - 8 : trigger.bottom - dialog.top + 8,
        left: Math.min(trigger.left - dialog.left, Math.max(0, dialog.width - Math.min(panelWidth, window.innerWidth - 48) - 12)),
        maxHeight,
      });
    }
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => { window.removeEventListener("resize", place); window.removeEventListener("scroll", place, true); };
  }, [open, tab, adding, compact]);
  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => { if (event.target instanceof Node && !container.current?.contains(event.target) && !panel.current?.contains(event.target)) setOpen(false); };
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") { event.stopPropagation(); setOpen(false); } };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("pointerdown", outside); document.removeEventListener("keydown", escape); };
  }, [open]);

  function choose(next: string) { onChange(next); setOpen(false); setQuery(""); setError(""); }
  function addProspect() {
    try { const prospect = addPlannerProspect(newName); setNewName(""); setAdding(false); choose(`prospect:${prospect.id}`); }
    catch (problem) { setError(problem instanceof Error ? problem.message : "Could not add prospect."); }
  }
  const people = tab === "prospects" ? [
    { id: "unassigned", name: "General leads", destination: "leads", count: notes.filter((note) => note.notebook === "leads" && !note.person && !note.archivedAt).length },
    ...prospects.map((person) => ({ ...person, destination: `prospect:${person.id}`, count: notes.filter((note) => note.person?.type === "prospect" && note.person.id === person.id && !note.archivedAt).length })),
  ]
    : tab === "clients" ? clients.map((person) => ({ ...person, destination: `client:${person.id}`, count: notes.filter((note) => note.person?.type === "client" && note.person.id === person.id && !note.archivedAt).length }))
      : events.map((event) => ({ id: event.id, name: event.name, destination: `event:${event.id}`, count: null }));
  const visible = people.filter((person) => person.name.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()));
  const label = destinationLabel(value, events, clients, prospects);
  return <div ref={attach} className={cn("relative min-w-0", className)}>
    <button type="button" aria-label={triggerContent ? initialTab === "events" ? "Move to event notebook" : "Save as prospect" : "Choose notebook or person"} aria-expanded={open} aria-haspopup="dialog" onClick={() => { setTab(initialTab); setOpen((current) => !current); }} className="flex h-11 w-full min-w-0 items-center gap-2 rounded-xl border border-border-default bg-white px-3 text-left text-sm text-text-primary transition-colors hover:border-border-strong focus-visible:outline-2 focus-visible:outline-brand-primary">{!triggerContent && <Link2 className="size-4 shrink-0 text-text-tertiary" aria-hidden="true" />}<span className="min-w-0 flex-1 truncate">{triggerContent || label}</span></button>
    {open && dialogHost && createPortal(<div ref={panel} role="dialog" aria-label="Who is this note for?" style={position} className={cn("absolute z-[100] flex flex-col overflow-y-auto rounded-2xl border border-border-subtle bg-white shadow-[var(--shadow-lg)]", compact ? "w-[min(350px,calc(100vw-3rem))] p-3" : "w-[min(550px,calc(100vw-3rem))] p-3 sm:p-4")}><h3 className={cn("px-1 font-semibold text-text-primary", compact ? "pb-1 text-sm" : "pb-2 text-base")}>Who is this note for?</h3><button type="button" onClick={() => choose("mine")} className={cn("flex items-center gap-3 rounded-xl px-3 text-left hover:bg-background-subtle", compact ? "min-h-11" : "min-h-14")}><LockSimple className="size-5 shrink-0 text-brand-primary" aria-hidden="true" /><span className="min-w-0 flex-1"><span className="block text-sm font-semibold">My notebook</span><span className="block text-xs text-text-tertiary">Not linked to a person · only you</span></span>{value === "mine" && <Check className="size-5 text-brand-primary" aria-hidden="true" />}</button>
      <div role="tablist" aria-label="Notebook type" className={cn("grid grid-cols-3 rounded-xl bg-background-subtle p-1", compact ? "mt-2" : "mt-3")}>{([{ id: "prospects", label: "Prospects", icon: Handshake }, { id: "clients", label: "Clients", icon: Users }, { id: "events", label: "Events", icon: Folder }] as const).map((item) => { const Icon = item.icon; return <button key={item.id} type="button" role="tab" aria-selected={tab === item.id} onClick={() => { setTab(item.id); setQuery(""); setAdding(false); }} className={cn("flex min-h-9 items-center justify-center gap-1.5 rounded-lg px-2 text-xs font-semibold", tab === item.id ? "bg-white text-brand-primary shadow-sm" : "text-text-secondary hover:text-text-primary")}><Icon className="size-4" aria-hidden="true" />{item.label}</button>; })}</div>
      <div className={cn("relative", compact ? "mt-2" : "mt-3")}><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-tertiary" aria-hidden="true" /><input type="search" aria-label="Search notebooks by name" placeholder="Search by name…" value={query} onChange={(event) => setQuery(event.target.value)} className="h-10 w-full rounded-xl border border-border-default bg-white pl-9 pr-3 text-sm outline-none focus:border-brand-primary" /></div><p className={cn("px-1 pb-1 text-xs text-text-tertiary", compact ? "pt-2" : "pt-3")}>{tab === "prospects" ? "Prospect notebooks" : tab === "clients" ? "Client notebooks" : "Event notebooks"}</p><div className={cn("min-h-12 shrink overflow-y-auto", compact ? "max-h-28" : "max-h-44")}>{visible.length ? visible.map((person) => <button type="button" key={person.destination} onClick={() => choose(person.destination)} className="flex min-h-12 w-full items-center justify-between gap-3 rounded-lg px-3 text-left hover:bg-background-subtle"><span className="min-w-0"><span className="block truncate text-sm font-medium text-text-primary">{person.name}</span><span className="block text-xs text-text-tertiary">{person.count === null ? "Shared with your team" : `${person.count} ${person.count === 1 ? "note" : "notes"} · only you`}</span></span>{value === person.destination && <Check className="size-4 shrink-0 text-brand-primary" aria-hidden="true" />}</button>) : <p className="px-3 py-5 text-sm text-text-tertiary">{query ? "No matching notebooks." : `No ${tab} yet.`}</p>}</div>
      {tab === "prospects" && <div className="mt-2 border-t border-border-subtle pt-3">{adding ? <div className="flex gap-2"><input autoFocus aria-label="New prospect name" value={newName} onChange={(event) => { setNewName(event.target.value); setError(""); }} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addProspect(); } }} placeholder="Prospect name" className="h-10 min-w-0 flex-1 rounded-lg border border-border-default px-3 text-sm outline-none focus:border-brand-primary" /><button type="button" onClick={addProspect} className="rounded-lg bg-brand-primary px-3 text-xs font-semibold text-white">Add</button><button type="button" aria-label="Cancel new prospect" onClick={() => { setAdding(false); setError(""); }} className="flex size-10 items-center justify-center rounded-lg text-text-tertiary"><X className="size-4" /></button></div> : <button type="button" onClick={() => setAdding(true)} className="flex min-h-10 w-full items-center gap-2 rounded-lg border border-border-default px-3 text-left text-sm font-semibold text-brand-primary hover:bg-background-subtle"><Plus className="size-4" />Add new prospect</button>}{error && <p role="alert" className="mt-2 text-xs text-error">{error}</p>}</div>}
    </div>, dialogHost)}
  </div>;
}
