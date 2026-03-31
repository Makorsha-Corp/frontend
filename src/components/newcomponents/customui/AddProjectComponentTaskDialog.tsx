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
import { useCreateProjectComponentTaskMutation } from '@/features/projectComponentTasks/projectComponentTasksApi';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';

interface AddProjectComponentTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectComponentId: number;
  isNote?: boolean;
  onSuccess?: () => void;
}

const AddProjectComponentTaskDialog: React.FC<AddProjectComponentTaskDialogProps> = ({
  open,
  onOpenChange,
  projectComponentId,
  isNote = false,
  onSuccess,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const [createTask, { isLoading }] = useCreateProjectComponentTaskMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Task name is required');
      return;
    }
    try {
      await createTask({
        project_component_id: projectComponentId,
        name: name.trim(),
        description: description.trim() || name.trim(),
        is_note: isNote,
      }).unwrap();
      toast.success(isNote ? 'Note created' : 'Task created');
      setName('');
      setDescription('');
      onOpenChange(false);
      onSuccess?.();
    } catch (err: unknown) {
      const e = err as { data?: { detail?: string } };
      toast.error(e?.data?.detail || 'Failed to create task');
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
          <DialogTitle>{isNote ? 'Add Note' : 'Add Task'}</DialogTitle>
          <DialogDescription>
            {isNote
              ? 'Create a new note for this component.'
              : 'Create a new task for this component.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={isNote ? 'Note title' : 'Task name'}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={isNote ? 'Note details' : 'Task description'}
              rows={2}
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

export default AddProjectComponentTaskDialog;
