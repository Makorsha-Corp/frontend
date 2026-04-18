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
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useCreateMiscellaneousProjectCostMutation } from '@/features/miscellaneousProjectCosts/miscellaneousProjectCostsApi';

interface AddMiscellaneousProjectCostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectComponentId: number;
  onSuccess?: () => void;
}

const AddMiscellaneousProjectCostDialog: React.FC<AddMiscellaneousProjectCostDialogProps> = ({
  open,
  onOpenChange,
  projectComponentId,
  onSuccess,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [createCost, { isLoading }] = useCreateMiscellaneousProjectCostMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Cost name is required');
      return;
    }
    if (!amount || Number(amount) <= 0) {
      toast.error('Amount must be greater than 0');
      return;
    }

    try {
      await createCost({
        project_component_id: projectComponentId,
        name: name.trim(),
        description: description.trim() || null,
        amount: Number(amount),
      }).unwrap();
      toast.success('Misc cost added');
      setName('');
      setDescription('');
      setAmount('');
      onOpenChange(false);
      onSuccess?.();
    } catch (err: unknown) {
      const e = err as { data?: { detail?: string } };
      toast.error(e?.data?.detail || 'Failed to add misc cost');
    }
  };

  const handleCancel = () => {
    setName('');
    setDescription('');
    setAmount('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Misc Cost</DialogTitle>
          <DialogDescription>Add a miscellaneous cost to this component.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Transport, permit fee"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="amount">Amount *</Label>
            <Input
              id="amount"
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional details"
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

export default AddMiscellaneousProjectCostDialog;
