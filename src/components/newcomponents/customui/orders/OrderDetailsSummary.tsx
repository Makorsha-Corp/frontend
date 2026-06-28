import React, { useMemo, useState } from 'react';

import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';

import { Badge } from '@/components/ui/badge';

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
} from '@/components/ui/dialog';

import {
  useGetPurchaseOrdersQuery,
  useGetPurchaseOrderByIdQuery,
} from '@/features/purchaseOrders/purchaseOrdersApi';

import {
  useGetExpenseOrdersQuery,
  useGetExpenseOrderByIdQuery,
} from '@/features/expenseOrders/expenseOrdersApi';

import type { AccountInvoice } from '@/types/accountInvoice';

import { formatOrderLabel } from '@/components/newcomponents/customui/accounts/invoiceDisplayUtils';

import OrderSummaryDialogContent from './OrderSummaryDialogContent';

import { cn } from '@/lib/utils';

import { Loader2 } from 'lucide-react';



interface OrderDetailsSummaryProps {

  invoice: AccountInvoice;

  /** When known, shown on the badge before full order fetch completes. */

  linkedOrderNumber?: string | null;

}



const OrderDetailsSummary: React.FC<OrderDetailsSummaryProps> = ({

  invoice,

  linkedOrderNumber: linkedOrderNumberProp,

}) => {

  const [open, setOpen] = useState(false);

  const navigate = useNavigate();

  const orderType = invoice.order_type;
  const orderId = invoice.order_id;
  const isPo = orderType === 'purchase_order';
  const isEo = orderType === 'expense_order';
  // Use reverse lookup only for older invoices that have no order_type stored
  const useFallback = orderType == null;

  const { data: purchaseOrderById, isLoading: isPoBidLoading } = useGetPurchaseOrderByIdQuery(
    orderId!,
    { skip: !isPo || orderId == null }
  );

  const { data: expenseOrderById, isLoading: isEoBidLoading } = useGetExpenseOrderByIdQuery(
    orderId!,
    { skip: !isEo || orderId == null }
  );

  const { data: purchaseOrdersFallback = [], isLoading: isPurchaseLoading } = useGetPurchaseOrdersQuery(
    { invoice_id: invoice.id, skip: 0, limit: 1 },
    { skip: !useFallback || !invoice.id }
  );

  const { data: expenseOrdersFallback = [], isLoading: isExpenseLoading } = useGetExpenseOrdersQuery(
    { invoice_id: invoice.id, skip: 0, limit: 1 },
    { skip: !useFallback || !invoice.id }
  );

  const purchaseOrder = isPo
    ? (purchaseOrderById ?? null)
    : useFallback
      ? (purchaseOrdersFallback[0] ?? null)
      : null;

  const expenseOrder = isEo
    ? (expenseOrderById ?? null)
    : useFallback
      ? (expenseOrdersFallback[0] ?? null)
      : null;

  const isLoading = isPoBidLoading || isEoBidLoading || isPurchaseLoading || isExpenseLoading;

  const hasLinkedOrder = !!purchaseOrder || !!expenseOrder;

  const orderHref = useMemo(() => {
    if (isPo && orderId) return `/orders/purchase?orderId=${orderId}`;
    if (isEo && orderId) return `/orders/expense?orderId=${orderId}`;
    if (purchaseOrder) return `/orders/purchase?orderId=${purchaseOrder.id}`;
    if (expenseOrder) return `/orders/expense?orderId=${expenseOrder.id}`;
    return null;
  }, [isPo, isEo, orderId, purchaseOrder, expenseOrder]);

  const badgeLabel =

    purchaseOrder?.po_number ??

    expenseOrder?.expense_number ??

    linkedOrderNumberProp ??

    null;



  if (isLoading && !badgeLabel) {

    return (

      <Badge variant="outline" className="gap-1 font-medium text-muted-foreground">

        <Loader2 className="h-3 w-3 animate-spin" />

        Order…

      </Badge>

    );

  }



  if (!badgeLabel && !hasLinkedOrder) {

    return null;

  }



  return (

    <>

      <button

        type="button"

        onClick={() => setOpen(true)}

        disabled={isLoading && !hasLinkedOrder}

        className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50"

        aria-label={`View order summary for ${badgeLabel ?? 'linked order'}`}

      >

        <Badge

          className={cn(

            'cursor-pointer border-transparent bg-brand-primary font-medium text-primary-foreground',

            'hover:bg-brand-primary-hover'

          )}

        >

          {badgeLabel ? formatOrderLabel(badgeLabel) : 'Order Summary'}

        </Badge>

      </button>



      <Dialog open={open} onOpenChange={setOpen}>

        <DialogContent className="flex h-[66vh] max-h-[66vh] w-[min(56rem,94vw)] max-w-none flex-col overflow-hidden">
          <DialogTitle className="sr-only">Order Summary</DialogTitle>
          <div className="flex-1 min-h-0 overflow-y-auto pr-1">

            <OrderSummaryDialogContent

              purchaseOrder={purchaseOrder}

              expenseOrder={expenseOrder}

              open={open}

              isLoading={isLoading}

            />

          </div>



          <DialogFooter className="shrink-0">

            <Button variant="outline" onClick={() => setOpen(false)}>

              Close

            </Button>

            <Button

              className="bg-brand-primary hover:bg-brand-primary-hover"

              onClick={() => {

                if (!orderHref) return;

                setOpen(false);

                navigate(orderHref);

              }}

              disabled={!orderHref}

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

