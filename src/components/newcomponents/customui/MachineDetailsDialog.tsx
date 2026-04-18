import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  useGetMachineEventsQuery,
  useCreateMachineEventMutation,
  useGetLatestMachineEventQuery,
} from '@/features/machines/machinesApi';
import {
  useGetMachineItemsQuery,
  useUpdateMachineItemMutation,
  useDeleteMachineItemMutation,
} from '@/features/machineItems/machineItemsApi';
import { useGetItemsQuery } from '@/features/items/itemsApi';
import type { Machine } from '@/types/machine';
import type { MachineEventType } from '@/types/machine';
import type { MachineItem } from '@/types/machineItem';
import {
  Loader2,
  Plus,
  Pencil,
  Trash2,
  Play,
  Pause,
  Wrench,
  Power,
  Check,
  X,
  Package,
  CalendarClock,
} from 'lucide-react';
import toast from 'react-hot-toast';
import AddMachineItemDialog from './AddMachineItemDialog';
import AddMachineMaintenanceLogDialog from './AddMachineMaintenanceLogDialog';
import RunningOrdersPlaceholder from './RunningOrdersPlaceholder';
import {
  useGetMachineMaintenanceLogsQuery,
  useDeleteMachineMaintenanceLogMutation,
} from '@/features/machineMaintenanceLogs/machineMaintenanceLogsApi';
import type { MachineMaintenanceLog } from '@/types/machineMaintenanceLog';
import { cn } from '@/lib/utils';
import {
  getHighlightedEventType,
  getMachineVisualKind,
  activeEventButtonClass,
  machineTopBarClass,
  machineBadgeClass,
  machineVisualKindFromEventType,
} from '@/lib/machineVisualStatus';

interface MachineDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  machine: Machine | null;
  onEditRequest?: () => void;
  onMachineUpdated?: () => void;
}

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

