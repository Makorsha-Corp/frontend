import { endOfDay, endOfMonth, format, parseISO, startOfDay, startOfMonth } from 'date-fns';
import type { WorkOrderApprover, WorkOrderPriority } from '@/types/workOrder';
import type { WorkOrderSchedule } from '@/types/workOrderSchedule';
import type { WorkOrderSheetBundle } from '@/types/workOrderSheet';
import type { SheetDateScope } from '@/pages/newpages/orders/useWorkOrdersFilters';

export interface WorkOrderSheetRow {
  key: string;
  workOrderId: number;
  itemId: number | null;
  date: string;
  machineId: number | null;
  machineName: string;
  works: string;
  partName: string;
  quantity: number | null;
  unit: string;
  workers: string;
  managerStatus: '—' | 'PENDING' | 'APPROVED';
  agmStatus: '—' | 'PENDING' | 'APPROVED';
  approvers: WorkOrderApprover[];
  remarks: string;
  priority: WorkOrderPriority;
  hasBilling: boolean;
  hasTemplate: boolean;
  billingHint: string | null;
  rowTitle: string | null;
  isFirstInGroup: boolean;
  groupRowSpan: number;
}

export function approvalSlotStatus(
  approvers: WorkOrderApprover[],
  slot: 'manager' | 'agm',
): '—' | 'PENDING' | 'APPROVED' {
  const slotApprovers = approvers.filter((a) => a.approver_slot === slot);
  if (slotApprovers.length === 0) {
    if (approvers.length === 0) return '—';
    const idx = slot === 'manager' ? 0 : 1;
    const fallback = approvers[idx];
    if (!fallback) return '—';
    return fallback.approved ? 'APPROVED' : 'PENDING';
  }
  if (slotApprovers.every((a) => a.approved)) return 'APPROVED';
  return 'PENDING';
}

