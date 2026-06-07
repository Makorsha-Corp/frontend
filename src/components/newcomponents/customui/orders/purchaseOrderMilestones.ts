import type { PurchaseOrder, PurchaseOrderItem } from '@/types/purchaseOrder';

export type PoMilestoneId = 'details' | 'supplier' | 'items' | 'invoice' | 'received';

export type PoMilestoneState = 'pending' | 'partial' | 'complete';

export interface PoMilestoneConfig {
  id: PoMilestoneId;
  label: string;
  shortLabel: string;
}

export const PO_MILESTONES: PoMilestoneConfig[] = [
  { id: 'details', label: 'Order details', shortLabel: 'Details' },
  { id: 'supplier', label: 'Supplier', shortLabel: 'Supplier' },
  { id: 'items', label: 'Items', shortLabel: 'Items' },
  { id: 'invoice', label: 'Invoice', shortLabel: 'Invoice' },
  { id: 'received', label: 'Received', shortLabel: 'Received' },
];

export function isPurchaseOrderSupplierComplete(order: PurchaseOrder): boolean {
  return order.account_id != null;
}

export function isPurchaseOrderDetailsComplete(order: PurchaseOrder): boolean {
  return (
    Boolean(order.destination_type) &&
    order.destination_id != null &&
    Boolean(order.order_date)
  );
}

export function isPurchaseOrderItemsComplete(items: PurchaseOrderItem[]): boolean {
  return items.length > 0;
}

export interface PoConfirmationsStatus {
  allConfirmed: boolean;
  title: string;
  reason: string;
  pendingLabels: string[];
}

export function getPurchaseOrderConfirmationsStatus(order: PurchaseOrder): PoConfirmationsStatus {
  if (order.invoice_id != null) {
    return {
      allConfirmed: true,
      title: 'All sections confirmed',
      reason: 'Supplier, order details, and items locked after invoice was created',
      pendingLabels: [],
    };
  }

  const pendingLabels: string[] = [];
  if (!order.supplier_confirmed) pendingLabels.push('Supplier');
  if (!order.details_confirmed) pendingLabels.push('Order details');
  if (!order.items_confirmed) pendingLabels.push('Items');

  if (pendingLabels.length === 0) {
    return {
      allConfirmed: true,
      title: 'All sections confirmed',
      reason: 'Supplier, order details, and items are confirmed',
      pendingLabels: [],
    };
  }

  return {
    allConfirmed: false,
    title: 'Sections pending confirmation',
    reason: 'Use the checkmarks below when each section is ready',
    pendingLabels,
  };
}

export type PoSectionConfirmKey = 'supplier' | 'details' | 'items';

export interface PoEffectiveOrderFields {
  account_id: number | null;
  destination_type: string | null;
  destination_id: number | null;
  order_date: string | null;
}

export function canConfirmPurchaseOrderSection(
  section: PoSectionConfirmKey,
  order: PoEffectiveOrderFields,
  items: PurchaseOrderItem[]
): { ok: boolean; reason?: string } {
  if (section === 'supplier') {
    if (order.account_id == null) {
      return { ok: false, reason: 'Select a supplier first' };
    }
    return { ok: true };
  }
  if (section === 'details') {
    if (!isPurchaseOrderDetailsComplete(order as PurchaseOrder)) {
      return {
        ok: false,
        reason: 'Complete destination, location, and order date first',
      };
    }
    return { ok: true };
  }
  if (!isPurchaseOrderItemsComplete(items)) {
    return { ok: false, reason: 'Add at least one line item first' };
  }
  return { ok: true };
}

export function canCreatePurchaseOrderInvoice(
  order: PurchaseOrder,
  items: PurchaseOrderItem[],
  approvalMet: boolean
): { ok: boolean; reason?: string } {
  if (order.invoice_id != null) {
    return { ok: false, reason: 'Invoice already created' };
  }
  const confirmations = getPurchaseOrderConfirmationsStatus(order);
  if (!confirmations.allConfirmed) {
    return { ok: false, reason: 'Confirm all sections first' };
  }
  if (!approvalMet) {
    return { ok: false, reason: 'Approvals required before creating an invoice' };
  }
  if (!isPurchaseOrderSupplierComplete(order)) {
    return {
      ok: false,
      reason: 'Unconfirm supplier, select a supplier, then confirm again',
    };
  }
  if (!isPurchaseOrderDetailsComplete(order)) {
    return {
      ok: false,
      reason: 'Unconfirm order details, complete the fields, then confirm again',
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

function confirmedMilestoneState(confirmed: boolean): PoMilestoneState {
  return confirmed ? 'complete' : 'pending';
}

export function derivePurchaseOrderMilestones(
  order: PurchaseOrder,
  items: PurchaseOrderItem[]
): Record<PoMilestoneId, PoMilestoneState> {
  return {
    details: confirmedMilestoneState(order.details_confirmed ?? false),
    supplier: confirmedMilestoneState(order.supplier_confirmed ?? false),
    items: confirmedMilestoneState(order.items_confirmed ?? false),
    invoice: invoiceComplete(order) ? 'complete' : 'pending',
    received: receivedState(items),
  };
}
