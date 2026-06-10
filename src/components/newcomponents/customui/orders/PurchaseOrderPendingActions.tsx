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

const stageIs = (order: PurchaseOrder, stage: string, statusLabel: (id: number) => string) =>
  statusLabel(order.current_status_id) === stage;

const PurchaseOrderPendingActions: React.FC<PurchaseOrderPendingActionsProps> = ({
  orders,
  statusLabel,
  onSelectOrder,
  className,
}) => {
  const sections = useMemo((): PendingActionSection[] => {
    const planningOrders = orders.filter((o) => stageIs(o, 'Planning', statusLabel));

    const awaitingApproval = planningOrders;

    const missingInvoices = planningOrders.filter(
      (o) => o.account_id != null && o.invoice_id == null
    );

    const oldestDraft = orders
      .filter((o) => stageIs(o, 'Draft', statusLabel))
      .sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      )
      .slice(0, 5);

    return [
      {
        id: 'awaiting',
        title: 'In Planning',
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
        id: 'oldest-draft',
        title: 'Oldest Draft',
        icon: <AlertCircle className="h-4 w-4" />,
        count: oldestDraft.length,
        items: oldestDraft.map((o) => ({
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
