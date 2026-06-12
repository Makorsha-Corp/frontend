import React from 'react';
import { TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Archive, Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import { appShellHeaderControlClass } from '@/components/newcomponents/customui/AppShellHeader';
import type { StorageTabSwitcherStyle } from './storageTabSwitcherStyles';

export type StorageContentTab = 'storage' | 'products';

interface StorageHeaderTabsProps {
  storageCount: number;
  productsCount: number;
  variant?: StorageTabSwitcherStyle;
}

const triggerBase =
  'gap-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background';

const styleConfig: Record<
  StorageTabSwitcherStyle,
  { list: string; trigger: string; showLabels: boolean; showCounts: boolean }
> = {
  segmented: {
    list: cn(appShellHeaderControlClass, 'rounded-md bg-muted p-1 text-muted-foreground'),
    trigger: cn(triggerBase, 'rounded-sm px-4 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm'),
    showLabels: true,
    showCounts: true,
  },
  underline: {
    list: cn(appShellHeaderControlClass, 'gap-0 rounded-none border-b border-border bg-transparent p-0 text-muted-foreground'),
    trigger: cn(
      triggerBase,
      'rounded-none border-b-2 border-transparent px-4 pb-2.5 pt-1 data-[state=active]:border-brand-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none'
    ),
    showLabels: true,
    showCounts: true,
  },
  ghost: {
    list: cn(appShellHeaderControlClass, 'gap-1 rounded-none bg-transparent p-0 text-muted-foreground'),
    trigger: cn(
      triggerBase,
      'rounded-md px-3 data-[state=active]:bg-muted data-[state=active]:text-foreground data-[state=active]:shadow-none'
    ),
    showLabels: true,
    showCounts: true,
  },
  outline: {
    list: cn(appShellHeaderControlClass, 'gap-2 rounded-none bg-transparent p-0 text-muted-foreground'),
    trigger: cn(
      triggerBase,
      'rounded-md border border-border bg-background px-3 shadow-none data-[state=active]:border-brand-primary/40 data-[state=active]:bg-brand-primary/5 data-[state=active]:text-foreground'
    ),
    showLabels: true,
    showCounts: true,
  },
  compact: {
    list: cn(appShellHeaderControlClass, 'gap-1 rounded-md bg-muted/50 p-0.5 text-muted-foreground'),
    trigger: cn(
      triggerBase,
      'rounded-sm px-2.5 text-xs data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm'
    ),
    showLabels: false,
    showCounts: true,
  },
};

const StorageHeaderTabs: React.FC<StorageHeaderTabsProps> = ({
  storageCount,
  productsCount,
  variant = 'underline',
}) => {
  const config = styleConfig[variant];

  const renderTrigger = (
    value: StorageContentTab,
    icon: React.ReactNode,
    label: string,
    count: number
  ) => (
    <TabsTrigger value={value} className={config.trigger} title={config.showLabels ? undefined : `${label} (${count})`}>
      {icon}
      {config.showLabels ? label : null}
      {config.showCounts ? (
        <span className={cn('tabular-nums', config.showLabels ? 'text-muted-foreground' : 'font-semibold')}>
          {config.showLabels ? `(${count})` : count}
        </span>
      ) : null}
    </TabsTrigger>
  );

  return (
    <TabsList className={config.list}>
      {renderTrigger('storage', <Archive className="h-4 w-4 shrink-0" />, 'Storage', storageCount)}
      {renderTrigger('products', <Package className="h-4 w-4 shrink-0" />, 'Products', productsCount)}
    </TabsList>
  );
};

export default StorageHeaderTabs;
