import {
  format,
  isWithinInterval,
  startOfDay,
  endOfDay,
  parseISO,
  parse,
  isValid,
} from 'date-fns';
import type { PurchaseOrder } from '@/types/purchaseOrder';
import type { TransferOrder } from '@/types/transferOrder';
import type { ExpenseOrder } from '@/types/expenseOrder';
import type { SalesOrder } from '@/types/salesOrder';
import type { WorkOrder, WorkOrderStatus } from '@/types/workOrder';
import type { Machine } from '@/types/machine';
import type { FactorySection } from '@/types/factorySection';
import type { Project } from '@/types/project';

export type OverviewOrderKind = 'purchase' | 'transfer' | 'expense' | 'sales' | 'work';

/** Resolve PO / transfer legs that point at machines or projects to a factory_id. */
export interface OrderResolutionMaps {
  machineIdToFactoryId: Map<number, number>;
  projectIdToFactoryId: Map<number, number>;
}

export function buildMachineIdToFactoryId(
  machines: Machine[],
  sections: FactorySection[]
): Map<number, number> {
  const sectionToFactory = new Map(sections.map((s) => [s.id, s.factory_id]));
  const out = new Map<number, number>();
  for (const m of machines) {
    const fid = sectionToFactory.get(m.factory_section_id);
    if (fid != null) out.set(m.id, fid);
  }
  return out;
}

export function buildProjectIdToFactoryId(projects: Project[]): Map<number, number> {
  return new Map(projects.map((p) => [p.id, p.factory_id]));
}

export interface OverviewOrder {
  kind: OverviewOrderKind;
  id: number;
  ref: string;
  amount: number;
  /** System created timestamp — used for Recent activity sort */
  createdAt: Date;
  /**
   * Business calendar day for date-range filter, totals, and Orders over time.
   * Transfer → order_date, expense → expense_date, sales → order_date; else createdAt.
   */
  reportDate: Date;
  statusLabel: string;
  workStatus?: WorkOrderStatus;
  factoryId: number | null;
  /** For list row display */
  displayDate: string;
  dueOrExpectedDate: string | null;
}

const statusName = (statusById: Map<number, string>, id: number) => statusById.get(id) ?? `#${id}`;

function parseBusinessDay(ymd: string | null | undefined, fallback: Date): Date {
  if (!ymd?.trim()) return fallback;
  const slice = ymd.slice(0, 10);
  const d = parse(slice, 'yyyy-MM-dd', new Date());
  return isValid(d) ? startOfDay(d) : fallback;
}

export function factoryFromPurchase(po: PurchaseOrder, maps: OrderResolutionMaps): number | null {
  const { destination_type: dt, destination_id: id } = po;
  if (dt === 'storage') return id;
  if (dt === 'machine') return maps.machineIdToFactoryId.get(id) ?? null;
  if (dt === 'project') return maps.projectIdToFactoryId.get(id) ?? null;
  return null;
}

function factoryFromLocation(
  type: string,
  id: number,
  maps: OrderResolutionMaps
): number | null {
  if (type === 'storage' || type === 'damaged') return id;
  if (type === 'machine') return maps.machineIdToFactoryId.get(id) ?? null;
  if (type === 'project') return maps.projectIdToFactoryId.get(id) ?? null;
  return null;
}

export function factoryFromTransfer(t: TransferOrder, maps: OrderResolutionMaps): number | null {
  const dest = factoryFromLocation(t.destination_location_type, t.destination_location_id, maps);
  if (dest != null) return dest;
  return factoryFromLocation(t.source_location_type, t.source_location_id, maps);
}

