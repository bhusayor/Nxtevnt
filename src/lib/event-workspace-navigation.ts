export type WorkspaceSection = "overview" | "notes" | "guests" | "proposal" | "tasks" | "moodboard" | "agenda" | "control-room" | "files";

export function workspaceSection(value?: string): WorkspaceSection {
  if (value === "budget" || value === "budget-proposal") return "proposal";
  if (value === "decisions") return "notes";
  return ["overview", "notes", "guests", "proposal", "tasks", "moodboard", "agenda", "control-room", "files"].includes(value || "") ? value as WorkspaceSection : "overview";
}

export function budgetWorkspaceTab(section?: string, tab?: string) {
  if (tab === "proposals" || tab === "proposal") return "proposals";
  if (tab === "budget" || section === "budget") return "budget";
  return section === "proposal" ? "proposals" : "budget";
}
