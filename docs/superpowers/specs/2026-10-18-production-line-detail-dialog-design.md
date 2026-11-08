# Production line detail dialog (Setup)

**Date:** 2026-10-18  
**Status:** Approved for implementation

## Goal

Clicking a production line card on Setup opens a wide dialog with **Overview** (read-only ops) and **Setup** (edit name, description, machines). Replaces the narrow view/edit flip dialog.

## Shell

- `DialogContent`: `w-[min(56rem,94vw)]`, `h-[66vh] max-h-[66vh]`, flex column, scroll in tab body.
- Title: line name. Tabs: Overview (default) | Setup.
- Footer on Setup tab only: Save, Deactivate (with confirm).

## Overview tab

1. **Status** — Running/idle summary from `machine_status_summary`, or amber “No machines assigned” when empty.
2. **Machines** — Row per machine with Running/Idle badge; empty state points to Setup tab.
3. **Performance** — `GET production-batches/stats/overview/?factory_id=&production_line_id=`; show batch count, output, yield for that line row.
4. **On this line now** — From schedule query (current week): in-progress batches with a step on this line (max 5).
5. **Recipes** — From overview line row `recipes` list (name/code), or empty copy.

## Setup tab

Same fields as today: name, description, machines via **`ProductionLineMachinesSelector`** (chips + multi-select **Machine Selector** dialog). Save calls existing `updateLine` with `machine_ids`.

## Out of scope

Machine module navigation, batch actions from dialog, charts beyond overview API window.
