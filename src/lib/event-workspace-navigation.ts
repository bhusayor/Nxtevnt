export type OptionalWorkspaceSection = "guests" | "agenda" | "website" | "aso-ebi" | "accommodation" | "visa-travel" | "control-room";
export type WorkspaceSection = "overview" | "notes" | "proposal" | "tasks" | "moodboard" | "files" | OptionalWorkspaceSection;

export const defaultVisibleEventTabs: OptionalWorkspaceSection[] = ["agenda"];

export function visibleEventTabs(value?: OptionalWorkspaceSection[]): OptionalWorkspaceSection[] {
  return value ?? defaultVisibleEventTabs;
}

export function workspaceSection(value?: string): WorkspaceSection {
  if (value === "budget" || value === "budget-proposal") return "proposal";
  if (value === "decisions") return "notes";
  return ["overview", "notes", "proposal", "tasks", "moodboard", "files", "guests", "agenda", "website", "aso-ebi", "accommodation", "visa-travel", "control-room"].includes(value || "") ? value as WorkspaceSection : "overview";
}

export function budgetWorkspaceTab(section?: string, tab?: string) {
  if (tab === "bookings" || tab === "payments") return tab;
  if (tab === "proposals" || tab === "proposal") return "proposals";
  if (tab === "budget" || section === "budget") return "budget";
  return section === "proposal" ? "proposals" : "budget";
}
