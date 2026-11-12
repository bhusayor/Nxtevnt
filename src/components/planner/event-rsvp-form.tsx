"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, GripVertical, Pencil, Plus, Send, Smartphone, Trash2 } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { EventFormShareDialog } from "@/components/planner/event-form-share-dialog";
import { cn } from "@/lib/utils/cn";
import type { PlannerEvent } from "@/lib/planner-events";
import type { GuestWorkspaceData, RsvpForm, RsvpFormQuestion } from "@/lib/event-guests";

type Props = {
  event: PlannerEvent;
  data: GuestWorkspaceData;
  save: (recipe: (current: GuestWorkspaceData) => GuestWorkspaceData) => void;
};

const questionTypes: RsvpFormQuestion["type"][] = ["Short answer", "Long answer", "Yes or no", "Number"];

export function EventRsvpForm({ event, data, save }: Props) {
  const [shareOpen, setShareOpen] = useState(false);
  const form = data.rsvpForm;
  const patchForm = (recipe: (current: RsvpForm) => RsvpForm) =>
    save((current) => ({ ...current, rsvpForm: recipe(current.rsvpForm) }));

  function addSection() {
    patchForm((current) => ({ ...current, sections: [...current.sections, { id: crypto.randomUUID(), title: "New section" }] }));
  }

  function addQuestion(sectionId: string) {
    patchForm((current) => {
      const question: RsvpFormQuestion = { id: crypto.randomUUID(), sectionId, label: "New question", type: "Short answer", required: false };
      const lastIndex = current.questions.findLastIndex((item) => item.sectionId === sectionId);
      const questions = [...current.questions];
      questions.splice(lastIndex + 1, 0, question);
      return { ...current, questions };
    });
  }

  function updateQuestion(id: string, patch: Partial<RsvpFormQuestion>) {
    patchForm((current) => ({ ...current, questions: current.questions.map((item) => item.id === id ? { ...item, ...patch } : item) }));
  }

  function moveQuestion(id: string, direction: -1 | 1) {
    patchForm((current) => {
      const index = current.questions.findIndex((item) => item.id === id);
      if (index < 0) return current;
      const sectionIndexes = current.questions.flatMap((item, itemIndex) => item.sectionId === current.questions[index].sectionId ? [itemIndex] : []);
      const position = sectionIndexes.indexOf(index);
      const next = sectionIndexes[position + direction];
      if (next === undefined) return current;
      const questions = [...current.questions];
      [questions[index], questions[next]] = [questions[next], questions[index]];
      return { ...current, questions };
    });
  }

  return <div className="space-y-4">
    <section className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 rounded-xl border border-[#dce7df] bg-[#f7faf8] px-4 py-3">
      <div className="min-w-0 flex-1">
        <h4 className="text-sm font-semibold text-text-primary">Who can RSVP?</h4>
        <p className="mt-0.5 text-xs leading-5 text-text-secondary">{form.allowSelfAdded ? "Anyone with the link can respond. New guests wait for your approval." : "Only people already on your guest list can respond."}</p>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <span className="text-xs font-medium text-text-primary">Allow new guests</span>
        <button
          type="button"
          role="switch"
          aria-label="Allow new guests to RSVP"
          aria-checked={form.allowSelfAdded}
          onClick={() => patchForm((current) => ({ ...current, allowSelfAdded: !current.allowSelfAdded }))}
          className={cn("relative h-6 w-11 rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary", form.allowSelfAdded ? "bg-brand-primary" : "bg-[#dfe5e4]")}
        >
          <span className={cn("absolute left-0.5 top-0.5 size-5 rounded-full bg-white shadow-sm transition-transform", form.allowSelfAdded && "translate-x-5")} />
        </button>
      </div>
    </section>

    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_290px]">
      <section className="min-w-0 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div><h4 className="text-sm font-semibold">Form questions</h4><p className="mt-0.5 text-xs text-text-secondary">{form.sections.length} sections · {form.questions.length} questions</p></div>
          <div className="flex flex-wrap items-center gap-2"><Button size="sm" variant="outline" leadingIcon={<Plus className="size-3.5" />} onClick={addSection}>Add section</Button><Button size="sm" leadingIcon={<Send className="size-3.5" />} onClick={() => setShareOpen(true)}>Share RSVP form</Button></div>
        </div>
        {form.sections.map((section, sectionIndex) => {
          const questions = form.questions.filter((item) => item.sectionId === section.id);
          return <div key={section.id} className="space-y-2.5">
            <div className="flex items-center gap-2 border-b border-border-subtle pb-2">
              <div className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-[#dce7df] bg-[#f3f7f4] px-3 focus-within:border-brand-primary focus-within:ring-2 focus-within:ring-brand-primary/15">
                <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wider text-text-tertiary">Section {sectionIndex + 1}</span>
                <input
                  aria-label={`Edit section ${sectionIndex + 1} title`}
                  value={section.title}
                  onChange={(event) => patchForm((current) => ({ ...current, sections: current.sections.map((item) => item.id === section.id ? { ...item, title: event.target.value } : item) }))}
                  className="min-w-0 flex-1 bg-transparent py-2 text-xs font-semibold text-brand-primary outline-none"
                />
                <Pencil className="size-3.5 shrink-0 text-brand-primary" aria-hidden="true" />
                <span className="hidden shrink-0 text-[11px] font-medium text-brand-primary sm:inline">Edit title</span>
              </div>
              <Button size="sm" leadingIcon={<Plus className="size-3.5" />} onClick={() => addQuestion(section.id)}>Add question</Button>
            </div>
            {questions.map((question, index) => <div key={question.id} className="rounded-xl border border-border-subtle bg-white p-3">
              <div className="flex items-center gap-2">
                <GripVertical className="size-3.5 shrink-0 text-text-tertiary" aria-hidden="true" />
                <input
                  aria-label={`Question ${index + 1} in ${section.title}`}
                  value={question.label}
                  onChange={(event) => updateQuestion(question.id, { label: event.target.value })}
                  className="min-w-0 flex-1 rounded-lg border border-border-subtle bg-[#f8faf8] px-3 py-2 text-xs text-text-primary outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10"
                />
                <button type="button" aria-label={`Delete ${question.label}`} onClick={() => patchForm((current) => ({ ...current, questions: current.questions.filter((item) => item.id !== question.id) }))} className="flex size-8 shrink-0 items-center justify-center rounded-lg text-text-tertiary hover:bg-error-soft hover:text-error"><Trash2 className="size-3.5" /></button>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2 pl-5">
                <Select ariaLabel={`Answer type for ${question.label}`} value={question.type} onValueChange={(value) => updateQuestion(question.id, { type: value as RsvpFormQuestion["type"] })} options={questionTypes.map((type) => ({ value: type, label: type }))} className="h-8 w-[126px] gap-1.5 rounded-lg px-2.5 text-xs" />
                <label className="inline-flex items-center gap-1.5 text-xs text-text-secondary"><input type="checkbox" checked={question.required} onChange={(event) => updateQuestion(question.id, { required: event.target.checked })} className="size-3.5 accent-brand-primary" />Required</label>
                <div className="ml-auto flex items-center gap-1">
                  <button type="button" disabled={index === 0} aria-label={`Move ${question.label} up`} onClick={() => moveQuestion(question.id, -1)} className="flex size-7 items-center justify-center rounded-lg text-text-secondary hover:bg-[#f1f5f2] disabled:opacity-35"><ArrowUp className="size-3.5" /></button>
                  <button type="button" disabled={index === questions.length - 1} aria-label={`Move ${question.label} down`} onClick={() => moveQuestion(question.id, 1)} className="flex size-7 items-center justify-center rounded-lg text-text-secondary hover:bg-[#f1f5f2] disabled:opacity-35"><ArrowDown className="size-3.5" /></button>
                </div>
              </div>
            </div>)}
            {questions.length === 0 && <p className="rounded-xl border border-dashed border-border-subtle bg-white px-3 py-4 text-xs text-text-secondary">No questions in this section yet.</p>}
          </div>;
        })}
      </section>

      <aside className="min-w-0 lg:sticky lg:top-5 lg:self-start">
        <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-text-secondary"><Smartphone className="size-3.5" />Guest phone preview</p>
        <div className="flex max-h-[min(580px,calc(100dvh-5rem))] flex-col overflow-hidden rounded-[1.5rem] border-[4px] border-[#e1e7e5] bg-white shadow-[0_8px_24px_rgba(27,55,40,0.06)]">
          <div className="bg-[#edf3ef] px-4 py-4"><p className="text-[11px] font-bold tracking-wider text-brand-primary">NXTEVNT</p><h5 className="mt-2 text-base font-semibold leading-snug">{event.name}</h5></div>
          <div className="min-h-0 space-y-5 overflow-y-auto px-4 py-4">
            {form.sections.map((section, index) => {
              const questions = form.questions.filter((item) => item.sectionId === section.id);
              return <div key={section.id} className="space-y-3"><h6 className="text-xs font-semibold">{index + 1}. {section.title || "Untitled section"}</h6>{questions.map((question) => <div key={question.id}><p className="mb-1.5 text-xs font-medium text-text-primary">{question.label || "Untitled question"}{question.required && <span className="text-error"> *</span>}</p>{question.type === "Yes or no" ? <div className="space-y-1 text-xs text-text-secondary"><p>◯ Yes</p><p>◯ No</p></div> : <div className={cn("rounded-lg border border-border-subtle bg-[#f8faf8]", question.type === "Long answer" ? "h-14" : "h-8")} />}</div>)}</div>;
            })}
          </div>
        </div>
      </aside>
    </div>
    <EventFormShareDialog event={event} kind="rsvp" open={shareOpen} onOpenChange={setShareOpen} />
  </div>;
}
