import React from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Cog, Wrench } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface MachinesWorkOrdersTabsProps {
  activeTab: 'machines' | 'workOrders';
  onTabChange: (tab: 'machines' | 'workOrders') => void;
  className?: string;
}

const MachinesWorkOrdersTabs: React.FC<MachinesWorkOrdersTabsProps> = ({
  activeTab,
  onTabChange,
  className,
}) => (
  <Tabs value={activeTab} onValueChange={(v) => onTabChange(v as 'machines' | 'workOrders')}>
    <TabsList
      className={cn(
        'h-11 gap-0.5 bg-muted/80 p-1 ring-1 ring-border/60',
        className,
      )}
    >
      <TabsTrigger
        value="machines"
        className="min-w-[9.5rem] gap-2 px-4 py-2 text-base font-semibold data-[state=active]:shadow-sm [&[data-state=active]_svg]:text-brand-primary"
      >
        <Cog className="h-[18px] w-[18px] shrink-0" />
        Machines
      </TabsTrigger>
      <TabsTrigger
        value="workOrders"
        className="min-w-[9.5rem] gap-2 px-4 py-2 text-base font-semibold data-[state=active]:shadow-sm [&[data-state=active]_svg]:text-brand-primary"
      >
        <Wrench className="h-[18px] w-[18px] shrink-0" />
        Work Orders
      </TabsTrigger>
    </TabsList>
  </Tabs>
);

export default MachinesWorkOrdersTabs;
