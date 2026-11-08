import type { ProductionBatchEvent } from '@/types/production';
import { formatProductionQuantity } from '@/lib/productionQuantity';

import { BATCH_EVENT_STEP_UPDATE_TYPES } from '@/lib/batchEventLogGrouping';

export type BatchEventDisplayContext = {
  getItemName?: (itemId: number) => string;
  getMachineName?: (machineId: number) => string;
  getLineName?: (lineId: number) => string;
};

export type BatchEventDetailRow = {
  label: string;
  value: string;
};

type StepSnapshotMaterial = {
  item_id?: number;
  item_role?: string;
  expected?: unknown;
  actual?: unknown;
  unit?: string | null;
};

type StepSnapshotCondition = {
  label?: string;
  planned?: string;
  actual?: string | null;
  unit?: string | null;
};

type StepSnapshot = {
  output_item_id?: number | null;
  materials?: StepSnapshotMaterial[];
  conditions?: StepSnapshotCondition[];
};

const MATERIAL_ROLE_ORDER = ['input', 'output', 'waste', 'byproduct'] as const;

function parseStepSnapshot(meta: Record<string, unknown>): StepSnapshot | null {
  const raw = meta.step_snapshot;
  if (!raw || typeof raw !== 'object') return null;
  return raw as StepSnapshot;
}

function resolveOutputItemId(meta: Record<string, unknown>, snapshot: StepSnapshot | null): number | null {
  if (typeof meta.output_item_id === 'number') return meta.output_item_id;
  if (snapshot?.output_item_id != null && typeof snapshot.output_item_id === 'number') {
    return snapshot.output_item_id;
  }
  const firstOutput = snapshot?.materials?.find((row) => row.item_role === 'output');
  return typeof firstOutput?.item_id === 'number' ? firstOutput.item_id : null;
}

function formatMaterialQtyLine(expected: unknown, actual: unknown): string {
  return `Expected ${formatQuantityValue(expected)} · Actual ${formatQuantityValue(actual)}`;
}

function formatStepOutputSummary(
  meta: Record<string, unknown>,
  ctx: BatchEventDisplayContext,
): string | null {
  const qty = meta.output_quantity;
  if (qty === null || qty === undefined) return null;
  const snapshot = parseStepSnapshot(meta);
  const itemId = resolveOutputItemId(meta, snapshot);
  const itemName =
    itemId != null && ctx.getItemName ? ctx.getItemName(itemId) : itemId != null ? `Item #${itemId}` : null;
  const qtyText = formatBatchEventValue(qty);
  if (itemName) return `Output ${qtyText} of ${itemName}`;
  return `Output ${qtyText}`;
}

function buildStepSnapshotDetailRows(
  snapshot: StepSnapshot,
  ctx: BatchEventDisplayContext,
): BatchEventDetailRow[] {
  const rows: BatchEventDetailRow[] = [];
  const materials = snapshot.materials ?? [];
  for (const role of MATERIAL_ROLE_ORDER) {
    const roleRows = materials.filter((row) => row.item_role === role);
    for (const row of roleRows) {
      const itemId = row.item_id;
      const name =
        typeof itemId === 'number' && ctx.getItemName
          ? ctx.getItemName(itemId)
          : typeof itemId === 'number'
            ? `Item #${itemId}`
            : 'Item';
      const unit = row.unit?.trim();
      const label = unit ? `${name} (${unit})` : name;
      rows.push({
        label: `${role.charAt(0).toUpperCase()}${role.slice(1)} · ${label}`,
        value: formatMaterialQtyLine(row.expected, row.actual),
      });
    }
  }

  for (const cond of snapshot.conditions ?? []) {
    const label = cond.label?.trim() || 'Condition';
    const unit = cond.unit?.trim();
    const name = unit ? `${label} (${unit})` : label;
    rows.push({
      label: `Condition · ${name}`,
      value: formatMaterialQtyLine(cond.planned, cond.actual),
    });
  }

  return rows;
}

const FIELD_LABELS: Record<string, string> = {
  planned_start_at: 'Planned start',
  shift_id: 'Shift',
  batch_date: 'Batch date',
  expected_output_quantity: 'Expected output',
  expected_duration_minutes: 'Expected duration (min)',
  notes: 'Notes',
  production_line_id: 'Production line',
  machine_id: 'Machine',
  expected_quantity: 'Expected qty',
  actual_quantity: 'Actual qty',
  output_quantity: 'Output',
  input_quantity: 'Input',
  waste_quantity: 'Waste',
  stage_name: 'Step',
  batch_stage_log_id: 'Step log',
};

