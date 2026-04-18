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
import { useCreateProjectComponentMutation } from '@/features/projectComponents/projectComponentsApi';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';

interface AddProjectComponentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: number;
  onSuccess?: (componentId: number) => void;
}

const AddProjectComponentDialog: React.FC<AddProjectComponentDialogProps> = ({
  open,
  onOpenChange,
  projectId,
  onSuccess,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const [createComponent, { isLoading }] = useCreateProjectComponentMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Component name is required');
      return;
    }
    try {
      const component = await createComponent({
        project_id: projectId,
        name: name.trim(),
        description: description.trim() || null,
      }).unwrap();
      toast.success('Component created');
      setName('');
      setDescription('');
      onOpenChange(false);
      onSuccess?.(component.id);
    } catch (err: unknown) {
      const e = err as { data?: { detail?: string } };
      toast.error(e?.data?.detail || 'Failed to create component');
    }
  };

  const handleCancel = () => {
    setName('');
    setDescription('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Component</DialogTitle>
          <DialogDescription>
            Create a new project component with basic details. Status will be auto assigned to planning.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Component name"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Component description"
              rows={3}
              className="mt-1"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-brand-primary hover:bg-brand-primary-hover">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddProjectComponentDialog;
