import React, { useMemo } from 'react';
import { Clock, AlertCircle, Wrench } from 'lucide-react';
import type { TransferOrder } from '@/types/transferOrder';
import {
  deriveTransferOrderStageFromOrder,
  isTransferOrderCompleted,
  type TrStageName,
} from './transferOrderMilestones';
import OrderPendingActions, { type PendingActionSection } from './OrderPendingActions';

interface TransferOrderPendingActionsProps {
  orders: TransferOrder[];
  onSelectOrder: (id: number) => void;
  className?: string;
}

function stageName(order: TransferOrder): TrStageName {
  if (isTransferOrderCompleted(order)) return 'Completed';
  return deriveTransferOrderStageFromOrder(order);
}

const TransferOrderPendingActions: React.FC<TransferOrderPendingActionsProps> = ({
  orders,
  onSelectOrder,
  className,
}) => {
  const sections = useMemo((): PendingActionSection[] => {
    const openOrders = orders.filter((o) => !isTransferOrderCompleted(o));
    const plannedOrders = openOrders.filter((o) => stageName(o) === 'Planned');
    const draftOrders = openOrders.filter((o) => stageName(o) === 'Draft');

    const oldestDraft = [...draftOrders]
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      .slice(0, 5);

    return [
      {
        id: 'in-planned',
        title: 'In Planned',
        icon: <Clock className="h-4 w-4" />,
        count: plannedOrders.length,
        items: plannedOrders.slice(0, 3).map((o) => ({
          id: o.id,
          label: o.transfer_number,
          sublabel: 'Planned',
        })),
        colorClass: 'text-amber-600 dark:text-amber-400',
        bgClass: 'bg-amber-100 dark:bg-amber-900/30',
      },
      {
        id: 'awaiting-setup',
        title: 'Awaiting setup',
        icon: <Wrench className="h-4 w-4" />,
        count: draftOrders.length,
        items: draftOrders.slice(0, 3).map((o) => ({
          id: o.id,
          label: o.transfer_number,
          sublabel: 'Draft',
        })),
        colorClass: 'text-orange-600 dark:text-orange-400',
        bgClass: 'bg-orange-100 dark:bg-orange-900/30',
      },
      {
        id: 'oldest-draft',
        title: 'Oldest draft',
        icon: <AlertCircle className="h-4 w-4" />,
        count: oldestDraft.length,
        items: oldestDraft.map((o) => ({
          id: o.id,
          label: o.transfer_number,
          sublabel: 'Draft',
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
      emptyMessage="No transfer orders need attention right now"
      className={className}
    />
  );
};

export default TransferOrderPendingActions;
