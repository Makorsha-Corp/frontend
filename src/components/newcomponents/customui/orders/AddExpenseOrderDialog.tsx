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
import {
  useCreateExpenseOrderMutation,
  useCreateExpenseOrderFromTemplateMutation,
} from '@/features/expenseOrders/expenseOrdersApi';
import {
  useGetOrderTemplatesQuery,
  useGetOrderTemplateItemsQuery,
} from '@/features/orderTemplates/orderTemplatesApi';
import { useGetAccountsQuery } from '@/features/accounts/accountsApi';
import { useGetFactoriesQuery } from '@/features/factories/factoriesApi';
import { useGetDepartmentsQuery } from '@/features/departments/departmentsApi';
import type { CreateExpenseOrder, CreateExpenseOrderItem } from '@/types/expenseOrder';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { API_LIMITS } from '@/constants/apiLimits';
import AccountSelectorDialog from '@/components/newcomponents/customui/AccountSelectorDialog';
import { AccountSelectSummaryButton } from '@/components/newcomponents/customui/AccountSelectSummaryButton';
import { ALLOCATION_TYPES, expenseCategoryLabel, type AllocationTypeValue } from '@/components/newcomponents/customui/orders/expenseOrderConstants';
import { cn } from '@/lib/utils';

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
  const [allocationType, setAllocationType] = useState<AllocationTypeValue>('factory');
  const [costCenterId, setCostCenterId] = useState<string>('none');
  const [expenseDate, setExpenseDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState('');
  const [description, setDescription] = useState('');
  const [items, setItems] = useState<
    Array<{
      description: string;
      quantity: number;
      unit?: string;
      unit_price: number;
      notes?: string;
    }>
  >([]);
  const [lineDescription, setLineDescription] = useState('');
  const [lineQty, setLineQty] = useState('1');
  const [lineUnit, setLineUnit] = useState<string>('');
  const [linePrice, setLinePrice] = useState('');
  const [lineNotes, setLineNotes] = useState('');
  const [accountPickerOpen, setAccountPickerOpen] = useState(false);

  const [mode, setMode] = useState<'blank' | 'template'>('blank');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('none');

  const [createOrder, { isLoading }] = useCreateExpenseOrderMutation();
  const [createFromTemplate, { isLoading: isCreatingFromTemplate }] = useCreateExpenseOrderFromTemplateMutation();
  const { data: accounts = [] } = useGetAccountsQuery({ skip: 0, limit: API_LIMITS.STRICT_100 }, { skip: !open });
  const { data: templates = [] } = useGetOrderTemplatesQuery(
    { is_active: true, limit: API_LIMITS.FLEXIBLE_1000 },
    { skip: !open || mode !== 'template' }
  );
  const templateId = selectedTemplateId !== 'none' ? Number(selectedTemplateId) : null;
  const { data: templateItems = [] } = useGetOrderTemplateItemsQuery(templateId ?? 0, {
    skip: templateId == null,
  });
  const selectedTemplate = templates.find((t) => t.id === templateId) ?? null;
  const { data: factories = [] } = useGetFactoriesQuery(
    { skip: 0, limit: API_LIMITS.FLEXIBLE_1000 },
    { skip: !open }
  );
  const { data: departments = [] } = useGetDepartmentsQuery(
    { skip: 0, limit: API_LIMITS.FLEXIBLE_1000 },
    { skip: !open }
  );

  const costCenterOptions = React.useMemo(() => {
    if (allocationType === 'factory') return factories.map((f) => ({ id: f.id, label: f.name }));
    if (allocationType === 'department') return departments.map((d) => ({ id: d.id, label: d.name }));
    return [];
  }, [allocationType, factories, departments]);

  const templateCostCenterName = React.useMemo(() => {
    if (!selectedTemplate?.cost_center_id) return null;
    if (selectedTemplate.expense_category === 'factory') {
      return factories.find((f) => f.id === selectedTemplate.cost_center_id)?.name ?? null;
    }
    if (selectedTemplate.expense_category === 'department') {
      return departments.find((d) => d.id === selectedTemplate.cost_center_id)?.name ?? null;
    }
    return null;
  }, [selectedTemplate, factories, departments]);

  const reset = () => {
    setAccountId('none');
    setAllocationType('factory');
    setCostCenterId('none');
    setExpenseDate(new Date().toISOString().slice(0, 10));
    setDueDate('');
    setDescription('');
    setItems([]);
    setLineDescription('');
    setLineQty('1');
    setLineUnit('');
    setLinePrice('');
    setLineNotes('');
    setMode('blank');
    setSelectedTemplateId('none');
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
    setItems((prev) => [
      ...prev,
      {
        description: lineDescription.trim(),
        quantity: q,
        unit: lineUnit.trim() || undefined,
        unit_price: p,
        notes: lineNotes.trim() || undefined,
      },
    ]);
    setLineDescription('');
    setLineQty('1');
    setLineUnit('');
    setLinePrice('');
    setLineNotes('');
  };

  const handleRemoveItem = (idx: number) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === 'template') {
      if (templateId == null) {
        toast.error('Select a template');
        return;
      }
      try {
        const result = await createFromTemplate({
          templateId,
          data: {
            expense_date: expenseDate || undefined,
            due_date: dueDate || undefined,
            description: description || undefined,
          },
        }).unwrap();
        toast.success('Expense order created from template');
        reset();
        onSuccess(result);
        onOpenChange(false);
      } catch (err: unknown) {
        const errObj = err as { data?: { detail?: string } };
        toast.error(errObj?.data?.detail || 'Failed to create expense order from template');
      }
      return;
    }

    const aid = accountId && accountId !== 'none' ? parseInt(accountId, 10) : null;
    if (accountId && accountId !== 'none' && (isNaN(aid!) || !accountId)) {
      toast.error('Select a valid account');
      return;
    }
    if (allocationType !== 'other' && costCenterId === 'none') {
      toast.error(`Select a ${allocationType} for this expense order`);
      return;
    }
    if (!description.trim()) {
      toast.error('Enter a description for this expense order');
      return;
    }
    if (items.length === 0) {
      toast.error('Add at least one expense');
      return;
    }

    const orderData: CreateExpenseOrder = {
      account_id: aid,
      expense_category: allocationType,
      cost_center_id: allocationType === 'other' ? null : Number(costCenterId),
      expense_date: expenseDate || undefined,
      due_date: dueDate || undefined,
      description: description.trim(),
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
            <Input
              value={lineUnit}
              onChange={(e) => setLineUnit(e.target.value)}
              placeholder="e.g. hr"
              className="bg-background"
            />
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
          <Label>Attribute to *</Label>
          <Select
            value={allocationType}
            onValueChange={(v) => {
              setAllocationType(v as AllocationTypeValue);
              setCostCenterId('none');
            }}
            required
          >
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ALLOCATION_TYPES.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {allocationType !== 'other' && (
        <div>
          <Label>{allocationType === 'factory' ? 'Factory *' : 'Department *'}</Label>
          <Select value={costCenterId} onValueChange={setCostCenterId} required>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select…" />
            </SelectTrigger>
            <SelectContent>
              {costCenterOptions.length === 0 ? (
                <div className="px-2 py-1.5 text-sm text-muted-foreground">
                  No {allocationType === 'factory' ? 'factories' : 'departments'} found
                </div>
              ) : (
                costCenterOptions.map((o) => (
                  <SelectItem key={o.id} value={String(o.id)}>
                    {o.label}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
      )}

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
        <Label>Description *</Label>
        <Input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g. PC fix"
          className="mt-1"
        />
      </div>
    </div>
  );

  const templateFieldsBlock = (
    <div className="grid min-w-0 gap-4">
      <div>
        <Label>Template *</Label>
        <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId} required>
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="Select a template" />
          </SelectTrigger>
          <SelectContent>
            {templates.length === 0 ? (
              <div className="px-2 py-1.5 text-sm text-muted-foreground">No active templates</div>
            ) : (
              templates.map((t) => (
                <SelectItem key={t.id} value={String(t.id)}>
                  {t.template_name}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      {selectedTemplate && (
        <div className="grid grid-cols-1 gap-2 rounded-lg border border-border bg-muted/20 p-3 text-sm sm:grid-cols-2">
          <div>
            <span className="text-xs text-muted-foreground">Account</span>
            <p className="font-medium text-foreground">
              {selectedTemplate.account_id
                ? accounts.find((a) => a.id === selectedTemplate.account_id)?.name ?? `#${selectedTemplate.account_id}`
                : 'Unassigned'}
            </p>
          </div>
          <div>
            <span className="text-xs text-muted-foreground">Attributed to</span>
            <p className="font-medium text-foreground">
              {selectedTemplate.expense_category ? expenseCategoryLabel(selectedTemplate.expense_category) : 'Other'}
              {templateCostCenterName ? ` · ${templateCostCenterName}` : ''}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label>Expense date</Label>
          <Input type="date" value={expenseDate} onChange={(e) => setExpenseDate(e.target.value)} className="mt-1" />
        </div>
        <div>
          <Label>Due date</Label>
          <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="mt-1" placeholder="Optional" />
        </div>
      </div>

      <div>
        <Label>Description</Label>
        <Input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={selectedTemplate?.description || 'Optional — overrides the template description'}
          className="mt-1"
        />
      </div>
    </div>
  );

  const templateItemsBlock = (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3">
      <div className="flex shrink-0 items-center justify-between gap-2">
        <Label className="text-base">Expenses</Label>
        <span className="text-xs text-muted-foreground tabular-nums">
          {templateItems.length} from template
        </span>
      </div>
      <p className="shrink-0 text-xs text-muted-foreground">
        Copied from the template as-is. Adjust line items after the order is created.
      </p>
      <div className="min-h-0 flex-1 divide-y overflow-y-auto rounded-lg border border-border bg-background">
        {selectedTemplate == null ? (
          <p className="px-3 py-8 text-center text-sm text-muted-foreground">Select a template to preview its expenses</p>
        ) : templateItems.length === 0 ? (
          <p className="px-3 py-8 text-center text-sm text-muted-foreground">This template has no expense lines</p>
        ) : (
          templateItems.map((it) => {
            const price = it.unit_price ?? 0;
            const lineTotal = it.quantity * price;
            return (
              <div key={it.id} className="flex items-center justify-between gap-3 px-3 py-2.5">
                <div className="min-w-0 flex-1 space-y-0.5">
                  <p className="truncate text-sm font-medium leading-tight text-foreground">{it.description}</p>
                  <p className="text-xs text-muted-foreground tabular-nums">
                    Quantity {it.quantity}
                    {it.unit ? ` ${it.unit}` : ''}
                    <span className="mx-1.5 text-muted-foreground/40" aria-hidden>
                      ·
                    </span>
                    {formatMoney(price)} per unit
                    <span className="mx-1.5 text-muted-foreground/40" aria-hidden>
                      ·
                    </span>
                    {formatMoney(lineTotal)}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );

  const submitting = mode === 'template' ? isCreatingFromTemplate : isLoading;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[66vh] max-h-[66vh] w-[min(56rem,94vw)] max-w-none flex-col gap-4 overflow-hidden p-6 sm:max-w-none">
        <DialogHeader className="shrink-0 space-y-3 text-left">
          <DialogTitle>Add Expense Order</DialogTitle>
          <div className="inline-flex w-fit rounded-lg border border-border bg-muted/30 p-0.5">
            <button
              type="button"
              onClick={() => setMode('blank')}
              className={cn(
                'rounded-md px-3 py-1 text-sm font-medium transition-colors',
                mode === 'blank' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Against an account
            </button>
            <button
              type="button"
              onClick={() => setMode('template')}
              className={cn(
                'rounded-md px-3 py-1 text-sm font-medium transition-colors',
                mode === 'template' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              From template
            </button>
          </div>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden">
          <div className="grid min-h-0 flex-1 grid-cols-1 gap-6 overflow-hidden md:grid-cols-2 md:gap-8 md:items-stretch">
            <div className="min-h-0 min-w-0 overflow-y-auto pl-2 pr-4 md:flex md:flex-col md:justify-center">
              {mode === 'template' ? templateFieldsBlock : orderFieldsBlock}
            </div>
            <div className="flex min-h-0 min-w-0 flex-col border-t border-border pt-6 md:border-t-0 md:border-l md:border-border md:pt-0 md:pl-8">
              {mode === 'template' ? templateItemsBlock : expensesBlock}
            </div>
          </div>

          <div className="flex shrink-0 justify-end gap-2 border-t border-border pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting} className="bg-brand-primary hover:bg-brand-primary-hover">
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddExpenseOrderDialog;
