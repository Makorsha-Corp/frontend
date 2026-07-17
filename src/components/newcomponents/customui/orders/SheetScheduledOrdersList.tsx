import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bookmark, CalendarClock, Check, Loader2, Plus, X } from 'lucide-react';
import type { WorkOrderSchedule } from '@/types/workOrderSchedule';
import { cn } from '@/lib/utils';

export interface SheetScheduledOrdersListProps {
  schedules: WorkOrderSchedule[];
  onLogEntry?: () => void;
  onStageDay?: () => void;
  onConfirm?: (scheduleId: number) => void;
  onCancel?: (scheduleId: number) => void;
  isStaging?: boolean;
  isConfirmingId?: number | null;
  isCancellingId?: number | null;
  showStageDay?: boolean;
}

const SheetScheduledOrdersList: React.FC<SheetScheduledOrdersListProps> = ({
  schedules,
  onLogEntry,
  onStageDay,
  onConfirm,
  onCancel,
  isStaging,
  isConfirmingId,
  isCancellingId,
  showStageDay,
}) => {
  const staged = schedules.filter((s) => s.status === 'STAGED');

  if (schedules.length === 0) {
    return (
      <div className="space-y-3 px-3 py-6 text-center">
        <p className="text-sm font-medium text-foreground">No orders scheduled</p>
        <p className="text-xs text-muted-foreground">
          Stage recurring templates for this day, or log an ad-hoc entry.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
          {showStageDay && onStageDay && (
            <Button type="button" variant="outline" size="sm" disabled={isStaging} onClick={onStageDay}>
              {isStaging ? (
                <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
              ) : (
                <CalendarClock className="mr-1 h-3.5 w-3.5" />
              )}
              Stage day
            </Button>
          )}
          {onLogEntry && (
            <Button type="button" size="sm" onClick={onLogEntry}>
              <Plus className="mr-1 h-3.5 w-3.5" />
              Log entry
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 px-3 py-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-foreground">Scheduled orders</p>
          <p className="text-xs text-muted-foreground">
            {staged.length > 0
              ? `${staged.length} staged · confirm to create draft work orders`
              : 'All scheduled orders confirmed or cancelled'}
          </p>
        </div>
        {showStageDay && onStageDay && (
          <Button type="button" variant="outline" size="sm" disabled={isStaging} onClick={onStageDay}>
            {isStaging ? (
              <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
            ) : (
              <CalendarClock className="mr-1 h-3.5 w-3.5" />
            )}
            Stage day
          </Button>
        )}
      </div>

      <ul className="divide-y divide-border/60 rounded-md border border-border/60">
        {schedules.map((schedule) => (
          <li
            key={schedule.id}
            className={cn(
              'flex flex-wrap items-center justify-between gap-2 px-3 py-2',
              schedule.status === 'STAGED' ? 'bg-amber-500/5' : 'bg-muted/10',
            )}
          >
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <div className="flex min-w-0 items-center gap-2">
                <span className="truncate text-sm font-medium">{schedule.machine_name ?? `Machine #${schedule.machine_id}`}</span>
                <Badge
                  variant="outline"
                  className={cn(
                    'shrink-0 text-[10px] font-normal',
                    schedule.status === 'STAGED' && 'border-amber-500/40 text-amber-700 dark:text-amber-400',
                    schedule.status === 'CONFIRMED' && 'border-emerald-500/40 text-emerald-700 dark:text-emerald-400',
                    schedule.status === 'CANCELLED' && 'text-muted-foreground',
                  )}
                >
                  {schedule.status === 'STAGED' ? 'Staged' : schedule.status === 'CONFIRMED' ? 'Confirmed' : 'Cancelled'}
                </Badge>
              </div>
              <div className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
                <span className="truncate">{schedule.title}</span>
                {schedule.template_name && (
                  <span title={`From template: ${schedule.template_name}`} className="inline-flex shrink-0">
                    <Bookmark className="h-3 w-3" />
                  </span>
                )}
              </div>
            </div>

            {schedule.status === 'STAGED' && (
              <div className="flex shrink-0 items-center gap-1">
                {onConfirm && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    disabled={isConfirmingId === schedule.id}
                    onClick={() => onConfirm(schedule.id)}
                  >
                    {isConfirmingId === schedule.id ? (
                      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                    ) : (
                      <Check className="mr-1 h-3 w-3" />
                    )}
                    Confirm
                  </Button>
                )}
                {onCancel && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-muted-foreground"
                    disabled={isCancellingId === schedule.id}
                    onClick={() => onCancel(schedule.id)}
                  >
                    {isCancellingId === schedule.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <X className="h-3 w-3" />
                    )}
                  </Button>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>

      {onLogEntry && (
        <div className="flex justify-end">
          <Button type="button" variant="ghost" size="sm" className="text-xs" onClick={onLogEntry}>
            <Plus className="mr-1 h-3 w-3" />
            Log ad-hoc entry
          </Button>
        </div>
      )}
    </div>
  );
};

export default SheetScheduledOrdersList;
