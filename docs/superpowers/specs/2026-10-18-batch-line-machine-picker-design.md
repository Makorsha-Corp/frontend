# Batch line machine picker (unified)

**Date:** 2026-10-18  
**Status:** Approved for spec review

## Problem

When a production line has multiple machines, operators must pick which machine runs a batch step. Most batch surfaces already use **`ProductionLineMachineSelect`** (summary button → line-scoped **`MachineSelectorDialog`** with running/idle bars and optional Free/Scheduled for the planned window).

The **Start step** flow in **`BatchDetailPanel`** still uses a plain **`Select`** dropdown and helper copy (“This station has several machines…”). That is inconsistent and hides machine status and schedule context.

## Goal

One picker pattern everywhere a user assigns **one machine on a known production line** during batch work.

## Non-goals

- **`RouteStepPicker`** machine filter (discovery/filter UX, not step assignment).
- **`ProductionLineMachinesSelector`** (multi-machine line setup).
- Backend or schema changes.
- Replacing global **`MachineSelectorDialog`** for non-line-scoped picks (orders, transfers, etc.).

## Recommended approach

Extend usage of existing **`ProductionLineMachineSelect`**; do not build a parallel start-step-only control or inline tile grid in the start dialog.

## Behavior (unchanged semantics)

| Line machines | UX |
|---------------|-----|
| 0 | Empty/dashed “No machines on this line” (link to Setup in tooltip/title as today). |
| 1 | Auto-select sole machine; hide picker when start dialog only needs pick if `needsMachinePick` is false. |
| 2+ | Show picker; user must choose before start (existing validation). |

**Start step dialog:** Nested **`MachineSelectorDialog`** is acceptable (same as run strip and step panel).

## Implementation scope

### 1. Start step dialog — `BatchDetailPanel.tsx`

Replace the `machinePick` slot content (raw `Select` + `SelectItem` list) with:

```tsx
<ProductionLineMachineSelect
  line={startStepLine}
  value={startMachineId} // number | null; migrate from string state if needed
  onChange={setStartMachineId}
  factoryId={factoryId}
  scheduleBatches={scheduleBatches}
  plannedWindow={startStepPlannedWindow}
  id="start-step-machine"
  description="Pick the machine running this step."
/>
```

Wire `value`/`onChange` to existing start-step confirm logic (`confirmStartStep`). Remove duplicate `startStepMachineOptions` mapping where the component + `machinesForLine(line)` suffice; keep auto-pick for single-machine lines in confirm handler or rely on component `useEffect` + existing fallback.

### 2. Optional prop — `ProductionLineMachineSelect.tsx`

Add optional **`description?: string`** rendered as `text-xs text-muted-foreground` under the summary button (replaces ad-hoc helper in parent). Omit when unset.

### 3. Verification pass (no code unless drift found)

Confirm these already use **`ProductionLineMachineSelect`** with `line`, `scheduleBatches`, and `plannedWindow` where applicable:

- `BatchRunContextStrip.tsx`
- `BatchRunSelectedStepPanel.tsx`
- `AddBatchRecipePathStepEditor.tsx`
- `ProductionPage.tsx` (create batch)

Fix only if any regressed to raw dropdowns.

## Data passed to dialog

- **`initialFactoryId`:** batch factory.
- **`allowedMachineIds`:** from `machinesForLine(line)` (component internal).
- **`occupancyByMachineId`:** from `buildMachineOccupancyForWindow` + step planned window (already in component).

Full **`Machine`** records load inside the dialog via RTK query (status bars accurate).

## Testing (manual)

1. Line with **2+** machines → Start step → **Choose machine** opens tile dialog → select → start succeeds; machine on stage log correct.
2. Line with **1** machine → start without showing picker (or picker shows pre-filled); no regression.
3. Line with **0** machines → empty state; start blocked or message unchanged from product rules.
4. Run strip / step panel machine change still works (regression).
5. Dialog shows running/idle (and scheduled badge when window overlaps another batch on that machine).

## Files (expected touch)

- `frontend/src/components/newcomponents/customui/production/panels/BatchDetailPanel.tsx`
- `frontend/src/components/newcomponents/customui/production/ProductionLineMachineSelect.tsx` (optional `description`)
- This spec
