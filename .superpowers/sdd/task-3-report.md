# Task 3 report: Create and stop a program

Status: DONE_WITH_CONCERNS
Commits: none

## What landed

`ProductionBatchManager.create_program` does not commit.

1. Resolve the batch line from included recipe stages (`formula_stage_dao.get_by_formula`, ordered by `stage_order`).
2. Call `occurrence_starts`. A list longer than 366 raises before any batch or program row is created.
3. Insert the program (`status="active"`).
4. For each start, call manager `create_batch` with `ProductionBatchCreate` (`production_line_id`, `formula_id`, `planned_start_at`, `batch_date` = that start’s date, `status="draft"`, no `stage_seeds`).
5. Set `batch.program_id` and `session.flush()`.

Line rule: first included stage (`is_used` is not `False`) that has a line. Route step line (`production_route_step_dao`) wins; otherwise the stage line. No included stages raises `ValueError("Recipe has no steps")`. Included stages with no line raise `ValueError("Recipe steps have no production line")`.

`stop_program` loads the program in the workspace, sets `status` to `stopped`, and sets `status` to `cancelled` on linked batches whose status is `draft`. `in_progress` batches stay as they are. No commit in the manager.

`ProductionBatchService.create_program` and `stop_program` call those manager methods, then `_commit_transaction`, `refresh`, and `_rollback_transaction` on exception. `ValueError` becomes `BusinessRuleError`, same as `create_batch`. The service does not call `ProductionBatchService.create_batch`, so there is no per-batch commit.

`formula_stage_dao` on the manager already matched the brief. No second stage DAO.

## Files

- Created: `backend/app/schemas/production_batch_program.py` (`ProductionBatchProgramCreate`)
- Created: `backend/app/dao/production_batch_program.py` (not in the brief file list; required so `manager.program_dao` can insert and load a program)
- Modified: `backend/app/dao/production_batch.py` (`get_by_program`, workspace-scoped)
- Modified: `backend/app/managers/production_batch_manager.py`
- Modified: `backend/app/services/production_batch_service.py`
- Created: `backend/tests/test_production_batch_program.py`

Each manager instance gets its own `ProductionBatchProgramDAO`. The brief tests assign `manager.program_dao.create` and must not replace a process-wide singleton.

## RED

Command (from `backend/`):

```text
python -m pytest tests/test_production_batch_program.py -v --tb=line
```

`pytest` without `python -m` failed collection (`ModuleNotFoundError: No module named 'app'`). `python -m pytest` is the invocation that imports `app`. That run was before implementation.