const BATCH_FIELD_UPDATE_TYPES = new Set([
  'planned_start_changed',
  'shift_changed',
  'batch_date_changed',
  'expected_output_changed',
  'expected_duration_changed',
  'notes_changed',
  'batch_line_changed',
  'batch_machine_changed',
]);

function isIsoDateTimeString(value: string): boolean {
  return value.includes('T') && !Number.isNaN(Date.parse(value));
}

export function formatBatchEventValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'number') return String(value);
  if (typeof value === 'string') {
    if (isIsoDateTimeString(value)) {
      return new Date(value).toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      });
    }
    return value;
  }
  return JSON.stringify(value);
}

function formatBeforeAfter(before: unknown, after: unknown): string {
  return `${formatBatchEventValue(before)} → ${formatBatchEventValue(after)}`;
}

/** Quantities: null/undefined reads as "Not set" (not em dash). */
export function formatQuantityValue(value: unknown): string {
  if (value === null || value === undefined) return 'Not set';
  if (typeof value === 'number') return String(value);
  if (typeof value === 'string' && value.trim() !== '') return value;
  return 'Not set';
}

function formatPostedQty(value: unknown): string {
  if (typeof value === 'number' && Number.isFinite(value)) return formatProductionQuantity(value);
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return formatProductionQuantity(parsed);
  }
  return formatQuantityValue(value);
}

function postedItemName(itemId: unknown, ctx: BatchEventDisplayContext): string {
  const id = typeof itemId === 'number' ? itemId : Number(itemId);
  if (!Number.isFinite(id)) return 'Item';
  const name = ctx.getItemName?.(id)?.trim();
  return name || `Item #${id}`;
}

function asRecordList(value: unknown): Record<string, unknown>[] {
  if (!Array.isArray(value)) return [];
  return value.filter((row): row is Record<string, unknown> => !!row && typeof row === 'object');
}

type PostingSections = {
  products: Record<string, unknown>[];
  leftovers: Record<string, unknown>[];
  storageInputs: Record<string, unknown>[];
  waste: Record<string, unknown>[];
};

function readPostingSections(meta: Record<string, unknown>): PostingSections | null {
  const summary = meta.posting_summary;
  if (!summary || typeof summary !== 'object' || Array.isArray(summary)) return null;
  const record = summary as Record<string, unknown>;
  const sections: PostingSections = {
    products: asRecordList(record.products),
    leftovers: asRecordList(record.leftovers),
    storageInputs: asRecordList(record.storage_inputs),
    waste: asRecordList(record.waste),
  };
  if (
    sections.products.length +
      sections.leftovers.length +
      sections.storageInputs.length +
      sections.waste.length ===
    0
  ) {
    return null;
  }
  return sections;
}

