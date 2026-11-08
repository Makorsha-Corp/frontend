# Production batch virtual WIP

In-batch material stays virtual until the batch closes. Step 2+ can be filled by earlier step outputs. The operator can lower the next step's input; the unused part of the prior output stays visible on that step and remains virtual WIP.

## Decisions

- Virtual pool inside the batch. No per-step post to storage or products.
- No WIP ledger table. Availability and leftovers are derived.
- Per-step quantities live on step material rows, because `production_batch_items` is one row per item and role for the whole batch.
- The operator edits the **next step's input** (use less of what the previous step made). The previous step's logged output does not change.
- **Batch complete:** existing finished-good, byproduct, and waste posting stays. Leftover intermediate WIP posts to **storage**.
- **Batch cancel:** reverse every storage deduction made by step starts on this batch, then **drop** virtual WIP. Do not post that WIP to storage or damaged.

## Lifecycle

1. **Draft.** No storage moves. No virtual WIP.
2. **Step start.** Required qty is that step's input rows (actual if set, otherwise expected). Available is storage plus virtual WIP from earlier **completed** steps, after inputs already taken by earlier started steps. Take WIP first. Deduct only the remainder from storage. Ledger notes stay on the storage lines.
3. **Step finish.** Record output on the step. That quantity enters virtual WIP. No storage or product post.
4. **Batch complete.** All steps must be closed. Post batch output and byproduct lines to products and waste lines to damaged, as today. Then flush leftover intermediate WIP to storage. The virtual pool is empty after that.
5. **Batch cancel** (draft or in progress). Reverse step-start storage consumption. Void virtual WIP with no stock post. Batch is terminal. Step rows stay as history.

## Step material rows

New table `production_batch_stage_log_items`.

| Column | Role |
| --- | --- |
| `batch_stage_log_id` | Step |
| `item_id` | Material |
| `item_role` | `input`, `output`, `waste`, or `byproduct` |
| `expected_quantity` | From the recipe, scaled by the batch multiplier |
| `actual_quantity` | Operator override; null means use expected |

Seed these rows when the batch's stage logs are created from the formula. One formula stage item becomes one row.

**Input edit.** While the step is `pending`, the operator may set `actual_quantity` on an input row. Reject negative qty. On start, consumption is `actual_quantity` if set, otherwise `expected_quantity`. After the step leaves `pending`, input qty is locked.

**Output.** The logged step output remains `production_batch_stage_logs.output_quantity` plus the stage's output item (`expected_output_item_id`, else the first formula output row). An output row on the step material table mirrors that item and expected qty for display. The quantity that enters WIP is the log's `output_quantity` when the step is completed. v1 is one output item per step.

## Leftover on the next step

For an input whose item is the output item of an earlier completed step, the step panel shows:

`From {earlier step name}: made {output} · using {this step input} · left {made − using}`

`using` is this step's input qty (actual if set, otherwise expected). `left` is `max(0, made − using)`. It is virtual WIP, not a stored balance. If `using` is greater than `made`, the label shows left 0 and the gap is storage, same as step start. Later steps that need the same item see that remainder in prior-step availability.

`production_batch_items` stays the batch contract for complete-time product and waste posting. It is not the per-step input editor.

## Complete flush

After product and waste posting, compute remaining WIP with the same function used at step start, including every completed step's output and every started step's input consumption.

Subtract quantities posted in this same completion as batch `output` lines (the finished good). What remains is intermediate leftover. Post each item with qty > 0 to **storage** at the batch line's factory.

Ledger: `transfer_in`, `source_type=production_batch`, `source_id=batch.id`, note `SYSTEM - BATCH WIP FLUSH | {batch_number}`. `unit_cost` is null. Qty only.

Batch event metadata includes `{ item_id, qty }` for each flushed line. Zero leftover is a no-op.

## Cancel undo

1. Find storage **consumption** ledger rows for this batch (`source_type=production_batch`, step-start notes). Post an offsetting entry per row (same factory, item, quantity, and unit cost as the original) so net storage taken by those step starts is zero. Reverse from the ledger lines, not by re-reading the recipe.
2. Do not flush WIP. Record `wip_voided` on the cancel event as `{ item_id, qty }` for the derived pool at cancel time.
3. One transaction. A second cancel is rejected because status is already `cancelled`.

Draft cancel has no step-start ledger rows and no WIP. Status change only.

## Modules

- `app/utils/batch_step_wip.py` — shared pool: available at a step, and remaining at terminal. Inputs are stage logs, step material rows, formula stages, and the batch multiplier.
- `production_batch_manager.start_stage_log` — consume step material input qty; WIP first; storage remainder only.
- `production_batch_manager.complete_batch` — existing posts, then storage flush of leftover intermediate.
- `production_batch_manager.cancel_batch` — storage reversal, then void WIP.
- Frontend twin of the pool math for the start preview and the made / using / left line. Preview qty source matches the server: step material actual, else expected.

MAK-147's formula-only deduction path is replaced by step material rows once those rows exist. Availability still adds prior completed outputs and still deducts only the storage gap.

## Errors

- Step start with storage gap after WIP: same insufficient-inventory error, including prior-step qty in the message.
- Complete while a step is open: unchanged rejection.
- Flush or reversal of zero lines: no-op.
- Any failure rolls back the whole complete or cancel transaction.

## Testing

- Step 1 output 100 of item I, step 2 input expected 100. Lower step 2 input to 80 while pending. Start step 2 with 0 storage of I. Start succeeds. Panel shows made 100, using 80, left 20.
- Complete that batch. 20 of I posts to storage. Finished good posts to products once, not also as a storage flush.
- Cancel after step 1 started from storage and step 2 not started. Storage net for those deductions is 0. No WIP flush lines.
- Cancel after step 2 started. Every step-start consumption row is reversed. Void snapshot can list leftover. No storage or damaged post from WIP.
- Two steps must not share one batch-item qty: lowering step 2's input does not change step 1's output or another step's input row.

## Out of scope

- WIP ledger table.
- Per-step posts to storage while the batch is in progress.
- Posting cancelled WIP to storage or scrap.
- More than one output item per step.
- Editing input qty after the step has started.
- Choosing damaged vs storage for leftover WIP. Complete flush is storage only.
