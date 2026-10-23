export const overviewEventTypes = [
  { key: "wedding", label: "Wedding", color: "#10b981" },
  { key: "corporate", label: "Corporate", color: "#2dbcf0" },
  { key: "party", label: "Party", color: "#ff8b2d" },
  { key: "mixed", label: "Mixed", color: "#7c3aed" },
  { key: "other", label: "Other", color: "#9ca3af" },
] as const;

export function overviewEventType(value: string) {
  const type = value.toLowerCase();
  const matches = [
    /wedding/.test(type) ? "wedding" : "",
    /corporate|conference|summit|seminar/.test(type) ? "corporate" : "",
    /party|birthday/.test(type) ? "party" : "",
  ].filter(Boolean);
  const key = /mixed|multiple/.test(type) || matches.length > 1 ? "mixed" : matches[0] || "other";
  return overviewEventTypes.find((entry) => entry.key === key)!;
}
