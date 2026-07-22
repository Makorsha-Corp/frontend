import React, { useMemo } from 'react';
import { Plus, FileText } from 'lucide-react';
import type { PurchaseOrder } from '@/types/purchaseOrder';
import { parseApiDateTime } from '@/utils/datetime';
import OrderActivityFeed, { type ActivityFeedItem } from './OrderActivityFeed';

interface PurchaseOrderActivityFeedProps {
  orders: PurchaseOrder[];
  accountName: (id: number) => string;
  statusLabel: (id: number) => string;
  onSelectOrder?: (id: number) => void;
  className?: string;
}

const PurchaseOrderActivityFeed: React.FC<PurchaseOrderActivityFeedProps> = ({
  orders,
  accountName,
  statusLabel,
  onSelectOrder,
  className,
}) => {
  const activities = useMemo((): ActivityFeedItem[] => {
    const items: ActivityFeedItem[] = [];

    for (const order of orders) {
      items.push({
        id: `created-${order.id}`,
        icon: <Plus className="h-4 w-4 text-green-600 dark:text-green-400" />,
        timestamp: parseApiDateTime(order.created_at) ?? new Date(0),
        description: `${order.po_number} created`,
        subtext: order.account_id != null ? accountName(order.account_id) : '—',
        targetId: order.id,
      });

      if (order.invoice_id != null) {
        const invoiceTime = order.updated_at
          ? (parseApiDateTime(order.updated_at) ?? new Date(0))
          : (parseApiDateTime(order.created_at) ?? new Date(0));
        items.push({
          id: `invoiced-${order.id}`,
          icon: <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />,
          timestamp: invoiceTime,
          description: `${order.po_number} invoice linked`,
          subtext: order.current_status_name ?? statusLabel(order.current_status_id),
          targetId: order.id,
        });
      }
    }

    items.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    return items.slice(0, 10);
  }, [orders, accountName, statusLabel]);

  return (
    <OrderActivityFeed
      activities={activities}
      emptyMessage="No recent purchase order activity"
      className={className}
      onSelectItem={onSelectOrder}
    />
  );
};

export default PurchaseOrderActivityFeed;
