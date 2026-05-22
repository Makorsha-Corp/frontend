import React, { useMemo } from 'react';
import { Clock, FileWarning, AlertCircle } from 'lucide-react';
import type { PurchaseOrder } from '@/types/purchaseOrder';
import OrderPendingActions, { type PendingActionSection } from './OrderPendingActions';

interface PurchaseOrderPendingActionsProps {
  orders: PurchaseOrder[];
  statusLabel: (id: number) => string;
  onSelectOrder: (id: number) => void;
  className?: string;
}

const PurchaseOrderPendingActions: React.FC<PurchaseOrderPendingActionsProps> = ({
  orders,
  statusLabel,
  onSelectOrder,
  className,
}) => {
  const sections = useMemo((): PendingActionSection[] => {
    const awaitingApproval = orders.filter(
      (o) => o.current_status_id >= 1 && o.current_status_id <= 3
    );

    const missingInvoices = orders.filter(
      (o) => o.current_status_id >= 4 && o.invoice_id == null
    );

    const oldestPending = orders
      .filter((o) => o.current_status_id === 1)
      .sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      )
      .slice(0, 5);

    return [
      {
        id: 'awaiting',
        title: 'Awaiting Approval',
        icon: <Clock className="h-4 w-4" />,
        count: awaitingApproval.length,
        items: awaitingApproval.slice(0, 3).map((o) => ({
          id: o.id,
          label: o.po_number,
          sublabel: statusLabel(o.current_status_id),
        })),
        colorClass: 'text-amber-600 dark:text-amber-400',
        bgClass: 'bg-amber-100 dark:bg-amber-900/30',
      },
      {
        id: 'missing-invoice',
        title: 'Missing Invoices',
        icon: <FileWarning className="h-4 w-4" />,
        count: missingInvoices.length,
        items: missingInvoices.slice(0, 3).map((o) => ({
          id: o.id,
          label: o.po_number,
          sublabel: statusLabel(o.current_status_id),
        })),
        colorClass: 'text-orange-600 dark:text-orange-400',
        bgClass: 'bg-orange-100 dark:bg-orange-900/30',
      },
      {
        id: 'oldest-pending',
        title: 'Oldest Pending',
        icon: <AlertCircle className="h-4 w-4" />,
        count: oldestPending.length,
        items: oldestPending.map((o) => ({
          id: o.id,
          label: o.po_number,
          sublabel: statusLabel(o.current_status_id),
        })),
        colorClass: 'text-red-600 dark:text-red-400',
        bgClass: 'bg-red-100 dark:bg-red-900/30',
      },
    ];
  }, [orders, statusLabel]);

  return (
    <OrderPendingActions
      sections={sections}
      onSelectItem={(id) => onSelectOrder(id as number)}
      className={className}
    />
  );
};

export default PurchaseOrderPendingActions;
