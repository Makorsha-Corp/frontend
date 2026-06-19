import React, { useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useUpdateTransferOrderMutation } from '@/features/transferOrders/transferOrdersApi';
import { useGetFactoriesQuery } from '@/features/factories/factoriesApi';
import { useGetProjectsQuery } from '@/features/projects/projectsApi';
import type { TransferOrder } from '@/types/transferOrder';
import { transferLocationLabel } from '@/pages/newpages/orders/transferOrderLocationLabels';
import { isSameTransferLocation } from '@/components/newcomponents/customui/orders/transferOrderRouteHelpers';
import { API_LIMITS } from '@/constants/apiLimits';
import MachineSelectorDialog from '@/components/newcomponents/customui/MachineSelectorDialog';
import { MachineSelectSummaryButton } from '@/components/newcomponents/customui/MachineSelectSummaryButton';
import { ArrowDown, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const SOURCE_TYPES = [
  { value: 'storage', label: 'Storage (Factory)' },
  { value: 'machine', label: 'Machine' },
  { value: 'damaged', label: 'Damaged (Factory)' },
] as const;

const DEST_TYPES = [
  { value: 'storage', label: 'Storage (Factory)' },
  { value: 'machine', label: 'Machine' },
  { value: 'project', label: 'Project' },
  { value: 'damaged', label: 'Damaged (Factory)' },
] as const;

type SourceType = (typeof SOURCE_TYPES)[number]['value'];
type DestType = (typeof DEST_TYPES)[number]['value'];

export interface EditTransferOrderRouteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: TransferOrder;
  factories: { id: number; name: string }[];
  machines: { id: number; name: string }[];
  projects: { id: number; name: string }[];
  onSaved?: () => void;
}

