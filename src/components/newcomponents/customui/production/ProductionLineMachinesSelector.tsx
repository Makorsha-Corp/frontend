import React, { useMemo, useState } from 'react';
import { X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import MachineSelectorDialog from '@/components/newcomponents/customui/MachineSelectorDialog';
import type { FactoryMachineOption } from '@/components/newcomponents/customui/production/StationMachinesField';
import { machineStatusDotClass, machineVisualKindFromBrief } from '@/lib/machineVisualStatus';
import { cn } from '@/lib/utils';

export interface ProductionLineMachinesSelectorProps {
  factoryId: number | null;
  machines: FactoryMachineOption[];
  selectedIds: number[];
  onChange: (ids: number[]) => void;
  disabled?: boolean;
  className?: string;
}

const ProductionLineMachinesSelector: React.FC<ProductionLineMachinesSelectorProps> = ({
  factoryId,
  machines,
  selectedIds,
  onChange,
  disabled,
  className,
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);

  const machineById = useMemo(() => new Map(machines.map((m) => [m.id, m])), [machines]);

  const selectedMachines = useMemo(
    () =>
      selectedIds.map((id) => {
        const row = machineById.get(id);
        return row ?? { id, name: `Machine #${id}`, is_running: false };
      }),
    [selectedIds, machineById],
  );

  const removeId = (id: number) => {
    onChange(selectedIds.filter((row) => row !== id));
  };

  if (factoryId == null) {
    return (
      <p className={cn('text-sm text-muted-foreground', className)}>
        Select a factory before assigning machines.
      </p>
    );
  }

  if (machines.length === 0) {
    return (
      <p className={cn('text-sm text-muted-foreground', className)}>
        No machines in this factory. Add machines under Machines first.
      </p>
    );
  }

  return (
    <div className={cn('space-y-2', className)}>
      {selectedMachines.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {selectedMachines.map((machine) => (
            <span
              key={machine.id}
              className="inline-flex max-w-full items-center gap-1 rounded-md bg-muted/35 py-1 pl-2 pr-1 text-sm"
            >
              <span
                className={cn(
                  'h-1.5 w-1.5 shrink-0 rounded-full',
                  machineStatusDotClass[
                    machineVisualKindFromBrief(machine)
                  ],
                )}
                aria-hidden
              />
              <span className="truncate">{machine.name}</span>
              {!disabled ? (
                <button
                  type="button"
                  className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                  aria-label={`Remove ${machine.name}`}
                  onClick={() => removeId(machine.id)}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              ) : null}
            </span>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No machines on this line yet.</p>
      )}

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-9"
        disabled={disabled}
        onClick={() => setDialogOpen(true)}
      >
        {selectedMachines.length > 0 ? 'Change machines…' : 'Choose machines…'}
      </Button>

      <MachineSelectorDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        selectionMode="multiple"
        selectedIds={selectedIds}
        onConfirmMultiple={onChange}
        initialFactoryId={factoryId}
        title="Choose machines"
        description="Machines on this production line. Click tiles to toggle selection."
      />
    </div>
  );
};

export default ProductionLineMachinesSelector;
