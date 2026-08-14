import type { SalesOrder, SalesOrderApprovalSummary } from '@/types/salesOrder';
import type { SalesOrderItem } from '@/types/salesOrderItem';
import type { AccountInvoice } from '@/types/accountInvoice';

export type SoLinkedInvoiceStatus = AccountInvoice['invoice_status'] | null;

export function isSalesOrderMarkedComplete(order: SalesOrder): boolean {
  return order.order_completed === true;
}

export function isSalesOrderFullyClosed(order: SalesOrder): boolean {
  return isSalesOrderMarkedComplete(order) && order.paid === true;
}

export function isSalesOrderInvoiceFinalized(invoiceStatus: SoLinkedInvoiceStatus): boolean {
  return invoiceStatus === 'confirmed';
}

export function isSalesOrderInvoicePaid(order: SalesOrder): boolean {
  return order.paid === true;
}

export interface SoConfirmationsStatus {
  allConfirmed: boolean;
  title: string;
  reason: string;
  pendingLabels: string[];
}

export function getSalesOrderConfirmationsStatus(order: SalesOrder): SoConfirmationsStatus {
  const pendingLabels: string[] = [];
  if (!order.order_info_confirmed) pendingLabels.push('Order info');
  if (!order.items_confirmed) pendingLabels.push('Items');

  if (pendingLabels.length === 0) {
    return {
      allConfirmed: true,
      title: 'All sections confirmed',
      reason: 'Order info and items are confirmed',
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

export type SoSectionConfirmKey = 'order_info' | 'items';

export function canConfirmSalesOrderSection(
  section: SoSectionConfirmKey,
  order: Pick<SalesOrder, 'account_id' | 'order_date' | 'contact_name'>,
  items: SalesOrderItem[]
): { ok: boolean; reason?: string } {
  if (section === 'order_info') {
    if (order.account_id == null) {
      return { ok: false, reason: 'Select a customer first' };
    }
    if (!order.order_date) {
      return { ok: false, reason: 'Set the order date first' };
    }
    if (!order.contact_name || !order.contact_name.trim()) {
      return { ok: false, reason: 'Set the customer name first' };
    }
    return { ok: true };
  }
  // items
  if (items.length === 0) {
    return { ok: false, reason: 'Add at least one line item first' };
  }
  return { ok: true };
}

export function canFinalizeSalesOrderInvoice(
  order: SalesOrder,
  approvalMet: boolean,
  invoiceStatus: SoLinkedInvoiceStatus
): { ok: boolean; reason?: string } {
  if (order.invoice_confirmed) {
    return { ok: false, reason: 'Invoice is already finalized' };
  }
  const sections = getSalesOrderConfirmationsStatus(order);
  if (!sections.allConfirmed) {
    return { ok: false, reason: 'Confirm order info and items first' };
  }
  if (!approvalMet) {
    return { ok: false, reason: 'Approvals required before finalizing the invoice' };
  }
  if (order.invoice_id != null && invoiceStatus === 'confirmed') {
    return { ok: false, reason: 'Invoice is already finalized' };
  }
  return { ok: true };
}

/** Among requires_delivery=true lines, every one has been fully delivered. Vacuously true if none. */
export function isSalesOrderDeliveryComplete(items: SalesOrderItem[]): boolean {
  const deliverable = items.filter((i) => i.requires_delivery);
  return deliverable.every((i) => i.quantity_delivered >= i.quantity_ordered);
}

/** Among requires_delivery=false lines, every one has been fulfilled. Vacuously true if none. */
export function isSalesOrderFulfilmentComplete(items: SalesOrderItem[]): boolean {
  const fulfilment = items.filter((i) => !i.requires_delivery);
  return fulfilment.every((i) => i.quantity_delivered >= i.quantity_ordered);
}

export function canMarkSalesOrderComplete(
  order: SalesOrder,
  items: SalesOrderItem[]
): { ok: boolean; reason?: string } {
  if (isSalesOrderMarkedComplete(order)) {
    return { ok: false, reason: 'Order is already complete' };
  }
  if (!order.invoice_confirmed) {
    return { ok: false, reason: 'Finalize the invoice first' };
  }
  if (!isSalesOrderDeliveryComplete(items) || !isSalesOrderFulfilmentComplete(items)) {
    return { ok: false, reason: 'Finish delivering and fulfilling all items first' };
  }
  return { ok: true };
}

export function approvalsMilestoneState(summary: SalesOrderApprovalSummary): 'pending' | 'partial' | 'complete' {
  if (summary.met) return 'complete';
  if (summary.approved_count > 0) return 'partial';
  return 'pending';
}

export interface SoListRowBadge {
  label: string;
  className: string;
}

const COMPLETE_BADGE = 'border-transparent bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300';
const IN_PROGRESS_BADGE = 'border-transparent bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300';
const PAID_BADGE = 'border-transparent bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300';
const UNPAID_BADGE = 'border-transparent bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300';

/** Navigator list: In Progress, or Paid/Unpaid + Complete once closed. */
export function getSalesOrderListRowBadges(order: SalesOrder): SoListRowBadge[] {
  if (isSalesOrderMarkedComplete(order)) {
    const paid = order.paid === true;
    return [
      { label: paid ? 'Paid' : 'Unpaid', className: paid ? PAID_BADGE : UNPAID_BADGE },
      { label: 'Complete', className: COMPLETE_BADGE },
    ];
  }
  return [{ label: 'In Progress', className: IN_PROGRESS_BADGE }];
}
