# Task 7 report: Programs dialog

Status: DONE_WITH_CONCERNS
Commits: none

## What landed

Schedule toolbar shows **Recurring programs** only when a factory is selected. The button opens `ProductionScheduleProgramsDialog`.

The dialog lists programs for that factory (`GET /production-batch-programs/?factory_id=`). Each row shows recipe name, cadence, first start, end date, Active or Stopped, and batch count. Active rows have **Stop**. Stopped rows have no actions. There is no control to change recipe, cadence, or first start after create.

The create form has a recipe select (active formulas), a `datetime-local` first start, a cadence select (`daily` | `weekly` | `monthly`, default Daily), and an end date. **Save** stays disabled until recipe, first start, and end date are filled, and until that recipe’s stages have loaded. A stages load error also keeps Save disabled and shows the error, so the duration warning cannot be skipped.

Save posts `factory_id`, `formula_id`, `first_start_at`, `cadence`, `end_date`. `first_start_at` is `new Date(datetime-local).toISOString()`, the same instant Add batch sends for `planned_start_at`, so the week board shows the clock the user picked. `end_date` is the date input (`YYYY-MM-DD`).

Before POST, stages come from `useGetFormulaStagesQuery` (`expected_duration_minutes` is on each stage; formula-by-id does not return stages). If any stage has `expected_duration_minutes == null`, `window.confirm` uses exactly:

`Some steps have no duration. They will start at the same time as the previous step.`

Cancel does not POST. Confirm still POSTs.

`getProductionSchedule` already provides `ProductionSchedule`. Create and stop invalidate `ProductionSchedule`, so the week board refetches. They also invalidate `ProductionBatchProgram` (the dialog list), `ProductionBatch`, and `ProductionBatchStats` so the batches list and counts update when drafts are created or cancelled.

## Files

- Modified: `frontend/src/features/production/productionApi.ts`
- Modified: `frontend/src/types/production.ts`
- Created: `frontend/src/components/newcomponents/customui/production/ProductionScheduleProgramsDialog.tsx`
- Modified: `frontend/src/components/newcomponents/customui/production/ProductionScheduleTab.tsx`

`ProductionBatchProgram` matches the response schema: `id`, `workspace_id`, `factory_id`, `formula_id`, `first_start_at`, `cadence`, `end_date`, `status`, `created_by`, `created_at`, `batch_count`. Cadence and status use the brief’s unions. `batch_count` is required because the API always sends it.

## Tests

Command (from `frontend/`):

```text
npx vitest run src/components/newcomponents/customui/production/scheduleWeekBoard.test.ts
```

Exit code: 0

```text
 Test Files  1 passed (1)
      Tests  4 passed (4)
   Duration  250ms
```

Vite config warnings in that run are pre-existing. IDE diagnostics on the four edited files reported no linter errors. These tests cover week-board helpers, not the dialog or the new endpoints. The dialog was not clicked in the browser.

## Concerns

- Occurrence inclusion uses `first_start_at`’s calendar date on the server. The client sends a UTC instant. In a positive offset (this workspace is UTC+6), a first start in the hours before local midnight-offset (for example 01:00) falls on the previous UTC date. The end date is still the local date from the date input, so the program can include one extra local day. Times at or after 06:00 local stay on the same UTC date, so the usual daytime case matches the picked end date. Sending a naive local timestamp would line up the end date and would shift every card on the board, because the API treats naive datetimes as UTC.

## Commit

Not run. User command when ready:

```bash
git add src/features/production/productionApi.ts src/types/production.ts src/components/newcomponents/customui/production/ProductionScheduleProgramsDialog.tsx src/components/newcomponents/customui/production/ProductionScheduleTab.tsx
git commit -m "feat: create recurring production programs from the schedule"
```

## Fix: end date uses mill wall-clock

`occurrence_starts` still returns the same stored instants (naive values stay naive; aware values keep their offset). Inclusion now uses `wall_clock_for_shift(...).date()`, which treats a naive datetime as UTC. If the caller omits a timezone, that helper defaults to `Asia/Dhaka`.

`2026-10-24T19:00:00Z` is 01:00 on Oct 25 in Dhaka. Daily cadence with end date Oct 25 now returns only that instant. The next step, `2026-10-25T19:00:00Z` (Oct 26 01:00 local), is excluded.

`create_program` passes `workspace.settings["timezone"]` through `_workspace_timezone_name`, the same read shift assignment uses. A missing or non-dict settings value passes `None`, so the helper default applies. The programs dialog and card display were not changed.

## Pytest

Command (from `backend/`, venv interpreter):

```text
pytest tests/test_production_program_occurrences.py tests/test_production_batch_program.py -v
```

Exit code: 0

```text
15 passed, 1 warning in 2.04s
```

The warning is the existing Starlette `HTTP_422_UNPROCESSABLE_ENTITY` deprecation in `production_batch_service.py`. Prior occurrence expectations are unchanged. New test: `test_daily_end_date_uses_mill_wall_clock`.

## Fix concerns

- Draft `batch_date` is still `start.date()` on the stored instant, so a Dhaka 01:00 start keeps the previous UTC date on that field. Schedule cards were left on the instant.
- Cadence still steps the stored instant. Asia/Dhaka has a fixed offset, so the local clock stays put. A DST workspace timezone can move that clock by an hour across the transition.

## Fix: wall-clock batch_date and stop cancel event

`create_program` loads `tz_name` once via `_workspace_timezone_name` and passes that same value to `occurrence_starts` and `wall_clock_for_shift(start, tz_name).date()`. `planned_start_at` is still the occurrence instant. `2026-10-24 19:00 UTC` in `Asia/Dhaka` stores `batch_date` `2026-10-25`.

`stop_program` still only flips draft batches to `cancelled`. It does not call `cancel_batch`, so there is no WIP void and no storage reverse. Each cancelled draft gets `log_batch_event` with `event_type="batch_cancelled"`, description `Batch cancelled`, and `performed_by=user_id`, the same event type the cancel path already writes. No new event type string.

Frontend was not changed.

## Pytest

Command (from `backend/`):

```text
python -m pytest tests/test_production_program_occurrences.py tests/test_production_batch_program.py tests/test_production_batch_program_api.py -q --tb=line
```

Exit code: 0

```text
21 passed, 6 warnings in 3.60s
```

New test: `test_create_program_batch_date_uses_mill_wall_clock`. `test_stop_program_cancels_only_drafts` now asserts one `batch_cancelled` event with `performed_by` equal to the stop `user_id`.

## Fix concerns (this pass)

- Stop cancel events omit the cancel path's `notes` / `storage_reversed` / `wip_voided` metadata. Those values come from the side effects this path does not run. `updated_by` on the batch row is still not set.
- Cadence still steps the stored instant. A DST workspace timezone can move the local clock by an hour across the transition.
