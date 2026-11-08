# Task 5 report: Week board helpers

Status: DONE
Commits: none

## What landed

Pure frontend helpers in `scheduleWeekBoard.ts`:

- `scheduleStepsForCell(batches, lineId, day)` returns `{ batch, step }` rows whose `production_line_id` equals that line and whose `planned_start_at` falls on the local calendar date of `day`. A null line is omitted.
- `scheduleStepsForDay(batches, day)` returns every step on that local calendar date, including `production_line_id: null`.
- Both lists sort by `planned_start_at`, then `batch_number`.
- `scheduleStepCardText(step, batchNumber, shifts, use24Hour)` returns `{ when, batchNumber }`. Clock comes from `formatWallTimeHm` on the local hours of `planned_start_at`. Shift comes from `findShiftForDate(shifts, new Date(step.planned_start_at))`. When a shift matches, `when` is `clock · shift name` (for example `06:00 · Morning`). Otherwise `when` is the clock only.
- `scheduleStepStatusLabel(batchStatus, stepStatus)`: batch `draft` → `Draft`, batch `cancelled` → `Cancelled`, else step `pending` → `Pending`, `in_progress` → `In progress`, `completed` → `Done`, `skipped` → `Skipped`.

## Files

- Created: `frontend/src/components/newcomponents/customui/production/scheduleWeekBoard.ts`
- Created: `frontend/src/components/newcomponents/customui/production/scheduleWeekBoard.test.ts`

The test matches the brief. `WorkspaceShift` also requires `created_at` and `updated_at`, so the `morning` fixture has those two fields. Assertions are unchanged.

## RED

Command (from `frontend/`):

```text
npx vitest run src/components/newcomponents/customui/production/scheduleWeekBoard.test.ts
```

Exit code: 1

```text
(!) Your Vite config uses features that are unsupported by `configLoader: 'native'`, which is planned to become the default in a future major version of Vite:
  - `__dirname` (vite.config.ts:10:25). Use `import.meta.dirname` instead
Set `VITE_CONFIG_NATIVE_IGNORE_WARNING=true` to suppress this warning.
6:48:07 AM [vite] warning: `esbuild` option was specified by "vite:react-babel" plugin. This option is deprecated, please use `oxc` instead.
6:48:07 AM [vite] warning: `optimizeDeps.esbuildOptions` option was specified by "vite:react-babel" plugin. This option is deprecated, please use `optimizeDeps.rolldownOptions` instead.
The plugin "vite-tsconfig-paths" is detected. Vite now supports tsconfig paths resolution natively via the resolve.tsconfigPaths option. You can remove the plugin and set resolve.tsconfigPaths: true in your Vite config instead.
Both esbuild and oxc options were set. oxc options will be used and esbuild options will be ignored. The following esbuild options were set: `{ jsx: 'automatic', jsxImportSource: undefined }`

 RUN  v4.1.10 C:/Users/shoha/Documents/GitHub/Makorsha/frontend

 ❯ src/components/newcomponents/customui/production/scheduleWeekBoard.test.ts (0 test)

⎯⎯⎯⎯⎯⎯ Failed Suites 1 ⎯⎯⎯⎯⎯⎯⎯

 FAIL  src/components/newcomponents/customui/production/scheduleWeekBoard.test.ts [ src/components/newcomponents/customui/production/scheduleWeekBoard.test.ts ]
Error: Cannot find module './scheduleWeekBoard' imported from C:/Users/shoha/Documents/GitHub/Makorsha/frontend/src/components/newcomponents/customui/production/scheduleWeekBoard.test.ts
 ❯ src/components/newcomponents/customui/production/scheduleWeekBoard.test.ts:4:1
      2| import type { ProductionScheduleBatch } from '@/types/production';
      3| import type { WorkspaceShift } from '@/types/workspaceShift';
      4| import {
       | ^
      5|   scheduleStepCardText,
      6|   scheduleStepStatusLabel,

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/1]⎯


 Test Files  1 failed (1)
      Tests  no tests
   Start at  06:48:08
   Duration  259ms (transform 27ms, setup 0ms, import 0ms, tests 0ms, environment 0ms)
```

Failed because `./scheduleWeekBoard` did not exist. Vite config warnings are pre-existing and not from this module.

## GREEN

Same command. Exit code: 0

```text
(!) Your Vite config uses features that are unsupported by `configLoader: 'native'`, which is planned to become the default in a future major version of Vite:
  - `__dirname` (vite.config.ts:10:25). Use `import.meta.dirname` instead
Set `VITE_CONFIG_NATIVE_IGNORE_WARNING=true` to suppress this warning.
6:48:28 AM [vite] warning: `esbuild` option was specified by "vite:react-babel" plugin. This option is deprecated, please use `oxc` instead.
6:48:28 AM [vite] warning: `optimizeDeps.esbuildOptions` option was specified by "vite:react-babel" plugin. This option is deprecated, please use `optimizeDeps.rolldownOptions` instead.
The plugin "vite-tsconfig-paths" is detected. Vite now supports tsconfig paths resolution natively via the resolve.tsconfigPaths option. You can remove the plugin and set resolve.tsconfigPaths: true in your Vite config instead.
Both esbuild and oxc options were set. oxc options will be used and esbuild options will be ignored. The following esbuild options were set: `{ jsx: 'automatic', jsxImportSource: undefined }`

 RUN  v4.1.10 C:/Users/shoha/Documents/GitHub/Makorsha/frontend


 Test Files  1 passed (1)
      Tests  4 passed (4)
   Start at  06:48:28
   Duration  248ms (transform 41ms, setup 0ms, import 64ms, tests 5ms, environment 0ms)
```

## Concerns

None. Commit left for the user:

```bash
git add src/components/newcomponents/customui/production/scheduleWeekBoard.ts src/components/newcomponents/customui/production/scheduleWeekBoard.test.ts
git commit -m "feat: label schedule cards by line, time, and batch"
```
