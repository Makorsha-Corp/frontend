import React, { useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { StepNumberInput } from '@/components/ui/step-number-input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  useCreateOrderTemplateMutation,
  useUpdateOrderTemplateMutation,
  useGetOrderTemplateItemsQuery,
  useAddOrderTemplateItemMutation,
  useUpdateOrderTemplateItemMutation,
  useRemoveOrderTemplateItemMutation,
} from '@/features/orderTemplates/orderTemplatesApi';
import { useGetAccountsQuery } from '@/features/accounts/accountsApi';
import { useGetFactoriesQuery } from '@/features/factories/factoriesApi';
import { useGetDepartmentsQuery } from '@/features/departments/departmentsApi';
import { useGetWorkspaceMembersQuery } from '@/features/workspaces/workspaceApi';
import { useAppSelector } from '@/app/hooks';
import type { OrderTemplate, CreateOrderTemplate } from '@/types/orderTemplate';
import { ALLOCATION_TYPES, type AllocationTypeValue } from '@/components/newcomponents/customui/orders/expenseOrderConstants';
import { API_LIMITS } from '@/constants/apiLimits';
import { Info, Loader2, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import AccountSelectorDialog from '@/components/newcomponents/customui/AccountSelectorDialog';
import { AccountSelectSummaryButton } from '@/components/newcomponents/customui/AccountSelectSummaryButton';

const RECURRENCE_TYPES = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Biweekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'annually', label: 'Annually' },
  { value: 'custom', label: 'Custom' },
] as const;

interface ExistingLineDraft {
  id: number;
  description: string;
  quantity: string;
  unit: string;
  unit_price: string;
  removed: boolean;
}

interface PendingNewLine {
  key: string;
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
}

