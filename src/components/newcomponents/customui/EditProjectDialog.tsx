import React, { useEffect, useMemo, useState } from 'react';
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
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import type { Project, ProjectPriority, ProjectStatus } from '@/types/project';
import { useUpdateProjectMutation } from '@/features/projects/projectsApi';

interface EditProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project | null;
  onSuccess?: (updated: Project) => void;
}

const EditProjectDialog: React.FC<EditProjectDialogProps> = ({ open, onOpenChange, project, onSuccess }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [budget, setBudget] = useState('');
  const [deadline, setDeadline] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [priority, setPriority] = useState<ProjectPriority>('MEDIUM');
  const [status, setStatus] = useState<ProjectStatus>('PLANNING');

  const [updateProject, { isLoading }] = useUpdateProjectMutation();

  const toDateInputValue = (dateValue: string | null | undefined) => {
    if (!dateValue) return '';
    return dateValue.slice(0, 10);
  };

  useEffect(() => {
    if (!open || !project) return;
    setName(project.name ?? '');
    setDescription(project.description ?? '');
    setBudget(project.budget != null ? String(project.budget) : '');
    setDeadline(toDateInputValue(project.deadline));
    setStartDate(toDateInputValue(project.start_date));
    setEndDate(toDateInputValue(project.end_date));
    setPriority(project.priority ?? 'MEDIUM');
    setStatus(project.status ?? 'PLANNING');
  }, [open, project]);

  const canSave = useMemo(() => !isLoading && !!name.trim(), [isLoading, name]);

  const handleSave = async () => {
    if (!project) return;
    if (!name.trim()) {
      toast.error('Project name is required');
      return;
    }

    try {
      const updated = await updateProject({
        id: project.id,
        data: {
          name: name.trim(),
          description: description.trim(),
          budget: budget.trim() === '' ? null : Number(budget),
          deadline: deadline || null,
          start_date: startDate || null,
          end_date: endDate || null,
          priority,
          status,
        },
      }).unwrap();

      toast.success('Project updated');
      onSuccess?.(updated);
      onOpenChange(false);
    } catch (err: unknown) {
      const e = err as { data?: { detail?: string } };
      toast.error(e?.data?.detail || 'Failed to update project');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Project</DialogTitle>
          <DialogDescription>Update project details, dates, priority, and status.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          <div>
            <Label htmlFor="edit-project-name">Name *</Label>
            <Input
              id="edit-project-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Project name"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="edit-project-budget">Budget</Label>
            <Input
              id="edit-project-budget"
              type="number"
              min="0"
              step="0.01"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder="0.00"
              className="mt-1"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label htmlFor="edit-project-priority">Priority</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as ProjectPriority)}>
                <SelectTrigger id="edit-project-priority" className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">LOW</SelectItem>
                  <SelectItem value="MEDIUM">MEDIUM</SelectItem>
                  <SelectItem value="HIGH">HIGH</SelectItem>
                  <SelectItem value="URGENT">URGENT</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-project-status">Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as ProjectStatus)}>
                <SelectTrigger id="edit-project-status" className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PLANNING">PLANNING</SelectItem>
                  <SelectItem value="IN_PROGRESS">IN PROGRESS</SelectItem>
                  <SelectItem value="ON_HOLD">ON HOLD</SelectItem>
                  <SelectItem value="COMPLETED">COMPLETED</SelectItem>
                  <SelectItem value="CANCELLED">CANCELLED</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label htmlFor="edit-project-start-date">Start Date</Label>
              <Input
                id="edit-project-start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="edit-project-end-date">End Date</Label>
              <Input
                id="edit-project-end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="edit-project-deadline">Deadline</Label>
            <Input
              id="edit-project-deadline"
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="edit-project-description">Description</Label>
            <Textarea
              id="edit-project-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Project description"
              rows={3}
              className="mt-1"
            />
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            type="button"
            className="bg-brand-primary hover:bg-brand-primary-hover"
            onClick={handleSave}
            disabled={!canSave}
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditProjectDialog;

