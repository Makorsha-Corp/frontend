import { endOfDay, isWithinInterval, parseISO, startOfDay } from 'date-fns';
import type { TransferOrder } from '@/types/transferOrder';
import {
  factoryFromTransfer,
  type OrderResolutionMaps,
} from './ordersOverviewData';
import { isTransferOrderCompleted } from '@/components/newcomponents/customui/orders/transferOrderMilestones';
import {
  transferLocationLabel,
  transferRouteLabel,
  transferRouteTypeLabel,
  type TransferLocationLabelContext,
  type TransferLocationTypeFilter,
} from './transferOrderLocationLabels';

export type { TransferLocationTypeFilter };

export interface TransferOrderFilters {
  from?: Date;
  to?: Date;
  statusIds: string[];
  factoryId: string;
  sourceType: TransferLocationTypeFilter;
  destinationType: TransferLocationTypeFilter;
  searchQuery: string;
  showCompleteOrders: boolean;
}

export function isTransferOrderComplete(order: TransferOrder): boolean {
  return isTransferOrderCompleted(order);
}

export interface TransferOrderSummaryStats {
  totalCount: number;
  openCount: number;
  completedCount: number;
  machineInvolvedCount: number;
}

export function filterTransferOrders(
  orders: TransferOrder[],
  filters: TransferOrderFilters,
  resolutionMaps: OrderResolutionMaps,
  labelCtx: TransferLocationLabelContext
): TransferOrder[] {
  let rows = [...orders];

  if (filters.from && filters.to) {
    const interval = { start: startOfDay(filters.from), end: endOfDay(filters.to) };
    rows = rows.filter((o) => {
      const orderDate = parseISO(o.created_at);
      return isWithinInterval(orderDate, interval);
    });
  }

  if (filters.statusIds.length > 0) {
    const ids = new Set(filters.statusIds.map((id) => Number(id)));
    rows = rows.filter((o) => ids.has(o.current_status_id));
  }

  if (filters.factoryId !== 'all') {
    const fid = Number(filters.factoryId);
    rows = rows.filter((o) => factoryFromTransfer(o, resolutionMaps) === fid);
  }

  if (filters.sourceType !== 'all') {
    rows = rows.filter((o) => o.source_location_type === filters.sourceType);
  }

  if (filters.destinationType !== 'all') {
    rows = rows.filter((o) => o.destination_location_type === filters.destinationType);
  }

  if (!filters.showCompleteOrders) {
    rows = rows.filter((o) => !isTransferOrderComplete(o));
  }

  const q = filters.searchQuery.trim().toLowerCase();
  if (q) {
    rows = rows.filter((o) => {
      const route = transferRouteLabel(o, labelCtx).toLowerCase();
      const types = transferRouteTypeLabel(o).toLowerCase();
      return (
        o.transfer_number?.toLowerCase().includes(q) ||
        route.includes(q) ||
        types.includes(q) ||
        o.source_location_type.toLowerCase().includes(q) ||
        o.destination_location_type.toLowerCase().includes(q) ||
        transferLocationLabel(o.source_location_type, o.source_location_id, labelCtx)
          .toLowerCase()
          .includes(q) ||
        transferLocationLabel(
          o.destination_location_type,
          o.destination_location_id,
          labelCtx
        )
          .toLowerCase()
          .includes(q)
      );
    });
  }

  return rows;
}

export function transferOrderSummaryStats(
  orders: TransferOrder[]
): TransferOrderSummaryStats {
  let openCount = 0;
  let completedCount = 0;
  let machineInvolvedCount = 0;

  for (const o of orders) {
    if (isTransferOrderComplete(o)) {
      completedCount += 1;
    } else {
      openCount += 1;
    }

    if (o.source_location_type === 'machine' || o.destination_location_type === 'machine') {
      machineInvolvedCount += 1;
    }
  }

  return {
    totalCount: orders.length,
    openCount,
    completedCount,
    machineInvolvedCount,
  };
}
