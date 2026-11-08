# Task 6 report: Grid and day popup

Status: DONE
Commits: none

## What landed

The week grid still has one row per line and one column per day. Cards and the day popup use the Task 5 helpers.

- Each cell lists `scheduleStepsForCell(scheduleBatches, line.id, day)`. The inline `production_line_id === line.id` filter is gone.
- Card body is `scheduleStepCardText` (`when`, then batch number). `when` is the wall clock plus the shift name when `findShiftForDate` matches. Shifts come from `useGetWorkspaceShiftsQuery({ activeOnly: true })`. The clock uses `useUserTimeFormat`.
- Card click calls `onOpenBatch(batch.batch_id)`. Cards are not draggable. Cells have no `onDragOver` or `onDrop`.
- The plus class is unchanged: `absolute bottom-0.5 right-0.5 flex h-5 w-5 ... opacity-0 ... group-hover/cell:opacity-100 focus-visible:opacity-100`. Empty-cell click and the plus still call `onCreateOnCell(lineId, day)`.
- The day header is `<button type="button">`. Its label is still `day.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })`. Click sets `dayDialog`.
- `ProductionScheduleDayDialog` opens when `day` is set and closes when `day` is null. Rows come from `scheduleStepsForDay`. Title is `format(day, 'EEE dd.MM.yyyy')` (example `Sun 25.10.2026`).
- Each row shows start and end from `formatWallTimeHm` on both timestamps, the line name or `Unassigned`, the batch number, the step name only when it differs from that line’s name, the machine name, and `scheduleStepStatusLabel`.
- Machine name comes from `machinesForLine` on the step’s line. `machine_id == null`, a machine that is not on that line, or the `Machine #<id>` fallback all render nothing. A raw id is never shown.
- Row click calls `onOpenBatch` and closes the popup. **Add batch** calls `onAddBatch(day)` and closes. The tab wires that to `onCreateOnDay`, not `onCreateOnCell`.

`ProductionPage` passes `onCreateOnDay` beside `onCreateOnCell`. Both open the existing Add batch dialog.

- Cell: `setScheduleCreateSeed({ lineId, day })`.
- Day popup: `setScheduleCreateSeed({ day })` with no `lineId`.

`ScheduleBatchCreateSeed.lineId` is optional. When it is omitted, Add batch sets the line field to empty and `buildStageDraftDefaults` keeps route lines (`scheduleCreateSeed?.lineId ?? null`).

The drop-only move path left with drag: `draggable`, `onDragStart`, cell drop, `handleDrop`, `beginMove`, the pending-move state, `MachineSelectorDialog`, and `ProductionMachinePickWarningDialog` on this tab. That path was only reachable from a cell drop. `noUnusedLocals` is on, so the unreachable helpers had to go. `useMoveStageLogOnScheduleMutation` remains exported from the API slice. The grid still reads the schedule query. The `scheduleBatches` prop stays on the tab so the page can keep passing `factoryScheduleBatches`; that prop previously fed occupancy for the move picker only.

## Files

- Created: `frontend/src/components/newcomponents/customui/production/ProductionScheduleDayDialog.tsx`
- Modified: `frontend/src/components/newcomponents/customui/production/ProductionScheduleTab.tsx`
- Modified: `frontend/src/pages/newpages/ProductionPage.tsx`
- Modified: `frontend/src/components/newcomponents/customui/production/scheduleBatchCreateSeed.ts` (`lineId` optional so a day-only seed typechecks)

Dialog `lines` is `ProductionLine[]`. That type has `id` and `name`, and `machinesForLine` needs the line’s machines.

## Tests

Command (from `frontend/`):

```text
npx vitest run src/components/newcomponents/customui/production/scheduleWeekBoard.test.ts src/components/newcomponents/customui/production/productionScheduleWeek.test.ts
```

Exit code: 0

```text
 Test Files  2 passed (2)
      Tests  8 passed (8)
   Duration  633ms
```

Vite config warnings in that run are pre-existing and not from these files. IDE diagnostics on the four edited files reported no linter errors. These tests cover the week helpers, not the dialog or the tab.

## Commit

Not run. User command when ready:

```bash
git add src/components/newcomponents/customui/production/ProductionScheduleDayDialog.tsx src/components/newcomponents/customui/production/ProductionScheduleTab.tsx src/pages/newpages/ProductionPage.tsx src/components/newcomponents/customui/production/scheduleBatchCreateSeed.ts
git commit -m "feat: open a schedule day popup from the day header"
```

The brief’s `git add` list omitted `scheduleBatchCreateSeed.ts`. That file changed so a date-only seed typechecks. Include it.

## Fix: open the Batches tab with the batch

Card click and day-popup row click both call `onOpenBatch`. That handler only set `selectedBatchId`, so the batch panel stayed on the hidden Batches tab while Schedule stayed active.

`ProductionPage` now does both in that handler:

```tsx
onOpenBatch={(batchId) => {
  setSelectedBatchId(batchId);
  setActiveTab('batches');
}}
```

Day-header click still only opens the day popup. Card text is unchanged (time, shift, batch number).

Re-run from `frontend/`:

```text
npx vitest run src/components/newcomponents/customui/production/scheduleWeekBoard.test.ts src/components/newcomponents/customui/production/productionScheduleWeek.test.ts
```

Exit code: 0. Test files 2 passed, tests 8 passed. Duration 1.06s. Vite config warnings are the same pre-existing ones.
