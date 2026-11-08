import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const CONTENT_FADE = { duration: 0.15, ease: 'easeOut' as const };

/** Bordered shell for collapsed trigger(s). */
export const transformingAddRowCollapsedShellClassName =
  'h-10 shrink-0 overflow-hidden rounded-md border border-input bg-background';

/** Inline add fields row (expanded state and always-visible forms). */
export const transformingAddRowFieldsClassName =
  'flex min-h-10 flex-wrap items-end gap-2';

export function TransformingAddRowFields({
  className,
  children,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div className={cn(transformingAddRowFieldsClassName, className)} {...props}>
      {children}
    </div>
  );
}

export interface TransformingAddRowProps {
  expanded: boolean;
  /** Used with default single trigger button. */
  onExpand?: () => void;
  triggerLabel?: string;
  /** Replaces default trigger (e.g. split Add waste | Add byproduct). */
  collapsedContent?: React.ReactNode;
  collapsedClassName?: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Collapsed full-width trigger bar → expanded inline fields. Keeps a stable min-h-10 slot.
 */
export function TransformingAddRow({
  expanded,
  onExpand,
  triggerLabel = 'Add item',
  collapsedContent,
  collapsedClassName,
  children,
  className,
}: TransformingAddRowProps) {
  return (
    <div className={cn('min-h-10 shrink-0', className)}>
      <AnimatePresence mode="wait" initial={false}>
        {expanded ? (
          <motion.div
            key="expanded"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={CONTENT_FADE}
            className={transformingAddRowFieldsClassName}
          >
            {children}
          </motion.div>
        ) : (
          <motion.div
            key="collapsed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={CONTENT_FADE}
            className={cn(transformingAddRowCollapsedShellClassName, collapsedClassName)}
          >
            {collapsedContent ?? (
              <Button
                type="button"
                variant="ghost"
                className="h-full w-full rounded-none border-0 py-0 shadow-none hover:bg-accent hover:text-accent-foreground"
                onClick={onExpand}
              >
                {triggerLabel}
              </Button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
