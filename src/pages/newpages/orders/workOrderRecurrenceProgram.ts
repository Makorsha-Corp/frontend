import { format, isAfter, parseISO, startOfDay } from 'date-fns';

import type { WorkOrder, WorkOrderStatus } from '@/types/workOrder';
import type { WorkOrderTemplate } from '@/types/workOrderTemplate';
import { formatRecurrenceCadence, formatRecurrenceRange } from '@/pages/newpages/orders/workOrderTemplateLabels';

export const RECURRENCE_PROGRAM_POPOVER_MAX_DATES = 5;

export interface RecurrenceProgramDraft {
  workOrderId: number;
  workOrderNumber: string;
  plannedDate: string;
  isCurrentRow?: boolean;
  isFuture: boolean;
}

export interface RecurrenceProgramOccurrence {
  workOrderId: number;
  workOrderNumber: string;
  plannedDate: string;
  status: WorkOrderStatus;
  /** yyyy-MM-dd — completed_at when done, else null */
  completedDate: string | null;
  displayDate: string;
  isCurrentRow?: boolean;
  isFuture: boolean;
}

export interface RecurrenceProgramSummary {
  templateId: number;
  templateName: string;
  cadence: string;
  machineId: number;
  completedOccurrences: RecurrenceProgramOccurrence[];
  inProgressOccurrences: RecurrenceProgramOccurrence[];
  allDrafts: RecurrenceProgramDraft[];
  futureDrafts: RecurrenceProgramDraft[];
  futureDraftCount: number;
}

function plannedDateIso(order: Pick<WorkOrder, 'planned_date'>): string | null {
  const raw = order.planned_date?.trim();
  return raw ? raw.slice(0, 10) : null;
}

function completedDateIso(order: Pick<WorkOrder, 'completed_at'>): string | null {
  const raw = order.completed_at?.trim();
  return raw ? raw.slice(0, 10) : null;
}

function occurrenceDisplayDate(status: WorkOrderStatus, plannedDate: string, completedDate: string | null): string {
  if (status === 'COMPLETED' && completedDate) return completedDate;
  return plannedDate;
}

function isFuturePlannedDate(plannedDate: string, referenceDate: Date): boolean {
  try {
    return isAfter(startOfDay(parseISO(plannedDate)), referenceDate);
  } catch {
    return false;
  }
}

