import { createEventWeatherProvider } from "@/lib/server/event-weather-provider";

// Only a coarse city, event date and time zone are sent upstream. No event/account details.
const forecast = createEventWeatherProvider({ apiKey: process.env.OPEN_METEO_API_KEY, allowPrototype: process.env.NODE_ENV === "development" });
export async function GET(request: Request) {
  const query = new URL(request.url).searchParams;
  try {
    const data = await forecast(query.get("city") || "", query.get("date") || "", query.get("timeZone") || "");
    return Response.json(data, { headers: { "Cache-Control": "public, max-age=600" } });
  } catch (problem) {
    const message = problem instanceof Error ? problem.message : "Forecast unavailable. Please try again later.";
    // Never return upstream errors or URLs, which may include the provider key.
    const safe = /^(Add a valid event city|Choose a valid event time zone|Forecasts appear|Weather is not configured|City not found|City is ambiguous|The event-day forecast|Forecast requests are temporarily limited)/.test(message) ? message : "Forecast unavailable. Please try again later.";
    return Response.json({ error: safe }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
