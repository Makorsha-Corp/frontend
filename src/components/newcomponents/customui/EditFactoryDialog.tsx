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
import { useUpdateFactoryMutation } from '@/features/factories/factoriesApi';
import type { Factory } from '@/types/factory';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';

interface EditFactoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  factory: Factory | null;
  factories?: Factory[];
}

const EditFactoryDialog: React.FC<EditFactoryDialogProps> = ({ open, onOpenChange, factory, factories = [] }) => {
  const [name, setName] = useState('');
  const [abbreviation, setAbbreviation] = useState('');

  const [updateFactory, { isLoading }] = useUpdateFactoryMutation();

  useEffect(() => {
    if (factory) {
      setName(factory.name);
      setAbbreviation(factory.abbreviation);
    }
  }, [factory]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!factory) return;

    if (!name.trim()) {
      toast.error('Factory name is required');
      return;
    }

    if (!abbreviation.trim()) {
      toast.error('Abbreviation is required');
      return;
    }

    const nameLower = name.trim().toLowerCase();
    const abbrLower = abbreviation.trim().toUpperCase().toLowerCase();
    const dup = factories.find(
      (f) =>
        f.id !== factory.id &&
        (f.name.toLowerCase() === nameLower || f.abbreviation.toLowerCase() === abbrLower)
    );
    if (dup) {
      toast.error(
        dup.name.toLowerCase() === nameLower
          ? 'A factory with this name already exists'
          : 'A factory with this abbreviation already exists'
      );
      return;
    }

    try {
      await updateFactory({
        id: factory.id,
        data: {
          name: name.trim(),
          abbreviation: abbreviation.trim().toUpperCase(),
        },
      }).unwrap();

      toast.success('Factory updated successfully!');
      onOpenChange(false);
    } catch (error: any) {
      console.error('Failed to update factory:', error);
      toast.error(error?.data?.detail || 'Failed to update factory');
    }
  };

  const handleCancel = () => {
    if (factory) {
      setName(factory.name);
      setAbbreviation(factory.abbreviation);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-card-foreground">Edit Factory</DialogTitle>
            <DialogDescription>
              Update the factory details below.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">
                Factory Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Main Production Plant"
                className="bg-background"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-abbreviation">
                Abbreviation <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit-abbreviation"
                value={abbreviation}
                onChange={(e) => setAbbreviation(e.target.value.toUpperCase())}
                placeholder="e.g. MP1"
                maxLength={10}
                className="bg-background"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="submit" className="bg-brand-primary hover:bg-brand-primary-hover" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
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

export default EditFactoryDialog;
