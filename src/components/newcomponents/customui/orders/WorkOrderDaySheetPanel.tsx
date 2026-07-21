import React from 'react';
import type { SheetWeekSection } from '@/pages/newpages/orders/workOrderSheetData';
import { flattenWeekSectionRows } from '@/pages/newpages/orders/workOrderSheetData';
import WorkOrderSheetTable from './WorkOrderSheetTable';

export interface WorkOrderDaySheetPanelProps {
  weekSection: SheetWeekSection | null;
  onRowClick?: (workOrderId: number) => void;
  currentUserId?: number | null;
  onSheetMutated?: () => void;
}

const WorkOrderDaySheetPanel: React.FC<WorkOrderDaySheetPanelProps> = ({
  weekSection,
  onRowClick,
  currentUserId,
  onSheetMutated,
}) => {
  if (!weekSection || weekSection.orderCount === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-1 px-6 py-12 text-center text-muted-foreground">
        <p className="text-sm font-medium text-foreground">No work orders this week</p>
        <p className="text-xs">
          Use the footer to log an entry, or pick another week from the toolbar.
        </p>
      </div>
    );
  }

  const weekRows = flattenWeekSectionRows(weekSection);
  const countLabel = `${weekSection.orderCount} ${weekSection.orderCount === 1 ? 'order' : 'orders'}`;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="sticky top-0 z-10 border-b border-border/60 bg-muted/80 px-2 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur-sm">
        {weekSection.label} · {countLabel}
      </div>
      <WorkOrderSheetTable
        rows={weekRows}
        onRowClick={onRowClick}
        currentUserId={currentUserId}
        onSheetMutated={onSheetMutated}
        className="min-h-0 flex-1"
      />
    </div>
  );
};

export default WorkOrderDaySheetPanel;