const EditTransferOrderRouteDialog: React.FC<EditTransferOrderRouteDialogProps> = ({
  open,
  onOpenChange,
  order,
  factories,
  machines,
  projects,
  onSaved,
}) => {
  const [sourceType, setSourceType] = useState<SourceType>('storage');
  const [sourceId, setSourceId] = useState('');
  const [destType, setDestType] = useState<DestType>('storage');
  const [destId, setDestId] = useState('');
  const [sourceMachineDisplayLine, setSourceMachineDisplayLine] = useState('');
  const [destMachineDisplayLine, setDestMachineDisplayLine] = useState('');
  const [sourceMachinePickerOpen, setSourceMachinePickerOpen] = useState(false);
  const [destMachinePickerOpen, setDestMachinePickerOpen] = useState(false);

  const [updateOrder, { isLoading }] = useUpdateTransferOrderMutation();
  const { data: factoryOptions = factories } = useGetFactoriesQuery(
    { skip: 0, limit: API_LIMITS.FLEXIBLE_1000 },
    { skip: !open }
  );
  const { data: projectOptions = projects } = useGetProjectsQuery(
    { skip: 0, limit: API_LIMITS.FLEXIBLE_1000 },
    { skip: !open }
  );

  useEffect(() => {
    if (!open) return;
    const srcType = order.source_location_type as SourceType;
    const dstType = order.destination_location_type as DestType;
    setSourceType(SOURCE_TYPES.some((t) => t.value === srcType) ? srcType : 'storage');
    setDestType(DEST_TYPES.some((t) => t.value === dstType) ? dstType : 'storage');
    setSourceId(String(order.source_location_id));
    setDestId(String(order.destination_location_id));
    const ctx = { factories, machines, projects };
    setSourceMachineDisplayLine(
      srcType === 'machine'
        ? transferLocationLabel('machine', order.source_location_id, ctx)
        : ''
    );
    setDestMachineDisplayLine(
      dstType === 'machine'
        ? transferLocationLabel('machine', order.destination_location_id, ctx)
        : ''
    );
  }, [open, order, factories, machines, projects]);

  const destinationFactories = useMemo(() => {
    if (!sourceId || destType !== sourceType) return factoryOptions;
    return factoryOptions.filter((f) => f.id.toString() !== sourceId);
  }, [factoryOptions, destType, sourceType, sourceId]);

  useEffect(() => {
    if (isSameTransferLocation(sourceType, sourceId, destType, destId)) {
      setDestId('');
      setDestMachineDisplayLine('');
    }
  }, [sourceType, sourceId, destType, destId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const sid = parseInt(sourceId, 10);
    const did = parseInt(destId, 10);
    if (isNaN(sid) || !sourceId) {
      toast.error('Select source location');
      return;
    }
    if (isNaN(did) || !destId) {
      toast.error('Select destination location');
      return;
    }
    if (isSameTransferLocation(sourceType, sourceId, destType, destId)) {
      toast.error('Destination must be different from source');
      return;
    }

    try {
      await updateOrder({
        id: order.id,
        data: {
          source_location_type: sourceType,
          source_location_id: sid,
          destination_location_type: destType,
          destination_location_id: did,
        },
      }).unwrap();
      toast.success('Route updated');
      onSaved?.();
      onOpenChange(false);
    } catch (err: unknown) {
      const error = err as { data?: { detail?: string } };
      toast.error(error?.data?.detail || 'Failed to update route');
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit route</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label>Source type</Label>
                <Select
                  value={sourceType}
                  onValueChange={(v) => {
                    setSourceType(v as SourceType);
                    setSourceId('');
                    setSourceMachineDisplayLine('');
                  }}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SOURCE_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Source</Label>
                {sourceType === 'storage' || sourceType === 'damaged' ? (
                  <Select value={sourceId} onValueChange={setSourceId}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select factory" />
                    </SelectTrigger>
                    <SelectContent>
                      {factoryOptions.map((f) => (
                        <SelectItem key={f.id} value={f.id.toString()}>
                          {f.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <MachineSelectSummaryButton
                    onClick={() => setSourceMachinePickerOpen(true)}
                    ariaLabel={
                      sourceMachineDisplayLine
                        ? `Change source machine. Current: ${sourceMachineDisplayLine}`
                        : 'Select source machine'
                    }
                    selectedLine={sourceMachineDisplayLine || null}
                    staleNumericId={sourceMachineDisplayLine ? null : sourceId || null}
                    compactLabel
                  />
                )}
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 py-0.5" aria-hidden>
              <div className="h-px flex-1 bg-border" />
              <ArrowDown className="h-5 w-5 shrink-0 text-brand-primary" />
              <div className="h-px flex-1 bg-border" />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label>Destination type</Label>
                <Select
                  value={destType}
                  onValueChange={(v) => {
                    setDestType(v as DestType);
                    setDestId('');
                    setDestMachineDisplayLine('');
                  }}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DEST_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Destination</Label>
                {destType === 'storage' || destType === 'damaged' ? (
                  <Select value={destId} onValueChange={setDestId}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select factory" />
                    </SelectTrigger>
                    <SelectContent>
                      {destinationFactories.map((f) => (
                        <SelectItem key={f.id} value={f.id.toString()}>
                          {f.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : destType === 'machine' ? (
                  <MachineSelectSummaryButton
                    onClick={() => setDestMachinePickerOpen(true)}
                    ariaLabel={
                      destMachineDisplayLine
                        ? `Change destination machine. Current: ${destMachineDisplayLine}`
                        : 'Select destination machine'
                    }
                    selectedLine={destMachineDisplayLine || null}
                    staleNumericId={destMachineDisplayLine ? null : destId || null}
                    compactLabel
                  />
                ) : (
                  <Select value={destId} onValueChange={setDestId}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select project" />
                    </SelectTrigger>
                    <SelectContent>
                      {projectOptions.map((p) => (
                        <SelectItem key={p.id} value={p.id.toString()}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-brand-primary hover:bg-brand-primary-hover"
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <MachineSelectorDialog
        open={sourceMachinePickerOpen}
        onOpenChange={setSourceMachinePickerOpen}
        title="Select source machine"
        description="Pick factory and section, highlight a machine, then confirm."
        onSelect={(m, ctx) => {
          if (isSameTransferLocation('machine', m.id, destType, destId)) {
            toast.error('Source cannot be the same as destination');
            return;
          }
          setSourceId(String(m.id));
          setSourceMachineDisplayLine(
            `${ctx.factoryAbbreviation} · ${ctx.sectionAbbreviation} · ${ctx.machineName}`
          );
        }}
      />
      <MachineSelectorDialog
        open={destMachinePickerOpen}
        onOpenChange={setDestMachinePickerOpen}
        title="Select destination machine"
        description="Pick factory and section, highlight a machine, then confirm."
        onSelect={(m, ctx) => {
          if (isSameTransferLocation('machine', sourceId, 'machine', m.id)) {
            toast.error('Destination cannot be the same as source');
            return;
          }
          setDestId(String(m.id));
          setDestMachineDisplayLine(
            `${ctx.factoryAbbreviation} · ${ctx.sectionAbbreviation} · ${ctx.machineName}`
          );
        }}
      />
    </>
  );
};

export default EditTransferOrderRouteDialog;
