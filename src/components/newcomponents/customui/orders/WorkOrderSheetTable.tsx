import React from 'react';
import { Loader2, Wrench } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { WorkOrderSheetRow } from '@/pages/newpages/orders/workOrderSheetData';
import {
  WorkOrderSheetDayRows,
  WorkOrderSheetTableHeader,
} from './workOrderSheetTableParts';
import { SHEET_TABLE, SHEET_TABLE_MIN_W } from './workOrderSheetTypography';

export interface WorkOrderSheetTableProps {
  rows: WorkOrderSheetRow[];
  onRowClick?: (workOrderId: number) => void;
  currentUserId?: number | null;
  onSheetMutated?: () => void;
  showStartDateColumn?: boolean;
  /** Render table only — no scroll shell, loading, or empty states. */
  embed?: boolean;
  showHeader?: boolean;
  isLoading?: boolean;
  emptyMessage?: string;
  emptyActions?: React.ReactNode;
  className?: string;
  tableClassName?: string;
}

const WorkOrderSheetTable: React.FC<WorkOrderSheetTableProps> = ({
  rows,
  onRowClick,
  currentUserId = null,
  onSheetMutated,
  showStartDateColumn = false,
  embed = false,
  showHeader = true,
  isLoading = false,
  emptyMessage = 'No work orders match these filters.',
  emptyActions,
  className,
  tableClassName,
}) => {
  const table = (
    <table className={cn('w-full border-collapse', SHEET_TABLE, tableClassName)}>
      {showHeader ? <WorkOrderSheetTableHeader showStartDateColumn={showStartDateColumn} /> : null}
      <WorkOrderSheetDayRows
        rows={rows}
        onRowClick={onRowClick}
        currentUserId={currentUserId}
        onSheetMutated={onSheetMutated}
        showStartDateColumn={showStartDateColumn}
      />
    </table>
  );

  if (embed) {
    return rows.length > 0 ? table : null;
  }

  if (isLoading) {
    return (
      <div className={cn('flex flex-1 flex-col items-center justify-center py-16 text-muted-foreground', className)}>
        <Loader2 className="mb-3 h-10 w-10 animate-spin text-brand-primary" />
        <p className="text-sm">Loading work orders…</p>
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div
        className={cn(
          'flex flex-1 flex-col items-center justify-center px-6 py-16 text-center text-muted-foreground',
          className,
        )}
      >
        <Wrench className="mb-3 h-12 w-12 opacity-40" />
        <p className="text-sm">{emptyMessage}</p>
        {emptyActions ? <div className="mt-4 flex flex-wrap justify-center gap-2">{emptyActions}</div> : null}
      </div>
    );
  }

  return (
    <div className={cn('flex min-h-0 flex-1 flex-col overflow-hidden', className)}>
      <div className="min-h-0 flex-1 overflow-auto">
        <div className={SHEET_TABLE_MIN_W}>{table}</div>
      </div>
    </div>
  );
};

export default WorkOrderSheetTable;
