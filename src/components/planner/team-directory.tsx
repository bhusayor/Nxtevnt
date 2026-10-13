"use client";

import { useState, type FormEvent } from "react";
import { Plus, Trash2, UsersRound } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addPlannerTeamMember, removePlannerTeamMember, usePlannerTeam } from "@/lib/planner-team";

function initials(name: string) {
  return name.split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("");
}

export function TeamDirectory() {
  const members = usePlannerTeam();
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [pendingRemoval, setPendingRemoval] = useState<string | null>(null);

  function add(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try { addPlannerTeamMember(name); setName(""); setError(""); }
    catch (failure) { setError(failure instanceof Error ? failure.message : "This member could not be added."); }
  }

  function remove(id: string) {
    try { removePlannerTeamMember(id); setPendingRemoval(null); setError(""); }
    catch { setError("This member could not be removed. Please try again."); }
  }

  return <div className="mx-auto w-full max-w-4xl space-y-7 pb-10">
    <header><p className="text-[0.6875rem] font-bold uppercase tracking-[0.14em] text-brand-primary">Planner workspace / Team</p><h1 className="mt-2 text-[1.75rem] font-semibold tracking-tight sm:text-[2rem]">Your team</h1><p className="mt-2 text-sm text-text-secondary">Keep the names of people you plan with in one place. They’ll be available when you assign a lead to an event.</p></header>
    <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
      <section className="overflow-hidden rounded-2xl border border-border-subtle bg-white" aria-label="Team members">
        <div className="flex items-center justify-between border-b border-border-subtle px-5 py-4"><div><h2 className="text-sm font-semibold">Members</h2><p className="mt-1 text-xs text-text-tertiary">{members.length} {members.length === 1 ? "person" : "people"} in your planner workspace</p></div><span className="flex size-9 items-center justify-center rounded-lg bg-[#edf4ee] text-brand-primary"><UsersRound className="size-4" aria-hidden="true" /></span></div>
        <ul className="divide-y divide-border-subtle">{members.map((member) => <li key={member.id} className="flex flex-wrap items-center gap-3 px-5 py-4"><span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#e9f1eb] text-xs font-semibold text-brand-primary">{initials(member.name)}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{member.name}</p><p className="mt-0.5 text-xs text-text-tertiary">{member.isOwner ? "Workspace owner" : "Team member"}</p></div>{!member.isOwner && (pendingRemoval === member.id ? <div className="flex items-center gap-2"><button type="button" onClick={() => setPendingRemoval(null)} className="min-h-9 px-2 text-xs font-semibold text-text-secondary">Keep</button><button type="button" onClick={() => remove(member.id)} className="min-h-9 rounded-lg bg-error-soft px-3 text-xs font-semibold text-error">Remove</button></div> : <button type="button" onClick={() => setPendingRemoval(member.id)} aria-label={`Remove ${member.name}`} className="flex size-9 items-center justify-center rounded-lg text-text-tertiary hover:bg-error-soft hover:text-error"><Trash2 className="size-4" aria-hidden="true" /></button>)}</li>)}</ul>
      </section>
      <form onSubmit={add} className="rounded-2xl border border-border-subtle bg-white p-5 sm:p-6"><span className="flex size-9 items-center justify-center rounded-lg bg-[#edf4ee] text-brand-primary"><Plus className="size-4" aria-hidden="true" /></span><h2 className="mt-4 text-sm font-semibold">Add a team member</h2><p className="mt-1 text-xs leading-5 text-text-secondary">Add their name to make them available in event creation.</p><div className="mt-5"><Input label="Full name" placeholder="e.g. Tayo Adeyemi" value={name} maxLength={80} onChange={(event) => { setName(event.target.value); if (error) setError(""); }} required /></div>{error && <p role="alert" className="mt-3 text-xs text-error">{error}</p>}<Button type="submit" size="sm" className="mt-5" leadingIcon={<Plus className="size-4" aria-hidden="true" />}>Add member</Button><p className="mt-4 text-[0.6875rem] leading-5 text-text-tertiary">Names are saved in this browser. Adding someone here does not send an invitation.</p></form>
    </div>
  </div>;
}
