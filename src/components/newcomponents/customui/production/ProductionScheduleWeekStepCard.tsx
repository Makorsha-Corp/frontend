import { cn } from '@/lib/utils';
import type { ProductionScheduleBatch, ProductionScheduleStep } from '@/types/production';
import type { WorkspaceShift } from '@/types/workspaceShift';
import {
  scheduleBatchStatusPillClass,
  scheduleBatchStatusPillLabel,
  scheduleBatchStatusStripeClass,
  scheduleStepCardText,
  scheduleStepStatusLabel,
} from '@/components/newcomponents/customui/production/scheduleWeekBoard';

interface ProductionScheduleWeekStepCardProps {
  batch: ProductionScheduleBatch;
  step: ProductionScheduleStep;
  shifts: WorkspaceShift[];
  use24Hour: boolean;
  formulaLabel?: string | null;
  /** Hour grid: production line when multiple lines share a day column. */
  lineName?: string | null;
  factoryNameHint?: string | null;
  /** Hour grid row-span: fill cell height, no bottom margin. */
  fillHeight?: boolean;
  interactive?: boolean;
  highlighted?: boolean;
  onHoverStart?: () => void;
  onHoverEnd?: () => void;
  onOpen?: () => void;
}

export function ProductionScheduleWeekStepCard({
  batch,
  step,
  shifts,
  use24Hour,
  formulaLabel,
  lineName,
  factoryNameHint,
  fillHeight = false,
  interactive = true,
  highlighted = false,
  onHoverStart,
  onHoverEnd,
  onOpen,
}: ProductionScheduleWeekStepCardProps) {
  const card = scheduleStepCardText(step, batch.batch_number, shifts, use24Hour);
  const pill = scheduleBatchStatusPillLabel(batch.status);
  const stepDetail = scheduleStepStatusLabel(batch.status, step.status);
  const ariaLabel = [card.when, card.batchNumber, lineName, formulaLabel, stepDetail]
    .filter(Boolean)
    .join(' · ');

  return (
    <div
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      aria-label={interactive ? ariaLabel : undefined}
      data-schedule-batch-card=""
      data-batch-id={batch.batch_id}
      onMouseEnter={() => onHoverStart?.()}
      onMouseLeave={(e) => {
        const to = e.relatedTarget;
        if (to instanceof Element) {
          const next = to.closest('[data-schedule-batch-card]');
          if (next?.getAttribute('data-batch-id') === String(batch.batch_id)) return;
        }
        onHoverEnd?.();
      }}
      onFocus={() => onHoverStart?.()}
      onBlur={(e) => {
        if (e.currentTarget.contains(e.relatedTarget as Node)) return;
        onHoverEnd?.();
      }}
      onClick={(e) => {
        if (!interactive) return;
        e.stopPropagation();
        onOpen?.();
      }}
      onKeyDown={(e) => {
        if (!interactive) return;
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          e.stopPropagation();
          onOpen?.();
        }
      }}
      className={cn(
        'rounded-md border border-border/60 bg-card px-1.5 py-1 text-[11px] leading-snug shadow-sm transition-[background-color,box-shadow,border-color]',
        fillHeight ? 'mb-0 h-full min-h-14' : 'mb-1',
        'border-l-[3px]',
        scheduleBatchStatusStripeClass(batch.status),
        interactive && 'cursor-pointer',
        !interactive && 'opacity-90',
        highlighted &&
          'z-[1] border-brand-primary/50 bg-brand-primary/[0.16] shadow-md ring-2 ring-brand-primary/45',
        interactive && !highlighted && 'hover:border-brand-primary/30 hover:bg-muted/50 hover:shadow-sm',
      )}
    >
      <div className="flex items-center justify-between gap-1">
        <span className="min-w-0 truncate font-semibold text-foreground">{card.when}</span>
        <span
          className={cn(
            'shrink-0 rounded px-1 py-0 text-[9px] font-medium uppercase tracking-wide',
            batch.status === 'recurring' && 'normal-case',
            scheduleBatchStatusPillClass(batch.status),
          )}
        >
          {pill}
        </span>
      </div>
      <p className="truncate font-medium text-foreground">{card.batchNumber}</p>
      {lineName ? (
        <p className="truncate text-[10px] text-muted-foreground">{lineName}</p>
      ) : null}
      {formulaLabel ? (
        <p className="truncate text-[10px] text-muted-foreground">{formulaLabel}</p>
      ) : null}
      {factoryNameHint ? (
        <p className="truncate text-[10px] text-muted-foreground/80">{factoryNameHint}</p>
      ) : null}
    </div>
  );
}
