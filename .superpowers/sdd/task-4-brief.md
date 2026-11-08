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

