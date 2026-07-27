import { useEffect, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { purchaseOrdersApi } from '@/features/purchaseOrders/purchaseOrdersApi';
import { expenseOrdersApi } from '@/features/expenseOrders/expenseOrdersApi';
import type { AccountInvoice } from '@/types/accountInvoice';
import type { ExpenseOrder } from '@/types/expenseOrder';
import type { PurchaseOrder } from '@/types/purchaseOrder';
import { buildInvoiceOrderNumberMap } from './invoiceDisplayUtils';

function collectInvoiceOrderLookups(invoices: AccountInvoice[]) {
  const poIds = new Set<number>();
  const eoIds = new Set<number>();
  const legacyInvoiceIds = new Set<number>();

  for (const inv of invoices) {
    if (inv.order_id != null && inv.order_type === 'purchase_order') {
      poIds.add(inv.order_id);
    } else if (inv.order_id != null && inv.order_type === 'expense_order') {
      eoIds.add(inv.order_id);
    } else {
      legacyInvoiceIds.add(inv.id);
    }
  }

  return {
    poIds: [...poIds],
    eoIds: [...eoIds],
    legacyInvoiceIds: [...legacyInvoiceIds],
  };
}

/**
 * Resolves invoice → order number labels without loading every order for an account.
 * Fetches only orders referenced by the currently loaded invoice list (by order_id or invoice_id).
 */
export function useInvoiceOrderNumberMap(invoices: AccountInvoice[]) {
  const dispatch = useAppDispatch();
  const { poIds, eoIds, legacyInvoiceIds } = useMemo(
    () => collectInvoiceOrderLookups(invoices),
    [invoices],
  );

  useEffect(() => {
    for (const id of poIds) {
      dispatch(purchaseOrdersApi.endpoints.getPurchaseOrderById.initiate(id));
    }
    for (const id of eoIds) {
      dispatch(expenseOrdersApi.endpoints.getExpenseOrderById.initiate(id));
    }
    for (const invoiceId of legacyInvoiceIds) {
      dispatch(
        purchaseOrdersApi.endpoints.getPurchaseOrders.initiate({
          invoice_id: invoiceId,
          skip: 0,
          limit: 1,
        }),
      );
      dispatch(
        expenseOrdersApi.endpoints.getExpenseOrders.initiate({
          invoice_id: invoiceId,
          skip: 0,
          limit: 1,
        }),
      );
    }
  }, [dispatch, poIds, eoIds, legacyInvoiceIds]);

  const purchaseOrders = useAppSelector((state) => {
    const rows: PurchaseOrder[] = [];
    for (const id of poIds) {
      const row = purchaseOrdersApi.endpoints.getPurchaseOrderById.select(id)(state)?.data;
      if (row) rows.push(row);
    }
    for (const invoiceId of legacyInvoiceIds) {
      const cached = purchaseOrdersApi.endpoints.getPurchaseOrders.select({
        invoice_id: invoiceId,
        skip: 0,
        limit: 1,
      })(state)?.data;
      const row = cached?.[0];
      if (row) rows.push(row);
    }
    return rows;
  });

  const expenseOrders = useAppSelector((state) => {
    const rows: ExpenseOrder[] = [];
    for (const id of eoIds) {
      const row = expenseOrdersApi.endpoints.getExpenseOrderById.select(id)(state)?.data;
      if (row) rows.push(row);
    }
    for (const invoiceId of legacyInvoiceIds) {
      const cached = expenseOrdersApi.endpoints.getExpenseOrders.select({
        invoice_id: invoiceId,
        skip: 0,
        limit: 1,
      })(state)?.data;
      const row = cached?.[0];
      if (row) rows.push(row);
    }
    return rows;
  });

  return useMemo(
    () => buildInvoiceOrderNumberMap(purchaseOrders, expenseOrders, invoices),
    [purchaseOrders, expenseOrders, invoices],
  );
}
