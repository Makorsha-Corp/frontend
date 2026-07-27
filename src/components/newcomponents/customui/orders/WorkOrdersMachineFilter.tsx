import React, { useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import MachineSelectorDialog, {
  deriveSectionAbbreviation,
} from '@/components/newcomponents/customui/MachineSelectorDialog';
import { MachineSelectSummaryButton } from '@/components/newcomponents/customui/MachineSelectSummaryButton';
import {
  appShellHeaderBoxedControlClass,
  appShellHeaderControlClass,
} from '@/components/newcomponents/customui/AppShellHeader';
import type { Factory } from '@/types/factory';
import type { FactorySection } from '@/types/factorySection';
import type { Machine } from '@/types/machine';
import { cn } from '@/lib/utils';

export interface WorkOrdersMachineFilterProps {
  machineFilter: string;
  onMachineChange: (value: string) => void;
  disabled?: boolean;
  factoryFilter: string;
  sectionFilter: string;
  machines: Machine[];
  factories: Factory[];
  sections: FactorySection[];
  className?: string;
}

function buildMachineFilterDisplayLine(
  machineFilter: string,
  machines: Machine[],
  factories: Factory[],
  sections: FactorySection[],
): string | null {
  if (machineFilter === 'all') return 'All machines';

  const machine = machines.find((m) => m.id === Number(machineFilter));
  if (!machine) return null;

  const section = sections.find((s) => s.id === machine.factory_section_id);
  const factory = section ? factories.find((f) => f.id === section.factory_id) : undefined;
  const factoryAbbreviation = factory?.abbreviation?.trim() || '—';
  const sectionAbbreviation = section
    ? deriveSectionAbbreviation(section.name)
    : machine.factory_section_name?.trim()
      ? deriveSectionAbbreviation(machine.factory_section_name)
      : '—';

  return `${factoryAbbreviation} · ${sectionAbbreviation} · ${machine.name}`;
}

const WorkOrdersMachineFilter: React.FC<WorkOrdersMachineFilterProps> = ({
  machineFilter,
  onMachineChange,
  disabled = false,
  factoryFilter,
  sectionFilter,
  machines,
  factories,
  sections,
  className,
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);

  const displayLine = useMemo(
    () => buildMachineFilterDisplayLine(machineFilter, machines, factories, sections),
    [machineFilter, machines, factories, sections],
  );

  const initialFactoryId = factoryFilter !== 'all' ? Number(factoryFilter) : undefined;
  const initialSectionId = sectionFilter !== 'all' ? Number(sectionFilter) : undefined;
  const showClear = machineFilter !== 'all' && !disabled;

  return (
    <div className={cn('flex shrink-0 items-center gap-1', className)}>
      <MachineSelectSummaryButton
        onClick={() => setDialogOpen(true)}
        ariaLabel={
          machineFilter === 'all'
            ? 'Filter by machine. Currently showing all machines.'
            : `Filter by machine. Current: ${displayLine ?? `machine ${machineFilter}`}`
        }
        selectedLine={displayLine}
        staleNumericId={machineFilter !== 'all' && !displayLine ? machineFilter : null}
        compactLabel
        disabled={disabled}
        className={cn(
          appShellHeaderBoxedControlClass,
          appShellHeaderControlClass,
          'mt-0 h-9 min-h-9 max-w-[min(200px,32vw)] truncate px-2.5 text-xs sm:text-sm',
        )}
      />

      {showClear ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-9 w-9 shrink-0 text-muted-foreground"
          aria-label="Clear machine filter"
          onClick={() => onMachineChange('all')}
        >
          <X className="h-4 w-4" />
        </Button>
      ) : null}

      <MachineSelectorDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initialFactoryId={initialFactoryId}
        initialSectionId={initialSectionId}
        title="Filter by machine"
        description="Pick a machine to filter the work order sheet."
        onSelect={(machine) => onMachineChange(String(machine.id))}
      />
    </div>
  );
};

export default WorkOrdersMachineFilter;
