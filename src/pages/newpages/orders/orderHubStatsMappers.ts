import type { ExpenseOrder } from '@/types/expenseOrder';
import type { OrderHubRecentSummary } from '@/types/orderHub';
import type { PurchaseOrder } from '@/types/purchaseOrder';
import type { TransferOrder } from '@/types/transferOrder';

export function recentSummaryToPurchaseOrder(summary: OrderHubRecentSummary): PurchaseOrder {
  return {
    id: summary.id,
    po_number: summary.order_number,
    current_status_id: summary.status_id,
    current_status_name: summary.status_name,
    created_at: summary.created_at,
    updated_at: summary.updated_at ?? summary.created_at,
    account_id: summary.account_id ?? null,
    invoice_id: summary.invoice_id ?? null,
    total_amount: String(summary.total_amount ?? 0),
  } as unknown as PurchaseOrder;
}

export function recentSummaryToExpenseOrder(summary: OrderHubRecentSummary): ExpenseOrder {
  return {
    id: summary.id,
    expense_number: summary.order_number,
    expense_category: summary.expense_category ?? 'other',
    account_id: summary.account_id ?? null,
    invoice_id: summary.invoice_id ?? null,
    total_amount: String(summary.total_amount ?? 0),
    expense_date: summary.expense_date ?? summary.created_at.slice(0, 10),
    due_date: summary.due_date ?? null,
    created_at: summary.created_at,
    updated_at: summary.updated_at,
  } as unknown as ExpenseOrder;
}

export function recentSummaryToTransferOrder(summary: OrderHubRecentSummary): TransferOrder {
  return {
    id: summary.id,
    transfer_number: summary.order_number,
    current_status_id: summary.status_id,
    current_status_name: summary.status_name,
    source_location_type: summary.source_location_type ?? '',
    destination_location_type: summary.destination_location_type ?? '',
    source_location_id: 0,
    destination_location_id: 0,
    created_at: summary.created_at,
    updated_at: summary.updated_at,
    order_completed: summary.status_name === 'Completed',
    completed_at: summary.status_name === 'Completed' ? summary.updated_at : null,
  } as TransferOrder;
}
