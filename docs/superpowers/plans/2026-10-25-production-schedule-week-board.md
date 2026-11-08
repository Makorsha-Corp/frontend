# Production schedule week board Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show each recipe step on its own line for the week, label the card with time, shift, and batch number, open a day popup from the day header, and create one draft batch per occurrence of a recurring recipe.

**Architecture:** A pure occurrence helper decides the start datetimes. A program row records the rule. Creating a program calls the existing batch create path once per occurrence so route lines and sequential `planned_start_at` stay the current behavior. The week grid keeps line rows and day columns. Card text, day membership, and popup status come from pure frontend helpers so they can be tested without rendering the page.

**Tech Stack:** FastAPI, SQLAlchemy, Alembic, pytest, React, TypeScript, Vitest, RTK Query, date-fns.

## Global Constraints

- Line-by-day grid stays. A step is drawn only when `production_line_id` equals that row. No "Unassigned" row.
- Card text is start time, shift name when the start falls in a workspace shift, and batch number. Do not print the step name or the line name on the card.
- Day-header click opens the day popup. Card click opens the batch. Those clicks do not swap jobs.
- Cell plus stays hover-only (`opacity-0` until `group-hover/cell` or `focus-visible`) and seeds that line and that day.
- Day popup **Add batch** seeds the date only.
- Popup status: batch `draft` → **Draft**, batch `cancelled` → **Cancelled**, else step `pending` → **Pending**, `in_progress` → **In progress**, `completed` → **Done**, `skipped` → **Skipped**.
- Program fields: factory, recipe, first start, cadence `daily` | `weekly` | `monthly`, end date. Weekly means +7 days. Monthly uses that day of the month, clamped to the last day of a short month.
- An occurrence is included only when its start is on or before the end date. End date before the first start’s calendar day is rejected. More than 366 occurrences is rejected and nothing is created.
- Null `expected_duration_minutes` is 0. The programs dialog warns before save and still allows save.
- Stopping a program cancels only batches with status `draft`. `in_progress`, `completed`, and `cancelled` stay.
- A program cannot be edited. Stop it and create another.
- One-off batches have `program_id` null.
- Do not add drag between cells. Remove the existing card drag.
- Do not persist the week in the URL.
- Do not draw the recurrence rule on the board.
- Agent must not run `git commit`. Commit steps below are for the user.

---

### Task 1: Occurrence dates

**Files:**
- Create: `backend/app/utils/production_program_occurrences.py`
- Test: `backend/tests/test_production_program_occurrences.py`

**Interfaces:**
- Consumes: nothing
- Produces: `occurrence_starts(first_start: datetime, cadence: str, end_date: date) -> list[datetime]` and `MAX_PROGRAM_OCCURRENCES = 366`. Raises `ValueError` with the messages below.

- [ ] **Step 1: Write the failing test**

```python
from datetime import date, datetime

import pytest

from app.utils.production_program_occurrences import (
    MAX_PROGRAM_OCCURRENCES,
    occurrence_starts,
)


def test_weekly_stops_on_end_date():
    starts = occurrence_starts(
        datetime(2026, 10, 5, 6, 0),
        "weekly",
        date(2026, 10, 20),
    )
    assert starts == [
        datetime(2026, 10, 5, 6, 0),
        datetime(2026, 10, 12, 6, 0),
        datetime(2026, 10, 19, 6, 0),
    ]


def test_monthly_clamps_to_last_day():
    starts = occurrence_starts(
        datetime(2026, 1, 31, 8, 30),
        "monthly",
        date(2026, 3, 31),
    )
    assert [row.date() for row in starts] == [
        date(2026, 1, 31),
        date(2026, 2, 28),
        date(2026, 3, 31),
    ]
    assert all(row.hour == 8 and row.minute == 30 for row in starts)


def test_end_before_start_raises():
    with pytest.raises(ValueError, match="on or after"):
        occurrence_starts(datetime(2026, 10, 5, 6, 0), "daily", date(2026, 10, 4))


def test_over_366_raises_and_names_the_cap():
    with pytest.raises(ValueError, match=str(MAX_PROGRAM_OCCURRENCES)):
        occurrence_starts(datetime(2026, 1, 1, 0, 0), "daily", date(2027, 1, 2))
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pytest tests/test_production_program_occurrences.py -v` from `backend/`

