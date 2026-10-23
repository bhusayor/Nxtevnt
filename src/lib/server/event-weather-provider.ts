import { isForecastWindow, localEventToday, weatherCondition, type EventForecast } from "../event-weather";

export function createEventWeatherProvider({ fetcher = fetch, now = () => new Date(), apiKey = "", allowPrototype = false }: { fetcher?: typeof fetch; now?: () => Date; apiKey?: string; allowPrototype?: boolean } = {}) {
  const cache = new Map<string, { until: number; data: EventForecast }>(), pending = new Map<string, Promise<EventForecast>>();
  let hour = 0, attempts = 0;
  async function json(url: URL) { const response = await fetcher(url, { signal: AbortSignal.timeout(7000), cache: "no-store" }); if (!response.ok) throw Error("Forecast unavailable. Please try again later."); return response.json(); }
  async function load(city: string, date: string, timeZone: string) {
    const currentHour = Math.floor(now().getTime() / 3_600_000); if (hour !== currentHour) { hour = currentHour; attempts = 0; }
    if (++attempts > 100) throw Error("Forecast requests are temporarily limited. Please try again later.");
    if (!apiKey && !allowPrototype) throw Error("Weather is not configured for this build.");
    const geo = new URL(`https://${apiKey ? "customer-" : ""}geocoding-api.open-meteo.com/v1/search`);
    geo.search = new URLSearchParams({ name: city, count: "5", language: "en", format: "json", ...(timeZone === "Africa/Lagos" ? { countryCode: "NG" } : {}), ...(apiKey ? { apikey: apiKey } : {}) }).toString();
    const locations = await json(geo);
    type Location = { latitude: number; longitude: number; name: string; country_code: string; admin1?: string; timezone?: string; feature_code?: string };
    let matches: Location[] = Array.isArray(locations.results) ? locations.results.filter((item: Location) => item && typeof item.name === "string" && typeof item.country_code === "string" && typeof item.latitude === "number" && Number.isFinite(item.latitude) && Math.abs(item.latitude) <= 90 && typeof item.longitude === "number" && Number.isFinite(item.longitude) && Math.abs(item.longitude) <= 180) : [];
    const places = matches.filter((item) => item.feature_code?.startsWith("PPL")); if (places.length) matches = places;
    const normalizedName = (name: string) => name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();
    const exact = matches.filter((item) => normalizedName(item.name) === normalizedName(city.split(",")[0]));
    if (exact.length) matches = exact;
    if (!matches.length) throw Error("City not found. Add a city and country to the event.");
    if (new Set(matches.map((item) => item.country_code)).size > 1 || !city.includes(",") && new Set(matches.map((item) => item.admin1).filter(Boolean)).size > 1) throw Error("City is ambiguous. Add a city and country to the event.");
    const place = matches[0], forecast = new URL(`https://${apiKey ? "customer-api" : "api"}.open-meteo.com/v1/forecast`);
    forecast.search = new URLSearchParams({ latitude: String(place.latitude), longitude: String(place.longitude), daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max", timezone: timeZone || place.timezone || "auto", forecast_days: "8", ...(apiKey ? { apikey: apiKey } : {}) }).toString();
    const result = await json(forecast), daily = result.daily, index = Array.isArray(daily?.time) ? daily.time.indexOf(date) : -1;
    const high = daily?.temperature_2m_max?.[index], low = daily?.temperature_2m_min?.[index], code = daily?.weather_code?.[index], rain = daily?.precipitation_probability_max?.[index];
    if (index < 0 || typeof high !== "number" || !Number.isFinite(high) || typeof low !== "number" || !Number.isFinite(low) || high < low || high > 70 || low < -100 || typeof code !== "number" || !Number.isFinite(code)) throw Error("The event-day forecast is not available yet.");
    return { date, city: `${place.name}, ${place.country_code}`, condition: weatherCondition(code), high, low, rainChance: typeof rain === "number" && Number.isFinite(rain) && rain >= 0 && rain <= 100 ? rain : null, fetchedAt: now().toISOString(), source: "Open-Meteo" as const };
  }
  return async (city: string, date: string, timeZone = "") => {
    city = city.trim().normalize("NFKC");
    if (city.length < 2 || city.length > 100 || /[<>\r\n]/.test(city)) throw Error("Add a valid event city to see its forecast.");
    if (timeZone.length > 80) throw Error("Choose a valid event time zone.");
    if (timeZone) { try { new Intl.DateTimeFormat("en", { timeZone }).format(); } catch { throw Error("Choose a valid event time zone."); } }
    if (!isForecastWindow(date, localEventToday(timeZone || "Africa/Lagos", now()))) throw Error("Forecasts appear within seven days of the event.");
    const key = JSON.stringify([city.toLowerCase(), date, timeZone]), cached = cache.get(key), time = now().getTime();
    if (cached && cached.until > time) return cached.data;
    if (pending.has(key)) return pending.get(key)!;
    const request = load(city, date, timeZone).then((data) => { if (cache.size >= 100) cache.delete(cache.keys().next().value!); cache.set(key, { until: time + 3_600_000, data }); return data; }).finally(() => pending.delete(key));
    pending.set(key, request); return request;
  };
}
