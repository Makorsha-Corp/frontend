import React, { useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  groupWeekByDay,
  type SheetWeekSection,
} from '@/pages/newpages/orders/workOrderSheetData';
import type { WorkOrdersWeekView } from '@/pages/newpages/orders/useWorkOrdersFilters';
import WorkOrderWeekRows from './WorkOrderWeekRows';
import WorkOrderWeekColumns from './WorkOrderWeekColumns';

export interface WorkOrderWeekCalendarProps {
  weekSection: SheetWeekSection | null;
  selectedDate: string;
  weekView: WorkOrdersWeekView;
  isLoading?: boolean;
  onSelectDay: (date: string) => void;
  onAddForDay: (date: string) => void;
  onRowClick?: (workOrderId: number) => void;
  currentUserId?: number | null;
  onSheetMutated?: () => void;
  className?: string;
}

const WorkOrderWeekCalendar: React.FC<WorkOrderWeekCalendarProps> = ({
  weekSection,
  selectedDate,
  weekView,
  isLoading = false,
  onSelectDay,
  onAddForDay,
  onRowClick,
  currentUserId = null,
  onSheetMutated,
  className,
}) => {
  const days = useMemo(
    () => (weekSection ? groupWeekByDay(weekSection, selectedDate) : []),
    [weekSection, selectedDate],
  );

  if (isLoading) {
    return (
      <div
        className={cn(
          'flex flex-1 flex-col items-center justify-center py-16 text-muted-foreground',
          className,
        )}
      >
        <Loader2 className="mb-3 h-10 w-10 animate-spin text-brand-primary" />
        <p className="text-sm">Loading work orders…</p>
      </div>
    );
  }

  if (!weekSection || days.length === 0) {
    return (
      <div
        className={cn(
          'flex flex-1 flex-col items-center justify-center gap-1 px-6 py-12 text-center text-muted-foreground',
          className,
        )}
      >
        <p className="text-sm font-medium text-foreground">Pick a week to view work orders</p>
        <p className="text-xs">Use the toolbar week picker or Today to get started.</p>
      </div>
    );
  }

  if (weekView === 'columns') {
    return (
      <div className={cn('flex min-h-0 flex-1 flex-col overflow-hidden', className)}>
        <WorkOrderWeekColumns
          days={days}
          onSelectDay={onSelectDay}
          onAddForDay={onAddForDay}
          onRowClick={onRowClick}
        />
      </div>
    );
  }

  return (
    <div className={cn('flex min-h-0 flex-1 flex-col overflow-hidden', className)}>
      <WorkOrderWeekRows
        days={days}
        onSelectDay={onSelectDay}
        onAddForDay={onAddForDay}
        onRowClick={onRowClick}
        currentUserId={currentUserId}
        onSheetMutated={onSheetMutated}
      />
    </div>
  );
};

export default WorkOrderWeekCalendar;
