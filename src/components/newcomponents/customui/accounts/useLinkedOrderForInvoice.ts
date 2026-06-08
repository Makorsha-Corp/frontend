import {
  useGetPurchaseOrdersQuery,
  useGetPurchaseOrderItemsQuery,
} from '@/features/purchaseOrders/purchaseOrdersApi';
import { useGetExpenseOrdersQuery, useGetExpenseOrderItemsQuery } from '@/features/expenseOrders/expenseOrdersApi';

export function useLinkedOrderForInvoice(
  invoiceId: number | null | undefined,
  options?: { skip?: boolean; skipExpenseLookup?: boolean }
) {
  const skip = options?.skip || invoiceId == null;
  const skipExpenseLookup = options?.skipExpenseLookup ?? false;

  const { data: purchaseOrders = [], isLoading: isPurchaseLoading } = useGetPurchaseOrdersQuery(
    { invoice_id: invoiceId!, skip: 0, limit: 1 },
    { skip }
  );
  const { data: expenseOrders = [], isLoading: isExpenseLoading } = useGetExpenseOrdersQuery(
    { invoice_id: invoiceId!, skip: 0, limit: 1 },
    { skip: skip || skipExpenseLookup }
  );

  const linkedPurchaseOrder = purchaseOrders[0] ?? null;
  const linkedPoId = linkedPurchaseOrder?.id ?? null;
  const linkedExpenseOrder = expenseOrders[0] ?? null;
  const linkedEoId = linkedExpenseOrder?.id ?? null;

  const { data: poItems = [], isLoading: isPoItemsLoading } = useGetPurchaseOrderItemsQuery(
    linkedPoId!,
    { skip: skip || linkedPoId == null }
  );

  const { data: expenseItems = [], isLoading: isEoItemsLoading } = useGetExpenseOrderItemsQuery(
    linkedEoId!,
    { skip: skip || linkedEoId == null || linkedPoId != null }
  );

  const orderNumber =
    linkedPurchaseOrder?.po_number ?? linkedExpenseOrder?.expense_number ?? null;

  return {
    orderNumber,
    linkedPoId,
    linkedEoId,
    poItems: linkedPoId != null ? poItems : [],
    expenseItems: linkedPoId == null && linkedEoId != null ? expenseItems : [],
    isLoading:
      !skip && (isPurchaseLoading || isExpenseLoading || isPoItemsLoading || isEoItemsLoading),
  };
}
