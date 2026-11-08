import React from 'react';
import { useTranslation } from 'react-i18next';
import { Layers, LayoutDashboard, Settings2 } from 'lucide-react';

import { appShellHeaderControlClass } from '@/components/newcomponents/customui/AppShellHeader';
import {
  EmphasisTabsList,
  EmphasisTabsTrigger,
} from '@/components/newcomponents/customui/EmphasisTabSwitcher';
import { cn } from '@/lib/utils';

export type ProductionPageTab = 'overview' | 'setup' | 'batches';

export const PRODUCTION_PAGE_TABS = [
  { value: 'overview' as const, labelKey: 'tabProduction', icon: LayoutDashboard },
  { value: 'setup' as const, labelKey: 'tabSetup', icon: Settings2 },
  { value: 'batches' as const, labelKey: 'tabBatches', icon: Layers },
];

export interface ProductionPageHeaderTabListProps {
  compact?: boolean;
  className?: string;
}

/** Render inside Radix `Tabs` + `EmphasisTabsProvider` (see ProductionPage). */
export const ProductionPageHeaderTabList: React.FC<ProductionPageHeaderTabListProps> = ({
  compact = false,
  className,
}) => {
  const { t } = useTranslation('production');
  const minWidth = compact ? 'min-w-[5.5rem]' : 'min-w-[7.25rem]';

  return (
    <EmphasisTabsList
      className={cn(
        'w-auto shrink-0',
        compact ? cn(appShellHeaderControlClass, '!h-9') : '!h-9 !p-0.5',
        className,
      )}
    >
      {PRODUCTION_PAGE_TABS.map((tab) => {
        const Icon = tab.icon;
        return (
          <EmphasisTabsTrigger
            key={tab.value}
            value={tab.value}
            className={cn(
              'inline-flex flex-none items-center justify-center rounded-md',
              compact ? '!h-9' : '!h-8',
              '[&>span]:inline-flex [&>span]:items-center [&>span]:justify-center [&>span]:gap-1.5 [&>span]:leading-none',
              '[&_svg]:block [&_svg]:shrink-0',
              minWidth,
              compact
                ? 'px-2 text-sm font-medium leading-none data-[state=active]:text-sm data-[state=active]:font-semibold'
                : 'px-3 text-base font-medium leading-none tracking-tight data-[state=active]:text-base data-[state=active]:font-semibold',
            )}
          >
            <Icon className={cn('shrink-0', compact ? 'h-4 w-4' : 'h-5 w-5')} aria-hidden />
            {t(tab.labelKey)}
          </EmphasisTabsTrigger>
        );
      })}
    </EmphasisTabsList>
  );
};

export default ProductionPageHeaderTabList;
