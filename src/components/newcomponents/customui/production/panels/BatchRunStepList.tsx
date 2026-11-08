import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { ProductionBatchStageLog, ProductionLine } from '@/types/production';
import { Loader2 } from 'lucide-react';
import { BATCH_STAGE_LOG_STATUS_BADGE } from '../productionPageUtils';

export interface BatchRunStepListProps {
  stageLogs: ProductionBatchStageLog[];
  lines: ProductionLine[];
  loading?: boolean;
  selectedLogId: number | null;
  onSelect: (logId: number) => void;
}

const BatchRunStepList: React.FC<BatchRunStepListProps> = ({
  stageLogs,
  lines,
  loading,
  selectedLogId,
  onSelect,
}) => {
  if (loading) {
    return (
      <div className="flex justify-center py-6">
        <Loader2 className="h-6 w-6 animate-spin text-brand-primary" />
      </div>
    );
  }

  if (stageLogs.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-border px-3 py-6 text-center text-sm text-muted-foreground">
        No steps on this run yet.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-1.5">
      {stageLogs.map((log, index) => {
        const selected = log.id === selectedLogId;
        const lineName =
          log.production_line_id != null
            ? lines.find((l) => l.id === log.production_line_id)?.name
            : null;

        return (
          <li key={log.id}>
            <button
              type="button"
              onClick={() => onSelect(log.id)}
              className={cn(
                'w-full rounded-md border px-3 py-2 text-left transition-colors',
                'hover:bg-muted/40',
                selected ? 'border-brand-primary/50 bg-brand-primary/5' : 'border-border',
              )}
            >
              <div className="flex min-w-0 items-center gap-2">
                <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{index + 1}</span>
                <span className="min-w-0 flex-1 truncate text-sm font-medium">{log.stage_name}</span>
                <Badge
                  variant="outline"
                  className={cn(
                    'shrink-0 border-transparent text-[10px] capitalize hover:bg-transparent',
                    BATCH_STAGE_LOG_STATUS_BADGE[log.status],
                  )}
                >
                  {log.status.replace('_', ' ')}
                </Badge>
              </div>
              {lineName ? (
                <p className="mt-0.5 truncate pl-5 text-xs text-muted-foreground">{lineName}</p>
              ) : null}
            </button>
          </li>
        );
      })}
    </ul>
  );
};

export default BatchRunStepList;