Expected: FAIL with `ModuleNotFoundError` or `ImportError` for `production_program_occurrences`.

- [ ] **Step 3: Write minimal implementation**

```python
"""Start datetimes for a production recurring program."""
from __future__ import annotations

import calendar
from datetime import date, datetime, timedelta

MAX_PROGRAM_OCCURRENCES = 366


def _add_month(value: datetime, anchor_day: int) -> datetime:
    year = value.year + (1 if value.month == 12 else 0)
    month = 1 if value.month == 12 else value.month + 1
    last_day = calendar.monthrange(year, month)[1]
    return value.replace(year=year, month=month, day=min(anchor_day, last_day))


def occurrence_starts(first_start: datetime, cadence: str, end_date: date) -> list[datetime]:
    if end_date < first_start.date():
        raise ValueError("Recurrence end date must be on or after the start date")
    if cadence not in {"daily", "weekly", "monthly"}:
        raise ValueError("Cadence must be daily, weekly, or monthly")

    starts: list[datetime] = []
    cursor = first_start
    while cursor.date() <= end_date:
        starts.append(cursor)
        if len(starts) > MAX_PROGRAM_OCCURRENCES:
            raise ValueError(
                f"Recurrence cannot exceed {MAX_PROGRAM_OCCURRENCES} occurrences"
            )
        if cadence == "daily":
            cursor = cursor + timedelta(days=1)
        elif cadence == "weekly":
            cursor = cursor + timedelta(days=7)
        else:
            cursor = _add_month(cursor, first_start.day)
    return starts
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pytest tests/test_production_program_occurrences.py -v` from `backend/`

Expected: PASS, 4 tests.

- [ ] **Step 5: Commit**

User runs this. Agent does not.

```bash
git add app/utils/production_program_occurrences.py tests/test_production_program_occurrences.py
git commit -m "feat: count production program occurrence starts"
```

---

### Task 2: Program table and batch link

**Files:**
- Create: `backend/alembic/versions/146_production_batch_programs.py`
- Create: `backend/app/models/production_batch_program.py`
- Modify: `backend/app/models/production_batch.py`
- Modify: `backend/app/models/__init__.py`
- Modify: `backend/app/db/base.py`

**Interfaces:**
- Consumes: nothing
- Produces: `ProductionBatchProgram` with columns `id`, `workspace_id`, `factory_id`, `formula_id`, `first_start_at`, `cadence`, `end_date`, `status`, `created_by`, `created_at`. `ProductionBatch.program_id` nullable FK, `ON DELETE SET NULL`.

- [ ] **Step 1: Add the model**

`backend/app/models/production_batch_program.py`:

```python
from sqlalchemy import Column, Date, DateTime, ForeignKey, Integer, String

from app.db.base_class import Base
from app.utils.time import utcnow


class ProductionBatchProgram(Base):
    __tablename__ = "production_batch_programs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    workspace_id = Column(Integer, ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    factory_id = Column(Integer, ForeignKey("factories.id", ondelete="CASCADE"), nullable=False, index=True)
    formula_id = Column(Integer, ForeignKey("production_formulas.id", ondelete="RESTRICT"), nullable=False, index=True)
    first_start_at = Column(DateTime, nullable=False)
    cadence = Column(String(16), nullable=False)
    end_date = Column(Date, nullable=False)
    status = Column(String(16), nullable=False, default="active", index=True)
    created_by = Column(Integer, ForeignKey("profiles.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, nullable=False, default=utcnow)
```

On `ProductionBatch`, after `formula_id`:

```python
program_id = Column(
    Integer,
    ForeignKey("production_batch_programs.id", ondelete="SET NULL"),
    nullable=True,
    index=True,
)
```

Import `ProductionBatchProgram` in `app/models/__init__.py` and `app/db/base.py` next to `ProductionBatch`.

- [ ] **Step 2: Add the migration**

`down_revision = "145_stage_log_planned_start_at"`. `revision = "146_production_batch_programs"`.

`upgrade` creates `production_batch_programs` with the columns above, then adds `production_batches.program_id` nullable FK. `downgrade` drops the column, then the table.

- [ ] **Step 3: Commit**

User runs this. Agent does not.

```bash
git add alembic/versions/146_production_batch_programs.py app/models/production_batch_program.py app/models/production_batch.py app/models/__init__.py app/db/base.py
git commit -m "feat: add production batch program link"
```

