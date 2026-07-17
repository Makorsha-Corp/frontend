import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { StepNumberInput } from '@/components/ui/step-number-input';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  useCreateWorkOrderMutation,
  useAddWorkOrderItemMutation,
  useAddWorkOrderApproverMutation,
} from '@/features/workOrders/workOrdersApi';
import { useGetWorkOrderTypesQuery, useCreateWorkOrderTypeMutation } from '@/features/workOrderTypes/workOrderTypesApi';
import {
  useGetWorkOrderTemplatesQuery,
  useGetWorkOrderTemplateItemsQuery,
  useGetWorkOrderTemplateApproversQuery,
  useCreateWorkOrderTemplateMutation,
} from '@/features/workOrderTemplates/workOrderTemplatesApi';
import { useGetFactorySectionsQuery } from '@/features/factorySections/factorySectionsApi';
import { useGetFactoriesQuery } from '@/features/factories/factoriesApi';
import { useGetItemsQuery } from '@/features/items/itemsApi';
import { useGetMachinesQuery } from '@/features/machines/machinesApi';
import { useGetMachineItemsQuery } from '@/features/machineItems/machineItemsApi';
import { useGetAccountsQuery } from '@/features/accounts/accountsApi';
import { useGetWorkspaceMembersQuery } from '@/features/workspaces/workspaceApi';
import { useAppSelector } from '@/app/hooks';
import { API_LIMITS } from '@/constants/apiLimits';
import type { Machine } from '@/types/machine';
import type { WorkOrderItemActionType, WorkOrderItemSourceType, WorkOrderPriority } from '@/types/workOrder';
import {
  WORK_ORDER_ITEM_ACTION_OPTIONS,
  WORK_ORDER_ITEM_ACTION_EXPLAINER,
  WORK_ORDER_PRIORITIES,
  priorityLabel,
} from '@/pages/newpages/orders/workOrderConstants';
import { Loader2, Plus, AlertTriangle, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import WorkOrderTemplateSelector from './WorkOrderTemplateSelector';
import ItemSelectorDialog, { type ItemSelection } from '@/components/newcomponents/customui/ItemSelectorDialog';
import { ItemSelectSummaryButton } from '@/components/newcomponents/customui/ItemSelectSummaryButton';

function formatItemDisplayLabel(selection: ItemSelection): string {
  const base = selection.itemUnit
    ? `${selection.itemName} (${selection.itemUnit})`
    : selection.itemName;
  if (selection.selectionSource === 'storage' && selection.availableQty != null) {
    return `${base} · ${selection.availableQty} on hand`;
  }
  return base;
}

export interface MaintenanceWizardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  machine: Machine;
  onCreated: (workOrderId: number) => void;
}

interface PartLineDraft {
  key: string;
  actionType: WorkOrderItemActionType;
  sourceType: WorkOrderItemSourceType | '';
  sourceId: string;
  itemId: string;
  quantity: string;
  replacedItemId: string;
}

const makeKey = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;

