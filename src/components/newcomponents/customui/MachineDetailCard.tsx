import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCreateMachineEventMutation } from '@/features/machines/machinesApi';
import { useGetMachineItemsQuery } from '@/features/machineItems/machineItemsApi';
import type { Machine } from '@/types/machine';
import type { MachineEventType } from '@/types/machine';
import type { MachineItem } from '@/types/machineItem';
import { Pencil, Play, Pause, Wrench, Power, ExternalLink, Package } from 'lucide-react';
import toast from 'react-hot-toast';
import MachineDetailsDialog from './MachineDetailsDialog';

interface MachineDetailCardProps {
  machine: Machine | null;
  onMachineUpdated?: () => void;
  onEditRequest?: () => void;
  className?: string;
  /** A/B: 'list' | 'list-with-req' | 'pills' - compact items layout variant */
  itemsVariant?: 'list' | 'list-with-req' | 'pills';
}

const EVENT_TYPES: { type: MachineEventType; label: string; icon: React.ReactNode }[] = [
  { type: 'IDLE', label: 'Idle', icon: <Pause className="h-4 w-4" /> },
  { type: 'RUNNING', label: 'Running', icon: <Play className="h-4 w-4" /> },
  { type: 'OFF', label: 'Off', icon: <Power className="h-4 w-4" /> },
  { type: 'MAINTENANCE', label: 'Maintenance', icon: <Wrench className="h-4 w-4" /> },
];

/**
 * Reusable Machine Detail Card - compact view with metadata, status controls,
 * and items. Full details (events, items table) in MachineDetailsDialog.
 */
const MachineDetailCard: React.FC<MachineDetailCardProps> = ({
  machine,
  onMachineUpdated,
  onEditRequest,
  className = '',
  itemsVariant = 'list-with-req',
}) => {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const [createEvent, { isLoading: isCreatingEvent }] = useCreateMachineEventMutation();

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
      <Card className={`flex flex-col min-h-0 ${className}`}>
        <CardContent className="flex-1 flex items-center justify-center py-16 text-muted-foreground">
          Select a machine to view details
        </CardContent>
      </Card>
    );
  }

  const isLowStock = (mi: MachineItem) =>
    mi.req_qty != null && mi.qty < mi.req_qty;

  const renderItems = () => {
    if (!machineItems || machineItems.length === 0) {
      return (
        <p className="text-sm text-muted-foreground flex items-center gap-2">
          <Package className="h-4 w-4 opacity-50" />
          No items assigned
        </p>
      );
    }

    if (itemsVariant === 'pills') {
      return (
        <div className="flex flex-wrap gap-2">
          {machineItems.map((mi) => (
            <Badge
              key={mi.id}
              variant={isLowStock(mi) ? 'destructive' : 'secondary'}
              className="font-normal py-1.5 px-2.5"
            >
              {mi.item_name ?? `Item #${mi.item_id}`}: {mi.qty}
              {mi.item_unit && ` ${mi.item_unit}`}
            </Badge>
          ))}
        </div>
      );
    }

    if (itemsVariant === 'list-with-req') {
      return (
        <div className="space-y-2">
          {machineItems.map((mi) => (
            <div
              key={mi.id}
              className="flex items-center justify-between gap-2 py-1.5 px-2 rounded-md bg-muted/30 hover:bg-muted/50"
            >
              <span className="font-medium text-card-foreground truncate text-sm">
                {mi.item_name ?? `Item #${mi.item_id}`}
              </span>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-sm text-muted-foreground">
                  {mi.req_qty != null ? `${mi.qty}/${mi.req_qty}` : mi.qty}
                  {mi.item_unit && ` ${mi.item_unit}`}
                </span>
                {isLowStock(mi) && (
                  <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                    Low
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      );
    }

    // Default: 'list' - simple name + qty
    return (
      <div className="space-y-1.5">
        {machineItems.map((mi) => (
          <div
            key={mi.id}
            className="flex justify-between items-center text-sm py-1.5 border-b border-border last:border-0"
          >
            <span className="font-medium text-card-foreground truncate pr-2">
              {mi.item_name ?? `Item #${mi.item_id}`}
            </span>
            <span className="text-muted-foreground shrink-0">
              {mi.qty}
              {mi.item_unit && ` ${mi.item_unit}`}
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <>
      <Card className={`flex flex-col min-h-0 overflow-hidden ${className}`}>
        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="p-4 space-y-4">
            {/* Metadata & Status */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <CardTitle className="text-lg">{machine.name}</CardTitle>
                <div className="flex gap-1">
                  <Button variant="outline" size="sm" onClick={() => onEditRequest?.()}>
                    <Pencil className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsDetailsOpen(true)}
                    className="border-brand-primary/50 text-brand-primary hover:bg-brand-primary/10"
                  >
                    <ExternalLink className="h-4 w-4 mr-1" />
                    Full details
                  </Button>
                </div>
              </div>
              <CardDescription>
                {machine.model_number && `Model: ${machine.model_number}`}
                {machine.manufacturer && ` • ${machine.manufacturer}`}
              </CardDescription>
              <div className="mt-4">
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
                <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{machine.note}</p>
              )}
            </div>

            {/* Items - variant: list | list-with-req | pills */}
            <div>
              <CardTitle className="text-base mb-1">Items</CardTitle>
              <CardDescription className="mb-2">Assigned to this machine</CardDescription>
              {renderItems()}
            </div>
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
    </>
  );
};

export default MachineDetailCard;
