import type { TransferOrder } from '@/types/transferOrder';
import type { TransferOrderItem } from '@/types/transferOrder';
import type { TransferApprovalSummary } from '@/types/transferOrder';
import type { Status } from '@/types/status';

export type TrScrollSection = 'route' | 'items' | 'approvals';

export type TrChecklistPhase = 'prepare' | 'execute' | 'mark_complete' | 'done';

export const TR_STAGE_NAMES = ['Draft', 'Planned', 'Completed'] as const;
export type TrStageName = (typeof TR_STAGE_NAMES)[number];

/** TR orders considered in-flight on the overview hub deep link. */
export const TR_SCOPE_OPEN_STATUS_NAMES = ['Planned'] as const;

export function statusesForTrWorkflowFilter(statuses: Status[]): Status[] {
  const byName = new Map(statuses.map((s) => [s.name, s]));
  return TR_STAGE_NAMES.flatMap((name) => {
    const row = byName.get(name);
    return row ? [row] : [];
  });
}

export interface TrSectionConfirmState {
  route_confirmed: boolean;
  items_confirmed: boolean;
}

export function sectionConfirmsFromOrder(order: TransferOrder): TrSectionConfirmState {
  return {
    route_confirmed: order.route_confirmed,
    items_confirmed: order.items_confirmed,
  };
}

export function isTransferRouteDefined(order: TransferOrder): boolean {
  return (
    order.source_location_id > 0 &&
    order.destination_location_id > 0 &&
    Boolean(order.source_location_type) &&
    Boolean(order.destination_location_type)
  );
}

export function isTransferOrderCompleted(order: TransferOrder): boolean {
  return Boolean(order.completed_at) || order.order_completed;
}

export function isTransferPrepareComplete(
  order: TransferOrder,
  _items: TransferOrderItem[],
  sectionConfirms?: TrSectionConfirmState
): boolean {
  const confirms = sectionConfirms ?? sectionConfirmsFromOrder(order);
  return confirms.route_confirmed && confirms.items_confirmed;
}

export function isTransferApprovalsComplete(approvalSummary: TransferApprovalSummary): boolean {
  if (approvalSummary.required === 0) return true;
  return approvalSummary.met && approvalSummary.approved_count > 0;
}

export function getTransferTransferCounts(items: TransferOrderItem[]) {
  const transferredCount = items.filter((i) => i.transferred_at).length;
  const transfersComplete = items.length > 0 && transferredCount === items.length;
  return { transferredCount, transfersComplete, totalCount: items.length };
}

export function deriveTransferOrderStage(
  order: TransferOrder,
  items: TransferOrderItem[],
  _approvalSummary: TransferApprovalSummary,
  sectionConfirms?: TrSectionConfirmState
): TrStageName {
  if (isTransferOrderCompleted(order)) return 'Completed';
  if (isTransferPrepareComplete(order, items, sectionConfirms)) return 'Planned';
  return 'Draft';
}

export function getTrChecklistPhase(
  prepareComplete: boolean,
  approvalsComplete: boolean,
  transfersComplete: boolean,
  orderCompleted: boolean
): TrChecklistPhase {
  if (orderCompleted) return 'done';
  if (!prepareComplete) return 'prepare';
  if (!approvalsComplete || !transfersComplete) return 'execute';
  return 'mark_complete';
}

export function deriveTransferOrderStageFromOrder(order: TransferOrder): TrStageName {
  if (isTransferOrderCompleted(order)) return 'Completed';
  if (order.route_confirmed && order.items_confirmed) return 'Planned';
  if (isTransferRouteDefined(order)) return 'Planned';
  return 'Draft';
}

export function deriveTransferOrderStageWithItems(
  order: TransferOrder,
  items: TransferOrderItem[]
): TrStageName {
  return deriveTransferOrderStage(
    order,
    items,
    { approved_count: 0, required: 0, met: true },
    sectionConfirmsFromOrder(order)
  );
}

export function trStageBadgeClassName(stageName: TrStageName | string | null | undefined): string {
  switch (stageName) {
    case 'Draft':
      return 'border-transparent bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200';
    case 'Planned':
      return 'border-transparent bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300';
    case 'Completed':
      return 'border-transparent bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300';
    default:
      return 'border-transparent bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-50';
  }
}

export interface TrChecklistProgress {
  stage: TrStageName;
  phase: TrChecklistPhase;
  routeDefined: boolean;
  hasItems: boolean;
  routeConfirmed: boolean;
  itemsConfirmed: boolean;
  prepareComplete: boolean;
  prepareRatio: string;
  approvalsComplete: boolean;
  approvalRatio: string;
  transfersComplete: boolean;
  transferRatio: string;
  orderCompleted: boolean;
}

export function getTrChecklistProgress(
  order: TransferOrder,
  items: TransferOrderItem[],
  approvalSummary: TransferApprovalSummary,
  sectionConfirms?: TrSectionConfirmState
): TrChecklistProgress {
  const confirms = sectionConfirms ?? sectionConfirmsFromOrder(order);
  const routeDefined = isTransferRouteDefined(order);
  const hasItems = items.length > 0;
  const routeConfirmed = confirms.route_confirmed;
  const itemsConfirmed = confirms.items_confirmed;
  const prepareComplete = routeConfirmed && itemsConfirmed;
  const prepareDoneCount = (routeConfirmed ? 1 : 0) + (itemsConfirmed ? 1 : 0);
  const approvalsComplete = isTransferApprovalsComplete(approvalSummary);
  const { transferredCount, transfersComplete, totalCount } = getTransferTransferCounts(items);
  const orderCompleted = isTransferOrderCompleted(order);
  const stage = deriveTransferOrderStage(order, items, approvalSummary, confirms);
  const phase = getTrChecklistPhase(
    prepareComplete,
    approvalsComplete,
    transfersComplete,
    orderCompleted
  );

  return {
    stage,
    phase,
    routeDefined,
    hasItems,
    routeConfirmed,
    itemsConfirmed,
    prepareComplete,
    prepareRatio: `${prepareDoneCount}/2`,
    approvalsComplete,
    approvalRatio: `${approvalSummary.approved_count}/${approvalSummary.required}`,
    transfersComplete,
    transferRatio: totalCount > 0 ? `${transferredCount}/${totalCount}` : '0/0',
    orderCompleted,
  };
}
