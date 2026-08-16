import React from 'react';
import { Tabs } from '@/components/ui/tabs';
import { Cog, Wrench } from 'lucide-react';
import {
  EmphasisTabsList,
  EmphasisTabsProvider,
  EmphasisTabsTrigger,
} from '@/components/newcomponents/customui/EmphasisTabSwitcher';
import { appShellHeaderControlClass } from '@/components/newcomponents/customui/AppShellHeader';
import { cn } from '@/lib/utils';

export interface MachinesWorkOrdersTabsProps {
  activeTab: 'machines' | 'workOrders';
  onTabChange: (tab: 'machines' | 'workOrders') => void;
  className?: string;
  /** Slightly narrower triggers on mobile header row */
  compact?: boolean;
}

const listClass = (compact: boolean, className?: string) =>
  cn(
    'w-auto shrink-0 gap-0.5 border border-border bg-muted/40 p-1 dark:bg-muted/60',
    compact ? cn(appShellHeaderControlClass, '!h-9') : '!h-11',
    className,
  );

const triggerClass = (compact: boolean) =>
  cn(
    'inline-flex flex-none items-center justify-center rounded-md',
    '[&>span]:inline-flex [&>span]:items-center [&>span]:justify-center [&>span]:gap-1.5',
    'text-foreground/50 transition-[color,font-weight]',
    'hover:text-foreground/70',
    'data-[state=inactive]:bg-transparent',
    'data-[state=active]:text-card-foreground dark:data-[state=active]:text-foreground',
    '[&>span[aria-hidden=true]]:rounded-md [&>span[aria-hidden=true]]:border [&>span[aria-hidden=true]]:border-border',
    '[&>span[aria-hidden=true]]:bg-background [&>span[aria-hidden=true]]:shadow-sm',
    '[&[data-state=inactive]_svg]:text-foreground/45',
    '[&[data-state=active]_svg]:text-brand-primary',
    compact
      ? 'min-w-[7rem] px-2 text-sm font-medium leading-none data-[state=active]:text-sm data-[state=active]:font-semibold'
      : cn(
          'min-w-[10rem] px-4 !h-9',
          'text-base font-medium leading-none tracking-tight lg:text-lg',
          'data-[state=active]:text-base data-[state=active]:font-semibold lg:data-[state=active]:text-lg',
        ),
  );

const iconClass = (compact: boolean) => cn('shrink-0', compact ? 'h-4 w-4' : 'h-5 w-5');

const MachinesWorkOrdersTabs: React.FC<MachinesWorkOrdersTabsProps> = ({
  activeTab,
  onTabChange,
  className,
  compact = false,
}) => (
  <EmphasisTabsProvider value={activeTab}>
    <Tabs value={activeTab} onValueChange={(v) => onTabChange(v as 'machines' | 'workOrders')}>
      <EmphasisTabsList className={listClass(compact, className)}>
        <EmphasisTabsTrigger value="machines" className={triggerClass(compact)}>
          <Cog className={iconClass(compact)} aria-hidden />
          Machines
        </EmphasisTabsTrigger>
        <EmphasisTabsTrigger value="workOrders" className={triggerClass(compact)}>
          <Wrench className={iconClass(compact)} aria-hidden />
          Work Orders
        </EmphasisTabsTrigger>
      </EmphasisTabsList>
    </Tabs>
  </EmphasisTabsProvider>
);

export default MachinesWorkOrdersTabs;
