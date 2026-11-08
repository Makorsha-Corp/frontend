# Task 2 Report: Program table and batch link

## Status

DONE. `ProductionBatchProgram` model, `ProductionBatch.program_id` nullable FK (`ON DELETE SET NULL`), model registration, and Alembic revision `146_production_batch_programs` are in place. `app/utils/production_program_occurrences.py` was not changed. No git commit. `alembic upgrade` was not run.

## Files

| Path | Role |
|------|------|
| `backend/app/models/production_batch_program.py` | New model, columns verbatim from the brief |
| `backend/app/models/production_batch.py` | `program_id` immediately after `formula_id` |
| `backend/app/models/__init__.py` | Import and `__all__` entry next to `ProductionBatch` |
| `backend/app/db/base.py` | Import next to `ProductionBatch` so metadata picks up the table |
| `backend/alembic/versions/146_production_batch_programs.py` | `revision = "146_production_batch_programs"`, `down_revision = "145_stage_log_planned_start_at"` |

## Model

`ProductionBatchProgram` (`production_batch_programs`):

- `id` integer PK
- `workspace_id` FK `workspaces.id` `ON DELETE CASCADE`, not null, indexed
- `factory_id` FK `factories.id` `ON DELETE CASCADE`, not null, indexed
- `formula_id` FK `production_formulas.id` `ON DELETE RESTRICT`, not null, indexed
- `first_start_at` datetime, not null
- `cadence` `String(16)`, not null
- `end_date` date, not null
- `status` `String(16)`, not null, Python default `"active"`, indexed
- `created_by` FK `profiles.id` `ON DELETE SET NULL`, nullable
- `created_at` datetime, not null, Python default `utcnow`

`ProductionBatch.program_id` is a nullable indexed FK to `production_batch_programs.id` with `ON DELETE SET NULL`. Column order on the batch table is `formula_id`, then `program_id`, then `route_id`.

## Migration

`upgrade` creates `production_batch_programs` (columns and FKs above, plus indexes on `workspace_id`, `factory_id`, `formula_id`, and `status`), then adds nullable `production_batches.program_id` with constraint `fk_production_batches_program_id` (`ON DELETE SET NULL`) and index `ix_production_batches_program_id`.

`downgrade` drops that index, FK, and column, then the program-table indexes and the table.

`status` and `created_at` use ORM defaults only (no `server_default`), matching the model and the same pattern as `140_production_batch_events.py` for Python-side `default=`.

## Verification

From `backend/`, project venv `.\.venv\Scripts\python.exe`:

```text
python -c "from app.models.production_batch_program import ProductionBatchProgram; from app.models.production_batch import ProductionBatch; assert hasattr(ProductionBatch, 'program_id')"
```

Exit code 0. Extra checks in the same interpreter: `program_id` sits immediately after `formula_id`; `ondelete` is `SET NULL`; formula FK is `RESTRICT`; workspace and factory FKs are `CASCADE`; `created_by` is `SET NULL`; `status` default is `"active"`; `import app.models` and `import app.db.base` both expose `ProductionBatchProgram`; revision module loads with the ids above.

No test suite in this task (none added).

## Concerns

None.

## Commits

None (agent did not commit).
