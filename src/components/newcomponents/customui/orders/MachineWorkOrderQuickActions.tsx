import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ClipboardList, ListChecks } from 'lucide-react';
import MaintenanceWizardDialog from '@/components/newcomponents/customui/orders/MaintenanceWizardDialog';
import type { Machine } from '@/types/machine';
import toast from 'react-hot-toast';

export interface MachineWorkOrderQuickActionsProps {
  machine: Machine;
}

const MachineWorkOrderQuickActions: React.FC<MachineWorkOrderQuickActionsProps> = ({ machine }) => {
  const [, setSearchParams] = useSearchParams();
  const [wizardOpen, setWizardOpen] = useState(false);

  const openInWorkOrders = () => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('tab', 'workOrders');
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
      next.set('woMachine', String(machine.id));
      next.set('orderId', String(workOrderId));
      return next;
    });
  };

  return (
    <>
      <div className="rounded-lg border border-dashed border-border bg-muted/20 p-3 flex flex-col gap-3">
        <p className="text-xs text-muted-foreground">
          Log daily work on the Work Orders page, or use the full wizard when you need parts,
          approvals, or templates.
        </p>
        <div className="flex flex-col gap-2">
          <Button
            type="button"
            size="sm"
            className="w-full justify-start bg-brand-primary hover:bg-brand-primary-hover"
            onClick={openInWorkOrders}
          >
            <ClipboardList className="h-4 w-4 mr-1.5 shrink-0" />
            Open Work Orders
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
