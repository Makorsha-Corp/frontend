import React, { useMemo } from 'react';
import { Package, Layers, Tag, ShoppingBag } from 'lucide-react';
import InventoryKpiCard, { inventoryKpiGridClass } from './InventoryKpiCard';
import {
  formatCurrency,
  formatNumber,
  type ProductsOverviewStats,
} from './storageConstants';

interface ProductsKpiStripProps {
  productsOverview: ProductsOverviewStats;
  isLoading?: boolean;
}

const ProductsKpiStrip: React.FC<ProductsKpiStripProps> = ({ productsOverview, isLoading }) => {
  const marginHint = useMemo(() => {
    if (productsOverview.totalSalesValue > 0 && productsOverview.totalCostValue >= 0) {
      return productsOverview.totalSalesValue - productsOverview.totalCostValue;
    }
    return null;
  }, [productsOverview.totalCostValue, productsOverview.totalSalesValue]);

  return (
    <div className={inventoryKpiGridClass}>
      <InventoryKpiCard
        title="Product lines"
        value={formatNumber(productsOverview.records)}
        icon={<Package className="h-4 w-4" />}
        footer={`${formatNumber(productsOverview.uniqueCount)} unique SKUs`}
        isLoading={isLoading}
      />
      <InventoryKpiCard
        title="Total units"
        value={formatNumber(productsOverview.totalQty)}
        icon={<Layers className="h-4 w-4" />}
        footer="Finished goods on hand"
        isLoading={isLoading}
      />
      <InventoryKpiCard
        title="Cost value"
        value={formatCurrency(productsOverview.totalCostValue)}
        icon={<Tag className="h-4 w-4" />}
        footer="Qty × average cost"
        isLoading={isLoading}
      />
      <InventoryKpiCard
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
