import { describe, expect, it } from 'vitest';
import {
  buildBatchEventDetailRows,
  buildBatchEventGroupLineSummary,
  buildBatchEventSummary,
  buildBatchEventTitle,
} from './batchEventLogDisplay';
import type { ProductionBatchEvent } from '@/types/production';

function event(partial: Partial<ProductionBatchEvent> & Pick<ProductionBatchEvent, 'event_type'>): ProductionBatchEvent {
  return {
    id: 1,
    workspace_id: 1,
    batch_id: 1,
    batch_stage_log_id: null,
    description: 'Test',
    metadata: null,
    performed_by: 1,
    user_name: 'User',
    created_at: '2026-10-05T12:00:00Z',
    ...partial,
  };
}

describe('buildBatchEventSummary', () => {
  it('formats item actual change with item name', () => {
    const summary = buildBatchEventSummary(
      event({
        event_type: 'item_actual_changed',
        metadata: { item_id: 10, item_role: 'input', before: 5, after: 8 },
      }),
      { getItemName: (id) => (id === 10 ? 'Cotton' : `Item ${id}`) }
    );
    expect(summary).toBe('Cotton (input) · Before: 5 · After: 8');
  });

  it('includes step and not-set before on first actual entry', () => {
    const summary = buildBatchEventSummary(
      event({
        event_type: 'item_actual_changed',
        batch_stage_log_id: 12,
        metadata: {
          item_id: 10,
          item_role: 'input',
          before: null,
          after: 5,
          stage_name: 'Carding',
        },
      }),
      { getItemName: () => 'Cotton' }
    );
    expect(summary).toBe('Step: Carding · Cotton (input) · Before: Not set · After: 5');
  });

  it('titles a condition save as the line updated and puts the change in details', () => {
    const row = event({
      event_type: 'condition_actual_changed',
      description: 'Embroidery Line: condition “Heat” actual updated',
      metadata: {
        label: 'Heat',
        before: null,
        after: '200',
        stage_name: 'Embroidery Line',
      },
    });
    expect(buildBatchEventTitle(row)).toBe('Embroidery Line updated');
    expect(buildBatchEventSummary(row)).toBeNull();
    expect(buildBatchEventDetailRows(row)).toEqual([
      { label: 'Condition · Heat', value: 'Actual 200' },
    ]);
  });

  it('shows a condition change like a step snapshot row', () => {
    const row = event({
      event_type: 'condition_actual_changed',
      metadata: {
        label: 'Heat',
        unit: 'C',
        planned_value: '200',
        before: '200',
        after: '180',
        stage_name: 'Carding',
      },
    });
    expect(buildBatchEventDetailRows(row)).toEqual([
      { label: 'Condition · Heat (C)', value: 'Expected 200 · Actual 180' },
    ]);
  });

  it('shows the whole step when a condition save stored a snapshot', () => {
    const rows = buildBatchEventDetailRows(
      event({
        event_type: 'condition_actual_changed',
        metadata: {
          label: 'Turns',
          unit: 'steps',
          planned_value: '10',
          before: null,
          after: '10',
          stage_name: 'Spinning',
          step_snapshot: {
            materials: [
              { item_id: 1, item_role: 'input', expected: 5, actual: 5, unit: null },
              { item_id: 2, item_role: 'output', expected: 1, actual: 1, unit: null },
            ],
            conditions: [{ label: 'Turns', planned: '10', actual: '10', unit: 'steps' }],
          },
        },
      }),
      { getItemName: (id) => (id === 1 ? 'Cotton' : 'Pant') },
    );
    expect(rows.map((row) => row.label)).toEqual([
      'Input · Cotton',
      'Output · Pant',
      'Condition · Turns (steps)',
    ]);
    expect(rows[0]?.value).toBe('Expected 5 · Actual 5');
    expect(rows[2]?.value).toBe('Expected 10 · Actual 10');
  });

  it('formats step started with started earlier', () => {
    const summary = buildBatchEventSummary(
      event({
        event_type: 'step_started',
        metadata: {
          stage_name: 'Embroidery',
          started_earlier: true,
          started_at: '2026-10-05T08:30:00.000Z',
        },
      })
    );
    expect(summary).toContain('Started earlier');
    expect(summary).toContain('Start time:');
  });

  it('formats step finished as output of item name', () => {
    const summary = buildBatchEventSummary(
      event({
        event_type: 'step_finished',
        metadata: { stage_name: 'Spinning', output_quantity: 950, output_item_id: 3 },
      }),
      { getItemName: (id) => (id === 3 ? 'Cotton yarn' : `Item ${id}`) }
    );
    expect(summary).toBe('Output 950 of Cotton yarn');
  });

  it('omits stage name from step started summary', () => {
    const summary = buildBatchEventSummary(
      event({
        event_type: 'step_started',
        metadata: {
          stage_name: 'Carding & Ring Spinning Line 1',
          started_at: '2026-10-05T08:30:00.000Z',
          machine_id: 9,
        },
      }),
      { getMachineName: () => 'Trützschler DK-903' }
    );
    expect(summary).not.toContain('Carding');
    expect(summary).toContain('Start time:');
    expect(summary).toContain('Trützschler DK-903');
  });
});

