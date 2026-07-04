/**
 * Cross-slice RTK Query cache invalidation for orders and invoices.
 *
 * Each createApi slice owns its tag namespace — tags listed in invalidatesTags
 * only affect queries in that same slice. Use these helpers from onQueryStarted
 * when a mutation in one slice should refresh data owned by another.
 */
import type { AppDispatch } from '@/app/store';
import { accountInvoicesApi } from '@/features/accountInvoices/accountInvoicesApi';
import { accountsApi } from '@/features/accounts/accountsApi';
import { purchaseOrdersApi } from '@/features/purchaseOrders/purchaseOrdersApi';
import { expenseOrdersApi } from '@/features/expenseOrders/expenseOrdersApi';
import { transferOrdersApi } from '@/features/transferOrders/transferOrdersApi';
import { salesOrdersApi } from '@/features/salesOrders/salesOrdersApi';
import type { AccountInvoice } from '@/types/accountInvoice';

export function invalidateAccountInvoiceSummary(dispatch: AppDispatch, accountId: number): void {
  dispatch(accountsApi.util.invalidateTags([{ type: 'AccountInvoiceSummary', id: accountId }]));
}

export function invalidateInvoiceById(dispatch: AppDispatch, invoiceId: number): void {
  dispatch(
    accountInvoicesApi.util.invalidateTags([
      { type: 'AccountInvoice', id: invoiceId },
      { type: 'InvoiceItem', id: invoiceId },
      { type: 'InvoiceEvent', id: invoiceId },
      'AccountInvoice',
    ])
  );
}

export function invalidatePurchaseOrderById(dispatch: AppDispatch, poId: number): void {
  dispatch(
    purchaseOrdersApi.util.invalidateTags([
      { type: 'PurchaseOrder', id: poId },
      'PurchaseOrder',
      { type: 'PurchaseOrderEvents', id: poId },
      { type: 'PurchaseOrderApprovers', id: poId },
      { type: 'PurchaseOrderItem', id: poId },
      { type: 'PoReceiveEvents', id: poId },
      'ActiveOrders',
    ])
  );
}

export function invalidateExpenseOrderById(dispatch: AppDispatch, eoId: number): void {
  dispatch(
    expenseOrdersApi.util.invalidateTags([
      { type: 'ExpenseOrder', id: eoId },
      'ExpenseOrder',
      { type: 'ExpenseOrderEvents', id: eoId },
      { type: 'ExpenseOrderApprovers', id: eoId },
      { type: 'ExpenseOrderItem', id: eoId },
    ])
  );
}

export function invalidateTransferOrderById(dispatch: AppDispatch, toId: number): void {
  dispatch(
    transferOrdersApi.util.invalidateTags([
      { type: 'TransferOrder', id: toId },
      'TransferOrder',
      { type: 'TransferOrderEvents', id: toId },
      { type: 'TransferOrderApprovers', id: toId },
      { type: 'TransferOrderItem', id: toId },
    ])
  );
}

export function invalidateSalesOrderById(dispatch: AppDispatch, soId: number): void {
  dispatch(
    salesOrdersApi.util.invalidateTags([
      { type: 'SalesOrder', id: soId },
      'SalesOrder',
      { type: 'SalesOrderItem', id: `order-${soId}` },
    ])
  );
}

export function invalidateLinkedOrderForInvoice(
  dispatch: AppDispatch,
  invoice: Pick<AccountInvoice, 'order_id' | 'order_type'> | null | undefined,
  options?: { poId?: number | null }
): void {
  if (options?.poId != null) {
    invalidatePurchaseOrderById(dispatch, options.poId);
    return;
  }

  const orderId = invoice?.order_id;
  const orderType = invoice?.order_type;
  if (orderId == null || !orderType) return;

  switch (orderType) {
    case 'purchase_order':
      invalidatePurchaseOrderById(dispatch, orderId);
      break;
    case 'expense_order':
      invalidateExpenseOrderById(dispatch, orderId);
      break;
    case 'sales_order':
      invalidateSalesOrderById(dispatch, orderId);
      break;
    default:
      dispatch(purchaseOrdersApi.util.invalidateTags(['PurchaseOrder', 'ActiveOrders']));
      dispatch(expenseOrdersApi.util.invalidateTags(['ExpenseOrder']));
      dispatch(transferOrdersApi.util.invalidateTags(['TransferOrder']));
      dispatch(salesOrdersApi.util.invalidateTags(['SalesOrder']));
      break;
  }
}

export function invalidateInvoiceAndLinkedOrder(
  dispatch: AppDispatch,
  invoiceId: number,
  invoice?: Pick<AccountInvoice, 'order_id' | 'order_type' | 'account_id'> | null,
  options?: { poId?: number | null }
): void {
  invalidateInvoiceById(dispatch, invoiceId);
  if (invoice?.account_id != null) {
    invalidateAccountInvoiceSummary(dispatch, invoice.account_id);
  }
  invalidateLinkedOrderForInvoice(dispatch, invoice, options);
}
