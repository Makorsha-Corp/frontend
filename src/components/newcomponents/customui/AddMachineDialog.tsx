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
import { useCreateMachineMutation } from '@/features/machines/machinesApi';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';

interface AddMachineDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  factoryId: number;
  sectionId: number;
  onSuccess?: () => void;
}

const AddMachineDialog: React.FC<AddMachineDialogProps> = ({
  open,
  onOpenChange,
  factoryId,
  sectionId,
  onSuccess,
}) => {
  const [name, setName] = useState('');
  const [modelNumber, setModelNumber] = useState('');
  const [manufacturer, setManufacturer] = useState('');
  const [note, setNote] = useState('');

  const [createMachine, { isLoading }] = useCreateMachineMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Machine name is required');
      return;
    }

    try {
      await createMachine({
        name: name.trim(),
        factory_section_id: sectionId,
        model_number: modelNumber.trim() || undefined,
        manufacturer: manufacturer.trim() || undefined,
        note: note.trim() || undefined,
      }).unwrap();

      toast.success('Machine created successfully');
      setName('');
      setModelNumber('');
      setManufacturer('');
      setNote('');
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      console.error('Failed to create machine:', error);
      toast.error(error?.data?.detail || 'Failed to create machine');
    }
  };

  const handleCancel = () => {
    setName('');
    setModelNumber('');
    setManufacturer('');
    setNote('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-card-foreground">Add New Machine</DialogTitle>
            <DialogDescription>
              Create a new machine in the selected section. Factory and section are already set from the header.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
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
                rows={2}
                className="bg-background"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-brand-primary hover:bg-brand-primary-hover"
              disabled={isLoading || !name.trim()}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Machine'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddMachineDialog;