export function normalizeOrders(
  purchase: PurchaseOrder[],
  transfer: TransferOrder[],
  expense: ExpenseOrder[],
  sales: SalesOrder[],
  work: WorkOrder[],
  statusById: Map<number, string>,
  maps: OrderResolutionMaps
): OverviewOrder[] {
  const out: OverviewOrder[] = [];

  for (const po of purchase) {
    const createdAt = parseISO(po.created_at);
    out.push({
      kind: 'purchase',
      id: po.id,
      ref: po.po_number,
      amount: Number(po.total_amount ?? 0),
      createdAt,
      reportDate: startOfDay(createdAt),
      statusLabel: statusName(statusById, po.current_status_id),
      factoryId: factoryFromPurchase(po, maps),
      displayDate: format(createdAt, 'yyyy-MM-dd'),
      dueOrExpectedDate: null,
    });
  }

  for (const t of transfer) {
    const createdAt = parseISO(t.created_at);
    out.push({
      kind: 'transfer',
      id: t.id,
      ref: t.transfer_number,
      amount: 0,
      createdAt,
      reportDate: parseBusinessDay(t.order_date, startOfDay(createdAt)),
      statusLabel: statusName(statusById, t.current_status_id),
      factoryId: factoryFromTransfer(t, maps),
      displayDate: t.order_date?.slice(0, 10) ?? format(createdAt, 'yyyy-MM-dd'),
      dueOrExpectedDate: null,
    });
  }

  for (const e of expense) {
    const createdAt = parseISO(e.created_at);
    out.push({
      kind: 'expense',
      id: e.id,
      ref: e.expense_number,
      amount: Number(e.total_amount ?? 0),
      createdAt,
      reportDate: parseBusinessDay(e.expense_date, startOfDay(createdAt)),
      statusLabel: statusName(statusById, e.current_status_id),
      factoryId: null,
      displayDate: e.expense_date?.slice(0, 10) ?? format(createdAt, 'yyyy-MM-dd'),
      dueOrExpectedDate: e.due_date,
    });
  }

  for (const s of sales) {
    const createdAt = parseISO(s.created_at);
    out.push({
      kind: 'sales',
      id: s.id,
      ref: s.sales_order_number,
      amount: Number(s.total_amount ?? 0),
      createdAt,
      reportDate: parseBusinessDay(s.order_date, startOfDay(createdAt)),
      statusLabel: statusName(statusById, s.current_status_id),
      factoryId: s.factory_id,
      displayDate: s.order_date?.slice(0, 10) ?? format(createdAt, 'yyyy-MM-dd'),
      dueOrExpectedDate: s.expected_delivery_date,
    });
  }

  for (const w of work) {
    if (w.is_deleted) continue;
    const createdAt = parseISO(w.created_at);
    out.push({
      kind: 'work',
      id: w.id,
      ref: w.work_order_number,
      amount: Number(w.cost ?? 0),
      createdAt,
      reportDate: w.start_date ? parseBusinessDay(w.start_date, startOfDay(createdAt)) : startOfDay(createdAt),
      statusLabel: w.status.replace(/_/g, ' '),
      workStatus: w.status,
      factoryId: w.factory_id,
      displayDate: w.created_at ? format(createdAt, 'yyyy-MM-dd') : '—',
      dueOrExpectedDate: w.end_date,
    });
  }

  return out;
}

export function isCompletedStatusLabel(label: string): boolean {
  const n = label.toLowerCase();
  return /\b(complete|completed|closed|paid|received|delivered|fulfilled|done|cancelled|canceled)\b/.test(n);
}

/**
 * WIP heuristic: work orders in PENDING_APPROVAL; other types use workflow status name
 * "Pending" or "Draft" only (not substring match).
 */
export function isPendingApprovalOrder(o: OverviewOrder): boolean {
  if (o.kind === 'work' && o.workStatus === 'PENDING_APPROVAL') return true;
  if (isCompletedStatusLabel(o.statusLabel)) return false;
  const n = o.statusLabel.trim().toLowerCase();
  return n === 'pending' || n === 'draft';
}

function isOverdueOrder(o: OverviewOrder, now: Date): boolean {
  if (isCompletedStatusLabel(o.statusLabel)) return false;
  const raw = o.dueOrExpectedDate;
  if (!raw) return false;
  try {
    const d = parseISO(raw.length > 10 ? raw : `${raw}T23:59:59`);
    return d < startOfDay(now);
  } catch {
    return false;
  }
}

export function inSelectedRange(o: OverviewOrder, from?: Date, to?: Date): boolean {
  if (!from || !to) return true;
  const interval = { start: startOfDay(from), end: endOfDay(to) };
  return isWithinInterval(o.reportDate, interval);
}