```text
============================= test session starts =============================
platform win32 -- Python 3.12.0, pytest-9.1.1, pluggy-1.6.0 -- C:\Users\shoha\AppData\Local\Programs\Python\Python312\python.exe
cachedir: .pytest_cache
rootdir: C:\Users\shoha\Documents\GitHub\Makorsha\backend
configfile: pytest.ini
plugins: anyio-4.14.1, cov-7.1.0
collecting ... collected 8 items

tests/test_production_batch_program.py::test_create_program_calls_create_batch_per_week FAILED [ 12%]
tests/test_production_batch_program.py::test_create_program_rejects_before_any_batch_when_over_cap FAILED [ 25%]
tests/test_production_batch_program.py::test_create_program_rejects_recipe_with_no_steps FAILED [ 37%]
tests/test_production_batch_program.py::test_create_program_rejects_when_steps_have_no_line FAILED [ 50%]
tests/test_production_batch_program.py::test_create_program_uses_first_included_step_that_has_a_line FAILED [ 62%]
tests/test_production_batch_program.py::test_stop_program_cancels_only_drafts FAILED [ 75%]
tests/test_production_batch_program.py::test_service_create_program_commits_once FAILED [ 87%]
tests/test_production_batch_program.py::test_service_create_program_rolls_back_on_value_error FAILED [100%]

================================== FAILURES ===================================
E   AttributeError: 'ProductionBatchManager' object has no attribute 'program_dao'
C:\Users\shoha\Documents\GitHub\Makorsha\backend\tests\test_production_batch_program.py:39: AttributeError: 'ProductionBatchManager' object has no attribute 'program_dao'
E   AttributeError: 'ProductionBatchManager' object has no attribute 'create_program'
C:\Users\shoha\Documents\GitHub\Makorsha\backend\tests\test_production_batch_program.py:70: AttributeError: 'ProductionBatchManager' object has no attribute 'create_program'
E   AttributeError: 'ProductionBatchManager' object has no attribute 'create_program'
C:\Users\shoha\Documents\GitHub\Makorsha\backend\tests\test_production_batch_program.py:89: AttributeError: 'ProductionBatchManager' object has no attribute 'create_program'
E   AttributeError: 'ProductionBatchManager' object has no attribute 'create_program'
C:\Users\shoha\Documents\GitHub\Makorsha\backend\tests\test_production_batch_program.py:108: AttributeError: 'ProductionBatchManager' object has no attribute 'create_program'
E   AttributeError: 'ProductionBatchManager' object has no attribute 'program_dao'
C:\Users\shoha\Documents\GitHub\Makorsha\backend\tests\test_production_batch_program.py:138: AttributeError: 'ProductionBatchManager' object has no attribute 'program_dao'
E   AttributeError: 'ProductionBatchManager' object has no attribute 'program_dao'
C:\Users\shoha\Documents\GitHub\Makorsha\backend\tests\test_production_batch_program.py:167: AttributeError: 'ProductionBatchManager' object has no attribute 'program_dao'
E   AttributeError: 'ProductionBatchService' object has no attribute 'create_program'
C:\Users\shoha\Documents\GitHub\Makorsha\backend\tests\test_production_batch_program.py:194: AttributeError: 'ProductionBatchService' object has no attribute 'create_program'
E   AssertionError: Regex pattern did not match.
      Expected regex: 'Recipe has no steps'
      Actual message: "'ProductionBatchService' object has no attribute 'create_program'"
C:\Users\shoha\Documents\GitHub\Makorsha\backend\tests\test_production_batch_program.py:229: AssertionError: Regex pattern did not match.
=========================== short test summary info ===========================
FAILED tests/test_production_batch_program.py::test_create_program_calls_create_batch_per_week - AttributeError: 'ProductionBatchManager' object has no attribute 'program_dao'
FAILED tests/test_production_batch_program.py::test_create_program_rejects_before_any_batch_when_over_cap - AttributeError: 'ProductionBatchManager' object has no attribute 'create_program'
FAILED tests/test_production_batch_program.py::test_create_program_rejects_recipe_with_no_steps - AttributeError: 'ProductionBatchManager' object has no attribute 'create_program'
FAILED tests/test_production_batch_program.py::test_create_program_rejects_when_steps_have_no_line - AttributeError: 'ProductionBatchManager' object has no attribute 'create_program'
FAILED tests/test_production_batch_program.py::test_create_program_uses_first_included_step_that_has_a_line - AttributeError: 'ProductionBatchManager' object has no attribute 'program_dao'
FAILED tests/test_production_batch_program.py::test_stop_program_cancels_only_drafts - AttributeError: 'ProductionBatchManager' object has no attribute 'program_dao'
FAILED tests/test_production_batch_program.py::test_service_create_program_commits_once - AttributeError: 'ProductionBatchService' object has no attribute 'create_program'
FAILED tests/test_production_batch_program.py::test_service_create_program_rolls_back_on_value_error - AssertionError: Regex pattern did not match.
  Expected regex: 'Recipe has no steps'
  Actual message: "'ProductionBatchService' object has no attribute 'create_program'"
============================== 8 failed in 1.76s ==============================
```

The brief expected failure “because `create_program` does not exist.” Tests that touch `manager.program_dao` before the call failed one step earlier: `program_dao` was also missing. The over-cap test failed on missing `create_program`.

## GREEN

Command (from `backend/`):

```text
python -m pytest tests/test_production_batch_program.py tests/test_production_program_occurrences.py -v --tb=short
```

```text
============================= test session starts =============================
platform win32 -- Python 3.12.0, pytest-9.1.1, pluggy-1.6.0 -- C:\Users\shoha\AppData\Local\Programs\Python\Python312\python.exe
cachedir: .pytest_cache
rootdir: C:\Users\shoha\Documents\GitHub\Makorsha\backend
configfile: pytest.ini
plugins: anyio-4.14.1, cov-7.1.0
collecting ... collected 12 items

tests/test_production_batch_program.py::test_create_program_calls_create_batch_per_week PASSED [  8%]
tests/test_production_batch_program.py::test_create_program_rejects_before_any_batch_when_over_cap PASSED [ 16%]
tests/test_production_batch_program.py::test_create_program_rejects_recipe_with_no_steps PASSED [ 25%]
tests/test_production_batch_program.py::test_create_program_rejects_when_steps_have_no_line PASSED [ 33%]
tests/test_production_batch_program.py::test_create_program_uses_first_included_step_that_has_a_line PASSED [ 41%]
tests/test_production_batch_program.py::test_stop_program_cancels_only_drafts PASSED [ 50%]
tests/test_production_batch_program.py::test_service_create_program_commits_once PASSED [ 58%]
tests/test_production_batch_program.py::test_service_create_program_rolls_back_on_value_error PASSED [ 66%]
tests/test_production_program_occurrences.py::test_weekly_stops_on_end_date PASSED [ 75%]
tests/test_production_program_occurrences.py::test_monthly_clamps_to_last_day PASSED [ 83%]
tests/test_production_program_occurrences.py::test_end_before_start_raises PASSED [ 91%]
tests/test_production_program_occurrences.py::test_over_366_raises_and_names_the_cap PASSED [100%]

============================== warnings summary ===============================
tests/test_production_batch_program.py::test_service_create_program_rolls_back_on_value_error
  C:\Users\shoha\Documents\GitHub\Makorsha\backend\app\services\production_batch_service.py:89: StarletteDeprecationWarning: 'HTTP_422_UNPROCESSABLE_ENTITY' is deprecated. Use 'HTTP_422_UNPROCESSABLE_CONTENT' instead.
    raise BusinessRuleError(str(e))

-- Docs: https://docs.pytest.org/en/stable/how-to/capture-warnings.html
======================== 12 passed, 1 warning in 1.70s ========================
```

