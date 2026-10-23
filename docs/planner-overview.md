# Planner overview feedback

Event cards retain the next-task strip and add Open event, Add task and Write a note below it. Pending tasks are ordered by due date and then high priority without changing the saved task order. The strip includes the due date and a red overdue label. Add task opens the existing task editor; Write a note opens the existing note composer. Neither action creates a record before the user saves. Cancelled cards do not expose creation links.

Needs your attention has Upcoming tasks, Upcoming payments, Client inquiries and Vendor replies. All events remains the only filter in that panel; there is no date range. All filtered items are available in the card’s bounded, keyboard-scrollable panel rather than being cut off after four rows. Changing the tab or event resets the list scroll position. Each tab also keeps its See all action opening the complete filtered list. Task rows in both views offer View task without a completion checkbox or Complete action. Payment recording remains available. Vendor replies use a separate, initially empty feed adapter, support reading/marking an existing reply as read, and do not manufacture messages. Cancelled/deleted-event replies are excluded.

The profile card averages valid saved reviews and displays No reviews yet when none exist. Copy profile link uses the current deployment origin and encoded public-profile slug, with success/failure feedback. The overview uses larger body text and at least 12px for small metadata instead of 9–11px card labels. Cards can grow to fit content.

Chart legend, stacks, tooltips and calendar dots share the same event-type mapping: Wedding `#10b981`, Corporate `#2dbcf0`, Party `#ff8b2d`, Mixed `#7c3aed`, Other `#9ca3af`. Conference/summit/seminar map to Corporate, private-party/birthday to Party, and explicitly mixed or multi-category types to Mixed. The shared primary-button tokens use the reference’s sage-to-deep-green horizontal gradient, including hover/pressed states and readable white-text contrast.

## Event-day forecasts

Upcoming changes to a forecast pill from event day through seven days ahead, using the event time zone (Africa/Lagos as fallback). Requests select the exact event date, not current conditions. The pill includes temperature and conditions; its accessible description includes city, date, high/low, precipitation probability and attribution. Missing cities, ambiguous matches, missing daily data or network/provider failures show an honest fallback rather than a forecast guess. Cancelled/past events and events beyond seven days retain their normal status.

`/api/event-weather` sends only the event city, date and time zone—not its name, venue, client, guests or other event data. The provider caches successful city/date/time-zone forecasts for one hour, deduplicates concurrent requests, times out requests, caps new lookups at 100 per process per hour, restricts upstream hosts and validates returned coordinates/forecast data. Exact city matches take precedence over fuzzy geocoding results; ambiguous locations require a city/country qualifier. Provider errors are sanitized so URLs/API keys cannot enter responses.

Development uses Open-Meteo’s evaluation/prototyping endpoint. Production requires a server-only `OPEN_METEO_API_KEY`, uses the customer endpoints and fails closed when the key is absent. No subscription is created or purchased by this change. Before public launch, connect the vendor messaging feed and configure a licensed weather provider key and deployment-level rate limiting appropriate to traffic.

Provider references: [Forecast API](https://open-meteo.com/en/docs), [Geocoding API](https://open-meteo.com/en/docs/geocoding-api), [commercial-use requirements](https://open-meteo.com/en/pricing).

## Verification

The event overview retains the celebration/planning strip above its four metrics. Its preview is named **Mood board**, with **Open mood board** opening the board workspace in both empty and populated states. Next on the plan includes separate task-completion checkboxes and task-detail actions. Cancelled events cannot complete tasks. The dashboard attention rows and their See all lists retain task navigation and payment-recording actions, but do not expose task completion.

Upcoming payments reuses the booked-item/installment schedule and the existing payment logger. It records payments already made, never initiates a transfer, preserves payment history, validates remaining balances, and refreshes the due list after partial/full payment. Linked events can be selected from existing events; saving writes both sides in one browser-storage operation. Unlinking only removes the relationship. Tasks, budgets and all other event data stay independent.

- `node tests/overview-feedback.test.cjs`: synthetic records cover actions, due dates, filtering, four tabs, See all, cancellation, vendor read states, real review averages, clipboard failures and type colours.
- `node tests/event-overview-actions.test.cjs` and `node tests/event-overview-details.test.cjs`: cover the event strip, countdown, cover and contact editors, inline completion/error states, payment entry and balances, reciprocal links, draft-only changes and storage failure.
- `node tests/overview-weather.test.cjs`: mocked provider responses cover seven-day/date/time-zone boundaries, exact matching, ambiguity, cache, failure/null handling and server-only commercial endpoints.
- `node tests/planner-header.test.cjs`: shared gradient, readable contrast and existing header checks.

Tests do not access real user records, clipboard contents or external accounts. The live local weather endpoint was also checked separately using a public test city.
