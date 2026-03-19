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
import { useCreateSalesOrderMutation } from '@/features/salesOrders/salesOrdersApi';
import { useGetItemsQuery } from '@/features/items/itemsApi';
import { useGetFactoriesQuery } from '@/features/factories/factoriesApi';
import type { Account } from '@/types/account';
import type { CreateSalesOrderDTO } from '@/types/salesOrder';
import type { CreateSalesOrderItemDTO } from '@/types/salesOrderItem';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { API_LIMITS } from '@/constants/apiLimits';

interface AddSalesOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accounts: Account[];
  onSuccess: (order: { id: number } & Record<string, unknown>) => void;
}

const AddSalesOrderDialog: React.FC<AddSalesOrderDialogProps> = ({
  open,
  onOpenChange,
  accounts,
  onSuccess,
}) => {
  const { data: factories = [] } = useGetFactoriesQuery({ skip: 0, limit: API_LIMITS.STRICT_100 }, { skip: !open });
  const [accountId, setAccountId] = useState<string>('');
  const [factoryId, setFactoryId] = useState<string>('');
  const [orderDate, setOrderDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [quotationSentDate, setQuotationSentDate] = useState('');
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<Array<{ item_id: number; quantity_ordered: number; unit_price: number; notes?: string }>>([]);
  const [itemId, setItemId] = useState('');
  const [qty, setQty] = useState('');
  const [unitPrice, setUnitPrice] = useState('');

  const [createOrder, { isLoading }] = useCreateSalesOrderMutation();
  const { data: itemsList = [] } = useGetItemsQuery({ skip: 0, limit: API_LIMITS.STRICT_100 }, { skip: !open });

  const reset = () => {
    setAccountId('');
    setFactoryId('');
    setOrderDate(new Date().toISOString().slice(0, 10));
    setQuotationSentDate('');
    setExpectedDeliveryDate('');
    setNotes('');
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
    const fid = parseInt(factoryId, 10);
    if (isNaN(aid) || !accountId) {
      toast.error('Select a customer');
      return;
    }
    if (isNaN(fid) || !factoryId) {
      toast.error('Select a factory');
      return;
    }
    if (items.length === 0) {
      toast.error('Add at least one item');
      return;
    }

    const orderData: CreateSalesOrderDTO = {
      account_id: aid,
      factory_id: fid,
      order_date: orderDate,
      quotation_sent_date: quotationSentDate || undefined,
      expected_delivery_date: expectedDeliveryDate || undefined,
      current_status_id: 1,
      notes: notes || undefined,
    };

    const itemsData: CreateSalesOrderItemDTO[] = items.map((i) => ({
      item_id: i.item_id,
      quantity_ordered: i.quantity_ordered,
      unit_price: i.unit_price,
      notes: i.notes,
    }));

    try {
      const result = await createOrder({ order: orderData, items: itemsData }).unwrap();
      toast.success('Sales order created');
      reset();
      onSuccess(result);
      onOpenChange(false);
    } catch (err: unknown) {
      const e = err as { data?: { detail?: string } };
      toast.error(e?.data?.detail || 'Failed to create sales order');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Sales Order</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Customer *</Label>
            <Select value={accountId} onValueChange={setAccountId} required>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select customer" />
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
            <Label>Factory *</Label>
            <Select value={factoryId} onValueChange={setFactoryId} required>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select factory" />
              </SelectTrigger>
              <SelectContent>
                {factories.map((f) => (
                  <SelectItem key={f.id} value={f.id.toString()}>
                    {f.name} {f.abbreviation && `(${f.abbreviation})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Order date *</Label>
            <Input
              type="date"
              value={orderDate}
              onChange={(e) => setOrderDate(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label>Quotation sent date</Label>
            <Input
              type="date"
              value={quotationSentDate}
              onChange={(e) => setQuotationSentDate(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label>Expected delivery date</Label>
            <Input
              type="date"
              value={expectedDeliveryDate}
              onChange={(e) => setExpectedDeliveryDate(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label>Notes</Label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional" />
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

export default AddSalesOrderDialog;
