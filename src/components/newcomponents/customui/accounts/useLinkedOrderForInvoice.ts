import { useGetPurchaseOrdersQuery } from '@/features/purchaseOrders/purchaseOrdersApi';
import { useGetExpenseOrdersQuery } from '@/features/expenseOrders/expenseOrdersApi';

export function useLinkedOrderForInvoice(
  invoiceId: number | null | undefined,
  options?: { skip?: boolean }
) {
  const skip = options?.skip || invoiceId == null;

  const { data: purchaseOrders = [], isLoading: isPurchaseLoading } = useGetPurchaseOrdersQuery(
    { invoice_id: invoiceId!, skip: 0, limit: 1 },
    { skip }
  );
  const { data: expenseOrders = [], isLoading: isExpenseLoading } = useGetExpenseOrdersQuery(
    { invoice_id: invoiceId!, skip: 0, limit: 1 },
    { skip }
  );

  const orderNumber =
    purchaseOrders[0]?.po_number ?? expenseOrders[0]?.expense_number ?? null;

  return {
    orderNumber,
    isLoading: !skip && (isPurchaseLoading || isExpenseLoading),
  };
}