export function buildRecurrenceProgramSummary(params: {
  currentOrder: Pick<
    WorkOrder,
    'id' | 'work_order_template_id' | 'machine_id' | 'status' | 'planned_date' | 'work_order_number' | 'is_deleted' | 'completed_at'
  >;
  allOrders: Array<
    Pick<
      WorkOrder,
      'id' | 'work_order_template_id' | 'machine_id' | 'status' | 'planned_date' | 'work_order_number' | 'is_deleted' | 'completed_at'
    >
  >;
  templateById: Map<number, WorkOrderTemplate>;
  referenceDate?: Date;
}): RecurrenceProgramSummary | null {
  const { currentOrder, allOrders, templateById, referenceDate = startOfDay(new Date()) } = params;
  const templateId = currentOrder.work_order_template_id;
  const machineId = currentOrder.machine_id;
  if (templateId == null || machineId == null) return null;

  const template = templateById.get(templateId);
  if (!template?.is_recurring) return null;

  const cadence = formatRecurrenceCadence(template) ?? 'Recurring';
  const templateName = template.template_name?.trim() || `Template #${templateId}`;

  const allDrafts = allOrders
    .filter(
      (order) =>
        !order.is_deleted &&
        order.status === 'DRAFT' &&
        order.work_order_template_id === templateId &&
        order.machine_id === machineId,
    )
    .map((order) => {
      const plannedDate = plannedDateIso(order);
      if (!plannedDate) return null;
      return {
        workOrderId: order.id,
        workOrderNumber: order.work_order_number,
        plannedDate,
        isCurrentRow: order.id === currentOrder.id,
        isFuture: isFuturePlannedDate(plannedDate, referenceDate),
      };
    })
    .filter((draft): draft is RecurrenceProgramDraft => draft != null)
    .sort((a, b) => a.plannedDate.localeCompare(b.plannedDate));

  const futureDrafts = allDrafts.filter((draft) => draft.isFuture);

  const siblingOrders = allOrders.filter(
    (order) =>
      !order.is_deleted &&
      order.work_order_template_id === templateId &&
      order.machine_id === machineId &&
      (order.status === 'COMPLETED' || order.status === 'IN_PROGRESS'),
  );

  const toOccurrence = (order: (typeof siblingOrders)[number]): RecurrenceProgramOccurrence | null => {
    const plannedDate = plannedDateIso(order);
    if (!plannedDate) return null;
    const completedDate = completedDateIso(order);
    const displayDate = occurrenceDisplayDate(order.status, plannedDate, completedDate);
    return {
      workOrderId: order.id,
      workOrderNumber: order.work_order_number,
      plannedDate,
      status: order.status,
      completedDate,
      displayDate,
      isCurrentRow: order.id === currentOrder.id,
      isFuture: isFuturePlannedDate(displayDate, referenceDate),
    };
  };

  const completedOccurrences = siblingOrders
    .filter((order) => order.status === 'COMPLETED')
    .map(toOccurrence)
    .filter((entry): entry is RecurrenceProgramOccurrence => entry != null)
    .sort((a, b) => a.displayDate.localeCompare(b.displayDate));

  const inProgressOccurrences = siblingOrders
    .filter((order) => order.status === 'IN_PROGRESS')
    .map(toOccurrence)
    .filter((entry): entry is RecurrenceProgramOccurrence => entry != null)
    .sort((a, b) => a.displayDate.localeCompare(b.displayDate));

  return {
    templateId,
    templateName,
    cadence,
    machineId,
    completedOccurrences,
    inProgressOccurrences,
    allDrafts,
    futureDrafts,
    futureDraftCount: futureDrafts.length,
  };
}

export function formatRecurrenceProgramDateLabel(isoDate: string): string {
  try {
    return format(parseISO(isoDate), 'MMM d, yyyy');
  } catch {
    return isoDate;
  }
}

export function buildBulkDeleteRecurrenceConfirmMessage(params: {
  futureDraftCount: number;
  templateName: string;
  machineName: string;
}): string {
  const { futureDraftCount, templateName, machineName } = params;
  const noun = futureDraftCount === 1 ? 'draft work order' : 'draft work orders';
  return `Delete ${futureDraftCount} ${noun} scheduled after today for "${templateName}" on ${machineName}? Past and in-progress work orders are not affected.`;
}

type RecurrenceProgramOrder = Pick<
  WorkOrder,
  | 'id'
  | 'work_order_template_id'
  | 'machine_id'
  | 'status'
  | 'planned_date'
  | 'work_order_number'
  | 'is_deleted'
  | 'completed_at'
>;

export type { RecurrenceProgramOrder };

export interface RecurringProgramListItem {
  templateId: number;
  machineId: number;
  templateName: string;
  machineName: string;
  cadence: string;
  recurrenceRange: string | null;
  template: WorkOrderTemplate;
  summary: RecurrenceProgramSummary;
}

function programGroupKey(templateId: number, machineId: number): string {
  return `${templateId}:${machineId}`;
}

function isProgramOrderEligible(
  order: RecurrenceProgramOrder,
  machineIdsInScope?: Set<number>,
): boolean {
  if (order.is_deleted || order.status === 'VOIDED') return false;
  if (order.work_order_template_id == null || order.machine_id == null) return false;
  if (machineIdsInScope && !machineIdsInScope.has(order.machine_id)) return false;
  return true;
}

