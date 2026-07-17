import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  useCreateMachineEventMutation,
  useGetMachineActivityEventsQuery,
} from '@/features/machines/machinesApi';
import {
  useGetMachineItemsQuery,
  useUpdateMachineItemMutation,
  useDeleteMachineItemMutation,
} from '@/features/machineItems/machineItemsApi';
import { useGetItemsQuery } from '@/features/items/itemsApi';
import type { Machine, MachineEventType } from '@/types/machine';
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
  AlertTriangle,
  History,
} from 'lucide-react';
import toast from 'react-hot-toast';
import AddMachineItemDialog from './AddMachineItemDialog';
import MachineActivityEventLogRow from './MachineActivityEventLogRow';
import MachineActivityWorkOrderGroupRow from './MachineActivityWorkOrderGroupRow';
import { groupMachineActivityEvents } from './machineActivityGrouping';
import ActiveOrdersPanel from './RunningOrdersPlaceholder';
import MachineWorkOrderQuickActions from './orders/MachineWorkOrderQuickActions';
import { useDeleteMachineMaintenanceLogMutation } from '@/features/machineMaintenanceLogs/machineMaintenanceLogsApi';
import { cn } from '@/lib/utils';
import { getHighlightedEventType, activeEventButtonClass } from '@/lib/machineVisualStatus';

