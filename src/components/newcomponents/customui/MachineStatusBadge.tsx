import React from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { Machine } from '@/types/machine';
import {
  getMachineVisualKind,
  getMachineStatusLabel,
  machineBadgeClass,
} from '@/lib/machineVisualStatus';
import { machineVisualKindTooltip } from '@/lib/machineStatusTooltips';
import { cn } from '@/lib/utils';

interface MachineStatusBadgeProps {
  machine: Machine;
  className?: string;
  /** Stop click from bubbling to parent cards. */
  stopPropagation?: boolean;
}

const MachineStatusBadge: React.FC<MachineStatusBadgeProps> = ({
  machine,
  className,
  stopPropagation = true,
}) => {
  const kind = getMachineVisualKind(machine);
  const label = getMachineStatusLabel(machine);

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={cn(
              'cursor-default rounded px-1.5 py-0.5 text-xs font-medium leading-tight',
              machineBadgeClass[kind],
              className,
            )}
            onClick={stopPropagation ? (e) => e.stopPropagation() : undefined}
          >
            {label}
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="z-[60] max-w-[240px] text-xs leading-snug">
          {machineVisualKindTooltip(kind)}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default MachineStatusBadge;
