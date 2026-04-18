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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCreateProjectMutation } from '@/features/projects/projectsApi';
import { useGetFactoriesQuery } from '@/features/factories/factoriesApi';
import type { Project } from '@/types/project';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';

interface AddProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultFactoryId?: number | null;
  onSuccess?: (project: Project) => void;
}

const AddProjectDialog: React.FC<AddProjectDialogProps> = ({
  open,
  onOpenChange,
  defaultFactoryId,
  onSuccess,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [factoryId, setFactoryId] = useState<string>(defaultFactoryId?.toString() ?? '');

  const { data: factories = [] } = useGetFactoriesQuery({ skip: 0, limit: 100 });
  const [createProject, { isLoading }] = useCreateProjectMutation();

  React.useEffect(() => {
    if (open && defaultFactoryId) {
      setFactoryId(defaultFactoryId.toString());
    }
  }, [open, defaultFactoryId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Project name is required');
      return;
    }
    if (!factoryId) {
      toast.error('Factory is required');
      return;
    }
    try {
      const project = await createProject({
        factory_id: parseInt(factoryId, 10),
        name: name.trim(),
        description: description.trim() || '',
      }).unwrap();
      toast.success('Project created');
      setName('');
      setDescription('');
      onOpenChange(false);
      onSuccess?.(project);
    } catch (err: unknown) {
      const e = err as { data?: { detail?: string } };
      toast.error(e?.data?.detail || 'Failed to create project');
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
          <DialogTitle>Add Project</DialogTitle>
          <DialogDescription>
            Create a new project with basic details. Budget and costs will be calculated later.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Project name"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="factory">Factory *</Label>
            <Select value={factoryId} onValueChange={setFactoryId}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select factory" />
              </SelectTrigger>
              <SelectContent>
                {factories.map((f) => (
                  <SelectItem key={f.id} value={f.id.toString()}>
                    {f.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Project description"
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

export default AddProjectDialog;
