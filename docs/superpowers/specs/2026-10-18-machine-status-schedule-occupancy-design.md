# Machine status vs schedule occupancy

**Date:** 2026-10-18  
**Status:** Approved for implementation

## Problem

Machine picker tiles mix two independent facts:

1. **Floor status** — latest machine event: Running, Idle, Off, Maintenance (bar color from `machineVisualStatus.ts`).
2. **Schedule occupancy** — whether another batch’s planned window overlaps this step’s window: Free or Scheduled.

Today, when occupancy is passed, the tile subtitle shows only **Free** / **Scheduled**, hiding Idle vs Running. Operators cannot tell green vs purple while both say FREE.

Batch assignment also needs consistent rules: when to warn vs block picks (Maintenance, Off, Running, overlap), configurable per workspace.

## Goals

- Show **both** floor status and schedule on batch step machine tiles (`Idle · Free`, `Running · Scheduled · BATCH-12`).
- Workspace setting `production_machine_pick_policy`: `soft` (default), `block_unavailable`, `block_overlap`.
- Enforce hard blocks on server when setting a batch step `machine_id`.
- Line setup chips use full floor visual kind (not `is_running` only).

## Non-goals

- New machine event types or changing Machines page status workflow.
- Policy on **line setup** multi-select (`ProductionLineMachinesSelector`).
- Replacing `ProductionScheduleConflictDialog` for batch planned-window saves.

## Policy matrix

| Mode | Block pick | Warn on confirm |
|------|------------|-----------------|
| `soft` | — | Maintenance, Off, Running, schedule overlap |
| `block_unavailable` | Maintenance, Off | Running, schedule overlap |
| `block_overlap` | Maintenance, Off, Scheduled overlap | Running |

Running never blocks. Idle never blocks. “Free” is schedule-only, not a floor state.

## UI

- **`MachineSelectorTile`**: subtitle = floor label + optional schedule segment; bar = floor kind.
- **`ProductionLineMachineSelect`**: pass policy; disable blocked tiles; warn dialog on pick/confirm for warned machines.
- **Settings**: General accordion, owner-only edit via `PATCH /workspaces/{id}/` with merged `settings`.

## Server

- Validate policy enum in `WorkspaceUpdate`.
- Shallow-merge `settings` on workspace patch.
- Reject invalid `machine_id` on batch stage start/update when policy requires.

## Testing

- Label helper, policy helper, workspace settings merge, start-step rejection under hard modes.