---

### Task 3: Create and stop a program

**Files:**
- Create: `backend/app/schemas/production_batch_program.py`
- Modify: `backend/app/managers/production_batch_manager.py`
- Modify: `backend/app/services/production_batch_service.py`
- Test: `backend/tests/test_production_batch_program.py`

**Interfaces:**
- Consumes: `occurrence_starts`, `MAX_PROGRAM_OCCURRENCES`, `ProductionBatchManager.create_batch`, `assign_sequential_planned_starts` (already called inside `create_batch` when `planned_start_at` is set).
- Produces:
  - `ProductionBatchProgramCreate`: `factory_id: int`, `formula_id: int`, `first_start_at: datetime`, `cadence: str`, `end_date: date`
  - `ProductionBatchManager.create_program(session, *, factory_id: int, formula_id: int, first_start_at: datetime, cadence: str, end_date: date, workspace_id: int, user_id: int) -> ProductionBatchProgram`
  - `ProductionBatchManager.stop_program(session, program_id, workspace_id, user_id) -> ProductionBatchProgram`
  - Service methods with the same names that commit.

Batch `production_line_id` is the line of the first included recipe stage that has a line (route step line, else stage line). If every stage has no line, raise `ValueError("Recipe steps have no production line")`. If the formula has no included stages, raise `ValueError("Recipe has no steps")`. Each created batch uses that line, `formula_id`, `planned_start_at` = the occurrence start, `batch_date` = that start’s date, `status` = `"draft"`, and `program_id` set after `create_batch` returns. Do not pass `stage_seeds` that override `production_line_id`. Existing create already copies the route line onto each stage log and calls `assign_sequential_planned_starts`.

- [ ] **Step 1: Write the failing test**

Mock `create_batch` so the test does not need a database. Assert it is called once per occurrence with the occurrence start, and that a 367th occurrence never calls it.

```python
from datetime import date, datetime
from unittest.mock import MagicMock

import pytest

from app.managers.production_batch_manager import ProductionBatchManager


def test_create_program_calls_create_batch_per_week():
    manager = ProductionBatchManager()
    session = MagicMock()
    stage = MagicMock(production_line_id=4, route_step_id=None, is_used=True, stage_order=1)
    manager.formula_stage_dao.get_by_formula = MagicMock(return_value=[stage])
    created = []

    def _create(session, batch_in, workspace_id, user_id):
        created.append(batch_in)
        batch = MagicMock(id=len(created), planned_start_at=batch_in.planned_start_at)
        return batch

    manager.create_batch = _create
    manager.program_dao.create = MagicMock(side_effect=lambda session, obj_in: MagicMock(id=9, **obj_in))

    manager.create_program(
        session,
        factory_id=3,
        formula_id=8,
        first_start_at=datetime(2026, 10, 5, 6, 0),
        cadence="weekly",
        end_date=date(2026, 10, 19),
        workspace_id=1,
        user_id=2,
    )

    assert [row.planned_start_at for row in created] == [
        datetime(2026, 10, 5, 6, 0),
        datetime(2026, 10, 12, 6, 0),
        datetime(2026, 10, 19, 6, 0),
    ]
    assert all(row.production_line_id == 4 and row.formula_id == 8 for row in created)
    assert all(row.stage_seeds in (None, []) for row in created)


def test_create_program_rejects_before_any_batch_when_over_cap():
    manager = ProductionBatchManager()
    manager.create_batch = MagicMock()
    with pytest.raises(ValueError, match="366"):
        manager.create_program(
            MagicMock(),
            factory_id=3,
            formula_id=8,
            first_start_at=datetime(2026, 1, 1, 0, 0),
            cadence="daily",
            end_date=date(2027, 1, 2),
            workspace_id=1,
            user_id=2,
        )
    manager.create_batch.assert_not_called()
```

Add `test_stop_program_cancels_only_drafts`: program status becomes `stopped`; a `draft` batch is set to `cancelled`; an `in_progress` batch is left unchanged. Use MagicMock rows, no database.

- [ ] **Step 2: Run test to verify it fails**

Run: `pytest tests/test_production_batch_program.py -v` from `backend/`

Expected: FAIL because `create_program` does not exist.

- [ ] **Step 3: Implement**

