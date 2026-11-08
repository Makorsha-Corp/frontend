# Batch completed posting summary

## Goal

When a run closes, the `batch_completed` event stores a snapshot of what was posted. The event log shows a short count under "Batch completed" and, when expanded, the products, storage leftovers (with the made / used / left story), storage inputs, and waste when any was posted.

## Decisions

- Snapshot is written once, in the same transaction as completion. It is not recomputed when the log is opened.
- Existing `batch_completed` events are not backfilled. They stay a single line.
- Inputs in the snapshot are storage withdrawals only. Quantity taken from an earlier step is not listed as an input.
- Waste is omitted when nothing was posted to damaged inventory.
- The event description stays `Batch completed`. No new event type.
- Cancel and later edits do not rewrite this snapshot.

## Snapshot

`metadata.posting_summary` on the `batch_completed` event. Item ids and quantities are stored. Stage names are stored. Item display names are resolved when the log renders.

### products

Each output and byproduct line that was posted with quantity greater than zero. Same quantity rule as completion today: actual quantity, or expected when actual is empty.

Each line: `item_id`, `qty`, `role` (`output` or `byproduct`).

### leftovers

One line per item flushed to storage.

- `item_id`, `qty` (amount posted to storage)
- `made`, `from_stage_name` from the step that produced the item
- `used` is the sum later steps took from that output
- `used_by` is `{ stage_name, qty }[]` in step order, only for later steps that took some

`used_by` quantities are the amounts taken from that prior output, not amounts taken from storage. If no later step took any, `used` is `0` and `used_by` is empty.

### storage_inputs

Built from this batch's storage consumption ledger rows whose notes contain `PRODUCTION STEP START`. Group by step log and item. Each line: `item_id`, `qty`, `stage_name`.

The stage name comes from the stage log id in the note (`step_log=`). If that log is missing, use the stage name already written in the note.

The same item on two steps is two lines. Quantity covered by earlier-step output is not included, because those ledger rows record only the storage portion.

### waste

Present only when at least one waste line has quantity greater than zero. Each line: `item_id`, `qty`. If there is no waste, omit the key.

Zero-quantity lines are omitted in every section. If nothing was posted, `posting_summary` is `{}`.

## Display

Closed row title stays "Batch completed".

Summary line, only for sections that have lines:

`2 products · 1 leftover · 2 inputs`

Append `· 1 waste` only when waste lines exist. Singular and plural follow the count (`1 product`, `2 products`). Missing or empty `posting_summary` means no summary and no Details button.

Details use the existing Details toggle and detail list, in this order:

1. Products. Label `Product` or `Byproduct`. Value `{name} · {qty}`.
2. Leftovers. Label `Leftover`. Value `{name} · {qty} to storage · {from_stage_name} made {made}` then each ` · {stage_name} used {qty}`, then ` · left {qty}`. The trailing `left` uses the posted `qty`, not a second subtraction. When `used_by` is empty: `{name} · {qty} to storage · {from_stage_name} made {made} · left {qty}`.
3. Inputs. Label `Input · {stage_name}`. Value `{name} · {qty}`.
4. Waste. Label `Waste`. Value `{name} · {qty}`.

Names come from `getItemName`. A missing name falls back to `Item #{id}`. Quantities use the same production quantity format as the rest of the log.

## Files

- `backend/app/managers/production_batch_manager.py` builds the snapshot while completing the batch and stores it on the event.
- `frontend/src/lib/batchEventLogDisplay.ts` turns `posting_summary` into the summary line and detail rows.
- `frontend/src/lib/batchEventLogDisplay.test.ts` covers the summary and each detail section, including omitted waste and events with no snapshot.

## Out of scope

- Backfill of old completed runs.
- Changes to step-finished rows.
- A shared shell or a new event type.