export interface MachineDetailBodyProps {
  machine: Machine;
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

const sectionLabel = 'text-[10px] font-semibold uppercase tracking-wider text-muted-foreground';

export const MachineDetailBody: React.FC<MachineDetailBodyProps> = ({
  machine,
  onMachineUpdated,
}) => {
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState({ qty: '', req_qty: '', defective_qty: '' });

  const startItemEdit = (mi: MachineItem) => {
    setEditingItemId(mi.id);
    setEditDraft({
      qty: mi.qty.toString(),
      req_qty: mi.req_qty != null ? mi.req_qty.toString() : '',
      defective_qty: mi.defective_qty != null ? mi.defective_qty.toString() : '',
    });
  };

  const cancelItemEdit = () => {
    setEditingItemId(null);
    setEditDraft({ qty: '', req_qty: '', defective_qty: '' });
  };

  const [createEvent, { isLoading: isCreatingEvent }] = useCreateMachineEventMutation();
  const [updateMachineItem] = useUpdateMachineItemMutation();
  const [deleteMachineItem] = useDeleteMachineItemMutation();

  const [activityFrom, setActivityFrom] = useState('');
  const [activityTo, setActivityTo] = useState('');
  const [activityType, setActivityType] = useState('all');

  const { data: activityEvents = [], isLoading: activityLoading } = useGetMachineActivityEventsQuery(
    {
      machine_id: machine.id,
      skip: 0,
      limit: 100,
      from_date: activityFrom || undefined,
      to_date: activityTo || undefined,
      event_type: activityType !== 'all' ? activityType : undefined,
    },
    { skip: !machine.id },
  );
  const groupedActivityEvents = useMemo(() => groupMachineActivityEvents(activityEvents), [activityEvents]);

  const { data: machineItems } = useGetMachineItemsQuery(
    { machine_id: machine.id, skip: 0, limit: 100 },
    { skip: !machine.id }
  );

  const { data: items } = useGetItemsQuery({ skip: 0, limit: 100 }, { skip: !machine.id });
  const [deleteMaintenanceLog] = useDeleteMachineMaintenanceLogMutation();

  const itemsMap = useMemo(() => {
    const m = new Map<number, { name: string; unit: string }>();
    (items ?? []).forEach((i) => m.set(i.id, { name: i.name, unit: i.unit }));
    return m;
  }, [items]);

  const handleDeleteMaintenanceLog = async (maintenanceLogId: number) => {
    if (!window.confirm('Delete this event?')) return;
    try {
      await deleteMaintenanceLog(maintenanceLogId).unwrap();
      toast.success('Log deleted');
      onMachineUpdated?.();
    } catch (err: unknown) {
      const e = err as { data?: { detail?: string } };
      toast.error(e?.data?.detail || 'Failed to delete');
    }
  };

  const handleStatusChange = async (eventType: MachineEventType) => {
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

  const parseOptionalQty = (raw: string, label: string): number | null | 'invalid' => {
    const trimmed = raw.trim();
    if (trimmed === '') return null;
    const n = parseInt(trimmed, 10);
    if (isNaN(n) || n < 0) {
      toast.error(`Invalid ${label}`);
      return 'invalid';
    }
    return n;
  };

  const handleSaveItemEdit = async (mi: MachineItem) => {
    const qtyNum = parseInt(editDraft.qty, 10);
    if (isNaN(qtyNum) || qtyNum < 0) {
      toast.error('Invalid quantity');
      return;
    }
    const reqQty = parseOptionalQty(editDraft.req_qty, 'required quantity');
    if (reqQty === 'invalid') return;
    const defectiveQty = parseOptionalQty(editDraft.defective_qty, 'defective quantity');
    if (defectiveQty === 'invalid') return;

    try {
      await updateMachineItem({
        id: mi.id,
        data: { qty: qtyNum, req_qty: reqQty, defective_qty: defectiveQty },
      }).unwrap();
      toast.success('Item updated');
      cancelItemEdit();
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

  const highlightedType = getHighlightedEventType(machine);

  return (
    <>
      <div className="space-y-4 min-w-0">
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

        <Separator className="bg-border" />

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
            <>
              {/* Narrow panel — stacked rows (35% column is usually &lt; 36rem) */}
              <ul className="@[36rem]:hidden rounded-lg border border-border divide-y divide-border overflow-hidden">
                {machineItems.map((mi) => {
                  const info = getItemDisplay(mi);
                  const isEditing = editingItemId === mi.id;
                  const low = mi.req_qty != null && mi.qty < mi.req_qty;
                  const defective = mi.defective_qty != null && mi.defective_qty > 0;
                  return (
                    <li
                      key={mi.id}
                      className={cn(
                        'flex items-center gap-1.5 pl-2 pr-2.5 py-2 min-h-[2.6rem]',
                        low && 'bg-destructive/[0.04]'
                      )}
                    >
                      {isEditing ? (
                        <div className="flex-1 space-y-2 py-0.5">
                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <p className="text-[10px] text-muted-foreground mb-1">Qty</p>
                              <Input
                                type="number"
                                min={0}
                                value={editDraft.qty}
                                onChange={(e) => setEditDraft((d) => ({ ...d, qty: e.target.value }))}
                                className="h-7 text-sm"
                              />
                            </div>
                            <div>
                              <p className="text-[10px] text-muted-foreground mb-1">Req</p>
                              <Input
                                type="number"
                                min={0}
                                value={editDraft.req_qty}
                                onChange={(e) => setEditDraft((d) => ({ ...d, req_qty: e.target.value }))}
                                className="h-7 text-sm"
                              />
                            </div>
                            <div>
                              <p className="text-[10px] text-muted-foreground mb-1">Defective</p>
                              <Input
                                type="number"
                                min={0}
                                value={editDraft.defective_qty}
                                onChange={(e) =>
                                  setEditDraft((d) => ({ ...d, defective_qty: e.target.value }))
                                }
                                className="h-7 text-sm"
                              />
                            </div>
                          </div>
                          <div className="flex justify-end gap-1">
                            <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={cancelItemEdit}>
                              Cancel
                            </Button>
                            <Button size="sm" className="h-7 px-2 text-xs" onClick={() => handleSaveItemEdit(mi)}>
                              Save
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          {low ? (
                            <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-destructive" aria-hidden />
                          ) : null}
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium leading-snug text-card-foreground">
                              {info.name}
                              <span className="font-normal text-muted-foreground">
                                {' '}
                                · {info.unit}
                                {defective ? ` · ${mi.defective_qty} def` : ''}
                              </span>
                            </p>
                          </div>
                          <p className="shrink-0 text-sm tabular-nums leading-snug">
                            <span className={low ? 'text-destructive font-semibold' : 'text-card-foreground'}>
                              {mi.qty}
                            </span>
                            {mi.req_qty != null ? (
                              <span className="text-muted-foreground">/{mi.req_qty}</span>
                            ) : null}
                          </p>
                          <div className="flex shrink-0 gap-0.5">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => startItemEdit(mi)}>
                              <Pencil className="h-3.5 w-3.5" />
                              <span className="sr-only">Edit item</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:text-destructive"
                              onClick={() => handleDeleteItem(mi)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              <span className="sr-only">Remove item</span>
                            </Button>
                          </div>
                        </>
                      )}
                    </li>
                  );
                })}
              </ul>

              {/* Wide panel — full table */}
              <div className="hidden @[36rem]:block w-full max-w-full overflow-x-auto overscroll-x-contain rounded-lg border border-border">
              <table className="w-full min-w-0 table-fixed text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50 text-left text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    <th className="px-3 py-2.5 font-medium">Item</th>
                    <th className="px-2 py-2.5 font-medium w-16">Unit</th>
                    <th className="px-2 py-2.5 font-medium w-28 text-right">Qty</th>
                    <th className="px-2 py-2.5 font-medium w-28 text-right">Req</th>
                    <th className="px-2 py-2.5 font-medium w-28 text-right">Defective</th>
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
                            <Input
                              type="number"
                              min={0}
                              value={editDraft.qty}
                              onChange={(e) => setEditDraft((d) => ({ ...d, qty: e.target.value }))}
                              className="ml-auto h-8 w-20 px-2 text-right text-sm"
                            />
                          ) : (
                            <button
                              type="button"
                              className={cn(
                                'rounded px-1.5 py-0.5 -mr-1.5 hover:bg-muted/80',
                                low && 'text-destructive font-semibold'
                              )}
                              onClick={() => startItemEdit(mi)}
                            >
                              {mi.qty}
                            </button>
                          )}
                        </td>
                        <td className="px-2 py-2.5 text-right tabular-nums">
                          {isEditing ? (
                            <Input
                              type="number"
                              min={0}
                              placeholder="—"
                              value={editDraft.req_qty}
                              onChange={(e) => setEditDraft((d) => ({ ...d, req_qty: e.target.value }))}
                              className="ml-auto h-8 w-20 px-2 text-right text-sm"
                            />
                          ) : (
                            <span className="text-muted-foreground">{mi.req_qty ?? '—'}</span>
                          )}
                        </td>
                        <td className="px-2 py-2.5 text-right tabular-nums">
                          {isEditing ? (
                            <Input
                              type="number"
                              min={0}
                              placeholder="—"
                              value={editDraft.defective_qty}
                              onChange={(e) =>
                                setEditDraft((d) => ({ ...d, defective_qty: e.target.value }))
                              }
                              className="ml-auto h-8 w-20 px-2 text-right text-sm"
                            />
                          ) : (
                            <span className="text-muted-foreground">{mi.defective_qty ?? '—'}</span>
                          )}
                        </td>
                        <td className="px-2 py-2.5 text-right">
                          <div className="flex justify-end gap-0.5">
                            {isEditing ? (
                              <>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="h-8 w-8 shrink-0 text-emerald-600"
                                      onClick={() => handleSaveItemEdit(mi)}
                                    >
                                      <Check className="h-4 w-4" />
                                      <span className="sr-only">Save</span>
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Save</TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="h-8 w-8 shrink-0"
                                      onClick={cancelItemEdit}
                                    >
                                      <X className="h-4 w-4" />
                                      <span className="sr-only">Cancel</span>
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Cancel</TooltipContent>
                                </Tooltip>
                              </>
                            ) : (
                              <>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={() => startItemEdit(mi)}
                                    >
                                      <Pencil className="h-3.5 w-3.5" />
                                      <span className="sr-only">Edit item</span>
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Edit qty, req, defective</TooltipContent>
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
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            </>
          )}
        </div>

        <Separator className="bg-border" />

        <Card className="border-border shadow-none">
          <CardHeader className="space-y-0 p-4 pb-2">
            <CardTitle className="flex items-center gap-2 text-base font-semibold leading-none">
              <Wrench className="h-4 w-4 text-muted-foreground" />
              Work Orders
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 p-4 pt-2">
            <MachineWorkOrderQuickActions machine={machine} />
          </CardContent>
        </Card>

        <ActiveOrdersPanel scope={{ machineId: machine.id }} compact />

        <Card className="flex max-h-[min(32rem,50vh)] flex-col overflow-hidden border-border shadow-none">
          <CardHeader className="shrink-0 space-y-0 p-4 pb-2">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <CardTitle className="flex items-center gap-2 text-base font-semibold leading-none">
                <History className="h-4 w-4 text-muted-foreground" />
                Event Log
                {!activityLoading && (
                  <Badge variant="outline" className="ml-1 font-normal">
                    {activityEvents.length}
                  </Badge>
                )}
              </CardTitle>
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  type="date"
                  value={activityFrom}
                  onChange={(e) => setActivityFrom(e.target.value)}
                  className="h-8 w-[130px] text-xs"
                  aria-label="From date"
                />
                <Input
                  type="date"
                  value={activityTo}
                  onChange={(e) => setActivityTo(e.target.value)}
                  className="h-8 w-[130px] text-xs"
                  aria-label="To date"
                />
                <Select value={activityType} onValueChange={setActivityType}>
                  <SelectTrigger className="h-8 w-[120px] text-xs">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All types</SelectItem>
                    <SelectItem value="status_updated">Status</SelectItem>
                    <SelectItem value="maintenance_logged">Maintenance</SelectItem>
                    <SelectItem value="work_order_completed">Work order</SelectItem>
                    <SelectItem value="item_added">Inventory</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="min-h-0 flex-1 overflow-y-auto p-0 px-4 pb-4">
            {activityLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : activityEvents.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border bg-muted/20 px-4 py-8 text-center">
                <History className="mx-auto mb-1 h-6 w-6 text-muted-foreground/50" />
                <p className="text-sm font-medium text-muted-foreground">No activity yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {groupedActivityEvents.map((item, idx) => {
                  const isLast = idx === groupedActivityEvents.length - 1;
                  return item.kind === 'work_order_group' ? (
                    <MachineActivityWorkOrderGroupRow
                      key={`wo-${item.workOrderId}`}
                      workOrderId={item.workOrderId}
                      events={item.events}
                      isLast={isLast}
                    />
                  ) : (
                    <MachineActivityEventLogRow
                      key={item.event.id}
                      event={item.event}
                      isLast={isLast}
                      onDeleteMaintenance={handleDeleteMaintenanceLog}
                    />
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <AddMachineItemDialog
        open={isAddItemOpen}
        onOpenChange={setIsAddItemOpen}
        machineId={machine.id}
        machineName={machine.name}
        existingItemIds={(machineItems ?? []).map((mi) => mi.item_id)}
        onSuccess={onMachineUpdated}
      />
    </>
  );
};

export default MachineDetailBody;
