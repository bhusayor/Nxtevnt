"use client";

import { useEffect, useState, type ReactNode } from "react";
import { ClipboardList, MessageSquareText, Scale } from "@/components/ui/icons";

import { EventNotesTab } from "@/components/planner/event-notes-tab";
import { EventQuestionnairesTab } from "@/components/planner/event-questionnaires-tab";
import type { PlannerEvent } from "@/lib/planner-events";
import { cn } from "@/lib/utils/cn";

export function EventNotesQuestionnaires({ event, initialTab, initialAction, onActionConsumed, decisions }: { event: PlannerEvent; initialTab?: string; initialAction?: string; onActionConsumed?: () => void; decisions: ReactNode }) {
  const [tab, setTab] = useState(initialTab === "questionnaires" ? "questionnaires" : initialTab === "decisions" ? "decisions" : "notes");
  useEffect(() => { if (initialAction) onActionConsumed?.(); }, [initialAction, onActionConsumed]);
  return <div className="space-y-5"><div role="tablist" aria-label="Notes, questionnaires and decisions" className="inline-flex max-w-full overflow-x-auto rounded-xl border border-border-subtle bg-white p-1">{[{ id: "notes", label: "Notes", icon: MessageSquareText }, { id: "questionnaires", label: "Questionnaire", icon: ClipboardList }, { id: "decisions", label: "Decision", icon: Scale }].map((entry) => <button key={entry.id} type="button" role="tab" id={`${entry.id}-tab`} aria-selected={tab === entry.id} aria-controls={`${entry.id}-panel`} onClick={() => setTab(entry.id)} className={cn("inline-flex min-h-9 shrink-0 items-center gap-2 rounded-lg px-3 text-xs font-semibold sm:px-4", tab === entry.id ? "bg-[#eaf3ed] text-brand-primary" : "text-text-secondary hover:text-text-primary")}><entry.icon className="size-4" aria-hidden="true" />{entry.label}</button>)}</div><div role="tabpanel" id={`${tab}-panel`} aria-labelledby={`${tab}-tab`}>{tab === "notes" ? <EventNotesTab event={event} initialCompose={initialAction === "write"} /> : tab === "questionnaires" ? <EventQuestionnairesTab event={event} initialTemplateOpen={initialAction === "choose-template"} /> : decisions}</div></div>;
}
