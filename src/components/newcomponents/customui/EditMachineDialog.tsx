import React, { useState, useEffect } from 'react';
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
import { useGetFactoriesQuery } from '@/features/factories/factoriesApi';
import { useGetFactorySectionsQuery } from '@/features/factorySections/factorySectionsApi';
import type { Machine } from '@/types/machine';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';

interface EditMachineDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  machine: Machine | null;
  onSuccess?: () => void;
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

  const [updateMachine, { isLoading }] = useUpdateMachineMutation();
  const { data: factories } = useGetFactoriesQuery({ skip: 0, limit: 100 });
  const { data: sections } = useGetFactorySectionsQuery(
    { skip: 0, limit: 100 },
    { skip: !open }
  );

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

  const sectionFactoryId = sections?.find((s) => s.id === sectionId)?.factory_id;

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

      toast.success('Machine updated successfully');
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      console.error('Failed to update machine:', error);
      toast.error(error?.data?.detail || 'Failed to update machine');
    }
  };

  const sectionsForFactory = (sections ?? []).filter(
    (s) => !sectionFactoryId || s.factory_id === sectionFactoryId
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-card-foreground">Edit Machine</DialogTitle>
            <DialogDescription>
              Update machine details. Status changes are recorded via events in the detail panel.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
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
                onValueChange={(v) => setSectionId(v === '__none__' ? undefined : parseInt(v))}
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
                rows={2}
                className="bg-background"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-brand-primary hover:bg-brand-primary-hover"
              disabled={isLoading || !name.trim() || !sectionId}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditMachineDialog;
