"use client";

import { DeleteConfirmation } from "@/components/ui/delete-confirmation";

import { useState } from "react";
import Image from "next/image";
import { ArrowUpRight, Folder, ImageIcon, Trash2 } from "@/components/ui/icons";
import type { PlannerProfile, PortfolioFolder } from "@/lib/planner-profile-types";
import { ProfileSection, type ProfileUpdate } from "./profile-fields";
import { PortfolioFolderDialog } from "./portfolio-folder-dialog";
import { PortfolioFolderEditor } from "./portfolio-folder-editor";

export function PortfolioFolders({ profile, update }: { profile: PlannerProfile; update: ProfileUpdate }) {
  const [selectedId, setSelectedId] = useState("");
  const [removing, setRemoving] = useState("");
  const selected = profile.portfolioFolders.find((folder) => folder.id === selectedId);
  function patchFolder(change: Partial<PortfolioFolder> | ((current: PortfolioFolder) => PortfolioFolder)) {
    return update((current) => ({ ...current, portfolioFolders: current.portfolioFolders.map((folder) => folder.id === selectedId ? typeof change === "function" ? change(folder) : { ...folder, ...change } : folder) }));
  }
  return <ProfileSection title="Portfolio" description="Give every project its own folder, cover photo and gallery. These collections appear on your visitor page." icon={Folder} action={<PortfolioFolderDialog disabled={profile.portfolioFolders.length >= 12} onCreate={(folder) => {
    const saved = update((current) => ({ ...current, portfolioFolders: [...current.portfolioFolders, folder] }));
    if (saved) setSelectedId(folder.id);
    return saved;
  }} />}>
    {selected ? <PortfolioFolderEditor key={selected.id} folder={selected} onChange={patchFolder} onBack={() => setSelectedId("")} /> : <>
      {profile.portfolioFolders.length > 0 ? <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,13rem),1fr))] gap-3">{profile.portfolioFolders.map((folder) => <article key={folder.id} className="min-w-0 max-w-72 overflow-hidden rounded-xl border border-border-subtle bg-white transition-shadow hover:shadow-sm"><button type="button" onClick={() => setSelectedId(folder.id)} className="group block w-full text-left" aria-label={`Open portfolio folder ${folder.title}`}><div className="relative h-28 overflow-hidden sm:h-32 bg-[#f3f3f3]">{folder.cover ? <Image src={folder.cover} alt={`${folder.title} cover`} fill unoptimized sizes="(min-width:640px) 288px, 100vw" className="object-cover transition-transform duration-500 group-hover:scale-[1.025]" /> : <Folder className="absolute left-1/2 top-1/2 size-10 -translate-x-1/2 -translate-y-1/2 text-text-tertiary" />}<span className="absolute bottom-2 left-2 inline-flex items-center gap-1.5 rounded-lg bg-white/95 px-2.5 py-1.5 text-[0.625rem] font-medium text-text-secondary"><ImageIcon className="size-3.5" aria-hidden="true" />{folder.photos.length} {folder.photos.length === 1 ? "photo" : "photos"}</span></div><div className="flex items-start justify-between gap-2 px-3 pt-3"><h3 className="break-words text-sm font-semibold">{folder.title}</h3><ArrowUpRight className="mt-0.5 size-4 shrink-0 text-text-tertiary" aria-hidden="true" /></div></button><div className="px-3 pb-2">{folder.description && <p className="mt-1 line-clamp-1 text-xs leading-5 text-text-secondary">{folder.description}</p>}<div className="mt-2 flex items-center justify-between gap-2 border-t border-border-subtle pt-2"><button type="button" onClick={() => setSelectedId(folder.id)} className="min-h-8 text-xs font-semibold text-brand-primary hover:underline">Manage folder</button><button type="button" onClick={() => setRemoving(folder.id)} aria-label={`Delete portfolio folder ${folder.title}`} className="flex size-8 items-center justify-center rounded-lg text-text-tertiary hover:bg-error-soft hover:text-error"><Trash2 className="size-4" aria-hidden="true" /></button></div><DeleteConfirmation open={removing === folder.id} onOpenChange={(open) => { if (!open) setRemoving(""); }} title="Delete portfolio folder?" description={`“${folder.title}” and its photos will be removed from your profile draft. Save your profile to apply this change, or cancel profile editing to restore it.`} onConfirm={() => update((current) => ({ ...current, portfolioFolders: current.portfolioFolders.filter((item) => item.id !== folder.id) }))} /></div></article>)}</div> : <div className="flex flex-col items-center rounded-2xl border border-dashed border-border-default bg-[#fafafa] px-5 py-12 text-center"><span className="flex size-14 items-center justify-center rounded-2xl border border-border-subtle bg-white"><Folder className="size-6 text-brand-primary" aria-hidden="true" /></span><h3 className="mt-5 text-base font-semibold">Every event has a story.</h3><p className="mt-2 max-w-sm text-sm leading-7 text-text-secondary">Create your first folder above, add a recognisable cover, then bring the project to life with photos.</p></div>}
      <p className="mt-5 text-[0.6875rem] leading-6 text-text-tertiary">{profile.portfolioFolders.length} of 12 folders · up to 12 photos per folder · open a folder to add photos or change its cover.</p>
    </>}
  </ProfileSection>;
}
