# Event Files

The Files tab is a folder workspace, with All folders · Yours · System filters, folder-name search, Recently added to / Name A–Z sorting and New folder. Folder cards are fully clickable, with a real image thumbnail when available, a file count and a System folder / Your folder label. Unknown source-file sizes are not invented. System names are fixed and show a lock icon; planner folders are scoped to their event.

Every event immediately has Moodboard images, Event pictures, Receipts, Budget attachments and Invoices. These system folders are derived on read rather than requiring a destructive migration. New and existing events use the same definitions.

Source files are indexed without copying payloads:

- Active Mood board photos appear in Moodboard images; the current event cover appears in Event pictures.
- Budget documents appear in Budget attachments. In the budget item editor, File folders lets the planner mark a document as an invoice; it then appears in Invoices without re-uploading it.
- Receipts attached to logged budget payments appear in Receipts. Source changes are reflected when Files is opened again, and other events' budget files are excluded.
- Posted notes have Attach file. The upload dialog lets the planner choose one of the event's folders; the saved file is available from both its original note and Files. This does not change the inline note-writing flow. Legacy notes can receive attachments too. Removing a note does not silently destroy its uploaded files.
- Existing document links remain accessible in a Linked files planner folder. Unsafe legacy URLs remain visible but cannot be opened.

New planner folders and uploaded-file metadata are saved on the event. Payloads reuse the existing IndexedDB attachment store; files remain browser-local, not cloud-synced. Uploads accept the existing PDF/image/Word/Excel/CSV/text formats, with a 15 MB per-file limit and 20-file/50 MB batch limit. Image folders accept images only, and Receipts uses the same PDF/JPG/PNG/WebP validation as payment receipts.

Upload commits payloads first and event metadata second. A failed metadata save, stale folder/note, missing/cancelled event, or cancelled/unmounted operation cleans its staged blobs rather than claiming success. File previews handle unavailable payloads, use safe image/link sources, sandbox PDF previews and revoke temporary object URLs. Other document formats can be downloaded. New Files payloads are cleaned after successful event metadata deletion.

`tests/event-files.test.cjs` exercises the five defaults, event isolation, live source indexing, link preservation and safe URLs, folder filters/search/sort, creation and cancellation, folder opening, Notes routing, upload validation and failure cleanup. Fixtures use isolated in-memory metadata/payloads and do not change user files.
