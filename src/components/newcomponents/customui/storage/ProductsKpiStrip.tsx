import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation('inventory');
  const marginHint = useMemo(() => {
    if (productsOverview.totalSalesValue > 0 && productsOverview.totalCostValue >= 0) {
      return productsOverview.totalSalesValue - productsOverview.totalCostValue;
    }
    return null;
  }, [productsOverview.totalCostValue, productsOverview.totalSalesValue]);

  return (
    <div className={inventoryKpiGridClass}>
      <InventoryKpiCard
        title={t('productLines')}
        value={formatNumber(productsOverview.records)}
        icon={<Package className="h-4 w-4" />}
        footer={t('uniqueSkus', { count: formatNumber(productsOverview.uniqueCount) })}
        isLoading={isLoading}
      />
      <InventoryKpiCard
        title={t('totalUnits')}
        value={formatNumber(productsOverview.totalQty)}
        icon={<Layers className="h-4 w-4" />}
        footer={t('finishedOnHand')}
        isLoading={isLoading}
      />
      <InventoryKpiCard
        title={t('costValue')}
        value={formatCurrency(productsOverview.totalCostValue)}
        icon={<Tag className="h-4 w-4" />}
        footer={t('qtyTimesAvgCost')}
        isLoading={isLoading}
      />
      <InventoryKpiCard
        title={t('salesValue')}
        value={formatCurrency(productsOverview.totalSalesValue)}
        icon={<ShoppingBag className="h-4 w-4" />}
        footer={
          marginHint != null
            ? t('salesFooterMargin', {
                count: formatNumber(productsOverview.availableForSale),
                margin: formatCurrency(marginHint),
              })
            : t('salesFooterListed', { count: formatNumber(productsOverview.availableForSale) })
        }
        isLoading={isLoading}
      />
    </div>
  );
};

export default ProductsKpiStrip;