export function filterOverviewOrders(
  all: OverviewOrder[],
  opts: { from?: Date; to?: Date; factoryId: string; statusFilter: string }
): OverviewOrder[] {
  let rows = all.filter((o) => inSelectedRange(o, opts.from, opts.to));
  if (opts.factoryId !== 'all') {
    const fid = Number(opts.factoryId);
    rows = rows.filter((o) => o.factoryId === fid);
  }
  if (opts.statusFilter !== 'all') {
    rows = rows.filter((o) => o.statusLabel === opts.statusFilter);
  }
  return rows;
}

export interface CountsByTypeRow {
  type: string;
  count: number;
  value: number;
}

export function aggregateCountsByType(orders: OverviewOrder[]): CountsByTypeRow[] {
  const labels: Record<OverviewOrderKind, string> = {
    purchase: 'Purchase',
    transfer: 'Transfer',
    expense: 'Expense',
    sales: 'Sales',
    work: 'Work',
  };
  const kinds: OverviewOrderKind[] = ['purchase', 'transfer', 'expense', 'sales', 'work'];
  return kinds.map((kind) => {
    const subset = orders.filter((o) => o.kind === kind);
    const value = subset.reduce((s, o) => s + o.amount, 0);
    return { type: labels[kind], count: subset.length, value };
  });
}

export interface StatusSlice {
  status: string;
  count: number;
}

export function aggregateStatusBreakdown(orders: OverviewOrder[]): StatusSlice[] {
  const map = new Map<string, number>();
  for (const o of orders) {
    map.set(o.statusLabel, (map.get(o.statusLabel) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([status, count]) => ({ status, count }))
    .sort((a, b) => b.count - a.count);
}

export interface FactoryBreakdownRow {
  factoryId: number;
  factoryName: string;
  count: number;
  pendingValue: number;
}

export function aggregateFactoryBreakdown(
  orders: OverviewOrder[],
  factoryNames: Map<number, string>
): FactoryBreakdownRow[] {
  const byFactory = new Map<number, { count: number; pendingValue: number }>();
  for (const o of orders) {
    if (o.factoryId == null) continue;
    const cur = byFactory.get(o.factoryId) ?? { count: 0, pendingValue: 0 };
    cur.count += 1;
    if (!isCompletedStatusLabel(o.statusLabel)) cur.pendingValue += o.amount;
    byFactory.set(o.factoryId, cur);
  }
  return [...byFactory.entries()]
    .map(([factoryId, v]) => ({
      factoryId,
      factoryName: factoryNames.get(factoryId) ?? `Factory #${factoryId}`,
      count: v.count,
      pendingValue: v.pendingValue,
    }))
    .sort((a, b) => b.count - a.count);
}

export interface OrdersOverTimeRow {
  date: string;
  count: number;
}

export function bucketOrdersOverTime(orders: OverviewOrder[], from?: Date, to?: Date): OrdersOverTimeRow[] {
  if (!from || !to) return [];
  const map = new Map<string, number>();
  let d = startOfDay(from);
  const end = endOfDay(to);
  while (d <= end) {
    map.set(format(d, 'yyyy-MM-dd'), 0);
    d = new Date(d.getTime() + 86400000);
  }
  for (const o of orders) {
    const k = format(o.reportDate, 'yyyy-MM-dd');
    if (!map.has(k)) continue;
    map.set(k, (map.get(k) ?? 0) + 1);
  }
  return [...map.entries()].map(([iso, count]) => ({
    date: format(parseISO(iso), 'MMM d'),
    count,
  }));
}

export function summaryStats(orders: OverviewOrder[], now: Date) {
  let pendingApprovalsCount = 0;
  let overdueCount = 0;
  let pendingValue = 0;
  let completedValue = 0;
  for (const o of orders) {
    if (isPendingApprovalOrder(o)) pendingApprovalsCount += 1;
    if (isOverdueOrder(o, now)) overdueCount += 1;
    if (isCompletedStatusLabel(o.statusLabel)) completedValue += o.amount;
    else pendingValue += o.amount;
  }
  return { pendingApprovalsCount, overdueCount, pendingValue, completedValue };
}

export function recentOrders(orders: OverviewOrder[], limit = 20): OverviewOrder[] {
  return [...orders].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, limit);
}
