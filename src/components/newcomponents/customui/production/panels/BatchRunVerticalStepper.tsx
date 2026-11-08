import React from 'react';
import { cn } from '@/lib/utils';
import type { ProductionBatchStageLog } from '@/types/production';
import { Loader2 } from 'lucide-react';

const STATUS_DOT: Record<string, string> = {
  pending: 'bg-muted-foreground',
  in_progress: 'bg-brand-primary',
  completed: 'bg-emerald-600 dark:bg-emerald-500',
  skipped: 'bg-amber-600 dark:bg-amber-500',
};

const stepCircleClass = (selected: boolean) =>
  cn(
    'relative isolate flex shrink-0 items-center justify-center rounded-full border text-xs font-semibold tabular-nums bg-card shadow-sm',
    selected ? 'border-brand-primary text-foreground' : 'border-border text-muted-foreground',
  );

const statusDotClass = (dotClass: string) =>
  cn('absolute -bottom-px -right-px h-2.5 w-2.5 rounded-full border-2 border-card', dotClass);

export interface BatchRunVerticalStepperProps {
  stageLogs: ProductionBatchStageLog[];
  loading?: boolean;
  selectedLogId: number | null;
  onSelect: (logId: number) => void;
  orientation?: 'vertical' | 'horizontal';
  className?: string;
}

const BatchRunVerticalStepper: React.FC<BatchRunVerticalStepperProps> = ({
  stageLogs,
  loading,
  selectedLogId,
  onSelect,
  orientation = 'vertical',
  className,
}) => {
  if (loading) {
    return (
      <div className={cn('flex justify-center py-4', className)}>
        <Loader2 className="h-5 w-5 animate-spin text-brand-primary" />
      </div>
    );
  }

  if (stageLogs.length === 0) {
    return null;
  }

  const horizontal = orientation === 'horizontal';

  return (
    <nav
      aria-label="Run steps"
      className={cn(
        horizontal
          ? 'flex shrink-0 overflow-x-auto overscroll-x-contain border-b border-border px-2 py-2 md:hidden'
          : 'hidden shrink-0 flex-col border-r border-border py-3 md:flex md:w-44 lg:w-48',
        className,
      )}
    >
      {!horizontal ? (
        <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          Steps
        </p>
      ) : null}
      <ol
        className={cn(
          horizontal ? 'flex min-w-0 flex-row items-center gap-0 px-1' : 'flex flex-col px-2',
        )}
      >
        {stageLogs.map((log, index) => {
          const selected = log.id === selectedLogId;
          const isLast = index === stageLogs.length - 1;
          const dotClass = STATUS_DOT[log.status] ?? STATUS_DOT.pending;

          if (horizontal) {
            return (
              <li key={log.id} className="flex shrink-0 items-center">
                <button
                  type="button"
                  onClick={() => onSelect(log.id)}
                  title={log.stage_name}
                  className={cn(
                    'group flex flex-col items-center gap-1 rounded-md px-2 py-1 transition-colors hover:bg-muted/40',
                    selected && 'bg-brand-primary/5',
                  )}
                >
                  <span className={cn(stepCircleClass(selected), 'h-8 w-8')}>
                    <span className={statusDotClass(dotClass)} aria-hidden />
                    <span className="relative z-[1]">{index + 1}</span>
                  </span>
                </button>
                {!isLast ? (
                  <span className="mx-1 h-px w-4 shrink-0 bg-border" aria-hidden />
                ) : null}
              </li>
            );
          }

          return (
            <li key={log.id} className={cn('flex w-full', !isLast && 'pb-1')}>
              <button
                type="button"
                onClick={() => onSelect(log.id)}
                title={log.stage_name}
                className={cn(
                  'group flex w-full items-stretch gap-2.5 rounded-md border-l-2 py-2 pl-2 pr-2 text-left transition-colors hover:bg-muted/40',
                  selected
                    ? 'border-brand-primary bg-brand-primary/5'
                    : 'border-transparent hover:border-transparent',
                )}
              >
                <span className="flex w-7 shrink-0 flex-col items-center self-stretch">
                  <span className={cn(stepCircleClass(selected), 'h-7 w-7')}>
                    <span className={statusDotClass(dotClass)} aria-hidden />
                    <span className="relative z-[1]">{index + 1}</span>
                  </span>
                  {!isLast ? (
                    <span
                      className="mt-1 w-px min-h-[1.25rem] flex-1 bg-border"
                      aria-hidden
                    />
                  ) : null}
                </span>
                <span className="min-w-0 flex-1 pt-0.5">
                  <span
                    className={cn(
                      'line-clamp-2 text-xs leading-snug',
                      selected ? 'font-medium text-foreground' : 'text-muted-foreground',
                    )}
                  >
                    {log.stage_name}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default BatchRunVerticalStepper;
