import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { format, parseISO } from 'date-fns';
import SheetMaintenanceEntryForm from './SheetMaintenanceEntryForm';
import type { Machine } from '@/types/machine';
import type { WorkOrderType } from '@/types/workOrderType';
import type { Item } from '@/types/item';
import type { WorkOrderTemplate } from '@/types/workOrderTemplate';
import type { Account } from '@/types/account';
import type { WorkspaceMember } from '@/types/workspace';

export interface SheetLogEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sheetDate: string;
  factoryId: number | null;
  sectionId: number | null;
  machines: Machine[];
  workOrderTypes: WorkOrderType[];
  partItems: Item[];
  templates: WorkOrderTemplate[];
  accounts: Account[];
  members: WorkspaceMember[];
  defaultMachineId?: number | null;
  mode?: 'create' | 'edit';
  workOrderId?: number;
  onSuccess?: () => void;
}

const SheetLogEntryDialog: React.FC<SheetLogEntryDialogProps> = ({
  open,
  onOpenChange,
  sheetDate,
  factoryId,
  sectionId,
  machines,
  workOrderTypes,
  partItems,
  templates,
  accounts,
  members,
  defaultMachineId,
  mode = 'create',
  workOrderId,
  onSuccess,
}) => {
  const isEdit = mode === 'edit' && workOrderId != null;
  const dateLabel = format(parseISO(sheetDate), 'dd.MM.yyyy (EEE)');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[66vh] max-h-[66vh] w-[min(56rem,94vw)] max-w-none flex-col overflow-hidden">
        <DialogHeader className="shrink-0">
          <DialogTitle>
            {isEdit ? 'Edit maintenance entry' : 'Log maintenance entry'}
            <span className="ml-2 text-sm font-normal text-muted-foreground">{dateLabel}</span>
          </DialogTitle>
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-y-auto pr-1">
          <SheetMaintenanceEntryForm
            embedded
            mode={mode}
            workOrderId={workOrderId}
            sheetDate={sheetDate}
            factoryId={factoryId}
            sectionId={sectionId}
            machines={machines}
            workOrderTypes={workOrderTypes}
            partItems={partItems}
            templates={templates}
            accounts={accounts}
            members={members}
            defaultMachineId={defaultMachineId}
            showGenerateDay={false}
            onCancel={() => onOpenChange(false)}
            onSuccess={() => {
              onSuccess?.();
              onOpenChange(false);
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SheetLogEntryDialog;
