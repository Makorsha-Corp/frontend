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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useGetItemsQuery } from '@/features/items/itemsApi';
import { useCreateProjectComponentItemMutation } from '@/features/projectComponentItems/projectComponentItemsApi';

interface AddProjectComponentItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectComponentId: number;
  onSuccess?: () => void;
}

const AddProjectComponentItemDialog: React.FC<AddProjectComponentItemDialogProps> = ({
  open,
  onOpenChange,
  projectComponentId,
  onSuccess,
}) => {
  const [itemId, setItemId] = useState('');
  const [qty, setQty] = useState('');
  const { data: items = [] } = useGetItemsQuery({ skip: 0, limit: 100 });
  const [createItem, { isLoading }] = useCreateProjectComponentItemMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemId) {
      toast.error('Item is required');
      return;
    }
    if (!qty || Number(qty) <= 0) {
      toast.error('Quantity must be greater than 0');
      return;
    }
    try {
      await createItem({
        project_component_id: projectComponentId,
        item_id: parseInt(itemId, 10),
        qty: Number(qty),
      }).unwrap();
      toast.success('Item added');
      setItemId('');
      setQty('');
      onOpenChange(false);
      onSuccess?.();
    } catch (err: unknown) {
      const e = err as { data?: { detail?: string } };
      toast.error(e?.data?.detail || 'Failed to add item');
    }
  };

  const handleCancel = () => {
    setItemId('');
    setQty('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Item</DialogTitle>
          <DialogDescription>Add an item to this component.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="item">Item *</Label>
            <Select value={itemId} onValueChange={setItemId}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select item" />
              </SelectTrigger>
              <SelectContent>
                {items.map((item) => (
                  <SelectItem key={item.id} value={item.id.toString()}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="qty">Quantity *</Label>
            <Input
              id="qty"
              type="number"
              min="0"
              step="0.01"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              placeholder="0"
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

export default AddProjectComponentItemDialog;
