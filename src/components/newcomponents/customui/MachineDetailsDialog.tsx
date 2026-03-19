import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  useGetMachineEventsQuery,
  useCreateMachineEventMutation,
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
import { Loader2, Plus, Pencil, Trash2, Play, Pause, Wrench, Power } from 'lucide-react';
import toast from 'react-hot-toast';
import AddMachineItemDialog from './AddMachineItemDialog';
import AddMachineMaintenanceLogDialog from './AddMachineMaintenanceLogDialog';
import RunningOrdersPlaceholder from './RunningOrdersPlaceholder';
import {
  useGetMachineMaintenanceLogsQuery,
  useDeleteMachineMaintenanceLogMutation,
} from '@/features/machineMaintenanceLogs/machineMaintenanceLogsApi';
import type { MachineMaintenanceLog } from '@/types/machineMaintenanceLog';

interface MachineDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  machine: Machine | null;
  onEditRequest?: () => void;
  onMachineUpdated?: () => void;
}

const EVENT_TYPES: { type: MachineEventType; label: string; icon: React.ReactNode }[] = [
  { type: 'IDLE', label: 'Idle', icon: <Pause className="h-4 w-4" /> },
  { type: 'RUNNING', label: 'Running', icon: <Play className="h-4 w-4" /> },
  { type: 'OFF', label: 'Off', icon: <Power className="h-4 w-4" /> },
  { type: 'MAINTENANCE', label: 'Maintenance', icon: <Wrench className="h-4 w-4" /> },
];

/**
 * Full machine details dialog - advanced view with metadata, status controls,
 * event history, machine items (with item names), and running orders.
 */
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

  const itemsMap = React.useMemo(() => {
    const m = new Map<number, { name: string; unit: string }>();
    (items ?? []).forEach((i) => m.set(i.id, { name: i.name, unit: i.unit }));
    return m;
  }, [items]);

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl">{machine.name}</DialogTitle>
              <DialogDescription>
                {machine.model_number && `Model: ${machine.model_number}`}
                {machine.manufacturer && ` • ${machine.manufacturer}`}
              </DialogDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => onEditRequest?.()}>
              <Pencil className="h-4 w-4 mr-1" />
              Edit
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto space-y-6 py-4">
          {/* Status controls */}
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-2">Status</p>
            <div className="flex flex-wrap gap-2">
              {EVENT_TYPES.map(({ type, label, icon }) => (
                <Button
                  key={type}
                  variant={machine.is_running && type === 'RUNNING' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleStatusChange(type)}
                  disabled={isCreatingEvent}
                  className={
                    machine.is_running && type === 'RUNNING'
                      ? 'bg-brand-primary hover:bg-brand-primary-hover'
                      : ''
                  }
                >
                  {icon}
                  <span className="ml-1">{label}</span>
                </Button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Current: <Badge variant={machine.is_running ? 'default' : 'secondary'}>
                {machine.is_running ? 'Running' : 'Not running'}
              </Badge>
            </p>
          </div>

          {/* Metadata */}
          {/* NOTE: next_maintenance_schedule/note - design unclear. Should be driven by Maintenance Logs?
              See progressDesign.md 2026-02-28. Revisit before auto-deriving from logs. */}
          {(machine.note || machine.next_maintenance_schedule || machine.next_maintenance_note) && (
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Details</p>
              <dl className="text-sm space-y-1">
                {machine.note && (
                  <div>
                    <dt className="text-muted-foreground">Note</dt>
                    <dd className="text-card-foreground">{machine.note}</dd>
                  </div>
                )}
                {machine.next_maintenance_schedule && (
                  <div>
                    <dt className="text-muted-foreground">Next maintenance</dt>
                    <dd className="text-card-foreground">{machine.next_maintenance_schedule.slice(0, 10)}</dd>
                  </div>
                )}
                {machine.next_maintenance_note && (
                  <div>
                    <dt className="text-muted-foreground">Maintenance note</dt>
                    <dd className="text-card-foreground">{machine.next_maintenance_note}</dd>
                  </div>
                )}
              </dl>
            </div>
          )}

          {/* Maintenance Logs */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-muted-foreground">Maintenance Logs</p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsAddMaintenanceLogOpen(true)}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Log
              </Button>
            </div>
            {logsLoading ? (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : !maintenanceLogs || maintenanceLogs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No maintenance logs yet</p>
            ) : (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {maintenanceLogs.map((log: MachineMaintenanceLog) => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between text-sm py-2 px-3 rounded-md bg-muted/30 border border-border"
                  >
                    <div>
                      <Badge variant="outline" className="text-xs">{log.maintenance_type}</Badge>
                      <span className="ml-2 font-medium">{log.summary}</span>
                      <span className="ml-2 text-muted-foreground">
                        {log.maintenance_date} {log.performed_by && `• ${log.performed_by}`}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-destructive hover:text-destructive"
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
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Event history */}
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-2">Event History</p>
            {eventsLoading ? (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : !events || events.length === 0 ? (
              <p className="text-sm text-muted-foreground">No events yet</p>
            ) : (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {events.map((e) => (
                  <div
                    key={e.id}
                    className="flex items-center justify-between text-sm py-1 border-b border-border last:border-0"
                  >
                    <Badge variant="outline">{e.event_type}</Badge>
                    <span className="text-muted-foreground">
                      {new Date(e.started_at).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Machine items - with item names */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-muted-foreground">Machine Items</p>
              <Button
                size="sm"
                className="bg-brand-primary hover:bg-brand-primary-hover"
                onClick={() => setIsAddItemOpen(true)}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Item
              </Button>
            </div>
            {!machineItems || machineItems.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">No items assigned</p>
            ) : (
              <div className="border border-border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="py-2">Item Name</TableHead>
                      <TableHead className="py-2 w-20">Unit</TableHead>
                      <TableHead className="py-2 w-24">Qty</TableHead>
                      <TableHead className="py-2 w-24">Req</TableHead>
                      <TableHead className="py-2 w-24">Defective</TableHead>
                      <TableHead className="py-2 w-24 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {machineItems.map((mi) => {
                      const info = getItemDisplay(mi);
                      const isEditing = editingItemId === mi.id;
                      return (
                        <TableRow key={mi.id} className="border-b border-border">
                          <TableCell className="py-2 font-medium">{info.name}</TableCell>
                          <TableCell className="py-2 text-muted-foreground">{info.unit}</TableCell>
                          <TableCell className="py-2">
                            {isEditing ? (
                              <div className="flex gap-1">
                                <input
                                  type="number"
                                  min="0"
                                  value={editQty}
                                  onChange={(e) => setEditQty(e.target.value)}
                                  className="w-16 px-2 py-1 text-sm border rounded bg-background"
                                />
                                <Button size="sm" variant="ghost" onClick={() => handleSaveEditQty(mi)}>
                                  Save
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    setEditingItemId(null);
                                    setEditQty('');
                                  }}
                                >
                                  Cancel
                                </Button>
                              </div>
                            ) : (
                              <span
                                className="cursor-pointer hover:underline"
                                onClick={() => {
                                  setEditingItemId(mi.id);
                                  setEditQty(mi.qty.toString());
                                }}
                              >
                                {mi.qty}
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="py-2 text-muted-foreground">
                            {mi.req_qty ?? '—'}
                          </TableCell>
                          <TableCell className="py-2 text-muted-foreground">
                            {mi.defective_qty ?? '—'}
                          </TableCell>
                          <TableCell className="py-2 text-right">
                            {!isEditing && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-destructive"
                                onClick={() => handleDeleteItem(mi)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          {/* Running orders */}
          <RunningOrdersPlaceholder />
        </div>

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
