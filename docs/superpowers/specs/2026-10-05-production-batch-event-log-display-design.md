# Production batch event log — grouping & display

Extends [2026-10-05-production-batch-activity-design.md](./2026-10-05-production-batch-activity-design.md).

## Goals

1. **Stable session grouping** for step “actuals” edits — not dependent on feed adjacency.
2. **One group card per session** (option B): materials, conditions, and step qty field changes together when they share a step and a 10-minute session window.
3. **Per-event timestamps** on the right for each line inside a group.
4. **Lean Details** — drop redundant metadata; hide Details on group cards.

## Non-goals

- Backend `session_id` or schema changes (frontend bucketing only).
- Backfill or rewrite historical events.
- Changing what gets logged (separate work: started earlier, per-step storage, etc.).

## UX

### Timeline (newest first)

- **Single rows:** lifecycle, step start/finish/skip, planning edits, finished goods posted, and any step edit that does not merge into a session (only member of its cluster).
- **Group rows:** `{Stage name}: step updates` with a vertical list of sub-lines.

### Group sub-line layout

Each underlying event in the group:

| Region | Content |
|--------|---------|
| Left | Compact change line from existing summary helpers (item name + role, condition label + before/after, step qty field + before/after). Do not repeat the full API `description` if redundant with summary. |
| Right | That event’s `created_at` using `EventLogTimestamp` (inherits global relative/absolute toggle from the panel). |

Sub-lines sorted **newest first** within the card.

Group card **anchor time** for sorting among cards: **newest** `created_at` in the session (same as first sub-line).

### Details expander

| Row type | Details |
|----------|---------|
| Step update **group** | **Hidden** — no Details button. |
| Step edit **single** (lone event in its own session) | Optional: minimal curated rows only (see below). Prefer **hidden** if summary is complete. |
| Lifecycle / step start-finish / planning | Keep Details when `before`/`after` or start metadata adds value. |

### Details curation (when shown)

**Omit** (already in headline or summary):

- `Step log` / `batch_stage_log_id` as `#n`
- Duplicate `stage_name` / `Stage`
- Raw `item_id` when item name resolved in summary
- Standalone `item_role`
- Duplicate keys mirrored from FK (`batch_stage_log_id` in JSON when FK present)

**Include** when useful:

- `before` / `after` (quantities, condition values, planning fields)
- Condition `label`
- `started_earlier`, `started_at` on batch/step start events
- Resolved machine / line names for planning changes

Implementation: replace metadata dump loop with **event-type-specific** detail builders; default empty for groupable step-edit types.

## Grouping rules

### Event types in “step updates” bucket

All require `batch_stage_log_id`:

- `item_expected_changed`, `item_actual_changed`
- `condition_actual_changed`
- `step_output_changed`, `step_input_changed`, `step_waste_changed`

### Event types always single rows

- Batch lifecycle, `finished_goods_posted`
- `step_started`, `step_finished`, `step_skipped`
- Step/batch planning: `step_line_changed`, `step_machine_changed`, `step_minutes_changed`, `planned_start_changed`, `shift_changed`, etc.

### Session clustering (10 minutes, transitive)

For each distinct `batch_stage_log_id`:

1. Collect all bucket events for that step.
2. Sort by `created_at` ascending.
3. Build sessions: walk sorted list; add event to current session if it is within **10 minutes** of **any** event already in that session; otherwise start a new session.

Transitive closure: if A–B ≤ 10m and B–C ≤ 10m, A and C belong together even if A–C > 10m.

Constant: `BATCH_EVENT_STEP_UPDATE_SESSION_MS = 10 * 60 * 1000`.

### Timeline merge

1. Apply activity **filters** to raw events (unchanged: filter per underlying event).
2. Cluster filtered bucket events into sessions per step.
3. Emit display units:
   - Session with **≥ 2** events → one **group** unit.
   - Session with **1** event → **single** unit (same row component as today for that event type).
4. Combine group units + single units; sort units by anchor `created_at` **descending**.

Non-bucket events are always single units at their own `created_at`.

### Filters

If **any** event in a session matches the active filter, show the **entire** session card (all sub-lines). Sub-lines for events that do not match the filter may still show (simplest) **or** be hidden — **v1: show all sub-lines in an included session** to avoid partial cards.

## Architecture (frontend)

| Unit | Responsibility |
|------|----------------|
| `batchEventLogGrouping.ts` | Session clustering, display unit types (`single` \| `group`), timeline merge. Replace adjacent-only algorithm. |
| `batchEventLogDisplay.ts` | Summary lines (existing); **curated** `buildBatchEventDetailRows` by event type. |
| `BatchEventLogGroupRow.tsx` | Group headline + sub-lines with per-line timestamps; no Details. |
| `BatchEventLogRow.tsx` | Singles; Details only when curated rows non-empty. |
| `BatchActivityPanel.tsx` | Filter → cluster → render units. |

No API changes.

## Error handling

- Invalid/missing `created_at`: treat as non-groupable single; timestamp shows fallback from `EventLogTimestamp`.
- Missing `batch_stage_log_id` on bucket type: render as single (should not happen from backend).

## Testing

**`batchEventLogGrouping.test.ts`**

- Transitive 10m chain merges three events.
- Gap > 10m from all members starts new session.
- Different `batch_stage_log_id` never merges.
- `step_started` between two edits does not prevent merge (non-adjacent in feed).
- Two sessions same step → two group cards.
- Single-event session → single unit, not group.
- Timeline order by newest anchor.
- Filter: one matching event includes full session.

**`batchEventLogDisplay.test.ts`**

- Groupable types produce no detail rows (or minimal).
- Planning event still has before/after in Details.

## Migration from current UI

- Remove 5-minute **adjacent** grouping behavior.
- Remove combined Details blob on current group row.
- Deploy frontend-only; no migration.

## Open decisions (resolved)

| Question | Decision |
|----------|----------|
| Time rule | B — session window, 10 minutes, transitive |
| Group kinds | B — one “step updates” card per session |
| Per-line time | Yes, right-aligned per sub-line |
| Details on groups | No |
