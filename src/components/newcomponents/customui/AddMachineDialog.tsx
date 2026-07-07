import React, { useEffect, useRef, useState } from 'react';
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
import { useGetFactoriesQuery } from '@/features/factories/factoriesApi';
import {
  useSeedFactorySectionOnOpen,
} from '@/hooks/useGlobalFactoryContext';
import MachineDialogItemsBlock, {
  type MachineDialogItemsBlockHandle,
  type MachineItemDraft,
} from '@/components/newcomponents/customui/MachineDialogItemsBlock';
import { useLineItemAddButtonHighlight } from '@/components/newcomponents/customui/orders/useLineItemAddButtonHighlight';
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
  const [selectedFactoryId, setSelectedFactoryId] = useState<number | null>(null);
  const [selectedSectionId, setSelectedSectionId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [modelNumber, setModelNumber] = useState('');
  const [manufacturer, setManufacturer] = useState('');
  const [note, setNote] = useState('');
  const [lines, setLines] = useState<MachineItemDraft[]>([]);
  const [unaddedHintOpen, setUnaddedHintOpen] = useState(false);
  const itemsBlockRef = useRef<MachineDialogItemsBlockHandle>(null);
  const {
    addButtonHighlighted,
    pulseAddButtonHighlight,
    dismissAddButtonHighlight,
  } = useLineItemAddButtonHighlight();

  const { markFactoryEdited, markSectionEdited } = useSeedFactorySectionOnOpen({
    open,
    explicitFactoryId: factoryId,
    explicitSectionId: sectionId,
    selectedFactoryId,
    selectedSectionId,
    setFactoryId: setSelectedFactoryId,
    setSectionId: setSelectedSectionId,
  });

  const { data: factories = [], isLoading: factoriesLoading } = useGetFactoriesQuery(
    { skip: 0, limit: 500 },
    { skip: !open }
  );

  const { data: sections = [], isLoading: sectionsLoading } = useGetFactorySectionsQuery(
    selectedFactoryId
      ? { factory_id: selectedFactoryId, limit: 500 }
      : { skip: 0, limit: 0 },
    { skip: !open || !selectedFactoryId }
  );

  const [createMachine, { isLoading: isCreatingMachine }] = useCreateMachineMutation();
  const [createMachineItem] = useCreateMachineItemMutation();
  const [isSavingItems, setIsSavingItems] = useState(false);

  const isBusy = isCreatingMachine || isSavingItems;

  useEffect(() => {
    if (!unaddedHintOpen) return;
    const dismiss = (e: PointerEvent) => {
      if (!(e.target as Element).closest('[data-unadded-hint-root]')) {
        setUnaddedHintOpen(false);
      }
    };
    document.addEventListener('pointerdown', dismiss);
    return () => document.removeEventListener('pointerdown', dismiss);
  }, [unaddedHintOpen]);

  const reset = () => {
    const r = resetForm();
    setSelectedFactoryId(null);
    setSelectedSectionId(null);
    setName(r.name);
    setModelNumber(r.modelNumber);
    setManufacturer(r.manufacturer);
    setNote(r.note);
    setLines(r.lines);
    setUnaddedHintOpen(false);
    dismissAddButtonHighlight();
  };

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

    if (
      itemsBlockRef.current?.prepareSubmit({
        unaddedHintOpen,
        setUnaddedHintOpen,
        pulseAddButtonHighlight,
      })
    ) {
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
        <Label htmlFor="machine-factory">
          Factory <span className="text-red-500">*</span>
        </Label>
        <Select
          value={selectedFactoryId ? String(selectedFactoryId) : '__none__'}
          onValueChange={(v) => {
            markFactoryEdited();
            const id = v === '__none__' ? null : Number(v);
            setSelectedFactoryId(id);
            setSelectedSectionId(null);
          }}
        >
          <SelectTrigger id="machine-factory" className="bg-background">
            <SelectValue placeholder={factoriesLoading ? 'Loading factories...' : 'Select a factory'} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">Select a factory…</SelectItem>
            {factories.map((f) => (
              <SelectItem key={f.id} value={String(f.id)}>
                {f.name} ({f.abbreviation})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="machine-section">
          Factory Section <span className="text-red-500">*</span>
        </Label>
        <Select
          value={selectedSectionId ? String(selectedSectionId) : '__none__'}
          onValueChange={(v) => {
            markSectionEdited();
            setSelectedSectionId(v === '__none__' ? null : Number(v));
          }}
          disabled={!selectedFactoryId || sectionsLoading}
        >
          <SelectTrigger id="machine-section" className="bg-background">
            <SelectValue
              placeholder={
                !selectedFactoryId
                  ? 'Choose a factory first'
                  : sectionsLoading
                    ? 'Loading sections...'
                    : 'Select a section'
              }
            />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">Select a section…</SelectItem>
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
          <DialogTitle className="text-brand-heading">Add New Machine</DialogTitle>
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
                ref={itemsBlockRef}
                lines={lines}
                onLinesChange={setLines}
                hint="Optional. Each line is POSTed to machine-items after the machine exists."
                addButtonHighlighted={addButtonHighlighted}
                onAddButtonHighlightDismiss={dismissAddButtonHighlight}
              />
            </div>
          </div>

          <div className="flex shrink-0 justify-end gap-2 border-t border-border pt-4">
            <Button type="button" variant="outline" onClick={handleCancel} disabled={isBusy}>
              Cancel
            </Button>
            <div className="relative" data-unadded-hint-root>
              {unaddedHintOpen ? (
                <div
                  role="tooltip"
                  className="absolute bottom-[calc(100%+0.5rem)] right-0 z-50 w-max max-w-[16rem] rounded-md border border-border bg-popover px-3 py-2 text-xs leading-snug text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95"
                >
                  You have unadded items — click ✓ to add them, or click Create again to continue without them
                </div>
              ) : null}
              <Button
                type="submit"
                className="bg-brand-primary hover:bg-brand-primary-hover"
                disabled={isBusy || !name.trim() || !selectedFactoryId || !selectedSectionId}
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
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddMachineDialog;
