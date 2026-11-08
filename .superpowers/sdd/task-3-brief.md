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

