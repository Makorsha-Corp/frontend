import React, { useState, useMemo } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  useDroppable,
  useSensor,
  useSensors,
  PointerSensor,
} from '@dnd-kit/core';
import { snapCenterToCursor } from '@dnd-kit/modifiers';
import { useGetAccountsQuery } from '@/features/accounts/accountsApi';
import { useGetStatusesQuery } from '@/features/statuses/statusesApi';
import type { SalesOrder } from '@/types/salesOrder';
import {
  SALES_KANBAN_COLUMNS,
  getSalesOrderKanbanColumn,
  type SalesOrderKanbanColumn,
} from './salesOrderStatusConstants';
import SalesOrderCard from './SalesOrderCard';
import SalesOrderCardOverlay from './SalesOrderCardOverlay';
import SalesOrderStatusChangeModal from './SalesOrderStatusChangeModal';
import { useUpdateSalesOrderMutation } from '@/features/salesOrders/salesOrdersApi';
import toast from 'react-hot-toast';

interface KanbanColumnProps {
  columnId: SalesOrderKanbanColumn;
  label: string;
  orders: SalesOrder[];
  accountName: (id: number) => string;
  statusLabel: (id: number) => string;
  formatCurrency: (v: number | null | undefined) => string;
  formatDate: (d: string | null | undefined) => string;
  onCardClick: (order: SalesOrder) => void;
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({
  columnId,
  label,
  orders,
  accountName,
  statusLabel,
  formatCurrency,
  formatDate,
  onCardClick,
}) => {
  const { isOver, setNodeRef } = useDroppable({ id: columnId });

  return (
    <div
      ref={setNodeRef}
      className={`
        flex-1 min-w-0 flex flex-col rounded-lg border border-border bg-muted/30
        ${isOver ? 'ring-2 ring-brand-primary ring-offset-2' : ''}
      `}
    >
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <span className="font-semibold text-card-foreground">{label}</span>
        <span className="text-sm text-muted-foreground">{orders.length}</span>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-3">
        {orders.map((order) => (
          <SalesOrderCard
            key={order.id}
            order={order}
            accountName={accountName(order.account_id)}
            statusLabel={statusLabel(order.current_status_id)}
            formatCurrency={formatCurrency}
            formatDate={formatDate}
            onClick={() => onCardClick(order)}
          />
        ))}
      </div>
    </div>
  );
};

interface SalesOrderKanbanViewProps {
  orders: SalesOrder[];
  searchQuery: string;
  onOrderClick: (order: SalesOrder) => void;
}

const SalesOrderKanbanView: React.FC<SalesOrderKanbanViewProps> = ({
  orders,
  searchQuery,
  onOrderClick,
}) => {
  const [activeOrder, setActiveOrder] = useState<SalesOrder | null>(null);
  const [statusChangeModal, setStatusChangeModal] = useState<{
    order: SalesOrder;
    targetColumn: SalesOrderKanbanColumn;
  } | null>(null);

  const { data: accounts = [] } = useGetAccountsQuery({ skip: 0, limit: 100 });
  const { data: statuses = [] } = useGetStatusesQuery({ skip: 0, limit: 100 });
  const [updateOrder] = useUpdateSalesOrderMutation();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        delay: 500,
        tolerance: 5,
      },
    })
  );

  const accountName = (id: number) => accounts.find((a) => a.id === id)?.name ?? `#${id}`;
  const statusLabel = (id: number) => statuses.find((s) => s.id === id)?.name ?? `#${id}`;
  const formatCurrency = (v: number | null | undefined) =>
    v != null ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(v) : '—';
  const formatDate = (d: string | null | undefined) => (d ? new Date(d).toLocaleDateString() : '—');

  const ordersByColumn = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const filtered = q
      ? orders.filter((o) => {
          const soNum = o.sales_order_number?.toLowerCase() ?? '';
          const cust = (accounts.find((a) => a.id === o.account_id)?.name ?? '').toLowerCase();
          return soNum.includes(q) || cust.includes(q);
        })
      : orders;

    const map: Record<SalesOrderKanbanColumn, SalesOrder[]> = {
      pending: [],
      working: [],
      completed: [],
    };
    filtered.forEach((o) => {
      const col = getSalesOrderKanbanColumn(o.current_status_id, statuses);
      map[col].push(o);
    });
    return map;
  }, [orders, searchQuery, accounts, statuses]);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const orderId = typeof active.id === 'string' && active.id.startsWith('sales-order-')
      ? Number(active.id.replace('sales-order-', ''))
      : null;
    if (orderId) {
      const order = orders.find((o) => o.id === orderId);
      if (order) setActiveOrder(order);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveOrder(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const orderId = typeof active.id === 'string' && active.id.startsWith('sales-order-')
      ? Number(active.id.replace('sales-order-', ''))
      : null;
    const targetColumn = over.id as SalesOrderKanbanColumn;

    if (orderId && ['pending', 'working', 'completed'].includes(targetColumn)) {
      const order = orders.find((o) => o.id === orderId);
      const currentCol = order ? getSalesOrderKanbanColumn(order.current_status_id, statuses) : null;
      if (order && currentCol !== targetColumn) {
        setStatusChangeModal({ order, targetColumn });
      }
    }
  };

  const handleStatusConfirm = async (orderId: number, newStatusId: number) => {
    try {
      await updateOrder({ id: orderId, data: { current_status_id: newStatusId } }).unwrap();
      toast.success('Status updated');
      setStatusChangeModal(null);
    } catch (err: unknown) {
      const e = err as { data?: { detail?: string } };
      toast.error(e?.data?.detail || 'Failed to update status');
      throw err;
    }
  };

  return (
    <>
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 flex-1 min-h-0 overflow-hidden">
          {SALES_KANBAN_COLUMNS.map(({ id, label }) => (
            <KanbanColumn
              key={id}
              columnId={id}
              label={label}
              orders={ordersByColumn[id]}
              accountName={accountName}
              statusLabel={statusLabel}
              formatCurrency={formatCurrency}
              formatDate={formatDate}
              onCardClick={onOrderClick}
            />
          ))}
        </div>

        <DragOverlay modifiers={[snapCenterToCursor]}>
          {activeOrder ? (
            <SalesOrderCardOverlay
              order={activeOrder}
              accountName={accountName(activeOrder.account_id)}
              statusLabel={statusLabel(activeOrder.current_status_id)}
              formatCurrency={formatCurrency}
              formatDate={formatDate}
            />
          ) : null}
        </DragOverlay>
      </DndContext>

      <SalesOrderStatusChangeModal
        open={!!statusChangeModal}
        onOpenChange={(open) => !open && setStatusChangeModal(null)}
        order={statusChangeModal?.order ?? null}
        targetColumn={statusChangeModal?.targetColumn ?? null}
        statuses={statuses}
        onConfirm={handleStatusConfirm}
      />
    </>
  );
};

export default SalesOrderKanbanView;
