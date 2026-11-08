# Production schedule week board

**Date:** 2026-10-25  
**Status:** Approved for implementation

## Problem

The schedule grid is one row per production line and one column per day. A card is drawn when `step.production_line_id` equals that row. The card text is `batch number · step name`.

Route step names often read like line names. One batch can show two cards on the Embroidery row, `BATCH-2026-020 · Embroidery Line` and `BATCH-2026-020 · Carding & Ring Spinning Line 1`, when both steps are stored on the Embroidery line. The operator cannot see which line each step actually runs on.

The board also cannot show start time and shift on the card, and it cannot create a repeating run of the whole recipe.

## Goals

- Keep the line-by-day grid. Each step appears only on the row of the line that step runs on. The same batch may appear on several rows.
- Card text is the start time, the short shift name, and the batch number. The line is the row, so the card does not repeat the line or the step name.
- Clicking a day header opens a day popup for every step that day. Clicking a card opens that batch.
- A recurring program creates one normal draft batch per occurrence, with each step placed on its route line.

## Non-goals

- Replacing the grid with seven day columns and no line rows.
- Dragging a card onto another line or day.
- Drawing the recurrence rule on the board.
- Editing the recipe, cadence, or first start of an existing program. Stop it and create a new one.
- Persisting the selected week in the URL.
- An "Unassigned" row on the grid.

## Week board

The factory chooser and the Sunday–Saturday week picker stay as they are. With no factory selected, the grid stays hidden.

Columns run Sunday through Saturday. Rows are the factory’s production lines. A cell lists steps whose planned start falls on that calendar day and whose `production_line_id` is that row. Sort cards by planned start, then batch number.

Each card shows:

1. Start time, in the user’s 12-hour or 24-hour setting, and the shift name when the start falls inside a workspace shift window (`Morning`). Hours of the shift are not repeated on the card.
2. Batch number.

No shift match: show the time and the batch number only. A step with `production_line_id` null is omitted from the grid.

The plus control in a cell is visible only while that cell is hovered, or while the plus itself has keyboard focus. It adds a batch seeded with that line and that day.

Clicking a card opens the batch. Clicking the day header opens the day popup. Those two clicks do not do each other’s job.

## Day popup

The title is the day, for example `Sun 25.10.2026`. The body lists every step whose planned start falls on that day, including steps with no line. Sort by planned start.

Each row shows the start and end time, the line name (or **Unassigned**), the batch number, the step name only when it differs from the line name, the machine name when a machine is set, and one status label. A `draft` batch shows **Draft**. A `cancelled` batch shows **Cancelled**. Otherwise the step status is shown: `pending` → **Pending**, `in_progress` → **In progress**, `completed` → **Done**, `skipped` → **Skipped**.

Clicking a row closes the popup and opens that batch. **Add batch** seeds the date only. The recipe supplies the lines.

## Recurring programs

A **Recurring programs** action on the schedule toolbar opens a dialog. The board shows only the draft batches that dialog created.

Creating a program takes:

- **Recipe.** The whole route.
- **First start.** Date and time of occurrence one, step one.
- **Cadence.** `daily`, `weekly`, or `monthly`. Weekly repeats every 7 days from the first start. Monthly repeats on that day of the month, clamped to the last day of a short month, matching work-order recurrence.
- **End date.** An occurrence is included only when its start is on or before this date. The end date must be on or after the first start’s calendar day.

Saving creates one batch per occurrence with status `draft`, linked to the program. Step one starts at that occurrence’s start. Each later step starts when the previous step’s planned end is reached, on the `production_line_id` stored on that route step. Planned length is the route step’s `expected_duration_minutes`. Null duration is 0 minutes, so the next step shares that start. The dialog warns before save when any step has no duration, and the user can still save.

If the occurrence count would exceed 366, the save is rejected and no batches are created.

A one-off batch from the grid plus or from the day popup has no program link.

Stopping a program sets it stopped and cancels its batches that are still `draft`. Batches that are `in_progress`, `completed`, or already `cancelled` stay as they are. Deleting or cancelling one batch does not stop the program.

## Data

New program record, workspace-scoped:

- `factory_id`, `formula_id`, `first_start_at`, `cadence` (`daily` | `weekly` | `monthly`), `end_date`, `status` (`active` | `stopped`)

`production_batches.program_id` is a nullable foreign key to that record. Existing schedule queries stay the source for the grid and the popup. Shift headings are not stored. The shift label is derived from the step’s planned start and the workspace shift windows.

On every batch created from a recipe, including one-off and program drafts, each step’s `production_line_id` is copied from that route step. Placement never uses the step name.

## Errors

- End date before the first start: reject.
- More than 366 occurrences: reject, no partial create.
- Recipe with no steps: reject.
- Step with no line: the batch may still be created. That step is absent from the grid and marked **Unassigned** in the day popup.

## Tests

- Two steps of one batch with two route lines render on two different rows, not both on the first line.
- Card text is the start time, the shift name when one matches, and the batch number. It does not include the step name.
- A step with a null line is absent from the grid and present in the day popup as **Unassigned**.
- Generating a weekly program from a known first start through an end date creates one draft batch per occurrence, and each step’s line id matches the route.
- A range that would exceed 366 occurrences creates nothing.
- Stopping a program cancels only its `draft` batches.

## UI pieces

- `ProductionScheduleTab` keeps the line-by-day grid, changes the card label, makes the day header open the popup, and keeps the hover-only plus.
- A day popup component owns the day list and the date-seeded add action.
- A recurring-programs dialog creates and stops programs. It does not edit recipe, cadence, or first start after create.
