import type { PurchaseOrder, PurchaseOrderItem } from '@/types/purchaseOrder';

export type PoMilestoneId = 'details' | 'items' | 'invoice' | 'received';

export type PoMilestoneState = 'pending' | 'partial' | 'complete';

export interface PoMilestoneConfig {
  id: PoMilestoneId;
  label: string;
  shortLabel: string;
}

export const PO_MILESTONES: PoMilestoneConfig[] = [
  { id: 'details', label: 'Details', shortLabel: 'Details' },
  { id: 'items', label: 'Items', shortLabel: 'Items' },
  { id: 'invoice', label: 'Invoice', shortLabel: 'Invoice' },
  { id: 'received', label: 'Received', shortLabel: 'Received' },
];

export function isPurchaseOrderDetailsComplete(order: PurchaseOrder): boolean {
  return (
    order.account_id != null &&
    Boolean(order.destination_type) &&
    order.destination_id != null &&
    Boolean(order.order_date)
  );
}

export function isPurchaseOrderItemsComplete(items: PurchaseOrderItem[]): boolean {
  return items.length > 0;
}

export function canCreatePurchaseOrderInvoice(
  order: PurchaseOrder,
  items: PurchaseOrderItem[],
  approvalMet: boolean
): { ok: boolean; reason?: string } {
  if (order.invoice_id != null) {
    return { ok: false, reason: 'Invoice already created' };
  }
  if (!approvalMet) {
    return { ok: false, reason: 'Approvals required before creating an invoice' };
  }
  if (!isPurchaseOrderDetailsComplete(order)) {
    return {
      ok: false,
      reason: 'Complete supplier, destination, location, and order date first',
    };
  }
  if (!isPurchaseOrderItemsComplete(items)) {
    return { ok: false, reason: 'Add at least one line item first' };
  }
  return { ok: true };
}

function invoiceComplete(order: PurchaseOrder): boolean {
  return order.invoice_id != null;
}

function receivedState(items: PurchaseOrderItem[]): PoMilestoneState {
  if (items.length === 0) return 'pending';

  const totalOrdered = items.reduce((sum, i) => sum + Number(i.quantity_ordered), 0);
  const totalReceived = items.reduce((sum, i) => sum + Number(i.quantity_received), 0);

  if (totalReceived <= 0) return 'pending';
  if (totalReceived >= totalOrdered) return 'complete';
  return 'partial';
}

export function derivePurchaseOrderMilestones(
  order: PurchaseOrder,
  items: PurchaseOrderItem[]
): Record<PoMilestoneId, PoMilestoneState> {
  return {
    details: isPurchaseOrderDetailsComplete(order) ? 'complete' : 'pending',
    items: isPurchaseOrderItemsComplete(items) ? 'complete' : 'pending',
    invoice: invoiceComplete(order) ? 'complete' : 'pending',
    received: receivedState(items),
  };
}
