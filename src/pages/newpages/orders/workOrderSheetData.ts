import {
  addDays,
  differenceInCalendarWeeks,
  endOfDay,
  endOfMonth,
  endOfWeek,
  format,
  getYear,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subDays,
} from 'date-fns';
import type {
  WorkOrder,
  WorkOrderApprover,
  WorkOrderItemActionType,
  WorkOrderPriority,
  WorkOrderStatus,
} from '@/types/workOrder';
import type { WorkOrderSchedule } from '@/types/workOrderSchedule';
import type { WorkOrderSheetBundle } from '@/types/workOrderSheet';
import type { SheetDateScope } from '@/pages/newpages/orders/useWorkOrdersFilters';
import { getWorkOrderCalendarDateString } from '@/pages/newpages/orders/workOrderDateUtils';

/** Sunday-start work week (Sun → Sat). */
export const SHEET_WEEK_STARTS_ON = 0 as const;

export interface MachineDayChecklistEntry {
  machineId: number;
  machineName: string;
  logged: boolean;
}

export interface MachineDayChecklist {
  entries: MachineDayChecklistEntry[];
  loggedCount: number;
  totalCount: number;
}

export interface WorkOrderSheetRow {
  key: string;
  workOrderId: number;
  workOrderNumber: string;
  status: WorkOrderStatus;
  approvalMet: boolean;
  itemId: number | null;
  date: string;
  plannedDate: string | null;
  machineId: number | null;
  machineName: string;
  factoryName: string;
  sectionName: string | null;
  works: string;
  partName: string;
  actionType: WorkOrderItemActionType | null;
  startedAt: string | null;
  completedAt: string | null;
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

export interface SheetFlattenLabelContext {
  factoryName: (factoryId: number) => string;
  sectionName: (machineId: number | null) => string | null;
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

export function filterBundlesByOrderIds(
  bundles: WorkOrderSheetBundle[],
  orderIds: Set<number>,
): WorkOrderSheetBundle[] {
  if (orderIds.size === 0) return [];
  return bundles.filter((bundle) => orderIds.has(bundle.order.id));
}

export function flattenSheetBundlesToOrders(
  bundles: WorkOrderSheetBundle[],
): WorkOrder[] {
  const seen = new Set<number>();
  const orders: WorkOrder[] = [];
  for (const bundle of bundles) {
    if (seen.has(bundle.order.id)) continue;
    seen.add(bundle.order.id);
    orders.push(bundle.order);
  }
  return orders;
}

export function flattenSheetBundles(
  bundles: WorkOrderSheetBundle[],
  machineName: (id: number | null) => string,
  accountName: (id: number | null) => string | null = () => null,
  labels?: SheetFlattenLabelContext,
): WorkOrderSheetRow[] {
  const rows: WorkOrderSheetRow[] = [];

  for (const bundle of bundles) {
    const { order, items, approvers } = bundle;
    const dateStr = getWorkOrderCalendarDateString(order);
    const plannedDate = order.planned_date?.trim() ? order.planned_date.slice(0, 10) : null;
    const mgr = approvalSlotStatus(approvers.approvers, 'manager');
    const agm = approvalSlotStatus(approvers.approvers, 'agm');
    const approverList = approvers.approvers;
    const approvalMet = approvers.summary.met;
    const workers = order.assigned_to?.trim() || '—';
    const remarks = order.description?.trim() || order.completion_notes?.trim() || '—';
    const works = order.work_order_type_name ?? order.title;
    const machineLabel = machineName(order.machine_id);
    const factoryLabel = labels?.factoryName(order.factory_id) ?? `Factory #${order.factory_id}`;
    const sectionLabel = labels?.sectionName(order.machine_id) ?? null;
    const meta = buildRowMeta(order, accountName);

    if (items.length === 0) {
      rows.push({
        key: `wo-${order.id}-empty`,
        workOrderId: order.id,
        workOrderNumber: order.work_order_number,
        status: order.status,
        approvalMet,
        itemId: null,
        date: dateStr,
        plannedDate,
        machineId: order.machine_id,
        machineName: machineLabel,
        factoryName: factoryLabel,
        sectionName: sectionLabel,
        works,
        partName: '—',
        actionType: null,
        startedAt: order.started_at,
        completedAt: order.completed_at,
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
        workOrderNumber: order.work_order_number,
        status: order.status,
        approvalMet,
        itemId: item.id,
        date: dateStr,
        plannedDate,
        machineId: order.machine_id,
        machineName: machineLabel,
        factoryName: factoryLabel,
        sectionName: sectionLabel,
        works,
        partName: item.item_name ?? `Item #${item.item_id}`,
        actionType: item.action_type,
        startedAt: order.started_at,
        completedAt: order.completed_at,
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
    return {
      from: startOfWeek(base, { weekStartsOn: SHEET_WEEK_STARTS_ON }),
      to: endOfWeek(base, { weekStartsOn: SHEET_WEEK_STARTS_ON }),
    };
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

/** Unique work-order count per start date (for calendar dots). */
export function buildOrderCountByDate(rows: WorkOrderSheetRow[]): Record<string, number> {
  const byDate = new Map<string, Set<number>>();
  for (const row of rows) {
    const ids = byDate.get(row.date) ?? new Set<number>();
    ids.add(row.workOrderId);
    byDate.set(row.date, ids);
  }
  const result: Record<string, number> = {};
  for (const [date, ids] of byDate) {
    result[date] = ids.size;
  }
  return result;
}

export interface SheetWeekBounds {
  from: Date;
  to: Date;
}

export interface SheetAdjacentWeekBounds {
  anchor: SheetWeekBounds;
  prev: SheetWeekBounds;
  next: SheetWeekBounds;
  fetch: SheetWeekBounds;
}

export function sheetAdjacentWeekBounds(sheetDate: string): SheetAdjacentWeekBounds {
  const anchor = sheetPeriodBounds('week', sheetDate);
  const prevFrom = startOfDay(subDays(anchor.from, 7));
  const prevTo = endOfDay(subDays(anchor.from, 1));
  const nextFrom = startOfDay(addDays(anchor.to, 1));
  const nextTo = endOfDay(addDays(anchor.to, 7));
  return {
    anchor,
    prev: { from: prevFrom, to: prevTo },
    next: { from: nextFrom, to: nextTo },
    fetch: { from: prevFrom, to: nextTo },
  };
}

/** Visible calendar grid for a month (Sun–Sat rows incl. trailing/leading days). */
export function sheetCalendarGridBounds(month: Date): SheetWeekBounds {
  return {
    from: startOfWeek(startOfMonth(month), { weekStartsOn: SHEET_WEEK_STARTS_ON }),
    to: endOfWeek(endOfMonth(month), { weekStartsOn: SHEET_WEEK_STARTS_ON }),
  };
}

function formatWeekLabel(from: Date, to: Date): string {
  return `${format(from, 'EEE dd.MM')} – ${format(to, 'EEE dd.MM.yyyy')}`;
}

type CompactWeekRangeYearMode = 'always' | 'if-not-current' | 'never';

/** Compact range like `19 – 25 Jul` or `19 – 25 Jul 2026`. */
export function formatCompactWeekRangeLabel(
  from: Date,
  to: Date,
  yearMode: CompactWeekRangeYearMode = 'if-not-current',
): string {
  const todayYear = getYear(new Date());
  const fromYear = getYear(from);
  const toYear = getYear(to);
  const includeYear =
    yearMode === 'always' ||
    (yearMode === 'if-not-current' && (fromYear !== todayYear || toYear !== todayYear));

  const sameMonth = format(from, 'MMM yyyy') === format(to, 'MMM yyyy');

  if (sameMonth) {
    const core = `${format(from, 'd')} – ${format(to, 'd')} ${format(from, 'MMM')}`;
    return includeYear ? `${core} ${fromYear}` : core;
  }

  const fromPart = `${format(from, 'd')} ${format(from, 'MMM')}`;
  const toPart = `${format(to, 'd')} ${format(to, 'MMM')}`;
  const core = `${fromPart} – ${toPart}`;

  if (!includeYear) return core;

  if (fromYear === toYear) {
    return `${core} ${fromYear}`;
  }

  return `${format(from, 'd MMM yyyy')} – ${format(to, 'd MMM yyyy')}`;
}

/** Toolbar week trigger: This week / Last week / Next week / compact range. */
export function formatRelativeWeekTriggerLabel(sheetDate: string): string {
  const base = parseISO(sheetDate);
  const weekDiff = differenceInCalendarWeeks(base, new Date(), {
    weekStartsOn: SHEET_WEEK_STARTS_ON,
  });

  if (weekDiff === 0) return 'This week';
  if (weekDiff === -1) return 'Last week';
  if (weekDiff === 1) return 'Next week';

  const { from, to } = sheetPeriodBounds('week', sheetDate);
  return formatCompactWeekRangeLabel(from, to, 'if-not-current');
}

/** Snapshot panel header — always includes year. */
export function formatCompactWeekSnapshotHeader(sheetDate: string): string {
  const { from, to } = sheetPeriodBounds('week', sheetDate);
  return formatCompactWeekRangeLabel(from, to, 'always');
}

/** Snapshot panel header from a week start ISO (Sunday). */
export function formatCompactWeekSnapshotHeaderFromWeekStart(weekStartIso: string): string {
  const from = parseISO(weekStartIso);
  const to = endOfWeek(from, { weekStartsOn: SHEET_WEEK_STARTS_ON });
  return formatCompactWeekRangeLabel(from, to, 'always');
}

function enumerateDatesInBounds(from: Date, to: Date): string[] {
  const dates: string[] = [];
  let cursor = startOfDay(from);
  const end = startOfDay(to);
  while (cursor.getTime() <= end.getTime()) {
    dates.push(format(cursor, 'yyyy-MM-dd'));
    cursor = addDays(cursor, 1);
  }
  return dates;
}

function buildDayGroup(
  date: string,
  rowsByDate: Map<string, WorkOrderSheetRow[]>,
  schedules: WorkOrderSchedule[],
  selectedDate: string,
): SheetDateGroup {
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
}

function buildDaysInBounds(
  rows: WorkOrderSheetRow[],
  from: Date,
  to: Date,
  schedules: WorkOrderSchedule[],
  selectedDate: string,
  options: { includeAllDays: boolean },
): SheetDateGroup[] {
  const grouped = groupRowsByDate(rows);
  const rowsByDate = new Map<string, WorkOrderSheetRow[]>();
  for (const group of grouped) {
    if (isDateInPeriod(group.date, from, to)) {
      rowsByDate.set(group.date, group.rows);
    }
  }

  for (const schedule of schedules) {
    if (isDateInPeriod(schedule.scheduled_date, from, to)) {
      rowsByDate.set(schedule.scheduled_date, rowsByDate.get(schedule.scheduled_date) ?? []);
    }
  }

  const dates = options.includeAllDays
    ? enumerateDatesInBounds(from, to)
    : Array.from(rowsByDate.keys()).sort(
        (a, b) => parseISO(b).getTime() - parseISO(a).getTime(),
      );

  if (options.includeAllDays) {
    return dates.map((date) => buildDayGroup(date, rowsByDate, schedules, selectedDate));
  }

  return dates.map((date) => buildDayGroup(date, rowsByDate, schedules, selectedDate));
}

export interface SheetWeekSection {
  weekStart: string;
  weekEnd: string;
  label: string;
  isAnchor: boolean;
  position: 'prev' | 'anchor' | 'next';
  hasOrders: boolean;
  orderCount: number;
  days: SheetDateGroup[];
}

export function buildSheetWeekSections(
  rows: WorkOrderSheetRow[],
  sheetDate: string,
  schedules: WorkOrderSchedule[] = [],
): SheetWeekSection[] {
  const pickerSections = buildSheetWeekPickerSections(rows, sheetDate, schedules);
  const prevSection = getWeekSectionByPosition(pickerSections, 'prev')!;
  const anchorSection = getWeekSectionByPosition(pickerSections, 'anchor')!;
  const nextSection = getWeekSectionByPosition(pickerSections, 'next')!;

  const sections: SheetWeekSection[] = [];
  if (nextSection.hasOrders) sections.push(nextSection);
  sections.push(anchorSection);
  if (prevSection.hasOrders) sections.push(prevSection);
  return sections;
}

export function buildSheetWeekPickerSections(
  rows: WorkOrderSheetRow[],
  sheetDate: string,
  schedules: WorkOrderSchedule[] = [],
): SheetWeekSection[] {
  const selectedDate = normalizeSheetDateIso(sheetDate);
  const { anchor, prev, next } = sheetAdjacentWeekBounds(selectedDate);

  const buildSection = (
    bounds: SheetWeekBounds,
    isAnchor: boolean,
    position: SheetWeekSection['position'],
  ): SheetWeekSection => {
    const days = buildDaysInBounds(rows, bounds.from, bounds.to, schedules, selectedDate, {
      includeAllDays: isAnchor,
    });
    const orderCount = days.reduce((sum, day) => sum + day.entryCount, 0);
    return {
      weekStart: format(bounds.from, 'yyyy-MM-dd'),
      weekEnd: format(bounds.to, 'yyyy-MM-dd'),
      label: formatWeekLabel(bounds.from, bounds.to),
      isAnchor,
      position,
      hasOrders: orderCount > 0,
      orderCount,
      days,
    };
  };

  return [
    buildSection(prev, false, 'prev'),
    buildSection(anchor, true, 'anchor'),
    buildSection(next, false, 'next'),
  ];
}

export function flattenWeekSectionRows(section: SheetWeekSection): WorkOrderSheetRow[] {
  return busyDaysInSection(section).flatMap((day) => day.rows);
}

export function getWeekSectionByPosition(
  sections: SheetWeekSection[],
  position: SheetWeekSection['position'],
): SheetWeekSection | undefined {
  return sections.find((section) => section.position === position);
}

export function busyDaysInSection(section: SheetWeekSection): SheetDateGroup[] {
  return section.days.filter((day) => day.entryCount > 0);
}

export function firstBusyDayInSection(section: SheetWeekSection): string | null {
  return busyDaysInSection(section)[0]?.date ?? null;
}

export interface WeekDayCell {
  date: string;
  dayLabel: string;
  rows: WorkOrderSheetRow[];
  entryCount: number;
  isToday: boolean;
  isSelected: boolean;
  isEmpty: boolean;
}

export interface WeekSnapshotOrderLine {
  workOrderId: number;
  workOrderNumber: string;
  machineName: string;
  works: string;
}

/** Unique work orders per day within a week (for popover snapshot detail). */
export function buildWeekSnapshotOrdersByDate(
  rows: WorkOrderSheetRow[],
  weekStartIso: string,
): Record<string, WeekSnapshotOrderLine[]> {
  const weekStart = startOfDay(parseISO(weekStartIso));
  const weekDates = Array.from({ length: 7 }, (_, index) =>
    format(addDays(weekStart, index), 'yyyy-MM-dd'),
  );
  const weekDateSet = new Set(weekDates);
  const byDate = new Map<string, Map<number, WeekSnapshotOrderLine>>();

  for (const row of rows) {
    if (!weekDateSet.has(row.date)) continue;
    const byOrder = byDate.get(row.date) ?? new Map<number, WeekSnapshotOrderLine>();
    if (!byDate.has(row.date)) byDate.set(row.date, byOrder);
    if (byOrder.has(row.workOrderId)) continue;
    byOrder.set(row.workOrderId, {
      workOrderId: row.workOrderId,
      workOrderNumber: row.workOrderNumber,
      machineName: row.machineName,
      works: row.works,
    });
  }

  const result: Record<string, WeekSnapshotOrderLine[]> = {};
  for (const date of weekDates) {
    const orders = byDate.get(date);
    if (orders && orders.size > 0) {
      result[date] = Array.from(orders.values());
    }
  }
  return result;
}

/** All 7 days in a week section (Sun → Sat), including empty days. */
export function groupWeekByDay(section: SheetWeekSection, selectedDate: string): WeekDayCell[] {
  const today = format(new Date(), 'yyyy-MM-dd');
  const selected = normalizeSheetDateIso(selectedDate);
  return section.days
    .slice()
    .sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime())
    .map((day) => ({
      date: day.date,
      dayLabel: format(parseISO(day.date), 'EEE dd.MM'),
      rows: day.rows,
      entryCount: day.entryCount,
      isToday: day.date === today,
      isSelected: day.date === selected,
      isEmpty: day.entryCount === 0,
    }));
}

/** Build 7-day week cells from daily-count map (popover snapshot / hover preview). */
export function buildWeekDaysFromDailyCounts(
  counts: Record<string, number>,
  weekStartIso: string,
  selectedDate: string,
): WeekDayCell[] {
  const today = format(new Date(), 'yyyy-MM-dd');
  const selected = normalizeSheetDateIso(selectedDate);
  const weekStart = startOfDay(parseISO(weekStartIso));

  return Array.from({ length: 7 }, (_, index) => {
    const date = format(addDays(weekStart, index), 'yyyy-MM-dd');
    const entryCount = counts[date] ?? 0;
    return {
      date,
      dayLabel: format(parseISO(date), 'EEE dd.MM'),
      rows: [],
      entryCount,
      isToday: date === today,
      isSelected: date === selected,
      isEmpty: entryCount === 0,
    };
  });
}

export function sheetDateGroupsToWeekDayCells(groups: SheetDateGroup[]): WeekDayCell[] {
  const today = format(new Date(), 'yyyy-MM-dd');
  return groups.map((group) => ({
    date: group.date,
    dayLabel: format(parseISO(group.date), 'EEE dd.MM'),
    rows: group.rows,
    entryCount: group.entryCount,
    isToday: group.date === today,
    isSelected: group.isSelected,
    isEmpty: group.isEmpty,
  }));
}

export function buildSheetDateGroups(
  rows: WorkOrderSheetRow[],
  dateScope: SheetDateScope,
  sheetDate: string,
  schedules: WorkOrderSchedule[] = [],
): SheetDateGroup[] {
  const selectedDate = normalizeSheetDateIso(sheetDate);
  const { from, to } = sheetPeriodBounds(dateScope, selectedDate);
  const includeAllDays = dateScope === 'week';
  const days = buildDaysInBounds(rows, from, to, schedules, selectedDate, { includeAllDays });

  if (!days.some((day) => day.date === selectedDate)) {
    days.push(buildDayGroup(selectedDate, new Map(), schedules, selectedDate));
    days.sort((a, b) =>
      dateScope === 'week'
        ? parseISO(a.date).getTime() - parseISO(b.date).getTime()
        : parseISO(b.date).getTime() - parseISO(a.date).getTime(),
    );
  }

  return days;
}

export function buildSheetPeriodLabel(dateScope: SheetDateScope, sheetDate: string): string | null {
  const base = parseISO(sheetDate);
  if (dateScope === 'month') {
    return format(base, 'MMMM yyyy');
  }
  if (dateScope === 'week') {
    const { from, to } = sheetPeriodBounds(dateScope, sheetDate);
    return formatWeekLabel(from, to);
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
