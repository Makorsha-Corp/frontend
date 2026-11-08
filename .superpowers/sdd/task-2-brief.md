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

