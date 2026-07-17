import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import SheetApproverChips from './SheetApproverChips';
import type { WorkOrderSheetRow } from '@/pages/newpages/orders/workOrderSheetData';
import { priorityLabel } from '@/pages/newpages/orders/workOrderConstants';

export interface SheetWorkOrderPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rows: WorkOrderSheetRow[];
  workOrderId: number;
  onEdit: () => void;
}

const SheetWorkOrderPreviewDialog: React.FC<SheetWorkOrderPreviewDialogProps> = ({
  open,
  onOpenChange,
  rows,
  workOrderId,
  onEdit,
}) => {
  const groupRows = rows.filter((r) => r.workOrderId === workOrderId);
  const first = groupRows[0];
  if (!first) return null;

  const partLines = groupRows.filter((r) => r.itemId != null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[min(32rem,94vw)] max-w-none">
        <DialogHeader>
          <DialogTitle className="flex flex-wrap items-center gap-2">
            {first.machineName}
            <Badge variant="outline" className="text-[10px] font-normal">
              {priorityLabel(first.priority)}
            </Badge>
          </DialogTitle>
        </DialogHeader>
        <dl className="space-y-3 text-sm">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Works</dt>
            <dd>{first.works}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Workers</dt>
            <dd>{first.workers}</dd>
          </div>
          {partLines.length > 0 && (
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Parts</dt>
              <dd>
                <ul className="mt-1 space-y-1">
                  {partLines.map((line) => (
                    <li key={line.key}>
                      {line.partName}
                      {line.quantity != null ? ` — ${line.quantity} ${line.unit}` : ''}
                    </li>
                  ))}
                </ul>
              </dd>
            </div>
          )}
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Approvers</dt>
            <dd className="mt-1">
              <SheetApproverChips approvers={first.approvers} />
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Remarks</dt>
            <dd className="text-muted-foreground">{first.remarks}</dd>
          </div>
        </dl>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button
            type="button"
            className="bg-brand-primary hover:bg-brand-primary-hover"
            onClick={() => {
              onOpenChange(false);
              onEdit();
            }}
          >
            Edit entry
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SheetWorkOrderPreviewDialog;
