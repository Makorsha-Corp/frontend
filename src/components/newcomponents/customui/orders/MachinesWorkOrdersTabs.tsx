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
        'h-9 gap-0.5 bg-muted/80 p-1 ring-1 ring-border/60',
        className,
      )}
    >
      <TabsTrigger
        value="machines"
        className="min-w-[8rem] gap-1.5 px-3 py-1.5 text-sm font-semibold data-[state=active]:shadow-sm [&[data-state=active]_svg]:text-brand-primary"
      >
        <Cog className="h-4 w-4 shrink-0" />
        Machines
      </TabsTrigger>
      <TabsTrigger
        value="workOrders"
        className="min-w-[8rem] gap-1.5 px-3 py-1.5 text-sm font-semibold data-[state=active]:shadow-sm [&[data-state=active]_svg]:text-brand-primary"
      >
        <Wrench className="h-4 w-4 shrink-0" />
        Work Orders
      </TabsTrigger>
    </TabsList>
  </Tabs>
);

export default MachinesWorkOrdersTabs;
