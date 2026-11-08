import type { ProductionBatchEvent } from '@/types/production';

export const BATCH_EVENT_FILTER_ALL = 'all' as const;

export type BatchEventLogFilter =
  | typeof BATCH_EVENT_FILTER_ALL
  | 'lifecycle'
  | 'steps'
  | 'materials'
  | 'conditions'
  | 'planning';

export const BATCH_EVENT_LOG_FILTER_OPTIONS: { value: BatchEventLogFilter; label: string }[] = [
  { value: BATCH_EVENT_FILTER_ALL, label: 'All' },
  { value: 'steps', label: 'Steps' },
  { value: 'materials', label: 'Materials' },
  { value: 'conditions', label: 'Conditions' },
  { value: 'planning', label: 'Planning' },
  { value: 'lifecycle', label: 'Lifecycle' },
];

const LIFECYCLE_TYPES = new Set([
  'batch_created',
  'batch_deleted',
  'batch_started',
  'batch_completed',
  'batch_cancelled',
  'finished_goods_posted',
]);

const STEP_TYPES = new Set([
  'step_started',
  'step_finished',
  'step_skipped',
  'step_line_changed',
  'step_machine_changed',
  'step_minutes_changed',
  'step_output_changed',
  'step_input_changed',
  'step_waste_changed',
]);

const MATERIAL_TYPES = new Set(['item_expected_changed', 'item_actual_changed']);

const CONDITION_TYPES = new Set(['condition_actual_changed']);

const PLANNING_TYPES = new Set([
  'planned_start_changed',
  'shift_changed',
  'batch_date_changed',
  'expected_output_changed',
  'expected_duration_changed',
  'notes_changed',
  'batch_line_changed',
  'batch_machine_changed',
]);

export function batchEventMatchesFilter(
  event: ProductionBatchEvent,
  filter: BatchEventLogFilter,
): boolean {
  if (filter === BATCH_EVENT_FILTER_ALL) return true;
  const type = event.event_type;
  switch (filter) {
    case 'lifecycle':
      return LIFECYCLE_TYPES.has(type);
    case 'steps':
      return STEP_TYPES.has(type);
    case 'materials':
      return MATERIAL_TYPES.has(type);
    case 'conditions':
      return CONDITION_TYPES.has(type);
    case 'planning':
      return PLANNING_TYPES.has(type);
    default:
      return true;
  }
}

export function filterBatchEvents(
  events: ProductionBatchEvent[],
  filter: BatchEventLogFilter,
): ProductionBatchEvent[] {
  if (filter === BATCH_EVENT_FILTER_ALL) return events;
  return events.filter((event) => batchEventMatchesFilter(event, filter));
}

export function countBatchEventsForFilter(
  events: ProductionBatchEvent[],
  filter: BatchEventLogFilter,
): number {
  return filterBatchEvents(events, filter).length;
}
