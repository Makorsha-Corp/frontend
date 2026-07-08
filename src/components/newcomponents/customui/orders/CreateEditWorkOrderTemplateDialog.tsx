import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { StepNumberInput } from '@/components/ui/step-number-input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useCreateWorkOrderTemplateMutation,
  useUpdateWorkOrderTemplateMutation,
  useGetWorkOrderTemplateItemsQuery,
  useGetWorkOrderTemplateApproversQuery,
  useAddWorkOrderTemplateItemMutation,
  useRemoveWorkOrderTemplateItemMutation,
} from '@/features/workOrderTemplates/workOrderTemplatesApi';
import { useGetWorkOrderTypesQuery, useCreateWorkOrderTypeMutation } from '@/features/workOrderTypes/workOrderTypesApi';
import { useGetItemsQuery } from '@/features/items/itemsApi';
import { useGetAccountsQuery } from '@/features/accounts/accountsApi';
import { useGetWorkspaceMembersQuery } from '@/features/workspaces/workspaceApi';
import { useAppSelector } from '@/app/hooks';
import { API_LIMITS } from '@/constants/apiLimits';
import type { WorkOrderTemplate } from '@/types/workOrderTemplate';
import type { WorkOrderItemActionType, WorkOrderPriority } from '@/types/workOrder';
import {
  WORK_ORDER_ITEM_ACTION_OPTIONS,
  WORK_ORDER_ITEM_ACTION_EXPLAINER,
  WORK_ORDER_PRIORITIES,
  priorityLabel,
} from '@/pages/newpages/orders/workOrderConstants';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

export interface CreateEditWorkOrderTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: WorkOrderTemplate | null;
}

interface TemplateLineDraft {
  key: string;
  itemId: string;
  quantity: string;
  actionType: WorkOrderItemActionType;
  replacedItemId: string;
}

const makeKey = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;
const emptyLine = (): TemplateLineDraft => ({ key: makeKey(), itemId: '', quantity: '1', actionType: 'CONSUME', replacedItemId: '' });

