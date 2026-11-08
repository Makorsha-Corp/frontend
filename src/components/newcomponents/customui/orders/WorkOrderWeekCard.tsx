import React from 'react';
import { cn } from '@/lib/utils';
import { useUserTimeFormat } from '@/hooks/useUserTimeFormat';
import type { WorkOrderDayCardModel } from '@/pages/newpages/orders/workOrderSheetData';
import { formatWorkOrderCardWhen } from '@/pages/newpages/orders/workOrderCardWhen';
import {
  workOrderStatusPillClass,
  workOrderStatusShortLabel,
  workOrderStatusStripeClass,
} from '@/pages/newpages/orders/workOrderConstants';

export interface WorkOrderWeekCardProps {
  card: WorkOrderDayCardModel;
  timeZone: string;
  onOpen?: (workOrderId: number) => void;
  className?: string;
}

const WorkOrderWeekCard: React.FC<WorkOrderWeekCardProps> = ({
  card,
  timeZone,
  onOpen,
  className,
}) => {
  const { use24Hour } = useUserTimeFormat();
  const interactive = Boolean(onOpen);
  const pill = workOrderStatusShortLabel(card.status);
  const whenLabel = formatWorkOrderCardWhen(
    card.plannedStartAt,
    card.plannedEndAt,
    timeZone,
    use24Hour,
  );

  return (
    <button
      type="button"
      disabled={!interactive}
      onClick={() => onOpen?.(card.workOrderId)}
      className={cn(
        'mb-1.5 w-full rounded-md border border-border/60 bg-card px-2 py-2 text-left text-xs leading-normal shadow-sm transition-[background-color,box-shadow,border-color]',
        'border-l-[3px]',
        workOrderStatusStripeClass(card.status),
        interactive && 'cursor-pointer hover:border-brand-primary/30 hover:bg-muted/50 hover:shadow-sm',
        !interactive && 'cursor-default opacity-90',
        className,
      )}
    >
      <div className="flex items-center justify-between gap-1.5">
        <span className="min-w-0 truncate text-sm font-semibold leading-tight text-foreground">
          {card.title}
        </span>
        <span
          className={cn(
            'shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide',
            card.status === 'RECURRING' && 'normal-case',
            workOrderStatusPillClass(card.status),
          )}
        >
          {pill}
        </span>
      </div>
      <p className="mt-0.5 truncate tabular-nums text-xs text-foreground/85">{whenLabel}</p>
      <p className="mt-0.5 truncate text-[11px] leading-snug text-muted-foreground">
        {card.secondaryLine}
      </p>
    </button>
  );
};

export default WorkOrderWeekCard;
