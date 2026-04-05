import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useUpdateMachineMutation } from '@/features/machines/machinesApi';
import {
  useCreateMachineItemMutation,
  useUpdateMachineItemMutation,
  useDeleteMachineItemMutation,
  useGetMachineItemsQuery,
} from '@/features/machineItems/machineItemsApi';
import { useGetFactoriesQuery } from '@/features/factories/factoriesApi';
import { useGetFactorySectionsQuery } from '@/features/factorySections/factorySectionsApi';
import MachineDialogItemsBlock, { type MachineItemDraft } from '@/components/newcomponents/customui/MachineDialogItemsBlock';
import type { Machine } from '@/types/machine';
import { API_LIMITS } from '@/constants/apiLimits';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';

interface EditMachineDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  machine: Machine | null;
  onSuccess?: () => void;
}

function cloneDrafts(rows: MachineItemDraft[]): MachineItemDraft[] {
  return rows.map((r) => ({ ...r }));
}

const EditMachineDialog: React.FC<EditMachineDialogProps> = ({
  open,
  onOpenChange,
  machine,
  onSuccess,
}) => {
  const [name, setName] = useState('');
  const [sectionId, setSectionId] = useState<number | undefined>();
  const [modelNumber, setModelNumber] = useState('');
  const [manufacturer, setManufacturer] = useState('');
  const [nextMaintenanceSchedule, setNextMaintenanceSchedule] = useState('');
  const [nextMaintenanceNote, setNextMaintenanceNote] = useState('');
  const [note, setNote] = useState('');
  const [lines, setLines] = useState<MachineItemDraft[]>([]);

  const itemsInitRef = useRef(false);
  const snapshotRef = useRef<MachineItemDraft[]>([]);

  const [updateMachine, { isLoading: isUpdatingMachine }] = useUpdateMachineMutation();
  const [createMachineItem] = useCreateMachineItemMutation();
  const [updateMachineItem] = useUpdateMachineItemMutation();
  const [deleteMachineItem] = useDeleteMachineItemMutation();
  const [isSavingItems, setIsSavingItems] = useState(false);

  const { data: factories } = useGetFactoriesQuery({ skip: 0, limit: 100 });
  const { data: sections } = useGetFactorySectionsQuery({ skip: 0, limit: 100 }, { skip: !open });
  const { data: machineItems = [], isLoading: itemsLoading } = useGetMachineItemsQuery(
    { skip: 0, limit: API_LIMITS.STRICT_100, machine_id: machine?.id ?? 0 },
    { skip: !open || !machine }
  );

  useEffect(() => {
    if (!open) {
      itemsInitRef.current = false;
    }
  }, [open]);

  useEffect(() => {
    if (!open || !machine) return;
    itemsInitRef.current = false;
    setLines([]);
  }, [open, machine?.id]);

  useEffect(() => {
    if (machine && open) {
      setName(machine.name);
      setSectionId(machine.factory_section_id);
      setModelNumber(machine.model_number ?? '');
      setManufacturer(machine.manufacturer ?? '');
      setNextMaintenanceSchedule(
        machine.next_maintenance_schedule ? machine.next_maintenance_schedule.slice(0, 10) : ''
      );
      setNextMaintenanceNote(machine.next_maintenance_note ?? '');
      setNote(machine.note ?? '');
    }
  }, [machine, open]);

  useEffect(() => {
    if (!open || !machine) return;
    if (itemsLoading) return;
    if (!itemsInitRef.current) {
      const mapped: MachineItemDraft[] = machineItems.map((mi) => ({
        key: `mi-${mi.id}`,
        machineItemId: mi.id,
        item_id: mi.item_id,
        qty: mi.qty,
        req_qty: mi.req_qty ?? null,
        defective_qty: mi.defective_qty ?? null,
      }));
      setLines(mapped);
      snapshotRef.current = cloneDrafts(mapped);
      itemsInitRef.current = true;
    }
  }, [open, machine?.id, itemsLoading, machineItems, machine]);

  const sectionFactoryId = sections?.find((s) => s.id === sectionId)?.factory_id;

  const sectionsForFactory = (sections ?? []).filter(
    (s) => !sectionFactoryId || s.factory_id === sectionFactoryId
  );

  const isBusy = isUpdatingMachine || isSavingItems;

  const syncMachineItems = async () => {
    if (!machine) return;
    const initial = snapshotRef.current;

    setIsSavingItems(true);
    try {
      for (const orig of initial) {
        if (orig.machineItemId != null && !lines.some((l) => l.machineItemId === orig.machineItemId)) {
          await deleteMachineItem(orig.machineItemId).unwrap();
        }
      }

      for (const line of lines) {
        if (line.machineItemId != null) {
          const orig = initial.find((o) => o.machineItemId === line.machineItemId);
          if (
            orig &&
            (orig.qty !== line.qty ||
              orig.req_qty !== line.req_qty ||
              orig.defective_qty !== line.defective_qty)
          ) {
            await updateMachineItem({
              id: line.machineItemId,
              data: {
                qty: line.qty,
                req_qty: line.req_qty ?? undefined,
                defective_qty: line.defective_qty ?? undefined,
              },
            }).unwrap();
          }
        } else {
          await createMachineItem({
            machine_id: machine.id,
            item_id: line.item_id,
            qty: line.qty,
            req_qty: line.req_qty ?? undefined,
            defective_qty: line.defective_qty ?? undefined,
          }).unwrap();
        }
      }
    } finally {
      setIsSavingItems(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!machine) return;

    if (!name.trim()) {
      toast.error('Machine name is required');
      return;
    }

    if (!sectionId) {
      toast.error('Factory section is required');
      return;
    }

    try {
      await updateMachine({
        id: machine.id,
        data: {
          name: name.trim(),
          factory_section_id: sectionId,
          model_number: modelNumber.trim() || undefined,
          manufacturer: manufacturer.trim() || undefined,
          next_maintenance_schedule: nextMaintenanceSchedule || undefined,
          next_maintenance_note: nextMaintenanceNote.trim() || undefined,
          note: note.trim() || undefined,
        },
      }).unwrap();

      try {
        await syncMachineItems();
      } catch (itemErr: unknown) {
        console.error('Machine saved but items failed:', itemErr);
        const err = itemErr as { data?: { detail?: string } };
        toast.error(err?.data?.detail || 'Machine saved, but some item changes failed.');
        onSuccess?.();
        onOpenChange(false);
        return;
      }

      toast.success('Machine updated successfully');
      onOpenChange(false);
      onSuccess?.();
    } catch (error: unknown) {
      const err = error as { data?: { detail?: string } };
      console.error('Failed to update machine:', error);
      toast.error(err?.data?.detail || 'Failed to update machine');
    }
  };

  const fieldsBlock = (
    <div className="grid min-w-0 gap-4">
      <div className="grid gap-2">
        <Label htmlFor="edit-name">
          Machine Name <span className="text-red-500">*</span>
        </Label>
        <Input
          id="edit-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Spinning Machine 1"
          className="bg-background"
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="edit-section">
          Factory Section <span className="text-red-500">*</span>
        </Label>
        <Select
          value={sectionId?.toString() ?? '__none__'}
          onValueChange={(v) => setSectionId(v === '__none__' ? undefined : parseInt(v, 10))}
        >
          <SelectTrigger className="bg-background">
            <SelectValue placeholder="Select section" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">Select section</SelectItem>
            {sectionsForFactory.map((s) => (
              <SelectItem key={s.id} value={s.id.toString()}>
                {(factories ?? []).find((f) => f.id === s.factory_id)?.name ?? 'Unknown'} / {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="edit-model">Model Number</Label>
        <Input
          id="edit-model"
          value={modelNumber}
          onChange={(e) => setModelNumber(e.target.value)}
          placeholder="e.g. SM-2000"
          className="bg-background"
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="edit-manufacturer">Manufacturer</Label>
        <Input
          id="edit-manufacturer"
          value={manufacturer}
          onChange={(e) => setManufacturer(e.target.value)}
          placeholder="e.g. Acme Corp"
          className="bg-background"
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="edit-maintenance">Next Maintenance</Label>
        <Input
          id="edit-maintenance"
          type="date"
          value={nextMaintenanceSchedule}
          onChange={(e) => setNextMaintenanceSchedule(e.target.value)}
          className="bg-background"
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="edit-maintenanceNote">Maintenance Note</Label>
        <Input
          id="edit-maintenanceNote"
          value={nextMaintenanceNote}
          onChange={(e) => setNextMaintenanceNote(e.target.value)}
          placeholder="Notes for next maintenance"
          className="bg-background"
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="edit-note">Note</Label>
        <Textarea
          id="edit-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Additional notes"
          rows={3}
          className="min-h-[4.5rem] resize-y bg-background"
        />
      </div>
    </div>
  );

  if (!machine) return null;

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) itemsInitRef.current = false;
        onOpenChange(v);
      }}
    >
      <DialogContent className="flex h-[66vh] max-h-[66vh] w-[min(56rem,94vw)] max-w-none flex-col gap-4 overflow-hidden p-6 sm:max-w-none">
        <DialogHeader className="shrink-0 space-y-1 text-left">
          <DialogTitle className="text-brand-secondary">Edit Machine</DialogTitle>
          <DialogDescription>
            Update details on the left; manage catalog lines on the right. Running state is changed via events in the detail view.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden">
          <div className="grid min-h-0 flex-1 grid-cols-1 gap-6 overflow-hidden md:grid-cols-2 md:gap-8 md:items-stretch">
            <div className="min-h-0 min-w-0 overflow-y-auto overscroll-contain py-1 pl-2 pr-4">
              {fieldsBlock}
            </div>
            <div className="flex min-h-0 min-w-0 flex-col border-t border-border pt-6 md:border-t-0 md:border-l md:border-border md:pt-0 md:pl-8">
              {itemsLoading ? (
                <div className="flex flex-1 items-center justify-center py-12 text-sm text-muted-foreground">
                  Loading machine items…
                </div>
              ) : (
                <MachineDialogItemsBlock lines={lines} onLinesChange={setLines} />
              )}
            </div>
          </div>

          <div className="flex shrink-0 justify-end gap-2 border-t border-border pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isBusy}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-brand-primary hover:bg-brand-primary-hover"
              disabled={isBusy || !name.trim() || !sectionId}
            >
              {isBusy ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isSavingItems ? 'Saving items…' : 'Saving…'}
                </>
              ) : (
                'Save changes'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditMachineDialog;
