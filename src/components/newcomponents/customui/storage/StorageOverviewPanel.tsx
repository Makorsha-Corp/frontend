import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Archive, Package, DollarSign } from 'lucide-react';
import ActiveOrdersPanel from '@/components/newcomponents/customui/RunningOrdersPlaceholder';
import {
  formatCurrency,
  formatNumber,
  type ProductsOverviewStats,
  type StorageOverviewStats,
} from './storageConstants';

interface StorageOverviewPanelProps {
  factoryId: number | null;
  storageOverview: StorageOverviewStats;
  productsOverview: ProductsOverviewStats;
}

const StorageOverviewPanel: React.FC<StorageOverviewPanelProps> = ({
  factoryId,
  storageOverview,
  productsOverview,
}) => {
  const marginHint =
    productsOverview.totalSalesValue > 0 && productsOverview.totalCostValue >= 0
      ? productsOverview.totalSalesValue - productsOverview.totalCostValue
      : null;

  return (
    <div className="grid shrink-0 grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      <Card className="border-border bg-card shadow-sm">
        <CardContent className="p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-primary/10 ring-1 ring-brand-primary/25">
                <Archive className="h-4 w-4 text-brand-primary" />
              </div>
              <p className="text-sm font-semibold text-card-foreground">Storage</p>
            </div>
            <p className="text-lg font-semibold tabular-nums text-card-foreground">
              {formatNumber(storageOverview.totalQty)}
            </p>
          </div>
          <p className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">Estimated value</p>
          <p className="mb-3 text-xl font-semibold tabular-nums text-card-foreground">
            {formatCurrency(storageOverview.estimatedValue)}
          </p>
          <div className="space-y-1.5 text-sm">
            {storageOverview.byType.map((row) => (
              <div key={row.type} className="flex items-center justify-between">
                <span className="text-muted-foreground">{row.type}</span>
                <span className="font-medium tabular-nums text-card-foreground">
                  {formatNumber(row.uniqueCount)} ({formatNumber(row.totalQty)})
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-border bg-card shadow-sm">
        <CardContent className="p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 ring-1 ring-emerald-500/25">
                <Package className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <p className="text-sm font-semibold text-card-foreground">Products</p>
            </div>
            <p className="text-lg font-semibold tabular-nums text-card-foreground">
              {formatNumber(productsOverview.totalQty)}
            </p>
          </div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Value</p>
            <DollarSign className="h-4 w-4 text-brand-primary" />
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Cost value</span>
              <span className="font-semibold tabular-nums text-card-foreground">
                {formatCurrency(productsOverview.totalCostValue)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Sales value</span>
              <span className="font-semibold tabular-nums text-card-foreground">
                {formatCurrency(productsOverview.totalSalesValue)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">For sale</span>
              <span className="font-medium tabular-nums text-card-foreground">
                {formatNumber(productsOverview.availableForSale)} / {formatNumber(productsOverview.uniqueCount)}
              </span>
            </div>
            {marginHint != null && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Margin hint</span>
                <span className="font-medium tabular-nums text-card-foreground">{formatCurrency(marginHint)}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border-border bg-card shadow-sm md:col-span-2 xl:col-span-1">
        <CardContent className="p-4">
          {factoryId ? (
            <ActiveOrdersPanel scope={{ factoryId }} minimal compact />
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-card-foreground">Active orders</span>
                <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  select factory
                </span>
              </div>
              <div className="space-y-2 rounded-lg border border-dashed border-border bg-muted/20 p-3">
                <div className="h-3.5 w-2/3 rounded bg-muted" />
                <div className="h-3.5 w-1/2 rounded bg-muted" />
                <div className="h-3.5 w-3/4 rounded bg-muted" />
              </div>
              <p className="text-xs text-muted-foreground">Select a factory to see running orders.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StorageOverviewPanel;
