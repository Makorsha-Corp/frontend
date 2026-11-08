# Production batch virtual WIP implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep intermediate output inside the batch, let the next step use less of it, flush leftovers to storage on complete, and void WIP plus reverse storage on cancel.

**Architecture:** New `production_batch_stage_log_items` rows hold per-step qty. `batch_step_wip` derives the pool from those rows and stage-log outputs. Complete posts leftover intermediates to storage. Cancel reverses step-start consumption ledger lines and records a void snapshot.

**Tech Stack:** FastAPI, SQLAlchemy, Alembic, React, RTK Query, Vitest, pytest.

## Global Constraints

- No WIP ledger table.
- Input actual editable only while the step is `pending`.
- Complete flush goes to storage only, qty only, `unit_cost` null.
- Cancel does not post WIP to storage or damaged.
- One output item per step. WIP qty is the stage log `output_quantity`.
- Do not commit unless the user asks.

---

### Task 1: Step material table and seed

- [ ] Migration, model, schema, DAO
- [ ] Seed scaled formula stage items when stage logs are created
- [ ] PATCH actual while pending

### Task 2: Pool, start, complete, cancel

- [ ] Prefer step-item input qty in WIP math
- [ ] Step start consumes that qty (WIP first)
- [ ] Complete flushes leftover intermediate to storage
- [ ] Cancel reverses step-start storage consumption and voids WIP

### Task 3: Floor UI

- [ ] Load step items, edit pending input actual
- [ ] Show made / using / left on the consuming step
- [ ] Start preview uses the same qty source
