import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import SalesOrderDetailPanel from './SalesOrderDetailPanel';
import type { SalesOrder } from '@/types/salesOrder';
import type { Account } from '@/types/account';

interface SalesOrderDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: SalesOrder | null;
  accounts: Account[];
  onUpdated?: () => void;
}

const SalesOrderDetailModal: React.FC<SalesOrderDetailModalProps> = ({
  open,
  onOpenChange,
  order,
  accounts,
  onUpdated,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl h-[66vh] overflow-hidden flex flex-col p-0">
        {order ? (
          <>
            <DialogHeader className="border-b border-border px-6 py-4 shrink-0">
              <DialogTitle>{order.sales_order_number}</DialogTitle>
            </DialogHeader>
            <div className="overflow-y-auto flex-1 min-h-0 p-6 pt-4">
              <SalesOrderDetailPanel
                order={order}
                accounts={accounts}
                onClose={() => onOpenChange(false)}
                onUpdated={onUpdated}
              />
            </div>
          </>
        ) : (
          <div className="p-6 text-muted-foreground">No order selected</div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SalesOrderDetailModal;
