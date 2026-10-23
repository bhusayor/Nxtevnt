"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Building2, Check, Copy, Eye, Globe2, ImageIcon, MessageSquareText, Pencil, Star, Store } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { VerificationBadge } from "@/components/ui/verification-badge";
import { updatePlannerProfile, usePlannerProfile, usePlannerVerified } from "@/lib/planner-business";
import { normalizeInstagram, type PlannerProfile } from "@/lib/planner-profile-types";
import { prepareProfileForSave, profileSlug as slugify } from "@/lib/planner-profile-editing";
import { cn } from "@/lib/utils/cn";
import { ProfileTextField, ProfileImageUpload, ProfileSection, SpecialtyEditor, type ProfileUpdate } from "./profile-fields";
import { ProfileBooking } from "./profile-booking";
import { ProfilePerformance } from "./profile-performance";
import { ProfilePortfolio } from "./profile-portfolio";
import { ProfileServices } from "./profile-services";
import { ProfileStatus } from "./profile-status";
import { ProfileDetailsView } from "./profile-details-view";

const tabs = ["Business info", "Portfolio", "Services", "Booking", "Performance"] as const;

export function ProfileEditor() {
  const storedProfile = usePlannerProfile();
  const [draft, setDraft] = useState<PlannerProfile | null>(null);
  const profile = draft || storedProfile;
  const draftRef = useRef<PlannerProfile | null>(null);
  const session = useRef(0);
  const renderSession = session.current;
  const editorRef = useRef<HTMLDivElement>(null);
  const verified = usePlannerVerified();
  const [tab, setTab] = useState<typeof tabs[number]>("Business info");
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  useEffect(() => {
    if (!draft) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [Boolean(draft)]);
  function beginEdit() {
    session.current += 1;
    const snapshot = structuredClone(storedProfile);
    draftRef.current = snapshot; setDraft(snapshot); setError(""); setFeedback("");
  }
  function cancelEdit() {
    session.current += 1; draftRef.current = null; setDraft(null); setError("");
  }
  const update: ProfileUpdate = (change) => {
    if (!draftRef.current || renderSession !== session.current) return false;
    const current = draftRef.current;
    const changed = typeof change === "function" ? change(current) : { ...current, ...change };
    draftRef.current = changed; setDraft(changed); setError(""); return true;
  };
  function saveChanges() {
    if (!draftRef.current) return;
    if (editorRef.current?.querySelector('[aria-busy="true"]')) { setError("Let your upload finish before saving your profile."); return; }
    const invalid = editorRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]');
    if (invalid) { setError("Fix the highlighted fields before saving."); invalid.focus(); return; }
    const result = prepareProfileForSave(draftRef.current);
    if (!result.profile) { setError(result.error || "Check your profile details."); setTab(result.section || "Business info"); editorRef.current?.scrollIntoView({ block: "start" }); return; }
    try {
      updatePlannerProfile(() => result.profile);
      session.current += 1; draftRef.current = null; setDraft(null); setError(""); setFeedback("Profile updated");
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setFeedback(""), 3000);
    } catch { setError("Your changes couldn’t be saved. Try smaller photos or remove an unused upload, then save again."); editorRef.current?.scrollIntoView({ block: "start" }); }
  }
  async function copy() { try { await navigator.clipboard.writeText(`${window.location.origin}/planners/${encodeURIComponent(storedProfile.slug)}`); setCopied(true); window.setTimeout(() => setCopied(false), 2000); } catch { setError("Copy isn’t available here. You can select and copy the profile link."); } }
  const rating = profile.reviews.length ? profile.reviews.reduce((sum, review) => sum + review.rating, 0) / profile.reviews.length : 0;
  return <div ref={editorRef} key={draft ? renderSession : "view"} className="mx-auto w-full max-w-6xl space-y-5">
    <h1 className="sr-only">Your planner profile</h1>
    <div className="flex flex-wrap items-center justify-between gap-3"><Link href="/planner" onClick={(event) => { if (draft && !window.confirm("Discard your unsaved profile changes?")) event.preventDefault(); }} className="inline-flex min-h-9 items-center gap-1.5 text-xs font-semibold text-text-secondary hover:text-brand-primary"><ArrowLeft className="size-4" aria-hidden="true" />Back to overview</Link><div className="flex flex-wrap items-center gap-2"><span role="status" className="mr-2 inline-flex items-center gap-1.5 text-xs text-brand-primary">{feedback && <Check className="size-3.5" />}{feedback}</span>{draft ? <><Button type="button" size="sm" variant="outline" onClick={cancelEdit}>Cancel</Button><Button type="button" size="sm" onClick={saveChanges}>Save changes</Button></> : <Button type="button" size="sm" leadingIcon={<Pencil className="size-3.5" aria-hidden="true" />} onClick={beginEdit}>Edit profile</Button>}</div></div>
    {draft && <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border-subtle bg-white px-4 py-3"><p className="text-sm font-semibold">Editing profile</p><p className="text-xs leading-6 text-text-secondary">Changes stay private until you save. Cancel discards this draft.</p></div>}
    {error && <p role="alert" className="rounded-xl border border-[#efdbd6] bg-[#fff5f1] px-4 py-3 text-xs text-error">{error}</p>}
    <section className="overflow-hidden rounded-3xl border border-border-subtle bg-white">
      <div className="relative h-48 bg-[#dce7cf] sm:h-64">{profile.banner && <Image src={profile.banner} alt={`${profile.brand} banner`} fill unoptimized sizes="(min-width: 1024px) 80vw, 100vw" className="object-cover" />}<div className="absolute inset-0 bg-linear-to-t from-black/20 to-transparent" aria-hidden="true" />{draft && <ProfileImageUpload label="Change banner" onUpload={(banner) => update({ banner })} onError={setError} className="absolute right-4 top-4 sm:right-6 sm:top-6" />}</div>
      <div className="relative px-5 pb-6 sm:px-8"><div className="flex flex-col items-start gap-4 sm:flex-row sm:items-end sm:gap-5"><div className="relative -mt-14 size-28 shrink-0 rounded-3xl border-[5px] border-white bg-[#3f6046] shadow-md">{profile.logo ? <Image src={profile.logo} alt={`${profile.brand} logo`} fill unoptimized sizes="112px" className="rounded-[1.25rem] bg-white object-contain" /> : <span className="flex size-full items-center justify-center text-3xl font-semibold text-white">{profile.brand.split(/\s+/).filter((word) => /^[a-z]/i.test(word)).slice(0, 2).map((word) => word[0]).join("") || <Building2 className="size-9" />}</span>}{draft && <ProfileImageUpload label="Change profile logo" iconOnly maxLength={120_000} onUpload={(logo) => update({ logo })} onError={setError} className="absolute -bottom-2 -right-2 size-9 rounded-full px-0" />}</div><div className="min-w-0 flex-1 sm:pt-3"><div className="flex items-center gap-2">{draft ? <ProfileTextField label="Brand name" value={profile.brand} placeholder="Your brand name" maxLength={80} inputClassName="font-semibold" className="min-w-0 flex-1" validate={(value) => value ? "" : "Add your brand name."} onSave={(brand) => update({ brand })} /> : <h2 className="break-words text-2xl font-semibold tracking-tight sm:text-3xl">{profile.brand}</h2>}{verified && <VerificationBadge className="size-6" />}</div><p className="mt-2 text-xs text-text-tertiary">Your brand, your details, your way of planning.</p></div><div className="sm:pb-1"><ProfileStatus verified={verified} /></div></div>
        <div className="mt-6 flex min-w-0 flex-col gap-4 border-t border-border-subtle pt-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="w-full min-w-0 xl:max-w-lg xl:flex-1">
            {draft ? <ProfileTextField label="Public profile link" value={profile.slug} prefix="thenxtevnt.com/" placeholder="your-brand-name" maxLength={45} validate={(value) => slugify(value).length < 3 || slugify(value).length > 40 ? "Choose a name with 3–40 letters, numbers or hyphens." : ["planner", "login", "signup", "terms", "api"].includes(slugify(value)) ? "Choose another profile name." : ""} onSave={(value) => update({ slug: value })} inputClassName="px-1 text-xs font-medium" /> : <div><p className="text-xs font-medium text-text-tertiary">Public profile link</p><p className="mt-2 text-sm font-medium leading-6 [overflow-wrap:anywhere]">thenxtevnt.com/{profile.slug}</p></div>}
            <p className="mt-2 max-w-prose text-[0.6875rem] leading-5 text-text-tertiary">Preview your visitor page below. Publishing your profile link isn’t connected yet.</p>
          </div>
          {!draft && <div className="grid w-full min-w-0 gap-2 sm:grid-cols-2 xl:w-auto xl:shrink-0">
            <Button type="button" size="sm" variant="outline" className="min-h-11 w-full min-w-0" leadingIcon={copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />} onClick={() => void copy()}>{copied ? "Copied" : "Copy profile link"}</Button>
            <Link href={`/planners/${profile.slug}`} target="_blank" className="inline-flex min-h-11 w-full min-w-0 items-center justify-center gap-1.5 rounded-lg bg-[#edf4e7] px-3 text-xs font-semibold text-[#648448]">View visitor page<Eye className="size-3.5 shrink-0" aria-hidden="true" /></Link>
          </div>}
        </div>
      </div>
    </section>
    <nav aria-label="Planner profile sections" className="flex gap-1 overflow-x-auto rounded-2xl border border-border-subtle bg-white p-1.5">{tabs.map((value) => <button key={value} type="button" aria-pressed={tab === value} onClick={() => setTab(value)} className={cn("min-h-10 shrink-0 rounded-xl px-4 text-xs font-semibold transition-colors", tab === value ? "bg-[#edf4e6] text-[#648347]" : "text-text-secondary hover:bg-[#f7f9f4]")}>{value}</button>)}</nav>
    {!draft && tab !== "Performance" && <ProfileDetailsView key={tab} profile={profile} tab={tab} />}
    {draft && tab === "Business info" && <div className="space-y-5"><div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]"><div className="space-y-5"><ProfileSection title="About your business" description="Tell clients what you do and what makes your approach yours." icon={Store}><ProfileTextField label="About" value={profile.about} multiline maxLength={2000} placeholder="Introduce your brand and the experience you create for clients." onSave={(about) => update({ about })} /></ProfileSection><ProfileSection title="Specialties" description="The events and experiences you love to plan." icon={ImageIcon}><SpecialtyEditor values={profile.specialties} onChange={(specialties) => update({ specialties })} /></ProfileSection></div><ProfileSection title="Location & coverage" description="Help clients find the right planner for their event." icon={Globe2}><div className="space-y-4"><ProfileTextField label="Based in" value={profile.location} maxLength={150} placeholder="City, state and country" onSave={(location) => update({ location })} /><ProfileTextField label="Where you work" value={profile.coverage} maxLength={250} placeholder="Cities, regions or destination events" onSave={(coverage) => update({ coverage })} /></div></ProfileSection></div><ProfileSection title="Social & contact" description="Choose how clients can reach your business." icon={MessageSquareText}><div className="grid gap-4 sm:grid-cols-2"><ProfileTextField label="Instagram" value={profile.instagram} prefix="@" placeholder="yourbrand" maxLength={120} validate={(value) => value && !/^[a-zA-Z0-9._]{1,30}$/.test(normalizeInstagram(value)) ? "Enter an Instagram username or profile link." : ""} onSave={(value) => update({ instagram: value })} /><ProfileTextField label="Business email" value={profile.email} type="email" placeholder="hello@yourbrand.com" onSave={(email) => update({ email })} /><ProfileTextField label="Contact number" value={profile.phone} type="tel" maxLength={30} placeholder="Include the country code" validate={(value) => value && !/^\+?[\d\s()-]{7,25}$/.test(value) ? "Enter a valid phone number." : ""} onSave={(phone) => update({ phone })} /><ProfileTextField label="Website" value={profile.website} type="url" placeholder="https://yourbrand.com" onSave={(website) => update({ website })} /></div></ProfileSection><ProfileSection title="Client reviews" description="Feedback from the people you’ve planned with." icon={Star}><div className="flex flex-wrap items-center gap-5"><span className="text-4xl font-semibold tracking-tight">{profile.reviews.length ? rating.toFixed(1) : "—"}</span><div><div className="flex gap-1">{[1, 2, 3, 4, 5].map((star) => <Star key={star} className={cn("size-4", star <= Math.round(rating) ? "text-[#d5ab55]" : "text-[#dbe1d4]")} weight="fill" aria-hidden="true" />)}</div><p className="mt-2 text-xs text-text-tertiary">{profile.reviews.length ? `${profile.reviews.length} client reviews` : "No client reviews yet"}</p></div></div>{profile.reviews.length ? <div className="mt-5 divide-y divide-border-subtle">{profile.reviews.map((review) => <article key={review.id} className="py-4"><p className="text-sm font-semibold">{review.author} <span className="ml-2 text-xs font-normal text-[#a08247]">{review.rating}/5</span></p><p className="mt-2 text-sm leading-6 text-text-secondary">{review.body}</p></article>)}</div> : <p className="mt-5 text-xs leading-6 text-text-secondary">Client feedback will appear here as your review history grows.</p>}</ProfileSection></div>}
    {draft && tab === "Portfolio" && <ProfilePortfolio profile={profile} update={update} />}
    {draft && tab === "Services" && <ProfileServices profile={profile} update={update} />}
    {draft && tab === "Booking" && <ProfileBooking profile={profile} update={update} />}
    {tab === "Performance" && <ProfilePerformance />}
    {draft && <div className="sticky bottom-4 z-30 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border-default bg-white p-4 shadow-lg"><p className="text-xs text-text-secondary">Save changes to update your profile and visitor page.</p><div className="flex gap-2"><Button type="button" size="sm" variant="outline" onClick={cancelEdit}>Cancel</Button><Button type="button" size="sm" onClick={saveChanges}>Save changes</Button></div></div>}
  </div>;
}
