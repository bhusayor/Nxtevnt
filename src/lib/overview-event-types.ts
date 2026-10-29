export const overviewEventTypes = [
  { key: "wedding", label: "Wedding", color: "#10b981" },
  { key: "corporate", label: "Corporate", color: "#2dbcf0" },
  { key: "party", label: "Party", color: "#ff8b2d" },
  { key: "other", label: "Other", color: "#9ca3af" },
] as const;

export function overviewEventType(value: string) {
  const type = typeof value === "string" ? value.toLowerCase() : "";
  const matches = [
    /wedding/.test(type) ? "wedding" : "",
    /corporate|conference|summit|seminar/.test(type) ? "corporate" : "",
    /party|birthday/.test(type) ? "party" : "",
  ].filter(Boolean);
  // Historical multi-type values remain intact in storage and count once under Other.
  const key = /mixed|multiple/.test(type) || matches.length > 1 ? "other" : matches[0] || "other";
  return overviewEventTypes.find((entry) => entry.key === key)!;
}
