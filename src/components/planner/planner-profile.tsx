"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Building2, Globe2, Instagram, MapPin } from "@/components/ui/icons";
import { VerificationBadge } from "@/components/ui/verification-badge";
import { usePlannerProfile, usePlannerVerified } from "@/lib/planner-business";
import { normalizeInstagram, specialtyTone } from "@/lib/planner-profile-types";
import { cn } from "@/lib/utils/cn";
import { ProfileStatus } from "./profile/profile-status";

export { ProfileEditor as PlannerProfilePage } from "./profile/profile-editor";

export function PlannerProfileCard() {
  const profile = usePlannerProfile();
  const verified = usePlannerVerified();
  return <section className="flex h-[680px] min-w-0 flex-col overflow-hidden rounded-2xl border border-[#e0e7df] bg-white sm:h-[640px]" aria-label="Planner business profile">
    <div className="relative h-36 shrink-0 bg-[#dce7cf]">{profile.banner && <Image src={profile.banner} alt={`${profile.brand} banner`} fill unoptimized sizes="(min-width: 1280px) 360px, 100vw" className="object-cover" />}<div className="absolute inset-0 bg-linear-to-b from-black/30 via-transparent to-black/15" aria-hidden="true" /><span className="absolute left-5 top-5 text-[0.625rem] font-semibold uppercase tracking-[.13em] text-white">Your planner profile</span></div>
    <div className="flex min-h-0 flex-1 flex-col px-5 pb-5"><div className="relative z-10 -mt-10 mb-2 size-20 shrink-0 overflow-hidden rounded-2xl border-4 border-white bg-[#345d49] text-2xl font-semibold text-white shadow-sm">{profile.logo ? <Image src={profile.logo} alt={`${profile.brand} logo`} fill unoptimized sizes="80px" className="bg-white object-contain" /> : <span className="flex size-full items-center justify-center">{profile.brand ? profile.brand.split(/\s+/).filter((word) => /^[a-z]/i.test(word)).slice(0, 2).map((word) => word[0]).join("").toUpperCase() : <Building2 className="size-8" aria-hidden="true" />}</span>}</div>
      <div className="flex items-center gap-1.5"><h2 className="min-w-0 truncate text-lg font-semibold tracking-tight" title={profile.brand}>{profile.brand || "Your planning brand"}</h2>{verified && <VerificationBadge />}</div>
      <div className="mt-1.5"><ProfileStatus verified={verified} /></div>
      <p className="mt-2 line-clamp-1 text-xs leading-5 text-text-secondary">{profile.about || "Thoughtful plans and a personal approach to every event."}</p>
      <dl className="mt-3 space-y-2 text-xs">{[{ title: "Based in", value: profile.location || "Add your location", icon: MapPin }, { title: "Coverage", value: profile.coverage || "Add the places you work", icon: Globe2 }].map(({ title, value, icon: Icon }) => <div key={title} className="flex gap-2.5"><Icon className="mt-0.5 size-4 shrink-0 text-[#80936d]" aria-hidden="true" /><div className="min-w-0"><dt className="text-[0.625rem] text-text-tertiary">{title}</dt><dd className="mt-0.5 truncate leading-4 text-text-secondary" title={value}>{value}</dd></div></div>)}<div className="flex gap-2.5"><Instagram className="mt-0.5 size-4 shrink-0 text-[#80936d]" aria-hidden="true" /><div className="min-w-0"><dt className="text-[0.625rem] text-text-tertiary">Instagram</dt><dd className="mt-0.5 truncate leading-4 text-text-secondary">{profile.instagram ? <a href={`https://www.instagram.com/${normalizeInstagram(profile.instagram)}/`} target="_blank" rel="noreferrer" className="hover:text-brand-primary hover:underline">@{normalizeInstagram(profile.instagram)}</a> : "Add your Instagram"}</dd></div></div></dl>
      <div className="mt-3"><h3 className="mb-1.5 text-[0.625rem] font-medium text-text-tertiary">Specialties</h3><div className="flex flex-wrap gap-1.5">{profile.specialties.length ? profile.specialties.slice(0, 3).map((specialty) => <span key={specialty} className={cn("max-w-36 truncate rounded-full border px-2.5 py-1 text-[0.625rem] font-medium", specialtyTone(specialty))}>{specialty}</span>) : <span className="text-xs text-text-tertiary">Add your specialties.</span>}{profile.specialties.length > 3 && <span className="rounded-full bg-[#f2f4ef] px-2 py-1 text-[0.625rem] text-text-secondary">+{profile.specialties.length - 3}</span>}</div></div>
      <div className="mt-auto pt-3"><Link href="/planner/profile" className="flex min-h-10 w-full items-center justify-between rounded-xl border border-[#dae5d1] bg-[#f3f8ec] px-3 text-xs font-semibold text-[#638148] hover:bg-[#e8f1dd]">View profile<ArrowUpRight className="size-4" aria-hidden="true" /></Link></div>
    </div>
  </section>;
}
