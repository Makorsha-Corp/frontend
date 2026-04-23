import React, { useState } from 'react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateMachineMutation } from '@/features/machines/machinesApi';
import { useCreateMachineItemMutation } from '@/features/machineItems/machineItemsApi';
import { useGetFactorySectionsQuery } from '@/features/factorySections/factorySectionsApi';
import MachineDialogItemsBlock, { type MachineItemDraft } from '@/components/newcomponents/customui/MachineDialogItemsBlock';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';

interface AddMachineDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  factoryId?: number;
  sectionId?: number;
  onSuccess?: () => void;
}

const resetForm = () => ({
  name: '',
  modelNumber: '',
  manufacturer: '',
  note: '',
  lines: [] as MachineItemDraft[],
});

const AddMachineDialog: React.FC<AddMachineDialogProps> = ({
  open,
  onOpenChange,
  factoryId,
  sectionId,
  onSuccess,
}) => {
  const [selectedSectionId, setSelectedSectionId] = useState<number | null>(sectionId ?? null);
  const [name, setName] = useState('');
  const [modelNumber, setModelNumber] = useState('');
  const [manufacturer, setManufacturer] = useState('');
  const [note, setNote] = useState('');
  const [lines, setLines] = useState<MachineItemDraft[]>([]);
  const { data: sections = [], isLoading: sectionsLoading } = useGetFactorySectionsQuery(
    factoryId
      ? { factory_id: factoryId, limit: 500 }
      : { skip: 0, limit: 500 }
  );

  const [createMachine, { isLoading: isCreatingMachine }] = useCreateMachineMutation();
  const [createMachineItem] = useCreateMachineItemMutation();
  const [isSavingItems, setIsSavingItems] = useState(false);

  const isBusy = isCreatingMachine || isSavingItems;

  const reset = () => {
    const r = resetForm();
    setSelectedSectionId(sectionId ?? null);
    setName(r.name);
    setModelNumber(r.modelNumber);
    setManufacturer(r.manufacturer);
    setNote(r.note);
    setLines(r.lines);
  };

  React.useEffect(() => {
    if (open) {
      setSelectedSectionId(sectionId ?? null);
    }
  }, [open, sectionId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Machine name is required');
      return;
    }

    if (!selectedSectionId) {
      toast.error('Factory section is required');
      return;
    }

    try {
      const created = await createMachine({
        name: name.trim(),
        factory_section_id: selectedSectionId,
        model_number: modelNumber.trim() || undefined,
        manufacturer: manufacturer.trim() || undefined,
        note: note.trim() || undefined,
      }).unwrap();

      if (lines.length > 0) {
        setIsSavingItems(true);
        let failed = 0;
        for (const line of lines) {
          try {
            await createMachineItem({
              machine_id: created.id,
              item_id: line.item_id,
              qty: line.qty,
              req_qty: line.req_qty ?? undefined,
              defective_qty: line.defective_qty ?? undefined,
            }).unwrap();
          } catch (err: unknown) {
            failed += 1;
            console.error('Failed to add machine item:', err);
          }
        }
        setIsSavingItems(false);
        if (failed > 0) {
          toast.error(
            `Machine created, but ${failed} item line(s) failed to save. Add them from the machine detail view.`
          );
        }
      }

      toast.success('Machine created successfully');
      reset();
      onOpenChange(false);
      onSuccess?.();
    } catch (error: unknown) {
      const err = error as { data?: { detail?: string } };
      console.error('Failed to create machine:', error);
      toast.error(err?.data?.detail || 'Failed to create machine');
      setIsSavingItems(false);
    }
  };

  const handleCancel = () => {
    reset();
    onOpenChange(false);
  };

  const fieldsBlock = (
    <div className="grid min-w-0 gap-4">
      <div className="grid gap-2">
        <Label htmlFor="machine-section">
          Factory Section <span className="text-red-500">*</span>
        </Label>
        <Select
          value={selectedSectionId ? String(selectedSectionId) : ''}
          onValueChange={(v) => setSelectedSectionId(v ? Number(v) : null)}
        >
          <SelectTrigger id="machine-section" className="bg-background">
            <SelectValue placeholder={sectionsLoading ? 'Loading sections...' : 'Select a section'} />
          </SelectTrigger>
          <SelectContent>
            {sections.map((s) => (
              <SelectItem key={s.id} value={String(s.id)}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="name">
          Machine Name <span className="text-red-500">*</span>
        </Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Spinning Machine 1"
          className="bg-background"
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="model">Model Number</Label>
        <Input
          id="model"
          value={modelNumber}
          onChange={(e) => setModelNumber(e.target.value)}
          placeholder="e.g. SM-2000"
          className="bg-background"
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="manufacturer">Manufacturer</Label>
        <Input
          id="manufacturer"
          value={manufacturer}
          onChange={(e) => setManufacturer(e.target.value)}
          placeholder="e.g. Acme Corp"
          className="bg-background"
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="note">Note</Label>
        <Textarea
          id="note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Additional notes"
          rows={3}
          className="min-h-[4.5rem] resize-y bg-background"
        />
      </div>
    </div>
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange(v);
      }}
    >
      <DialogContent className="flex h-[66vh] max-h-[66vh] w-[min(56rem,94vw)] max-w-none flex-col gap-4 overflow-hidden p-6 sm:max-w-none">
        <DialogHeader className="shrink-0 space-y-1 text-left">
          <DialogTitle className="text-brand-secondary">Add New Machine</DialogTitle>
          <DialogDescription>
            Choose a section, then add machine details. Optional catalog lines on the right are saved after the machine is created.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden">
          <div className="grid min-h-0 flex-1 grid-cols-1 gap-6 overflow-hidden md:grid-cols-2 md:gap-8 md:items-stretch">
            <div className="min-h-0 min-w-0 overflow-y-auto overscroll-contain py-1 pl-2 pr-4">
              {fieldsBlock}
            </div>
            <div className="flex min-h-0 min-w-0 flex-col border-t border-border pt-6 md:border-t-0 md:border-l md:border-border md:pt-0 md:pl-8">
              <MachineDialogItemsBlock
                lines={lines}
                onLinesChange={setLines}
                hint="Optional. Each line is POSTed to machine-items after the machine exists."
              />
            </div>
          </div>

          <div className="flex shrink-0 justify-end gap-2 border-t border-border pt-4">
            <Button type="button" variant="outline" onClick={handleCancel} disabled={isBusy}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-brand-primary hover:bg-brand-primary-hover"
              disabled={isBusy || !name.trim() || !selectedSectionId}
            >
              {isBusy ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isSavingItems ? 'Saving items…' : 'Creating…'}
                </>
              ) : (
                'Create Machine'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddMachineDialog;
