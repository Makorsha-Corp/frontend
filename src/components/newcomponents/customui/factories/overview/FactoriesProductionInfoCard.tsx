import React from 'react';
import { Package } from 'lucide-react';
import FactoryModuleInfoCard, {
  factoryModuleInfoCardBodyClasses,
} from '@/components/newcomponents/customui/factories/overview/FactoryModuleInfoCard';
import { factoryHubLink } from '@/pages/newpages/factories/factoriesOverviewConstants';
import type { ProductionCardSnapshot } from '@/pages/newpages/factories/factoriesOverviewData';
import { cn } from '@/lib/utils';

interface FactoriesProductionInfoCardProps {
  scopeLabel: string;
  factoryFilter: string;
  snapshot: ProductionCardSnapshot;
  loading?: boolean;
}

const CARD_VARIANT = 'accent' as const;

const FactoriesProductionInfoCard: React.FC<FactoriesProductionInfoCardProps> = ({
  scopeLabel,
  factoryFilter,
  snapshot,
  loading,
}) => {
  const href = factoryHubLink('/production', factoryFilter);
  const hasAlert = snapshot.inProgressCount > 0;
  const lineLabel =
    snapshot.activeLineCount === 1
      ? '1 active line'
      : `${snapshot.activeLineCount} active lines`;
  const body = factoryModuleInfoCardBodyClasses(CARD_VARIANT);

  return (
    <FactoryModuleInfoCard
      title="Production"
      icon={Package}
      href={href}
      scopeLabel={scopeLabel}
      headline={loading ? '—' : snapshot.inProgressCount}
      subtitle={loading ? 'Loading…' : lineLabel}
      variant={CARD_VARIANT}
      hasAlert={hasAlert}
      alertHint={hasAlert ? `${snapshot.inProgressCount} in progress` : undefined}
      compactHeader
    >
      <div className="space-y-2 text-sm">
        {snapshot.draftCount > 0 ? (
          <div className="flex items-center justify-between gap-2">
            <span className={body.bodyLabel}>Draft batches</span>
            <span className={cn('font-semibold tabular-nums', body.bodyValue)}>
              {snapshot.draftCount}
            </span>
          </div>
        ) : null}

        {snapshot.inProgressBatches.length > 0 ? (
          <div>
            <p className={cn('mb-1.5 text-[11px] font-medium uppercase tracking-wide', body.bodySectionLabel)}>
              In progress
            </p>
            <ul className="space-y-1">
              {snapshot.inProgressBatches.map((batch) => (
                <li
                  key={batch.batchNumber}
                  className={cn('truncate rounded-md border px-2 py-1 text-xs', body.bodyListItem)}
                >
                  <span className="font-medium">{batch.batchNumber}</span>
                  {batch.lineName ? (
                    <span className={cn('mt-0.5 block truncate text-[10px]', body.bodyMuted)}>
                      {batch.lineName}
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className={cn('text-xs', body.bodyMuted)}>No batches in progress.</p>
        )}
      </div>
    </FactoryModuleInfoCard>
  );
};

export default FactoriesProductionInfoCard;
