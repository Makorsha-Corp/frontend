import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { ClipboardList, ListChecks, Wrench } from 'lucide-react';
import MaintenanceWizardDialog from '@/components/newcomponents/customui/orders/MaintenanceWizardDialog';
import type { Machine } from '@/types/machine';
import toast from 'react-hot-toast';

export interface MachineWorkOrderQuickActionsProps {
  machine: Machine;
}

const MachineWorkOrderQuickActions: React.FC<MachineWorkOrderQuickActionsProps> = ({ machine }) => {
  const [, setSearchParams] = useSearchParams();
  const [wizardOpen, setWizardOpen] = useState(false);

  const openInSheet = () => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('tab', 'workOrders');
      next.delete('woView');
      next.set('woMachine', String(machine.id));
      next.set('woDate', format(new Date(), 'yyyy-MM-dd'));
      return next;
    });
  };

  const openInHub = () => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('tab', 'workOrders');
      next.set('woView', 'hub');
      next.set('woMachine', String(machine.id));
      return next;
    });
  };

  const handleWizardCreated = (workOrderId: number) => {
    setWizardOpen(false);
    toast.success('Work order created');
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('tab', 'workOrders');
      next.set('woView', 'hub');
      next.set('woMachine', String(machine.id));
      next.set('orderId', String(workOrderId));
      return next;
    });
  };

  return (
    <>
      <div className="rounded-lg border border-dashed border-border bg-muted/20 p-3 flex flex-col gap-3">
        <p className="text-xs text-muted-foreground">
          Log daily work in the sheet, or use the full wizard when you need parts, approvals, or
          templates.
        </p>
        <div className="flex flex-col gap-2">
          <Button
            type="button"
            size="sm"
            className="w-full justify-start bg-brand-primary hover:bg-brand-primary-hover"
            onClick={openInSheet}
          >
            <ClipboardList className="h-4 w-4 mr-1.5 shrink-0" />
            Log in sheet
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="w-full justify-start"
            onClick={() => setWizardOpen(true)}
          >
            <ListChecks className="h-4 w-4 mr-1.5 shrink-0" />
            Full maintenance wizard
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="w-full justify-start"
            onClick={openInHub}
          >
            <Wrench className="h-4 w-4 mr-1.5 shrink-0" />
            Open in Hub
          </Button>
        </div>
      </div>

      <MaintenanceWizardDialog
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        machine={machine}
        onCreated={handleWizardCreated}
      />
    </>
  );
};

export default MachineWorkOrderQuickActions;
