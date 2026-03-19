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
import { useCreateDepartmentMutation } from '@/features/departments/departmentsApi';
import type { Department } from '@/types/department';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';

interface AddDepartmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  departments?: Department[];
}

const AddDepartmentDialog: React.FC<AddDepartmentDialogProps> = ({
  open,
  onOpenChange,
  departments = [],
}) => {
  const [name, setName] = useState('');

  const [createDepartment, { isLoading }] = useCreateDepartmentMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Department name is required');
      return;
    }

    const nameLower = name.trim().toLowerCase();
    const dup = departments.find((d) => d.name.toLowerCase() === nameLower);
    if (dup) {
      toast.error('A department with this name already exists');
      return;
    }

    try {
      await createDepartment({ name: name.trim() }).unwrap();

      toast.success('Department created successfully');
      setName('');
      onOpenChange(false);
    } catch (error: unknown) {
      console.error('Failed to create department:', error);
      const err = error as { data?: { detail?: string } };
      toast.error(err?.data?.detail || 'Failed to create department');
    }
  };

  const handleCancel = () => {
    setName('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[380px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-card-foreground">Add Department</DialogTitle>
            <DialogDescription>Create a new department.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="dept-name">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="dept-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Production, Finance"
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
                'Add'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddDepartmentDialog;