const CreateEditWorkOrderTemplateDialog: React.FC<CreateEditWorkOrderTemplateDialogProps> = ({
  open,
  onOpenChange,
  template,
}) => {
  const isEdit = Boolean(template);

  const [templateName, setTemplateName] = useState('');
  const [typeId, setTypeId] = useState('');
  const [isCreatingType, setIsCreatingType] = useState(false);
  const [newTypeName, setNewTypeName] = useState('');
  const [priority, setPriority] = useState<WorkOrderPriority>('MEDIUM');
  const [assignedTo, setAssignedTo] = useState('');

  const [needsParts, setNeedsParts] = useState<'no' | 'yes'>('no');
  const [lines, setLines] = useState<TemplateLineDraft[]>([]);
  const [draftLine, setDraftLine] = useState<TemplateLineDraft>(emptyLine());

  const [billTo, setBillTo] = useState<'external' | 'internal'>('internal');
  const [accountId, setAccountId] = useState('');
  const [hasMiscCost, setHasMiscCost] = useState<'no' | 'yes'>('no');
  const [cost, setCost] = useState('');

  const [requiresApproval, setRequiresApproval] = useState<'no' | 'yes'>('no');
  const [approverIds, setApproverIds] = useState<number[]>([]);

  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const { workspace } = useAppSelector((s) => s.auth);
  const { data: workOrderTypes = [] } = useGetWorkOrderTypesQuery({ skip: 0, limit: API_LIMITS.FLEXIBLE_1000 }, { skip: !open });
  const { data: items = [] } = useGetItemsQuery({ skip: 0, limit: API_LIMITS.STRICT_100 }, { skip: !open });
  const { data: accounts = [] } = useGetAccountsQuery({ skip: 0, limit: API_LIMITS.ACCOUNTS_LIST_MAX }, { skip: !open || billTo !== 'external' });
  const { data: members = [] } = useGetWorkspaceMembersQuery(workspace?.id ?? 0, { skip: !open || !workspace?.id });
  const assignableMembers = members.filter((m) => m.status === 'active');

  const { data: existingItems = [] } = useGetWorkOrderTemplateItemsQuery(template?.id ?? 0, { skip: !open || !template });
  const { data: existingApprovers = [] } = useGetWorkOrderTemplateApproversQuery(template?.id ?? 0, { skip: !open || !template });

  const [createType, { isLoading: isCreatingTypeSaving }] = useCreateWorkOrderTypeMutation();
  const [createTemplate] = useCreateWorkOrderTemplateMutation();
  const [updateTemplate] = useUpdateWorkOrderTemplateMutation();
  const [addTemplateItem] = useAddWorkOrderTemplateItemMutation();
  const [removeTemplateItem] = useRemoveWorkOrderTemplateItemMutation();

  useEffect(() => {
    if (!open) return;
    if (template) {
      setTemplateName(template.template_name);
      setTypeId(String(template.work_order_type_id));
      setPriority(template.priority);
      setAssignedTo(template.assigned_to ?? '');
      setNeedsParts(template.uses_inventory ? 'yes' : 'no');
      if (template.account_id) {
        setBillTo('external');
        setAccountId(String(template.account_id));
        setHasMiscCost('no');
        setCost('');
      } else if (template.cost) {
        setBillTo('internal');
        setHasMiscCost('yes');
        setCost(String(template.cost));
        setAccountId('');
      } else {
        setBillTo('internal');
        setHasMiscCost('no');
        setAccountId('');
        setCost('');
      }
      setRequiresApproval(template.requires_approval ? 'yes' : 'no');
      setDescription(template.description ?? '');
    } else {
      setTemplateName('');
      setTypeId('');
      setPriority('MEDIUM');
      setAssignedTo('');
      setNeedsParts('no');
      setLines([]);
      setBillTo('internal');
      setAccountId('');
      setHasMiscCost('no');
      setCost('');
      setRequiresApproval('no');
      setApproverIds([]);
      setDescription('');
    }
    setDraftLine(emptyLine());
    setIsCreatingType(false);
    setNewTypeName('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, template?.id]);

  useEffect(() => {
    if (!template) return;
    setLines(
      existingItems.map((ti) => ({
        key: `existing-${ti.id}`,
        itemId: String(ti.item_id),
        quantity: String(ti.quantity),
        actionType: ti.action_type,
        replacedItemId: ti.replaced_item_id ? String(ti.replaced_item_id) : '',
      }))
    );
  }, [template, existingItems]);

  useEffect(() => {
    if (!template) return;
    setApproverIds(existingApprovers.map((a) => a.user_id));
  }, [template, existingApprovers]);

  const toggleApprover = (userId: number) => {
    setApproverIds((prev) => (prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]));
  };

  const handleCreateType = async () => {
    if (!newTypeName.trim()) return;
    try {
      const created = await createType({ name: newTypeName.trim() }).unwrap();
      setTypeId(String(created.id));
      setIsCreatingType(false);
      setNewTypeName('');
    } catch (err: unknown) {
      const e = err as { data?: { detail?: string } };
      toast.error(e?.data?.detail || 'Failed to create work order type');
    }
  };

  const itemName = (id: string) => items.find((i) => String(i.id) === id)?.name ?? `Item #${id}`;

  const draftLineValid =
    Boolean(draftLine.itemId) && Number(draftLine.quantity) > 0 && (draftLine.actionType !== 'REPLACE' || Boolean(draftLine.replacedItemId));

  const handleAddLine = () => {
    if (!draftLineValid) {
      toast.error('Pick an item and quantity for this part line');
      return;
    }
    setLines((prev) => [...prev, draftLine]);
    setDraftLine(emptyLine());
  };

  const handleRemoveLine = (key: string) => {
    setLines((prev) => prev.filter((l) => l.key !== key));
  };

  const canSave = (() => {
    if (!templateName.trim() || !typeId) return false;
    if (needsParts === 'yes' && lines.length === 0) return false;
    if (billTo === 'external' && !accountId) return false;
    if (billTo === 'internal' && hasMiscCost === 'yes' && !(Number(cost) > 0)) return false;
    if (requiresApproval === 'yes' && approverIds.length === 0) return false;
    return true;
  })();

  const handleSave = async () => {
    if (!canSave) {
      toast.error('Fill in the required fields');
      return;
    }
    setIsSaving(true);
    try {
      const basePayload = {
        template_name: templateName.trim(),
        description: description.trim() || undefined,
        work_order_type_id: Number(typeId),
        priority,
        assigned_to: assignedTo.trim() || undefined,
        uses_inventory: needsParts === 'yes',
        account_id: billTo === 'external' ? Number(accountId) : undefined,
        cost: billTo === 'internal' && hasMiscCost === 'yes' ? Number(cost) : undefined,
        requires_approval: requiresApproval === 'yes',
        approver_user_ids: requiresApproval === 'yes' ? approverIds : [],
      };
      const lineItems = needsParts === 'yes'
        ? lines.map((l) => ({
            item_id: Number(l.itemId),
            quantity: Number(l.quantity),
            action_type: l.actionType,
            replaced_item_id: l.actionType === 'REPLACE' ? Number(l.replacedItemId) : undefined,
          }))
        : [];

      if (isEdit && template) {
        await updateTemplate({ id: template.id, data: basePayload }).unwrap();
        // Full-replace items: drop everything that was there, add back the current draft.
        await Promise.all(existingItems.map((ti) => removeTemplateItem({ tplId: template.id, itemId: ti.id }).unwrap()));
        for (const li of lineItems) {
          await addTemplateItem({ tplId: template.id, data: li }).unwrap();
        }
        toast.success('Template updated');
      } else {
        await createTemplate({ ...basePayload, items: lineItems }).unwrap();
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[88vh] w-[min(40rem,94vw)] max-w-none flex-col gap-0 overflow-hidden p-0 sm:max-w-none">
        <DialogHeader className="shrink-0 border-b border-border px-6 py-4">
          <DialogTitle>{isEdit ? 'Edit Template' : 'New Work Order Template'}</DialogTitle>
          <DialogDescription>Saved defaults for maintenance that happens all the time.</DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5 space-y-5">
          <div className="grid gap-1">
            <Label className="text-xs text-muted-foreground">Template name *</Label>
            <Input value={templateName} onChange={(e) => setTemplateName(e.target.value)} placeholder="e.g. Monthly Oil Change" />
          </div>

          <div className="grid gap-1">
            <Label className="text-xs text-muted-foreground">Work order type *</Label>
            {!isCreatingType ? (
              <div className="flex items-center gap-2">
                <Select value={typeId} onValueChange={setTypeId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a type..." />
                  </SelectTrigger>
                  <SelectContent>
                    {workOrderTypes.map((t) => (
                      <SelectItem key={t.id} value={String(t.id)}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button type="button" variant="outline" size="sm" className="shrink-0" onClick={() => setIsCreatingType(true)}>
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  New type
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Input autoFocus value={newTypeName} onChange={(e) => setNewTypeName(e.target.value)} placeholder="e.g. Oil Change" />
                <Button type="button" size="sm" disabled={!newTypeName.trim() || isCreatingTypeSaving} onClick={handleCreateType}>
                  {isCreatingTypeSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add'}
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => setIsCreatingType(false)}>
                  Cancel
                </Button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="grid gap-1">
              <Label className="text-xs text-muted-foreground">Priority</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as WorkOrderPriority)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {WORK_ORDER_PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p}>
                      {priorityLabel(p)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1">
              <Label className="text-xs text-muted-foreground">Default assignee (optional)</Label>
              <Input value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} placeholder="Name" />
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Parts</Label>
            <div className="flex gap-2">
              <Button type="button" variant={needsParts === 'no' ? 'default' : 'outline'} size="sm" onClick={() => setNeedsParts('no')}>
                No
              </Button>
              <Button type="button" variant={needsParts === 'yes' ? 'default' : 'outline'} size="sm" onClick={() => setNeedsParts('yes')}>
                Yes
              </Button>
            </div>

            {needsParts === 'yes' && (
              <div className="space-y-3">
                {lines.length > 0 && (
                  <div className="space-y-1.5 rounded-md border border-border">
                    {lines.map((line) => (
                      <div key={line.key} className="flex items-center justify-between gap-2 border-b border-border/60 px-3 py-2 last:border-b-0">
                        <div className="min-w-0 text-sm">
                          <span className="font-medium text-card-foreground">{itemName(line.itemId)}</span>
                          <span className="text-muted-foreground"> · {line.quantity} · {WORK_ORDER_ITEM_ACTION_OPTIONS.find((o) => o.value === line.actionType)?.label}</span>
                          {line.actionType === 'REPLACE' && line.replacedItemId && (
                            <span className="text-muted-foreground"> · replaces {itemName(line.replacedItemId)}</span>
                          )}
                        </div>
                        <Button type="button" variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => handleRemoveLine(line.key)}>
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="space-y-3 rounded-md border border-dashed border-border bg-muted/20 p-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">What will happen with this part?</Label>
                    <div className="flex flex-wrap gap-2">
                      {WORK_ORDER_ITEM_ACTION_OPTIONS.map((opt) => (
                        <Button
                          key={opt.value}
                          type="button"
                          variant={draftLine.actionType === opt.value ? 'default' : 'outline'}
                          size="sm"
                          className="bg-background"
                          onClick={() => setDraftLine((d) => ({ ...d, actionType: opt.value }))}
                        >
                          {opt.label}
                        </Button>
                      ))}
                    </div>
                    <p className="rounded-md bg-background px-2.5 py-2 text-xs text-muted-foreground">
                      {WORK_ORDER_ITEM_ACTION_EXPLAINER[draftLine.actionType]}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="grid gap-1">
                      <Label className="text-xs text-muted-foreground">{draftLine.actionType === 'REPLACE' ? 'New item' : 'Item'}</Label>
                      <Select value={draftLine.itemId} onValueChange={(v) => setDraftLine((d) => ({ ...d, itemId: v }))}>
                        <SelectTrigger className="bg-background">
                          <SelectValue placeholder="Select item..." />
                        </SelectTrigger>
                        <SelectContent>
                          {items.map((i) => (
                            <SelectItem key={i.id} value={String(i.id)}>
                              {i.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-1">
                      <Label className="text-xs text-muted-foreground">Quantity</Label>
                      <StepNumberInput min={0.01} step={1} value={draftLine.quantity} onChange={(e) => setDraftLine((d) => ({ ...d, quantity: e.target.value }))} />
                    </div>
                  </div>

                  {draftLine.actionType === 'REPLACE' && (
                    <div className="grid gap-1">
                      <Label className="text-xs text-muted-foreground">Item typically being replaced</Label>
                      <Select value={draftLine.replacedItemId} onValueChange={(v) => setDraftLine((d) => ({ ...d, replacedItemId: v }))}>
                        <SelectTrigger className="bg-background">
                          <SelectValue placeholder="Select item..." />
                        </SelectTrigger>
                        <SelectContent>
                          {items.map((i) => (
                            <SelectItem key={i.id} value={String(i.id)}>
                              {i.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <p className="text-xs text-muted-foreground">
                    Parts always come from whichever machine this template gets applied to — no need to pick a factory here.
                  </p>

                  <Button type="button" variant="outline" size="sm" className="w-full bg-background" disabled={!draftLineValid} onClick={handleAddLine}>
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Add part line
                  </Button>
                </div>
              </div>
            )}
          </div>

          <Separator />

          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Billing</Label>
            <div className="flex gap-2">
              <Button type="button" variant={billTo === 'internal' ? 'default' : 'outline'} size="sm" onClick={() => setBillTo('internal')}>
                Internal
              </Button>
              <Button type="button" variant={billTo === 'external' ? 'default' : 'outline'} size="sm" onClick={() => setBillTo('external')}>
                External account
              </Button>
            </div>
            {billTo === 'external' && (
              <Select value={accountId} onValueChange={setAccountId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select account..." />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((a) => (
                    <SelectItem key={a.id} value={String(a.id)}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {billTo === 'internal' && (
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Default miscellaneous cost?</Label>
                <div className="flex gap-2">
                  <Button type="button" variant={hasMiscCost === 'no' ? 'default' : 'outline'} size="sm" onClick={() => setHasMiscCost('no')}>
                    No
                  </Button>
                  <Button type="button" variant={hasMiscCost === 'yes' ? 'default' : 'outline'} size="sm" onClick={() => setHasMiscCost('yes')}>
                    Yes
                  </Button>
                </div>
                {hasMiscCost === 'yes' && (
                  <StepNumberInput min={0} step={1} value={cost} onChange={(e) => setCost(e.target.value)} placeholder="0.00" />
                )}
              </div>
            )}
          </div>

          <Separator />

          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Approval</Label>
            <div className="flex gap-2">
              <Button type="button" variant={requiresApproval === 'no' ? 'default' : 'outline'} size="sm" onClick={() => setRequiresApproval('no')}>
                No
              </Button>
              <Button type="button" variant={requiresApproval === 'yes' ? 'default' : 'outline'} size="sm" onClick={() => setRequiresApproval('yes')}>
                Yes
              </Button>
            </div>
            {requiresApproval === 'yes' && (
              <div className="space-y-1 rounded-md border border-border bg-muted/20 p-3">
                <Label className="text-xs text-muted-foreground">Default approvers</Label>
                {assignableMembers.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No workspace members available.</p>
                ) : (
                  <div className="max-h-40 space-y-1 overflow-y-auto">
                    {assignableMembers.map((m) => (
                      <label key={m.user_id} className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted/40 cursor-pointer">
                        <Checkbox checked={approverIds.includes(m.user_id)} onCheckedChange={() => toggleApprover(m.user_id)} />
                        <span className="truncate">
                          {m.user_name ?? `User #${m.user_id}`}
                          {m.user_position ? ` · ${m.user_position}` : ''}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <Separator />

          <div className="grid gap-1">
            <Label className="text-xs text-muted-foreground">Description (optional)</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="resize-none" />
          </div>
        </div>

        <DialogFooter className="shrink-0 border-t border-border px-6 py-4 gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button type="button" disabled={!canSave || isSaving} onClick={handleSave} className="bg-brand-primary hover:bg-brand-primary-hover">
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {isEdit ? 'Save changes' : 'Create template'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateEditWorkOrderTemplateDialog;
