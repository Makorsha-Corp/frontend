import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
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
import { translateInventoryType } from './inventoryTypeLabel';

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
  const { t } = useTranslation('inventory');
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
    return t('unitsSuffix', {
      qty: `${translateInventoryType(top.type, t)}: ${formatNumber(top.totalQty)}`,
    });
  }, [storageOverview.byType, t]);

  const factoryLabel = factoryId != null ? factoryLabels[factoryId] : null;
  const { count, isLoading: ordersLoading, isError: ordersError } = useStorageActiveOrders(
    factoryId,
    factoryIds,
  );

  const activeOrdersFooter =
    count === 0
      ? factoryId == null
        ? t('noActiveOrdersWorkspace')
        : t('noActiveOrders')
      : factoryId == null
        ? t('allFactoriesClick')
        : t('clickToViewOrders');

  return (
    <>
      <div className={storageKpiGridClass}>
        <InventoryKpiCard
          title={t('lineItems')}
          value={formatNumber(storageOverview.records)}
          icon={<Archive className="h-4 w-4" />}
          footer={t('lineItemsFooter')}
          isLoading={isLoading}
        />
        <InventoryKpiCard
          title={t('totalUnits')}
          value={formatNumber(storageOverview.totalQty)}
          icon={<Layers className="h-4 w-4" />}
          footer={topStorageType ?? t('acrossTypes')}
          isLoading={isLoading}
        />
        <InventoryKpiCard
          title={t('estimatedValue')}
          value={formatCurrency(storageOverview.estimatedValue)}
          icon={<DollarSign className="h-4 w-4" />}
          footer={t('qtyTimesAvgPrice')}
          isLoading={isLoading}
        />
        <InventoryKpiCard
          title={t('uniqueItems')}
          value={formatNumber(uniqueStorageItems)}
          icon={<Hash className="h-4 w-4" />}
          footer={t('typesTracked', { count: INVENTORY_TYPES.length })}
          isLoading={isLoading}
        />
        <InventoryKpiCard
          title={t('activeOrders')}
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
