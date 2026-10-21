"use client";

import { useState } from "react";
import { CalendarDays, FileText, Globe2, ImageIcon, MessageSquareText, ReceiptText, Star, Store } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { getBudgetAttachment } from "@/lib/budget-attachments";
import { formatBudgetMoney } from "@/lib/planner-budget";
import { formatEventDate } from "@/lib/planner-events";
import { specialtyTone, type PlannerProfile } from "@/lib/planner-profile-types";
import { cn } from "@/lib/utils/cn";
import { ProfileSection } from "./profile-fields";
import { PublicProfilePortfolio } from "./public-profile-portfolio";

function Detail({ label, value }: { label: string; value: string }) {
  return <div className="min-w-0"><dt className="text-xs font-medium text-text-tertiary">{label}</dt><dd className="mt-2 whitespace-pre-wrap break-words text-sm leading-7 text-text-primary">{value || <span className="text-text-tertiary">Not added</span>}</dd></div>;
}

export function ProfileDetailsView({ profile, tab }: { profile: PlannerProfile; tab: "Business info" | "Portfolio" | "Services" | "Booking" }) {
  const [error, setError] = useState("");
  async function downloadRate() {
    if (!profile.rateCard.document) return;
    try { const file = await getBudgetAttachment(profile.rateCard.document.id); if (!file) throw new Error("This document is no longer in this browser. Use Edit profile to upload it again."); const url = URL.createObjectURL(file); const link = document.createElement("a"); link.href = url; link.download = profile.rateCard.document.name; link.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1500); setError(""); }
    catch (problem) { setError(problem instanceof Error ? problem.message : "This rate card couldn’t be opened."); }
  }
  if (tab === "Portfolio") return <PublicProfilePortfolio folders={profile.portfolioFolders} trackViews={false} />;
  if (tab === "Business info") return <div className="space-y-5">
    <ProfileSection title="About your business" icon={Store}><p className="whitespace-pre-wrap text-sm leading-7 text-text-secondary">{profile.about || "Your business introduction will appear here."}</p></ProfileSection>
    <div className="grid gap-5 lg:grid-cols-2"><ProfileSection title="Specialties" icon={ImageIcon}><div className="flex flex-wrap gap-2">{profile.specialties.length ? profile.specialties.map((value) => <span key={value} className={cn("rounded-full border px-3 py-1.5 text-xs font-medium", specialtyTone(value))}>{value}</span>) : <p className="text-sm text-text-tertiary">No specialties added yet.</p>}</div></ProfileSection><ProfileSection title="Location & coverage" icon={Globe2}><dl className="space-y-5"><Detail label="Based in" value={profile.location} /><Detail label="Where you work" value={profile.coverage} /></dl></ProfileSection></div>
    <ProfileSection title="Social & contact" icon={MessageSquareText}><dl className="grid gap-6 sm:grid-cols-2"><Detail label="Instagram" value={profile.instagram ? `@${profile.instagram}` : ""} /><Detail label="Business email" value={profile.email} /><Detail label="Contact number" value={profile.phone} /><Detail label="Website" value={profile.website} /></dl></ProfileSection>
    <ProfileSection title="Client reviews" icon={Star}>{profile.reviews.length ? <div className="divide-y divide-border-subtle">{profile.reviews.map((review) => <article key={review.id} className="py-3 first:pt-0"><p className="text-sm font-semibold">{review.author}<span className="ml-2 text-xs font-normal text-text-secondary">{review.rating}/5</span></p><p className="mt-2 text-sm leading-7 text-text-secondary">{review.body}</p></article>)}</div> : <p className="text-sm text-text-tertiary">No client reviews yet.</p>}</ProfileSection>
  </div>;
  if (tab === "Services") {
    const consultation = profile.consultation;
    const account = profile.accounts.find((item) => item.id === consultation.bankAccountId);
    return <div className="space-y-5"><ProfileSection title="Packages & pricing" icon={ReceiptText}><div className="grid gap-4 sm:grid-cols-2">{profile.packages.map((item) => <article key={item.id} className="rounded-xl border border-border-subtle p-4"><h3 className="text-base font-semibold">{item.title}</h3><p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-text-secondary">{item.description}</p><p className="mt-4 text-lg font-semibold">{item.price ? `${item.startingFrom ? "From " : ""}${formatBudgetMoney(Number(item.price), item.currency)}` : "Price on request"}</p></article>)}</div>{!profile.packages.length && <p className="text-sm text-text-tertiary">No packages added yet.</p>}</ProfileSection>
      <ProfileSection title="Rate card" icon={FileText}>{profile.rateCard.mode === "upload" ? profile.rateCard.document ? <div><p className="break-words text-sm font-medium">{profile.rateCard.document.name}</p><Button type="button" size="sm" variant="outline" className="mt-4" onClick={() => void downloadRate()}>Download rate card</Button></div> : <p className="text-sm text-text-tertiary">No rate card uploaded.</p> : profile.rateCard.lines.length ? <dl className="divide-y divide-border-subtle">{profile.rateCard.lines.map((line) => <div key={line.id} className="flex flex-wrap justify-between gap-3 py-3 first:pt-0"><dt className="min-w-0"><p className="text-sm font-semibold">{line.title}</p><p className="mt-1 text-xs leading-6 text-text-secondary">{line.description}</p></dt><dd className="text-right text-sm font-medium">{line.price ? formatBudgetMoney(Number(line.price), profile.rateCard.currency) : "On request"}<p className="mt-1 text-xs font-normal text-text-tertiary">{line.unit}</p></dd></div>)}</dl> : <p className="text-sm text-text-tertiary">No rate card services added.</p>}{profile.rateCard.note && <p className="mt-4 whitespace-pre-wrap text-xs leading-6 text-text-secondary">{profile.rateCard.note}</p>}{error && <p role="alert" className="mt-3 text-xs text-error">{error}</p>}</ProfileSection>
      <ProfileSection title="Consultation" icon={MessageSquareText}>{consultation.enabled ? <dl className="grid gap-6 sm:grid-cols-2"><Detail label="Length" value={`${consultation.duration} minutes`} /><Detail label="Location" value={consultation.location === "video" ? "Video call" : consultation.location === "phone" ? "Phone call" : consultation.address || "In person"} /><Detail label="Consultation fee" value={consultation.paid ? consultation.price ? formatBudgetMoney(Number(consultation.price), consultation.currency) : "Fee not set" : "Free"} />{consultation.paid && <Detail label="Selected bank account" value={account ? `${account.bank} · •••• ${account.number.slice(-4)}` : "No account selected"} />}</dl> : <p className="text-sm text-text-secondary">Consultations are currently off.</p>}</ProfileSection>
    </div>;
  }
  return <div className="space-y-5"><ProfileSection title="Booking options" icon={CalendarDays}><dl className="grid gap-6 sm:grid-cols-2"><Detail label="Request to book" value={profile.booking.requestToBook ? "Enabled" : "Off"} /><Detail label="Instant book" value={profile.booking.instantBook ? "Enabled" : "Off"} /><Detail label="Deposit to hold a date" value={profile.booking.requestToBook || profile.booking.instantBook ? `${profile.booking.deposit}%` : "Not required for quote requests"} /><Detail label="Availability on your page" value={profile.booking.showAvailability ? "Shown" : "Hidden"} /><Detail label="Refund & cancellation policy" value={profile.booking.cancellation} /><Detail label="Booking terms & conditions" value={profile.booking.terms} /></dl></ProfileSection><ProfileSection title="Dates you’ve marked unavailable" icon={CalendarDays}>{profile.booking.blockedDates.length ? <div className="flex flex-wrap gap-2">{profile.booking.blockedDates.map((date) => <span key={date} className="rounded-lg border border-border-subtle px-3 py-2 text-xs text-text-secondary">{formatEventDate(date)}</span>)}</div> : <p className="text-sm text-text-secondary">No personal dates blocked. Event dates are marked busy automatically.</p>}</ProfileSection></div>;
}
