import React from 'react';
import WorkOrdersDateFilterControls from '@/components/newcomponents/customui/orders/WorkOrdersDateFilterControls';
import type { WorkOrdersDateViewMode } from '@/pages/newpages/orders/useWorkOrdersFilters';
import type { ProductionWeekBatchGrid } from '@/pages/newpages/production/productionPageUrl';
import {
  productionRunsToolbarSegmentPillClass,
  productionRunsToolbarSegmentTrackClass,
} from '@/components/newcomponents/customui/production/productionRunsToolbarSegments';
import type { WorkOrdersDateFilterVisibleMode } from '@/components/newcomponents/customui/orders/WorkOrdersDateFilterControls';
import { cn } from '@/lib/utils';

export interface ProductionRunsToolbarProps {
  dateViewMode: WorkOrdersDateViewMode;
  sheetDate: string;
  weekPeriodLabel: string | null;
  onDateViewModeChange: (mode: WorkOrdersDateViewMode) => void;
  onPickDate: (iso: string) => void;
  onPickWeek: (iso: string) => void;
  orderCountByDate?: Record<string, number>;
  calendarMonth?: Date;
  onCalendarMonthChange?: (month: Date) => void;
  weekBatchGrid: ProductionWeekBatchGrid;
  onWeekBatchGridChange: (grid: ProductionWeekBatchGrid) => void;
}

const toolbarShellClass = 'shrink-0 border-b border-border bg-card/50 px-4 py-2.5';

function ProductionRunsWeekGridToggle({
  weekBatchGrid,
  onWeekBatchGridChange,
  className,
}: {
  weekBatchGrid: ProductionWeekBatchGrid;
  onWeekBatchGridChange: (grid: ProductionWeekBatchGrid) => void;
  className?: string;
}) {
  return (
    <div
      className={cn(productionRunsToolbarSegmentTrackClass, className)}
      role="group"
      aria-label="Week schedule layout"
    >
      <button
        type="button"
        className={productionRunsToolbarSegmentPillClass(weekBatchGrid === 'lines')}
        aria-pressed={weekBatchGrid === 'lines'}
        onClick={() => onWeekBatchGridChange('lines')}
      >
        Lines
      </button>
      <button
        type="button"
        className={productionRunsToolbarSegmentPillClass(weekBatchGrid === 'hours')}
        aria-pressed={weekBatchGrid === 'hours'}
        onClick={() => onWeekBatchGridChange('hours')}
      >
        Hours
      </button>
    </div>
  );
}

const ProductionRunsToolbar: React.FC<ProductionRunsToolbarProps> = (props) => {
  const dateProps = {
    dateViewMode: props.dateViewMode,
    sheetDate: props.sheetDate,
    weekPeriodLabel: props.weekPeriodLabel,
    onDateViewModeChange: props.onDateViewModeChange,
    onPickDate: props.onPickDate,
    onPickWeek: props.onPickWeek,
    orderCountByDate: props.orderCountByDate,
    calendarMonth: props.calendarMonth,
    onCalendarMonthChange: props.onCalendarMonthChange,
    visibleModes: ['all', 'week', 'day'] as WorkOrdersDateFilterVisibleMode[],
  };

  return (
    <>
      <div className={cn(toolbarShellClass, 'lg:hidden')}>
        <div className="flex flex-nowrap items-center gap-2">
          <WorkOrdersDateFilterControls {...dateProps} className="min-w-0 flex-1" />
          {props.dateViewMode === 'week' ? (
            <ProductionRunsWeekGridToggle
              weekBatchGrid={props.weekBatchGrid}
              onWeekBatchGridChange={props.onWeekBatchGridChange}
            />
          ) : null}
        </div>
      </div>

      <div
        className={cn(
          toolbarShellClass,
          'hidden items-center gap-2 lg:flex lg:flex-nowrap',
        )}
      >
        <WorkOrdersDateFilterControls {...dateProps} />
        {props.dateViewMode === 'week' ? (
          <ProductionRunsWeekGridToggle
            weekBatchGrid={props.weekBatchGrid}
            onWeekBatchGridChange={props.onWeekBatchGridChange}
          />
        ) : null}
      </div>
    </>
  );
};

export default ProductionRunsToolbar;
