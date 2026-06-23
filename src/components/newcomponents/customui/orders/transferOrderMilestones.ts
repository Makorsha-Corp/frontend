import type { TransferOrder } from '@/types/transferOrder';
import type { TransferOrderItem } from '@/types/transferOrder';
import type { TransferApprovalSummary } from '@/types/transferOrder';
import type { Status } from '@/types/status';

export type TrScrollSection = 'route' | 'items' | 'approvals';

export type TrChecklistPhase = 'approve' | 'complete' | 'done';

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

export function isTransferReadyForApproval(order: TransferOrder, items: TransferOrderItem[]): boolean {
  return isTransferRouteDefined(order) && items.length > 0;
}

export function isTransferApprovalsComplete(approvalSummary: TransferApprovalSummary): boolean {
  if (approvalSummary.required === 0) return true;
  return approvalSummary.met && approvalSummary.approved_count > 0;
}

export function getPendingTransferCount(items: TransferOrderItem[]): number {
  return items.filter((i) => !i.transferred_at).length;
}

export function isTransferPrepareComplete(order: TransferOrder, items: TransferOrderItem[]): boolean {
  return isTransferReadyForApproval(order, items);
}

export function deriveTransferOrderStage(
  order: TransferOrder,
  items: TransferOrderItem[]
): TrStageName {
  if (isTransferOrderCompleted(order)) return 'Completed';
  if (isTransferPrepareComplete(order, items)) return 'Planned';
  return 'Draft';
}

export function getTrChecklistPhase(
  approvalsComplete: boolean,
  orderCompleted: boolean
): TrChecklistPhase {
  if (orderCompleted) return 'done';
  if (!approvalsComplete) return 'approve';
  return 'complete';
}

export function deriveTransferOrderStageFromOrder(order: TransferOrder): TrStageName {
  if (isTransferOrderCompleted(order)) return 'Completed';
  if (isTransferRouteDefined(order)) return 'Planned';
  return 'Draft';
}

export function deriveTransferOrderStageWithItems(
  order: TransferOrder,
  items: TransferOrderItem[]
): TrStageName {
  return deriveTransferOrderStage(order, items);
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
  readyForApproval: boolean;
  approvalsComplete: boolean;
  approvalRatio: string;
  pendingTransferCount: number;
  orderCompleted: boolean;
}

export function getTrChecklistProgress(
  order: TransferOrder,
  items: TransferOrderItem[],
  approvalSummary: TransferApprovalSummary
): TrChecklistProgress {
  const routeDefined = isTransferRouteDefined(order);
  const hasItems = items.length > 0;
  const readyForApproval = isTransferReadyForApproval(order, items);
  const approvalsComplete = isTransferApprovalsComplete(approvalSummary);
  const orderCompleted = isTransferOrderCompleted(order);
  const stage = deriveTransferOrderStage(order, items);
  const phase = getTrChecklistPhase(approvalsComplete, orderCompleted);

  return {
    stage,
    phase,
    routeDefined,
    hasItems,
    readyForApproval,
    approvalsComplete,
    approvalRatio: `${approvalSummary.approved_count}/${approvalSummary.required}`,
    pendingTransferCount: getPendingTransferCount(items),
    orderCompleted,
  };
}
