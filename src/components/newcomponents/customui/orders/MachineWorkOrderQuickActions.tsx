import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Wrench } from 'lucide-react';
import type { Machine } from '@/types/machine';
import MaintenanceWizardDialog from './MaintenanceWizardDialog';
import WorkOrderModal from './WorkOrderModal';

export interface MachineWorkOrderQuickActionsProps {
  machine: Machine;
}

const MachineWorkOrderQuickActions: React.FC<MachineWorkOrderQuickActionsProps> = ({ machine }) => {
  const [wizardOpen, setWizardOpen] = useState(false);
  const [createdWoId, setCreatedWoId] = useState<number | null>(null);

  return (
    <>
      <div className="rounded-lg border border-dashed border-border bg-muted/20 p-3 flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          Log or schedule maintenance, repairs, or inspections for this machine — parts and billing
          are handled as part of the flow.
        </p>
        <Button type="button" size="sm" className="shrink-0 bg-brand-primary hover:bg-brand-primary-hover" onClick={() => setWizardOpen(true)}>
          <Wrench className="h-4 w-4 mr-1.5" />
          Maintenance
        </Button>
      </div>

      <MaintenanceWizardDialog
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        machine={machine}
        onCreated={(id) => setCreatedWoId(id)}
      />

      <WorkOrderModal workOrderId={createdWoId} onOpenChange={(open) => !open && setCreatedWoId(null)} />
    </>
  );
};

export default MachineWorkOrderQuickActions;
