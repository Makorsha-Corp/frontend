import { useCallback, useEffect, useState } from 'react';
import type { TransferOrder } from '@/types/transferOrder';
import type { TransferOrderItem } from '@/types/transferOrder';
import type { TransferApprovalSummary } from './transferOrderApprovals';
import { readTransferApprovalSummary } from './transferOrderApprovals';
import {
  readTransferOrderSectionConfirms,
  type TrSectionConfirmState,
} from './transferOrderSectionConfirms';

export const TR_STAGE_NAMES = ['Draft', 'Planned', 'Completed'] as const;
export type TrStageName = (typeof TR_STAGE_NAMES)[number];

export type TrScrollSection = 'route' | 'items' | 'approvals';

export type TrChecklistPhase = 'prepare' | 'execute' | 'mark_complete' | 'done';

const LOCAL_COMPLETE_PREFIX = 'tr-complete-v1';

function localCompleteKey(transferOrderId: number): string {
  return `${LOCAL_COMPLETE_PREFIX}-${transferOrderId}`;
}

export function readTransferOrderLocallyComplete(transferOrderId: number): boolean {
  try {
    return localStorage.getItem(localCompleteKey(transferOrderId)) === '1';
  } catch {
    return false;
  }
}

export function writeTransferOrderLocallyComplete(transferOrderId: number, value: boolean): void {
  try {
    if (value) {
      localStorage.setItem(localCompleteKey(transferOrderId), '1');
    } else {
      localStorage.removeItem(localCompleteKey(transferOrderId));
    }
  } catch {
    /* ignore */
  }
}

export function useTransferOrderLocalComplete(transferOrderId: number) {
  const [locallyComplete, setLocallyComplete] = useState(() =>
    readTransferOrderLocallyComplete(transferOrderId)
  );

  useEffect(() => {
    setLocallyComplete(readTransferOrderLocallyComplete(transferOrderId));
  }, [transferOrderId]);

  const markComplete = useCallback(() => {
    writeTransferOrderLocallyComplete(transferOrderId, true);
    setLocallyComplete(true);
  }, [transferOrderId]);

  return { locallyComplete, markComplete };
}

export function isTransferRouteDefined(order: TransferOrder): boolean {
  return (
    order.source_location_id > 0 &&
    order.destination_location_id > 0 &&
    Boolean(order.source_location_type) &&
    Boolean(order.destination_location_type)
  );
}

export function isTransferOrderCompleted(
  order: TransferOrder,
  locallyMarkedComplete?: boolean
): boolean {
  if (order.completed_at) return true;
  if (locallyMarkedComplete ?? readTransferOrderLocallyComplete(order.id)) return true;
  return false;
}

export function isTransferPrepareComplete(
  order: TransferOrder,
  _items: TransferOrderItem[],
  sectionConfirms?: TrSectionConfirmState
): boolean {
  const confirms = sectionConfirms ?? readTransferOrderSectionConfirms(order.id);
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
  locallyMarkedComplete?: boolean,
  sectionConfirms?: TrSectionConfirmState
): TrStageName {
  if (isTransferOrderCompleted(order, locallyMarkedComplete)) return 'Completed';
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

/** Derive stage for list/overview when only order is available (no items loaded). */
export function deriveTransferOrderStageFromOrder(order: TransferOrder): TrStageName {
  if (isTransferOrderCompleted(order)) return 'Completed';
  if (isTransferRouteDefined(order)) return 'Planned';
  return 'Draft';
}

/** Derive stage with items from RTK cache / query. */
export function deriveTransferOrderStageWithItems(
  order: TransferOrder,
  items: TransferOrderItem[]
): TrStageName {
  const approvalSummary = readTransferApprovalSummary(order.id);
  const locallyComplete = readTransferOrderLocallyComplete(order.id);
  const sectionConfirms = readTransferOrderSectionConfirms(order.id);
  return deriveTransferOrderStage(
    order,
    items,
    approvalSummary,
    locallyComplete,
    sectionConfirms
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
  locallyMarkedComplete?: boolean,
  sectionConfirms?: TrSectionConfirmState
): TrChecklistProgress {
  const confirms = sectionConfirms ?? readTransferOrderSectionConfirms(order.id);
  const routeDefined = isTransferRouteDefined(order);
  const hasItems = items.length > 0;
  const routeConfirmed = confirms.route_confirmed;
  const itemsConfirmed = confirms.items_confirmed;
  const prepareComplete = routeConfirmed && itemsConfirmed;
  const prepareDoneCount = (routeConfirmed ? 1 : 0) + (itemsConfirmed ? 1 : 0);
  const approvalsComplete = isTransferApprovalsComplete(approvalSummary);
  const { transferredCount, transfersComplete, totalCount } = getTransferTransferCounts(items);
  const orderCompleted = isTransferOrderCompleted(order, locallyMarkedComplete);
  const stage = deriveTransferOrderStage(
    order,
    items,
    approvalSummary,
    locallyMarkedComplete,
    confirms
  );
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
