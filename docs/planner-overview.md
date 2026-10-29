# Planner overview feedback

## Round 3 — workspace stat cards

All four summary cards are full-card, keyboard-accessible links to Events, Tasks, Upcoming payments and Open inquiries. The payment destination opens the payment view directly. Outstanding payments are counted by scheduled due date within the selected period, including future installments, and say “Due in this period.” Fully paid, cancelled and unbooked items remain excluded.

Open inquiries counts every saved open client/vendor inquiry regardless of received date. Legacy inquiries without a sender type remain client inquiries. It has an “All open” badge and a blue-tinted border; the card omits the date-range explanation. Its count stays available even when custom period dates are invalid. Vendor replies are not misclassified as inquiries; no vendor records are fabricated. The inbox shows saved records only and shares its inquiry reader with the dashboard.

## Inquiry brief, rows and table

Inquiry rows are fully clickable and show the received date, sender, event type, preferred event date, location and expected guests. The inbox and See all dialog open in Table view, with a fixed column structure, unwrapped dates/counts and a wider window. Rows remain available with aligned sender/date, subject and compact facts. The detail dialog uses a narrower 576px maximum width, condensed header, two-column fact grid, compact budget/services/contact sections and an aligned action footer; long content scrolls without hiding any fields.

Mark resolved uses the latest saved record so newer details are preserved. Failed writes keep the inquiry open and show an error. Reply by email remains; Call and WhatsApp use validated international numbers. WhatsApp opens separately with an unsent greeting while the inquiry remains available. Missing or invalid numbers disable both phone actions. Existing illustrative records never expose active contact links. No actual messages are sent by the prototype.

Public-profile intake now saves optional phone, location, guest count, budget range/currency and services as structured fields. Package inquiries carry their selected package. New client notes stay separate from package metadata. Legacy notes are not rewritten, and only an explicitly labelled old preferred date is recovered; other missing details say Not provided. The original storage keys and records are preserved. `node tests/inquiry-details.test.cjs` covers render parity, legacy/missing data, input validation, safe links, structured intake, failure retention and resolution preservation using memory fixtures only.

`node tests/work-snapshot.test.cjs` covers real card destinations, whole-card links, keyboard focus styles, due-date counts, old client/vendor inquiries, date presets, invalid/custom dates and record immutability.

Event cards retain the next-task strip and add Open event, Add task and Write a note below it. Pending tasks are ordered by due date and then high priority without changing the saved task order. The strip includes the due date and a red overdue label. Add task opens the existing task editor; Write a note opens the existing note composer. Neither action creates a record before the user saves. Cancelled cards do not expose creation links.

Needs your attention has Upcoming tasks, Upcoming payments, Client inquiries and Vendor replies. All events and a date-range control sit together. All dates is the default; Today, Next 7 days, This month and Custom dates are available. Tasks/payments filter by due date; inquiries/replies filter by received date, never the preferred event date. Bounds are inclusive, invalid custom ranges show an error, and Clear date filter restores the full list. See all and tab counts use the same event/date filters. The workspace Open inquiries stat remains independent of these panel filters. All filtered items remain in the bounded, keyboard-scrollable panel. Changing filters or tabs resets scroll position. Task rows offer View task without inline completion. Payment recording remains available. Cancelled/deleted-event vendor replies are excluded.

The desktop sidebar collapses from 240px to an 80px icon rail with a synchronized content inset. The supplied standalone NXTEVNT mark replaces the previous image crop. Hovering or keyboard-focusing the collapsed logo area reveals the expand icon; clicking it expands navigation. Rail links retain accessible names and tooltips. Mobile drawer navigation is unchanged. Reduced-motion preferences disable transition motion. `node tests/attention-layout.test.cjs` covers sidebar states, date boundaries and layout contracts without changing user data.

The repeated footer strip under attention items has been removed, including Hide items, Show items, Reset and scroll-count copy. See all remains. Inquiry/vendor errors stay in their detail dialogs, and date-filter validation remains beside the filters.

The profile card averages valid saved reviews and displays No reviews yet when none exist. Copy profile link uses the current deployment origin and encoded public-profile slug, with success/failure feedback. The overview uses larger body text and at least 12px for small metadata instead of 9–11px card labels. Cards can grow to fit content.

The lineup starts with January–December of the current year. Previous/next year controls replace the From/To month pickers. The Chart/Calendar toggle is available in both views; Calendar initially opens the current month and preserves the last selected month/day when switching views. Selecting any chart month opens its calendar; Back to year returns to the chart and restores focus to that month. The month selector and arrows stay within the selected year. Empty years retain all twelve months.

