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

