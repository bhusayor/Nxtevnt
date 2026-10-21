import type { EventItem, PlannerEvent } from "./planner-events";

export const decisionCategories = ["Budget", "Design", "Vendors", "Guests", "Venue & dates", "Programme"] as const;
export const decisionChannels = { "in-app": "In the app", whatsapp: "WhatsApp", call: "Call", "in-person": "In person", email: "Email" } as const;
export type DecisionChangeInput = {
  id: string; title: string; category: NonNullable<EventItem["decisionCategory"]>;
  image?: string; decidedBy: "client" | "someone-else" | "on-behalf";
  name?: string; method: keyof typeof decisionChannels; decidedOn: string; note?: string;
  expectedRevision?: string;
};

/** History is append-only. Superseded records stay byte-for-byte intact. */
export function currentEventDecisions(event: PlannerEvent) {
  const replaced = new Set(event.sections.decisions.map((item) => item.supersedesDecisionId).filter(Boolean));
  return event.sections.decisions.filter((item) => !replaced.has(item.id));
}

export function decisionIsSuperseded(event: PlannerEvent, id: string) {
  return event.sections.decisions.some((item) => item.supersedesDecisionId === id);
}

/** Early approvals kept only a source-photo link; new records explicitly own their attachment. */
export function decisionAttachment(event: PlannerEvent, decision: EventItem) {
  return decision.image || (!decision.decisionRecord && decision.sourceMoodboardImageId ? event.sections.moodboard.find((item) => item.id === decision.sourceMoodboardImageId)?.image : undefined);
}

export function localDecisionDate(now = new Date()) {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

export function changeEventDecision(event: PlannerEvent, oldId: string, input: DecisionChangeInput, author: string, recordedAt: string): PlannerEvent {
  if (event.cancelledAt) throw new Error("Reopen this event before changing a decision.");
  const old = event.sections.decisions.find((item) => item.id === oldId);
  if (!old) throw new Error("This decision no longer exists.");
  if (decisionIsSuperseded(event, oldId)) throw new Error("This decision has already changed. Open the latest version to continue.");
  if (old.designApproval?.revision !== input.expectedRevision) throw new Error("This decision changed while you were editing. Reopen it to continue.");
  if (!input.id || event.sections.decisions.some((item) => item.id === input.id)) throw new Error("This new decision has already been recorded.");
  const title = input.title.trim(), note = input.note?.trim();
  if (!title || title.length > 240) throw new Error("Describe the decision in 1–240 characters.");
  if (!decisionCategories.includes(input.category)) throw new Error("Choose a decision category.");
  if (!["client", "someone-else", "on-behalf"].includes(input.decidedBy)) throw new Error("Choose who made the decision.");
  if (!Object.hasOwn(decisionChannels, input.method)) throw new Error("Choose how the decision was made.");
  if (input.decidedBy === "on-behalf" && input.method === "in-app") throw new Error("Choose how the client told you outside the app.");
  const name = input.decidedBy === "someone-else" ? input.name?.trim() : input.decidedBy === "client" ? event.clientName || "Client" : author;
  if (!name || name.length > 100) throw new Error("Enter the decision maker’s name, up to 100 characters.");
  const parsed = new Date(`${input.decidedOn}T12:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.decidedOn) || !Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== input.decidedOn || input.decidedOn > localDecisionDate(new Date(recordedAt))) throw new Error("Choose a valid decision date, today or earlier.");
  if ((note?.length || 0) > 280) throw new Error("Keep the note within 280 characters.");
  if (input.image && !(input.image.startsWith("nxtevnt-moodboard:") || input.image === decisionAttachment(event, old))) throw new Error("Upload the attachment before saving this decision.");

  // A planner cannot manufacture an in-app client confirmation. This becomes a fresh request.
  const pending = input.decidedBy === "client" && input.method === "in-app";
  const approval: NonNullable<EventItem["designApproval"]> = {
    mode: pending ? "client" : input.decidedBy === "on-behalf" ? "on-behalf" : "recorded",
    state: pending ? "awaiting-confirmation" : input.decidedBy === "on-behalf" ? "approved-on-behalf" : "recorded",
    by: author, at: recordedAt, decisionId: input.id, revision: input.id,
    ...(input.method !== "in-app" ? { method: input.method } : {}),
    ...(pending ? { delivery: "local-preview" as const, requestedAt: recordedAt } : {}),
  };
  const next: EventItem = {
    id: input.id, title, decisionCategory: input.category, image: input.image,
    supersedesDecisionId: old.id, done: !pending, designApproval: approval,
    sourceMoodboardImageId: old.sourceMoodboardImageId, sourceMoodboardBoardId: old.sourceMoodboardBoardId,
    decisionRecord: { decidedBy: input.decidedBy, name, method: input.method, decidedOn: input.decidedOn, recordedAt, recordedBy: author, note: note || undefined },
  };
  return { ...event, sections: { ...event.sections,
    decisions: [...event.sections.decisions, next],
    moodboard: event.sections.moodboard.map((item) => item.id === old.sourceMoodboardImageId ? { ...item, designApproval: approval } : item),
  } };
}

/** Client responses and reminders apply only to the latest decision, never its history. */
export function respondToEventDecision(event: PlannerEvent, id: string, revision: string | undefined, action: "confirm" | "remind", author: string, at: string): PlannerEvent {
  if (event.cancelledAt) throw new Error("This event was cancelled. Confirmations are closed.");
  const decision = event.sections.decisions.find((item) => item.id === id), approval = decision?.designApproval;
  if (!decision || decisionIsSuperseded(event, id) || !approval || approval.mode !== "client" || approval.state !== "awaiting-confirmation" || approval.revision !== revision) throw new Error("This request is no longer awaiting confirmation. Open the latest decision to continue.");
  if (action === "remind" && approval.remindedAt && Date.parse(at) - Date.parse(approval.remindedAt) < 60_000) throw new Error("A reminder was just added. Please wait a minute before reminding again.");
  const next: NonNullable<EventItem["designApproval"]> = action === "confirm" ? { ...approval, revision: `${revision || id}:confirmed:${at}`, state: "approved-by-client", confirmedBy: author, confirmedAt: at } : { ...approval, remindedAt: at, reminderCount: (approval.reminderCount || 0) + 1 };
  return { ...event, sections: { ...event.sections,
    decisions: event.sections.decisions.map((item) => item.id === id ? { ...item, designApproval: next, done: action === "confirm" } : item),
    moodboard: event.sections.moodboard.map((item) => item.designApproval?.decisionId === id ? { ...item, designApproval: next } : item),
  } };
}
