import React from 'react';
import OrderSummaryDialogContent from '@/components/newcomponents/customui/orders/OrderSummaryDialogContent';
import { useGetPurchaseOrderByIdQuery } from '@/features/purchaseOrders/purchaseOrdersApi';

export interface CalendarPurchaseOrderPreviewProps {
  purchaseOrderId: number;
  open: boolean;
}

const CalendarPurchaseOrderPreview: React.FC<CalendarPurchaseOrderPreviewProps> = ({
  purchaseOrderId,
  open,
}) => {
  const { data: purchaseOrder, isLoading } = useGetPurchaseOrderByIdQuery(purchaseOrderId, {
    skip: !open,
  });

  return (
    <div className="px-4 py-3">
      <OrderSummaryDialogContent
        purchaseOrder={purchaseOrder ?? null}
        expenseOrder={null}
        open={open}
        isLoading={isLoading}
      />
    </div>
  );
};

export default CalendarPurchaseOrderPreview;
