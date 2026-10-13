"use client";

import { useEffect, useState } from "react";
import { ClipboardList, MessageSquareText } from "@/components/ui/icons";

import { EventNotesTab } from "@/components/planner/event-notes-tab";
import { EventQuestionnairesTab } from "@/components/planner/event-questionnaires-tab";
import type { PlannerEvent } from "@/lib/planner-events";
import { cn } from "@/lib/utils/cn";

export function EventNotesQuestionnaires({ event, initialTab, initialAction, onActionConsumed }: { event: PlannerEvent; initialTab?: string; initialAction?: string; onActionConsumed?: () => void }) {
  const [tab, setTab] = useState<"notes" | "questionnaires">(initialTab === "questionnaires" ? "questionnaires" : "notes");
  useEffect(() => { if (initialAction) onActionConsumed?.(); }, [initialAction, onActionConsumed]);
  return <div className="space-y-5"><div role="tablist" aria-label="Notes and questionnaires" className="inline-flex max-w-full rounded-xl border border-border-subtle bg-white p-1"><button type="button" role="tab" id="notes-tab" aria-selected={tab === "notes"} aria-controls="notes-panel" onClick={() => setTab("notes")} className={cn("inline-flex min-h-9 items-center gap-2 rounded-lg px-4 text-xs font-semibold", tab === "notes" ? "bg-[#eaf3ed] text-brand-primary" : "text-text-secondary hover:text-text-primary")}><MessageSquareText className="size-4" aria-hidden="true" />Notes</button><button type="button" role="tab" id="questionnaires-tab" aria-selected={tab === "questionnaires"} aria-controls="questionnaires-panel" onClick={() => setTab("questionnaires")} className={cn("inline-flex min-h-9 items-center gap-2 rounded-lg px-4 text-xs font-semibold", tab === "questionnaires" ? "bg-[#eaf3ed] text-brand-primary" : "text-text-secondary hover:text-text-primary")}><ClipboardList className="size-4" aria-hidden="true" />Questionnaires{(event.questionnaires?.length ?? 0) > 0 && <span className="rounded-full bg-white px-1.5 py-0.5 text-[0.625rem]">{event.questionnaires?.length}</span>}</button></div><div role="tabpanel" id={tab === "notes" ? "notes-panel" : "questionnaires-panel"} aria-labelledby={tab === "notes" ? "notes-tab" : "questionnaires-tab"}>{tab === "notes" ? <EventNotesTab event={event} initialCompose={initialAction === "write"} /> : <EventQuestionnairesTab event={event} initialTemplateOpen={initialAction === "choose-template"} />}</div></div>;
}
