import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useCreateMachineEventMutation } from '@/features/machines/machinesApi';
import { useGetMachineItemsQuery } from '@/features/machineItems/machineItemsApi';
import type { Machine } from '@/types/machine';
import type { MachineEventType } from '@/types/machine';
import type { MachineItem } from '@/types/machineItem';
import { Pencil, Play, Pause, Wrench, Power, Maximize2, Package, Trash2, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import MachineDetailsDialog from './MachineDetailsDialog';
import ActiveOrdersPanel from './RunningOrdersPlaceholder';
import { cn } from '@/lib/utils';
import {
  getHighlightedEventType,
  getMachineVisualKind,
  activeEventButtonClass,
  machineListTopBarClass,
} from '@/lib/machineVisualStatus';

export interface MachineFullDetailsIntent {
  id: number;
}

interface MachineDetailCardProps {
  machine: Machine | null;
  onMachineUpdated?: () => void;
  onEditRequest?: () => void;
  onDeactivateRequest?: () => void;
  isDeactivating?: boolean;
  className?: string;
  /** When set with matching `machine.id`, opens the full-details dialog once; parent should clear via `onFullDetailsIntentConsumed`. */
  fullDetailsIntent?: MachineFullDetailsIntent | null;
  onFullDetailsIntentConsumed?: () => void;
}

/** Short labels so four buttons fit a narrow panel in a 2×2 grid. */
const STATUS_CONTROLS: {
  type: MachineEventType;
  shortLabel: string;
  icon: React.ReactNode;
}[] = [
  { type: 'IDLE', shortLabel: 'Idle', icon: <Pause className="h-3.5 w-3.5 shrink-0" /> },
  { type: 'RUNNING', shortLabel: 'Running', icon: <Play className="h-3.5 w-3.5 shrink-0" /> },
  { type: 'OFF', shortLabel: 'Off', icon: <Power className="h-3.5 w-3.5 shrink-0" /> },
  { type: 'MAINTENANCE', shortLabel: 'Maint.', icon: <Wrench className="h-3.5 w-3.5 shrink-0" /> },
];

const MachineDetailCard: React.FC<MachineDetailCardProps> = ({
  machine,
  onMachineUpdated,
  onEditRequest,
  onDeactivateRequest,
  isDeactivating = false,
  className = '',
  fullDetailsIntent,
  onFullDetailsIntentConsumed,
}) => {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const [createEvent, { isLoading: isCreatingEvent }] = useCreateMachineEventMutation();

  useEffect(() => {
    if (!machine || !fullDetailsIntent) return;
    if (fullDetailsIntent.id !== machine.id) return;
    setIsDetailsOpen(true);
    onFullDetailsIntentConsumed?.();
  }, [fullDetailsIntent, machine, onFullDetailsIntentConsumed]);

  const { data: machineItems } = useGetMachineItemsQuery(
    { machine_id: machine?.id ?? 0, skip: 0, limit: 50 },
    { skip: !machine?.id }
  );

  const handleStatusChange = async (eventType: MachineEventType) => {
    if (!machine) return;
    try {
      await createEvent({
        machine_id: machine.id,
        data: { machine_id: machine.id, event_type: eventType },
      }).unwrap();
      toast.success(`Status updated to ${eventType.toLowerCase()}`);
      onMachineUpdated?.();
    } catch (error: any) {
      toast.error(error?.data?.detail || 'Failed to update status');
    }
  };

  if (!machine) {
    return (
      <Card className={cn('flex flex-col min-h-0', className)}>
        <CardContent className="flex-1 flex items-center justify-center py-16 text-muted-foreground text-sm">
          Select a machine to view details
        </CardContent>
      </Card>
    );
  }

  const highlightedType = getHighlightedEventType(machine);
  const visualKind = getMachineVisualKind(machine);

  const isLowStock = (mi: MachineItem) => mi.req_qty != null && mi.qty < mi.req_qty;

  const metaLine = [machine.model_number, machine.manufacturer].filter(Boolean).join(' · ');

  return (
    <TooltipProvider delayDuration={300}>
      <Card className={cn('flex flex-col min-h-0 overflow-hidden border-border shadow-sm', className)}>
        <div className={cn('h-2 shrink-0 rounded-t-lg', machineListTopBarClass[visualKind])} aria-hidden />

        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="p-4 space-y-4">
            {/* Identity + actions */}
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
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0 text-muted-foreground hover:text-brand-primary"
                      onClick={() => setIsDetailsOpen(true)}
                      aria-label="Open full details"
                    >
                      <Maximize2 className="h-4 w-4" strokeWidth={2} />
                      <span className="sr-only">Open full details</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">Full details</TooltipContent>
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

            {machine.note ? (
              <p className="text-xs text-muted-foreground border-l-2 border-brand-primary/30 pl-2.5 py-0.5 leading-relaxed">
                {machine.note}
              </p>
            ) : null}

            <Separator className="bg-border" />

            {/* Status — 2×2 grid, no duplicate “current” line */}
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Status
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                {STATUS_CONTROLS.map(({ type, shortLabel, icon }) => {
                  const active = highlightedType === type;
                  return (
                    <Button
                      key={type}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleStatusChange(type)}
                      disabled={isCreatingEvent}
                      className={cn(
                        'h-9 justify-center gap-1.5 px-2 text-xs font-medium',
                        active && activeEventButtonClass(type)
                      )}
                    >
                      {icon}
                      <span className="truncate">{shortLabel}</span>
                    </Button>
                  );
                })}
              </div>
            </div>

            <Separator className="bg-border" />

            {/* Items — compact table */}
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-card-foreground">Items on machine</span>
                <span className="text-[10px] font-medium tabular-nums text-muted-foreground uppercase tracking-wide">
                  {machineItems?.length ?? 0} line{(machineItems?.length ?? 0) === 1 ? '' : 's'}
                </span>
              </div>

              {!machineItems || machineItems.length === 0 ? (
                <div className="flex min-h-[122px] flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-muted/20 py-8 px-3 text-center">
                  <Package className="h-8 w-8 text-muted-foreground/40" />
                  <p className="text-xs text-muted-foreground">No parts assigned to this machine yet.</p>
                </div>
              ) : (
                <div className="flex min-h-[122px] flex-col rounded-lg border border-border overflow-hidden bg-card">
                  <ul className="min-h-0 flex-1 border-b border-border/40 max-h-[min(240px,40vh)] overflow-y-auto">
                    {machineItems.map((mi) => {
                      const low = isLowStock(mi);
                      const defective = mi.defective_qty != null && mi.defective_qty > 0;
                      const qtyDisplay =
                        mi.req_qty != null ? (
                          <span className="tabular-nums">
                            <span className={low ? 'text-destructive font-semibold' : 'text-card-foreground'}>
                              {mi.qty}
                            </span>
                            <span className="text-muted-foreground">/{mi.req_qty}</span>
                            {mi.item_unit ? (
                              <span className="text-muted-foreground text-[11px] ml-0.5">{mi.item_unit}</span>
                            ) : null}
                          </span>
                        ) : (
                          <span className="tabular-nums text-card-foreground">
                            {mi.qty}
                            {mi.item_unit ? (
                              <span className="text-muted-foreground text-[11px] ml-0.5">{mi.item_unit}</span>
                            ) : null}
                          </span>
                        );
                      return (
                        <li
                          key={mi.id}
                          className={cn(
                            'flex items-center justify-between gap-3 border-b border-border/40 px-3 py-2.5 text-sm last:border-b-0',
                            'hover:bg-muted/30 transition-colors',
                            low && 'bg-destructive/[0.06]'
                          )}
                        >
                          <div className="min-w-0 flex flex-1 items-start gap-2">
                            {low ? (
                              <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-destructive mt-0.5" aria-hidden />
                            ) : (
                              <span className="w-3.5 shrink-0" aria-hidden />
                            )}
                            <div className="min-w-0">
                              <p className="font-medium text-card-foreground leading-snug truncate">
                                {mi.item_name ?? `Item #${mi.item_id}`}
                              </p>
                              {defective ? (
                                <p className="text-[10px] text-amber-700 dark:text-amber-400 mt-0.5">
                                  {mi.defective_qty} defective
                                </p>
                              ) : null}
                            </div>
                          </div>
                          <div className="shrink-0 text-right text-sm tabular-nums" title="Quantity">
                            {qtyDisplay}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>

            <Separator className="bg-border" />

            <ActiveOrdersPanel scope={{ machineId: machine.id }} minimal compact />
          </div>
        </div>
      </Card>

      <MachineDetailsDialog
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
        machine={machine}
        onEditRequest={onEditRequest}
        onMachineUpdated={onMachineUpdated}
      />
    </TooltipProvider>
  );
};

export default MachineDetailCard;