## Concerns

- The brief’s over-cap sample does not stub formula stages. Line resolution runs before `occurrence_starts`, so that sample would hit the real formula-stage DAO with a `MagicMock` session and would not raise the 366 error. The test stubs one included stage with a line. `create_batch` is still not called, and the error still matches `366`.
- `stop_program` accepts `user_id` and does not store it. `ProductionBatchProgram` has no updated-by column. Draft rows only change `status` to `cancelled`. Full `cancel_batch` (WIP void, storage reverse) is not used, so an in-progress batch cannot be cancelled by this path.
- The 422 warning comes from existing `BusinessRuleError` (`HTTP_422_UNPROCESSABLE_ENTITY`). Same path as `create_batch`.

## Review fix: factory must match the batch line

`create_program` now calls `_require_program_factory_line` after `occurrence_starts` and before `program_dao.create`.

- `factory_dao.get_by_id_and_workspace` loads the factory. Missing in this workspace raises `ValueError("Factory {id} not found")`.
- `production_line_dao.get_by_id_and_workspace` loads the resolved batch line. A different `factory_id` raises `ValueError("Production line {name} is not in this factory")`. A missing line raises `ValueError("Production line {id} not found")`.
- Both failures happen before `program_dao.create` and before `create_batch`.
- No edit-program API. `occurrence_starts` unchanged.

Tests added: `test_create_program_rejects_missing_factory_before_create_batch`, `test_create_program_rejects_line_in_other_factory_before_create_batch`. Success-path creates stub a factory and a line in that factory, because the real DAO on a `MagicMock` session would not return a matching line.

Command (from `backend/`):

```text
python -m pytest tests/test_production_batch_program.py tests/test_production_program_occurrences.py -v --tb=short
```

```text
============================= test session starts =============================
platform win32 -- Python 3.12.0, pytest-9.1.1, pluggy-1.6.0 -- C:\Users\shoha\AppData\Local\Programs\Python\Python312\python.exe
cachedir: .pytest_cache
rootdir: C:\Users\shoha\Documents\GitHub\Makorsha\backend
configfile: pytest.ini
plugins: anyio-4.14.1, cov-7.1.0
collecting ... collected 14 items

tests/test_production_batch_program.py::test_create_program_calls_create_batch_per_week PASSED [  7%]
tests/test_production_batch_program.py::test_create_program_rejects_before_any_batch_when_over_cap PASSED [ 14%]
tests/test_production_batch_program.py::test_create_program_rejects_recipe_with_no_steps PASSED [ 21%]
tests/test_production_batch_program.py::test_create_program_rejects_when_steps_have_no_line PASSED [ 28%]
tests/test_production_batch_program.py::test_create_program_uses_first_included_step_that_has_a_line PASSED [ 35%]
tests/test_production_batch_program.py::test_create_program_rejects_missing_factory_before_create_batch PASSED [ 42%]
tests/test_production_batch_program.py::test_create_program_rejects_line_in_other_factory_before_create_batch PASSED [ 50%]
tests/test_production_batch_program.py::test_stop_program_cancels_only_drafts PASSED [ 57%]
tests/test_production_batch_program.py::test_service_create_program_commits_once PASSED [ 64%]
tests/test_production_batch_program.py::test_service_create_program_rolls_back_on_value_error PASSED [ 71%]
tests/test_production_program_occurrences.py::test_weekly_stops_on_end_date PASSED [ 78%]
tests/test_production_program_occurrences.py::test_monthly_clamps_to_last_day PASSED [ 85%]
tests/test_production_program_occurrences.py::test_end_before_start_raises PASSED [ 92%]
tests/test_production_program_occurrences.py::test_over_366_raises_and_names_the_cap PASSED [100%]

============================== warnings summary ===============================
tests/test_production_batch_program.py::test_service_create_program_rolls_back_on_value_error
  C:\Users\shoha\Documents\GitHub\Makorsha\backend\app\services\production_batch_service.py:89: StarletteDeprecationWarning: 'HTTP_422_UNPROCESSABLE_ENTITY' is deprecated. Use 'HTTP_422_UNPROCESSABLE_CONTENT' instead.
    raise BusinessRuleError(str(e))

-- Docs: https://docs.pytest.org/en/stable/how-to/capture-warnings.html
======================== 14 passed, 1 warning in 1.75s ========================
```
