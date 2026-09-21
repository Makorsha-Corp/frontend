import React from 'react';
import type { LucideIcon } from 'lucide-react';

import { appShellHeaderControlClass } from '@/components/newcomponents/customui/AppShellHeader';
import {
  EmphasisTabsList,
  EmphasisTabsProvider,
  EmphasisTabsTrigger,
} from '@/components/newcomponents/customui/EmphasisTabSwitcher';
import { Tabs } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

export interface AppShellHeaderEmphasisTabItem {
  value: string;
  label: string;
  icon: LucideIcon;
}

export type AppShellHeaderEmphasisTabsWidth = 'help' | 'machines';

const TRIGGER_MIN_WIDTH: Record<
  AppShellHeaderEmphasisTabsWidth,
  { compact: string; default: string }
> = {
  help: { compact: 'min-w-[7.25rem]', default: 'min-w-[9.25rem]' },
  machines: { compact: 'min-w-[8.5rem]', default: 'min-w-[10rem]' },
};

export interface AppShellHeaderEmphasisTabsProps {
  value: string;
  onValueChange: (value: string) => void;
  tabs: AppShellHeaderEmphasisTabItem[];
  /** Stable id keeps the sliding pill animation when the header remounts (e.g. Machines hub). */
  layoutId: string;
  width?: AppShellHeaderEmphasisTabsWidth;
  className?: string;
  compact?: boolean;
}

const listClass = (compact: boolean, className?: string) =>
  cn(
    'w-auto shrink-0',
    compact ? cn(appShellHeaderControlClass, '!h-9') : '!h-11',
    className,
  );

const triggerClass = (compact: boolean, minWidth: { compact: string; default: string }) =>
  cn(
    'inline-flex flex-none items-center justify-center rounded-md !h-9',
    '[&>span]:inline-flex [&>span]:items-center [&>span]:justify-center [&>span]:gap-1.5 [&>span]:leading-none',
    '[&_svg]:block [&_svg]:shrink-0',
    compact
      ? cn(
          minWidth.compact,
          'px-2 text-sm font-medium leading-none data-[state=active]:text-sm data-[state=active]:font-semibold',
        )
      : cn(
          minWidth.default,
          'px-4 text-base font-medium leading-none tracking-tight data-[state=active]:text-base data-[state=active]:font-semibold',
        ),
  );

const iconClass = (compact: boolean) => cn('shrink-0', compact ? 'h-4 w-4' : 'h-5 w-5');

const AppShellHeaderEmphasisTabs: React.FC<AppShellHeaderEmphasisTabsProps> = ({
  value,
  onValueChange,
  tabs,
  layoutId,
  width = 'help',
  className,
  compact = false,
}) => {
  const minWidth = TRIGGER_MIN_WIDTH[width];

  return (
    <EmphasisTabsProvider value={value} layoutId={layoutId}>
      <Tabs value={value} onValueChange={onValueChange}>
        <EmphasisTabsList className={listClass(compact, className)}>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <EmphasisTabsTrigger
                key={tab.value}
                value={tab.value}
                className={triggerClass(compact, minWidth)}
              >
                <Icon className={iconClass(compact)} aria-hidden />
                {tab.label}
              </EmphasisTabsTrigger>
            );
          })}
        </EmphasisTabsList>
      </Tabs>
    </EmphasisTabsProvider>
  );
};

export default AppShellHeaderEmphasisTabs;
