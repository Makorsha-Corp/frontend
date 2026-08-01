import React, { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import {
  Package,
  Layers,
  Tag,
  ShoppingBag,
  Loader2,
} from 'lucide-react';
import {
  formatCurrency,
  formatNumber,
  type ProductsOverviewStats,
} from './storageConstants';

interface ProductsKpiStripProps {
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

const kpiGridClass = 'grid shrink-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4';

const ProductsKpiStrip: React.FC<ProductsKpiStripProps> = ({ productsOverview, isLoading }) => {
  const marginHint = useMemo(() => {
    if (productsOverview.totalSalesValue > 0 && productsOverview.totalCostValue >= 0) {
      return productsOverview.totalSalesValue - productsOverview.totalCostValue;
    }
    return null;
  }, [productsOverview.totalCostValue, productsOverview.totalSalesValue]);

  return (
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
    </div>
  );
};

export default ProductsKpiStrip;