const MachineDetailsDialog: React.FC<MachineDetailsDialogProps> = ({
  open,
  onOpenChange,
  machine,
  onEditRequest,
  onMachineUpdated,
}) => {
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [isAddMaintenanceLogOpen, setIsAddMaintenanceLogOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [editQty, setEditQty] = useState('');

  const [createEvent, { isLoading: isCreatingEvent }] = useCreateMachineEventMutation();
  const [updateMachineItem] = useUpdateMachineItemMutation();
  const [deleteMachineItem] = useDeleteMachineItemMutation();

  const { data: latestEvent } = useGetLatestMachineEventQuery(machine?.id ?? 0, {
    skip: !machine?.id || !open,
  });

  const { data: events, isLoading: eventsLoading } = useGetMachineEventsQuery(
    { machine_id: machine?.id ?? 0, skip: 0, limit: 50 },
    { skip: !machine?.id || !open }
  );

  const { data: machineItems } = useGetMachineItemsQuery(
    { machine_id: machine?.id ?? 0, skip: 0, limit: 100 },
    { skip: !machine?.id || !open }
  );

  const { data: items } = useGetItemsQuery({ skip: 0, limit: 100 }, { skip: !open });
  const { data: maintenanceLogs = [], isLoading: logsLoading } = useGetMachineMaintenanceLogsQuery(
    { machine_id: machine?.id ?? 0, skip: 0, limit: 50 },
    { skip: !machine?.id || !open }
  );
  const [deleteMaintenanceLog] = useDeleteMachineMaintenanceLogMutation();

  const itemsMap = useMemo(() => {
    const m = new Map<number, { name: string; unit: string }>();
    (items ?? []).forEach((i) => m.set(i.id, { name: i.name, unit: i.unit }));
    return m;
  }, [items]);

  const sortedEvents = useMemo(() => {
    if (!events?.length) return [];
    return [...events].sort(
      (a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime()
    );
  }, [events]);

  const sortedLogs = useMemo(() => {
    if (!maintenanceLogs.length) return [];
    return [...maintenanceLogs].sort(
      (a, b) => new Date(b.maintenance_date).getTime() - new Date(a.maintenance_date).getTime()
    );
  }, [maintenanceLogs]);

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

  const handleSaveEditQty = async (mi: MachineItem) => {
    const qtyNum = parseInt(editQty, 10);
    if (isNaN(qtyNum) || qtyNum < 0) {
      toast.error('Invalid quantity');
      return;
    }
    try {
      await updateMachineItem({ id: mi.id, data: { qty: qtyNum } }).unwrap();
      toast.success('Quantity updated');
      setEditingItemId(null);
      onMachineUpdated?.();
    } catch (error: any) {
      toast.error(error?.data?.detail || 'Failed to update');
    }
  };

  const handleDeleteItem = async (mi: MachineItem) => {
    if (!window.confirm('Remove this item from the machine?')) return;
    try {
      await deleteMachineItem(mi.id).unwrap();
      toast.success('Item removed');
      onMachineUpdated?.();
    } catch (error: any) {
      toast.error(error?.data?.detail || 'Failed to remove');
    }
  };

  const itemInfo = (itemId: number) =>
    itemsMap.get(itemId) ?? { name: `Item #${itemId}`, unit: '—' };

  const getItemDisplay = (mi: { item_id: number; item_name?: string | null; item_unit?: string | null }) => ({
    name: mi.item_name ?? itemInfo(mi.item_id).name,
    unit: mi.item_unit ?? itemInfo(mi.item_id).unit,
  });

  if (!machine) return null;

  const highlightedType = getHighlightedEventType(machine, latestEvent);
  const visualKind = getMachineVisualKind(machine, latestEvent);
  const metaLine = [machine.model_number, machine.manufacturer].filter(Boolean).join(' · ');

  const sectionLabel = 'text-[10px] font-semibold uppercase tracking-wider text-muted-foreground';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          'flex max-h-[min(90vh,880px)] w-[calc(100vw-1.5rem)] max-w-3xl flex-col gap-0 overflow-hidden p-0',
          'border-border bg-card text-card-foreground sm:rounded-lg'
        )}
      >
        <TooltipProvider delayDuration={300}>
          <div className={cn('h-1 shrink-0 rounded-t-lg', machineTopBarClass[visualKind])} aria-hidden />

          <div className="shrink-0 space-y-4 px-6 pb-2 pt-6 pr-14">
            <DialogHeader className="space-y-2 text-left">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1 space-y-1">
                  <DialogTitle className="text-xl font-semibold tracking-tight leading-tight">
                    {machine.name}
                  </DialogTitle>
                  {metaLine ? (
                    <DialogDescription className="text-xs text-muted-foreground line-clamp-2">
                      {metaLine}
                    </DialogDescription>
                  ) : (
                    <DialogDescription className="text-xs text-muted-foreground/70 italic">
                      No model / manufacturer on file
                    </DialogDescription>
                  )}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 shrink-0"
                  onClick={() => onEditRequest?.()}
                  aria-label="Edit machine"
                  title="Edit machine"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
            </DialogHeader>

            <div>
              <p className={cn(sectionLabel, 'mb-2')}>Status</p>
              <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4 sm:gap-2">
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
          </div>

          <Separator />

          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4 space-y-5">
            {/* Details */}
            {(machine.note || machine.next_maintenance_schedule || machine.next_maintenance_note) && (
              <div className="space-y-2">
                <p className={sectionLabel}>Machine details</p>
                <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-3 text-sm">
                  {machine.note && (
                    <p className="text-card-foreground border-l-2 border-brand-primary/35 pl-2.5 leading-relaxed">
                      {machine.note}
                    </p>
                  )}
                  {(machine.next_maintenance_schedule || machine.next_maintenance_note) && (
                    <div className="flex gap-2 text-xs">
                      <CalendarClock className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                      <div className="space-y-1 min-w-0">
                        {machine.next_maintenance_schedule && (
                          <p>
                            <span className="text-muted-foreground">Next maintenance: </span>
                            <span className="font-medium tabular-nums">
                              {machine.next_maintenance_schedule.slice(0, 10)}
                            </span>
                          </p>
                        )}
                        {machine.next_maintenance_note && (
                          <p className="text-muted-foreground">{machine.next_maintenance_note}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Maintenance logs */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className={sectionLabel}>Maintenance logs</p>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs"
                  onClick={() => setIsAddMaintenanceLogOpen(true)}
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Add log
                </Button>
              </div>
              {logsLoading ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : sortedLogs.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-muted/15 py-8 text-center">
                  <Wrench className="h-7 w-7 text-muted-foreground/35" />
                  <p className="text-xs text-muted-foreground">No maintenance logs yet.</p>
                </div>
              ) : (
                <ul className="max-h-44 space-y-2 overflow-y-auto pr-1">
                  {sortedLogs.map((log: MachineMaintenanceLog) => (
                    <li
                      key={log.id}
                      className="flex flex-col gap-2 rounded-lg border border-border bg-card px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="secondary" className="text-[10px] font-medium">
                            {log.maintenance_type}
                          </Badge>
                          <span className="text-xs text-muted-foreground tabular-nums">
                            {log.maintenance_date}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-card-foreground">{log.summary}</p>
                        {log.performed_by ? (
                          <p className="text-[11px] text-muted-foreground">{log.performed_by}</p>
                        ) : null}
                      </div>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 shrink-0 self-end sm:self-center text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={async () => {
                              if (!window.confirm('Delete this maintenance log?')) return;
                              try {
                                await deleteMaintenanceLog(log.id).unwrap();
                                toast.success('Log deleted');
                                onMachineUpdated?.();
                              } catch (err: unknown) {
                                const e = err as { data?: { detail?: string } };
                                toast.error(e?.data?.detail || 'Failed to delete');
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete log</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Delete log</TooltipContent>
                      </Tooltip>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <Separator />

            {/* Event history */}
            <div className="space-y-2">
              <p className={sectionLabel}>Event history</p>
              {eventsLoading ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : sortedEvents.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-muted/15 py-8 text-center">
                  <Pause className="h-7 w-7 text-muted-foreground/35" />
                  <p className="text-xs text-muted-foreground">No status events recorded yet.</p>
                </div>
              ) : (
                <ul className="max-h-48 space-y-1.5 overflow-y-auto pr-1">
                  {sortedEvents.map((e) => {
                    const vk = machineVisualKindFromEventType(e.event_type);
                    return (
                      <li
                        key={e.id}
                        className="flex items-center justify-between gap-3 rounded-md border border-border/80 bg-muted/10 px-3 py-2"
                      >
                        <span
                          className={cn(
                            'inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                            machineBadgeClass[vk]
                          )}
                        >
                          {e.event_type}
                        </span>
                        <time
                          className="text-xs text-muted-foreground tabular-nums shrink-0"
                          dateTime={e.started_at}
                        >
                          {new Date(e.started_at).toLocaleString()}
                        </time>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <Separator />

            {/* Machine items */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className={sectionLabel}>Items on machine</p>
                <Button
                  size="sm"
                  className="h-8 bg-brand-primary text-xs hover:bg-brand-primary-hover"
                  onClick={() => setIsAddItemOpen(true)}
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Add item
                </Button>
              </div>
              {!machineItems || machineItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-muted/15 py-10 text-center">
                  <Package className="h-8 w-8 text-muted-foreground/35" />
                  <p className="text-xs text-muted-foreground">No items assigned to this machine.</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-border">
                  <table className="w-full min-w-[520px] text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/50 text-left text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                        <th className="px-3 py-2.5 font-medium">Item</th>
                        <th className="px-2 py-2.5 font-medium w-16">Unit</th>
                        <th className="px-2 py-2.5 font-medium w-28 text-right">Qty</th>
                        <th className="px-2 py-2.5 font-medium w-20 text-right">Req</th>
                        <th className="px-2 py-2.5 font-medium w-24 text-right">Defective</th>
                        <th className="px-2 py-2.5 font-medium w-24 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {machineItems.map((mi) => {
                        const info = getItemDisplay(mi);
                        const isEditing = editingItemId === mi.id;
                        const low = mi.req_qty != null && mi.qty < mi.req_qty;
                        return (
                          <tr key={mi.id} className={cn('hover:bg-muted/20', low && 'bg-destructive/[0.04]')}>
                            <td className="px-3 py-2.5 font-medium text-card-foreground max-w-[200px]">
                              <span className="line-clamp-2">{info.name}</span>
                            </td>
                            <td className="px-2 py-2.5 text-muted-foreground text-xs">{info.unit}</td>
                            <td className="px-2 py-2.5 text-right tabular-nums">
                              {isEditing ? (
                                <div className="flex items-center justify-end gap-1">
                                  <Input
                                    type="number"
                                    min={0}
                                    value={editQty}
                                    onChange={(e) => setEditQty(e.target.value)}
                                    className="h-8 w-16 px-2 text-right text-sm"
                                  />
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-8 w-8 shrink-0 text-emerald-600"
                                        onClick={() => handleSaveEditQty(mi)}
                                      >
                                        <Check className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Save quantity</TooltipContent>
                                  </Tooltip>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-8 w-8 shrink-0"
                                        onClick={() => {
                                          setEditingItemId(null);
                                          setEditQty('');
                                        }}
                                      >
                                        <X className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Cancel</TooltipContent>
                                  </Tooltip>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  className={cn(
                                    'rounded px-1.5 py-0.5 -mr-1.5 hover:bg-muted/80',
                                    low && 'text-destructive font-semibold'
                                  )}
                                  onClick={() => {
                                    setEditingItemId(mi.id);
                                    setEditQty(mi.qty.toString());
                                  }}
                                >
                                  {mi.qty}
                                </button>
                              )}
                            </td>
                            <td className="px-2 py-2.5 text-right text-muted-foreground tabular-nums">
                              {mi.req_qty ?? '—'}
                            </td>
                            <td className="px-2 py-2.5 text-right text-muted-foreground tabular-nums">
                              {mi.defective_qty ?? '—'}
                            </td>
                            <td className="px-2 py-2.5 text-right">
                              {!isEditing && (
                                <div className="flex justify-end gap-0.5">
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() => {
                                          setEditingItemId(mi.id);
                                          setEditQty(mi.qty.toString());
                                        }}
                                      >
                                        <Pencil className="h-3.5 w-3.5" />
                                        <span className="sr-only">Edit quantity</span>
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Edit qty</TooltipContent>
                                  </Tooltip>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                        onClick={() => handleDeleteItem(mi)}
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                        <span className="sr-only">Remove item</span>
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Remove from machine</TooltipContent>
                                  </Tooltip>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <RunningOrdersPlaceholder />
          </div>
        </TooltipProvider>

        <AddMachineItemDialog
          open={isAddItemOpen}
          onOpenChange={setIsAddItemOpen}
          machineId={machine.id}
          machineName={machine.name}
          existingItemIds={(machineItems ?? []).map((mi) => mi.item_id)}
          onSuccess={onMachineUpdated}
        />
        <AddMachineMaintenanceLogDialog
          open={isAddMaintenanceLogOpen}
          onOpenChange={setIsAddMaintenanceLogOpen}
          machineId={machine.id}
          machineName={machine.name}
          onSuccess={onMachineUpdated}
        />
      </DialogContent>
    </Dialog>
  );
};

export default MachineDetailsDialog;
