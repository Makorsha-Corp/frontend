import { endOfDay, isWithinInterval, parseISO, startOfDay } from 'date-fns';
import type { Account } from '@/types/account';
import type { PurchaseOrder } from '@/types/purchaseOrder';
import {
  factoryFromPurchase,
  isCompletedStatusLabel,
  type OrderResolutionMaps,
} from './ordersOverviewData';

export type InvoiceFilter = 'all' | 'invoiced' | 'not_invoiced';
export type DestinationTypeFilter = 'all' | 'storage' | 'machine' | 'project';

export interface PurchaseOrderFilters {
  from?: Date;
  to?: Date;
  statusId: string;
  accountId: string;
  factoryId: string;
  destinationType: DestinationTypeFilter;
  invoice: InvoiceFilter;
  searchQuery: string;
}

export interface PurchaseOrderSummaryStats {
  totalCount: number;
  totalValue: number;
  openCount: number;
  openValue: number;
  notInvoicedCount: number;
}

export function filterPurchaseOrders(
  orders: PurchaseOrder[],
  filters: PurchaseOrderFilters,
  accounts: Account[],
  resolutionMaps: OrderResolutionMaps
): PurchaseOrder[] {
  let rows = [...orders];

  if (filters.from && filters.to) {
    const interval = { start: startOfDay(filters.from), end: endOfDay(filters.to) };
    rows = rows.filter((o) => {
      const created = parseISO(o.created_at);
      return isWithinInterval(created, interval);
    });
  }

  if (filters.statusId !== 'all') {
    const sid = Number(filters.statusId);
    rows = rows.filter((o) => o.current_status_id === sid);
  }

  if (filters.accountId !== 'all') {
    const aid = Number(filters.accountId);
    rows = rows.filter((o) => o.account_id === aid);
  }

  if (filters.factoryId !== 'all') {
    const fid = Number(filters.factoryId);
    rows = rows.filter((o) => factoryFromPurchase(o, resolutionMaps) === fid);
  }

  if (filters.destinationType !== 'all') {
    rows = rows.filter((o) => o.destination_type === filters.destinationType);
  }

  if (filters.invoice === 'invoiced') {
    rows = rows.filter((o) => o.invoice_id != null);
  } else if (filters.invoice === 'not_invoiced') {
    rows = rows.filter((o) => o.invoice_id == null);
  }

  const q = filters.searchQuery.trim().toLowerCase();
  if (q) {
    rows = rows.filter((o) => {
      const supplier = accounts.find((a) => a.id === o.account_id)?.name ?? '';
      return o.po_number?.toLowerCase().includes(q) || supplier.toLowerCase().includes(q);
    });
  }

  return rows;
}

export function purchaseOrderSummaryStats(
  orders: PurchaseOrder[],
  statusById: Map<number, string>
): PurchaseOrderSummaryStats {
  let totalValue = 0;
  let openCount = 0;
  let openValue = 0;
  let notInvoicedCount = 0;

  for (const o of orders) {
    const amount = Number(o.total_amount ?? 0);
    totalValue += amount;

    const label = statusById.get(o.current_status_id) ?? '';
    if (!isCompletedStatusLabel(label)) {
      openCount += 1;
      openValue += amount;
    }

    if (o.invoice_id == null) {
      notInvoicedCount += 1;
    }
  }

  return {
    totalCount: orders.length,
    totalValue,
    openCount,
    openValue,
    notInvoicedCount,
  };
}
