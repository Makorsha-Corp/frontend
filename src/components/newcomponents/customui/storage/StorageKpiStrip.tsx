import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import {
  Archive,
  Hash,
  Layers,
  DollarSign,
  Loader2,
  ClipboardList,
} from 'lucide-react';
import StorageActiveOrdersDialog from './StorageActiveOrdersDialog';
import { useStorageActiveOrders } from '@/hooks/useStorageActiveOrders';
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

interface MutedKpiCardProps {
  title: string;
  value: React.ReactNode;
  footer?: string;
  icon: React.ReactNode;
  isLoading?: boolean;
}

const MutedKpiCard: React.FC<MutedKpiCardProps> = ({ title, value, footer, icon, isLoading }) => (
  <Card className="border-border bg-card shadow-sm">
    <CardContent className="p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <span className="text-muted-foreground/70">{icon}</span>
      </div>
      <p className="mt-2 text-2xl font-semibold tabular-nums text-card-foreground">
        {isLoading ? <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /> : value}
      </p>
      {footer ? <p className="mt-1 text-xs text-muted-foreground">{footer}</p> : null}
    </CardContent>
  </Card>
);

interface ActiveOrdersKpiCardProps {
  factoryId: number | null;
  factoryIds: number[];
  onOpen: () => void;
}

const ActiveOrdersKpiCard: React.FC<ActiveOrdersKpiCardProps> = ({
  factoryId,
  factoryIds,
  onOpen,
}) => {
  const { count, isLoading, isError } = useStorageActiveOrders(factoryId, factoryIds);

  const value = isLoading ? (
    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
  ) : isError ? (
    '—'
  ) : (
    formatNumber(count)
  );

  const footer =
    count === 0
      ? factoryId == null
        ? 'No active orders workspace-wide'
        : 'No active orders'
      : factoryId == null
        ? 'All factories — click to view'
        : 'Click to view orders';

  return (
    <button
      type="button"
      className="cursor-pointer text-left transition-opacity hover:opacity-90"
      onClick={onOpen}
      aria-label="Active orders"
    >
      <Card className="border-border bg-card shadow-sm hover:border-brand-primary/30">
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium text-muted-foreground">Active orders</p>
            <ClipboardList className="h-4 w-4 text-muted-foreground/70" />
          </div>
          <p className="mt-2 text-2xl font-semibold tabular-nums text-card-foreground">{value}</p>
          <p className="mt-1 text-xs text-muted-foreground">{footer}</p>
        </CardContent>
      </Card>
    </button>
  );
};

const kpiGridClass = 'grid shrink-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5';

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
    [storageOverview.byType]
  );

  const topStorageType = useMemo(() => {
    const sorted = [...storageOverview.byType].sort((a, b) => b.totalQty - a.totalQty);
    const top = sorted[0];
    if (!top || top.totalQty <= 0) return null;
    return `${top.type}: ${formatNumber(top.totalQty)} units`;
  }, [storageOverview.byType]);

  const factoryLabel = factoryId != null ? factoryLabels[factoryId] : null;

  return (
    <>
      <div className={kpiGridClass}>
        <MutedKpiCard
          title="Line items"
          value={formatNumber(storageOverview.records)}
          icon={<Archive className="h-4 w-4" />}
          footer="Inventory rows in current view"
          isLoading={isLoading}
        />
        <MutedKpiCard
          title="Total units"
          value={formatNumber(storageOverview.totalQty)}
          icon={<Layers className="h-4 w-4" />}
          footer={topStorageType ?? 'Across all inventory types'}
          isLoading={isLoading}
        />
        <MutedKpiCard
          title="Estimated value"
          value={formatCurrency(storageOverview.estimatedValue)}
          icon={<DollarSign className="h-4 w-4" />}
          footer="Qty × average price"
          isLoading={isLoading}
        />
        <MutedKpiCard
          title="Unique items"
          value={formatNumber(uniqueStorageItems)}
          icon={<Hash className="h-4 w-4" />}
          footer={`${INVENTORY_TYPES.length} inventory types tracked`}
          isLoading={isLoading}
        />
        <ActiveOrdersKpiCard
          factoryId={factoryId}
          factoryIds={factoryIds}
          onOpen={() => setOrdersDialogOpen(true)}
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
