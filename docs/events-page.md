# Events browsing and row actions

The Events page opens on Upcoming. Tabs are Upcoming, Completed, Cancelled, All events. Filters apply to the selected tab across cards, calendar and list views. Event type, client and priority can be combined with search; the Date menu sorts by event date. Upcoming defaults to ascending dates; other tabs default to descending dates.

Cards and rows use Completed for past events. Card sizes and the calendar implementation are unchanged. The table exposes expiry dates and a portalled action menu, and Events cards use the same menu.

## Expiry

`PlannerEvent.expiresAt` is an optional date-only `YYYY-MM-DD` value. No expiry period was specified, so legacy and newly created events show Not set until an expiry is chosen. Extend expiry saves a real date to the existing browser event store, and requires a date later than both today and any current expiry. Expiry is separate from the event date and its Upcoming/Completed status.

No automatic access revocation or expiry-based data deletion is introduced.

## Ownership

`PlannerEvent.accessRole` is owner or invited. Newly created events are marked owner. Legacy browser-created events retain the existing owner behaviour. Shared/invited records must supply accessRole: invited; assigning a team member does not determine ownership.

Owners see Delete event with the existing typed-name confirmation and full event/budget/file cleanup. Invited planners see Leave event with a confirmation. Leaving saves the event ID in a separate browser-local hidden list; it does not delete the event record, budget or files. Both row and workspace actions enforce this distinction. This prototype uses browser storage; a future invitation/server integration must supply and enforce the same roles per signed-in user.

Verification: node tests/events-table-actions.test.cjs, plus the existing overview, event-details, workspace navigation, client and weather tests.
