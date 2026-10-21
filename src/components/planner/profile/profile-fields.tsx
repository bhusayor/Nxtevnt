"use client";

import { useState, type ReactNode } from "react";
import { Camera, LoaderCircle, Plus, X, type PhosphorIcon } from "@/components/ui/icons";
import { prepareEventImage } from "@/lib/event-images";
import { specialtyTone, type PlannerProfile } from "@/lib/planner-profile-types";
import { cn } from "@/lib/utils/cn";

export type ProfileUpdate = (change: Partial<PlannerProfile> | ((profile: PlannerProfile) => PlannerProfile)) => boolean;

export function ProfileSection({ title, description, icon: Icon, action, children, className }: { title: string; description?: string; icon?: PhosphorIcon; action?: ReactNode; children: ReactNode; className?: string }) {
  return <section className={cn("min-w-0 rounded-2xl border border-border-subtle bg-white", className)}><div className="flex flex-wrap items-start justify-between gap-3 border-b border-border-subtle px-5 py-5 sm:px-6"><div className="flex items-start gap-3">{Icon && <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#eef4e8] text-[#6f8c55]"><Icon className="size-5" aria-hidden="true" /></span>}<div><h2 className="text-base font-semibold tracking-tight">{title}</h2>{description && <p className="mt-1 max-w-xl text-xs leading-5 text-text-secondary">{description}</p>}</div></div>{action}</div><div className="p-5 sm:p-6">{children}</div></section>;
}

export function ProfileTextField({ label, value, onSave, placeholder = "Enter details", multiline = false, type = "text", maxLength = 500, validate, className, prefix, inputClassName }: { label: string; value: string; onSave: (value: string) => boolean | void; placeholder?: string; multiline?: boolean; type?: "text" | "email" | "url" | "tel"; maxLength?: number; validate?: (value: string) => string; className?: string; prefix?: string; inputClassName?: string }) {
  const [error, setError] = useState("");
  function check() {
    const next = value.trim();
    setError(validate?.(next) || (type === "email" && next && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(next) ? "Enter a valid email address." : type === "url" && next && !/^https?:\/\/[^\s.]+\.[^\s]+$/i.test(next) ? "Enter a full website address, including https://." : ""));
  }
  const control = cn("w-full min-w-0 rounded-lg border border-border-default bg-white px-3 py-2 text-sm leading-6 text-text-primary outline-none transition-colors placeholder:text-text-tertiary focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10", error && "border-error", inputClassName);
  return <label className={cn("block min-w-0", className)}><span className="mb-2 block text-xs font-medium text-text-secondary">{label}</span><div className={cn("flex min-w-0 items-center gap-2", prefix && "rounded-lg border border-border-default bg-[#fafafa] pl-3")}>
    {prefix && <span className="shrink-0 text-xs font-medium text-text-tertiary">{prefix}</span>}
    {multiline ? <textarea value={value} aria-invalid={Boolean(error)} maxLength={maxLength} rows={4} placeholder={placeholder} onChange={(event) => { setError(""); onSave(event.target.value); }} onBlur={check} className={control} /> : <input value={value} type={type} aria-invalid={Boolean(error)} maxLength={maxLength} placeholder={placeholder} onChange={(event) => { setError(""); onSave(event.target.value); }} onBlur={check} className={control} />}
  </div>{error && <span role="alert" className="mt-1 block text-xs text-error">{error}</span>}</label>;
}

export function SpecialtyEditor({ values, onChange }: { values: string[]; onChange: (values: string[]) => void }) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  function add() { const value = name.trim(); if (!value) return; if (!values.some((entry) => entry.toLowerCase() === value.toLowerCase())) onChange([...values, value]); setName(""); setAdding(false); }
  return <div className="flex flex-wrap items-center gap-2">{values.map((value) => <span key={value} className={cn("inline-flex min-h-8 items-center gap-1.5 rounded-full border py-1 pl-3 pr-1.5 text-xs font-medium", specialtyTone(value))}>{value}<button type="button" aria-label={`Remove specialty ${value}`} onClick={() => onChange(values.filter((entry) => entry !== value))} className="flex size-6 items-center justify-center rounded-full hover:bg-black/5"><X className="size-3" aria-hidden="true" /></button></span>)}{adding ? <form onSubmit={(event) => { event.preventDefault(); add(); }} className="flex min-w-0 max-w-full items-center rounded-full border border-[#c9d8bf] bg-white pl-3 pr-1"><input autoFocus aria-label="New specialty" placeholder="e.g. Destination weddings" maxLength={40} value={name} onChange={(event) => setName(event.target.value)} className="h-9 w-44 min-w-0 bg-transparent text-xs outline-none" onKeyDown={(event) => { if (event.key === "Escape") { setAdding(false); setName(""); } }} /><button type="submit" aria-label="Add specialty" disabled={!name.trim()} className="flex size-8 items-center justify-center rounded-full text-brand-primary disabled:opacity-40"><Plus className="size-4" /></button></form> : <button type="button" onClick={() => setAdding(true)} className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-dashed border-[#c8d3c0] px-3 text-xs font-medium text-[#718363] hover:bg-[#f3f7ec]"><Plus className="size-3.5" aria-hidden="true" />Add specialty</button>}</div>;
}

export function ProfileImageUpload({ label, onUpload, maxLength = 350_000, className, onError, iconOnly = false }: { label: string; onUpload: (src: string) => void; maxLength?: number; className?: string; onError?: (message: string) => void; iconOnly?: boolean }) {
  const [busy, setBusy] = useState(false);
  return <label aria-busy={busy} title={label} className={cn("inline-flex min-h-9 cursor-pointer items-center justify-center gap-2 rounded-xl border border-white/70 bg-white/95 px-3 text-xs font-semibold text-text-secondary shadow-sm hover:bg-white", busy && "pointer-events-none opacity-70", className)}>{busy ? <LoaderCircle className="size-4 motion-safe:animate-spin" aria-hidden="true" /> : <Camera className="size-4" aria-hidden="true" />}<span className={iconOnly ? "sr-only" : ""}>{busy ? "Preparing…" : label}</span><input aria-label={label} type="file" disabled={busy} accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={async (event) => { const input = event.currentTarget; const file = input.files?.[0]; if (!file) return; setBusy(true); try { const src = await prepareEventImage(file, maxLength); onUpload(src); } catch (error) { onError?.(error instanceof Error ? error.message : "This photo couldn’t be saved."); } finally { setBusy(false); input.value = ""; } }} /></label>;
}

export function ProfileMoneyField({ label, value, currency, onSave }: { label: string; value: string; currency: string; onSave: (value: string) => void }) {
  const [error, setError] = useState("");
  const display = value ? Number(value).toLocaleString("en-NG", { maximumFractionDigits: 2 }) : "";
  return <label className="block min-w-0"><span className="mb-1.5 block text-xs font-medium text-text-secondary">{label} ({currency})</span><input key={currency} aria-invalid={Boolean(error)} inputMode="decimal" defaultValue={display} placeholder="0" onBlur={(event) => { const raw = event.target.value.replaceAll(",", "").trim(); if (raw && (!/^\d{1,13}(\.\d{1,2})?$/.test(raw) || !Number.isFinite(Number(raw)))) { setError("Enter a valid amount with up to two decimals."); return; } setError(""); onSave(raw); }} onChange={(event) => { const raw = event.target.value.replace(/[^\d.]/g, ""); const [whole, ...decimal] = raw.split("."); event.target.value = whole.slice(0, 13).replace(/\B(?=(\d{3})+(?!\d))/g, ",") + (decimal.length ? `.${decimal.join("").slice(0, 2)}` : ""); setError(""); onSave(event.target.value.replaceAll(",", "")); }} className="h-10 w-full min-w-0 rounded-lg border border-border-default bg-white px-3 text-sm tabular-nums outline-none focus:border-brand-primary" />{error && <span role="alert" className="mt-1 block text-xs text-error">{error}</span>}</label>;
}
