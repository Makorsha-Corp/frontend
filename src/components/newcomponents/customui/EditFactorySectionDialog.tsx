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
import { useUpdateFactorySectionMutation } from '@/features/factorySections/factorySectionsApi';
import type { FactorySection } from '@/types/factorySection';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';

interface EditFactorySectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  section: FactorySection | null;
  sections?: FactorySection[];
}

const EditFactorySectionDialog: React.FC<EditFactorySectionDialogProps> = ({
  open,
  onOpenChange,
  section,
  sections = [],
}) => {
  const [name, setName] = useState('');

  const [updateSection, { isLoading }] = useUpdateFactorySectionMutation();

  useEffect(() => {
    if (section) {
      setName(section.name);
    }
  }, [section]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!section) return;

    if (!name.trim()) {
      toast.error('Section name is required');
      return;
    }

    const nameLower = name.trim().toLowerCase();
    const dup = sections.find((s) => s.id !== section.id && s.name.toLowerCase() === nameLower);
    if (dup) {
      toast.error('A section with this name already exists in this factory');
      return;
    }

    try {
      await updateSection({
        id: section.id,
        data: { name: name.trim() },
      }).unwrap();

      toast.success('Section updated successfully');
      onOpenChange(false);
    } catch (error: any) {
      console.error('Failed to update section:', error);
      toast.error(error?.data?.detail || 'Failed to update section');
    }
  };

  const handleCancel = () => {
    if (section) {
      setName(section.name);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-card-foreground">Edit Section</DialogTitle>
            <DialogDescription>Update the section name.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-section-name">
                Section Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit-section-name"
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

export default EditFactorySectionDialog;
