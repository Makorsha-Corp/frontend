import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import {
  Archive,
  Package,
  Hash,
  Layers,
  DollarSign,
  Tag,
  ShoppingBag,
  Loader2,
  ClipboardList,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import StorageActiveOrdersDialog from './StorageActiveOrdersDialog';
import { useGetActiveOrdersForContextQuery } from '@/features/purchaseOrders/purchaseOrdersApi';
import {
  formatCurrency,
  formatNumber,
  INVENTORY_TYPES,
  type ProductsOverviewStats,
  type StorageOverviewStats,
} from './storageConstants';

interface StorageTabKpiStripProps {
  activeTab: 'storage' | 'products';
  factoryId: number | null;
  factoryLabels?: Record<number, string>;
  storageOverview: StorageOverviewStats;
  productsOverview: ProductsOverviewStats;
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
  onOpen: () => void;
}

const ActiveOrdersKpiCard: React.FC<ActiveOrdersKpiCardProps> = ({ factoryId, onOpen }) => {
  const { data = [], isLoading, isError } = useGetActiveOrdersForContextQuery(
    { factoryId: factoryId! },
    { skip: factoryId == null }
  );

  const value = factoryId == null ? (
    '—'
  ) : isLoading ? (
    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
  ) : isError ? (
    '—'
  ) : (
    formatNumber(data.length)
  );

  const footer =
    factoryId == null
      ? 'Select a factory'
      : data.length === 0
        ? 'No active orders'
        : 'Click to view orders';

  return (
    <button
      type="button"
      className={cn(
        'text-left transition-opacity',
        factoryId == null ? 'cursor-default opacity-80' : 'cursor-pointer hover:opacity-90'
      )}
      onClick={() => {
        if (factoryId != null) onOpen();
      }}
      aria-label="Active orders"
    >
      <Card
        className={cn(
          'border-border bg-card shadow-sm',
          factoryId != null && 'hover:border-brand-primary/30'
        )}
      >
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

const StorageTabKpiStrip: React.FC<StorageTabKpiStripProps> = ({
  activeTab,
  factoryId,
  factoryLabels = {},
  storageOverview,
  productsOverview,
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

  const marginHint =
    productsOverview.totalSalesValue > 0 && productsOverview.totalCostValue >= 0
      ? productsOverview.totalSalesValue - productsOverview.totalCostValue
      : null;

  const activeOrdersKpi = (
    <ActiveOrdersKpiCard factoryId={factoryId} onOpen={() => setOrdersDialogOpen(true)} />
  );

  const factoryLabel = factoryId != null ? factoryLabels[factoryId] : null;

  const activeOrdersDialog = (
    <StorageActiveOrdersDialog
      open={ordersDialogOpen}
      onOpenChange={setOrdersDialogOpen}
      factoryId={factoryId}
      factoryLabel={factoryLabel}
    />
  );

  if (activeTab === 'storage') {
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
          {activeOrdersKpi}
        </div>
        {activeOrdersDialog}
      </>
    );
  }

  return (
    <>
      <div className={kpiGridClass}>
        <MutedKpiCard
          title="Product lines"
          value={formatNumber(productsOverview.records)}
          icon={<Package className="h-4 w-4" />}
          footer={`${formatNumber(productsOverview.uniqueCount)} unique SKUs`}
          isLoading={isLoading}
        />
        <MutedKpiCard
          title="Total units"
          value={formatNumber(productsOverview.totalQty)}
          icon={<Layers className="h-4 w-4" />}
          footer="Finished goods on hand"
          isLoading={isLoading}
        />
        <MutedKpiCard
          title="Cost value"
          value={formatCurrency(productsOverview.totalCostValue)}
          icon={<Tag className="h-4 w-4" />}
          footer="Qty × average cost"
          isLoading={isLoading}
        />
        <MutedKpiCard
          title="Sales value"
          value={formatCurrency(productsOverview.totalSalesValue)}
          icon={<ShoppingBag className="h-4 w-4" />}
          footer={
            marginHint != null
              ? `${formatNumber(productsOverview.availableForSale)} for sale · ${formatCurrency(marginHint)} margin hint`
              : `${formatNumber(productsOverview.availableForSale)} listed for sale`
          }
          isLoading={isLoading}
        />
        {activeOrdersKpi}
      </div>
      {activeOrdersDialog}
    </>
  );
};

export default StorageTabKpiStrip;
