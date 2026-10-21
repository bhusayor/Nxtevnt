"use client";

import { DeleteConfirmation } from "@/components/ui/delete-confirmation";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ClipboardList, Trash2 } from "@/components/ui/icons";

import { QuestionnaireBuilder } from "@/components/planner/questionnaire-builder";
import { deleteQuestionnaireTemplate, questionCount, starterTemplates, useQuestionnaireTemplates } from "@/lib/questionnaires";

export function QuestionnaireSettings() {
  const custom = useQuestionnaireTemplates();
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [error, setError] = useState("");

  function remove(id: string) {
    try { deleteQuestionnaireTemplate(id); setConfirmDelete(null); setError(""); return true; }
    catch { setError("The template couldn’t be deleted. Please try again."); return false; }
  }

  return <div className="mx-auto w-full max-w-6xl space-y-7 pb-8"><header><Link href="/planner/events" className="inline-flex min-h-9 items-center gap-2 text-xs font-semibold text-text-secondary hover:text-brand-primary"><ArrowLeft className="size-4" aria-hidden="true" />All events</Link><p className="mt-4 text-[0.6875rem] font-bold uppercase tracking-[0.14em] text-brand-primary">Planner settings</p><h1 className="mt-2 text-[1.75rem] font-semibold tracking-[-0.04em]">Questionnaire templates</h1><p className="mt-2 max-w-2xl text-sm text-text-secondary">Build reusable questions for your clients. Sent questionnaires keep their own copy, so changing the template library never changes an active request.</p></header>
    {error && <p role="alert" className="rounded-lg bg-error-soft px-3 py-2 text-xs text-error">{error}</p>}
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_300px]"><QuestionnaireBuilder mode="template" /><section className="space-y-4 xl:sticky xl:top-24"><div><h2 className="text-base font-semibold">Available templates</h2><p className="mt-1 text-xs text-text-secondary">Choose one from an event’s Questionnaires tab.</p></div><div className="space-y-3">{[...starterTemplates, ...custom].map((template) => <article key={template.id} className="rounded-xl border border-border-subtle bg-white p-4"><div className="flex items-start gap-3"><span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#edf4ee] text-brand-primary"><ClipboardList className="size-[18px]" aria-hidden="true" /></span><div className="min-w-0 flex-1"><h3 className="text-xs font-semibold">{template.title}</h3><p className="mt-1 text-[0.6875rem] text-text-tertiary">{template.sections.length} sections · {questionCount(template)} questions · {template.category}</p></div>{template.custom && <button type="button" onClick={() => setConfirmDelete(template.id)} aria-label={`Delete ${template.title} template`} className="flex size-8 shrink-0 items-center justify-center rounded-lg text-text-tertiary hover:bg-error-soft hover:text-error"><Trash2 className="size-4" aria-hidden="true" /></button>}</div><DeleteConfirmation open={confirmDelete === template.id} onOpenChange={(open) => { if (!open) setConfirmDelete(null); }} title="Delete questionnaire template?" description={`“${template.title}” will be removed from your templates. Previously sent copies will remain. This can’t be undone.`} error={error} onConfirm={() => remove(template.id)} /></article>)}</div></section></div>
  </div>;
}
