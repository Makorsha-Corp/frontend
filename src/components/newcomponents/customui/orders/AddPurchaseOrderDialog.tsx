import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
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
import { useCreatePurchaseOrderMutation } from '@/features/purchaseOrders/purchaseOrdersApi';
import { useGetItemsQuery } from '@/features/items/itemsApi';
import type { Account } from '@/types/account';
import type { Factory } from '@/types/factory';
import type { CreatePurchaseOrder, CreatePurchaseOrderItem } from '@/types/purchaseOrder';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface AddPurchaseOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accounts: Account[];
  factories: Factory[];
  onSuccess: (order: { id: number }) => void;
}

const AddPurchaseOrderDialog: React.FC<AddPurchaseOrderDialogProps> = ({
  open,
  onOpenChange,
  accounts,
  factories,
  onSuccess,
}) => {
  const [accountId, setAccountId] = useState<string>('');
  const [destinationType, setDestinationType] = useState<'storage' | 'machine' | 'project'>('storage');
  const [destinationId, setDestinationId] = useState<string>('');
  const [description, setDescription] = useState('');
  const [orderNote, setOrderNote] = useState('');
  const [items, setItems] = useState<Array<{ item_id: number; quantity_ordered: number; unit_price: number; notes?: string }>>([]);
  const [itemId, setItemId] = useState('');
  const [qty, setQty] = useState('');
  const [unitPrice, setUnitPrice] = useState('');

  const [createOrder, { isLoading }] = useCreatePurchaseOrderMutation();
  const { data: itemsList = [] } = useGetItemsQuery({ skip: 0, limit: 100 }, { skip: !open });

  const reset = () => {
    setAccountId('');
    setDestinationType('storage');
    setDestinationId('');
    setDescription('');
    setOrderNote('');
    setItems([]);
    setItemId('');
    setQty('');
    setUnitPrice('');
  };

  const handleAddItem = () => {
    const iid = parseInt(itemId, 10);
    const q = parseFloat(qty);
    const p = parseFloat(unitPrice);
    if (isNaN(iid) || isNaN(q) || q <= 0 || isNaN(p) || p < 0) {
      toast.error('Enter valid item, quantity, and unit price');
      return;
    }
    setItems((prev) => [...prev, { item_id: iid, quantity_ordered: q, unit_price: p }]);
    setItemId('');
    setQty('');
    setUnitPrice('');
  };

  const handleRemoveItem = (idx: number) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const aid = parseInt(accountId, 10);
    const did = parseInt(destinationId, 10);
    if (isNaN(aid) || !accountId) {
      toast.error('Select a supplier');
      return;
    }
    if (isNaN(did) || !destinationId) {
      toast.error('Select a destination');
      return;
    }
    if (items.length === 0) {
      toast.error('Add at least one item');
      return;
    }

    const orderData: CreatePurchaseOrder = {
      account_id: aid,
      destination_type: destinationType,
      destination_id: did,
      description: description || undefined,
      order_note: orderNote || undefined,
      current_status_id: 1,
      items: items.map((i) => ({
        item_id: i.item_id,
        quantity_ordered: i.quantity_ordered,
        unit_price: i.unit_price,
        notes: i.notes,
      })) as CreatePurchaseOrderItem[],
    };

    try {
      const result = await createOrder(orderData).unwrap();
      toast.success('Purchase order created');
      reset();
      onSuccess(result);
      onOpenChange(false);
    } catch (err: unknown) {
      const e = err as { data?: { detail?: string } };
      toast.error(e?.data?.detail || 'Failed to create order');
    }
  };

  const destOptions = destinationType === 'storage'
    ? factories.map((f) => ({ value: f.id.toString(), label: `${f.name} (${f.abbreviation})` }))
    : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Purchase Order</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Supplier *</Label>
            <Select value={accountId} onValueChange={setAccountId} required>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select supplier" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((a) => (
                  <SelectItem key={a.id} value={a.id.toString()}>
                    {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Destination type</Label>
            <Select
              value={destinationType}
              onValueChange={(v) => {
                setDestinationType(v as 'storage' | 'machine' | 'project');
                setDestinationId('');
              }}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="storage">Storage (Factory)</SelectItem>
                <SelectItem value="machine">Machine</SelectItem>
                <SelectItem value="project">Project</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {destinationType === 'storage' && (
            <div>
              <Label>Factory *</Label>
              <Select value={destinationId} onValueChange={setDestinationId} required>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select factory" />
                </SelectTrigger>
                <SelectContent>
                  {factories.map((f) => (
                    <SelectItem key={f.id} value={f.id.toString()}>
                      {f.name} ({f.abbreviation})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {(destinationType === 'machine' || destinationType === 'project') && (
            <div>
              <Label>Destination ID *</Label>
              <Input
                type="number"
                value={destinationId}
                onChange={(e) => setDestinationId(e.target.value)}
                placeholder={destinationType === 'machine' ? 'Machine ID' : 'Project component ID'}
                className="mt-1"
              />
            </div>
          )}
          <div>
            <Label>Description</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional" />
          </div>
          <div>
            <Label>Order note</Label>
            <Input value={orderNote} onChange={(e) => setOrderNote(e.target.value)} placeholder="Optional" />
          </div>

          <div>
            <Label className="block mb-2">Line items *</Label>
            <div className="flex gap-2 mb-2">
              <Select value={itemId} onValueChange={setItemId}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Item" />
                </SelectTrigger>
                <SelectContent>
                  {itemsList.map((i) => (
                    <SelectItem key={i.id} value={i.id.toString()}>
                      {i.name} {i.unit && `(${i.unit})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="number"
                min="0.01"
                step="0.01"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                placeholder="Qty"
                className="w-20"
              />
              <Input
                type="number"
                min="0"
                step="0.01"
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
                placeholder="Price"
                className="w-24"
              />
              <Button type="button" variant="outline" size="icon" onClick={handleAddItem}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {items.length > 0 && (
              <div className="border rounded-lg divide-y max-h-32 overflow-y-auto">
                {items.map((it, idx) => {
                  const item = itemsList.find((i) => i.id === it.item_id);
                  return (
                    <div key={idx} className="flex items-center justify-between px-3 py-2 text-sm">
                      <span>
                        {item?.name ?? `Item #${it.item_id}`} × {it.quantity_ordered} @ {it.unit_price}
                      </span>
                      <Button type="button" variant="ghost" size="sm" onClick={() => handleRemoveItem(idx)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-brand-primary hover:bg-brand-primary-hover">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddPurchaseOrderDialog;
