import React, { useMemo } from 'react';
import { Plus, CheckCircle2 } from 'lucide-react';
import type { TransferOrder } from '@/types/transferOrder';
import { parseApiDateTime } from '@/utils/datetime';
import OrderActivityFeed, { type ActivityFeedItem } from './OrderActivityFeed';

interface TransferOrderActivityFeedProps {
  orders: TransferOrder[];
  routeSubtext: (order: TransferOrder) => string;
  onSelectOrder?: (id: number) => void;
  className?: string;
}

const TransferOrderActivityFeed: React.FC<TransferOrderActivityFeedProps> = ({
  orders,
  routeSubtext,
  onSelectOrder,
  className,
}) => {
  const activities = useMemo((): ActivityFeedItem[] => {
    const items: ActivityFeedItem[] = [];

    for (const order of orders) {
      const route = routeSubtext(order);

      items.push({
        id: `created-${order.id}`,
        icon: <Plus className="h-4 w-4 text-green-600 dark:text-green-400" />,
        timestamp: parseApiDateTime(order.created_at) ?? new Date(0),
        description: `${order.transfer_number} created`,
        subtext: route,
        targetId: order.id,
      });

      if (order.completed_at) {
        items.push({
          id: `completed-${order.id}`,
          icon: <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />,
          timestamp: parseApiDateTime(order.completed_at) ?? new Date(0),
          description: `${order.transfer_number} completed`,
          subtext: route,
          targetId: order.id,
        });
      }
    }

    items.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    return items.slice(0, 10);
  }, [orders, routeSubtext]);

  return (
    <OrderActivityFeed
      activities={activities}
      emptyMessage="No recent transfer order activity"
      className={className}
      onSelectItem={onSelectOrder}
    />
  );
};

export default TransferOrderActivityFeed;
