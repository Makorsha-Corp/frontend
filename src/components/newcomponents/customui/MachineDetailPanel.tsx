import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import EditMachineDialog from './EditMachineDialog';
import AddMachineItemDialog from './AddMachineItemDialog';
import RunningOrdersPlaceholder from './RunningOrdersPlaceholder';

interface MachineDetailPanelProps {
  machine: Machine | null;
  onMachineUpdated?: () => void;
}

const EVENT_TYPES: { type: MachineEventType; label: string; icon: React.ReactNode }[] = [
  { type: 'IDLE', label: 'Idle', icon: <Pause className="h-4 w-4" /> },
  { type: 'RUNNING', label: 'Running', icon: <Play className="h-4 w-4" /> },
  { type: 'OFF', label: 'Off', icon: <Power className="h-4 w-4" /> },
  { type: 'MAINTENANCE', label: 'Maintenance', icon: <Wrench className="h-4 w-4" /> },
];

const MachineDetailPanel: React.FC<MachineDetailPanelProps> = ({
  machine,
  onMachineUpdated,
}) => {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [editQty, setEditQty] = useState('');

  const [createEvent, { isLoading: isCreatingEvent }] = useCreateMachineEventMutation();
  const [updateMachineItem] = useUpdateMachineItemMutation();
  const [deleteMachineItem] = useDeleteMachineItemMutation();

  const { data: events, isLoading: eventsLoading } = useGetMachineEventsQuery(
    { machine_id: machine?.id ?? 0, skip: 0, limit: 20 },
    { skip: !machine?.id }
  );

  const { data: machineItems } = useGetMachineItemsQuery(
    { machine_id: machine?.id ?? 0, skip: 0, limit: 100 },
    { skip: !machine?.id }
  );

  const { data: items } = useGetItemsQuery({ skip: 0, limit: 100 });

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
      await updateMachineItem({
        id: mi.id,
        data: { qty: qtyNum },
      }).unwrap();
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

  if (!machine) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px] text-muted-foreground">
        Select a machine to view details
      </div>
    );
  }

  const itemInfo = (itemId: number) => itemsMap.get(itemId) ?? { name: `Item #${itemId}`, unit: '—' };

  return (
    <div className="flex-1 flex flex-col gap-4 overflow-y-auto">
      {/* Metadata & Status */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{machine.name}</CardTitle>
            <Button variant="outline" size="sm" onClick={() => setIsEditOpen(true)}>
              <Pencil className="h-4 w-4 mr-1" />
              Edit
            </Button>
          </div>
          <CardDescription>
            {machine.model_number && `Model: ${machine.model_number}`}
            {machine.manufacturer && ` • ${machine.manufacturer}`}
            {machine.next_maintenance_schedule && (
              <> • Next maintenance: {machine.next_maintenance_schedule.slice(0, 10)}</>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
          {machine.note && (
            <p className="text-sm text-muted-foreground">{machine.note}</p>
          )}
        </CardContent>
      </Card>

      {/* Event History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Event History</CardTitle>
          <CardDescription>Recent status changes</CardDescription>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>

      {/* Machine Items */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Machine Items</CardTitle>
            <Button
              size="sm"
              className="bg-brand-primary hover:bg-brand-primary-hover"
              onClick={() => setIsAddItemOpen(true)}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Item
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!machineItems || machineItems.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">No items assigned</p>
          ) : (
            <div className="border border-border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="py-2">Item</TableHead>
                    <TableHead className="py-2 w-20">Unit</TableHead>
                    <TableHead className="py-2 w-24">Qty</TableHead>
                    <TableHead className="py-2 w-24">Req</TableHead>
                    <TableHead className="py-2 w-24">Defective</TableHead>
                    <TableHead className="py-2 w-24 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {machineItems.map((mi) => {
                    const info = itemInfo(mi.item_id);
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
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleSaveEditQty(mi)}
                              >
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
        </CardContent>
      </Card>

      {/* Running Orders Placeholder */}
      <RunningOrdersPlaceholder />

      <EditMachineDialog
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        machine={machine}
        onSuccess={onMachineUpdated}
      />

      <AddMachineItemDialog
        open={isAddItemOpen}
        onOpenChange={setIsAddItemOpen}
        machineId={machine.id}
        machineName={machine.name}
        existingItemIds={(machineItems ?? []).map((mi) => mi.item_id)}
        onSuccess={onMachineUpdated}
      />
    </div>
  );
};

export default MachineDetailPanel;
