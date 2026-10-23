# Budget, payments and proposals

## Budget items and overview

- The event navigation says **Budget**; its Budget and Proposals subviews remain separate.
- Four summary cards share one desktop row: Budgeted / client budget, Invoiced, Paid, Remaining. Smaller screens use two columns.
- Table body, descriptions, booking/payment chips and row payment actions use 14px text. Supporting metadata is at least 12px. Budget action menus also use larger type without changing menus elsewhere.
- Inline Add item keeps Priced as. Per guest reads the event's guest count; per quantity and per trip stay editable. New items start Unpaid and Not sourced.
- Booking status remains a dropdown: Not sourced, Sourcing, Booked. It is independent of payment status. Log a payment stays available directly on rows with an unpaid balance.

## Guest-count changes

Editing an event's guest count prompts before changing per-guest estimates. The count includes active budget items and proposal lines. Keep current amounts changes only the event details; Update amounts changes quantities and budgeted estimates, not invoiced amounts, recorded payments, receipts or schedules. A failed event save rolls back the budget update. A guest count above zero is required to reprice. Proposals affected by repricing return to Draft.

## One payment schedule

Item editing uses one schedule, with a percentage and due date on each line. One 100% line represents a single payment. Each line offers 1 month before, 1 week before and Today. Month arithmetic clamps to the last valid calendar day. Existing installment plans take precedence over a legacy expected date; otherwise the old date becomes one 100% line when edited. Saving clears the old date field.

The schedule uses shares of the budgeted amount, preserving existing financial semantics. Partial schedules are allowed and show the unscheduled percentage; a schedule above 100% or a line with an invalid date/percentage is rejected.

Customer-facing payment statuses, in order: **Unpaid · Payment due · Partially paid · Paid · Overdue**. Payment due applies to an unpaid scheduled payment within seven days, including today; an overdue payment takes precedence. Cancelled legacy items remain cancelled but cancellation is not offered as a payment filter. The full Partially paid label is retained.

## Upcoming payments

Within an event, Budget → Upcoming payments has five columns: Budget item & vendor, Status, Installment due & date, Payment progress, Action. There is no Event & date column inside an event; the portfolio view retains event context. Desktop rows and mobile cards show each installment's remaining amount and due date, the item's full outstanding balance, and an accessible gold paid-progress bar. Progress uses the higher of budgeted or invoiced as its denominator. Fully paid/cancelled items and paid installments are omitted; legacy single due dates remain supported and installment schedules take precedence over them. Amounts are rounded to cents and cannot exceed the remaining balance.

Statuses apply to the displayed installment's own due date. A future installment does not inherit another installment's overdue status. Group-by-date/all-payments remains available. Inside the event, Pay opens the existing Paystack **local test flow**, prefilling that line's amount and capping it at the current balance. It never writes a payment or moves money. The modal still offers Log a payment for payments already made; ordinary budget-row Log a payment continues to open that recording path, not the demo. Portfolio actions continue to open the event budget.

The populated table, progress, amount/date boundaries, event-column suppression, portfolio context, payment-path defaults and read-only opening are covered with isolated fixtures.

At the user's request, the **jjjj** review event shows a presentation-only demo when it has no real scheduled payments in NGN. Four fictional items produce five installment rows: venue rentals, stage build, catering and DJ/sound, with all five statuses (Unpaid, Payment due, Partially paid, Paid and Overdue) and 0–100% gold progress bars. Catering is paid in full with a zero balance and View details instead of Pay; completed examples are opt-in here and remain excluded from real upcoming-payment tables. The demo opens in All payments view without the table-level demo banner, explanatory intro or grouping control. The details use regular item/vendor labels without team-review, sample or demo copy. Only the actual payment simulation retains Test mode messaging; it never exposes the real record-payment form, modifies totals, writes files, or enters any event/budget store. Real scheduled payments take precedence, and other events/currencies/cancelled events do not receive demo rows. Dates are relative to the Lagos current date. The populated jjjj preview was checked in Chrome.

