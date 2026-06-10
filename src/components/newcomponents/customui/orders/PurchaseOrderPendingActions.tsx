import React, { useMemo } from 'react';
import { Clock, FileWarning, AlertCircle } from 'lucide-react';
import type { PurchaseOrder } from '@/types/purchaseOrder';
import OrderPendingActions, { type PendingActionSection } from './OrderPendingActions';

interface PurchaseOrderPendingActionsProps {
  orders: PurchaseOrder[];
  onSelectOrder: (id: number) => void;
  className?: string;
}

const stageIs = (order: PurchaseOrder, stage: string) => order.current_status_name === stage;

const PurchaseOrderPendingActions: React.FC<PurchaseOrderPendingActionsProps> = ({
  orders,
  onSelectOrder,
  className,
}) => {
  const sections = useMemo((): PendingActionSection[] => {
    const planningOrders = orders.filter((o) => stageIs(o, 'Planning'));

    const missingInvoices = planningOrders.filter(
      (o) => o.account_id != null && o.invoice_id == null
    );

    const oldestDraft = orders
      .filter((o) => stageIs(o, 'Draft'))
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
        count: planningOrders.length,
        items: planningOrders.slice(0, 3).map((o) => ({
          id: o.id,
          label: o.po_number,
          sublabel: o.current_status_name ?? '—',
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
          sublabel: o.current_status_name ?? '—',
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
          sublabel: o.current_status_name ?? '—',
        })),
        colorClass: 'text-red-600 dark:text-red-400',
        bgClass: 'bg-red-100 dark:bg-red-900/30',
      },
    ];
  }, [orders]);

  return (
    <OrderPendingActions
      sections={sections}
      onSelectItem={(id) => onSelectOrder(id as number)}
      className={className}
    />
  );
};

export default PurchaseOrderPendingActions;
