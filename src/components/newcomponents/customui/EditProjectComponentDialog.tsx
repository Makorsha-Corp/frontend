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
import type { ProjectComponent } from '@/types/projectComponent';
import type { ProjectStatus } from '@/types/project';
import { useUpdateProjectComponentMutation } from '@/features/projectComponents/projectComponentsApi';

interface EditProjectComponentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  component: ProjectComponent | null;
  onSuccess?: (updated: ProjectComponent) => void;
}

const EditProjectComponentDialog: React.FC<EditProjectComponentDialogProps> = ({
  open,
  onOpenChange,
  component,
  onSuccess,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [budget, setBudget] = useState('');
  const [deadline, setDeadline] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState<ProjectStatus>('PLANNING');

  const [updateComponent, { isLoading }] = useUpdateProjectComponentMutation();

  const toDateInputValue = (dateValue: string | null | undefined) => {
    if (!dateValue) return '';
    return dateValue.slice(0, 10);
  };

  useEffect(() => {
    if (!open || !component) return;
    setName(component.name ?? '');
    setDescription(component.description ?? '');
    setBudget(component.budget != null ? String(component.budget) : '');
    setDeadline(toDateInputValue(component.deadline));
    setStartDate(toDateInputValue(component.start_date));
    setEndDate(toDateInputValue(component.end_date));
    setStatus(component.status ?? 'PLANNING');
  }, [open, component]);

  const canSave = useMemo(() => !isLoading && !!name.trim(), [isLoading, name]);

  const handleSave = async () => {
    if (!component) return;
    if (!name.trim()) {
      toast.error('Component name is required');
      return;
    }

    try {
      const updated = await updateComponent({
        id: component.id,
        data: {
          name: name.trim(),
          description: description.trim() || null,
          budget: budget.trim() === '' ? null : Number(budget),
          deadline: deadline || null,
          start_date: startDate || null,
          end_date: endDate || null,
          status,
        },
      }).unwrap();

      toast.success('Component updated');
      onSuccess?.(updated);
      onOpenChange(false);
    } catch (err: unknown) {
      const e = err as { data?: { detail?: string } };
      toast.error(e?.data?.detail || 'Failed to update component');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Component</DialogTitle>
          <DialogDescription>Update component details, dates, budget, and status.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          <div>
            <Label htmlFor="edit-component-name">Name *</Label>
            <Input
              id="edit-component-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Component name"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="edit-component-budget">Budget</Label>
            <Input
              id="edit-component-budget"
              type="number"
              min="0"
              step="0.01"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder="0.00"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="edit-component-status">Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as ProjectStatus)}>
              <SelectTrigger id="edit-component-status" className="mt-1">
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label htmlFor="edit-component-start-date">Start Date</Label>
              <Input
                id="edit-component-start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="edit-component-end-date">End Date</Label>
              <Input
                id="edit-component-end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="edit-component-deadline">Deadline</Label>
            <Input
              id="edit-component-deadline"
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="edit-component-description">Description</Label>
            <Textarea
              id="edit-component-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Component description"
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

export default EditProjectComponentDialog;

