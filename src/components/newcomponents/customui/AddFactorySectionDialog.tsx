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
import { useCreateFactorySectionMutation } from '@/features/factorySections/factorySectionsApi';
import type { FactorySection } from '@/types/factorySection';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';

interface AddFactorySectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  factoryId: number;
  sections?: FactorySection[];
}

const AddFactorySectionDialog: React.FC<AddFactorySectionDialogProps> = ({
  open,
  onOpenChange,
  factoryId,
  sections = [],
}) => {
  const [name, setName] = useState('');

  const [createSection, { isLoading }] = useCreateFactorySectionMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Section name is required');
      return;
    }

    const nameLower = name.trim().toLowerCase();
    const dup = sections.find((s) => s.name.toLowerCase() === nameLower);
    if (dup) {
      toast.error('A section with this name already exists in this factory');
      return;
    }

    try {
      await createSection({
        name: name.trim(),
        factory_id: factoryId,
      }).unwrap();

      toast.success('Section created successfully');
      setName('');
      onOpenChange(false);
    } catch (error: any) {
      console.error('Failed to create section:', error);
      toast.error(error?.data?.detail || 'Failed to create section');
    }
  };

  const handleCancel = () => {
    setName('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-card-foreground">Add Section</DialogTitle>
            <DialogDescription>Create a new section within this factory.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="section-name">
                Section Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="section-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Production Floor A"
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
                  Creating...
                </>
              ) : (
                'Create Section'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddFactorySectionDialog;
