"use client";

import { useEffect, useState } from "react";
import { Cloud, Sun } from "@/components/ui/icons";
import { StatusBadge, type ProductStatus } from "@/components/ui/status-badge";
import { isForecastWindow, localEventToday, type EventForecast } from "@/lib/event-weather";

const cache = new Map<string, { data: EventForecast; until: number }>();
export function EventWeatherPill({ date, city = "", timeZone, status }: { date?: string; city?: string; timeZone?: string; status: ProductStatus }) {
  const [now, setNow] = useState<Date | null>(null), [result, setResult] = useState<{ key: string; data?: EventForecast; error?: string }>({ key: "" });
  const eligible = status === "upcoming" && Boolean(now && date && isForecastWindow(date, localEventToday(timeZone, now)));
  const key = JSON.stringify([date, city, timeZone]), refresh = now ? Math.floor(now.getTime() / 3_600_000) : 0;
  useEffect(() => { setNow(new Date()); const timer = window.setInterval(() => setNow(new Date()), 60_000); return () => window.clearInterval(timer); }, []);
  useEffect(() => {
    if (!eligible || !city.trim() || !date) return;
    const saved = cache.get(key); if (saved && saved.until > Date.now()) { setResult({ key, data: saved.data }); return; }
    const controller = new AbortController(); let active = true; setResult({ key });
    const params = new URLSearchParams({ city: city.trim(), date, ...(timeZone ? { timeZone } : {}) });
    void fetch(`/api/event-weather?${params}`, { signal: controller.signal }).then(async (response) => {
      const body = await response.json(); if (!response.ok) throw Error(typeof body.error === "string" ? body.error : "Forecast unavailable.");
      if (body.date !== date || body.source !== "Open-Meteo" || typeof body.condition !== "string" || typeof body.city !== "string" || !Number.isFinite(body.high) || !Number.isFinite(body.low)) throw Error("Forecast unavailable.");
      if (active) { if (cache.size >= 100) cache.delete(cache.keys().next().value!); cache.set(key, { data: body, until: Date.now() + 3_600_000 }); setResult({ key, data: body }); }
    }).catch((problem) => { if (active && !controller.signal.aborted) setResult({ key, error: problem instanceof Error ? problem.message : "Forecast unavailable." }); });
    return () => { active = false; controller.abort(); };
  }, [eligible, key, city, date, timeZone, refresh]);
  if (!eligible) return <StatusBadge status={status} showDot={false} className="text-xs" />;
  const current = result.key === key ? result : undefined, weather = current?.data;
  const label = weather ? `${Math.round(weather.high)}° · ${weather.condition}` : !city.trim() ? "Add city for forecast" : current?.error ? "Forecast unavailable" : "Loading forecast…";
  const detail = weather ? `${weather.city} · ${weather.date}: ${Math.round(weather.low)}–${Math.round(weather.high)}°C, ${weather.condition}${weather.rainChance !== null ? `, ${weather.rainChance}% chance of rain` : ""}. Forecast, not a guarantee. Source: Open-Meteo.` : current?.error || (!city.trim() ? "Add the city in your event details to enable the event-day forecast." : "Fetching the forecast for the event date.");
  const Icon = weather?.condition === "Clear skies" ? Sun : Cloud;
  return <span tabIndex={0} title={detail} aria-label={detail} className="relative z-20 inline-flex max-w-full items-center gap-1.5 rounded-full border border-white/70 bg-white/95 px-2.5 py-1.5 text-xs font-semibold text-[#304f45] shadow-sm"><Icon className="size-3.5 shrink-0" aria-hidden="true" /><span className="truncate">{label}</span></span>;
}
