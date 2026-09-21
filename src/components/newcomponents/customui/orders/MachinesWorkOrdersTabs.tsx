import React from 'react';
import { Cog, Wrench } from 'lucide-react';

import AppShellHeaderEmphasisTabs from '@/components/newcomponents/customui/AppShellHeaderEmphasisTabs';

const MACHINES_HUB_TABS = [
  { value: 'machines', label: 'Machines', icon: Cog },
  { value: 'workOrders', label: 'Work Orders', icon: Wrench },
] as const;

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
}) => (
  <AppShellHeaderEmphasisTabs
    value={activeTab}
    onValueChange={(nextValue) => onTabChange(nextValue as 'machines' | 'workOrders')}
    tabs={[...MACHINES_HUB_TABS]}
    layoutId="machines-hub-tabs"
    width="machines"
    className={className}
    compact={compact}
  />
);

export default MachinesWorkOrdersTabs;