function buildRowMeta(
  order: WorkOrderSheetBundle['order'],
  accountName: (id: number | null) => string | null,
) {
  const hasBilling = order.account_id != null || (order.cost != null && Number(order.cost) > 0);
  const hasTemplate = order.work_order_template_id != null;
  const parts: string[] = [];
  if (order.priority !== 'MEDIUM') parts.push(`Priority: ${order.priority}`);
  if (order.account_id != null) {
    const name = accountName(order.account_id);
    parts.push(`Billed to: ${name ?? `Account #${order.account_id}`}`);
  }
  if (order.cost != null && Number(order.cost) > 0) parts.push(`Cost: ${order.cost}`);
  if (hasTemplate) parts.push('From template');
  const billingHint =
    order.account_id != null || (order.cost != null && Number(order.cost) > 0)
      ? parts.filter((p) => p.startsWith('Billed') || p.startsWith('Cost')).join(' · ') || null
      : null;
  const rowTitle = parts.length > 0 ? parts.join(' · ') : null;
  return {
    priority: order.priority,
    hasBilling,
    hasTemplate,
    billingHint,
    rowTitle,
  };
}

export function flattenSheetBundles(
  bundles: WorkOrderSheetBundle[],
  machineName: (id: number | null) => string,
  accountName: (id: number | null) => string | null = () => null,
): WorkOrderSheetRow[] {
  const rows: WorkOrderSheetRow[] = [];

  for (const bundle of bundles) {
    const { order, items, approvers } = bundle;
    const dateStr = order.start_date ?? order.created_at.slice(0, 10);
    const mgr = approvalSlotStatus(approvers.approvers, 'manager');
    const agm = approvalSlotStatus(approvers.approvers, 'agm');
    const approverList = approvers.approvers;
    const workers = order.assigned_to?.trim() || '—';
    const remarks = order.description?.trim() || order.completion_notes?.trim() || '—';
    const works = order.work_order_type_name ?? order.title;
    const machineLabel = machineName(order.machine_id);
    const meta = buildRowMeta(order, accountName);

    if (items.length === 0) {
      rows.push({
        key: `wo-${order.id}-empty`,
        workOrderId: order.id,
        itemId: null,
        date: dateStr,
        machineId: order.machine_id,
        machineName: machineLabel,
        works,
        partName: '—',
        quantity: null,
        unit: '—',
        workers,
        managerStatus: mgr,
        agmStatus: agm,
        approvers: approverList,
        remarks,
        ...meta,
        isFirstInGroup: true,
        groupRowSpan: 1,
      });
      continue;
    }

    items.forEach((item, idx) => {
      rows.push({
        key: `wo-${order.id}-item-${item.id}`,
        workOrderId: order.id,
        itemId: item.id,
        date: dateStr,
        machineId: order.machine_id,
        machineName: machineLabel,
        works,
        partName: item.item_name ?? `Item #${item.item_id}`,
        quantity: Number(item.quantity),
        unit: item.item_unit ?? '—',
        workers,
        managerStatus: mgr,
        agmStatus: agm,
        approvers: approverList,
        remarks,
        ...meta,
        isFirstInGroup: idx === 0,
        groupRowSpan: items.length,
      });
    });
  }

  rows.sort((a, b) => {
    const da = startOfDay(parseISO(a.date)).getTime();
    const db = startOfDay(parseISO(b.date)).getTime();
    if (da !== db) return db - da;
    return a.machineName.localeCompare(b.machineName);
  });

  return rows;
}

export function groupRowsByDate(rows: WorkOrderSheetRow[]): { date: string; label: string; rows: WorkOrderSheetRow[] }[] {
  const map = new Map<string, WorkOrderSheetRow[]>();
  for (const row of rows) {
    const list = map.get(row.date) ?? [];
    list.push(row);
    map.set(row.date, list);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => parseISO(b).getTime() - parseISO(a).getTime())
    .map(([date, dateRows]) => ({
      date,
      label: format(parseISO(date), 'dd.MM.yyyy'),
      rows: dateRows,
    }));
}

export interface SheetDateGroup {
  date: string;
  label: string;
  rows: WorkOrderSheetRow[];
  isSelected: boolean;
  isEmpty: boolean;
  entryCount: number;
  stagedCount: number;
  schedulesForDay: WorkOrderSchedule[];
}

export function schedulesForDate(
  schedules: WorkOrderSchedule[],
  dateIso: string,
): WorkOrderSchedule[] {
  return schedules.filter((s) => s.scheduled_date === dateIso);
}

export function countStagedForDate(schedules: WorkOrderSchedule[], dateIso: string): number {
  return schedulesForDate(schedules, dateIso).filter((s) => s.status === 'STAGED').length;
}

function normalizeSheetDateIso(sheetDate: string): string {
  return format(startOfDay(parseISO(sheetDate)), 'yyyy-MM-dd');
}

export function sheetPeriodBounds(
  dateScope: SheetDateScope,
  sheetDate: string,
): { from: Date; to: Date } {
  const base = parseISO(sheetDate);
  if (dateScope === 'month') {
    return { from: startOfMonth(base), to: endOfMonth(base) };
  }
  if (dateScope === 'week') {
    const from = startOfDay(base);
    const to = endOfDay(new Date(from.getTime() + 6 * 24 * 60 * 60 * 1000));
    return { from, to };
  }
  const day = startOfDay(base);
  return { from: day, to: endOfDay(day) };
}

function isDateInPeriod(dateIso: string, from: Date, to: Date): boolean {
  const t = startOfDay(parseISO(dateIso)).getTime();
  return t >= from.getTime() && t <= to.getTime();
}

function countWorkOrdersForDay(rows: WorkOrderSheetRow[]): number {
  return new Set(rows.map((r) => r.workOrderId)).size;
}

export function buildSheetDateGroups(
  rows: WorkOrderSheetRow[],
  dateScope: SheetDateScope,
  sheetDate: string,
  schedules: WorkOrderSchedule[] = [],
): SheetDateGroup[] {
  const selectedDate = normalizeSheetDateIso(sheetDate);
  const { from, to } = sheetPeriodBounds(dateScope, selectedDate);
  const grouped = groupRowsByDate(rows);

  const rowsByDate = new Map<string, WorkOrderSheetRow[]>();
  for (const group of grouped) {
    if (isDateInPeriod(group.date, from, to)) {
      rowsByDate.set(group.date, group.rows);
    }
  }
  rowsByDate.set(selectedDate, rowsByDate.get(selectedDate) ?? []);

  const scheduleDates = new Set<string>();
  for (const schedule of schedules) {
    if (isDateInPeriod(schedule.scheduled_date, from, to)) {
      scheduleDates.add(schedule.scheduled_date);
    }
  }
  for (const date of scheduleDates) {
    rowsByDate.set(date, rowsByDate.get(date) ?? []);
  }

  const dates = Array.from(rowsByDate.keys()).sort(
    (a, b) => parseISO(b).getTime() - parseISO(a).getTime(),
  );

  return dates.map((date) => {
    const dateRows = rowsByDate.get(date) ?? [];
    const daySchedules = schedulesForDate(schedules, date);
    const entryCount = countWorkOrdersForDay(dateRows);
    const stagedCount = countStagedForDate(schedules, date);
    return {
      date,
      label: format(parseISO(date), 'dd.MM.yyyy (EEE)'),
      rows: dateRows,
      isSelected: date === selectedDate,
      isEmpty: dateRows.length === 0 && daySchedules.length === 0,
      entryCount,
      stagedCount,
      schedulesForDay: daySchedules,
    };
  });
}

export function buildSheetPeriodLabel(dateScope: SheetDateScope, sheetDate: string): string | null {
  const base = parseISO(sheetDate);
  if (dateScope === 'month') {
    return format(base, 'MMMM yyyy');
  }
  if (dateScope === 'week') {
    const { from, to } = sheetPeriodBounds(dateScope, sheetDate);
    return `${format(from, 'dd.MM')} – ${format(to, 'dd.MM.yyyy')}`;
  }
  return null;
}

export interface LubricantRollupLine {
  itemId: number;
  name: string;
  unit: string;
  requiredQty: number;
  inStock: number | null;
}

export function computeLubricantRollup(
  bundles: WorkOrderSheetBundle[],
  stockByItemId: Map<number, number>,
): LubricantRollupLine[] {
  const totals = new Map<number, { name: string; unit: string; qty: number }>();

  for (const bundle of bundles) {
    for (const item of bundle.items) {
      const prev = totals.get(item.item_id);
      const qty = Number(item.quantity);
      if (prev) {
        prev.qty += qty;
      } else {
        totals.set(item.item_id, {
          name: item.item_name ?? `Item #${item.item_id}`,
          unit: item.item_unit ?? '—',
          qty,
        });
      }
    }
  }

  return Array.from(totals.entries())
    .map(([itemId, v]) => ({
      itemId,
      name: v.name,
      unit: v.unit,
      requiredQty: v.qty,
      inStock: stockByItemId.has(itemId) ? stockByItemId.get(itemId)! : null,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function sheetRowsHaveParts(rows: WorkOrderSheetRow[]): boolean {
  return rows.some((r) => r.itemId != null);
}
