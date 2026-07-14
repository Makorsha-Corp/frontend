import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { Machine } from '@/types/machine';
import { Pencil, Trash2 } from 'lucide-react';
import MachineDetailBody from './MachineDetailBody';
import { cn } from '@/lib/utils';
import { getMachineVisualKind, machineListTopBarClass } from '@/lib/machineVisualStatus';

interface MachineDetailCardProps {
  machine: Machine | null;
  onMachineUpdated?: () => void;
  onEditRequest?: () => void;
  onDeactivateRequest?: () => void;
  isDeactivating?: boolean;
  className?: string;
}

const MachineDetailCard: React.FC<MachineDetailCardProps> = ({
  machine,
  onMachineUpdated,
  onEditRequest,
  onDeactivateRequest,
  isDeactivating = false,
  className = '',
}) => {
  if (!machine) {
    return (
      <Card className={cn('flex flex-col min-h-0', className)}>
        <CardContent className="flex-1 flex items-center justify-center py-16 text-muted-foreground text-sm">
          Select a machine to view details
        </CardContent>
      </Card>
    );
  }

  const visualKind = getMachineVisualKind(machine);
  const metaLine = [machine.model_number, machine.manufacturer].filter(Boolean).join(' · ');

  return (
    <TooltipProvider delayDuration={300}>
      <Card className={cn('flex flex-col min-h-0 min-w-0 overflow-hidden border-border shadow-sm @container', className)}>
        <div className={cn('h-2 shrink-0 rounded-t-lg', machineListTopBarClass[visualKind])} aria-hidden />

        <div className="flex-1 min-h-0 min-w-0 overflow-y-auto overflow-x-hidden overscroll-x-contain">
          <div className="p-4 space-y-4 min-w-0">
            <div className="flex items-start gap-3">
              <div className="min-w-0 flex-1 space-y-1">
                <h2 className="text-lg font-semibold tracking-tight text-card-foreground leading-tight truncate">
                  {machine.name}
                </h2>
                {metaLine ? (
                  <p className="text-xs text-muted-foreground leading-snug line-clamp-2">{metaLine}</p>
                ) : (
                  <p className="text-xs text-muted-foreground/70 italic">No model / manufacturer</p>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-0.5">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEditRequest?.()}>
                      <Pencil className="h-4 w-4" />
                      <span className="sr-only">Edit machine</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">Edit machine</TooltipContent>
                </Tooltip>
                {onDeactivateRequest && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={onDeactivateRequest}
                        disabled={isDeactivating}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Deactivate machine</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">Deactivate</TooltipContent>
                  </Tooltip>
                )}
              </div>
            </div>

            <Separator className="bg-border" />

            <MachineDetailBody machine={machine} onMachineUpdated={onMachineUpdated} />
          </div>
        </div>
      </Card>
    </TooltipProvider>
  );
};

export default MachineDetailCard;
