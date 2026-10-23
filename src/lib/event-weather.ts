export type EventForecast = { date: string; city: string; condition: string; high: number; low: number; rainChance: number | null; fetchedAt: string; source: "Open-Meteo" };

export function localEventToday(timeZone = "Africa/Lagos", now = new Date()) {
  try { return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(now); }
  catch { return new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Lagos", year: "numeric", month: "2-digit", day: "2-digit" }).format(now); }
}
export function eventDayOffset(date: string, today: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{4}-\d{2}-\d{2}$/.test(today)) return NaN;
  const parsed = new Date(`${date}T12:00:00Z`);
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) return NaN;
  return Math.round((parsed.getTime() - Date.parse(`${today}T12:00:00Z`)) / 86_400_000);
}
export function isForecastWindow(date: string, today: string) { const days = eventDayOffset(date, today); return Number.isFinite(days) && days >= 0 && days <= 7; }
export function weatherCondition(code: number) {
  if (code === 0) return "Clear skies";
  if ([1, 2].includes(code)) return "Partly cloudy";
  if (code === 3) return "Cloudy";
  if ([45, 48].includes(code)) return "Fog";
  if ([51, 53, 55, 56, 57].includes(code)) return "Drizzle";
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return "Rain";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "Snow";
  if ([95, 96, 99].includes(code)) return "Thunderstorms";
  return "Forecast";
}