function newLineKey() {
  return `n-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export interface CreateEditExpenseTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template?: OrderTemplate | null;
}

const CreateEditExpenseTemplateDialog: React.FC<CreateEditExpenseTemplateDialogProps> = ({
  open,
  onOpenChange,
  template,
}) => {
  const isEdit = template != null;
  const { workspace } = useAppSelector((s) => s.auth);

  const [templateName, setTemplateName] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [accountId, setAccountId] = useState<string>('none');
  const [allocationType, setAllocationType] = useState<AllocationTypeValue>('other');
  const [costCenterId, setCostCenterId] = useState<string>('none');
  const [accountPickerOpen, setAccountPickerOpen] = useState(false);

  const [requiresApproval, setRequiresApproval] = useState(true);
  const [defaultApproverId, setDefaultApproverId] = useState<string>('none');
  const [autoApprove, setAutoApprove] = useState(false);

  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceType, setRecurrenceType] = useState<string>('monthly');
  const [recurrenceInterval, setRecurrenceInterval] = useState('1');
  const [recurrenceDay, setRecurrenceDay] = useState('1');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [generateDaysBefore, setGenerateDaysBefore] = useState('0');

  const [existingLines, setExistingLines] = useState<ExistingLineDraft[]>([]);
  const [pendingNewLines, setPendingNewLines] = useState<PendingNewLine[]>([]);
  const [lineDescription, setLineDescription] = useState('');
  const [lineQty, setLineQty] = useState('1');
  const [lineUnit, setLineUnit] = useState('');
  const [linePrice, setLinePrice] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const { data: accounts = [] } = useGetAccountsQuery({ skip: 0, limit: API_LIMITS.STRICT_100 }, { skip: !open });
  const { data: factories = [] } = useGetFactoriesQuery({ skip: 0, limit: API_LIMITS.FLEXIBLE_1000 }, { skip: !open });
  const { data: departments = [] } = useGetDepartmentsQuery({ skip: 0, limit: API_LIMITS.FLEXIBLE_1000 }, { skip: !open });
  const { data: members = [] } = useGetWorkspaceMembersQuery(workspace?.id ?? 0, { skip: !open || !workspace?.id });
  const { data: templateItems = [] } = useGetOrderTemplateItemsQuery(template?.id ?? 0, {
    skip: !open || !isEdit,
  });

  const [createTemplate, { isLoading: isCreating }] = useCreateOrderTemplateMutation();
  const [updateTemplate, { isLoading: isUpdating }] = useUpdateOrderTemplateMutation();
  const [addItem] = useAddOrderTemplateItemMutation();
  const [updateItem] = useUpdateOrderTemplateItemMutation();
  const [removeItem] = useRemoveOrderTemplateItemMutation();

  const costCenterOptions = useMemo(() => {
    if (allocationType === 'factory') return factories.map((f) => ({ id: f.id, label: f.name }));
    if (allocationType === 'department') return departments.map((d) => ({ id: d.id, label: d.name }));
    return [];
  }, [allocationType, factories, departments]);

  const assignableMembers = members.filter((m) => m.status === 'active');

  useEffect(() => {
    if (!open) return;
    if (template) {
      setTemplateName(template.template_name);
      setDescription(template.description ?? '');
      setNotes(template.notes ?? '');
      setAccountId(template.account_id != null ? String(template.account_id) : 'none');
      setAllocationType((template.expense_category as AllocationTypeValue) || 'other');
      setCostCenterId(template.cost_center_id != null ? String(template.cost_center_id) : 'none');
      setRequiresApproval(template.requires_approval);
      setDefaultApproverId(template.default_approver_id != null ? String(template.default_approver_id) : 'none');
      setAutoApprove(template.auto_approve);
      setIsRecurring(template.is_recurring);
      setRecurrenceType(template.recurrence_type || 'monthly');
      setRecurrenceInterval(template.recurrence_interval != null ? String(template.recurrence_interval) : '1');
      setRecurrenceDay(template.recurrence_day != null ? String(template.recurrence_day) : '1');
      setStartDate(template.start_date ?? '');
      setEndDate(template.end_date ?? '');
      setGenerateDaysBefore(String(template.generate_days_before ?? 0));
    } else {
      setTemplateName('');
      setDescription('');
      setNotes('');
      setAccountId('none');
      setAllocationType('other');
      setCostCenterId('none');
      setRequiresApproval(true);
      setDefaultApproverId('none');
      setAutoApprove(false);
      setIsRecurring(false);
      setRecurrenceType('monthly');
      setRecurrenceInterval('1');
      setRecurrenceDay('1');
      setStartDate('');
      setEndDate('');
      setGenerateDaysBefore('0');
    }
    setPendingNewLines([]);
    setLineDescription('');
    setLineQty('1');
    setLineUnit('');
    setLinePrice('');
  }, [open, template]);

  useEffect(() => {
    if (!open || !isEdit) return;
    setExistingLines(
      templateItems.map((it) => ({
        id: it.id,
        description: it.description ?? '',
        quantity: String(it.quantity),
        unit: it.unit ?? '',
        unit_price: it.unit_price != null ? String(it.unit_price) : '',
        removed: false,
      }))
    );
  }, [open, isEdit, templateItems]);

  const handleAddLine = () => {
    const q = parseFloat(lineQty);
    const p = parseFloat(linePrice);
    if (!lineDescription.trim()) {
      toast.error('Enter a description for this line');
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
    setPendingNewLines((prev) => [
      ...prev,
      { key: newLineKey(), description: lineDescription.trim(), quantity: q, unit: lineUnit.trim(), unit_price: p },
    ]);
    setLineDescription('');
    setLineQty('1');
    setLineUnit('');
    setLinePrice('');
  };

  const handleSubmit = async () => {
    if (!templateName.trim()) {
      toast.error('Enter a template name');
      return;
    }
    if (allocationType !== 'other' && costCenterId === 'none') {
      toast.error(`Select a ${allocationType} for this template`);
      return;
    }

    const aid = accountId !== 'none' ? Number(accountId) : null;
    const basePayload = {
      template_name: templateName.trim(),
      description: description.trim() || null,
      notes: notes.trim() || null,
      account_id: aid,
      expense_category: allocationType,
      cost_center_id: allocationType === 'other' ? null : Number(costCenterId),
      requires_approval: requiresApproval,
      default_approver_id: requiresApproval && !autoApprove && defaultApproverId !== 'none' ? Number(defaultApproverId) : null,
      auto_approve: autoApprove,
      is_recurring: isRecurring,
      recurrence_type: isRecurring ? recurrenceType : null,
      recurrence_interval: isRecurring && recurrenceType === 'custom' ? Number(recurrenceInterval) || null : null,
      recurrence_day: isRecurring ? Number(recurrenceDay) || null : null,
      start_date: isRecurring && startDate ? startDate : null,
      end_date: isRecurring && endDate ? endDate : null,
      generate_days_before: isRecurring ? Number(generateDaysBefore) || 0 : 0,
    };

    setIsSaving(true);
    try {
      if (isEdit && template) {
        await updateTemplate({ id: template.id, data: basePayload }).unwrap();

        for (const line of existingLines) {
          const orig = templateItems.find((i) => i.id === line.id);
          if (!orig) continue;
          if (line.removed) {
            await removeItem(line.id).unwrap();
            continue;
          }
          const payload = {
            description: line.description.trim() || null,
            quantity: Number(line.quantity),
            unit: line.unit || null,
            unit_price: line.unit_price ? Number(line.unit_price) : null,
          };
          const changed =
            orig.description !== payload.description ||
            Number(orig.quantity) !== payload.quantity ||
            (orig.unit ?? '') !== (payload.unit ?? '') ||
            Number(orig.unit_price ?? 0) !== Number(payload.unit_price ?? 0);
          if (changed) {
            await updateItem({ itemId: line.id, data: payload }).unwrap();
          }
        }
        for (const line of pendingNewLines) {
          await addItem({
            tplId: template.id,
            data: { description: line.description, quantity: line.quantity, unit: line.unit || null, unit_price: line.unit_price },
          }).unwrap();
        }
        toast.success('Template updated');
      } else {
        const createPayload: CreateOrderTemplate = {
          ...basePayload,
          items: [
            ...pendingNewLines.map((line) => ({
              description: line.description,
              quantity: line.quantity,
              unit: line.unit || null,
              unit_price: line.unit_price,
            })),
          ],
        };
        await createTemplate(createPayload).unwrap();
        toast.success('Template created');
      }
      onOpenChange(false);
    } catch (err: unknown) {
      const e = err as { data?: { detail?: string } };
      toast.error(e?.data?.detail || 'Failed to save template');
    } finally {
      setIsSaving(false);
    }
  };

  const submitting = isSaving || isCreating || isUpdating;
  const dayLabel = recurrenceType === 'weekly' || recurrenceType === 'biweekly' ? 'Day of week (0-6)' : 'Day of month (1-31)';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[80vh] max-h-[80vh] w-[min(52rem,94vw)] max-w-none flex-col gap-0 overflow-hidden p-0 sm:max-w-none">
        <DialogHeader className="shrink-0 border-b border-border px-6 py-4">
          <DialogTitle>{isEdit ? `Edit Template · ${template?.template_name}` : 'New Expense Template'}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 min-h-0 space-y-6 overflow-y-auto px-6 py-5">
          <div className="space-y-4">
            <div>
              <Label>Template name *</Label>
              <Input value={templateName} onChange={(e) => setTemplateName(e.target.value)} placeholder="e.g. Monthly office rent" className="mt-1" />
            </div>
            <div>
              <Label>Description</Label>
              <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. PC fix" className="mt-1" />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label>Account</Label>
                <AccountSelectSummaryButton
                  onClick={() => setAccountPickerOpen(true)}
                  ariaLabel="Select optional account"
                  selectedLine={accountId !== 'none' ? accounts.find((a) => a.id === Number(accountId))?.name || null : null}
                  staleNumericId={accountId !== 'none' ? accountId : null}
                  compactLabel
                />
                <AccountSelectorDialog
                  open={accountPickerOpen}
                  onOpenChange={setAccountPickerOpen}
                  title="Select account (optional)"
                  description="Default account for expense orders created from this template."
                  selectedAccountId={accountId !== 'none' ? Number(accountId) : undefined}
                  allowClear
                  onSelect={(account) => setAccountId(account ? String(account.id) : 'none')}
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
                <Select value={costCenterId} onValueChange={setCostCenterId}>
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
            <div>
              <Label>Notes</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="mt-1 resize-none" placeholder="Internal notes about this template" />
            </div>
          </div>

          <div className="space-y-3 border-t border-border pt-5">
            <div className="flex items-center justify-between">
              <Label className="text-base">Line items</Label>
              <span className="text-xs text-muted-foreground tabular-nums">
                {existingLines.filter((l) => !l.removed).length + pendingNewLines.length} lines
              </span>
            </div>
            <div className="space-y-3 rounded-lg border border-border bg-muted/20 p-3">
              <div className="grid gap-1">
                <Label className="text-xs text-muted-foreground">Description</Label>
                <Input value={lineDescription} onChange={(e) => setLineDescription(e.target.value)} placeholder="What will be purchased or billed" className="bg-background" />
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <div className="grid gap-1">
                  <Label className="text-xs text-muted-foreground">Qty</Label>
                  <StepNumberInput min={1} step={1} value={lineQty} onChange={(e) => setLineQty(e.target.value)} />
                </div>
                <div className="grid gap-1">
                  <Label className="text-xs text-muted-foreground">Unit</Label>
                  <Input value={lineUnit} onChange={(e) => setLineUnit(e.target.value)} placeholder="e.g. hr" className="bg-background" />
                </div>
                <div className="grid gap-1">
                  <Label className="text-xs text-muted-foreground">Unit price</Label>
                  <StepNumberInput min={0} step={1} value={linePrice} onChange={(e) => setLinePrice(e.target.value)} placeholder="0.00" />
                </div>
                <div className="flex items-end">
                  <Button type="button" variant="outline" className="w-full" onClick={handleAddLine}>
                    <Plus className="mr-1 h-4 w-4" />
                    Add
                  </Button>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Description</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {existingLines.filter((l) => !l.removed).length === 0 && pendingNewLines.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="py-6 text-center text-sm text-muted-foreground">
                        No line items yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    <>
                      {existingLines
                        .filter((l) => !l.removed)
                        .map((line) => (
                          <TableRow key={line.id}>
                            <TableCell className="font-medium">{line.description}</TableCell>
                            <TableCell>
                              {line.quantity}
                              {line.unit ? ` ${line.unit}` : ''}
                            </TableCell>
                            <TableCell>{line.unit_price || '—'}</TableCell>
                            <TableCell>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                  setExistingLines((prev) => prev.map((l) => (l.id === line.id ? { ...l, removed: true } : l)))
                                }
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      {pendingNewLines.map((line) => (
                        <TableRow key={line.key} className="bg-brand-primary/5">
                          <TableCell className="font-medium">{line.description}</TableCell>
                          <TableCell>
                            {line.quantity}
                            {line.unit ? ` ${line.unit}` : ''}
                          </TableCell>
                          <TableCell>{line.unit_price}</TableCell>
                          <TableCell>
                            <Button type="button" variant="ghost" size="icon" onClick={() => setPendingNewLines((prev) => prev.filter((l) => l.key !== line.key))}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          <div className="space-y-4 border-t border-border pt-5">
            <Label className="text-base">Approval defaults</Label>
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <p className="text-sm font-medium text-foreground">Require approval</p>
                <p className="text-xs text-muted-foreground">Orders created from this template need approvers before invoicing.</p>
              </div>
              <Switch checked={requiresApproval} onCheckedChange={setRequiresApproval} />
            </div>
            {requiresApproval && (
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">Auto-approve</p>
                    <p className="text-xs text-muted-foreground">
                      No one needs to approve — the system auto-approves orders created from this template.
                    </p>
                  </div>
                  <Switch
                    checked={autoApprove}
                    onCheckedChange={(checked) => {
                      setAutoApprove(checked);
                      if (checked) setDefaultApproverId('none');
                    }}
                  />
                </div>
                {autoApprove ? (
                  <p className="rounded-md border border-border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
                    Orders from this template skip the approver step entirely — the event log will record
                    &quot;Auto-approved — following template instructions.&quot;
                  </p>
                ) : (
                  <div>
                    <Label>Default approver</Label>
                    <Select value={defaultApproverId} onValueChange={setDefaultApproverId}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="None" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {assignableMembers.map((m) => (
                          <SelectItem key={m.user_id} value={String(m.user_id)}>
                            {m.user_name ?? m.user_email ?? `User #${m.user_id}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-4 border-t border-border pt-5">
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <p className="text-sm font-medium text-foreground">Recurring template</p>
                <p className="text-xs text-muted-foreground">Save a repeat schedule for this template.</p>
              </div>
              <Switch checked={isRecurring} onCheckedChange={setIsRecurring} />
            </div>

            {isRecurring && (
              <div className="space-y-4 rounded-lg border border-border bg-muted/20 p-4">
                <div className="flex items-start gap-2 rounded-md border border-amber-300/60 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-700/60 dark:bg-amber-950/30 dark:text-amber-300">
                  <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span>
                    Automatic generation isn&apos;t active yet — you&apos;ll still need to create orders from this
                    template manually. This just saves your intended schedule for later.
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <Label>Frequency</Label>
                    <Select value={recurrenceType} onValueChange={setRecurrenceType}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {RECURRENCE_TYPES.map((r) => (
                          <SelectItem key={r.value} value={r.value}>
                            {r.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {recurrenceType === 'custom' && (
                    <div>
                      <Label>Interval (days)</Label>
                      <StepNumberInput min={1} step={1} value={recurrenceInterval} onChange={(e) => setRecurrenceInterval(e.target.value)} />
                    </div>
                  )}
                  <div>
                    <Label>{dayLabel}</Label>
                    <StepNumberInput min={0} step={1} value={recurrenceDay} onChange={(e) => setRecurrenceDay(e.target.value)} />
                  </div>
                  <div>
                    <Label>Generate days before</Label>
                    <StepNumberInput min={0} step={1} value={generateDaysBefore} onChange={(e) => setGenerateDaysBefore(e.target.value)} />
                  </div>
                  <div>
                    <Label>Start date</Label>
                    <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="mt-1" />
                  </div>
                  <div>
                    <Label>End date</Label>
                    <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="mt-1" placeholder="Optional" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="shrink-0 border-t border-border px-6 py-4 gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" disabled={submitting} className="bg-brand-primary hover:bg-brand-primary-hover" onClick={handleSubmit}>
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEdit ? 'Save changes' : 'Create template'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateEditExpenseTemplateDialog;
