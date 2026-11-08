# Batch line machine picker (unified) Implementation Plan

> **For agentic workers:** Use executing-plans or implement directly from spec `2026-10-18-batch-line-machine-picker-design.md`.

**Goal:** Start-step dialog uses `ProductionLineMachineSelect` like other batch surfaces.

**Architecture:** Optional `description` on component; `BatchDetailPanel` swaps Select for component with planned window + schedule.

**Tech Stack:** React, existing MachineSelectorDialog line-scoped mode.

## Global Constraints

- No backend changes. No RouteStepPicker changes.

---

### Task 1: `description` prop on ProductionLineMachineSelect

- [ ] Add optional `description?: string` under summary button.

### Task 2: Wire start-step dialog

- [ ] `startMachinePick`: `number | null`.
- [ ] `startStepPlannedWindow` from `batchPlannedWindows` index.
- [ ] Replace Select slot with `ProductionLineMachineSelect`.
- [ ] Simplify confirm/start logic with `machinesForLine` / `soleMachineIdOnLine`.

### Task 3: Manual smoke

- [ ] Multi-machine line start step → tile dialog.
- [ ] Single-machine auto-pick unchanged.
