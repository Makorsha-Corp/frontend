# Task 4 report: Program API

Status: DONE_WITH_CONCERNS
Commits: none

## What landed

Three routes on prefix `/production-batch-programs`, tag `production`:

- `POST /api/v1/production-batch-programs/` body `ProductionBatchProgramCreate`, status 201. Returns the program plus `batch_count: int`.
- `POST /api/v1/production-batch-programs/{program_id}/stop/` returns the program (same response model, so `batch_count` is included).
- `GET /api/v1/production-batch-programs/?factory_id=` lists programs for that factory in the current workspace. `factory_id` is required.

Dependencies on every route: `get_current_workspace`, `get_current_active_user`, `get_db`. Create and stop pass `workspace.id` and `current_user.id` into the existing service methods.

`create_program` and `stop_program` still return the ORM program and still commit inside the service. The endpoint counts batches after that and sets `batch_count`. Counts go through `ProductionBatchDAO.count_by_program_ids`, which filters `workspace_id` and `program_id`. An empty id list does not query.

`ProductionBatchService.get_programs` was missing. It lists by `workspace_id` and `factory_id` via `ProductionBatchProgramDAO.get_by_factory` (newest `created_at`, then `id`). No commit.

`ValueError` is already converted to `BusinessRuleError` inside `create_program` and `stop_program`. Endpoints do not catch it. The global handler maps `BusinessRuleError` to HTTP 422, same as `create_batch`. The original detail is unchanged (`Recipe has no steps` stays `Recipe has no steps`).

## Files

- Created: `backend/app/api/v1/endpoints/production_batch_programs.py`
- Modified: `backend/app/api/v1/router.py`
- Modified: `backend/app/schemas/production_batch_program.py` (`ProductionBatchProgramResponse` with `batch_count`)
- Modified: `backend/app/dao/production_batch_program.py` (`get_by_factory`)
- Modified: `backend/app/dao/production_batch.py` (`count_by_program_ids`)
- Modified: `backend/app/managers/production_batch_manager.py` (`get_programs`, `count_batches_for_programs`)
- Modified: `backend/app/services/production_batch_service.py` (`get_programs`, `program_batch_counts`)
- Created: `backend/tests/test_production_batch_program_api.py`

## Tests

Command (from `backend/`):

```text
python -m pytest tests/test_production_batch_program_api.py tests/test_production_batch_program.py -v --tb=short
```

15 passed in 4.13s.

Covered: 201 plus `batch_count`, stop returns the program, list passes `workspace_id` and `factory_id`, `BusinessRuleError` stays 422 with the same detail, service list delegates with both ids. Existing create/stop manager and service tests still pass.

## Concerns

The brief says `ValueError` becomes HTTP 400. The service already raises `BusinessRuleError` (HTTP 422), and production batch endpoints let that exception through. These routes do the same. They do not map it to 400, and they do not wrap it again.

`stop_program` for a missing program is that same 422 (`Production batch program {id} not found`), not 404. That comes from the existing service translation of `ValueError`.

List and stop responses include `batch_count` because they share `ProductionBatchProgramResponse`. The brief only requires `batch_count` on create. The extra field matches the frontend program type.
