// Synthetic forecasts only: never calls a weather provider or uses real event locations.
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), Module = require('node:module');
const root = path.resolve(__dirname, '..'), ts = require(path.join(root, 'node_modules/typescript'));
Module._extensions['.ts'] = (mod, file) => mod._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: 1, target: 9, esModuleInterop: true } }).outputText, file);
const { eventDayOffset, isForecastWindow, localEventToday, weatherCondition } = require('../src/lib/event-weather.ts');
const { createEventWeatherProvider } = require('../src/lib/server/event-weather-provider.ts');
assert.equal(eventDayOffset('2026-03-30', '2026-03-28'), 2); assert.equal(eventDayOffset('2026-02-30', '2026-02-28'), NaN);
for (const [date, expected] of [['2026-10-21', false], ['2026-10-22', true], ['2026-10-29', true], ['2026-10-30', false]]) assert.equal(isForecastWindow(date, '2026-10-22'), expected);
assert.equal(localEventToday('Africa/Lagos', new Date('2026-10-21T23:30:00Z')), '2026-10-22');
assert.equal(localEventToday('America/Los_Angeles', new Date('2026-10-22T01:00:00Z')), '2026-10-21');
assert.equal(weatherCondition(95), 'Thunderstorms'); assert.equal(weatherCondition(0), 'Clear skies');
let clock = new Date('2026-10-22T10:00:00Z'), calls = [];
const place = { name: 'Example City', country_code: 'NG', latitude: 6.5, longitude: 3.3, timezone: 'Africa/Lagos', feature_code: 'PPL', admin1: 'Example state' };
const forecast = { daily: { time: ['2026-10-22', '2026-10-29'], weather_code: [3, 61], temperature_2m_max: [30, 28], temperature_2m_min: [24, 23], precipitation_probability_max: [20, 80] } };
const fetcher = async (url, options) => { calls.push({ url: String(url), options }); return Response.json(String(url).includes('geocoding') ? { results: [place] } : forecast); };
async function run() {
  const weather = createEventWeatherProvider({ fetcher, now: () => clock, allowPrototype: true });
  await assert.rejects(() => weather('', '2026-10-22'), /valid event city/);
  await assert.rejects(() => weather('Example City', '2026-10-30'), /within seven days/);
  await assert.rejects(() => weather('Example City', '2026-10-22', 'invalid/zone'), /valid event time zone/); assert.equal(calls.length, 0);
  const [first, duplicate] = await Promise.all([weather('Example City', '2026-10-29', 'Africa/Lagos'), weather('Example City', '2026-10-29', 'Africa/Lagos')]);
  assert.deepEqual(first, duplicate); assert.equal(calls.length, 2); assert.equal(first.condition, 'Rain'); assert.equal(first.rainChance, 80); assert.equal(first.date, '2026-10-29'); assert.equal(first.high, 28);
  const query = new URL(calls[1].url); assert.equal(query.searchParams.get('forecast_days'), '8'); assert.equal(query.searchParams.get('timezone'), 'Africa/Lagos'); assert.equal(new URL(calls[0].url).searchParams.get('countryCode'), 'NG');
  await weather('Example City', '2026-10-29', 'Africa/Lagos'); assert.equal(calls.length, 2, 'Cache avoids repeated provider requests');
  clock = new Date('2026-10-22T12:00:00Z'); await weather('Example City', '2026-10-29', 'Africa/Lagos'); assert.equal(calls.length, 4, 'Refresh expired forecasts');
  const unavailable = createEventWeatherProvider({ fetcher, now: () => clock }); await assert.rejects(() => unavailable('Example City', '2026-10-22'), /not configured/); assert.equal(calls.length, 4, 'Production never uses noncommercial endpoints silently');
  const commercial = createEventWeatherProvider({ fetcher, now: () => clock, apiKey: 'synthetic-not-a-real-key' }); const data = await commercial('Example City', '2026-10-22');
  assert(new URL(calls.at(-1).url).hostname.startsWith('customer-')); assert(!JSON.stringify(data).includes('synthetic-not-a-real-key'));
  const ambiguous = createEventWeatherProvider({ now: () => clock, allowPrototype: true, fetcher: async () => Response.json({ results: [place, { ...place, country_code: 'PT' }] }) }); await assert.rejects(() => ambiguous('Ambiguous City', '2026-10-22'), /ambiguous/);
  const exact = createEventWeatherProvider({ now: () => clock, allowPrototype: true, fetcher: async url => Response.json(String(url).includes('geocoding') ? { results: [place, { ...place, name: 'Similar City', admin1: 'Other state' }] } : forecast) }); assert.equal((await exact('Example City', '2026-10-22')).city, 'Example City, NG', 'Exact city matches take precedence over fuzzy search results');
  const missing = createEventWeatherProvider({ now: () => clock, allowPrototype: true, fetcher: async url => Response.json(String(url).includes('geocoding') ? { results: [place] } : { daily: { ...forecast.daily, temperature_2m_max: [null, 28] } }) }); await assert.rejects(() => missing('Example City', '2026-10-22'), /not available/);
  const offline = createEventWeatherProvider({ now: () => clock, allowPrototype: true, fetcher: async () => { throw Error('Offline'); } }); await assert.rejects(() => offline('Example City', '2026-10-22'), /Offline/);
  assert(calls.every(call => !/eventId|client|guest|venue|address/.test(call.url))); assert(calls.every(call => call.options.signal && call.options.cache === 'no-store'));
  console.log('PASS: seven-day boundaries and time zones; date-specific forecasts; no fabricated weather; city ambiguity, invalid/missing data and provider failure; cache/deduplication; server-only key and commercial endpoint guard. Synthetic responses only.');
}
run().catch(error => { console.error(error); process.exitCode = 1; });
