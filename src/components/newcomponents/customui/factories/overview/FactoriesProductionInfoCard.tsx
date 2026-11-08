import React from 'react';
import { useTranslation } from 'react-i18next';
import { Package } from 'lucide-react';
import FactoryModuleInfoCard, {
  factoryModuleInfoCardBodyClasses,
} from '@/components/newcomponents/customui/factories/overview/FactoryModuleInfoCard';
import { factoryProductionHubLink } from '@/pages/newpages/factories/factoriesOverviewConstants';
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
  const { t } = useTranslation(['factories', 'production', 'common']);
  const href = factoryProductionHubLink(factoryFilter, {
    batchesTab: snapshot.inProgressCount > 0,
  });
  const hasAlert = snapshot.inProgressCount > 0;
  const lineLabel =
    snapshot.activeLineCount === 1
      ? t('oneActiveLine')
      : t('activeLinesCount', { count: snapshot.activeLineCount });
  const body = factoryModuleInfoCardBodyClasses(CARD_VARIANT);

  return (
    <FactoryModuleInfoCard
      title={t('title', { ns: 'production' })}
      icon={Package}
      href={href}
      scopeLabel={scopeLabel}
      headline={loading ? '—' : snapshot.inProgressCount}
      subtitle={loading ? t('loading', { ns: 'common' }) : lineLabel}
      variant={CARD_VARIANT}
      hasAlert={hasAlert}
      alertHint={hasAlert ? t('inProgressBadge', { count: snapshot.inProgressCount }) : undefined}
      compactHeader
    >
      <div className="space-y-2 text-sm">
        {snapshot.draftCount > 0 ? (
          <div className="flex items-center justify-between gap-2">
            <span className={body.bodyLabel}>{t('draftBatches')}</span>
            <span className={cn('font-semibold tabular-nums', body.bodyValue)}>
              {snapshot.draftCount}
            </span>
          </div>
        ) : null}

        {snapshot.inProgressBatches.length > 0 ? (
          <div>
            <p className={cn('mb-1.5 text-[11px] font-medium uppercase tracking-wide', body.bodySectionLabel)}>
              {t('inProgressSection')}
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
          <p className={cn('text-xs', body.bodyMuted)}>{t('noBatchesInProgress')}</p>
        )}
      </div>
    </FactoryModuleInfoCard>
  );
};

export default FactoriesProductionInfoCard;
