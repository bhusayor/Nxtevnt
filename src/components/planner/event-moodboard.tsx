"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, ImageIcon } from "@/components/ui/icons";
import { EventPhotoViewer } from "@/components/planner/event-photo-viewer";
import type { EventItem, PlannerEvent } from "@/lib/planner-events";

import { activeMoodboardPhotos } from "@/lib/planner-moodboards";
import { MoodboardImage } from "./moodboard-image";

export { MoodboardWorkspace as EventMoodboard } from "./moodboard-workspace";

type Photo = EventItem & { image: string };
const photosFor = (event: PlannerEvent) => activeMoodboardPhotos(event).filter((item): item is Photo => Boolean(item.image));

export function EventMoodboardPreview({ event, onOpen }: { event: PlannerEvent; onOpen: (addPhoto?: boolean) => void }) {
  const photos = photosFor(event);
  const [selectedId, setSelectedId] = useState<string>();
  const [viewing, setViewing] = useState(false);
  const index = Math.max(0, photos.findIndex((photo) => photo.id === selectedId));
  const selected = photos[index];
  const src = selected?.image || "/images/design-system/event-garden-reception.png";
  const next = (direction: number) => setSelectedId(photos[(index + direction + photos.length) % photos.length].id);

  return <>
    <section aria-label="Venue and styling moodboard" className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-[#e6e2da] bg-[#fcfaf6]">
      <div className="px-5 py-4">
        <div className="flex items-center justify-between gap-3"><p className="flex items-center gap-2 text-[0.625rem] font-semibold uppercase tracking-[.12em] text-[#8a704c]"><ImageIcon className="size-4" aria-hidden="true" />Venue & inspiration</p>{photos.length > 1 && <div className="flex items-center gap-1"><span aria-live="polite" className="mr-1 text-xs text-text-secondary">{index + 1} / {photos.length}</span><button type="button" aria-label="Previous moodboard photo" onClick={() => next(-1)} className="flex size-8 items-center justify-center rounded-full border border-[#dedbd4] bg-white hover:border-brand-primary"><ArrowLeft className="size-4" aria-hidden="true" /></button><button type="button" aria-label="Next moodboard photo" onClick={() => next(1)} className="flex size-8 items-center justify-center rounded-full border border-[#dedbd4] bg-white hover:border-brand-primary"><ArrowRight className="size-4" aria-hidden="true" /></button></div>}</div>
        <h2 className="mt-2 text-lg font-semibold tracking-[-.03em]">{selected ? selected.title : "Picture the day"}</h2>
        <p className="mt-1 line-clamp-2 text-xs leading-5 text-text-secondary">{selected ? selected.detail || `${selected.imageCategory || "Event"} inspiration for ${event.name}.` : "Add photos of the venue, hall and styling so everyone can see the vision."}</p>
        <button type="button" onClick={() => onOpen(!selected)} className="mt-3 inline-flex min-h-8 items-center gap-1.5 text-xs font-semibold text-brand-primary hover:underline focus-visible:outline-2 focus-visible:outline-brand-primary">{selected ? "Open moodboard" : "Add venue photos"}<ArrowRight className="size-3.5" aria-hidden="true" /></button>
      </div>
      <div className="relative min-h-[240px] flex-1 bg-[#eeede7]">
        <button type="button" onClick={() => selected ? setViewing(true) : onOpen(true)} aria-label={selected ? `View full image: ${selected.title}` : "Add your venue photos"} className="absolute inset-0 block w-full focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-brand-primary"><MoodboardImage source={src} alt={selected?.title || "Example venue inspiration"} sizes="(min-width: 1280px) 34vw, 100vw" /></button>
        <span className="pointer-events-none absolute bottom-3 left-3 rounded-full bg-white/90 px-2.5 py-1 text-[0.625rem] font-medium text-text-primary shadow-sm">{selected ? selected.imageCategory || "Inspiration" : "Example inspiration"}</span>
      </div>
    </section>
    <EventPhotoViewer photo={viewing && selected ? { src: selected.image, title: selected.title, detail: selected.detail } : null} onClose={() => setViewing(false)} />
  </>;
}
