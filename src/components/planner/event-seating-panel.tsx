"use client";

import { useRef, useState, type ChangeEvent, type FormEvent, type PointerEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Pencil, Plus, Trash2, Upload, X } from "@/components/ui/icons";
import { cn } from "@/lib/utils/cn";
import { type EventGuest, type GuestTable, type GuestWorkspaceData } from "@/lib/event-guests";

type Space = GuestTable["space"];
type Props = {
  data: GuestWorkspaceData;
  save: (recipe: (current: GuestWorkspaceData) => GuestWorkspaceData) => void;
  notice: (message: string) => void;
};

const colors = ["#e89a18", "#1cad7e", "#6665e8", "#d94991", "#4b90c4"];
const initialPositions = [{ x: 17, y: 24 }, { x: 55, y: 30 }, { x: 25, y: 70 }, { x: 55, y: 70 }];
const seatId = (guest: EventGuest, space: Space) => space === "Reception" ? guest.tableId : guest.ceremonyTableId;
const clamp = (value: number) => Math.max(5, Math.min(95, value));

export function EventSeatingPanel({ data, save, notice }: Props) {
  const [space, setSpace] = useState<Space>("Reception");
  const [view, setView] = useState<"tables" | "floor">("tables");
  const [selected, setSelected] = useState("");
  const [renaming, setRenaming] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [capacity, setCapacity] = useState("8");
  const [batchCount, setBatchCount] = useState("5");
  const [batchCapacity, setBatchCapacity] = useState("8");
  const [dragPosition, setDragPosition] = useState<{ id: string; x: number; y: number } | null>(null);
  const planInput = useRef<HTMLInputElement>(null);
  const tables = data.tables.filter((table) => table.space === space);
  const active = tables.find((table) => table.id === selected);
  const seated = active ? data.guests.filter((guest) => seatId(guest, space) === active.id) : [];
  const available = data.guests.filter((guest) => guest.rsvp === "coming" && !seatId(guest, space));
  const floorPlan = data.floorPlans?.[space];

  function chooseSpace(next: Space) { setSpace(next); setSelected(""); setRenaming(false); setDragPosition(null); }
  function chooseTable(id: string) { setSelected(id); setRenaming(false); }
  function renameTable(event: FormEvent) {
    event.preventDefault();
    if (!active) return;
    const nextName = draftName.trim();
    if (!nextName) { notice("Enter a table name."); return; }
    if (tables.some((table) => table.id !== active.id && table.name.toLowerCase() === nextName.toLowerCase())) { notice("A table in this space already has that name."); return; }
    save((current) => ({ ...current, tables: current.tables.map((table) => table.id === active.id ? { ...table, name: nextName } : table) }));
    setRenaming(false);
  }
  function addTable(event: FormEvent) {
    event.preventDefault();
    const seats = Number(capacity);
    if (!name.trim() || !Number.isInteger(seats) || seats < 1 || seats > 100) { notice("Enter a table name and a capacity from 1 to 100."); return; }
    const table: GuestTable = { id: crypto.randomUUID(), name: name.trim(), capacity: seats, space, color: colors[tables.length % colors.length], position: initialPositions[tables.length % initialPositions.length] };
    save((current) => ({ ...current, seatingSeeded: true, tables: [...current.tables, table] }));
    chooseTable(table.id); setName(""); setCapacity("8"); setAdding(false);
  }
  function generateTables(event: FormEvent) {
    event.preventDefault();
    const count = Number(batchCount), seats = Number(batchCapacity);
    if (!Number.isInteger(count) || count < 1 || count > 30 || !Number.isInteger(seats) || seats < 1 || seats > 100) { notice("Use 1 to 30 tables and 1 to 100 seats per table."); return; }
    const existingNumbers = tables.map((table) => Number(table.name.match(/^Table (\d+)/)?.[1] ?? 0));
    const nextNumber = Math.max(0, ...existingNumbers) + 1;
    const newTables: GuestTable[] = Array.from({ length: count }, (_, index) => ({
      id: crypto.randomUUID(), name: `Table ${nextNumber + index}`, capacity: seats, space,
      color: colors[(tables.length + index) % colors.length],
      position: { x: 16 + ((tables.length + index) % 4) * 23, y: 22 + (Math.floor((tables.length + index) / 4) % 3) * 27 },
    }));
    save((current) => ({ ...current, seatingSeeded: true, tables: [...current.tables, ...newTables] }));
    notice(`${count} ${count === 1 ? "table" : "tables"} added to ${space.toLowerCase()}.`);
  }
  function deleteTable(table: GuestTable) {
    if (!window.confirm(`Delete ${table.name}? Guests at this table will become unassigned in ${space.toLowerCase()}.`)) return;
    save((current) => ({ ...current, seatingSeeded: true, tables: current.tables.filter((item) => item.id !== table.id), guests: current.guests.map((guest) => space === "Reception" && guest.tableId === table.id ? { ...guest, tableId: undefined } : space === "Ceremony" && guest.ceremonyTableId === table.id ? { ...guest, ceremonyTableId: undefined } : guest) }));
    if (selected === table.id) { setSelected(""); setRenaming(false); }
  }
  function assign(guestId: string) {
    if (!active || guestId === "none") return;
    if (seated.length >= active.capacity) { notice(`${active.name} is full.`); return; }
    save((current) => ({ ...current, guests: current.guests.map((guest) => guest.id === guestId ? (space === "Reception" ? { ...guest, tableId: active.id } : { ...guest, ceremonyTableId: active.id }) : guest) }));
  }
  function removeGuest(guestId: string) {
    save((current) => ({ ...current, guests: current.guests.map((guest) => guest.id === guestId ? (space === "Reception" ? { ...guest, tableId: undefined } : { ...guest, ceremonyTableId: undefined }) : guest) }));
  }
  async function uploadPlan(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) { notice("Choose an image for the floor plan."); return; }
    if (file.size > 12 * 1024 * 1024) { notice("Choose an image smaller than 12 MB."); return; }
    try {
      const image = await createImageBitmap(file);
      const scale = Math.min(1, 1600 / image.width, 1100 / image.height);
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(image.width * scale); canvas.height = Math.round(image.height * scale);
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Canvas unavailable");
      context.fillStyle = "white"; context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      const imageUrl = canvas.toDataURL("image/jpeg", 0.78);
      image.close();
      save((current) => ({ ...current, floorPlans: { ...current.floorPlans, [space]: imageUrl } }));
    } catch { notice("The floor plan could not be uploaded. Try another image."); }
  }
  function moveMarker(event: PointerEvent<HTMLButtonElement>, table: GuestTable) {
    const bounds = event.currentTarget.parentElement?.getBoundingClientRect();
    if (!bounds) return;
    setDragPosition({ id: table.id, x: clamp(((event.clientX - bounds.left) / bounds.width) * 100), y: clamp(((event.clientY - bounds.top) / bounds.height) * 100) });
  }
  function finishMarker(event: PointerEvent<HTMLButtonElement>, table: GuestTable) {
    if (!dragPosition || dragPosition.id !== table.id) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    const position = { x: dragPosition.x, y: dragPosition.y };
    save((current) => ({ ...current, tables: current.tables.map((item) => item.id === table.id ? { ...item, position } : item) }));
    setDragPosition(null);
  }

  const details = active ? <div className="rounded-2xl border border-border-subtle bg-white p-4 sm:p-5">
    <div className="flex items-start justify-between gap-3 border-b border-border-subtle pb-4">
      <div className="min-w-0 flex-1">{renaming ? <form onSubmit={renameTable} className="flex flex-wrap items-center gap-2"><input autoFocus aria-label="Table name" value={draftName} onChange={(event) => setDraftName(event.target.value)} onKeyDown={(event) => { if (event.key === "Escape") setRenaming(false); }} maxLength={80} className="h-9 min-w-40 flex-1 rounded-lg border border-brand-primary bg-white px-3 text-sm font-semibold outline-none ring-2 ring-brand-primary/10" /><Button type="submit" size="sm">Save</Button><Button type="button" size="sm" variant="ghost" onClick={() => setRenaming(false)}>Cancel</Button></form> : <div className="flex flex-wrap items-center gap-2"><span className="size-3 shrink-0 rounded-full" style={{ background: active.color }} /><h4 className="min-w-0 break-words font-semibold">{active.name}</h4><button type="button" onClick={() => { setDraftName(active.name); setRenaming(true); }} aria-label={`Edit ${active.name} name`} className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-brand-primary hover:bg-[#eef5ef]"><Pencil className="size-3.5" />Edit name</button></div>}<p className="mt-1 text-sm text-text-secondary">{seated.length} / {active.capacity} seats filled</p></div>
      <button type="button" aria-label="Close table details" onClick={() => { setSelected(""); setRenaming(false); }} className="rounded-lg p-1.5 text-text-secondary hover:bg-background-subtle"><X className="size-4" /></button>
    </div>
    <div className="mt-4 flex flex-wrap items-end gap-3"><div className="min-w-48 flex-1"><Select label="Add a confirmed guest" value="none" onValueChange={assign} options={[{ value: "none", label: available.length ? "Choose a guest" : "No unassigned guests" }, ...available.map((guest) => ({ value: guest.id, label: guest.name }))]} /></div><span className="pb-2 text-xs text-text-secondary">{Math.max(0, active.capacity - seated.length)} seats available</span></div>
    {seated.length ? <div className="mt-4 divide-y divide-border-subtle">{seated.map((guest) => <div key={guest.id} className="flex items-center justify-between gap-3 py-2.5 text-sm"><span className="font-medium">{guest.name}</span><button type="button" onClick={() => removeGuest(guest.id)} className="text-xs font-semibold text-brand-primary hover:underline">Remove</button></div>)}</div> : <p className="mt-5 text-sm italic text-text-secondary">No guests at this table.</p>}
  </div> : <div className="flex min-h-40 items-center justify-center rounded-2xl border border-dashed border-border-subtle bg-white px-5 text-center text-sm text-text-secondary">Select a table to view details.</div>;

  return <section className="space-y-5">
    <div className="flex flex-wrap items-center gap-x-5 gap-y-3"><span className="text-sm font-medium text-text-secondary">Space</span><div className="inline-flex items-center gap-1 rounded-xl border border-border-subtle bg-white p-1">{(["Ceremony", "Reception"] as const).map((item) => <button key={item} type="button" onClick={() => chooseSpace(item)} className={cn("rounded-lg px-3 py-1.5 text-sm font-medium transition-colors", space === item ? "bg-[#e8f0eb] text-brand-primary" : "text-text-secondary hover:bg-[#f5f8f5]")}>{item}</button>)}</div></div>
    <div className="inline-flex items-center gap-1 rounded-xl border border-border-subtle bg-[#f7f9f7] p-1" role="tablist" aria-label="Seating view"><button type="button" role="tab" aria-selected={view === "tables"} onClick={() => setView("tables")} className={cn("rounded-lg px-3 py-1.5 text-sm font-medium", view === "tables" ? "bg-white text-text-primary shadow-sm" : "text-text-secondary hover:text-brand-primary")}>Tables</button><button type="button" role="tab" aria-selected={view === "floor"} onClick={() => setView("floor")} className={cn("rounded-lg px-3 py-1.5 text-sm font-medium", view === "floor" ? "bg-white text-text-primary shadow-sm" : "text-text-secondary hover:text-brand-primary")}>Floor plan</button></div>
    {view === "tables" ? <div className="grid items-start gap-5 lg:grid-cols-[320px_minmax(0,1fr)] xl:grid-cols-[350px_minmax(0,1fr)]">
      <aside className="space-y-4"><div className="flex items-center justify-between gap-3"><h3 className="text-lg font-semibold">Tables <span className="font-normal text-text-tertiary">({tables.length})</span></h3><Button size="sm" variant="outline" leadingIcon={<Plus className="size-4" />} onClick={() => setAdding((value) => !value)}>Add</Button></div>
        {adding && <form onSubmit={addTable} className="space-y-3 rounded-xl border border-border-subtle bg-white p-3"><Input label="Table name" value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Family table" required /><Input label="Seats" type="number" min="1" max="100" value={capacity} onChange={(event) => setCapacity(event.target.value)} required /><div className="flex justify-end gap-2"><Button type="button" variant="ghost" size="sm" onClick={() => setAdding(false)}>Cancel</Button><Button type="submit" size="sm">Add table</Button></div></form>}
        <form onSubmit={generateTables} className="rounded-xl border border-border-subtle bg-[#f8faf8] p-3"><p className="mb-2 text-xs font-medium text-text-secondary">Generate multiple tables</p><div className="flex items-end gap-2"><label className="min-w-0 flex-1 text-xs text-text-secondary">Tables<input aria-label="Number of tables" type="number" min="1" max="30" value={batchCount} onChange={(event) => setBatchCount(event.target.value)} className="mt-1 h-9 w-full rounded-lg border border-border-default bg-white px-2 text-sm text-text-primary" /></label><label className="min-w-0 flex-1 text-xs text-text-secondary">Seats each<input aria-label="Seats per table" type="number" min="1" max="100" value={batchCapacity} onChange={(event) => setBatchCapacity(event.target.value)} className="mt-1 h-9 w-full rounded-lg border border-border-default bg-white px-2 text-sm text-text-primary" /></label><Button type="submit" size="sm">Go</Button></div></form>
        <div className="space-y-2">{tables.map((table) => { const count = data.guests.filter((guest) => seatId(guest, space) === table.id).length; return <div key={table.id} className={cn("flex items-center gap-1 rounded-xl border bg-white pr-2 transition-colors", selected === table.id ? "border-brand-primary bg-[#f5faf6]" : "border-border-subtle hover:border-[#b9d4c2]")}><button type="button" onClick={() => chooseTable(table.id)} aria-pressed={selected === table.id} className="flex min-w-0 flex-1 items-center gap-3 px-3 py-3 text-left"><span className="size-2.5 shrink-0 rounded-full" style={{ background: table.color }} /><span className="min-w-0"><span className="block truncate text-sm font-medium">{table.name}</span><span className="block text-xs text-text-secondary">{count} / {table.capacity} seats</span></span></button><button type="button" aria-label={`Delete ${table.name}`} title="Delete table" onClick={() => deleteTable(table)} className="rounded-lg p-2 text-text-tertiary hover:bg-[#fff1f1] hover:text-error"><Trash2 className="size-4" /></button></div>; })}{!tables.length && <p className="rounded-xl border border-dashed border-border-subtle bg-white px-4 py-6 text-sm text-text-secondary">No tables in {space.toLowerCase()} yet.</p>}</div>
        <div className="border-t border-border-subtle pt-3"><h4 className="text-sm font-semibold">Waitlist <span className="font-normal text-text-tertiary">({available.length})</span></h4>{available.length ? <p className="mt-1 text-xs leading-5 text-text-secondary">{available.length} confirmed {available.length === 1 ? "guest needs" : "guests need"} a table.</p> : <p className="mt-1 text-xs italic text-text-secondary">No one waiting.</p>}</div>
      </aside><div>{details}</div>
    </div> : <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_290px]">
      <div><div className="mb-3 flex items-center justify-between gap-3"><h3 className="text-lg font-semibold">Floor plan</h3><div className="flex items-center gap-2"><input ref={planInput} type="file" accept="image/*" className="sr-only" onChange={uploadPlan} /><Button size="sm" variant="outline" leadingIcon={<Upload className="size-4" />} onClick={() => planInput.current?.click()}>{floorPlan ? "Replace plan" : "Upload plan"}</Button></div></div>
        <div className="relative min-h-[360px] overflow-hidden rounded-2xl border border-border-subtle bg-[#f8faf9] sm:min-h-[480px]" style={floorPlan ? { backgroundImage: `url(${floorPlan})`, backgroundSize: "contain", backgroundPosition: "center", backgroundRepeat: "no-repeat" } : undefined}>
          {tables.map((table, index) => { const point = dragPosition?.id === table.id ? dragPosition : (table.position ?? initialPositions[index % initialPositions.length]); return <button key={table.id} type="button" aria-label={`${table.name}, drag to reposition`} title={`${table.name} · drag to position`} onPointerDown={(event) => { chooseTable(table.id); event.currentTarget.setPointerCapture(event.pointerId); moveMarker(event, table); }} onPointerMove={(event) => { if (event.currentTarget.hasPointerCapture(event.pointerId)) moveMarker(event, table); }} onPointerUp={(event) => finishMarker(event, table)} onPointerCancel={() => setDragPosition(null)} className={cn("absolute flex size-11 -translate-x-1/2 -translate-y-1/2 touch-none items-center justify-center rounded-full border-2 border-white text-sm font-semibold text-white shadow-md transition-shadow hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary", selected === table.id && "ring-2 ring-brand-primary ring-offset-2")} style={{ left: `${point.x}%`, top: `${point.y}%`, background: table.color }}>{index + 1}</button>; })}
          {!floorPlan && <p className="pointer-events-none absolute inset-x-4 top-1/2 -translate-y-1/2 text-center text-sm text-text-tertiary">Upload a floor plan image, then drag tables to position them.</p>}
        </div>
      </div><div className="xl:pt-12">{details}</div>
    </div>}
  </section>;
}
