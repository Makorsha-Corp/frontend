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
import { useCreateExpenseOrderMutation } from '@/features/expenseOrders/expenseOrdersApi';
import { useGetAccountsQuery } from '@/features/accounts/accountsApi';
import type { CreateExpenseOrder, CreateExpenseOrderItem } from '@/types/expenseOrder';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { API_LIMITS } from '@/constants/apiLimits';

const EXPENSE_CATEGORIES = [
  { value: 'utilities', label: 'Utilities' },
  { value: 'payroll', label: 'Payroll' },
  { value: 'rent', label: 'Rent' },
  { value: 'services', label: 'Services' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'other', label: 'Other' },
] as const;

const UNITS = ['', 'hr', 'day', 'month', 'pcs', 'kg', 'L', 'm', 'sqm'];

interface AddExpenseOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (order: { id: number } & Record<string, unknown>) => void;
}

const AddExpenseOrderDialog: React.FC<AddExpenseOrderDialogProps> = ({
  open,
  onOpenChange,
  onSuccess,
}) => {
  const [accountId, setAccountId] = useState<string>('none');
  const [expenseCategory, setExpenseCategory] = useState<string>('utilities');
  const [expenseDate, setExpenseDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState('');
  const [description, setDescription] = useState('');
  const [expenseNote, setExpenseNote] = useState('');
  const [items, setItems] = useState<Array<{
    description: string;
    quantity: number;
    unit?: string;
    unit_price: number;
    notes?: string;
  }>>([]);
  const [lineDescription, setLineDescription] = useState('');
  const [lineQty, setLineQty] = useState('1');
  const [lineUnit, setLineUnit] = useState<string>('none');
  const [linePrice, setLinePrice] = useState('');

  const [createOrder, { isLoading }] = useCreateExpenseOrderMutation();
  const { data: accounts = [] } = useGetAccountsQuery({ skip: 0, limit: API_LIMITS.STRICT_100 }, { skip: !open });

  const reset = () => {
    setAccountId('none');
    setExpenseCategory('utilities');
    setExpenseDate(new Date().toISOString().slice(0, 10));
    setDueDate('');
    setDescription('');
    setExpenseNote('');
    setItems([]);
    setLineDescription('');
    setLineQty('1');
    setLineUnit('none');
    setLinePrice('');
  };

  const handleAddItem = () => {
    const q = parseFloat(lineQty);
    const p = parseFloat(linePrice);
    if (!lineDescription.trim()) {
      toast.error('Enter a description for the line item');
      return;
    }
    if (isNaN(q) || q <= 0) {
      toast.error('Enter a valid quantity');
      return;
    }
    if (isNaN(p) || p < 0) {
      toast.error('Enter a valid unit price');
      return;
    }
    setItems((prev) => [
      ...prev,
      {
        description: lineDescription.trim(),
        quantity: q,
        unit: lineUnit && lineUnit !== 'none' ? lineUnit : undefined,
        unit_price: p,
      },
    ]);
    setLineDescription('');
    setLineQty('1');
    setLineUnit('none');
    setLinePrice('');
  };

  const handleRemoveItem = (idx: number) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const aid = accountId && accountId !== 'none' ? parseInt(accountId, 10) : null;
    if (accountId && accountId !== 'none' && (isNaN(aid!) || !accountId)) {
      toast.error('Select a valid account');
      return;
    }
    if (items.length === 0) {
      toast.error('Add at least one line item');
      return;
    }

    const orderData: CreateExpenseOrder = {
      account_id: aid,
      expense_category: expenseCategory,
      expense_date: expenseDate || undefined,
      due_date: dueDate || undefined,
      description: description || undefined,
      expense_note: expenseNote || undefined,
      current_status_id: 1,
      items: items.map(
        (i): CreateExpenseOrderItem => ({
          description: i.description,
          quantity: i.quantity,
          unit: i.unit && i.unit !== 'none' ? i.unit : null,
          unit_price: i.unit_price,
          notes: i.notes,
        })
      ),
    };

    try {
      const result = await createOrder(orderData).unwrap();
      toast.success('Expense order created');
      reset();
      onSuccess(result);
      onOpenChange(false);
    } catch (err: unknown) {
      const e = err as { data?: { detail?: string } };
      toast.error(e?.data?.detail || 'Failed to create expense order');
    }
  };

  const totalAmount = items.reduce((sum, i) => sum + i.quantity * i.unit_price, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Expense Order</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Account</Label>
              <Select value={accountId} onValueChange={setAccountId}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select account (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {accounts.map((a) => (
                    <SelectItem key={a.id} value={a.id.toString()}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Category *</Label>
              <Select value={expenseCategory} onValueChange={setExpenseCategory} required>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EXPENSE_CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Expense date *</Label>
              <Input
                type="date"
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Due date</Label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="mt-1"
                placeholder="Optional"
              />
            </div>
          </div>

          <div>
            <Label>Description</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional"
            />
          </div>
          <div>
            <Label>Expense note</Label>
            <Input
              value={expenseNote}
              onChange={(e) => setExpenseNote(e.target.value)}
              placeholder="Optional"
            />
          </div>

          <div>
            <Label className="block mb-2">Line items *</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              <Input
                value={lineDescription}
                onChange={(e) => setLineDescription(e.target.value)}
                placeholder="Description"
                className="flex-1 min-w-[120px]"
              />
              <Input
                type="number"
                min="0.01"
                step="0.01"
                value={lineQty}
                onChange={(e) => setLineQty(e.target.value)}
                placeholder="Qty"
                className="w-16"
              />
              <Select value={lineUnit} onValueChange={setLineUnit}>
                <SelectTrigger className="w-20">
                  <SelectValue placeholder="Unit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">—</SelectItem>
                  {UNITS.filter(Boolean).map((u) => (
                    <SelectItem key={u} value={u}>
                      {u}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={linePrice}
                onChange={(e) => setLinePrice(e.target.value)}
                placeholder="Unit price"
                className="w-24"
              />
              <Button type="button" variant="outline" size="icon" onClick={handleAddItem}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {items.length > 0 && (
              <div className="border rounded-lg divide-y max-h-32 overflow-y-auto">
                {items.map((it, idx) => (
                  <div key={idx} className="flex items-center justify-between px-3 py-2 text-sm">
                    <span>
                      {it.description} × {it.quantity}
                      {it.unit && it.unit !== 'none' && ` ${it.unit}`} @ {it.unit_price.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                    </span>
                    <Button type="button" variant="ghost" size="sm" onClick={() => handleRemoveItem(idx)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
                <div className="px-3 py-2 text-sm font-medium border-t border-border">
                  Total: {totalAmount.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 })}
                </div>
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

export default AddExpenseOrderDialog;
