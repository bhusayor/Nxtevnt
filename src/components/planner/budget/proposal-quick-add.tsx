"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { PricingFields } from "./pricing-fields";
import { lineTotal, validateProposal, type ComparisonColumn, type ProposalGroup, type ProposalLine } from "@/lib/budget-proposals";
import { formatBudgetMoney } from "@/lib/planner-budget";
import type { PricedAs } from "@/lib/budget-pricing";

function QuickDialog({ title, description, children, onClose }: { title: string; description: string; children: ReactNode; onClose: () => void }) {
  return <Dialog.Root open onOpenChange={(open) => { if (!open) onClose(); }}><Dialog.Portal><Dialog.Overlay className="fixed inset-0 z-50 bg-[#10231a]/50 backdrop-blur-[2px]" /><Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl bg-white p-5 shadow-[var(--shadow-lg)] focus:outline-none sm:p-6"><header className="mb-5 flex items-start justify-between gap-3"><div><Dialog.Title className="text-lg font-semibold">{title}</Dialog.Title><Dialog.Description className="mt-2 text-sm leading-5 text-text-secondary">{description}</Dialog.Description></div><Dialog.Close asChild><button type="button" aria-label="Close dialog" className="flex size-9 shrink-0 items-center justify-center rounded-lg text-text-tertiary hover:bg-background-subtle"><X className="size-4" aria-hidden="true" /></button></Dialog.Close></header>{children}</Dialog.Content></Dialog.Portal></Dialog.Root>;
}

export function ComparisonAddItem({ column, category, groups, currency, onClose, onSave, guestCount }: { guestCount?: string; column: string; category: string; groups: ProposalGroup[]; currency: string; onClose: () => void; onSave: (item: ProposalLine, groupId?: string) => void }) {
  const [name, setName] = useState("");
  const [vendor, setVendor] = useState("");
  const [description, setDescription] = useState("");
  const [pricedAs, setPricedAs] = useState<PricedAs>("flat-fee");
  const [quantity, setQuantity] = useState("1");
  const [price, setPrice] = useState("");
  const [groupId, setGroupId] = useState(groups[0]?.id ?? "");
  const [error, setError] = useState("");
  const item: ProposalLine = { id: "preview", name: name.trim(), vendor: vendor.trim(), description: description.trim(), pricedAs, quantity: pricedAs === "per-guest" ? Number(guestCount) : pricedAs === "flat-fee" ? 1 : Number(quantity), unitPrice: Number(price.replaceAll(",", "")) };
  const total = lineTotal(item);
  function save(event: FormEvent) {
    event.preventDefault();
    try {
      if (!price.trim()) throw new Error("Enter a price. Use 0 if the item has no cost.");
      validateProposal({ id: "preview", name: "Quick add", currency, description: "", status: "draft", createdAt: "", updatedAt: "", groups: [{ id: "preview", name: category, items: [item] }] });
      onSave({ ...item, id: crypto.randomUUID() }, groupId || undefined); onClose();
    } catch (problem) { setError(problem instanceof Error ? problem.message : "This item couldn’t be saved. Please try again."); }
  }
  return <QuickDialog title="Add item" description={`${category} · ${column}. This adds a planned cost, not a payment.`} onClose={onClose}><form onSubmit={save} className="space-y-4">
    {groups.length > 1 && <Select label="Budget group" value={groupId} onValueChange={setGroupId} options={groups.map((group) => ({ label: group.name, value: group.id }))} />}
    <Input label="Item name" required maxLength={120} autoFocus placeholder="e.g. Reception catering" value={name} onChange={(event) => setName(event.target.value)} />
    <Input label="Vendor" optional maxLength={150} value={vendor} onChange={(event) => setVendor(event.target.value)} placeholder="Vendor or supplier" />
    <PricingFields guestCount={guestCount} pricedAs={pricedAs} quantity={quantity} price={price} currency={currency} onChange={(change) => { if (change.pricedAs) setPricedAs(change.pricedAs); if (change.quantity !== undefined) setQuantity(change.quantity); if (change.price !== undefined) setPrice(change.price); }} />
    <Input label="Description" optional maxLength={500} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="What does this price cover?" />
    {!groups.length && <p className="text-sm leading-5 text-text-secondary">“{category}” will be added to {column} with this item.</p>}
    <div className="flex items-center justify-between rounded-lg bg-[#f6f8f7] p-3 text-sm"><span className="text-text-secondary">Item total</span><strong className="text-base tabular-nums">{formatBudgetMoney(Number.isFinite(total) ? total : 0, currency)}</strong></div>
    {error && <p role="alert" className="text-sm leading-5 text-error">{error}</p>}
    <footer className="flex justify-end gap-2 border-t border-border-subtle pt-4"><Button type="button" variant="outline" onClick={onClose}>Cancel</Button><Button type="submit">Add item</Button></footer>
  </form></QuickDialog>;
}

export function ComparisonAddGroup({ columns, onClose, onSave }: { columns: ComparisonColumn[]; onClose: () => void; onSave: (columnId: string, name: string) => void }) {
  const [columnId, setColumnId] = useState(columns[1]?.id ?? columns[0].id);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  function save(event: FormEvent) { event.preventDefault(); try { onSave(columnId, name.trim()); onClose(); } catch (problem) { setError(problem instanceof Error ? problem.message : "This group couldn’t be saved."); } }
  return <QuickDialog title="Add budget group" description="Choose which budget needs this group. The comparison will line it up with matching names automatically." onClose={onClose}><form onSubmit={save} className="space-y-4"><Select label="Add to" value={columnId} onValueChange={setColumnId} options={columns.map((column) => ({ value: column.id, label: column.name }))} /><Input label="Group name" required maxLength={100} autoFocus placeholder="e.g. Accommodation" value={name} onChange={(event) => setName(event.target.value)} /><p className="text-sm leading-5 text-text-tertiary">Only the selected budget changes. Adding an empty group to a ready proposal moves it back to Draft.</p>{error && <p role="alert" className="text-sm leading-5 text-error">{error}</p>}<footer className="flex justify-end gap-2 border-t border-border-subtle pt-4"><Button type="button" variant="outline" onClick={onClose}>Cancel</Button><Button type="submit" disabled={!name.trim()}>Add group</Button></footer></form></QuickDialog>;
}
