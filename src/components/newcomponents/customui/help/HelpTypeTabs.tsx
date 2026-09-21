import React from 'react';
import { LifeBuoy, MessageSquare } from 'lucide-react';

import { appShellHeaderControlClass } from '@/components/newcomponents/customui/AppShellHeader';
import {
  EmphasisTabsList,
  EmphasisTabsProvider,
  EmphasisTabsTrigger,
} from '@/components/newcomponents/customui/EmphasisTabSwitcher';
import { Tabs } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import type { HelpTicketType } from '@/types/helpTicket';

interface HelpTypeTabsProps {
  value: HelpTicketType;
  onValueChange: (value: HelpTicketType) => void;
  className?: string;
  compact?: boolean;
}

const listClass = (compact: boolean, className?: string) =>
  cn(
    'w-auto shrink-0 gap-0.5 border border-border bg-muted p-1 dark:bg-muted/90',
    compact ? cn(appShellHeaderControlClass, '!h-9') : '!h-11',
    className,
  );

const triggerClass = (compact: boolean) =>
  cn(
    'inline-flex flex-none items-center justify-center rounded-md !h-9',
    '[&>span]:inline-flex [&>span]:items-center [&>span]:justify-center [&>span]:gap-1.5 [&>span]:leading-none',
    'transition-[color,font-weight] hover:text-muted-foreground',
    'data-[state=inactive]:bg-transparent data-[state=inactive]:text-muted-foreground/70',
    'data-[state=active]:!text-brand-primary',
    '[&>span[aria-hidden=true]]:rounded-md [&>span[aria-hidden=true]]:border',
    '[&>span[aria-hidden=true]]:!border-brand-primary/30 [&>span[aria-hidden=true]]:!bg-brand-primary/12',
    'dark:[&>span[aria-hidden=true]]:!border-brand-primary/40 dark:[&>span[aria-hidden=true]]:!bg-brand-primary/18',
    '[&>span[aria-hidden=true]]:!shadow-md',
    '[&[data-state=inactive]_svg]:text-muted-foreground/55',
    '[&[data-state=active]_svg]:text-brand-primary [&_svg]:block [&_svg]:shrink-0',
    compact
      ? 'min-w-[7.25rem] px-2 text-sm font-medium leading-none data-[state=active]:text-sm data-[state=active]:font-semibold'
      : cn(
          'min-w-[9.25rem] px-4',
          'text-base font-medium leading-none tracking-tight data-[state=active]:text-base data-[state=active]:font-semibold',
        ),
  );

const iconClass = (compact: boolean) => cn('shrink-0', compact ? 'h-4 w-4' : 'h-5 w-5');

const HelpTypeTabs: React.FC<HelpTypeTabsProps> = ({
  value,
  onValueChange,
  className,
  compact = false,
}) => (
  <EmphasisTabsProvider value={value}>
    <Tabs value={value} onValueChange={(nextValue) => onValueChange(nextValue as HelpTicketType)}>
      <EmphasisTabsList className={listClass(compact, className)}>
        <EmphasisTabsTrigger value="support" className={triggerClass(compact)}>
          <LifeBuoy className={iconClass(compact)} aria-hidden />
          Support
        </EmphasisTabsTrigger>
        <EmphasisTabsTrigger value="feedback" className={triggerClass(compact)}>
          <MessageSquare className={iconClass(compact)} aria-hidden />
          Feedback
        </EmphasisTabsTrigger>
      </EmphasisTabsList>
    </Tabs>
  </EmphasisTabsProvider>
);

export default HelpTypeTabs;