Chart legend, stacks, tooltips and calendar dots share four event types: Wedding `#10b981`, Corporate `#2dbcf0`, Party `#ff8b2d`, Other `#9ca3af`. Conference/summit/seminar map to Corporate and private-party/birthday to Party. Historical Mixed, multi-category and unrecognized types count once under Other without changing stored events. Cancelled events and invalid dates are excluded. Both views show the legend; each calendar day shows up to three dots, one per event. Selecting a day retains the existing event quick look. `node tests/event-lineup.test.cjs` covers year/month navigation, leap dates, single-category totals, dot limits, back focus and empty states using synthetic records.

The shared primary-button tokens use the reference’s sage-to-deep-green horizontal gradient, including hover/pressed states and readable white-text contrast.

## Event-day forecasts

Upcoming changes to a forecast pill from event day through seven days ahead, using the event time zone (Africa/Lagos as fallback). Requests select the exact event date, not current conditions. The pill includes temperature and conditions; its accessible description includes city, date, high/low, precipitation probability and attribution. Missing cities, ambiguous matches, missing daily data or network/provider failures show an honest fallback rather than a forecast guess. Cancelled/past events and events beyond seven days retain their normal status.

`/api/event-weather` sends only the event city, date and time zone—not its name, venue, client, guests or other event data. The provider caches successful city/date/time-zone forecasts for one hour, deduplicates concurrent requests, times out requests, caps new lookups at 100 per process per hour, restricts upstream hosts and validates returned coordinates/forecast data. Exact city matches take precedence over fuzzy geocoding results; ambiguous locations require a city/country qualifier. Provider errors are sanitized so URLs/API keys cannot enter responses.

Development uses Open-Meteo’s evaluation/prototyping endpoint. Production requires a server-only `OPEN_METEO_API_KEY`, uses the customer endpoints and fails closed when the key is absent. No subscription is created or purchased by this change. Before public launch, connect the vendor messaging feed and configure a licensed weather provider key and deployment-level rate limiting appropriate to traffic.

Provider references: [Forecast API](https://open-meteo.com/en/docs), [Geocoding API](https://open-meteo.com/en/docs/geocoding-api), [commercial-use requirements](https://open-meteo.com/en/pricing).

## Verification

The event name appears in the workspace header above the tab bar on every event tab. The overview card leads with the image on the left, uses a compact details grid, and keeps its countdown, full-photo action and camera editor. Client contacts remain directly available as compact phone/email links with an accessible edit icon. The card omits the displayed time zone and repeated event heading; the saved time zone still governs countdown calculations and remains editable. The planning strip follows immediately below the shortened card. Mobile stacks the cover before the details.

All four planning cards are full-card links: Tasks complete → Tasks; Estimated budget → Budget; Vendor bookings → Budget → Bookings; Open decisions → Notes and Decision → Decisions. Budget's bookings/payments subtabs can open directly from event links. Next 3 tasks and Next 3 payments each show at most three rows; View tasks/payments opens the full destination. The task row opens its detail dialog, including from the row padding, while its separate completion checkbox remains independent. Task deep links open details first, with Edit still available there. Payment rows and their Record payment action open the existing payment logger with the selected installment amount; opening the form never records a payment.

The event overview retains the celebration/planning strip above its four metrics. Its preview is named **Mood board**, with **Open mood board** opening the board workspace in both empty and populated states. Next on the plan includes separate task-completion checkboxes and task-detail actions. Cancelled events cannot complete tasks. The dashboard attention rows and their See all lists retain task navigation and payment-recording actions, but do not expose task completion.

Upcoming payments reuses the booked-item/installment schedule and the existing payment logger. It records payments already made, never initiates a transfer, preserves payment history, validates remaining balances, and refreshes the due list after partial/full payment. Linked events can be selected from existing events; saving writes both sides in one browser-storage operation. Unlinking only removes the relationship. Tasks, budgets and all other event data stay independent.

- `node tests/overview-feedback.test.cjs`: synthetic records cover actions, due dates, filtering, four tabs, See all, cancellation, vendor read states, real review averages, clipboard failures and type colours.
- `node tests/event-overview-actions.test.cjs` and `node tests/event-overview-details.test.cjs`: cover the event strip, countdown, cover and contact editors, inline completion/error states, payment entry and balances, reciprocal links, draft-only changes and storage failure.
- `node tests/overview-weather.test.cjs`: mocked provider responses cover seven-day/date/time-zone boundaries, exact matching, ambiguity, cache, failure/null handling and server-only commercial endpoints.
- `node tests/planner-header.test.cjs`: shared gradient, readable contrast and existing header checks.

Tests do not access real user records, clipboard contents or external accounts. The live local weather endpoint was also checked separately using a public test city.