The Budget/Proposals switch and Import, Export and Add budget group actions now share one horizontally aligned desktop header, with responsive wrapping on smaller screens. The Budget items title/filter/search toolbar is in normal document flow and scrolls away. Non-functional review labels were also removed from overview attention cards/details and template estimates; payment simulations retain test-mode safeguards, and identity document samples remain available as requested.

## Logging and receipts

Log a payment records money already paid; it never sends money. Amount shortcuts are Full balance, 50% and 25% of the current balance. Optional receipts accept PDF, JPG, PNG and WebP up to 15 MB. Receipts are stored in this browser, linked to payment history, and accessible through the item's Receipts tab beside Documents in both item details and **Edit budget item**. The edit form supports inline PDF/image preview and download, shows payment amount/date beside each receipt, and explains where to add a receipt when empty. Switching between files views keeps document drafts intact. Receipt viewing never changes the payment ledger; missing browser-local files produce a clear error. Failed payment saves remove newly staged receipt files. Stable payment IDs prevent a retry from recording a payment twice. Deleting an item/event also cleans up its receipt files.

## Paystack walkthrough — deliberately not live

Pay in app opens a local **Paystack · Test flow**, as requested. It has placeholder vendor-connection/bank information, amount shortcuts, review, checkout cancellation, simulated success, simulated decline and retry. It does not load Paystack's SDK, call Paystack or any payment endpoint, collect bank/card details, or write a payment/receipt into the real budget. A demo result is ephemeral and never marks the item Paid.

This is not Paystack's API-backed sandbox. Live payments and actual vendor eligibility/bank checks remain unimplemented; credentials are neither needed nor used for this prototype.

## Proposals and bookings

Proposals keep the existing card layout with compact gradient headers, neutral borders/status labels and larger totals. The original soft-to-white gradients on each card have been restored as requested; coloured top strips remain removed. Table headers and the sticky summary stay neutral. Category cost bars retain their restrained accents; category/table bodies stay white. Proposals use the existing document (`FileText`) icon in the tab, card headers and available-slots heading, replacing legal scales.

Both Cards and Table open groups by default. Cards show the priced items behind each group, including pricing method and vendor, without another click. Individual and global collapse controls are view-only, synchronised across card columns, and keep the comparison rows aligned. Differences only continues to compare proposals, not the live budget. Missing costs remain explicitly Not added, not zero.

Populated cards use the available width (two, three or four columns as appropriate); unused proposal slots are compact create buttons below the comparison, rather than tall empty columns. The sticky summary also uses only the actual option count. The three-proposal limit, edit/duplicate/delete actions, category matching, currency separation and all financial totals remain unchanged. These behaviours have isolated fixture coverage; the local card colours and expanded content were also inspected in Chrome without saving any event/proposal/payment changes.

Bookings includes an on-page explanation of booked costs, payment totals and upcoming dates; marking something Booked does not mark it Paid.

## Verification

`node tests/budget-feedback.test.cjs` uses isolated in-memory events, budgets and file storage. It covers the summary, table actions/type size, guest-count confirmation/decline/rollback, immutable invoices/payments, legacy rate recovery, schedules and date boundaries, status wording, receipt validation and cleanup, payment idempotency, receipt location, expanded comparisons, and Paystack test success/decline/cancel without financial writes or network calls.

The full existing test suite and TypeScript checks are also run. Preview HTTP returned 200 without changing user data. After permission to switch to the local preview, Chrome visual inspection confirmed the unified schedule and all three quick-date chips, the Documents/Receipts views and receipt empty state, readable Notes and fixed Cancel/Save footer. The inspection draft was closed without saving; no event or payment records were changed. Receipt preview/download and missing-file errors are covered with isolated fixtures because the inspected item had no receipt. The build reports a Next.js security advisory; dependency upgrades are outside this UI/payment-prototype change and have not been applied.
