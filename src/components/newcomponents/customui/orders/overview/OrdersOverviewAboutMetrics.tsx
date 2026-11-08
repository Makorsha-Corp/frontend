import React from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown } from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { API_LIMITS } from '@/constants/apiLimits';

interface OrdersOverviewAboutMetricsProps {
  hubOrdersMayTruncate?: boolean;
}

const OrdersOverviewAboutMetrics: React.FC<OrdersOverviewAboutMetricsProps> = ({
  hubOrdersMayTruncate,
}) => {
  const { t } = useTranslation('orders');
  const maxOrders = 10 * API_LIMITS.ORDER_HUB_LIST_MAX;
  const pageSize = API_LIMITS.ORDER_HUB_LIST_MAX;

  return (
    <Collapsible className="rounded-lg border border-border bg-muted/20">
      <CollapsibleTrigger className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
        {t('overviewAboutTitle')}
        <ChevronDown className="h-4 w-4 shrink-0 transition-transform [[data-state=open]_&]:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-2 px-4 pb-4 text-xs text-muted-foreground">
        <p>
          <strong className="font-medium text-foreground/80">{t('overviewAboutDateFactoryStrong')}</strong>
          {t('overviewAboutDateFactoryBody')}
        </p>
        <p>
          <strong className="font-medium text-foreground/80">{t('overviewAboutPendingStrong')}</strong>
          {t('overviewAboutPendingBody')}
        </p>
        <p>
          <strong className="font-medium text-foreground/80">{t('overviewAboutOverdueStrong')}</strong>
          {t('overviewAboutOverdueBody')}
        </p>
        <p>
          {t('overviewAboutScopeLead')}
          <strong className="font-medium text-foreground/80">{t('overviewAboutScopeStrong')}</strong>
          {t('overviewAboutScopeBody')}
        </p>
        {hubOrdersMayTruncate ? (
          <p>
            <strong className="font-medium text-foreground/80">{t('overviewAboutTruncateStrong')}</strong>{' '}
            {t('overviewAboutTruncateBody', { maxOrders, pageSize })}
          </p>
        ) : null}
      </CollapsibleContent>
    </Collapsible>
  );
};

export default OrdersOverviewAboutMetrics;
