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
import { useCreateMachineItemMutation } from '@/features/machineItems/machineItemsApi';
import { useGetItemsQuery } from '@/features/items/itemsApi';
import type { Item } from '@/types/item';
import toast from 'react-hot-toast';
import { Loader2, Plus } from 'lucide-react';
import AddItemDialog from './AddItemDialog';

interface AddMachineItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  machineId: number;
  machineName: string;
  existingItemIds: number[];
  onSuccess?: () => void;
}

const AddMachineItemDialog: React.FC<AddMachineItemDialogProps> = ({
  open,
  onOpenChange,
  machineId,
  machineName,
  existingItemIds,
  onSuccess,
}) => {
  const [itemId, setItemId] = useState<number | undefined>();
  const [qty, setQty] = useState('');
  const [reqQty, setReqQty] = useState('');
  const [defectiveQty, setDefectiveQty] = useState('');
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);

  const [createMachineItem, { isLoading }] = useCreateMachineItemMutation();
  const { data: items, refetch: refetchItems } = useGetItemsQuery({
    skip: 0,
    limit: 100,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!itemId) {
      toast.error('Please select an item');
      return;
    }

    const qtyNum = parseInt(qty, 10);
    if (isNaN(qtyNum) || qtyNum < 0) {
      toast.error('Quantity must be 0 or greater');
      return;
    }

    try {
      await createMachineItem({
        machine_id: machineId,
        item_id: itemId,
        qty: qtyNum,
        req_qty: reqQty ? parseInt(reqQty, 10) : undefined,
        defective_qty: defectiveQty ? parseInt(defectiveQty, 10) : undefined,
      }).unwrap();

      toast.success('Item added to machine');
      setItemId(undefined);
      setQty('');
      setReqQty('');
      setDefectiveQty('');
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      console.error('Failed to add item:', error);
      const detail = error?.data?.detail;
      if (typeof detail === 'string' && detail.includes('already exists')) {
        toast.error('This item already exists on this machine. Edit the existing row to update quantity.');
      } else {
        toast.error(detail || 'Failed to add item to machine');
      }
    }
  };

  const handleCreateItemSuccess = (newItem: Item) => {
    refetchItems();
    setItemId(newItem.id);
    setIsAddItemOpen(false);
  };

  const handleCancel = () => {
    setItemId(undefined);
    setQty('');
    setReqQty('');
    setDefectiveQty('');
    onOpenChange(false);
  };

  const availableItems = (items ?? []).filter((i) => !existingItemIds.includes(i.id));

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle className="text-card-foreground">Add Item to Machine</DialogTitle>
              <DialogDescription>
                Assign an item to {machineName}. Select from catalog or create a new item.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="item">
                  Item <span className="text-red-500">*</span>
                </Label>
                <div className="flex gap-2">
                  <Select
                    value={itemId?.toString() ?? '__none__'}
                    onValueChange={(v) =>
                      setItemId(v === '__none__' ? undefined : parseInt(v))
                    }
                  >
                    <SelectTrigger className="flex-1 bg-background">
                      <SelectValue placeholder="Select item" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Select item</SelectItem>
                      {availableItems.map((i) => (
                        <SelectItem key={i.id} value={i.id.toString()}>
                          {i.name} ({i.unit})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setIsAddItemOpen(true)}
                    title="Create new item"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="qty">
                  Quantity <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="qty"
                  type="number"
                  min="0"
                  value={qty}
                  onChange={(e) => setQty(e.target.value)}
                  placeholder="0"
                  className="bg-background"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="reqQty">Required Quantity</Label>
                <Input
                  id="reqQty"
                  type="number"
                  min="0"
                  value={reqQty}
                  onChange={(e) => setReqQty(e.target.value)}
                  placeholder="Optional"
                  className="bg-background"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="defectiveQty">Defective Quantity</Label>
                <Input
                  id="defectiveQty"
                  type="number"
                  min="0"
                  value={defectiveQty}
                  onChange={(e) => setDefectiveQty(e.target.value)}
                  placeholder="Optional"
                  className="bg-background"
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-brand-primary hover:bg-brand-primary-hover"
                disabled={isLoading || !itemId || qty === ''}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  'Add to Machine'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AddItemDialog
        open={isAddItemOpen}
        onOpenChange={setIsAddItemOpen}
        onSuccess={handleCreateItemSuccess}
      />
    </>
  );
};

export default AddMachineItemDialog;
