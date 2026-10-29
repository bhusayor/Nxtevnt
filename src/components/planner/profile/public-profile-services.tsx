"use client";

import { useState } from "react";
import { ArrowRight, Download, FileText } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { getBudgetAttachment } from "@/lib/budget-attachments";
import { formatBudgetMoney } from "@/lib/planner-budget";
import type { PlannerProfile } from "@/lib/planner-profile-types";
import type { PublicInquiryRequest } from "./public-profile-inquiry";
import { PublicServiceViewport } from "./public-service-viewport";

export function PublicProfileServices({ profile, onInquire }: { profile: PlannerProfile; onInquire: (request: PublicInquiryRequest) => void }) {
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState(false);
  const packages = profile.packages.filter((item) => item.title.trim());
  const rate = profile.rateCard;
  const rates = rate.mode === "create" ? rate.lines.filter((line) => line.title.trim()) : [];
  const hasDocument = rate.mode === "upload" && rate.document;
  const hasPrice = (value: string) => value !== "" && Number.isFinite(Number(value)) && Number(value) >= 0;
  async function downloadRate() {
    if (!rate.document || downloading) return;
    setError(""); setDownloading(true);
    try {
      const file = await getBudgetAttachment(rate.document.id);
      if (!file) throw new Error("This document isn’t available in this browser. Contact the planner for their rate card.");
      const url = URL.createObjectURL(file);
      const link = document.createElement("a"); link.href = url; link.download = rate.document.name; link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1500);
    } catch (problem) { setError(problem instanceof Error ? problem.message : "The rate card couldn’t be downloaded."); }
    finally { setDownloading(false); }
  }
  if (!packages.length && !hasDocument && !rates.length) return null;
  return <section id="services" aria-labelledby="services-title" className="min-w-0 scroll-mt-24 rounded-2xl border border-border-subtle bg-white p-5 sm:p-7">
    <p className="text-[0.625rem] font-semibold uppercase tracking-[0.16em] text-text-tertiary">Services & pricing</p>
    <h2 id="services-title" className="mt-2 text-2xl font-semibold tracking-tight">Find your kind of support</h2>
    <p className="mt-2 text-sm leading-6 text-text-secondary">A starting point for your plans. Ask about a package to explore the details.</p>
    {packages.length > 0 && <p className="mt-3 text-xs leading-5 text-text-tertiary">{packages.length} {packages.length === 1 ? "package" : "packages"}{packages.length > 4 && " · Scroll below to explore all packages"}</p>}
    <PublicServiceViewport packageCount={packages.length}>
    {packages.length > 0 && <div className="grid gap-4 sm:grid-cols-2">{packages.map((item, index) => <article key={item.id} data-service-package className="flex min-w-0 flex-col rounded-2xl border border-border-default bg-white p-5 transition-shadow hover:shadow-[0_8px_24px_-16px_rgba(28,41,36,.25)]">
      <span aria-hidden="true" className="text-[0.625rem] font-semibold tracking-[0.15em] text-text-tertiary">{String(index + 1).padStart(2, "0")} / THE PACKAGE</span>
      <h3 className="mt-4 break-words text-lg font-semibold tracking-tight">{item.title}</h3>
      <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-text-secondary">{item.description}</p>
      <div className="mt-auto pt-7"><p className="text-[0.6875rem] text-text-tertiary">{item.startingFrom ? "Starting from" : "Package price"}</p><p className="mt-1 break-words text-2xl font-semibold tracking-tight">{hasPrice(item.price) ? formatBudgetMoney(Number(item.price), item.currency) : "Let’s discuss"}</p><p className="mt-1 text-[0.625rem] text-text-tertiary">{hasPrice(item.price) ? item.currency : "Pricing tailored to your event"}</p>
        <Button type="button" variant="outline" fullWidth className="mt-5 text-xs" trailingIcon={<ArrowRight className="size-3.5" aria-hidden="true" />} onClick={() => onInquire({ title: "Ask about a package", services: [item.title], detail: `${item.title}${hasPrice(item.price) ? ` · ${item.startingFrom ? "From " : ""}${formatBudgetMoney(Number(item.price), item.currency)}` : ""}` })}>Ask about this package</Button>
      </div>
    </article>)}</div>}
    {(hasDocument || rates.length > 0) && <div className="rounded-2xl border border-border-subtle bg-[#fafafa] p-4 sm:p-5"><div className="flex flex-wrap items-center justify-between gap-4"><div className="flex items-center gap-3"><span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-border-subtle bg-white"><FileText className="size-5 text-text-secondary" aria-hidden="true" /></span><div><h3 className="text-sm font-semibold">The finer details</h3><p className="mt-1 text-xs text-text-secondary">Explore individual services in our rate card.</p></div></div>{hasDocument && <Button type="button" size="sm" variant="outline" loading={downloading} leadingIcon={<Download className="size-3.5" aria-hidden="true" />} onClick={() => void downloadRate()}>Download rate card</Button>}</div>
      {rates.length > 0 && <dl className="mt-4 divide-y divide-border-subtle">{rates.map((line) => <div key={line.id} className="flex flex-wrap justify-between gap-3 py-4"><dt className="min-w-0 flex-1"><p className="break-words text-sm font-medium">{line.title}</p>{line.description && <p className="mt-1 break-words text-xs leading-6 text-text-secondary">{line.description}</p>}</dt><dd className="text-right"><p className="text-sm font-semibold">{hasPrice(line.price) ? formatBudgetMoney(Number(line.price), rate.currency) : "On request"}</p><p className="mt-1 text-[0.625rem] text-text-tertiary">{line.unit}</p></dd></div>)}</dl>}
      {rate.note && <p className="mt-4 whitespace-pre-wrap text-xs leading-6 text-text-secondary">{rate.note}</p>}
      {error && <p role="alert" className="mt-4 text-xs leading-6 text-error">{error}</p>}
    </div>}
    </PublicServiceViewport>
  </section>;
}