const MaintenanceWizardDialog: React.FC<MaintenanceWizardDialogProps> = ({
  open,
  onOpenChange,
  machine,
  onCreated,
}) => {
  // Template
  const [selectedTemplateId, setSelectedTemplateId] = useState('');

  // Type
  const [typeId, setTypeId] = useState('');
  const [isCreatingType, setIsCreatingType] = useState(false);
  const [newTypeName, setNewTypeName] = useState('');

  // Parts
  const [needsParts, setNeedsParts] = useState<'no' | 'yes'>('no');
  const [partLines, setPartLines] = useState<PartLineDraft[]>([]);
  const [draftLine, setDraftLine] = useState<PartLineDraft>({
    key: makeKey(), actionType: 'CONSUME', sourceType: 'storage', sourceId: '', itemId: '', quantity: '1', replacedItemId: '',
  });

  // Billing
  const [billTo, setBillTo] = useState<'external' | 'internal'>('internal');
  const [accountId, setAccountId] = useState('');
  const [hasMiscCost, setHasMiscCost] = useState<'no' | 'yes'>('no');
  const [cost, setCost] = useState('');

  // Approval
  const [needsApproval, setNeedsApproval] = useState<'no' | 'yes'>('no');
  const [approverIds, setApproverIds] = useState<number[]>([]);

  // Details
  const [priority, setPriority] = useState<WorkOrderPriority>('MEDIUM');
  const [description, setDescription] = useState('');
  const [assignedTo, setAssignedTo] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [itemPickerOpen, setItemPickerOpen] = useState(false);
  const [itemPickerTarget, setItemPickerTarget] = useState<'item' | 'replaced'>('item');
  const [itemLabels, setItemLabels] = useState<Record<string, string>>({});

  const { workspace } = useAppSelector((s) => s.auth);
  const { data: workOrderTypes = [] } = useGetWorkOrderTypesQuery({ skip: 0, limit: API_LIMITS.FLEXIBLE_1000 }, { skip: !open });
  const { data: workOrderTemplates = [] } = useGetWorkOrderTemplatesQuery({ skip: 0, limit: API_LIMITS.FLEXIBLE_1000, is_active: true }, { skip: !open });
  const { data: factorySections = [] } = useGetFactorySectionsQuery({ skip: 0, limit: API_LIMITS.FLEXIBLE_1000 }, { skip: !open });
  const { data: factories = [] } = useGetFactoriesQuery({ skip: 0, limit: API_LIMITS.FLEXIBLE_1000 }, { skip: !open });
  const { data: machines = [] } = useGetMachinesQuery({ skip: 0, limit: API_LIMITS.FLEXIBLE_1000 }, { skip: !open });
  const { data: items = [] } = useGetItemsQuery({ skip: 0, limit: API_LIMITS.STRICT_100 }, { skip: !open });
  const { data: machineItems = [] } = useGetMachineItemsQuery(
    { machine_id: machine.id, limit: API_LIMITS.FLEXIBLE_1000 },
    { skip: !open }
  );
  const { data: accounts = [] } = useGetAccountsQuery({ skip: 0, limit: API_LIMITS.ACCOUNTS_LIST_MAX }, { skip: !open || billTo !== 'external' });
  const { data: members = [] } = useGetWorkspaceMembersQuery(workspace?.id ?? 0, { skip: !open || !workspace?.id });
  const assignableMembers = members.filter((m) => m.status === 'active');

  const selectedTemplate = workOrderTemplates.find((t) => String(t.id) === selectedTemplateId);
  const { data: templateItems = [] } = useGetWorkOrderTemplateItemsQuery(
    Number(selectedTemplateId), { skip: !selectedTemplateId }
  );
  const { data: templateApprovers = [] } = useGetWorkOrderTemplateApproversQuery(
    Number(selectedTemplateId), { skip: !selectedTemplateId || !selectedTemplate?.requires_approval }
  );

  const machineFactoryId = factorySections.find((s) => s.id === machine.factory_section_id)?.factory_id ?? null;

  const itemSelectorFactoryId =
    draftLine.sourceType === 'storage' && draftLine.sourceId
      ? Number(draftLine.sourceId)
      : undefined;

  const itemPickerInitialTab =
    draftLine.sourceType === 'storage' && draftLine.sourceId ? ('storage' as const) : ('catalog' as const);

  const replacedItemOnHandQty = draftLine.replacedItemId
    ? machineItems.find((mi) => mi.item_id === Number(draftLine.replacedItemId))?.qty ?? 0
    : 0;
  const draftReplaceWillDegrade =
    draftLine.actionType === 'REPLACE' && Boolean(draftLine.replacedItemId) && Number(draftLine.quantity) > replacedItemOnHandQty;

  const [createType, { isLoading: isCreatingTypeSaving }] = useCreateWorkOrderTypeMutation();
  const [createOrder] = useCreateWorkOrderMutation();
  const [createTemplate] = useCreateWorkOrderTemplateMutation();
  const [addItem] = useAddWorkOrderItemMutation();
  const [addApprover] = useAddWorkOrderApproverMutation();

  const resetForm = () => {
    setSelectedTemplateId('');
    setTypeId('');
    setIsCreatingType(false);
    setNewTypeName('');
    setNeedsParts('no');
    setPartLines([]);
    setDraftLine({
      key: makeKey(), actionType: 'CONSUME', sourceType: 'storage',
      sourceId: machineFactoryId ? String(machineFactoryId) : '', itemId: '', quantity: '1', replacedItemId: '',
    });
    setBillTo('internal');
    setAccountId('');
    setHasMiscCost('no');
    setCost('');
    setNeedsApproval('no');
    setApproverIds([]);
    setPriority('MEDIUM');
    setDescription('');
    setAssignedTo('');
  };

  useEffect(() => {
    if (open) {
      resetForm();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Default the type to the first available one once types load, if nothing picked yet.
  useEffect(() => {
    if (!typeId && workOrderTypes.length > 0) {
      setTypeId(String(workOrderTypes[0].id));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workOrderTypes]);

  // Apply a selected template's saved defaults onto the form for review.
  useEffect(() => {
    if (!selectedTemplate) return;
    setTypeId(String(selectedTemplate.work_order_type_id));
    setPriority(selectedTemplate.priority);
    setNeedsParts(selectedTemplate.uses_inventory ? 'yes' : 'no');
    if (selectedTemplate.uses_inventory) {
      setPartLines(
        templateItems.map((ti) => ({
          key: `tpl-${ti.id}`,
          actionType: ti.action_type,
          sourceType: 'storage',
          sourceId: machineFactoryId ? String(machineFactoryId) : '',
          itemId: String(ti.item_id),
          quantity: String(ti.quantity),
          replacedItemId: ti.replaced_item_id ? String(ti.replaced_item_id) : '',
        }))
      );
    } else {
      setPartLines([]);
    }
    if (selectedTemplate.account_id) {
      setBillTo('external');
      setAccountId(String(selectedTemplate.account_id));
      setHasMiscCost('no');
      setCost('');
    } else if (selectedTemplate.cost) {
      setBillTo('internal');
      setHasMiscCost('yes');
      setCost(String(selectedTemplate.cost));
      setAccountId('');
    } else {
      setBillTo('internal');
      setHasMiscCost('no');
      setAccountId('');
      setCost('');
    }
    setNeedsApproval(selectedTemplate.requires_approval ? 'yes' : 'no');
    if (selectedTemplate.requires_approval) {
      setApproverIds(templateApprovers.map((a) => a.user_id));
    } else {
      setApproverIds([]);
    }
    setDescription(selectedTemplate.description ?? '');
    setAssignedTo(selectedTemplate.assigned_to ?? '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTemplate?.id, templateItems, templateApprovers]);

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

  const draftLineValid =
    Boolean(draftLine.itemId) &&
    Boolean(draftLine.sourceType) &&
    Boolean(draftLine.sourceId) &&
    Number(draftLine.quantity) > 0 &&
    (draftLine.actionType !== 'REPLACE' || Boolean(draftLine.replacedItemId));

  const handleAddLine = () => {
    if (!draftLineValid) {
      toast.error('Pick an item, quantity, source, and action for this part line');
      return;
    }
    setPartLines((prev) => [...prev, draftLine]);
    setDraftLine({
      key: makeKey(), actionType: 'CONSUME', sourceType: 'storage',
      sourceId: machineFactoryId ? String(machineFactoryId) : '', itemId: '', quantity: '1', replacedItemId: '',
    });
  };

  const handleRemoveLine = (key: string) => {
    setPartLines((prev) => prev.filter((l) => l.key !== key));
  };

  const itemName = (id: string) =>
    itemLabels[id] ??
    (() => {
      const item = items.find((i) => String(i.id) === id);
      return item ? (item.unit ? `${item.name} (${item.unit})` : item.name) : `Item #${id}`;
    })();

  const handleItemSelect = (selection: ItemSelection) => {
    const label = formatItemDisplayLabel(selection);
    const id = String(selection.itemId);
    setItemLabels((prev) => ({ ...prev, [id]: label }));
    if (itemPickerTarget === 'replaced') {
      setDraftLine((d) => ({ ...d, replacedItemId: id }));
    } else {
      setDraftLine((d) => ({ ...d, itemId: id }));
    }
  };

  const openItemPicker = (target: 'item' | 'replaced') => {
    setItemPickerTarget(target);
    setItemPickerOpen(true);
  };

  const canSubmit = (() => {
    if (!typeId) return false;
    if (needsParts === 'yes' && partLines.length === 0) return false;
    if (billTo === 'external' && !accountId) return false;
    if (billTo === 'internal' && hasMiscCost === 'yes' && !(Number(cost) > 0)) return false;
    if (needsApproval === 'yes' && approverIds.length === 0) return false;
    return true;
  })();

  const handleSaveTemplate = async (name: string) => {
    if (!typeId) {
      toast.error('Pick work order type first');
      throw new Error('missing type');
    }
    await createTemplate({
      template_name: name.trim(),
      work_order_type_id: Number(typeId),
      priority,
      assigned_to: assignedTo.trim() || undefined,
      uses_inventory: needsParts === 'yes',
      account_id: billTo === 'external' ? Number(accountId) : undefined,
      cost: billTo === 'internal' && hasMiscCost === 'yes' ? Number(cost) : undefined,
      requires_approval: needsApproval === 'yes',
      approver_user_ids: needsApproval === 'yes' ? approverIds : undefined,
      description: description.trim() || undefined,
      default_factory_section_id: machine.factory_section_id,
      default_machine_id: machine.id,
      items:
        needsParts === 'yes' && partLines.length > 0
          ? partLines.map((l) => ({
              item_id: Number(l.itemId),
              quantity: Number(l.quantity),
              action_type: l.actionType,
              replaced_item_id: l.actionType === 'REPLACE' ? Number(l.replacedItemId) : undefined,
            }))
          : undefined,
    }).unwrap();
    toast.success('Template saved');
  };

  const handleSubmit = async () => {
    if (!machineFactoryId) {
      toast.error("Could not resolve this machine's factory");
      return;
    }
    if (!canSubmit) {
      toast.error('Fill in the required fields before creating this work order');
      return;
    }
    const typeName = workOrderTypes.find((t) => String(t.id) === typeId)?.name ?? 'Maintenance';
    setIsSubmitting(true);
    try {
      const wo = await createOrder({
        work_order_type_id: Number(typeId),
        title: `${typeName} — ${machine.name}`,
        priority,
        factory_id: machineFactoryId,
        machine_id: machine.id,
        uses_inventory: needsParts === 'yes',
        description: description.trim() || undefined,
        assigned_to: assignedTo.trim() || undefined,
        account_id: billTo === 'external' ? Number(accountId) : undefined,
        cost: billTo === 'internal' && hasMiscCost === 'yes' ? Number(cost) : undefined,
      }).unwrap();

      if (needsParts === 'yes' && partLines.length > 0) {
        for (const line of partLines) {
          await addItem({
            woId: wo.id,
            data: {
              item_id: Number(line.itemId),
              quantity: Number(line.quantity),
              uses_inventory: true,
              source_location_type: line.sourceType as WorkOrderItemSourceType,
              source_location_id: Number(line.sourceId),
              action_type: line.actionType,
              replaced_item_id: line.actionType === 'REPLACE' ? Number(line.replacedItemId) : undefined,
            },
          }).unwrap();
        }
      }

      if (needsApproval === 'yes' && approverIds.length > 0) {
        await Promise.all(approverIds.map((userId) => addApprover({ woId: wo.id, user_id: userId }).unwrap()));
      }

      toast.success('Work order created');
      onOpenChange(false);
      onCreated(wo.id);
    } catch (err: unknown) {
      const e = err as { data?: { detail?: string } };
      toast.error(e?.data?.detail || 'Failed to create work order');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[88vh] w-[min(42rem,94vw)] max-w-none flex-col gap-0 overflow-hidden p-0 sm:max-w-none">
        <DialogHeader className="shrink-0 border-b border-border px-6 py-4">
          <DialogTitle>Maintenance — {machine.name}</DialogTitle>
          <DialogDescription>Fill in what applies — everything below defaults to the simplest option.</DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5 space-y-6">
          <WorkOrderTemplateSelector
            label="Start from a template"
            value={selectedTemplateId}
            onValueChange={(v) => setSelectedTemplateId(v === '__none__' ? '' : v)}
            templates={workOrderTemplates}
            showHint
            dialogTitle="Start from a template"
            dialogDescription="Pick a preset to prefill this form, or save your current fields as a template."
            onSaveFromForm={handleSaveTemplate}
            canSaveFromForm={Boolean(typeId)}
            defaultSectionId={machine.factory_section_id}
            defaultMachineId={machine.id}
            machines={machines}
            sections={factorySections}
          />

          <Separator />

          {/* Type */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">What type of work order is this?</Label>
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
                <Input
                  autoFocus
                  value={newTypeName}
                  onChange={(e) => setNewTypeName(e.target.value)}
                  placeholder="e.g. Oil Change"
                />
                <Button type="button" size="sm" disabled={!newTypeName.trim() || isCreatingTypeSaving} onClick={handleCreateType}>
                  {isCreatingTypeSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add'}
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => setIsCreatingType(false)}>
                  Cancel
                </Button>
              </div>
            )}
          </div>

          <Separator />

          {/* Parts */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Will this require any parts?</Label>
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
                {partLines.length > 0 && (
                  <div className="space-y-1.5 rounded-md border border-border">
                    {partLines.map((line) => (
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
                          className={
                            draftLine.actionType === opt.value
                              ? 'bg-brand-primary hover:bg-brand-primary-hover'
                              : undefined
                          }
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
                      <Label className="text-xs text-muted-foreground">Source</Label>
                      <Select
                        value={draftLine.sourceType}
                        onValueChange={(v) =>
                          setDraftLine((d) => ({ ...d, sourceType: v as WorkOrderItemSourceType, sourceId: '' }))
                        }
                      >
                        <SelectTrigger className="bg-background">
                          <SelectValue placeholder="Storage or machine..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="storage">Factory storage</SelectItem>
                          <SelectItem value="machine">Another machine's stock</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-1">
                      <Label className="text-xs text-muted-foreground">
                        {draftLine.sourceType === 'machine' ? 'Machine' : 'Factory'}
                      </Label>
                      <Select
                        value={draftLine.sourceId}
                        onValueChange={(v) => setDraftLine((d) => ({ ...d, sourceId: v }))}
                        disabled={!draftLine.sourceType}
                      >
                        <SelectTrigger className="bg-background">
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        <SelectContent>
                          {draftLine.sourceType === 'machine'
                            ? machines.filter((m) => m.id !== machine.id).map((m) => (
                                <SelectItem key={m.id} value={String(m.id)}>
                                  {m.name}
                                </SelectItem>
                              ))
                            : factories.map((f) => (
                                <SelectItem key={f.id} value={String(f.id)}>
                                  {f.name}
                                </SelectItem>
                              ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="grid gap-1">
                      <Label className="text-xs text-muted-foreground">
                        {draftLine.actionType === 'REPLACE' ? 'New item' : 'Item'}
                      </Label>
                      <ItemSelectSummaryButton
                        ariaLabel={draftLine.actionType === 'REPLACE' ? 'Select new item' : 'Select item'}
                        selectedLabel={draftLine.itemId ? itemName(draftLine.itemId) : null}
                        staleNumericId={draftLine.itemId || null}
                        compactLabel
                        onClick={() => openItemPicker('item')}
                      />
                    </div>
                    <div className="grid gap-1">
                      <Label className="text-xs text-muted-foreground">Quantity</Label>
                      <StepNumberInput
                        min={0.01}
                        step={1}
                        value={draftLine.quantity}
                        onChange={(e) => setDraftLine((d) => ({ ...d, quantity: e.target.value }))}
                      />
                    </div>
                  </div>

                  {draftLine.actionType === 'REPLACE' && (
                    <div className="grid gap-1">
                      <Label className="text-xs text-muted-foreground">Item being replaced (currently on this machine)</Label>
                      <ItemSelectSummaryButton
                        ariaLabel="Select item being replaced"
                        selectedLabel={draftLine.replacedItemId ? itemName(draftLine.replacedItemId) : null}
                        staleNumericId={draftLine.replacedItemId || null}
                        onClick={() => openItemPicker('replaced')}
                      />
                      {draftLine.replacedItemId && (
                        <p className="text-xs text-muted-foreground">Currently on this machine: {replacedItemOnHandQty}</p>
                      )}
                      {draftReplaceWillDegrade && (
                        <p className="flex items-start gap-1.5 rounded-md bg-amber-500/10 px-2.5 py-2 text-xs text-amber-700 dark:text-amber-400">
                          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                          The machine only shows {replacedItemOnHandQty} on hand — with fewer than {draftLine.quantity}, this
                          will just install the new part without removing anything.
                        </p>
                      )}
                    </div>
                  )}

                  <Button type="button" variant="outline" size="sm" className="w-full bg-background" disabled={!draftLineValid} onClick={handleAddLine}>
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Add part line
                  </Button>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Billing */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Will this be billed to an external account?</Label>
            <div className="flex gap-2">
              <Button type="button" variant={billTo === 'internal' ? 'default' : 'outline'} size="sm" onClick={() => setBillTo('internal')}>
                No — internal
              </Button>
              <Button type="button" variant={billTo === 'external' ? 'default' : 'outline'} size="sm" onClick={() => setBillTo('external')}>
                Yes — external account
              </Button>
            </div>
            {billTo === 'external' && (
              <div className="grid gap-1">
                <Label className="text-xs text-muted-foreground">Account</Label>
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
              </div>
            )}
            {billTo === 'internal' && (
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Does this incur any miscellaneous cost?</Label>
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

          {/* Approval */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Does this require approval before work can start?</Label>
            <div className="flex gap-2">
              <Button type="button" variant={needsApproval === 'no' ? 'default' : 'outline'} size="sm" onClick={() => setNeedsApproval('no')}>
                No
              </Button>
              <Button type="button" variant={needsApproval === 'yes' ? 'default' : 'outline'} size="sm" onClick={() => setNeedsApproval('yes')}>
                Yes
              </Button>
            </div>
            {needsApproval === 'yes' && (
              <div className="space-y-1 rounded-md border border-border bg-muted/20 p-3">
                <Label className="text-xs text-muted-foreground">Who should approve this?</Label>
                {assignableMembers.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No workspace members available.</p>
                ) : (
                  <div className="max-h-40 space-y-1 overflow-y-auto">
                    {assignableMembers.map((m) => (
                      <label
                        key={m.user_id}
                        className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted/40 cursor-pointer"
                      >
                        <Checkbox
                          checked={approverIds.includes(m.user_id)}
                          onCheckedChange={() => toggleApprover(m.user_id)}
                        />
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

          {/* Details */}
          <div className="space-y-3">
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Details</Label>
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
              <Label className="text-xs text-muted-foreground">Description (optional)</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="resize-none" />
            </div>
            <div className="grid gap-1">
              <Label className="text-xs text-muted-foreground">Assign to (optional)</Label>
              <Input value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} placeholder="Name" />
            </div>
          </div>
        </div>

        <DialogFooter className="shrink-0 flex-row items-center justify-end gap-2 border-t border-border px-6 py-4">
          <Button type="button" disabled={!canSubmit || isSubmitting} onClick={handleSubmit} className="bg-brand-primary hover:bg-brand-primary-hover">
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Create work order
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

      <ItemSelectorDialog
        open={itemPickerOpen}
        onOpenChange={setItemPickerOpen}
        onSelect={handleItemSelect}
        factoryId={itemSelectorFactoryId}
        initialTab={itemPickerInitialTab}
        selectedItemId={
          itemPickerTarget === 'replaced'
            ? draftLine.replacedItemId
              ? Number(draftLine.replacedItemId)
              : undefined
            : draftLine.itemId
              ? Number(draftLine.itemId)
              : undefined
        }
        title={itemPickerTarget === 'replaced' ? 'Select item being replaced' : 'Select item'}
      />
    </>
  );
};

export default MaintenanceWizardDialog;
