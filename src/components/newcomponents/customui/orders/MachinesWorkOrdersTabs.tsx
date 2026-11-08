import React, { useMemo } from 'react';
import { Cog, Wrench } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import AppShellHeaderEmphasisTabs from '@/components/newcomponents/customui/AppShellHeaderEmphasisTabs';

export interface MachinesWorkOrdersTabsProps {
  activeTab: 'machines' | 'workOrders';
  onTabChange: (tab: 'machines' | 'workOrders') => void;
  className?: string;
  /** Slightly narrower triggers on mobile header row */
  compact?: boolean;
}

const MachinesWorkOrdersTabs: React.FC<MachinesWorkOrdersTabsProps> = ({
  activeTab,
  onTabChange,
  className,
  compact = false,
}) => {
  const { t: tNav } = useTranslation('nav');
  const { t: tOrders } = useTranslation('orders');

  const tabs = useMemo(
    () => [
      { value: 'machines', label: tNav('machines'), icon: Cog },
      { value: 'workOrders', label: tOrders('workTitle'), icon: Wrench },
    ],
    [tNav, tOrders],
  );

  return (
    <div data-help-tour="work-orders.tab">
      <AppShellHeaderEmphasisTabs
        value={activeTab}
        onValueChange={(nextValue) => onTabChange(nextValue as 'machines' | 'workOrders')}
        tabs={tabs}
        layoutId="machines-hub-tabs"
        className={className}
        compact={compact}
      />
    </div>
  );
};

export default MachinesWorkOrdersTabs;
