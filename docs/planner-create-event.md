# Create event — developer notes

## Essentials and Advanced details

Venue and Guest size are optional fields in Advanced details → Event details, directly below Start time, End time and Time zone. Quick guest-size chips stay beside Guest size. The essentials retain name, type, date, city and currency. Moving between steps preserves these values; the live preview and guest-based template estimates still use the same form state.

## New client selection after Save

Reported flow: Advanced details → Client or host → Create a new client → enter a name → Save client. The field could return to No client yet, and creating the event then omitted its client.

The client selection handler previously cleared both client fields for every unrecognised value, including an empty value. Radix Select has a hidden native form control that can emit an empty change while its options update. Treat only the explicit `none` option as a request to clear the client. Ignore empty/unrecognised callbacks, keep the selected client available as an option while the client hook refreshes, and update `clientId` and `clientName` together after a successful save. Edit event uses this flow only while the event has no attached client.

After Save, the dropdown and live preview show the returned client's name. The final event stores that client's ID and name. Duplicate names reuse the existing client. Validation or storage failures retain the entered details and previous association; no event is created and no credit is used by Save client. Cancel retains the previous selection. Before attachment, No client yet still clears a selection when explicitly chosen.

Verification: `node tests/create-event-client.test.cjs` uses the actual client/event stores with in-memory storage. It covers the full save-to-event association, stale option lists, empty/unrecognised callbacks, step changes, the fixed client in Edit event, and attaching a client to an unassigned event. It does not create real clients/events or spend real credits.

## Edit event budget and client ownership

Edit event displays the current Budget tab total and client target in read-only boxes with Edit in Budget links. Saving other event details preserves both stored budget fields. The Budgeted card remains the place to set the client's target. The overview estimate also reads the live budget items, so it matches the Budget tab.

Once an event has a client ID or name, Edit event shows that client as fixed with the instruction to create a new event for another client. The event store also rejects attempts to replace or remove the client on later updates. An event without a client can still attach one in Edit event; that attachment becomes fixed after the event is saved.

## Event date navigation

The month and year in the date-picker header are buttons. Month opens a twelve-month grid; year opens a twelve-year grid starting in the current year. Choosing a year returns to months; choosing a month returns to days. Arrows navigate the active grid. Only choosing a day or Choose today commits a date. Closing and reopening restores the saved date, and past dates remain unavailable.

Verification: `node tests/event-date-picker.test.cjs` covers navigation, future-date bounds, leap years, cancel/reopen behaviour and explicit date selection with a fixed clock.

## Budget template preview

See samples displays budget groups with their actual item counts and summed estimates. Pricing behaviour is not labelled at group level. Existing built-in templates currently contain one broad item per group, so their counts honestly show 1 item. Estimates and template contents are unchanged.

Group rows expand inline, with one open at a time and all closed initially. The whole row is a keyboard-accessible button; its count and total remain visible. Inside are the existing item names, estimated amounts and pricing formulas: Flat fee, rate × preview guest count, or base + rate × preview guest count. Single-item groups use the same control without inventing extra items. Changing templates or reopening samples resets expansion. Browsing groups does not apply a template or change any amounts; Use this template remains the explicit apply action.
