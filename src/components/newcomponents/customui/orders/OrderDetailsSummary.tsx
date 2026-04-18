import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useGetPurchaseOrdersQuery } from '@/features/purchaseOrders/purchaseOrdersApi';
import { useGetExpenseOrdersQuery } from '@/features/expenseOrders/expenseOrdersApi';
import type { AccountInvoice } from '@/types/accountInvoice';
import { FileSearch, Loader2 } from 'lucide-react';

interface OrderDetailsSummaryProps {
  invoice: AccountInvoice;
}

const OrderDetailsSummary: React.FC<OrderDetailsSummaryProps> = ({ invoice }) => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const { data: purchaseOrders = [], isLoading: isPurchaseLoading } = useGetPurchaseOrdersQuery(
    { invoice_id: invoice.id, skip: 0, limit: 1 },
    { skip: !invoice.id }
  );
  const { data: expenseOrders = [], isLoading: isExpenseLoading } = useGetExpenseOrdersQuery(
    { invoice_id: invoice.id, skip: 0, limit: 1 },
    { skip: !invoice.id }
  );

  const purchaseOrder = purchaseOrders[0];
  const expenseOrder = expenseOrders[0];
  const isLoading = isPurchaseLoading || isExpenseLoading;
  const hasLinkedOrder = !!purchaseOrder || !!expenseOrder;

  const summary = useMemo(() => {
    if (purchaseOrder) {
      return {
        orderType: 'Purchase Order',
        orderNumber: purchaseOrder.po_number,
        amount: purchaseOrder.total_amount,
        createdAt: purchaseOrder.created_at,
        destination: `${purchaseOrder.destination_type} #${purchaseOrder.destination_id}`,
        href: `/orders/purchase?orderId=${purchaseOrder.id}`,
      };
    }
    if (expenseOrder) {
      return {
        orderType: 'Expense Order',
        orderNumber: expenseOrder.expense_number,
        amount: expenseOrder.total_amount,
        createdAt: expenseOrder.created_at,
        destination: expenseOrder.expense_category,
        href: `/orders/expense?orderId=${expenseOrder.id}`,
      };
    }
    return null;
  }, [purchaseOrder, expenseOrder]);

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        onClick={() => setOpen(true)}
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-1 h-4 w-4 animate-spin" />
            Loading...
          </>
        ) : (
          'Order Summary'
        )}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-[min(32rem,94vw)] max-w-none">
          <DialogHeader>
            <DialogTitle>Order Summary</DialogTitle>
            <DialogDescription>
              Brief source-order information for this invoice.
            </DialogDescription>
          </DialogHeader>

          {!hasLinkedOrder ? (
            <div className="inline-flex items-center gap-2 rounded-md border border-border bg-muted/20 px-3 py-3 text-sm text-muted-foreground">
              <FileSearch className="h-4 w-4" />
              Source order is not linked for this invoice.
            </div>
          ) : (
            <div className="space-y-3 rounded-md border border-border bg-muted/20 px-3 py-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Order type</p>
                <p className="font-medium">{summary?.orderType}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Order number</p>
                <p className="font-medium">{summary?.orderNumber}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Order amount</p>
                <p className="font-medium">
                  {typeof summary?.amount === 'number'
                    ? summary.amount.toLocaleString()
                    : summary?.amount ?? '—'}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Context</p>
                <p className="font-medium">{summary?.destination}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Created</p>
                <p className="font-medium">
                  {summary?.createdAt ? new Date(summary.createdAt).toLocaleDateString() : '—'}
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Close
            </Button>
            <Button
              onClick={() => {
                if (!summary?.href) return;
                setOpen(false);
                navigate(summary.href);
              }}
              disabled={!summary?.href}
            >
              Go to Order Details
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default OrderDetailsSummary;
