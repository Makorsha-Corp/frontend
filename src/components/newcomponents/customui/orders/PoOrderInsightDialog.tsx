import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
} from '@/components/ui/dialog';
import { useGetPurchaseOrderByIdQuery } from '@/features/purchaseOrders/purchaseOrdersApi';
import { buildOrderHref } from '@/lib/entityLinks';
import OrderSummaryDialogContent from './OrderSummaryDialogContent';

export interface PoOrderInsightDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  purchaseOrderId: number | null;
}

const PoOrderInsightDialog: React.FC<PoOrderInsightDialogProps> = ({
  open,
  onOpenChange,
  purchaseOrderId,
}) => {
  const navigate = useNavigate();
  const { data: purchaseOrder, isLoading } = useGetPurchaseOrderByIdQuery(purchaseOrderId!, {
    skip: !open || purchaseOrderId == null,
  });

  const handleGoToOrder = () => {
    if (purchaseOrderId == null) return;
    onOpenChange(false);
    navigate(buildOrderHref('purchase_order', purchaseOrderId));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[66vh] max-h-[66vh] w-[min(56rem,94vw)] max-w-none flex-col overflow-hidden">
        <DialogTitle className="sr-only">
          {purchaseOrder?.po_number ? `Order summary for ${purchaseOrder.po_number}` : 'Order summary'}
        </DialogTitle>
        <div className="flex-1 min-h-0 overflow-y-auto pr-1">
          <OrderSummaryDialogContent
            purchaseOrder={purchaseOrder ?? null}
            expenseOrder={null}
            open={open}
            isLoading={isLoading}
          />
        </div>
        <DialogFooter className="shrink-0 border-t border-border pt-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button
            type="button"
            className="bg-brand-primary hover:bg-brand-primary-hover"
            onClick={handleGoToOrder}
            disabled={purchaseOrderId == null || isLoading}
          >
            Go to order
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PoOrderInsightDialog;
