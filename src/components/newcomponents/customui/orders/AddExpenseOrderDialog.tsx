import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StepNumberInput } from '@/components/ui/step-number-input';
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
import { useGetFactoriesQuery } from '@/features/factories/factoriesApi';
import { useGetMachinesQuery } from '@/features/machines/machinesApi';
import { useGetProjectsQuery } from '@/features/projects/projectsApi';
import { useGetDepartmentsQuery } from '@/features/departments/departmentsApi';
import type { CreateExpenseOrder, CreateExpenseOrderItem } from '@/types/expenseOrder';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { API_LIMITS } from '@/constants/apiLimits';
import AccountSelectorDialog from '@/components/newcomponents/customui/AccountSelectorDialog';
import { AccountSelectSummaryButton } from '@/components/newcomponents/customui/AccountSelectSummaryButton';
import { EXPENSE_CATEGORIES } from '@/components/newcomponents/customui/orders/expenseOrderConstants';

const UNITS = ['', 'hr', 'day', 'month', 'pcs', 'kg', 'L', 'm', 'sqm'];

const COST_CENTER_TYPES = [
  { value: 'none', label: 'None' },
  { value: 'factory', label: 'Factory' },
  { value: 'machine', label: 'Machine' },
  { value: 'project', label: 'Project' },
  { value: 'department', label: 'Department' },
] as const;