Resolve the batch line before calling `occurrence_starts`. Call `occurrence_starts` next. Only then loop `create_batch`. After each create, set `batch.program_id`. `stop_program` loads the program in the workspace, sets `status` to `stopped`, and sets `status` to `cancelled` on linked batches whose status is `draft`.

Service methods follow `create_batch`: manager call, `_commit_transaction`, refresh, and `_rollback_transaction` on exception.

`create_batch` currently takes `ProductionBatchCreate`. Build that object inside `create_program`. After `create_batch`, the in-memory batch must accept `program_id` assignment and be flushed. If `create_batch` commits today, do not call it from inside an open program transaction. Check `ProductionBatchService.create_batch`. It commits. So `create_program` must live on the service and call `production_batch_manager.create_batch` directly (no commit per batch), set `program_id`, then commit once. The manager method must not commit.

- [ ] **Step 4: Run test to verify it passes**

Run: `pytest tests/test_production_batch_program.py tests/test_production_program_occurrences.py -v` from `backend/`

Expected: PASS.

- [ ] **Step 5: Commit**

User runs this. Agent does not.

```bash
git add app/schemas/production_batch_program.py app/managers/production_batch_manager.py app/services/production_batch_service.py tests/test_production_batch_program.py
git commit -m "feat: create and stop production batch programs"
```

---

### Task 4: Program API

**Files:**
- Create: `backend/app/api/v1/endpoints/production_batch_programs.py`
- Modify: `backend/app/api/v1/router.py`

**Interfaces:**
- Consumes: `production_batch_service.create_program` and `stop_program`
- Produces:
  - `POST /api/v1/production-batch-programs/` body `ProductionBatchProgramCreate`, 201, returns the program plus `batch_count: int`
  - `POST /api/v1/production-batch-programs/{program_id}/stop/` returns the program
  - `GET /api/v1/production-batch-programs/?factory_id=` returns programs for that factory in the workspace

Match `create_batch` dependencies: `get_current_workspace`, `get_current_active_user`, `get_db`. `ValueError` becomes HTTP 400.

- [ ] **Step 1: Add the routes and register the router**

Prefix `/production-batch-programs`, tag `production`.

- [ ] **Step 2: Commit**

User runs this. Agent does not.

```bash
git add app/api/v1/endpoints/production_batch_programs.py app/api/v1/router.py
git commit -m "feat: expose production batch program endpoints"
```

---

### Task 5: Week board helpers

**Files:**
- Create: `frontend/src/components/newcomponents/customui/production/scheduleWeekBoard.ts`
- Test: `frontend/src/components/newcomponents/customui/production/scheduleWeekBoard.test.ts`

**Interfaces:**
- Consumes: `ProductionScheduleBatch`, `ProductionScheduleStep` from `@/types/production`, `findShiftForDate` from `@/lib/workspaceShiftChipUtils`, `formatWallTimeHm` from `@/lib/wallTimeFormat`
- Produces:
  - `scheduleStepsForCell(batches, lineId: number, day: Date)`
  - `scheduleStepsForDay(batches, day: Date)` includes null `production_line_id`
  - `scheduleStepCardText(step, batchNumber, shifts, use24Hour)` returns `{ when: string; batchNumber: string }`
  - `scheduleStepStatusLabel(batchStatus: string, stepStatus: string | undefined): string`

A step is on `day` when the local calendar date of `planned_start_at` equals the local calendar date of `day`. Sort by `planned_start_at`, then `batch_number`. `when` is `06:00 · Morning` or `6:00 AM · Morning` when a shift matches, otherwise the time only.

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, expect, it } from 'vitest';
import type { ProductionScheduleBatch } from '@/types/production';
import type { WorkspaceShift } from '@/types/workspaceShift';
import {
  scheduleStepCardText,
  scheduleStepStatusLabel,
  scheduleStepsForCell,
  scheduleStepsForDay,
} from './scheduleWeekBoard';

const morning: WorkspaceShift = {
  id: 1,
  workspace_id: 1,
  name: 'Morning',
  start_time: '06:00:00',
  end_time: '14:00:00',
  sort_order: 0,
  is_active: true,
};

