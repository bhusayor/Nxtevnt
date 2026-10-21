"use client";

import { useId, useState, type ChangeEvent } from "react";
import Image from "next/image";
import { Check, ImagePlus, LoaderCircle } from "@/components/ui/icons";

import { eventCovers, isCustomCover } from "@/lib/planner-events";
import { prepareEventImage } from "@/lib/event-images";
import { cn } from "@/lib/utils/cn";

export function CoverPicker({ value, onChange }: { value: string; onChange: (src: string) => void }) {
  const uploadId = useId();
  const [customCover, setCustomCover] = useState(isCustomCover(value) ? value : "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function onUpload(change: ChangeEvent<HTMLInputElement>) {
    const file = change.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const image = await prepareEventImage(file);
      setCustomCover(image);
      onChange(image);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "This image could not be added.");
    } finally {
      setBusy(false);
      change.target.value = "";
    }
  }

  const uploaded = customCover || (isCustomCover(value) ? value : "");
  return <fieldset><legend className="type-label mb-3 text-text-primary">Cover image <span className="ml-1 text-xs font-normal text-text-tertiary">Optional</span></legend>
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
      {eventCovers.map((cover) => <button key={cover.src} type="button" aria-pressed={value === cover.src} aria-label={`Use ${cover.label} cover`} onClick={() => onChange(cover.src)} className={cn("relative h-24 overflow-hidden rounded-xl border-2 transition-colors", value === cover.src ? "border-brand-primary" : "border-transparent hover:border-border-strong")}><Image src={cover.src} alt="" fill sizes="(min-width: 640px) 120px, 45vw" className="object-cover" /><span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-2 pb-2 pt-6 text-left text-[0.625rem] font-semibold text-white">{cover.label}</span>{value === cover.src && <span className="absolute right-1.5 top-1.5 flex size-5 items-center justify-center rounded-full bg-brand-primary text-white"><Check className="size-3" aria-hidden="true" /></span>}</button>)}
      {uploaded ? <div className={cn("relative h-24 overflow-hidden rounded-xl border-2", value === uploaded ? "border-brand-primary" : "border-transparent")}><Image src={uploaded} alt="" fill unoptimized sizes="120px" className="object-cover" /><span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-2 pb-2 pt-6 text-left text-[0.625rem] font-semibold text-white">Your image</span><button type="button" className="absolute inset-0" aria-label="Use your uploaded cover" aria-pressed={value === uploaded} onClick={() => onChange(uploaded)} /><label htmlFor={uploadId} className="absolute right-1.5 top-1.5 z-10 cursor-pointer rounded-md bg-white/95 px-1.5 py-1 text-[0.5625rem] font-semibold text-text-primary shadow-sm" aria-label="Replace uploaded cover">Replace</label>{value === uploaded && <span className="absolute bottom-1.5 right-1.5 flex size-5 items-center justify-center rounded-full bg-brand-primary text-white"><Check className="size-3" aria-hidden="true" /></span>}</div> : <label htmlFor={uploadId} className="flex h-24 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-border-strong bg-background-subtle text-center text-[0.625rem] font-semibold text-text-secondary transition-colors hover:border-brand-primary hover:text-brand-primary">{busy ? <LoaderCircle className="size-5 animate-spin" aria-hidden="true" /> : <ImagePlus className="size-5" aria-hidden="true" />}Add image</label>}
      <input id={uploadId} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={onUpload} disabled={busy} aria-label="Upload your own cover image" />
    </div>
    <p className="mt-2 text-xs text-text-tertiary">Choose a preset or add a JPG, PNG or WebP photo. Saved in this browser.</p>
    {error && <p role="alert" className="mt-2 text-xs text-error">{error}</p>}
  </fieldset>;
}