function countPhrase(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

function postingSummaryLine(meta: Record<string, unknown>): string | null {
  const sections = readPostingSections(meta);
  if (!sections) return null;
  const parts: string[] = [];
  if (sections.products.length) parts.push(countPhrase(sections.products.length, 'product', 'products'));
  if (sections.leftovers.length) parts.push(countPhrase(sections.leftovers.length, 'leftover', 'leftovers'));
  if (sections.storageInputs.length) parts.push(countPhrase(sections.storageInputs.length, 'input', 'inputs'));
  if (sections.waste.length) parts.push(countPhrase(sections.waste.length, 'waste', 'waste'));
  return parts.join(' · ');
}

function leftoverDetailValue(row: Record<string, unknown>, ctx: BatchEventDisplayContext): string {
  const name = postedItemName(row.item_id, ctx);
  const posted = formatPostedQty(row.qty);
  const madeBy = typeof row.from_stage_name === 'string' && row.from_stage_name.trim()
    ? row.from_stage_name
    : 'Earlier step';
  const parts = [
    `${name} · ${posted} to storage`,
    `${madeBy} made ${formatPostedQty(row.made)}`,
  ];
  for (const used of asRecordList(row.used_by)) {
    const stage = typeof used.stage_name === 'string' && used.stage_name.trim() ? used.stage_name : 'Later step';
    parts.push(`${stage} used ${formatPostedQty(used.qty)}`);
  }
  parts.push(`left ${posted}`);
  return parts.join(' · ');
}

function postingSummaryDetailRows(
  meta: Record<string, unknown>,
  ctx: BatchEventDisplayContext,
): BatchEventDetailRow[] {
  const sections = readPostingSections(meta);
  if (!sections) return [];
  const rows: BatchEventDetailRow[] = [];
  for (const product of sections.products) {
    const role = product.role === 'byproduct' ? 'Byproduct' : 'Product';
    rows.push({
      label: role,
      value: `${postedItemName(product.item_id, ctx)} · ${formatPostedQty(product.qty)}`,
    });
  }
  for (const leftover of sections.leftovers) {
    rows.push({ label: 'Leftover', value: leftoverDetailValue(leftover, ctx) });
  }
  for (const input of sections.storageInputs) {
    const stage = typeof input.stage_name === 'string' && input.stage_name.trim() ? input.stage_name : 'Step';
    rows.push({
      label: `Input · ${stage}`,
      value: `${postedItemName(input.item_id, ctx)} · ${formatPostedQty(input.qty)}`,
    });
  }
  for (const waste of sections.waste) {
    rows.push({
      label: 'Waste',
      value: `${postedItemName(waste.item_id, ctx)} · ${formatPostedQty(waste.qty)}`,
    });
  }
  return rows;
}

function conditionDetailRow(meta: Record<string, unknown>): BatchEventDetailRow {
  const label = typeof meta.label === 'string' && meta.label.trim() ? meta.label.trim() : 'Condition';
  const unit = typeof meta.unit === 'string' ? meta.unit.trim() : '';
  const name = unit ? `${label} (${unit})` : label;
  const planned = meta.planned_value;
  const hasPlanned = planned != null && planned !== '';
  let value: string;
  if (hasPlanned) {
    value = formatMaterialQtyLine(planned, meta.after);
  } else if (meta.before == null || meta.before === '') {
    value = `Actual ${formatQuantityValue(meta.after)}`;
  } else {
    value = `Actual ${formatQuantityValue(meta.before)} → ${formatQuantityValue(meta.after)}`;
  }
  return { label: `Condition · ${name}`, value };
}

function stageNameFromConditionDescription(description: string): string | null {
  const match = description.match(/^(.+?): condition /);
  const stage = match?.[1]?.trim();
  return stage || null;
}

function resolveStageLabel(
  event: ProductionBatchEvent,
  meta: Record<string, unknown>
): string | null {
  if (typeof meta.stage_name === 'string' && meta.stage_name.trim()) {
    return meta.stage_name;
  }
  if (event.batch_stage_log_id != null) {
    return `Step #${event.batch_stage_log_id}`;
  }
  return null;
}

function formatItemQuantitySummary(
  event: ProductionBatchEvent,
  meta: Record<string, unknown>,
  ctx: BatchEventDisplayContext
): string {
  const parts: string[] = [];
  const stage = resolveStageLabel(event, meta);
  if (stage) parts.push(`Step: ${stage}`);
  parts.push(itemLabel(meta, ctx));
  parts.push(`Before: ${formatQuantityValue(meta.before)}`);
  parts.push(`After: ${formatQuantityValue(meta.after)}`);
  return parts.join(' · ');
}

function itemLabel(
  metadata: Record<string, unknown>,
  ctx: BatchEventDisplayContext
): string {
  const itemId = metadata.item_id;
  const role = metadata.item_role;
  const name =
    typeof itemId === 'number' && ctx.getItemName
      ? ctx.getItemName(itemId)
      : typeof itemId === 'number'
        ? `Item #${itemId}`
        : 'Item';
  const roleSuffix =
    typeof role === 'string' && role.length > 0 ? ` (${role.replace('_', ' ')})` : '';
  return `${name}${roleSuffix}`;
}

function resolveIdLabel(
  field: string,
  value: unknown,
  ctx: BatchEventDisplayContext
): string {
  if (typeof value !== 'number') return formatBatchEventValue(value);
  if (field === 'machine_id' && ctx.getMachineName) return ctx.getMachineName(value);
  if (field === 'production_line_id' && ctx.getLineName) return ctx.getLineName(value);
  if (field === 'item_id' && ctx.getItemName) return ctx.getItemName(value);
  return String(value);
}

export function buildBatchEventSummary(
  event: ProductionBatchEvent,
  ctx: BatchEventDisplayContext = {}
): string | null {
  const meta = event.metadata;
  if (!meta || typeof meta !== 'object') return null;

  switch (event.event_type) {
    case 'item_expected_changed':
    case 'item_actual_changed':
      return formatItemQuantitySummary(event, meta, ctx);
    case 'step_started': {
      const parts: string[] = [];
      if (meta.started_earlier === true) parts.push('Started earlier');
      if (meta.started_at) {
        parts.push(`Start time: ${formatBatchEventValue(meta.started_at)}`);
      }
      if (typeof meta.machine_id === 'number') {
        parts.push(ctx.getMachineName?.(meta.machine_id) ?? `Machine #${meta.machine_id}`);
      }
      return parts.length > 0 ? parts.join(' · ') : null;
    }
    case 'step_finished': {
      const parts: string[] = [];
      const outputLine = formatStepOutputSummary(meta, ctx);
      if (outputLine) parts.push(outputLine);
      if (meta.rework_quantity != null && meta.rework_quantity !== 0) {
        parts.push(`Rework ${formatBatchEventValue(meta.rework_quantity)}`);
      }
      return parts.length > 0 ? parts.join(' · ') : null;
    }
    case 'step_skipped': {
      return null;
    }
    case 'condition_actual_changed':
      return null;
    case 'step_output_changed':
    case 'step_input_changed':
    case 'step_waste_changed': {
      const stage = resolveStageLabel(event, meta);
      const fieldLabel =
        event.event_type === 'step_output_changed'
          ? 'Output'
          : event.event_type === 'step_input_changed'
            ? 'Input'
            : 'Waste';
      const change = `${fieldLabel}: Before: ${formatQuantityValue(meta.before)} · After: ${formatQuantityValue(meta.after)}`;
      return stage ? `Step: ${stage} · ${change}` : change;
    }
    case 'batch_started': {
      const parts: string[] = [];
      if (meta.via_first_step === true) parts.push('Auto-started with first step');
      if (meta.started_earlier === true) parts.push('Started earlier');
      if (meta.started_at) parts.push(`Start time: ${formatBatchEventValue(meta.started_at)}`);
      return parts.length > 0 ? parts.join(' · ') : null;
    }
    case 'batch_completed':
      return postingSummaryLine(meta);
    case 'finished_goods_posted':
      if (meta.item_count != null) return `${formatBatchEventValue(meta.item_count)} line(s) posted`;
      return null;
    default:
      if ('before' in meta && 'after' in meta) {
        const field = typeof meta.field === 'string' ? meta.field : null;
        const label = field ? (FIELD_LABELS[field] ?? field) : 'Value';
        if (field === 'machine_id' || field === 'production_line_id') {
          return `${label}: ${resolveIdLabel(field, meta.before, ctx)} → ${resolveIdLabel(field, meta.after, ctx)}`;
        }
        return `${label}: ${formatBeforeAfter(meta.before, meta.after)}`;
      }
      return null;
  }
}

function stageUpdatedTitle(event: ProductionBatchEvent): string {
  const meta = event.metadata;
  const stage =
    meta && typeof meta === 'object'
      ? resolveStageLabel(event, meta) ?? stageNameFromConditionDescription(event.description)
      : stageNameFromConditionDescription(event.description);
  return stage ? `${stage} updated` : 'Updated';
}

/** Row title. Any save reads as “{line} updated” or “Batch updated”. The change sits in Details. */
export function buildBatchEventTitle(event: ProductionBatchEvent): string {
  const isStepUpdate =
    BATCH_EVENT_STEP_UPDATE_TYPES.has(event.event_type) ||
    /: condition .+ actual updated$/.test(event.description);
  if (isStepUpdate) return stageUpdatedTitle(event);
  if (BATCH_FIELD_UPDATE_TYPES.has(event.event_type)) return 'Batch updated';
  return event.description;
}

/** One change inside an “updated” card. */
export function buildBatchEventChangeRow(
  event: ProductionBatchEvent,
  ctx: BatchEventDisplayContext = {},
): BatchEventDetailRow | null {
  const meta = event.metadata;
  if (event.event_type === 'condition_actual_changed') {
    if (!meta || typeof meta !== 'object') return null;
    return conditionDetailRow(meta);
  }
  if (
    (event.event_type === 'item_actual_changed' || event.event_type === 'item_expected_changed') &&
    meta &&
    typeof meta === 'object'
  ) {
    const role = typeof meta.item_role === 'string' ? meta.item_role : 'item';
    const roleLabel = `${role.charAt(0).toUpperCase()}${role.slice(1)}`;
    const itemId = meta.item_id;
    const name =
      typeof itemId === 'number' && ctx.getItemName
        ? ctx.getItemName(itemId)
        : typeof itemId === 'number'
          ? `Item #${itemId}`
          : 'Item';
    const kind = event.event_type === 'item_expected_changed' ? 'Expected' : 'Actual';
    return {
      label: `${roleLabel} · ${name}`,
      value: `${kind} ${formatQuantityValue(meta.before)} → ${formatQuantityValue(meta.after)}`,
    };
  }
  if (meta && typeof meta === 'object' && 'before' in meta && 'after' in meta) {
    const field = typeof meta.field === 'string' ? meta.field : null;
    const label = field ? (FIELD_LABELS[field] ?? field) : 'Update';
    if (field === 'machine_id' || field === 'production_line_id') {
      return {
        label,
        value: `${resolveIdLabel(field, meta.before, ctx)} → ${resolveIdLabel(field, meta.after, ctx)}`,
      };
    }
    return { label, value: formatBeforeAfter(meta.before, meta.after) };
  }
  return null;
}

/** Compact line for grouped step updates (no redundant step prefix). */
export function buildBatchEventGroupLineSummary(
  event: ProductionBatchEvent,
  ctx: BatchEventDisplayContext = {},
): string {
  const change = buildBatchEventChangeRow(event, ctx);
  if (change) return `${change.label} ${change.value}`;
  const summary = buildBatchEventSummary(event, ctx);
  if (!summary) return event.description;
  const withoutStep = summary.replace(/^Step: [^·]+ · /, '');
  return withoutStep || summary;
}

export function buildBatchEventDetailRows(
  event: ProductionBatchEvent,
  ctx: BatchEventDisplayContext = {}
): BatchEventDetailRow[] {
  if (event.event_type === 'condition_actual_changed') {
    const meta = event.metadata;
    if (!meta || typeof meta !== 'object') return [];
    const snapshot = parseStepSnapshot(meta);
    if (snapshot && ((snapshot.materials?.length ?? 0) > 0 || (snapshot.conditions?.length ?? 0) > 0)) {
      return buildStepSnapshotDetailRows(snapshot, ctx);
    }
    return [conditionDetailRow(meta)];
  }

  if (BATCH_EVENT_STEP_UPDATE_TYPES.has(event.event_type)) {
    const change = buildBatchEventChangeRow(event, ctx);
    return change ? [change] : [];
  }

  const meta = event.metadata;
  if (!meta || typeof meta !== 'object') return [];

  switch (event.event_type) {
    case 'step_started':
    case 'step_finished': {
      const snapshot = parseStepSnapshot(meta);
      if (snapshot) return buildStepSnapshotDetailRows(snapshot, ctx);
      return [];
    }
    case 'batch_started':
    case 'step_skipped':
    case 'finished_goods_posted':
      return [];
    case 'batch_completed':
      return postingSummaryDetailRows(meta, ctx);
    default:
      break;
  }

  if ('before' in meta && 'after' in meta) {
    const field = typeof meta.field === 'string' ? meta.field : null;
    const label = field ? (FIELD_LABELS[field] ?? field) : 'Change';
    if (field === 'machine_id' || field === 'production_line_id') {
      return [
        {
          label,
          value: `${resolveIdLabel(field, meta.before, ctx)} → ${resolveIdLabel(field, meta.after, ctx)}`,
        },
      ];
    }
    return [{ label, value: formatBeforeAfter(meta.before, meta.after) }];
  }

  return [];
}

export function batchEventHasDetails(
  event: ProductionBatchEvent,
  ctx: BatchEventDisplayContext = {},
): boolean {
  return buildBatchEventDetailRows(event, ctx).length > 0;
}
