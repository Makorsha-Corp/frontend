import React, { useEffect, useMemo, useState } from 'react';
import { Archive, Hash, Layers, DollarSign, ClipboardList } from 'lucide-react';
import StorageActiveOrdersDialog from './StorageActiveOrdersDialog';
import { useStorageActiveOrders } from '@/hooks/useStorageActiveOrders';
import InventoryKpiCard from './InventoryKpiCard';
import {
  formatCurrency,
  formatNumber,
  INVENTORY_TYPES,
  type StorageOverviewStats,
} from './storageConstants';

interface StorageKpiStripProps {
  factoryId: number | null;
  factoryIds: number[];
  factoryLabels?: Record<number, string>;
  storageOverview: StorageOverviewStats;
  isLoading?: boolean;
}

const storageKpiGridClass =
  'grid shrink-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5';

const StorageKpiStrip: React.FC<StorageKpiStripProps> = ({
  factoryId,
  factoryIds,
  factoryLabels = {},
  storageOverview,
  isLoading,
}) => {
  const [ordersDialogOpen, setOrdersDialogOpen] = useState(false);

  useEffect(() => {
    setOrdersDialogOpen(false);
  }, [factoryId]);

  const uniqueStorageItems = useMemo(
    () => storageOverview.byType.reduce((sum, row) => sum + row.uniqueCount, 0),
    [storageOverview.byType],
  );

  const topStorageType = useMemo(() => {
    const sorted = [...storageOverview.byType].sort((a, b) => b.totalQty - a.totalQty);
    const top = sorted[0];
    if (!top || top.totalQty <= 0) return null;
    return `${top.type}: ${formatNumber(top.totalQty)} units`;
  }, [storageOverview.byType]);

  const factoryLabel = factoryId != null ? factoryLabels[factoryId] : null;
  const { count, isLoading: ordersLoading, isError: ordersError } = useStorageActiveOrders(
    factoryId,
    factoryIds,
  );

  const activeOrdersFooter =
    count === 0
      ? factoryId == null
        ? 'No active orders workspace-wide'
        : 'No active orders'
      : factoryId == null
        ? 'All factories — click to view'
        : 'Click to view orders';

  return (
    <>
      <div className={storageKpiGridClass}>
        <InventoryKpiCard
          title="Line items"
          value={formatNumber(storageOverview.records)}
          icon={<Archive className="h-4 w-4" />}
          footer="Inventory rows in current view"
          isLoading={isLoading}
        />
        <InventoryKpiCard
          title="Total units"
          value={formatNumber(storageOverview.totalQty)}
          icon={<Layers className="h-4 w-4" />}
          footer={topStorageType ?? 'Across all inventory types'}
          isLoading={isLoading}
        />
        <InventoryKpiCard
          title="Estimated value"
          value={formatCurrency(storageOverview.estimatedValue)}
          icon={<DollarSign className="h-4 w-4" />}
          footer="Qty × average price"
          isLoading={isLoading}
        />
        <InventoryKpiCard
          title="Unique items"
          value={formatNumber(uniqueStorageItems)}
          icon={<Hash className="h-4 w-4" />}
          footer={`${INVENTORY_TYPES.length} inventory types tracked`}
          isLoading={isLoading}
        />
        <InventoryKpiCard
          title="Active orders"
          value={ordersError ? '—' : formatNumber(count)}
          icon={<ClipboardList className="h-4 w-4" />}
          footer={activeOrdersFooter}
          isLoading={ordersLoading}
          onClick={() => setOrdersDialogOpen(true)}
        />
      </div>
      <StorageActiveOrdersDialog
        open={ordersDialogOpen}
        onOpenChange={setOrdersDialogOpen}
        factoryId={factoryId}
        factoryIds={factoryIds}
        factoryLabel={factoryLabel}
      />
    </>
  );
};

export default StorageKpiStrip;
