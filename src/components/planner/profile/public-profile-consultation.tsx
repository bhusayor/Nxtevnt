"use client";

import { Clock3, MapPin, Monitor, Smartphone } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { formatBudgetMoney } from "@/lib/planner-budget";
import type { ConsultationSettings } from "@/lib/planner-profile-types";
import type { PublicInquiryRequest } from "./public-profile-inquiry";

export function PublicProfileConsultation({ consultation, onInquire }: { consultation: ConsultationSettings; onInquire: (request: PublicInquiryRequest) => void }) {
  if (!consultation.enabled) return null;
  const LocationIcon = consultation.location === "video" ? Monitor : consultation.location === "phone" ? Smartphone : MapPin;
  const location = consultation.location === "video" ? "Video call" : consultation.location === "phone" ? "Phone call" : "In person";
  const amount = Number(consultation.price.replaceAll(",", ""));
  const hasPrice = Boolean(consultation.price.trim()) && Number.isFinite(amount) && amount >= 0;
  const price = !consultation.paid ? "Free" : hasPrice ? formatBudgetMoney(amount, consultation.currency) : "Fee on request";
  return <section id="consultation" aria-labelledby="consultation-title" className="scroll-mt-24 rounded-2xl border border-border-subtle bg-white p-5 sm:p-6">
    <p className="text-[0.625rem] font-semibold uppercase tracking-[0.16em] text-text-tertiary">A little clarity first</p><h2 id="consultation-title" className="mt-2 text-xl font-semibold tracking-tight">Consultation</h2><p className="mt-2 text-xs leading-6 text-text-secondary">Talk through your ideas in a focused conversation with your planner.</p>
    <div className="mt-5 rounded-xl border border-border-subtle bg-[#fafafa] p-4"><p className="text-[0.6875rem] font-medium text-text-secondary">Consultation fee</p><p className="mt-2 break-words text-3xl font-semibold tracking-tight">{price}</p><p className="mt-1.5 text-xs text-text-tertiary">{consultation.paid && hasPrice ? `${consultation.currency} · ` : ""}Per {consultation.duration}-minute session</p></div>
    <div className="mt-4 flex flex-wrap gap-3 text-xs text-text-secondary"><span className="inline-flex items-center gap-1.5"><Clock3 className="size-4" aria-hidden="true" />{consultation.duration} minutes</span><span className="inline-flex items-center gap-1.5"><LocationIcon className="size-4" aria-hidden="true" />{location}</span></div>
    {consultation.location === "in-person" && consultation.address && <p className="mt-3 text-xs leading-6 text-text-secondary">{consultation.address}</p>}
    <Button type="button" variant="outline" fullWidth className="mt-5 text-xs" onClick={() => onInquire({ title: "Request a consultation", detail: `${consultation.duration} minutes · ${location} · ${price}` })}>Request a consultation</Button>
  </section>;
}
