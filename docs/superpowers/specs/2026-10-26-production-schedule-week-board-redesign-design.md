# Production schedule week board — visual redesign

**Date:** 2026-10-26  
**Status:** Approved — implemented 2026-10-26  
**Supersedes (partially):** [2026-10-25-production-schedule-week-board-design.md](./2026-10-25-production-schedule-week-board-design.md) — grid model unchanged; chrome, cards, and day navigation updated.

## Problem

The line × day week board is functionally correct but reads as a flat spreadsheet: day labels do not look clickable, status and recipe identity are invisible on cards, and busy days feel like undifferentiated purple chips. Operators want at-a-glance hierarchy (lifecycle, time, load, what is being made) without leaving week view.

## Goals

- Keep **approach 1 — polished grid**: production lines as rows, Sun–Sat columns, one card per step in the cell for that line and calendar day.
- Make **day headers** obvious controls (open **day view** for that date — no day popup).
- Encode **lifecycle**, **time**, **load**, and **recipe identity** on cards and headers without crowding.
- Sticky header row and line column while scrolling the board body.
- Align visually with existing Kolom patterns (brand primary, muted chrome, week picker band hover elsewhere).

## Non-goals

- Timeline-within-cell bands (approach 2) or week summary tiles replacing the grid (approach 3).
- Drag-and-drop rescheduling on the board.
- New schedule API fields unless client-side join is insufficient (see Recipe line).
- URL-persisted week anchor.
- Replacing day view list when a day header or “+N more” is activated.

## Grid chrome

### Sticky layout

- Outer scroll: `overflow-auto` on board body.
- **Sticky top row:** seven day header cells + corner cell (empty or “Lines” label).
- **Sticky first column:** line name for each row (z-index above body cells, below header intersection if needed).

### Day header cells (clickable)

Each column header is a **button** (not plain text):

- **Primary line:** short weekday (`Mon`).
- **Secondary line:** date (`26 Oct`) or locale-equivalent compact date.
- **Badge:** count of steps whose **planned start** falls on that calendar day (factory schedule query — same rule as plan dots on week picker).
- **Today:** column background tint (`brand-primary/5`) for the full column height; header gets a subtle ring or “Today” micro-label when header date is today.
- **Affordance:** outline/border on header button, hover background, focus ring; optional trailing chevron or `View day` sr-only / title tooltip.
- **Action:** click → parent sets **day view** to that ISO date (existing `onPickDay` behavior in Batches tab).

### Line row header (first column)

- Line name, truncated with `title` tooltip when long.
- Optional **v1.1:** muted weekly step count on the line (“12 runs”) — not required for first implementation pass.

### Cells

- Minimum height scales slightly when empty vs has cards (empty still at least one line tall).
- **Empty cell:** dashed border inner area, muted “No runs” (no hover-plus required for v1 if not already implemented — plus-on-hover remains optional from prior spec).
- **Today column:** same tint as header through cell bodies.

## Step cards

Sort unchanged: planned start, then batch number.

### Anatomy (top → bottom)

1. **Status stripe** — 3px left border on card:
   - `draft` → neutral/slate
   - `in_progress` (batch or step in progress — batch status wins for stripe) → amber
   - `completed` → emerald
   - `cancelled` → red/muted
2. **Status pill** (optional compact, same row as time): one word — Draft / Running / Done / Cancelled — derived from batch status; step-only nuance in `title` tooltip.
3. **Time row** — boldest text: clock per user 12h/24h setting; append shift name when workspace shift matches start (`Morning`), same as today.
4. **Batch number** — semibold.
5. **Recipe line** — formula display name or output item name, one line truncate, muted; full string in tooltip. Resolved **client-side**: map `batch_id` through loaded batch list + formula catalog in `ProductionRunsTab` (schedule payload has no formula fields). If unknown, omit line or show “Recipe” placeholder — never block render.

### Interaction

- **Card click:** open batch in **day view** with that date selected (existing `onOpenBatch`).
- **Overflow:** if more than **two** cards in a cell, render first two cards then a text button **+N more** → same as day header (`onPickDay` for that day). N = total − 2.

## Load signaling

- **Header badge:** step-start count per day (see headers).
- **Cell cap:** two visible cards + “+N more”.
- **Row weekly count:** deferred (non-goals v1 unless trivial).

## Data and API

- No backend change required for v1.
- Counts and cards continue to use `GET /production-batches/schedule/` for the week range.
- Formula label: join in `ProductionRunsTab` → pass `getFormulaLabel(batchId: number) => string | null` into `ProductionScheduleTab`.

## Errors and edge cases

- No factory: unchanged factory chooser.
- No lines: empty grid message.
- No planned batches in week: message below grid (unchanged).
- Step with null `production_line_id`: still omitted from grid (unchanged); appears in day view list only.

## Testing

- Day header renders as button with count badge; click invokes day view callback with correct ISO date.
- Today column tint applies to header + cells for current date.
- Card stripe color matches batch status for draft / in_progress / completed / cancelled fixtures.
- Cell with three steps shows two cards and “+1 more”; “+1 more” opens day view.
- Formula line appears when batch exists in loaded batches and formula name resolves.

## UI pieces

| Piece | Change |
|-------|--------|
| `ProductionScheduleTab` | Sticky grid, header buttons, column tint, card component, overflow cap |
| `scheduleWeekBoard.ts` | Optional helpers: status stripe class, card layout props |
| `ProductionRunsTab` | Pass formula resolver; wire `onPickDay` (already) |
| `ProductionScheduleDayDialog` | Unused in Batches flow — do not reintroduce for header click |

## Migration from 2026-10-25 spec

| Prior | Now |
|-------|-----|
| Day header opens **day popup** | Day header → **day view** |
| Card: time + batch only | Card: status + time + batch + formula |
| Flat header text | Clickable header + badges + today column |
