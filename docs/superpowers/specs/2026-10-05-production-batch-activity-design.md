# Production batch activity log

Append-only activity feed per batch (all steps in one timeline). Forward-only — no backfill.

## UX

- Separate **Activity** card stacked under the batch detail card on the Batches tab (`ProductionPage` right column).
- Scrollable list (`max-h-72`), `HelpTicketActivityPanel` / `EventLogTimestamp` patterns.

## Storage

Table `production_batch_events`: `workspace_id`, `batch_id`, optional `batch_stage_log_id`, `event_type`, `description`, `metadata` JSON, `performed_by`, `created_at`.

## Event types (v1)

Lifecycle: `batch_created`, `batch_deleted`, `batch_started`, `batch_completed`, `batch_cancelled`.

Planning edits: `planned_start_changed`, `shift_changed`, `batch_date_changed`, `expected_output_changed`, `expected_duration_changed`, `notes_changed`, `batch_line_changed`, `batch_machine_changed`.

Items: `item_expected_changed`, `item_actual_changed`.

Steps: `step_started`, `step_finished`, `step_skipped`, `step_line_changed`, `step_machine_changed`, `step_minutes_changed`.

Conditions: `condition_actual_changed`.

Post-complete: `finished_goods_posted`.

## API

`GET /api/v1/production-batches/{batch_id}/events/` — newest first, `user_name` on rows.

## Logging

`ProductionBatchManager.log_batch_event` in same transaction as mutators. `start_batch` logs `batch_started`; first step start may also auto-start batch (`via_first_step` in metadata).
