import React, { useState } from 'react';
import { Repeat2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { Machine } from '@/types/machine';
import type { FactorySection } from '@/types/factorySection';
import type { WorkOrderTemplate } from '@/types/workOrderTemplate';
import RecurringProgramsManagerTab from './RecurringProgramsManagerTab';
import CreateEditWorkOrderTemplateDialog from './CreateEditWorkOrderTemplateDialog';

export interface RecurringProgramsManagerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  factoryId?: number | null;
  machineId?: number | null;
  machines?: Machine[];
  sections?: FactorySection[];
  onProgramsChanged?: () => void;
  onOpenWorkOrder?: (workOrderId: number) => void;
}

const RecurringProgramsManagerDialog: React.FC<RecurringProgramsManagerDialogProps> = ({
  open,
  onOpenChange,
  factoryId = null,
  machineId = null,
  machines = [],
  sections = [],
  onProgramsChanged,
  onOpenWorkOrder,
}) => {
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<WorkOrderTemplate | null>(null);

  const openEdit = (template: WorkOrderTemplate) => {
    setEditingTemplate(template);
    setEditorOpen(true);
  };

  const handleOpenWorkOrder = (workOrderId: number) => {
    onOpenChange(false);
    onOpenWorkOrder?.(workOrderId);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="flex h-[min(70vh,640px)] w-[min(48rem,94vw)] max-w-none flex-col gap-0 overflow-hidden p-0 sm:max-w-none">
          <DialogHeader className="shrink-0 space-y-1 border-b border-border py-4 pl-6 pr-14">
            <DialogTitle className="flex items-center gap-2 text-base">
              <Repeat2 className="h-4 w-4 shrink-0 text-muted-foreground" />
              Recurring programs
            </DialogTitle>
            <DialogDescription>
              Active recurring series on machines in your current view. Delete remaining removes upcoming drafts only.
            </DialogDescription>
          </DialogHeader>

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-6 py-4">
            <RecurringProgramsManagerTab
              enabled={open}
              factoryId={factoryId}
              machineId={machineId}
              machinesInScope={machines}
              onEditTemplate={openEdit}
              onProgramsChanged={onProgramsChanged}
              onOpenWorkOrder={handleOpenWorkOrder}
            />
          </div>

          <DialogFooter className="flex shrink-0 flex-col gap-3 border-t border-border px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">
              {machines.length} machine{machines.length === 1 ? '' : 's'} in current view
            </p>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <CreateEditWorkOrderTemplateDialog
        open={editorOpen}
        onOpenChange={(next) => {
          setEditorOpen(next);
          if (!next) setEditingTemplate(null);
        }}
        template={editingTemplate}
        defaultFactoryId={factoryId ?? undefined}
        machines={machines}
        sections={sections}
      />
    </>
  );
};

export default RecurringProgramsManagerDialog;