const batch: ProductionScheduleBatch = {
  batch_id: 20,
  batch_number: 'BATCH-2026-020',
  status: 'draft',
  planned_start_at: '2026-10-25T06:00:00',
  planned_end_at: '2026-10-25T08:00:00',
  steps: [
    {
      stage_log_id: 1,
      stage_name: 'Carding & Ring Spinning Line 1',
      stage_order: 1,
      production_line_id: 10,
      machine_id: null,
      status: 'pending',
      planned_start_at: '2026-10-25T06:00:00',
      planned_end_at: '2026-10-25T07:00:00',
      rework_of_log_id: null,
    },
    {
      stage_log_id: 2,
      stage_name: 'Embroidery Line',
      stage_order: 2,
      production_line_id: 11,
      machine_id: null,
      status: 'pending',
      planned_start_at: '2026-10-25T07:00:00',
      planned_end_at: '2026-10-25T08:00:00',
      rework_of_log_id: null,
    },
  ],
};

describe('scheduleWeekBoard', () => {
  const day = new Date(2026, 9, 25);

  it('places each step on its own line', () => {
    const carding = scheduleStepsForCell([batch], 10, day);
    const embroidery = scheduleStepsForCell([batch], 11, day);
    expect(carding.map((row) => row.step.stage_log_id)).toEqual([1]);
    expect(embroidery.map((row) => row.step.stage_log_id)).toEqual([2]);
  });

  it('card text is time, shift, and batch number', () => {
    const text = scheduleStepCardText(batch.steps[0], batch.batch_number, [morning], true);
    expect(text.when).toBe('06:00 · Morning');
    expect(text.batchNumber).toBe('BATCH-2026-020');
    expect(text.when).not.toContain('Carding');
    expect(text.batchNumber).not.toContain('Embroidery');
  });

  it('day list keeps a step with no line', () => {
    const unassigned = {
      ...batch,
      steps: [{ ...batch.steps[0], production_line_id: null }],
    };
    expect(scheduleStepsForCell([unassigned], 10, day)).toEqual([]);
    expect(scheduleStepsForDay([unassigned], day)).toHaveLength(1);
  });

  it('draft batch status wins over pending step', () => {
    expect(scheduleStepStatusLabel('draft', 'pending')).toBe('Draft');
    expect(scheduleStepStatusLabel('in_progress', 'completed')).toBe('Done');
    expect(scheduleStepStatusLabel('cancelled', 'pending')).toBe('Cancelled');
  });
});
```

Fill any required `WorkspaceShift` fields from `frontend/src/types/workspaceShift.ts` if the object above does not typecheck.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/newcomponents/customui/production/scheduleWeekBoard.test.ts` from `frontend/`

Expected: FAIL because the module does not exist.

- [ ] **Step 3: Implement the four functions**

