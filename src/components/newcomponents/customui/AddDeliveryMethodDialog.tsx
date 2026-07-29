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
import { useCreateDeliveryMethodMutation } from '@/features/deliveryMethods/deliveryMethodsApi';
import type { DeliveryMethod } from '@/types/deliveryMethod';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';

interface AddDeliveryMethodDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deliveryMethods?: DeliveryMethod[];
  onSuccess?: (method: DeliveryMethod) => void;
}

const AddDeliveryMethodDialog: React.FC<AddDeliveryMethodDialogProps> = ({
  open,
  onOpenChange,
  deliveryMethods = [],
  onSuccess,
}) => {
  const [name, setName] = useState('');

  const [createDeliveryMethod, { isLoading }] = useCreateDeliveryMethodMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Delivery method name is required');
      return;
    }

    const nameLower = name.trim().toLowerCase();
    const dup = deliveryMethods.find((d) => d.name.toLowerCase() === nameLower);
    if (dup) {
      toast.error('A delivery method with this name already exists');
      return;
    }

    try {
      const created = await createDeliveryMethod({ name: name.trim() }).unwrap();

      toast.success('Delivery method created successfully');
      setName('');
      onOpenChange(false);
      onSuccess?.(created);
    } catch (error: unknown) {
      console.error('Failed to create delivery method:', error);
      const err = error as { data?: { detail?: string } };
      toast.error(err?.data?.detail || 'Failed to create delivery method');
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
            <DialogTitle className="text-card-foreground">Add Delivery Method</DialogTitle>
            <DialogDescription>Create a new delivery method.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="delivery-method-name">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="delivery-method-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Courier, Pickup, Own Fleet"
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

export default AddDeliveryMethodDialog;
