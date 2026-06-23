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
import { prefersReducedMotion } from '@/lib/themeTransition';

const PILL_SPRING = { type: 'spring' as const, stiffness: 420, damping: 32 };
const PANEL_TRANSITION = { duration: 0.15, ease: 'easeOut' as const };

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
}: {
  value: string;
  children: React.ReactNode;
}) {
  const reactId = React.useId();
  const layoutId = `emphasis-tabs-${reactId}`;

  const contextValue = React.useMemo(
    () => ({ activeValue: value, layoutId }),
    [value, layoutId]
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
      'inline-flex h-10 w-full items-center gap-1 rounded-lg bg-muted/40 p-1 text-muted-foreground',
      className
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
  const reducedMotion = prefersReducedMotion();

  return (
    <TabsPrimitive.Trigger
      ref={ref}
      value={value}
      className={cn(
        'relative z-10 inline-flex h-8 min-w-0 flex-1 items-center justify-center whitespace-nowrap rounded-md px-4 text-center',
        'text-xs font-medium leading-none text-muted-foreground',
        'transition-[color,font-weight] duration-200',
        'hover:text-foreground',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        'disabled:pointer-events-none disabled:opacity-50',
        'data-[state=active]:text-sm data-[state=active]:font-semibold data-[state=active]:text-card-foreground',
        className
      )}
      {...props}
    >
      {isActive ? (
        <motion.span
          layoutId={`${layoutId}-pill`}
          className="absolute inset-0 rounded-md bg-card shadow-sm"
          transition={reducedMotion ? { duration: 0 } : PILL_SPRING}
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
  const reducedMotion = prefersReducedMotion();

  return (
    <motion.div
      key={panelKey}
      initial={reducedMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={reducedMotion ? { duration: 0 } : PANEL_TRANSITION}
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