describe('step snapshot details', () => {
  it('expands step finished snapshot into material and condition rows', () => {
    const rows = buildBatchEventDetailRows(
      event({
        event_type: 'step_finished',
        metadata: {
          step_snapshot: {
            materials: [
              { item_id: 1, item_role: 'input', expected: 10, actual: 10, unit: 'kg' },
              { item_id: 2, item_role: 'output', expected: 5, actual: 5, unit: null },
            ],
            conditions: [{ label: 'Turns', planned: '10', actual: '9', unit: null }],
            step_quantities: { output: 5 },
          },
        },
      }),
      { getItemName: (id) => (id === 1 ? 'Raw cotton' : 'Yarn') }
    );
    expect(rows.some((r) => r.label.includes('Raw cotton'))).toBe(true);
    expect(rows.some((r) => r.label.includes('Yarn'))).toBe(true);
    expect(rows.some((r) => r.label.includes('Turns'))).toBe(true);
    expect(rows.some((r) => r.label === 'Step totals')).toBe(false);
    const turns = rows.find((r) => r.label.includes('Turns'));
    expect(turns?.value).toBe('Expected 10 · Actual 9');
    const cotton = rows.find((r) => r.label.includes('Raw cotton'));
    expect(cotton?.value).toBe('Expected 10 · Actual 10');
  });

  it('shows unset snapshot actual as Not set', () => {
    const rows = buildBatchEventDetailRows(
      event({
        event_type: 'step_started',
        metadata: {
          step_snapshot: {
            materials: [],
            conditions: [{ label: 'Turns', planned: '10', actual: null, unit: null }],
          },
        },
      }),
    );
    const turns = rows.find((r) => r.label.includes('Turns'));
    expect(turns?.value).toBe('Expected 10 · Actual Not set');
  });
});

describe('buildBatchEventDetailRows', () => {
  it('shows a material actual change under the line update', () => {
    const row = event({
      event_type: 'item_actual_changed',
      batch_stage_log_id: 42,
      description: 'Carding: input actual quantity changed',
      metadata: { item_id: 10, item_role: 'input', before: 1, after: 2, stage_name: 'Carding' },
    });
    expect(buildBatchEventTitle(row)).toBe('Carding updated');
    expect(buildBatchEventDetailRows(row, { getItemName: () => 'Yarn' })).toEqual([
      { label: 'Input · Yarn', value: 'Actual 1 → 2' },
    ]);
  });

  it('includes before/after for planning edits', () => {
    const rows = buildBatchEventDetailRows(
      event({
        event_type: 'shift_changed',
        metadata: { field: 'shift_id', before: 1, after: 2 },
      })
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].label).toBe('Shift');
  });
});

describe('batch completed posting summary', () => {
  const names = (id: number) => (id === 10 ? 'Cloth' : id === 20 ? 'Yarn' : id === 30 ? 'Dust' : '');

  it('summarizes section counts and hides empty waste', () => {
    const summary = buildBatchEventSummary(
      event({
        event_type: 'batch_completed',
        description: 'Batch completed',
        metadata: {
          posting_summary: {
            products: [{ item_id: 20, qty: 2, role: 'output' }],
            leftovers: [
              {
                item_id: 10,
                qty: 5,
                made: 10,
                from_stage_name: 'Cloth Cutting',
                used: 5,
                used_by: [{ stage_name: 'Embroidery', qty: 5 }],
              },
            ],
            storage_inputs: [
              { item_id: 20, qty: 3, stage_name: 'Cloth Cutting' },
              { item_id: 20, qty: 1, stage_name: 'Embroidery' },
            ],
          },
        },
      }),
      { getItemName: names },
    );
    expect(summary).toBe('1 product · 1 leftover · 2 inputs');
  });

  it('expands products, leftover story, inputs, and waste', () => {
    const rows = buildBatchEventDetailRows(
      event({
        event_type: 'batch_completed',
        metadata: {
          posting_summary: {
            products: [
              { item_id: 20, qty: 2, role: 'output' },
              { item_id: 30, qty: 1, role: 'byproduct' },
            ],
            leftovers: [
              {
                item_id: 10,
                qty: 5,
                made: 10,
                from_stage_name: 'Cloth Cutting',
                used_by: [{ stage_name: 'Embroidery', qty: 5 }],
              },
            ],
            storage_inputs: [{ item_id: 99, qty: 4, stage_name: 'Cloth Cutting' }],
            waste: [{ item_id: 30, qty: 0.5 }],
          },
        },
      }),
      { getItemName: names },
    );
    expect(rows.map((row) => row.label)).toEqual([
      'Product',
      'Byproduct',
      'Leftover',
      'Input · Cloth Cutting',
      'Waste',
    ]);
    expect(rows[2].value).toBe(
      'Cloth · 5 to storage · Cloth Cutting made 10 · Embroidery used 5 · left 5',
    );
    expect(rows[3].value).toBe('Item #99 · 4');
    expect(rows[4].value).toBe('Dust · 0.5');
  });

  it('leaves old completed events as a single line', () => {
    const completed = event({
      event_type: 'batch_completed',
      metadata: { actual_output_quantity: 2 },
    });
    expect(buildBatchEventSummary(completed)).toBeNull();
    expect(buildBatchEventDetailRows(completed)).toEqual([]);
  });
});

describe('buildBatchEventGroupLineSummary', () => {
  it('strips redundant step prefix', () => {
    const line = buildBatchEventGroupLineSummary(
      event({
        event_type: 'item_actual_changed',
        batch_stage_log_id: 9,
        metadata: {
          item_id: 10,
          item_role: 'output',
          before: null,
          after: 5,
          stage_name: 'Carding',
        },
      }),
      { getItemName: () => 'Yarn' }
    );
    expect(line).not.toMatch(/^Step:/);
    expect(line).toContain('Yarn');
  });
});
