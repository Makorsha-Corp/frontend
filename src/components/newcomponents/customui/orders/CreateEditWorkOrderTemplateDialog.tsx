import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import type { Machine } from '@/types/machine';
import type { FactorySection } from '@/types/factorySection';
import type { WorkOrderItemActionType, WorkOrderPriority } from '@/types/workOrder';
import {
  WORK_ORDER_ITEM_ACTION_OPTIONS,
  WORK_ORDER_ITEM_ACTION_EXPLAINER,
  WORK_ORDER_PRIORITIES,
  priorityLabel,
} from '@/pages/newpages/orders/workOrderConstants';
import { cn } from '@/lib/utils';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import ItemSelectorDialog, { type ItemSelection } from '@/components/newcomponents/customui/ItemSelectorDialog';
import { ItemSelectSummaryButton } from '@/components/newcomponents/customui/ItemSelectSummaryButton';
import { resolveFactoryIdFromWorkOrderContext } from '@/components/newcomponents/customui/itemSelectorUtils';
import { useGlobalFactory } from '@/hooks/useGlobalFactoryContext';
import { scrollToHighlightTarget } from '@/utils/poScrollHighlight';

type TemplateSaveBlockReason = 'name' | 'type' | 'addPartLine' | 'account' | 'cost' | 'approvers';

const TEMPLATE_HIGHLIGHT_IDS: Record<TemplateSaveBlockReason, string> = {
  name: 'wot-template-name',
  type: 'wot-template-type',
  addPartLine: 'wot-template-add-part-line',
  account: 'wot-template-account',
  cost: 'wot-template-cost',
  approvers: 'wot-template-approvers',
};

function getTemplateSaveBlockReason(args: {
  templateName: string;
  typeId: string;
  needsParts: 'no' | 'yes';
  linesCount: number;
  billTo: 'external' | 'internal';
  accountId: string;
  hasMiscCost: 'no' | 'yes';
  cost: string;
  requiresApproval: 'no' | 'yes';
  approverIds: number[];
}): TemplateSaveBlockReason | null {
  if (!args.templateName.trim()) return 'name';
  if (!args.typeId) return 'type';
  if (args.needsParts === 'yes' && args.linesCount === 0) return 'addPartLine';
  if (args.billTo === 'external' && !args.accountId) return 'account';
  if (args.billTo === 'internal' && args.hasMiscCost === 'yes' && !(Number(args.cost) > 0)) return 'cost';
  if (args.requiresApproval === 'yes' && args.approverIds.length === 0) return 'approvers';
  return null;
}

function templateSaveBlockMessage(reason: TemplateSaveBlockReason): string {
  switch (reason) {
    case 'name':
      return 'Enter a template name';
    case 'type':
      return 'Select a work order type';
    case 'addPartLine':
      return 'Add at least one part line';
    case 'account':
      return 'Select an external account';
    case 'cost':
      return 'Enter a miscellaneous cost amount';
    case 'approvers':
      return 'Select at least one default approver';
  }
}

function formatItemDisplayLabel(selection: ItemSelection): string {
  const base = selection.itemUnit
    ? `${selection.itemName} (${selection.itemUnit})`
    : selection.itemName;
  if (selection.selectionSource === 'storage' && selection.availableQty != null) {
    return `${base} · ${selection.availableQty} on hand`;
  }
  return base;
}

export interface CreateEditWorkOrderTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template?: WorkOrderTemplate | null;
  defaultSectionId?: number | null;
  defaultMachineId?: number | null;
  machines?: Machine[];
  sections?: FactorySection[];
}

interface TemplateLineDraft {
  key: string;
  itemId: string;
  quantity: string;
  actionType: WorkOrderItemActionType;
  replacedItemId: string;
}

const makeKey = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;
const emptyLine = (): TemplateLineDraft => ({
  key: makeKey(),
  itemId: '',
  quantity: '1',
  actionType: 'CONSUME',
  replacedItemId: '',
});