Use `findShiftForDate(shifts, new Date(step.planned_start_at))`. Format the clock with `formatWallTimeHm`. Join shift name with ` · ` only when a shift is found.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/newcomponents/customui/production/scheduleWeekBoard.test.ts` from `frontend/`

Expected: PASS, 4 tests.

- [ ] **Step 5: Commit**

User runs this. Agent does not.

```bash
git add src/components/newcomponents/customui/production/scheduleWeekBoard.ts src/components/newcomponents/customui/production/scheduleWeekBoard.test.ts
git commit -m "feat: label schedule cards by line, time, and batch"
```

---

### Task 6: Grid and day popup

**Files:**
- Create: `frontend/src/components/newcomponents/customui/production/ProductionScheduleDayDialog.tsx`
- Modify: `frontend/src/components/newcomponents/customui/production/ProductionScheduleTab.tsx`

**Interfaces:**
- Consumes: `scheduleStepsForCell`, `scheduleStepsForDay`, `scheduleStepCardText`, `scheduleStepStatusLabel`, `useGetWorkspaceShiftsQuery`, `useUserTimeFormat`
- Produces: day header button sets `dayDialog` state. Card `onClick` calls `onOpenBatch(batch.batch_id)` and does not drag.

- [ ] **Step 1: Change the card and the day header**

Replace the card body that renders `batch.batch_number` and `step.stage_name` with `scheduleStepCardText`. Remove `draggable`, `onDragStart`, and the drop handlers on the cell. Keep the plus class:

`absolute bottom-0.5 right-0.5 flex h-5 w-5 ... opacity-0 ... group-hover/cell:opacity-100 focus-visible:opacity-100`

Make the day header a `<button type="button">` that sets the selected day. Title stays `day.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })`.

Build the cell list with `scheduleStepsForCell(scheduleBatches, line.id, day)` instead of the inline `production_line_id === line.id` filter.

- [ ] **Step 2: Add the dialog**

`ProductionScheduleDayDialog` props:

```typescript
{
  day: Date | null;
  batches: ProductionScheduleBatch[];
  lines: { id: number; name: string }[];
  onOpenChange: (open: boolean) => void;
  onOpenBatch: (batchId: number) => void;
  onAddBatch: (day: Date) => void;
}
```

When `day` is null, the dialog is closed. Rows come from `scheduleStepsForDay`. Line label is the matching line name, or **Unassigned**. Show start and end via `formatWallTimeHm` on both timestamps. Show `scheduleStepStatusLabel`. Step name only when it is not equal to the line name. Machine name comes from the line’s machines already loaded on the tab (`machinesForLine`). When `machine_id` is set and that machine is on the step’s line, show its name. When `machine_id` is null, show nothing. Do not print a raw id. Row click calls `onOpenBatch` and closes. **Add batch** calls `onAddBatch(day)` and closes.

`ProductionPage` already seeds a line and a day from `onCreateOnCell`. The dialog’s `onAddBatch` must call a date-only seed. Add an optional `onCreateOnDay?: (day: Date) => void` prop on `ProductionScheduleTab` and pass it from `ProductionPage` without a line id. Do not reuse `onCreateOnCell` for the dialog.

- [ ] **Step 3: Run the helper tests**

Run: `npx vitest run src/components/newcomponents/customui/production/scheduleWeekBoard.test.ts src/components/newcomponents/customui/production/productionScheduleWeek.test.ts` from `frontend/`

Expected: PASS.

- [ ] **Step 4: Commit**

User runs this. Agent does not.

```bash
git add src/components/newcomponents/customui/production/ProductionScheduleDayDialog.tsx src/components/newcomponents/customui/production/ProductionScheduleTab.tsx src/pages/newpages/ProductionPage.tsx
git commit -m "feat: open a schedule day popup from the day header"
```

---

### Task 7: Programs dialog

**Files:**
- Modify: `frontend/src/features/production/productionApi.ts`
- Modify: `frontend/src/types/production.ts`
- Create: `frontend/src/components/newcomponents/customui/production/ProductionScheduleProgramsDialog.tsx`
- Modify: `frontend/src/components/newcomponents/customui/production/ProductionScheduleTab.tsx`

**Interfaces:**
- Consumes: `POST /production-batch-programs/`, `POST /production-batch-programs/{id}/stop/`, `GET /production-batch-programs/?factory_id=`, `useGetProductionFormulaByIdQuery` or `useGetFormulaStagesQuery`
- Produces: toolbar button **Recurring programs**, visible only when a factory is selected. Save sends `factory_id`, `formula_id`, `first_start_at`, `cadence`, `end_date`. If any stage has `expected_duration_minutes` null, confirm with the warning text `Some steps have no duration. They will start at the same time as the previous step.` and still POST when the user confirms. There is no control to change recipe, cadence, or first start after create. Stop calls the stop endpoint and invalidates the schedule query.

- [ ] **Step 1: Add the RTK endpoints**

Tag `ProductionSchedule` on create and stop so `getProductionSchedule` refetches. Types:

```typescript
export interface ProductionBatchProgram {
  id: number;
  factory_id: number;
  formula_id: number;
  first_start_at: string;
  cadence: 'daily' | 'weekly' | 'monthly';
  end_date: string;
  status: 'active' | 'stopped';
  batch_count?: number;
}
```

- [ ] **Step 2: Build the dialog**

List programs for the current factory. Each active row has **Stop**. The create form has recipe select, datetime-local first start, cadence select, and end date. Disable save when recipe, first start, or end date is empty.

- [ ] **Step 3: Run helper tests again**

Run: `npx vitest run src/components/newcomponents/customui/production/scheduleWeekBoard.test.ts` from `frontend/`

Expected: PASS.

- [ ] **Step 4: Commit**

User runs this. Agent does not.

```bash
git add src/features/production/productionApi.ts src/types/production.ts src/components/newcomponents/customui/production/ProductionScheduleProgramsDialog.tsx src/components/newcomponents/customui/production/ProductionScheduleTab.tsx
git commit -m "feat: create recurring production programs from the schedule"
```
