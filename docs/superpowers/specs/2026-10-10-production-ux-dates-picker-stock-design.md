# Production UX: mill day, catalog tags, short stock

Covers MAK-142, MAK-145, and MAK-143. MAK-140 and MAK-146 stay out.

## MAK-142 — batch day is the mill day

`batch_date` is the calendar day at the mill. It is not the UTC date, and it is not the signed-in user's personal timezone.

**Which clock.** Use `workspace.settings.timezone` (the default saved under Management). If that value is missing or not a valid IANA zone, use `Asia/Dhaka`. The workspace timezone picker also opens on Bangladesh (Asia/Dhaka) until a zone is saved. Do not use `useDisplayTimezone()`, because that prefers the user's personal zone.

**When the day is chosen.**

- No planned start: `batch_date` is today's date in that zone. Replace `new Date().toISOString().split('T')[0]`.
- Planned start: take the planned instant and format its calendar date in that same zone. Replace `plannedLocal.slice(0, 10)`, which keeps the browser's date even when the mill is on the next or previous day.

**How it shows.**

- The batch card parses a date-only `batch_date` as that calendar day. It must not use `new Date("YYYY-MM-DD")`, which is UTC midnight and can paint the previous evening.
- The activity heatmap already keeps a date-only string on that day via `toLocalDateKey`. Leave that path. A correct `batch_date` puts the cell on the mill weekday.
- Started still shows the start instant in the viewer's display timezone. The card day and the heatmap day follow `batch_date`.

Existing rows keep the `batch_date` already stored. This does not rewrite BATCH-2026-011 or any other past run.

## MAK-145 — drop an empty default tag

Recipe and batch item pickers still open with the role's default tag: Raw Material, Finished Good, Production Waste, or Byproduct.

Wait until that first catalog request finishes. If it returned no items and the user has not changed the tag chips, clear those default tags once and load the catalog with no tag filter. The operator should see the spinner, then items, without a stop on an empty tag list.

Do not clear tags when:

- the request is still loading
- the user selected or cleared a tag themselves
- a search string is what made the list empty

The empty-catalog sentence stays for a real empty result after the tags are gone.

## MAK-143 — short row actions

A row is Short when on-hand (storage at the batch factory plus output still inside this batch from earlier steps) is less than the step's required input. Start stays blocked.

Each Short row shows **Add stock** and **New purchase**. The start dialog stays open underneath. The factory is the batch factory on that row. Neither action asks the user to pick a factory.

**Gap.** `required - onHand`. It is greater than zero on every Short row. Both actions start from that quantity.

**Add stock.** Open the existing add-inventory dialog. Item is the short item. Type is Storage. Factory is the batch factory. Quantity starts as the gap. Price stays blank. On save, close only the add dialog, refresh the storage check, and leave the start dialog open. That row drops Short when on-hand covers it. Start stays blocked while any other row is still Short. A failed save stays on the add dialog.

**New purchase.** Open the existing new-purchase dialog. Destination is storage at the batch factory. One line is the short item at the gap quantity. Supplier and price stay blank. Saving the purchase does not add stock. The row stays Short until that purchase is received. Say that in the success toast.

The Storage page **+** control, including the block while All factories is selected, does not change.

## Out of scope

- Decimal quantity gates (MAK-140)
- Setup and schedule polish (MAK-146)
- Rewriting stored `batch_date` on old batches
- Changing the Storage page add button
- Posting stock when a purchase is created