const CreateEditWorkOrderTemplateDialog: React.FC<CreateEditWorkOrderTemplateDialogProps> = ({
  open,
  onOpenChange,
  template = null,
  defaultSectionId,
  defaultMachineId,
  machines = [],
  sections = [],
}) => {
  const isEdit = Boolean(template);

  const [templateName, setTemplateName] = useState('');
  const [typeId, setTypeId] = useState('');
  const [isCreatingType, setIsCreatingType] = useState(false);
  const [newTypeName, setNewTypeName] = useState('');
  const [priority, setPriority] = useState<WorkOrderPriority>('MEDIUM');
  const [assignedTo, setAssignedTo] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [machineId, setMachineId] = useState('');

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
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceType, setRecurrenceType] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [recurrenceDay, setRecurrenceDay] = useState('1');
  const [nextGenerationDate, setNextGenerationDate] = useState('');
  const [autoGenerate, setAutoGenerate] = useState(false);
  const [generationMode, setGenerationMode] = useState<'schedule' | 'draft'>('schedule');
  const [isSaving, setIsSaving] = useState(false);
  const [itemPickerOpen, setItemPickerOpen] = useState(false);
  const [itemPickerTarget, setItemPickerTarget] = useState<'item' | 'replaced'>('item');
  const [itemLabels, setItemLabels] = useState<Record<string, string>>({});
  const [highlightTarget, setHighlightTarget] = useState<TemplateSaveBlockReason | null>(null);
  const [saveHintOpen, setSaveHintOpen] = useState(false);
  const rightColumnRef = useRef<HTMLDivElement>(null);
  const highlightGenerationRef = useRef(0);

  const globalFactory = useGlobalFactory();
  const { workspace } = useAppSelector((s) => s.auth);
  const { data: workOrderTypes = [] } = useGetWorkOrderTypesQuery(
    { skip: 0, limit: API_LIMITS.FLEXIBLE_1000 },
    { skip: !open },
  );
  const { data: items = [] } = useGetItemsQuery({ skip: 0, limit: API_LIMITS.STRICT_100 }, { skip: !open });
  const { data: accounts = [] } = useGetAccountsQuery(
    { skip: 0, limit: API_LIMITS.ACCOUNTS_LIST_MAX },
    { skip: !open || billTo !== 'external' },
  );
  const { data: members = [] } = useGetWorkspaceMembersQuery(workspace?.id ?? 0, { skip: !open || !workspace?.id });
  const assignableMembers = members.filter((m) => m.status === 'active');

  const { data: existingItems = [] } = useGetWorkOrderTemplateItemsQuery(template?.id ?? 0, {
    skip: !open || !template,
  });
  const { data: existingApprovers = [] } = useGetWorkOrderTemplateApproversQuery(template?.id ?? 0, {
    skip: !open || !template,
  });

  const [createType, { isLoading: isCreatingTypeSaving }] = useCreateWorkOrderTypeMutation();
  const [createTemplate] = useCreateWorkOrderTemplateMutation();
  const [updateTemplate] = useUpdateWorkOrderTemplateMutation();
  const [addTemplateItem] = useAddWorkOrderTemplateItemMutation();
  const [removeTemplateItem] = useRemoveWorkOrderTemplateItemMutation();

  const machinesInSection = useMemo(() => {
    if (!sectionId) return machines;
    return machines.filter((m) => m.factory_section_id === Number(sectionId));
  }, [machines, sectionId]);

  useEffect(() => {
    if (!open) {
      setHighlightTarget(null);
      setSaveHintOpen(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;

    if (template) {
      setTemplateName(template.template_name);
      setTypeId(String(template.work_order_type_id));
      setPriority(template.priority);
      setAssignedTo(template.assigned_to ?? '');
      setSectionId(template.default_factory_section_id ? String(template.default_factory_section_id) : '');
      setMachineId(template.default_machine_id ? String(template.default_machine_id) : '');
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
      setIsRecurring(template.is_recurring);
      setRecurrenceType((template.recurrence_type as 'daily' | 'weekly' | 'monthly') || 'weekly');
      setRecurrenceDay(template.recurrence_day != null ? String(template.recurrence_day) : '1');
      setNextGenerationDate(template.next_generation_date?.slice(0, 10) ?? '');
      setAutoGenerate(template.auto_generate);
      setGenerationMode(template.generation_mode ?? 'schedule');
    } else {
      setTemplateName('');
      setTypeId('');
      setPriority('MEDIUM');
      setAssignedTo('');
      setSectionId(defaultSectionId ? String(defaultSectionId) : '');
      setMachineId(defaultMachineId ? String(defaultMachineId) : '');
      setNeedsParts('no');
      setLines([]);
      setBillTo('internal');
      setAccountId('');
      setHasMiscCost('no');
      setCost('');
      setRequiresApproval('no');
      setApproverIds([]);
      setDescription('');
      setIsRecurring(false);
      setRecurrenceType('weekly');
      setRecurrenceDay('1');
      setNextGenerationDate('');
      setAutoGenerate(false);
      setGenerationMode('schedule');
    }
    setDraftLine(emptyLine());
    setIsCreatingType(false);
    setNewTypeName('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, template?.id, defaultSectionId, defaultMachineId]);

  useEffect(() => {
    if (!open || isEdit || workOrderTypes.length === 0) return;
    setTypeId((prev) => prev || String(workOrderTypes[0].id));
  }, [open, isEdit, workOrderTypes]);

  useEffect(() => {
    if (!template) return;
    setLines(
      existingItems.map((ti) => ({
        key: `existing-${ti.id}`,
        itemId: String(ti.item_id),
        quantity: String(ti.quantity),
        actionType: ti.action_type,
        replacedItemId: ti.replaced_item_id ? String(ti.replaced_item_id) : '',
      })),
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
      toast.success('Work order type added');
    } catch (err: unknown) {
      const e = err as { data?: { detail?: string } };
      toast.error(e?.data?.detail || 'Failed to create work order type');
    }
  };

  const itemSelectorFactoryId =
    sectionId || machineId
      ? resolveFactoryIdFromWorkOrderContext({
          machineId,
          sectionId,
          machines,
          sections,
          globalFactoryId: globalFactory?.id,
        })
      : undefined;

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

  const draftLineValid =
    Boolean(draftLine.itemId) &&
    Number(draftLine.quantity) > 0 &&
    (draftLine.actionType !== 'REPLACE' || Boolean(draftLine.replacedItemId));

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

  const saveBlockReason = useMemo(
    () =>
      getTemplateSaveBlockReason({
        templateName,
        typeId,
        needsParts,
        linesCount: lines.length,
        billTo,
        accountId,
        hasMiscCost,
        cost,
        requiresApproval,
        approverIds,
      }),
    [
      templateName,
      typeId,
      needsParts,
      lines.length,
      billTo,
      accountId,
      hasMiscCost,
      cost,
      requiresApproval,
      approverIds,
    ],
  );

  const canSave = saveBlockReason === null;

  const pulseSaveHighlight = useCallback((reason: TemplateSaveBlockReason) => {
    const generation = ++highlightGenerationRef.current;
    const element = document.getElementById(TEMPLATE_HIGHLIGHT_IDS[reason]);
    const container =
      reason === 'name' || reason === 'type' ? null : rightColumnRef.current;

    setHighlightTarget(null);
    setSaveHintOpen(true);

    void scrollToHighlightTarget({
      container,
      element,
      onScrollStart: () => {},
      onScrollEnd: () => {
        if (generation !== highlightGenerationRef.current) return;
        setHighlightTarget(reason);
      },
    });
  }, []);

  useEffect(() => {
    if (!highlightTarget) return;
    const timer = window.setTimeout(() => setHighlightTarget(null), 3500);
    return () => window.clearTimeout(timer);
  }, [highlightTarget]);

  useEffect(() => {
    if (canSave) {
      setHighlightTarget(null);
      setSaveHintOpen(false);
    }
  }, [canSave]);

  useEffect(() => {
    if (!saveHintOpen) return;
    const dismiss = (e: PointerEvent) => {
      if (!(e.target as Element).closest('[data-wot-save-hint-root]')) {
        setSaveHintOpen(false);
      }
    };
    document.addEventListener('pointerdown', dismiss);
    return () => document.removeEventListener('pointerdown', dismiss);
  }, [saveHintOpen]);

  const highlightClass = (target: TemplateSaveBlockReason) =>
    cn('rounded-md transition-shadow', highlightTarget === target && 'po-scroll-target-highlight');

  const handleSave = async () => {
    if (saveBlockReason) {
      pulseSaveHighlight(saveBlockReason);
      toast.error(templateSaveBlockMessage(saveBlockReason));
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
        default_factory_section_id: sectionId ? Number(sectionId) : undefined,
        default_machine_id: machineId ? Number(machineId) : undefined,
        is_recurring: isRecurring,
        recurrence_type: isRecurring ? recurrenceType : null,
        recurrence_day: isRecurring ? Number(recurrenceDay) || null : null,
        next_generation_date: isRecurring && nextGenerationDate ? nextGenerationDate : null,
        auto_generate: isRecurring ? autoGenerate : false,
        generation_mode: isRecurring ? generationMode : 'schedule',
      };
      const lineItems =
        needsParts === 'yes'
          ? lines.map((l) => ({
              item_id: Number(l.itemId),
              quantity: Number(l.quantity),
              action_type: l.actionType,
              replaced_item_id: l.actionType === 'REPLACE' ? Number(l.replacedItemId) : undefined,
            }))
          : [];

      if (isEdit && template) {
        await updateTemplate({ id: template.id, data: basePayload }).unwrap();
        await Promise.all(
          existingItems.map((ti) => removeTemplateItem({ tplId: template.id, itemId: ti.id }).unwrap()),
        );
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

  const yesNoChipClass = (selected: boolean) =>
    cn(selected && 'bg-brand-primary hover:bg-brand-primary-hover');

  const basicsSection = (
    <div className="space-y-3 p-0.5">
      <div id={TEMPLATE_HIGHLIGHT_IDS.name} className={cn('grid gap-1 p-0.5', highlightClass('name'))}>
        <Label className="text-xs text-muted-foreground">Template name *</Label>
        <Input
          value={templateName}
          onChange={(e) => setTemplateName(e.target.value)}
          placeholder="e.g. Monthly Oil Change"
        />
      </div>

      <div id={TEMPLATE_HIGHLIGHT_IDS.type} className={cn('grid gap-1 p-0.5', highlightClass('type'))}>
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
            <Input
              autoFocus
              value={newTypeName}
              onChange={(e) => setNewTypeName(e.target.value)}
              placeholder="e.g. Oil Change"
            />
            <Button type="button" size="sm" disabled={!newTypeName.trim() || isCreatingTypeSaving} onClick={() => void handleCreateType()}>
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

      {(sections.length > 0 || machines.length > 0) && (
        <div className="grid grid-cols-2 gap-2">
          {sections.length > 0 && (
            <div className="grid gap-1">
              <Label className="text-xs text-muted-foreground">Default section</Label>
              <Select
                value={sectionId || '__none__'}
                onValueChange={(v) => {
                  const next = v === '__none__' ? '' : v;
                  setSectionId(next);
                  if (next && machineId) {
                    const mid = Number(machineId);
                    const m = machines.find((x) => x.id === mid);
                    if (m && m.factory_section_id !== Number(next)) setMachineId('');
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Optional" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {sections.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {machines.length > 0 && (
            <div className="grid gap-1">
              <Label className="text-xs text-muted-foreground">Default machine</Label>
              <Select value={machineId || '__none__'} onValueChange={(v) => setMachineId(v === '__none__' ? '' : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Optional" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {machinesInSection.map((m) => (
                    <SelectItem key={m.id} value={String(m.id)}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      )}
    </div>
  );

  const partsSection = (
    <div className="space-y-2">
      <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Parts</Label>
      <div className="flex gap-2">
        <Button
          type="button"
          variant={needsParts === 'no' ? 'default' : 'outline'}
          size="sm"
          className={yesNoChipClass(needsParts === 'no')}
          onClick={() => setNeedsParts('no')}
        >
          No
        </Button>
        <Button
          type="button"
          variant={needsParts === 'yes' ? 'default' : 'outline'}
          size="sm"
          className={yesNoChipClass(needsParts === 'yes')}
          onClick={() => setNeedsParts('yes')}
        >
          Yes
        </Button>
      </div>

      {needsParts === 'yes' && (
        <div className="space-y-3">
          {lines.length > 0 && (
            <div className="space-y-1.5 rounded-md border border-border">
              {lines.map((line) => (
                <div
                  key={line.key}
                  className="flex items-center justify-between gap-2 border-b border-border/60 px-3 py-2 last:border-b-0"
                >
                  <div className="min-w-0 text-sm">
                    <span className="font-medium text-card-foreground">{itemName(line.itemId)}</span>
                    <span className="text-muted-foreground">
                      {' '}
                      · {line.quantity} · {WORK_ORDER_ITEM_ACTION_OPTIONS.find((o) => o.value === line.actionType)?.label}
                    </span>
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
              <TooltipProvider delayDuration={200}>
                <div className="flex flex-wrap gap-2">
                  {WORK_ORDER_ITEM_ACTION_OPTIONS.map((opt) => (
                    <Tooltip key={opt.value}>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant={draftLine.actionType === opt.value ? 'default' : 'outline'}
                          size="sm"
                          className={yesNoChipClass(draftLine.actionType === opt.value)}
                          onClick={() => setDraftLine((d) => ({ ...d, actionType: opt.value }))}
                        >
                          {opt.label}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="max-w-[18rem] text-xs leading-relaxed">
                        {WORK_ORDER_ITEM_ACTION_EXPLAINER[opt.value]}
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              </TooltipProvider>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="grid gap-1">
                <Label className="text-xs text-muted-foreground">{draftLine.actionType === 'REPLACE' ? 'New item' : 'Item'}</Label>
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
                <Label className="text-xs text-muted-foreground">Item typically being replaced</Label>
                <ItemSelectSummaryButton
                  ariaLabel="Select item being replaced"
                  selectedLabel={draftLine.replacedItemId ? itemName(draftLine.replacedItemId) : null}
                  staleNumericId={draftLine.replacedItemId || null}
                  onClick={() => openItemPicker('replaced')}
                />
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              Parts pull from the machine this template is applied to.
            </p>

            <Button
              type="button"
              variant="outline"
              size="sm"
              id={TEMPLATE_HIGHLIGHT_IDS.addPartLine}
              className={cn('w-full bg-background', highlightClass('addPartLine'))}
              disabled={!draftLineValid}
              onClick={handleAddLine}
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Add part line
            </Button>
          </div>
        </div>
      )}
    </div>
  );

  const billingSection = (
    <div className="space-y-2">
      <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Billing</Label>
      <div className="flex gap-2">
        <Button
          type="button"
          variant={billTo === 'internal' ? 'default' : 'outline'}
          size="sm"
          className={yesNoChipClass(billTo === 'internal')}
          onClick={() => setBillTo('internal')}
        >
          Internal
        </Button>
        <Button
          type="button"
          variant={billTo === 'external' ? 'default' : 'outline'}
          size="sm"
          className={yesNoChipClass(billTo === 'external')}
          onClick={() => setBillTo('external')}
        >
          External account
        </Button>
      </div>
      {billTo === 'external' && (
        <div id={TEMPLATE_HIGHLIGHT_IDS.account} className={cn('p-0.5', highlightClass('account'))}>
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
          <Label className="text-xs text-muted-foreground">Default miscellaneous cost?</Label>
          <div className="flex gap-2">
            <Button
              type="button"
              variant={hasMiscCost === 'no' ? 'default' : 'outline'}
              size="sm"
              className={yesNoChipClass(hasMiscCost === 'no')}
              onClick={() => setHasMiscCost('no')}
            >
              No
            </Button>
            <Button
              type="button"
              variant={hasMiscCost === 'yes' ? 'default' : 'outline'}
              size="sm"
              className={yesNoChipClass(hasMiscCost === 'yes')}
              onClick={() => setHasMiscCost('yes')}
            >
              Yes
            </Button>
          </div>
          {hasMiscCost === 'yes' && (
            <div id={TEMPLATE_HIGHLIGHT_IDS.cost} className={cn('p-0.5', highlightClass('cost'))}>
              <StepNumberInput min={0} step={1} value={cost} onChange={(e) => setCost(e.target.value)} placeholder="0.00" />
            </div>
          )}
        </div>
      )}
    </div>
  );

  const approvalSection = (
    <div className="space-y-2">
      <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Approval</Label>
      <div className="flex gap-2">
        <Button
          type="button"
          variant={requiresApproval === 'no' ? 'default' : 'outline'}
          size="sm"
          className={yesNoChipClass(requiresApproval === 'no')}
          onClick={() => setRequiresApproval('no')}
        >
          No
        </Button>
        <Button
          type="button"
          variant={requiresApproval === 'yes' ? 'default' : 'outline'}
          size="sm"
          className={yesNoChipClass(requiresApproval === 'yes')}
          onClick={() => setRequiresApproval('yes')}
        >
          Yes
        </Button>
      </div>
      {requiresApproval === 'yes' && (
        <div
          id={TEMPLATE_HIGHLIGHT_IDS.approvers}
          className={cn('space-y-1 rounded-md border border-border bg-muted/20 p-3', highlightClass('approvers'))}
        >
          <Label className="text-xs text-muted-foreground">Default approvers</Label>
          {assignableMembers.length === 0 ? (
            <p className="text-sm text-muted-foreground">No workspace members available.</p>
          ) : (
            <div className="max-h-40 space-y-1 overflow-y-auto">
              {assignableMembers.map((m) => (
                <label
                  key={m.user_id}
                  className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted/40"
                >
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
  );

  const descriptionSection = (
    <div className="grid gap-1 p-0.5">
      <Label className="text-xs text-muted-foreground">Description (optional)</Label>
      <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="resize-none" />
    </div>
  );

  const recurrenceDayLabel =
    recurrenceType === 'weekly' ? 'Day of week (0=Mon … 6=Sun)' : 'Day of month (1–31)';

  const recurrenceSection = (
    <div className="space-y-2">
      <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Recurrence</Label>
      <div className="flex gap-2">
        <Button
          type="button"
          variant={!isRecurring ? 'default' : 'outline'}
          size="sm"
          className={yesNoChipClass(!isRecurring)}
          onClick={() => setIsRecurring(false)}
        >
          One-off
        </Button>
        <Button
          type="button"
          variant={isRecurring ? 'default' : 'outline'}
          size="sm"
          className={yesNoChipClass(isRecurring)}
          onClick={() => setIsRecurring(true)}
        >
          Recurring
        </Button>
      </div>

      {isRecurring ? (
        <div className="space-y-3 rounded-md border border-border bg-muted/20 p-3">
          <div className="grid gap-1">
            <Label className="text-xs text-muted-foreground">Cadence</Label>
            <Select value={recurrenceType} onValueChange={(v) => setRecurrenceType(v as 'daily' | 'weekly' | 'monthly')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {recurrenceType !== 'daily' ? (
            <div className="grid gap-1">
              <Label className="text-xs text-muted-foreground">{recurrenceDayLabel}</Label>
              <StepNumberInput min={0} step={1} value={recurrenceDay} onChange={(e) => setRecurrenceDay(e.target.value)} />
            </div>
          ) : null}

          <div className="grid gap-1">
            <Label className="text-xs text-muted-foreground">Next due date</Label>
            <Input type="date" value={nextGenerationDate} onChange={(e) => setNextGenerationDate(e.target.value)} />
          </div>

          <div className="grid gap-1">
            <Label className="text-xs text-muted-foreground">When due, create as</Label>
            <Select value={generationMode} onValueChange={(v) => setGenerationMode(v as 'schedule' | 'draft')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="schedule">Staged schedule (confirm on sheet)</SelectItem>
                <SelectItem value="draft">Draft work order (immediate)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <Checkbox checked={autoGenerate} onCheckedChange={(v) => setAutoGenerate(v === true)} />
            <span>Auto-generate when due (future job)</span>
          </label>
        </div>
      ) : null}
    </div>
  );

  const dialogBody = (
    <div className="grid min-h-0 flex-1 gap-4 px-5 py-3 md:grid-cols-2">
      <div className="flex min-h-0 min-w-0 flex-col gap-3">
        {basicsSection}
        <Separator />
        {recurrenceSection}
        <Separator />
        {descriptionSection}
      </div>
      <div className="flex min-h-0 min-w-0 flex-col gap-3 overflow-y-auto pr-1" ref={rightColumnRef}>
        {partsSection}
        <Separator />
        {billingSection}
        <Separator />
        {approvalSection}
      </div>
    </div>
  );

  const saveLabel = isEdit ? 'Save changes' : 'Create template';

  const dialogFooter = (
    <DialogFooter className="shrink-0 gap-2 border-t border-border px-5 py-3">
      <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
        Cancel
      </Button>
      <div className="relative" data-wot-save-hint-root>
        {saveHintOpen && saveBlockReason ? (
          <div
            role="tooltip"
            className="absolute bottom-[calc(100%+0.5rem)] right-0 z-50 w-max max-w-[16rem] rounded-md border border-border bg-popover px-3 py-2 text-xs leading-snug text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95"
          >
            {templateSaveBlockMessage(saveBlockReason)}
          </div>
        ) : null}
        <Button
          type="button"
          disabled={isSaving}
          onClick={() => void handleSave()}
          className={cn(
            'bg-brand-primary hover:bg-brand-primary-hover',
            !canSave && !isSaving && 'opacity-60',
          )}
        >
          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {saveLabel}
        </Button>
      </div>
    </DialogFooter>
  );

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="flex h-[min(70vh,40rem)] max-h-[70vh] w-[min(48rem,94vw)] max-w-none flex-col gap-0 overflow-hidden p-0 sm:max-w-none">
          <DialogHeader className="shrink-0 border-b border-border px-5 py-3">
            <DialogTitle>{isEdit ? 'Edit template' : 'New template'}</DialogTitle>
            <DialogDescription>
              {isEdit
                ? `Update saved defaults for "${template?.template_name}".`
                : 'Save reusable defaults for maintenance — all fields optional except name and type.'}
            </DialogDescription>
          </DialogHeader>

          {dialogBody}
          {dialogFooter}
        </DialogContent>
      </Dialog>

      <ItemSelectorDialog
        open={itemPickerOpen}
        onOpenChange={setItemPickerOpen}
        onSelect={handleItemSelect}
        factoryId={itemSelectorFactoryId}
        initialTab="catalog"
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

export default CreateEditWorkOrderTemplateDialog;
