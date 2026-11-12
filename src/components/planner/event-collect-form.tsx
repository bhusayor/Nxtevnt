"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, Pencil, Plus, Send, Smartphone, Trash2 } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { EventFormShareDialog } from "@/components/planner/event-form-share-dialog";
import type { PlannerEvent } from "@/lib/planner-events";
import type { GuestQuestion, GuestWorkspaceData } from "@/lib/event-guests";

type Props = {
  event: PlannerEvent;
  data: GuestWorkspaceData;
  save: (recipe: (current: GuestWorkspaceData) => GuestWorkspaceData) => void;
};

const questionTypes: GuestQuestion["type"][] = ["Short answer", "Long answer", "Yes or no"];

export function EventCollectForm({ event, data, save }: Props) {
  const { collector, questions } = data;
  const sections = collector.sections;
  const firstSectionId = sections[0]?.id;
  const [shareOpen, setShareOpen] = useState(false);

  function borrowRsvpQuestions() {
    save((current) => {
      const existing = new Set(current.questions.map((question) => question.label.trim().toLowerCase()));
      const borrowed = current.rsvpForm.questions.filter((question) => !existing.has(question.label.trim().toLowerCase()));
      return {
        ...current,
        questions: [...current.questions, ...borrowed.map((question) => ({
          id: crypto.randomUUID(), sectionId: current.collector.sections[0]?.id, label: question.label,
          type: question.type === "Number" ? "Short answer" as const : question.type,
          required: question.required,
        }))],
      };
    });
  }

  function patchCollector(patch: Partial<GuestWorkspaceData["collector"]>) {
    save((current) => ({ ...current, collector: { ...current.collector, ...patch } }));
  }

  function addSection() {
    save((current) => ({
      ...current,
      collector: {
        ...current.collector,
        sections: [...current.collector.sections, { id: crypto.randomUUID(), title: "New section" }],
      },
    }));
  }

  function addQuestion(sectionId: string) {
    save((current) => ({
      ...current,
      questions: [...current.questions, { id: crypto.randomUUID(), sectionId, label: "New question", type: "Short answer", required: false }],
    }));
  }

  function updateQuestion(id: string, patch: Partial<GuestQuestion>) {
    save((current) => ({
      ...current,
      questions: current.questions.map((question) => question.id === id ? { ...question, ...patch } : question),
    }));
  }

  function moveQuestion(id: string, direction: -1 | 1) {
    save((current) => {
      const index = current.questions.findIndex((question) => question.id === id);
      if (index < 0) return current;
      const sectionId = current.questions[index].sectionId ?? current.collector.sections[0]?.id;
      const indexes = current.questions.flatMap((question, questionIndex) =>
        (question.sectionId ?? current.collector.sections[0]?.id) === sectionId ? [questionIndex] : [],
      );
      const next = indexes[indexes.indexOf(index) + direction];
      if (next === undefined) return current;
      const reordered = [...current.questions];
      [reordered[index], reordered[next]] = [reordered[next], reordered[index]];
      return { ...current, questions: reordered };
    });
  }

  return <div className="space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#dce7df] bg-[#f7faf8] px-4 py-3">
      <div>
        <p className="text-sm font-semibold text-brand-primary">{collector.closed ? "Collection paused" : "Ready to collect guest details"}</p>
        <p className="mt-0.5 text-xs text-text-secondary">{collector.closed ? "Reopen the form when you’re ready for more responses." : "Share this short form before sending invitations."}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2"><Button size="sm" variant="outline" onClick={() => patchCollector({ closed: !collector.closed })}>{collector.closed ? "Reopen form" : "Close form"}</Button><Button size="sm" leadingIcon={<Send className="size-3.5" />} onClick={() => setShareOpen(true)}>Share collector</Button></div>
    </div>

    <div className="grid gap-3 sm:grid-cols-[180px_minmax(0,1fr)]">
      <label className="block text-xs font-semibold text-text-primary">Closes on
        <input type="date" value={collector.closesOn} onChange={(event) => patchCollector({ closesOn: event.target.value })} className="mt-1 block h-9 w-full rounded-lg border border-border-default bg-white px-3 text-xs font-normal text-text-primary outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10" />
      </label>
      <label className="block text-xs font-semibold text-text-primary">A line from the host
        <input type="text" value={collector.hostLine} onChange={(event) => patchCollector({ hostLine: event.target.value })} placeholder="Invite guests to share their details" className="mt-1 block h-9 w-full rounded-lg border border-border-default bg-white px-3 text-xs font-normal text-text-primary outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10" />
      </label>
    </div>

    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_290px]">
      <section className="min-w-0 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div><h4 className="text-sm font-semibold">Form questions</h4><p className="mt-0.5 text-xs text-text-secondary">{sections.length} {sections.length === 1 ? "section" : "sections"} · {questions.length} questions</p></div>
          <div className="flex items-center gap-2"><Button size="sm" variant="outline" onClick={borrowRsvpQuestions}>Borrow RSVP questions</Button><Button size="sm" variant="outline" leadingIcon={<Plus className="size-3.5" />} onClick={addSection}>Add section</Button></div>
        </div>

        {sections.map((section, sectionIndex) => {
          const sectionQuestions = questions.filter((question) => (question.sectionId ?? firstSectionId) === section.id);
          return <div key={section.id} className="space-y-2.5">
            <div className="flex items-center gap-2 border-b border-border-subtle pb-2">
              <div className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-[#dce7df] bg-[#f3f7f4] px-3 focus-within:border-brand-primary focus-within:ring-2 focus-within:ring-brand-primary/15">
                <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wider text-text-tertiary">Section {sectionIndex + 1}</span>
                <input
                  aria-label={`Edit section ${sectionIndex + 1} title`}
                  value={section.title}
                  onChange={(event) => save((current) => ({ ...current, collector: { ...current.collector, sections: current.collector.sections.map((item) => item.id === section.id ? { ...item, title: event.target.value } : item) } }))}
                  className="min-w-0 flex-1 bg-transparent py-2 text-xs font-semibold text-brand-primary outline-none"
                />
                <Pencil className="size-3.5 shrink-0 text-brand-primary" aria-hidden="true" />
                <span className="hidden shrink-0 text-[11px] font-medium text-brand-primary sm:inline">Edit title</span>
              </div>
              <Button size="sm" leadingIcon={<Plus className="size-3.5" />} onClick={() => addQuestion(section.id)}>Add question</Button>
            </div>

            {sectionQuestions.map((question, index) => <div key={question.id} className="rounded-xl border border-border-subtle bg-white p-3">
              <div className="flex items-center gap-2">
                <input
                  aria-label={`Question ${index + 1} in ${section.title}`}
                  value={question.label}
                  onChange={(event) => updateQuestion(question.id, { label: event.target.value })}
                  className="min-w-0 flex-1 rounded-lg border border-border-subtle bg-[#f8faf8] px-3 py-2 text-xs text-text-primary outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10"
                />
                <button type="button" aria-label={`Delete ${question.label}`} onClick={() => save((current) => ({ ...current, questions: current.questions.filter((item) => item.id !== question.id) }))} className="flex size-8 shrink-0 items-center justify-center rounded-lg text-text-tertiary hover:bg-error-soft hover:text-error"><Trash2 className="size-3.5" /></button>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Select ariaLabel={`Answer type for ${question.label}`} value={question.type} onValueChange={(value) => updateQuestion(question.id, { type: value as GuestQuestion["type"] })} options={questionTypes.map((type) => ({ value: type, label: type }))} className="h-8 w-[126px] gap-1.5 rounded-lg px-2.5 text-xs" />
                <label className="inline-flex items-center gap-1.5 text-xs text-text-secondary"><input type="checkbox" checked={question.required} onChange={(event) => updateQuestion(question.id, { required: event.target.checked })} className="size-3.5 accent-brand-primary" />Required</label>
                <div className="ml-auto flex items-center gap-1">
                  <button type="button" disabled={index === 0} aria-label={`Move ${question.label} up`} onClick={() => moveQuestion(question.id, -1)} className="flex size-7 items-center justify-center rounded-lg text-text-secondary hover:bg-[#f1f5f2] disabled:opacity-35"><ArrowUp className="size-3.5" /></button>
                  <button type="button" disabled={index === sectionQuestions.length - 1} aria-label={`Move ${question.label} down`} onClick={() => moveQuestion(question.id, 1)} className="flex size-7 items-center justify-center rounded-lg text-text-secondary hover:bg-[#f1f5f2] disabled:opacity-35"><ArrowDown className="size-3.5" /></button>
                </div>
              </div>
            </div>)}
            {sectionQuestions.length === 0 && <p className="rounded-xl border border-dashed border-border-subtle bg-white px-3 py-4 text-xs text-text-secondary">No questions in this section yet.</p>}
          </div>;
        })}
      </section>

      <aside className="min-w-0 lg:sticky lg:top-5 lg:self-start">
        <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-text-secondary"><Smartphone className="size-3.5" />Guest phone preview</p>
        <div className="flex max-h-[min(580px,calc(100dvh-5rem))] flex-col overflow-hidden rounded-[1.5rem] border-[4px] border-[#e1e7e5] bg-white shadow-[0_8px_24px_rgba(27,55,40,0.06)]">
          <div className="bg-[#edf3ef] px-4 py-4"><p className="text-[11px] font-bold tracking-wider text-brand-primary">NXTEVNT</p><h5 className="mt-2 text-base font-semibold leading-snug">{event.name}</h5>{collector.hostLine && <p className="mt-2 text-xs leading-5 text-text-secondary">{collector.hostLine}</p>}</div>
          <div className="min-h-0 space-y-5 overflow-y-auto px-4 py-4">
            {sections.map((section, index) => {
              const sectionQuestions = questions.filter((question) => (question.sectionId ?? firstSectionId) === section.id);
              return <div key={section.id} className="space-y-3"><h6 className="text-xs font-semibold">{index + 1}. {section.title || "Untitled section"}</h6>{sectionQuestions.map((question) => <div key={question.id}><p className="mb-1.5 text-xs font-medium text-text-primary">{question.label || "Untitled question"}{question.required && <span className="text-error"> *</span>}</p>{question.type === "Yes or no" ? <div className="space-y-1 text-xs text-text-secondary"><p>◯ Yes</p><p>◯ No</p></div> : <div className={question.type === "Long answer" ? "h-14 rounded-lg border border-border-subtle bg-[#f8faf8]" : "h-8 rounded-lg border border-border-subtle bg-[#f8faf8]"} />}</div>)}</div>;
            })}
          </div>
        </div>
      </aside>
    </div>
    <EventFormShareDialog event={event} kind="collect" open={shareOpen} onOpenChange={setShareOpen} />
  </div>;
}