const formatMoney = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 });

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
  const [items, setItems] = useState<
    Array<{
      description: string;
      quantity: number;
      unit?: string;
      unit_price: number;
      cost_center_type?: string | null;
      cost_center_id?: number | null;
      notes?: string;
    }>
  >([]);
  const [lineDescription, setLineDescription] = useState('');
  const [lineQty, setLineQty] = useState('1');
  const [lineUnit, setLineUnit] = useState<string>('none');
  const [linePrice, setLinePrice] = useState('');
  const [lineCostCenterType, setLineCostCenterType] = useState('none');
  const [lineCostCenterId, setLineCostCenterId] = useState('none');
  const [lineNotes, setLineNotes] = useState('');
  const [accountPickerOpen, setAccountPickerOpen] = useState(false);

  const [createOrder, { isLoading }] = useCreateExpenseOrderMutation();
  const { data: accounts = [] } = useGetAccountsQuery({ skip: 0, limit: API_LIMITS.STRICT_100 }, { skip: !open });
  const { data: factories = [] } = useGetFactoriesQuery(
    { skip: 0, limit: API_LIMITS.FLEXIBLE_1000 },
    { skip: !open }
  );
  const { data: machines = [] } = useGetMachinesQuery(
    { skip: 0, limit: API_LIMITS.FLEXIBLE_1000 },
    { skip: !open }
  );
  const { data: projects = [] } = useGetProjectsQuery(
    { skip: 0, limit: API_LIMITS.FLEXIBLE_1000 },
    { skip: !open }
  );
  const { data: departments = [] } = useGetDepartmentsQuery(
    { skip: 0, limit: API_LIMITS.FLEXIBLE_1000 },
    { skip: !open }
  );

  const costCenterOptions = React.useMemo(() => {
    switch (lineCostCenterType) {
      case 'factory':
        return factories.map((f) => ({ id: f.id, label: f.name }));
      case 'machine':
        return machines.map((m) => ({ id: m.id, label: m.name }));
      case 'project':
        return projects.map((p) => ({ id: p.id, label: p.name }));
      case 'department':
        return departments.map((d) => ({ id: d.id, label: d.name }));
      default:
        return [];
    }
  }, [lineCostCenterType, factories, machines, projects, departments]);

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
    setLineCostCenterType('none');
    setLineCostCenterId('none');
    setLineNotes('');
  };

  const handleAddItem = () => {
    const q = parseFloat(lineQty);
    const p = parseFloat(linePrice);
    if (!lineDescription.trim()) {
      toast.error('Enter a description for this expense');
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
    if (lineCostCenterType !== 'none' && lineCostCenterId === 'none') {
      toast.error('Select a cost center');
      return;
    }
    const cc =
      lineCostCenterType !== 'none' && lineCostCenterId !== 'none'
        ? { cost_center_type: lineCostCenterType, cost_center_id: Number(lineCostCenterId) }
        : { cost_center_type: null, cost_center_id: null };
    setItems((prev) => [
      ...prev,
      {
        description: lineDescription.trim(),
        quantity: q,
        unit: lineUnit && lineUnit !== 'none' ? lineUnit : undefined,
        unit_price: p,
        ...cc,
        notes: lineNotes.trim() || undefined,
      },
    ]);
    setLineDescription('');
    setLineQty('1');
    setLineUnit('none');
    setLinePrice('');
    setLineCostCenterType('none');
    setLineCostCenterId('none');
    setLineNotes('');
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
      toast.error('Add at least one expense');
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
          cost_center_type: i.cost_center_type ?? null,
          cost_center_id: i.cost_center_id ?? null,
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

  const expensesBlock = (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3">
      <div className="flex shrink-0 items-center justify-between gap-2">
        <Label className="text-base">Expenses *</Label>
        <span className="text-xs text-muted-foreground tabular-nums">{items.length} added</span>
      </div>

      <div className="shrink-0 space-y-2 rounded-lg border border-border bg-muted/20 p-3">
        <div className="grid gap-1">
          <Label className="text-xs text-muted-foreground">Description</Label>
          <Input
            value={lineDescription}
            onChange={(e) => setLineDescription(e.target.value)}
            placeholder="What was purchased or billed"
            className="bg-background"
          />
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <div className="grid min-w-[4.5rem] flex-1 gap-1">
            <Label className="text-xs text-muted-foreground">Qty</Label>
            <StepNumberInput
              min={1}
              step={1}
              value={lineQty}
              onChange={(e) => setLineQty(e.target.value)}
              className="bg-background"
            />
          </div>
          <div className="grid w-[5.5rem] gap-1">
            <Label className="text-xs text-muted-foreground">Unit</Label>
            <Select value={lineUnit} onValueChange={setLineUnit}>
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="—" />
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
          </div>
          <div className="grid min-w-[5.5rem] flex-1 gap-1">
            <Label className="text-xs text-muted-foreground">Unit price</Label>
            <StepNumberInput
              min={0}
              step={1}
              value={linePrice}
              onChange={(e) => setLinePrice(e.target.value)}
              placeholder="0.00"
              className="bg-background"
            />
          </div>
          <Button type="button" variant="outline" size="icon" className="shrink-0" onClick={handleAddItem}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div>
            <Label className="text-xs text-muted-foreground">Cost center type</Label>
            <Select
              value={lineCostCenterType}
              onValueChange={(v) => {
                setLineCostCenterType(v);
                setLineCostCenterId('none');
              }}
            >
              <SelectTrigger className="bg-background mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COST_CENTER_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Cost center</Label>
            <Select
              value={lineCostCenterId}
              onValueChange={setLineCostCenterId}
              disabled={lineCostCenterType === 'none'}
            >
              <SelectTrigger className="bg-background mt-1">
                <SelectValue placeholder="Select…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">—</SelectItem>
                {costCenterOptions.map((o) => (
                  <SelectItem key={o.id} value={String(o.id)}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 divide-y overflow-y-auto rounded-lg border border-border bg-background">
        {items.length === 0 ? (
          <p className="px-3 py-8 text-center text-sm text-muted-foreground">No expenses yet</p>
        ) : (
          items.map((it, idx) => {
            const unitSuffix = it.unit && it.unit !== 'none' ? ` ${it.unit}` : '';
            const lineTotal = it.quantity * it.unit_price;
            const priceStr = formatMoney(it.unit_price);
            const totalStr = formatMoney(lineTotal);
            return (
              <div key={idx} className="flex items-center justify-between gap-3 px-3 py-2.5">
                <div className="min-w-0 flex-1 space-y-0.5">
                  <p className="truncate text-sm font-medium leading-tight text-foreground">{it.description}</p>
                  <p className="text-xs text-muted-foreground tabular-nums">
                    Quantity {it.quantity}
                    {unitSuffix}
                    <span className="mx-1.5 text-muted-foreground/40" aria-hidden>
                      ·
                    </span>
                    {priceStr} per unit
                    <span className="mx-1.5 text-muted-foreground/40" aria-hidden>
                      ·
                    </span>
                    {totalStr}
                    {it.cost_center_type && it.cost_center_id ? (
                      <>
                        <span className="mx-1.5 text-muted-foreground/40" aria-hidden>
                          ·
                        </span>
                        CC {it.cost_center_type} #{it.cost_center_id}
                      </>
                    ) : null}
                  </p>
                </div>
                <Button type="button" variant="ghost" size="icon" className="shrink-0" onClick={() => handleRemoveItem(idx)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            );
          })
        )}
      </div>

      {items.length > 0 && (
        <div className="shrink-0 rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm font-medium tabular-nums">
          Total: {formatMoney(totalAmount)}
        </div>
      )}
    </div>
  );

  const orderFieldsBlock = (
    <div className="grid min-w-0 gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label>Account</Label>
          <AccountSelectSummaryButton
            onClick={() => setAccountPickerOpen(true)}
            ariaLabel={
              accountId !== 'none'
                ? `Change account. Current account ID ${accountId}`
                : 'Select optional account'
            }
            selectedLine={
              accountId !== 'none'
                ? accounts.find((a) => a.id === parseInt(accountId, 10))?.name || null
                : null
            }
            staleNumericId={accountId !== 'none' ? accountId : null}
            compactLabel
          />
          <AccountSelectorDialog
            open={accountPickerOpen}
            onOpenChange={setAccountPickerOpen}
            title="Select account (optional)"
            description="Pick an account for this expense order, or clear to leave it unassigned."
            selectedAccountId={accountId !== 'none' ? parseInt(accountId, 10) : undefined}
            allowClear
            onSelect={(account) => {
              setAccountId(account ? String(account.id) : 'none');
            }}
          />
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label>Expense date *</Label>
          <Input type="date" value={expenseDate} onChange={(e) => setExpenseDate(e.target.value)} className="mt-1" />
        </div>
        <div>
          <Label>Due date</Label>
          <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="mt-1" placeholder="Optional" />
        </div>
      </div>

      <div>
        <Label>Description</Label>
        <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional" className="mt-1" />
      </div>
      <div>
        <Label>Expense note</Label>
        <Input value={expenseNote} onChange={(e) => setExpenseNote(e.target.value)} placeholder="Optional" className="mt-1" />
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[66vh] max-h-[66vh] w-[min(56rem,94vw)] max-w-none flex-col gap-4 overflow-hidden p-6 sm:max-w-none">
        <DialogHeader className="shrink-0 space-y-0 text-left">
          <DialogTitle>Add Expense Order</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden">
          <div className="grid min-h-0 flex-1 grid-cols-1 gap-6 overflow-hidden md:grid-cols-2 md:gap-8 md:items-stretch">
            <div className="min-h-0 min-w-0 overflow-y-auto pl-2 pr-4 md:flex md:flex-col md:justify-center">
              {orderFieldsBlock}
            </div>
            <div className="flex min-h-0 min-w-0 flex-col border-t border-border pt-6 md:border-t-0 md:border-l md:border-border md:pt-0 md:pl-8">
              {expensesBlock}
            </div>
          </div>

          <div className="flex shrink-0 justify-end gap-2 border-t border-border pt-4">
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
