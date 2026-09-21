/**
 * Spread emphasis tab switcher — primary section navigation.
 *
 * Prefer this over default shadcn TabsList/TabsTrigger for top-level tab bars.
 * See `.cursor/rules/emphasis-tab-switcher.mdc`.
 *
 * Usage:
 *   <EmphasisTabsProvider value={tabValue}>
 *     <Tabs value={tabValue} onValueChange={...}>
 *       <EmphasisTabsList>...</EmphasisTabsList>
 *       <EmphasisTabPanel panelKey={tabValue}>...</EmphasisTabPanel>
 *     </Tabs>
 *   </EmphasisTabsProvider>
 */
import * as React from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const PILL_SPRING = { type: 'spring' as const, stiffness: 420, damping: 32 };
const PANEL_TRANSITION = { duration: 0.15, ease: 'easeOut' as const };

const EMPHASIS_TAB_LIST_CLASS = cn(
  'gap-0.5 border border-border/60 bg-muted/30 p-1',
  'dark:border-border/40 dark:bg-[hsl(var(--nav-background))]/80',
);

const EMPHASIS_TAB_TRIGGER_CLASS = cn(
  'data-[state=inactive]:text-muted-foreground/75',
  'data-[state=active]:text-card-foreground',
  'hover:text-foreground',
  '[&[data-state=inactive]_svg]:text-muted-foreground/55',
  '[&[data-state=active]_svg]:text-brand-primary',
);

const EMPHASIS_TAB_PILL_CLASS =
  'rounded-md bg-card shadow-sm ring-1 ring-border/50 dark:ring-border/60';

interface EmphasisTabsContextValue {
  activeValue: string;
  layoutId: string;
}

const EmphasisTabsContext = React.createContext<EmphasisTabsContextValue | null>(null);

function useEmphasisTabsContext() {
  const ctx = React.useContext(EmphasisTabsContext);
  if (!ctx) {
    throw new Error('Emphasis tab components must be used within EmphasisTabsProvider');
  }
  return ctx;
}

function EmphasisTabsProvider({
  value,
  children,
  layoutId: layoutIdProp,
}: {
  value: string;
  children: React.ReactNode;
  /** Stable id preserves pill motion when provider remounts (header tab bars). */
  layoutId?: string;
}) {
  const reactId = React.useId();
  const layoutId = layoutIdProp ?? `emphasis-tabs-${reactId}`;

  const contextValue = React.useMemo(
    () => ({ activeValue: value, layoutId }),
    [value, layoutId],
  );

  return (
    <EmphasisTabsContext.Provider value={contextValue}>{children}</EmphasisTabsContext.Provider>
  );
}

const EmphasisTabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      'inline-flex h-10 w-full items-center rounded-lg p-1 text-muted-foreground',
      EMPHASIS_TAB_LIST_CLASS,
      className,
    )}
    {...props}
  />
));
EmphasisTabsList.displayName = TabsPrimitive.List.displayName;

const EmphasisTabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, children, value, ...props }, ref) => {
  const { activeValue, layoutId } = useEmphasisTabsContext();
  const isActive = value === activeValue;

  return (
    <TabsPrimitive.Trigger
      ref={ref}
      value={value}
      className={cn(
        'relative z-10 inline-flex h-8 min-w-0 flex-1 items-center justify-center whitespace-nowrap rounded-md px-4 text-center',
        'text-xs font-medium leading-none text-muted-foreground',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        'disabled:pointer-events-none disabled:opacity-50',
        'data-[state=active]:text-sm data-[state=active]:font-semibold',
        EMPHASIS_TAB_TRIGGER_CLASS,
        className,
      )}
      {...props}
    >
      {isActive ? (
        <motion.span
          layoutId={`${layoutId}-pill`}
          className={cn('absolute inset-0', EMPHASIS_TAB_PILL_CLASS)}
          transition={PILL_SPRING}
          aria-hidden
        />
      ) : null}
      <span className="relative z-10">{children}</span>
    </TabsPrimitive.Trigger>
  );
});
EmphasisTabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

function EmphasisTabPanel({
  panelKey,
  children,
  className,
}: {
  panelKey: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      key={panelKey}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={PANEL_TRANSITION}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export {
  EmphasisTabsProvider,
  EmphasisTabsList,
  EmphasisTabsTrigger,
  EmphasisTabPanel,
};
