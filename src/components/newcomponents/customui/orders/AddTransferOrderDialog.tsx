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
import { useCreateTransferOrderMutation } from '@/features/transferOrders/transferOrdersApi';
import { useGetItemsQuery } from '@/features/items/itemsApi';
import { useGetFactoriesQuery } from '@/features/factories/factoriesApi';
import { useGetMachinesQuery } from '@/features/machines/machinesApi';
import { useGetProjectsQuery } from '@/features/projects/projectsApi';
import type { CreateTransferOrder, CreateTransferOrderItem } from '@/types/transferOrder';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { API_LIMITS } from '@/constants/apiLimits';

const SOURCE_TYPES = [
  { value: 'storage', label: 'Storage (Factory)' },
  { value: 'machine', label: 'Machine' },
  { value: 'damaged', label: 'Damaged (Factory)' },
] as const;

const DEST_TYPES = [
  { value: 'storage', label: 'Storage (Factory)' },
  { value: 'machine', label: 'Machine' },
  { value: 'project', label: 'Project' },
  { value: 'damaged', label: 'Damaged (Factory)' },
] as const;

interface AddTransferOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (order: { id: number } & Record<string, unknown>) => void;
}

const AddTransferOrderDialog: React.FC<AddTransferOrderDialogProps> = ({
  open,
  onOpenChange,
  onSuccess,
}) => {
  const [sourceType, setSourceType] = useState<'storage' | 'machine' | 'damaged'>('storage');
  const [sourceId, setSourceId] = useState<string>('');
  const [destType, setDestType] = useState<'storage' | 'machine' | 'project' | 'damaged'>('storage');
  const [destId, setDestId] = useState<string>('');
  const [orderDate, setOrderDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState('');
  const [note, setNote] = useState('');
  const [items, setItems] = useState<Array<{ item_id: number; quantity: number; notes?: string }>>([]);
  const [itemId, setItemId] = useState('');
  const [qty, setQty] = useState('');

  const [createOrder, { isLoading }] = useCreateTransferOrderMutation();
  const { data: itemsList = [] } = useGetItemsQuery({ skip: 0, limit: API_LIMITS.STRICT_100 }, { skip: !open });
  const { data: factories = [] } = useGetFactoriesQuery({ skip: 0, limit: API_LIMITS.STRICT_100 }, { skip: !open });
  const { data: machines = [] } = useGetMachinesQuery({ skip: 0, limit: API_LIMITS.FLEXIBLE_1000 }, { skip: !open });
  const { data: projects = [] } = useGetProjectsQuery({ skip: 0, limit: API_LIMITS.STRICT_100 }, { skip: !open });

  const reset = () => {
    setSourceType('storage');
    setSourceId('');
    setDestType('storage');
    setDestId('');
    setOrderDate(new Date().toISOString().slice(0, 10));
    setDescription('');
    setNote('');
    setItems([]);
    setItemId('');
    setQty('');
  };

  const handleAddItem = () => {
    const iid = parseInt(itemId, 10);
    const q = parseFloat(qty);
    if (isNaN(iid) || isNaN(q) || q <= 0) {
      toast.error('Enter valid item and quantity');
      return;
    }
    setItems((prev) => [...prev, { item_id: iid, quantity: q }]);
    setItemId('');
    setQty('');
  };

  const handleRemoveItem = (idx: number) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const sid = parseInt(sourceId, 10);
    const did = parseInt(destId, 10);
    if (isNaN(sid) || !sourceId) {
      toast.error('Select source location');
      return;
    }
    if (isNaN(did) || !destId) {
      toast.error('Select destination location');
      return;
    }
    if (items.length === 0) {
      toast.error('Add at least one item');
      return;
    }

    const orderData: CreateTransferOrder = {
      source_location_type: sourceType,
      source_location_id: sid,
      destination_location_type: destType,
      destination_location_id: did,
      order_date: orderDate || undefined,
      description: description || undefined,
      note: note || undefined,
      current_status_id: 1,
      items: items.map((i) => ({ item_id: i.item_id, quantity: i.quantity, notes: i.notes })) as CreateTransferOrderItem[],
    };

    try {
      const result = await createOrder(orderData).unwrap();
      toast.success('Transfer order created');
      reset();
      onSuccess(result);
      onOpenChange(false);
    } catch (err: unknown) {
      const e = err as { data?: { detail?: string } };
      toast.error(e?.data?.detail || 'Failed to create transfer order');
    }
  };

  const sourceOptions = (sourceType === 'storage' || sourceType === 'damaged')
    ? factories.map((f) => ({ value: f.id.toString(), label: f.name }))
    : machines.map((m) => ({ value: m.id.toString(), label: m.name }));

  const destOptions = (destType === 'storage' || destType === 'damaged')
    ? factories.map((f) => ({ value: f.id.toString(), label: f.name }))
    : destType === 'machine'
      ? machines.map((m) => ({ value: m.id.toString(), label: m.name }))
      : projects.map((p) => ({ value: p.id.toString(), label: p.name }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Transfer Order</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Source type *</Label>
              <Select value={sourceType} onValueChange={(v) => { setSourceType(v as typeof sourceType); setSourceId(''); }}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SOURCE_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Source *</Label>
              <Select value={sourceId} onValueChange={setSourceId} required>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select source" />
                </SelectTrigger>
                <SelectContent>
                  {sourceOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Destination type *</Label>
              <Select value={destType} onValueChange={(v) => { setDestType(v as typeof destType); setDestId(''); }}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DEST_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Destination *</Label>
              <Select value={destId} onValueChange={setDestId} required>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select destination" />
                </SelectTrigger>
                <SelectContent>
                  {destOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Order date</Label>
            <Input type="date" value={orderDate} onChange={(e) => setOrderDate(e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label>Description</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional" />
          </div>
          <div>
            <Label>Note</Label>
            <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional" />
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
                      <span>{item?.name ?? `Item #${it.item_id}`} × {it.quantity}</span>
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
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
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

export default AddTransferOrderDialog;
