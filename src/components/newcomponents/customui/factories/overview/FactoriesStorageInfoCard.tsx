import React from 'react';
import { Warehouse } from 'lucide-react';
import FactoryModuleInfoCard, {
  factoryModuleInfoCardBodyClasses,
} from '@/components/newcomponents/customui/factories/overview/FactoryModuleInfoCard';
import { formatOverviewCurrency } from '@/components/newcomponents/customui/orders/overview/ordersOverviewConstants';
import { factoryHubLink } from '@/pages/newpages/factories/factoriesOverviewConstants';
import type { StorageCardSnapshot } from '@/pages/newpages/factories/factoriesOverviewData';
import { cn } from '@/lib/utils';

interface FactoriesStorageInfoCardProps {
  scopeLabel: string;
  factoryFilter: string;
  snapshot: StorageCardSnapshot;
  loading?: boolean;
}

const CARD_VARIANT = 'primaryHover' as const;

const FactoriesStorageInfoCard: React.FC<FactoriesStorageInfoCardProps> = ({
  scopeLabel,
  factoryFilter,
  snapshot,
  loading,
}) => {
  const href = factoryHubLink('/storage', factoryFilter);
  const unitLabel =
    snapshot.totalUnits === 1 ? '1 unit in storage' : `${snapshot.totalUnits.toLocaleString()} units in storage`;
  const body = factoryModuleInfoCardBodyClasses(CARD_VARIANT);

  return (
    <FactoryModuleInfoCard
      title="Storage"
      icon={Warehouse}
      href={href}
      scopeLabel={scopeLabel}
      headline={loading ? '—' : snapshot.skusWithStock}
      subtitle={loading ? 'Loading…' : unitLabel}
      variant={CARD_VARIANT}
      compactHeader
    >
      <div className="space-y-2 text-sm">
        <div className="flex items-center justify-between gap-2">
          <span className={body.bodyLabel}>Est. value</span>
          <span className={cn('font-semibold tabular-nums', body.bodyValue)}>
            {loading ? '—' : formatOverviewCurrency(snapshot.estimatedValue)}
          </span>
        </div>
        {snapshot.topItems.length > 0 ? (
          <div>
            <p className={cn('mb-1.5 text-[11px] font-medium uppercase tracking-wide', body.bodySectionLabel)}>
              Top stocked
            </p>
            <ul className="space-y-1">
              {snapshot.topItems.map((item, index) => (
                <li
                  key={`${item.name}-${index}`}
                  className="flex items-center justify-between gap-2 text-xs"
                >
                  <span className={cn('min-w-0 truncate font-medium', body.bodyValue)}>{item.name}</span>
                  <span className={cn('shrink-0 tabular-nums', body.bodyMuted)}>
                    {item.qty.toLocaleString()}
                    {item.unit ? ` ${item.unit}` : ''}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className={cn('text-xs', body.bodyMuted)}>No stocked SKUs in this scope.</p>
        )}
      </div>
    </FactoryModuleInfoCard>
  );
};

export default FactoriesStorageInfoCard;