/** Flat list of recurring programs (template + machine) for the manager tab. */
export function buildRecurringProgramList(params: {
  orders: RecurrenceProgramOrder[];
  templates: WorkOrderTemplate[];
  machineNameById: Map<number, string>;
  machineIdsInScope?: Set<number>;
  referenceDate?: Date;
}): RecurringProgramListItem[] {
  const { orders, templates, machineNameById, machineIdsInScope, referenceDate } = params;
  const recurringTemplates = templates.filter((t) => t.is_recurring);
  const templateById = new Map(recurringTemplates.map((t) => [t.id, t]));

  const scopedOrders = orders.filter((order) => isProgramOrderEligible(order, machineIdsInScope));
  const groupKeys = new Set<string>();

  for (const order of scopedOrders) {
    const templateId = order.work_order_template_id!;
    const machineId = order.machine_id!;
    if (!templateById.has(templateId)) continue;
    groupKeys.add(programGroupKey(templateId, machineId));
  }

  const items: RecurringProgramListItem[] = [];

  for (const key of groupKeys) {
    const [templateIdStr, machineIdStr] = key.split(':');
    const templateId = Number(templateIdStr);
    const machineId = Number(machineIdStr);
    const template = templateById.get(templateId);
    if (!template) continue;

    const groupOrders = scopedOrders.filter(
      (o) => o.work_order_template_id === templateId && o.machine_id === machineId,
    );
    const anchor = groupOrders[0];
    if (!anchor) continue;

    const summary = buildRecurrenceProgramSummary({
      currentOrder: anchor,
      allOrders: scopedOrders,
      templateById,
      referenceDate,
    });
    if (!summary) continue;

    items.push({
      templateId,
      machineId,
      templateName: template.template_name,
      machineName: machineNameById.get(machineId) ?? `Machine #${machineId}`,
      cadence: formatRecurrenceCadence(template) ?? 'Recurring',
      recurrenceRange: formatRecurrenceRange(template),
      template,
      summary,
    });
  }

  return items.sort((a, b) => {
    const byMachine = a.machineName.localeCompare(b.machineName);
    if (byMachine !== 0) return byMachine;
    return a.templateName.localeCompare(b.templateName);
  });
}

function withCurrentRowHighlight(
  summary: RecurrenceProgramSummary,
  workOrderId: number,
): RecurrenceProgramSummary {
  const mark = <T extends { workOrderId: number; isCurrentRow?: boolean }>(entry: T): T => ({
    ...entry,
    isCurrentRow: entry.workOrderId === workOrderId,
  });
  return {
    ...summary,
    completedOccurrences: summary.completedOccurrences.map(mark),
    inProgressOccurrences: summary.inProgressOccurrences.map(mark),
    allDrafts: summary.allDrafts.map(mark),
    futureDrafts: summary.futureDrafts.map(mark),
  };
}

/** One summary per recurring-template row; siblings share group data with per-row highlight. */
export function buildProgramSummariesByWorkOrderId(params: {
  allOrders: RecurrenceProgramOrder[];
  templateById: Map<number, WorkOrderTemplate>;
  referenceDate?: Date;
}): Map<number, RecurrenceProgramSummary> {
  const { allOrders, templateById, referenceDate } = params;
  const map = new Map<number, RecurrenceProgramSummary>();
  const groupCache = new Map<string, RecurrenceProgramSummary>();

  for (const order of allOrders) {
    if (order.is_deleted) continue;
    const templateId = order.work_order_template_id;
    const machineId = order.machine_id;
    if (templateId == null || machineId == null) continue;
    const template = templateById.get(templateId);
    if (!template?.is_recurring) continue;

    const groupKey = `${templateId}:${machineId}`;
    let baseSummary = groupCache.get(groupKey);
    if (!baseSummary) {
      const built = buildRecurrenceProgramSummary({
        currentOrder: order,
        allOrders,
        templateById,
        referenceDate,
      });
      if (!built) continue;
      baseSummary = built;
      groupCache.set(groupKey, built);
    }

    map.set(order.id, withCurrentRowHighlight(baseSummary, order.id));
  }

  return map;
}
