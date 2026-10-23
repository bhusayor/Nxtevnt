"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ArrowUpRight, Building2, Globe2, Instagram, Mail, MapPin, MessageSquareText, Smartphone, Star } from "@/components/ui/icons";
import { BrandMark } from "@/components/nextevnt/brand-logo";
import { Button } from "@/components/ui/button";
import { VerificationBadge } from "@/components/ui/verification-badge";
import { EventPhotoViewer } from "@/components/planner/event-photo-viewer";
import { recordProfileMetric, usePlannerProfile, usePlannerVerified } from "@/lib/planner-business";
import { isEventCancelled, usePlannerEvents } from "@/lib/planner-events";
import { normalizeInstagram, specialtyTone, type ProfilePhoto } from "@/lib/planner-profile-types";
import { cn } from "@/lib/utils/cn";
import { PublicProfileAvailability } from "./public-profile-availability";
import { PublicProfileInquiry, type PublicInquiryRequest } from "./public-profile-inquiry";
import { PublicProfileServices } from "./public-profile-services";
import { PublicProfilePortfolio } from "./public-profile-portfolio";
import { PublicProfileConsultation } from "./public-profile-consultation";

function websiteUrl(value: string) {
  try { const url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`); return ["http:", "https:"].includes(url.protocol) ? url.href : ""; }
  catch { return ""; }
}

export function PublicPlannerProfile({ slug }: { slug: string }) {
  const profile = usePlannerProfile();
  const verified = usePlannerVerified();
  const events = usePlannerEvents();
  const [photo, setPhoto] = useState<ProfilePhoto | null>(null);
  const [request, setRequest] = useState<PublicInquiryRequest | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const portfolio = profile.portfolioFolders;
  useEffect(() => {
    if (slug !== profile.slug) return;
    try { const key = `nxtevnt:profile-preview-view:${slug}`; if (!sessionStorage.getItem(key)) { sessionStorage.setItem(key, "true"); recordProfileMetric("view"); } } catch { /* Browsing does not require tracking. */ }
  }, [profile.slug, slug]);

  if (profile.slug !== slug) return <main className="flex min-h-screen flex-col items-center justify-center app-canvas px-6 text-center"><BrandMark size="md" /><p className="mt-8 text-xs font-semibold uppercase tracking-widest text-text-tertiary">NXTEVNT planner profiles</p><h1 className="mt-3 text-3xl font-semibold tracking-tight">This profile isn’t available</h1><p className="mt-4 max-w-md text-sm leading-7 text-text-secondary">The link may have changed, or this profile hasn’t been published. Ask the planner for their latest link.</p></main>;

  const busyDates = new Set([...profile.booking.blockedDates, ...events.filter((event) => !isEventCancelled(event)).map((event) => event.date)]);
  const rating = profile.reviews.length ? profile.reviews.reduce((sum, review) => sum + review.rating, 0) / profile.reviews.length : 0;
  const initials = profile.brand.split(/\s+/).filter((word) => /^[a-z]/i.test(word)).slice(0, 2).map((word) => word[0]).join("");
  const bookingEnabled = profile.booking.requestToBook || profile.booking.instantBook;
  const primaryLabel = profile.booking.requestToBook ? "Request to book" : "Request a quote";
  const ask = (details?: PublicInquiryRequest) => setRequest(details || { title: primaryLabel, date: selectedDate });
  const instagram = normalizeInstagram(profile.instagram);
  const website = profile.website ? websiteUrl(profile.website) : "";
  const contactAction = () => recordProfileMetric("contact");
  const consultation = profile.consultation;

  return <div id="profile-top" className="app-canvas min-h-screen pb-24 text-text-primary sm:pb-0">
    <a href="#about" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:p-4">Skip to profile</a>
    <header className="border-b border-border-subtle bg-white">
      <div className="mx-auto flex min-h-18 max-w-7xl items-center justify-between gap-4 px-5 sm:px-8 lg:px-10"><a href="#profile-top" className="inline-flex items-center gap-2" aria-label="NXTEVNT, back to top"><BrandMark /><span className="text-sm font-semibold tracking-tight">NXTEVNT</span></a><span className="rounded-full border border-border-subtle px-3 py-1.5 text-[0.625rem] font-medium text-text-secondary">Visitor preview</span></div>
    </header>
    <main className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
      <section className="my-6 overflow-hidden rounded-2xl border border-border-subtle bg-white sm:my-8" aria-labelledby="planner-name">
        {profile.banner ? <button type="button" aria-label={`View ${profile.brand} cover photo`} onClick={() => setPhoto({ id: "cover", src: profile.banner, title: `${profile.brand} · Cover photo` })} className="group relative block aspect-[2/1] w-full overflow-hidden bg-[#f0f0ef] focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-brand-primary sm:aspect-[3/1] lg:aspect-[7/2]"><Image src={profile.banner} alt={`${profile.brand} event cover`} fill unoptimized sizes="(min-width:1280px) 1200px, 100vw" className="object-cover transition-transform duration-700 group-hover:scale-[1.025]" /><span className="absolute bottom-4 right-4 flex size-10 items-center justify-center rounded-full border border-white/60 bg-white/95 text-text-primary shadow-sm"><ArrowUpRight className="size-4" aria-hidden="true" /></span></button> : <div className="aspect-[2/1] w-full bg-linear-to-br from-[#e5eade] via-[#eff1e9] to-[#dfe7df] sm:aspect-[3/1] lg:aspect-[7/2]" aria-hidden="true" />}
        <div className="relative px-5 pb-6 sm:px-8 sm:pb-7">
          <div className="flex min-w-0 flex-col items-start gap-4 sm:flex-row sm:items-end sm:gap-5">
            <span className="relative -mt-12 flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-3xl border-[5px] border-white bg-[#3f6046] text-3xl font-semibold text-white shadow-md sm:-mt-14 sm:size-28">{profile.logo ? <Image src={profile.logo} alt={`${profile.brand} logo`} fill unoptimized sizes="112px" className="bg-white object-contain" /> : initials || <Building2 className="size-9" aria-hidden="true" />}</span>
            <div className="min-w-0 flex-1 sm:pt-4"><div className="flex flex-wrap items-center gap-x-3 gap-y-2"><h1 id="planner-name" className="min-w-0 break-words text-2xl font-semibold leading-tight tracking-[-0.04em] sm:text-3xl">{profile.brand}</h1>{verified && <span className="inline-flex shrink-0 items-center gap-1.5 text-xs text-text-secondary"><VerificationBadge className="size-4" />Verified planner</span>}</div>{profile.location && <p className="mt-2 flex items-start gap-1.5 text-xs leading-6 text-text-secondary"><MapPin className="mt-1 size-3.5 shrink-0" aria-hidden="true" />{profile.location}</p>}</div>
            {profile.reviews.length > 0 && <a href="#reviews" className="inline-flex min-h-9 shrink-0 items-center gap-2 text-xs text-text-secondary"><Star weight="fill" className="size-4 text-[#a88237]" aria-hidden="true" /><span className="font-semibold text-text-primary">{rating.toFixed(1)}</span><span>· {profile.reviews.length} {profile.reviews.length === 1 ? "review" : "reviews"}</span></a>}
          </div>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-text-secondary">Explore our work, find the right support, and tell us about the moment you’re planning.</p>
          {profile.specialties.length > 0 && <div className="mt-3 flex flex-wrap gap-2">{profile.specialties.map((value) => <span key={value} className={cn("rounded-full border px-3 py-1.5 text-[0.6875rem] font-medium", specialtyTone(value))}>{value}</span>)}</div>}
        </div>
      </section>
      <div className="grid items-start gap-6 pb-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-x-7 lg:pb-12">
        <div className="min-w-0 space-y-6">
          <section id="about" aria-labelledby="about-title" className="min-w-0 scroll-mt-24 rounded-2xl border border-border-subtle bg-white p-5 sm:p-7"><p className="text-[0.625rem] font-semibold uppercase tracking-[0.16em] text-text-tertiary">Behind the plans</p><h2 id="about-title" className="mt-2 text-2xl font-semibold tracking-tight">A little about us</h2><p className="mt-5 whitespace-pre-wrap break-words text-sm leading-7 text-text-secondary">{profile.about || "Every event starts with a conversation. Get in touch to explore what we can create together."}</p>{profile.coverage && <div className="mt-6 flex items-start gap-3 border-t border-border-subtle pt-5"><Globe2 className="mt-0.5 size-5 shrink-0 text-text-tertiary" aria-hidden="true" /><div><h3 className="text-xs font-semibold">Where we plan</h3><p className="mt-1 text-sm leading-6 text-text-secondary">{profile.coverage}</p></div></div>}</section>
          <PublicProfilePortfolio folders={portfolio} />
          <PublicProfileServices profile={profile} onInquire={ask} />
          {profile.reviews.length > 0 && <section id="reviews" aria-labelledby="reviews-title" className="min-w-0 scroll-mt-24 rounded-2xl border border-border-subtle bg-white p-5 sm:p-7"><p className="text-[0.625rem] font-semibold uppercase tracking-[0.16em] text-text-tertiary">In our clients’ words</p><div className="mt-2 flex flex-wrap items-center justify-between gap-3"><h2 id="reviews-title" className="text-2xl font-semibold tracking-tight">The experience, remembered</h2><span className="inline-flex items-center gap-1.5 text-sm font-semibold"><Star className="size-4 text-[#a88237]" weight="fill" aria-hidden="true" />{rating.toFixed(1)}<span className="text-xs font-normal text-text-tertiary">/ 5</span></span></div><div className="mt-5 divide-y divide-border-subtle">{profile.reviews.map((review) => <article key={review.id} className="py-5"><div className="flex items-center gap-1" aria-label={`${review.rating} out of 5 stars`}>{[1, 2, 3, 4, 5].map((star) => <Star key={star} weight={star <= review.rating ? "fill" : "regular"} className="size-3.5 text-[#a88237]" aria-hidden="true" />)}</div><blockquote className="mt-3 whitespace-pre-wrap text-sm leading-7 text-text-secondary">“{review.body}”</blockquote><p className="mt-4 text-xs font-semibold">{review.author}</p></article>)}</div></section>}
        </div>
        <aside className="min-w-0 space-y-6" aria-label="Contact and booking">
          <section id="contact" aria-labelledby="contact-title" className="min-w-0 scroll-mt-24 rounded-2xl border border-border-subtle bg-white p-5 sm:p-6"><span className="flex size-10 items-center justify-center rounded-xl border border-border-subtle bg-[#fafafa]"><MessageSquareText className="size-5 text-brand-primary" aria-hidden="true" /></span><h2 id="contact-title" className="mt-4 text-xl font-semibold tracking-tight">Your plans start here.</h2><p className="mt-2 text-sm leading-6 text-text-secondary">An idea, a question, or a date in mind? We’d love to hear it.</p><Button type="button" fullWidth className="mt-5 text-xs" onClick={() => ask()} trailingIcon={<ArrowUpRight className="size-3.5" aria-hidden="true" />}>{primaryLabel}</Button><p className="mt-3 text-center text-[0.625rem] text-text-tertiary">No account needed · No commitment</p>
            {(instagram || profile.email || profile.phone || website) && <div className="mt-5 space-y-1 border-t border-border-subtle pt-4"><p className="mb-2 text-[0.625rem] font-semibold uppercase tracking-widest text-text-tertiary">Or connect directly</p>{instagram && <a href={`https://www.instagram.com/${encodeURIComponent(instagram)}/`} target="_blank" rel="noopener noreferrer" onClick={contactAction} className="flex min-h-10 items-center gap-3 text-xs font-medium text-text-secondary hover:text-brand-primary"><Instagram className="size-4 shrink-0" aria-hidden="true" /><span className="min-w-0 flex-1 break-all">@{instagram}</span><ArrowUpRight className="size-3.5 shrink-0" aria-hidden="true" /></a>}{profile.email && <a href={`mailto:${profile.email}`} onClick={contactAction} className="flex min-h-10 items-center gap-3 text-xs font-medium text-text-secondary hover:text-brand-primary"><Mail className="size-4 shrink-0" aria-hidden="true" /><span className="break-all">{profile.email}</span></a>}{profile.phone && <a href={`tel:${profile.phone.replace(/[^+\d]/g, "")}`} onClick={contactAction} className="flex min-h-10 items-center gap-3 text-xs font-medium text-text-secondary hover:text-brand-primary"><Smartphone className="size-4 shrink-0" aria-hidden="true" /><span className="break-all">{profile.phone}</span></a>}{website && <a href={website} target="_blank" rel="noopener noreferrer" onClick={contactAction} className="flex min-h-10 items-center gap-3 text-xs font-medium text-text-secondary hover:text-brand-primary"><Globe2 className="size-4 shrink-0" aria-hidden="true" /><span className="flex-1">Visit website</span><ArrowUpRight className="size-3.5" aria-hidden="true" /></a>}</div>}
          </section>
          <PublicProfileConsultation consultation={consultation} onInquire={ask} />
          {profile.booking.showAvailability && <PublicProfileAvailability busyDates={busyDates} selected={selectedDate} onSelect={setSelectedDate} onInquire={() => ask({ title: "Ask about an event date", date: selectedDate })} />}
          {(bookingEnabled || profile.booking.cancellation || profile.booking.terms) && <section className="min-w-0 rounded-2xl border border-border-subtle bg-white p-5 sm:p-6"><h2 className="text-sm font-semibold">Before we get started</h2>{bookingEnabled && <p className="mt-3 text-xs leading-6 text-text-secondary">A {profile.booking.deposit}% deposit is required to reserve your date. Confirm the scope and availability with the planner before paying.</p>}{profile.booking.cancellation && <details className="mt-4 border-t border-border-subtle pt-4"><summary className="cursor-pointer text-xs font-medium">Refunds & cancellations</summary><p className="mt-3 whitespace-pre-wrap text-xs leading-6 text-text-secondary">{profile.booking.cancellation}</p></details>}{profile.booking.terms && <details className="mt-4 border-t border-border-subtle pt-4"><summary className="cursor-pointer text-xs font-medium">Booking terms</summary><p className="mt-3 whitespace-pre-wrap text-xs leading-6 text-text-secondary">{profile.booking.terms}</p></details>}</section>}
        </aside>
      </div>
    </main>
    <footer className="border-t border-border-subtle bg-white px-5 py-7"><div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-5 sm:px-3 lg:px-5"><div><p className="text-sm font-semibold">{profile.brand}</p><p className="mt-1 text-xs text-text-tertiary">A planner profile on NXTEVNT</p></div><a href="#profile-top" className="inline-flex min-h-10 items-center gap-2 text-xs font-medium text-text-secondary">Back to top<ArrowUpRight className="size-3.5" aria-hidden="true" /></a></div><p className="mx-auto mt-6 max-w-7xl text-[0.625rem] leading-5 text-text-tertiary sm:px-3 lg:px-5">Interactive preview · Profile data and inquiries are stored in this browser only. This page has not been published for sharing.</p></footer>
    <div className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-between gap-4 border-t border-border-subtle bg-white/95 px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-6px_24px_-18px_rgba(0,0,0,.2)] backdrop-blur-md sm:hidden"><p className="min-w-0 truncate text-xs font-semibold">Let’s plan your event</p><Button type="button" size="sm" className="min-h-10 text-xs" onClick={() => ask()}>{primaryLabel}</Button></div>
    <EventPhotoViewer photo={photo ? { src: photo.src, title: photo.title } : null} onClose={() => setPhoto(null)} />
    {request && <PublicProfileInquiry request={request} brand={profile.brand} onClose={() => setRequest(null)} />}
  </div>;
}
