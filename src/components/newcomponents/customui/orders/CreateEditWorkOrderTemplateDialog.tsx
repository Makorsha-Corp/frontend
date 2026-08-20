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
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
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
import MachineSelectorDialog from '@/components/newcomponents/customui/MachineSelectorDialog';
import { MachineSelectSummaryButton } from '@/components/newcomponents/customui/MachineSelectSummaryButton';
import { cn } from '@/lib/utils';
import type { WorkOrderItemActionType, WorkOrderPriority } from '@/types/workOrder';
import {
  WORK_ORDER_ITEM_ACTION_OPTIONS,
  WORK_ORDER_ITEM_ACTION_EXPLAINER,
  WORK_ORDER_PRIORITIES,
  priorityLabel,
  workOrderItemActionLabel,
} from '@/pages/newpages/orders/workOrderConstants';
import { Loader2, Package, Plus, Receipt, Trash2 } from 'lucide-react';
import { OptionalPanelSummaryButton } from './OptionalPanelSummaryButton';
import LineItemCommitCheckButton, {
  partDraftHintText,
} from '@/components/newcomponents/customui/orders/LineItemCommitCheckButton';
import {
  handleUnaddedItemDraftOnSubmit,
  hasUncommittedPartDraft,
  useLineItemAddButtonHighlight,
} from '@/components/newcomponents/customui/orders/useLineItemAddButtonHighlight';
import { appToast } from '@/lib/appToast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import ItemSelectorDialog, { type ItemSelection } from '@/components/newcomponents/customui/ItemSelectorDialog';
import { ItemSelectSummaryButton } from '@/components/newcomponents/customui/ItemSelectSummaryButton';
import { resolveFactoryIdFromWorkOrderContext } from '@/components/newcomponents/customui/itemSelectorUtils';
import { useGlobalFactory } from '@/hooks/useGlobalFactoryContext';
import { scrollToHighlightTarget } from '@/utils/poScrollHighlight';

type TemplateSaveBlockReason = 'name' | 'type' | 'account' | 'cost';

const TEMPLATE_HIGHLIGHT_IDS: Record<TemplateSaveBlockReason, string> = {
  name: 'wot-template-name',
  type: 'wot-template-type',
  account: 'wot-template-account',
  cost: 'wot-template-cost',
};

function getTemplateSaveBlockReason(args: {
  templateName: string;
  typeId: string;
  billTo: 'external' | 'internal';
  accountId: string;
  hasMiscCost: 'no' | 'yes';
  cost: string;
}): TemplateSaveBlockReason | null {
  if (!args.templateName.trim()) return 'name';
  if (!args.typeId) return 'type';
  if (args.billTo === 'external' && !args.accountId) return 'account';
  if (args.billTo === 'internal' && args.hasMiscCost === 'yes' && !(Number(args.cost) > 0)) return 'cost';
  return null;
}

function templateSaveBlockMessage(reason: TemplateSaveBlockReason): string {
  switch (reason) {
    case 'name':
      return 'Enter a name';
    case 'type':
      return 'Select a work order type';
    case 'account':
      return 'Select an external account';
    case 'cost':
      return 'Enter a miscellaneous cost amount';
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
  defaultFactoryId?: number | null;
  /** When creating (not editing), turn on recurrence by default. */
  defaultRecurring?: boolean;
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
  defaultFactoryId,
  defaultRecurring = false,
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
  const [machinePickerOpen, setMachinePickerOpen] = useState(false);

  const [lines, setLines] = useState<TemplateLineDraft[]>([]);
  const [draftLine, setDraftLine] = useState<TemplateLineDraft>(emptyLine());

  const [billTo, setBillTo] = useState<'external' | 'internal'>('internal');
  const [accountId, setAccountId] = useState('');
  const [hasMiscCost, setHasMiscCost] = useState<'no' | 'yes'>('no');
  const [cost, setCost] = useState('');

  const [approverIds, setApproverIds] = useState<number[]>([]);
  const [partsOverlayOpen, setPartsOverlayOpen] = useState(false);
  const [moreOverlayOpen, setMoreOverlayOpen] = useState(false);

  const [description, setDescription] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceType, setRecurrenceType] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [isSaving, setIsSaving] = useState(false);
  const [itemPickerOpen, setItemPickerOpen] = useState(false);
  const [itemPickerTarget, setItemPickerTarget] = useState<'item' | 'replaced'>('item');
  const [itemLabels, setItemLabels] = useState<Record<string, string>>({});
  const [highlightTarget, setHighlightTarget] = useState<TemplateSaveBlockReason | null>(null);
  const [saveHintOpen, setSaveHintOpen] = useState(false);
  const [addHintOpen, setAddHintOpen] = useState(false);
  const [unaddedHintOpen, setUnaddedHintOpen] = useState(false);
  const {
    addButtonHighlighted,
    pulseAddButtonHighlight,
    dismissAddButtonHighlight,
  } = useLineItemAddButtonHighlight();
  const optionalPanelsRef = useRef<HTMLDivElement>(null);
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

  const selectedDefaultMachine = useMemo(
    () => machines.find((m) => String(m.id) === machineId) ?? null,
    [machines, machineId],
  );

  const scopeFactoryId = useMemo(() => {
    if (sectionId) {
      return sections.find((s) => s.id === Number(sectionId))?.factory_id ?? undefined;
    }
    if (defaultFactoryId) return defaultFactoryId;
    if (defaultSectionId) {
      return sections.find((s) => s.id === defaultSectionId)?.factory_id ?? undefined;
    }
    if (machineId) {
      const machine = machines.find((m) => m.id === Number(machineId));
      if (machine?.factory_section_id) {
        return sections.find((s) => s.id === machine.factory_section_id)?.factory_id ?? undefined;
      }
    }
    return undefined;
  }, [sectionId, sections, defaultFactoryId, defaultSectionId, machineId, machines]);

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
      setDescription(template.description ?? '');
      setIsRecurring(template.is_recurring);
      setRecurrenceType((template.recurrence_type as 'daily' | 'weekly' | 'monthly') || 'weekly');
    } else {
      setTemplateName('');
      setTypeId('');
      setPriority('MEDIUM');
      setAssignedTo('');
      setSectionId(defaultSectionId ? String(defaultSectionId) : '');
      setMachineId(defaultMachineId ? String(defaultMachineId) : '');
      setLines([]);
      setBillTo('internal');
      setAccountId('');
      setHasMiscCost('no');
      setCost('');
      setApproverIds([]);
      setDescription('');
      setIsRecurring(defaultRecurring);
      setRecurrenceType('weekly');
    }
    setDraftLine(emptyLine());
    setIsCreatingType(false);
    setNewTypeName('');
    setPartsOverlayOpen(false);
    setMoreOverlayOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, template?.id, defaultSectionId, defaultMachineId, defaultRecurring]);

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
      appToast.success('Work order type added');
    } catch (err: unknown) {
      const e = err as { data?: { detail?: string } };
      appToast.error(e?.data?.detail || 'Failed to create work order type');
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

  const itemName = useCallback(
    (id: string) =>
      itemLabels[id] ??
      (() => {
        const item = items.find((i) => String(i.id) === id);
        return item ? (item.unit ? `${item.name} (${item.unit})` : item.name) : `Item #${id}`;
      })(),
    [itemLabels, items],
  );

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

  const hasUnaddedPartDraft = useMemo(
    () => hasUncommittedPartDraft(draftLine),
    [draftLine],
  );

  useEffect(() => {
    if (draftLineValid) setAddHintOpen(false);
  }, [draftLineValid]);

  useEffect(() => {
    if (!hasUnaddedPartDraft) {
      setUnaddedHintOpen(false);
      dismissAddButtonHighlight();
    }
  }, [hasUnaddedPartDraft, dismissAddButtonHighlight]);

  const handleAddLineClick = () => {
    if (!draftLineValid) {
      setAddHintOpen(true);
      return;
    }
    setLines((prev) => [...prev, draftLine]);
    setDraftLine(emptyLine());
    setAddHintOpen(false);
    setUnaddedHintOpen(false);
    dismissAddButtonHighlight();
  };

  const handleRemoveLine = (key: string) => {
    setLines((prev) => prev.filter((l) => l.key !== key));
  };

  const saveBlockReason = useMemo(
    () =>
      getTemplateSaveBlockReason({
        templateName,
        typeId,
        billTo,
        accountId,
        hasMiscCost,
        cost,
      }),
    [templateName, typeId, billTo, accountId, hasMiscCost, cost],
  );

  const canSave = saveBlockReason === null;

  const pulseSaveHighlight = useCallback((reason: TemplateSaveBlockReason) => {
    const generation = ++highlightGenerationRef.current;
    const element = document.getElementById(TEMPLATE_HIGHLIGHT_IDS[reason]);
    const container =
      reason === 'name' || reason === 'type' ? null : optionalPanelsRef.current;

    if (reason === 'account' || reason === 'cost') {
      setPartsOverlayOpen(false);
      setMoreOverlayOpen(true);
    }

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
    if (hasUnaddedPartDraft) {
      if (!partsOverlayOpen) {
        setMoreOverlayOpen(false);
        setPartsOverlayOpen(true);
      }
      if (
        handleUnaddedItemDraftOnSubmit({
          hasUnaddedItemDraft: true,
          unaddedHintOpen,
          setUnaddedHintOpen,
          pulseAddButtonHighlight,
          clearDraft: () => setDraftLine(emptyLine()),
        }) === 'blocked'
      ) {
        return;
      }
    }
    if (saveBlockReason) {
      pulseSaveHighlight(saveBlockReason);
      appToast.error(templateSaveBlockMessage(saveBlockReason));
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
        uses_inventory: lines.length > 0,
        account_id: billTo === 'external' ? Number(accountId) : undefined,
        cost: billTo === 'internal' && hasMiscCost === 'yes' ? Number(cost) : undefined,
        requires_approval: approverIds.length > 0,
        approver_user_ids: approverIds.length > 0 ? approverIds : [],
        default_factory_section_id: sectionId ? Number(sectionId) : undefined,
        default_machine_id: machineId ? Number(machineId) : undefined,
        is_recurring: isRecurring,
        recurrence_type: isRecurring ? recurrenceType : null,
        ...(isRecurring
          ? isEdit
            ? {}
            : {
                recurrence_day: null,
                next_generation_date: null,
                recurrence_start_date: null,
                recurrence_end_date: null,
              }
          : {
              recurrence_day: null,
              next_generation_date: null,
              recurrence_start_date: null,
              recurrence_end_date: null,
            }),
        auto_generate: false,
      };
      const lineItems = lines.map((l) => ({
        item_id: Number(l.itemId),
        quantity: Number(l.quantity),
        action_type: l.actionType,
        replaced_item_id: l.actionType === 'REPLACE' ? Number(l.replacedItemId) : undefined,
      }));

      if (isEdit && template) {
        await updateTemplate({ id: template.id, data: basePayload }).unwrap();
        await Promise.all(
          existingItems.map((ti) => removeTemplateItem({ tplId: template.id, itemId: ti.id }).unwrap()),
        );
        for (const li of lineItems) {
          await addTemplateItem({ tplId: template.id, data: li }).unwrap();
        }
        appToast.success('Template updated');
      } else {
        await createTemplate({ ...basePayload, items: lineItems }).unwrap();
        appToast.success('Template created');
      }
      onOpenChange(false);
    } catch (err: unknown) {
      const e = err as { data?: { detail?: string } };
      appToast.error(e?.data?.detail || 'Failed to save template');
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
          <div className={cn('grid gap-1', sections.length === 0 && 'col-span-2')}>
            <div className="flex items-center justify-between gap-2">
              <Label className="text-xs text-muted-foreground">Default machine</Label>
              {machineId ? (
                <button
                  type="button"
                  className="text-[10px] text-muted-foreground hover:text-foreground"
                  onClick={() => setMachineId('')}
                >
                  Clear
                </button>
              ) : null}
            </div>
            <MachineSelectSummaryButton
              onClick={() => setMachinePickerOpen(true)}
              ariaLabel={
                selectedDefaultMachine
                  ? `Change default machine. Current: ${selectedDefaultMachine.name}`
                  : 'Select default machine'
              }
              selectedLine={selectedDefaultMachine?.name ?? null}
              staleNumericId={selectedDefaultMachine ? null : machineId || null}
              compactLabel
              className="mt-0 h-10 min-h-10 py-0"
            />
            <MachineSelectorDialog
              open={machinePickerOpen}
              onOpenChange={setMachinePickerOpen}
              initialFactoryId={scopeFactoryId}
              initialSectionId={sectionId ? Number(sectionId) : defaultSectionId ?? undefined}
              title="Select default machine"
              description="Optional — pick factory, section, and machine for this template."
              onSelect={(machine) => {
                setMachineId(String(machine.id));
                if (!sectionId && machine.factory_section_id) {
                  setSectionId(String(machine.factory_section_id));
                }
              }}
            />
          </div>
        </div>
    </div>
  );

  const partsSummary = useMemo(() => {
    if (lines.length === 0) return '';
    const names = lines.map((l) => itemName(l.itemId));
    const preview = names.slice(0, 2).join(', ');
    const list = names.length > 2 ? `${preview} +${names.length - 2}` : preview;
    const action = workOrderItemActionLabel(lines[0].actionType);
    return `${action} · ${list}`;
  }, [lines, itemName]);

  const partsIsEmpty = lines.length === 0;

  const moreSummaryBits = useMemo(() => {
    const bits: string[] = [];
    if (priority !== 'MEDIUM') bits.push(priorityLabel(priority));
    if (billTo === 'external') {
      const acct = accounts.find((a) => String(a.id) === accountId);
      bits.push(acct ? acct.name : 'External vendor');
    } else if (hasMiscCost === 'yes' && Number(cost) > 0) {
      bits.push(`Misc ${cost}`);
    }
    if (approverIds.length > 0) {
      bits.push(`${approverIds.length} approver${approverIds.length === 1 ? '' : 's'}`);
    }
    return bits;
  }, [priority, billTo, accountId, accounts, hasMiscCost, cost, approverIds.length]);

  const isBillingDefault = moreSummaryBits.length === 0;
  const moreSummary = moreSummaryBits.join(' · ');

  const closeOptionalOverlays = () => {
    setPartsOverlayOpen(false);
    setMoreOverlayOpen(false);
  };

  const togglePartsOverlay = () => {
    if (partsOverlayOpen) {
      setPartsOverlayOpen(false);
      return;
    }
    setMoreOverlayOpen(false);
    setPartsOverlayOpen(true);
  };

  const toggleMoreOverlay = () => {
    if (moreOverlayOpen) {
      setMoreOverlayOpen(false);
      return;
    }
    setPartsOverlayOpen(false);
    setMoreOverlayOpen(true);
  };

  const templatePartsEditorContent = (
    <div className="space-y-3">
      {lines.length > 0 && (
        <>
          <p className="text-xs text-muted-foreground tabular-nums">{lines.length} part(s) added</p>
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
        </>
      )}

      <div className="space-y-3 rounded-md border border-dashed border-border bg-muted/20 p-3">
        <p className="text-xs text-muted-foreground">
          Pick item and quantity, then press ✓ to add to the list above.
        </p>
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

        <div className="flex flex-wrap items-end gap-2">
          <div className="grid min-w-[8rem] flex-1 gap-1">
            <Label className="text-xs text-muted-foreground">{draftLine.actionType === 'REPLACE' ? 'New item' : 'Item'}</Label>
            <ItemSelectSummaryButton
              ariaLabel={draftLine.actionType === 'REPLACE' ? 'Select new item' : 'Select item'}
              selectedLabel={draftLine.itemId ? itemName(draftLine.itemId) : null}
              staleNumericId={draftLine.itemId || null}
              compactLabel
              onClick={() => openItemPicker('item')}
            />
          </div>
          <div className="grid w-20 gap-1">
            <Label className="text-xs text-muted-foreground">Quantity</Label>
            <StepNumberInput
              min={0.01}
              step={1}
              value={draftLine.quantity}
              onChange={(e) => setDraftLine((d) => ({ ...d, quantity: e.target.value }))}
            />
          </div>
          <LineItemCommitCheckButton
            canCommit={draftLineValid}
            highlighted={addButtonHighlighted}
            hintOpen={(addHintOpen || unaddedHintOpen) && !draftLineValid}
            hintText={partDraftHintText(draftLine.actionType === 'REPLACE')}
            onCommit={handleAddLineClick}
            onDismissHint={() => {
              setAddHintOpen(false);
              setUnaddedHintOpen(false);
            }}
            onDismissHighlight={dismissAddButtonHighlight}
          />
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

        <p className="text-xs text-muted-foreground">Parts pull from the machine this template is applied to.</p>
      </div>
    </div>
  );

  const templateMoreEditorContent = (
    <div className="space-y-3">
      <div className="grid gap-1">
        <Label className="text-xs text-muted-foreground">Billing</Label>
        <Select value={billTo} onValueChange={(v) => setBillTo(v as 'internal' | 'external')}>
          <SelectTrigger className="h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="internal">Internal / free</SelectItem>
            <SelectItem value="external">External vendor</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {billTo === 'external' && (
        <div id={TEMPLATE_HIGHLIGHT_IDS.account} className={cn('grid gap-1 p-0.5', highlightClass('account'))}>
          <Label className="text-xs text-muted-foreground">Vendor account</Label>
          <Select value={accountId} onValueChange={setAccountId}>
            <SelectTrigger className="h-9">
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
        <div className="flex flex-wrap items-end gap-2">
          <Select value={hasMiscCost} onValueChange={(v) => setHasMiscCost(v as 'no' | 'yes')}>
            <SelectTrigger className="h-9 w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="no">No misc cost</SelectItem>
              <SelectItem value="yes">Misc cost</SelectItem>
            </SelectContent>
          </Select>
          {hasMiscCost === 'yes' && (
            <div id={TEMPLATE_HIGHLIGHT_IDS.cost} className={cn('p-0.5', highlightClass('cost'))}>
              <StepNumberInput
                min={0.01}
                step={1}
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                className="h-9 w-32"
                placeholder="Amount"
              />
            </div>
          )}
        </div>
      )}

      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <Label className="text-xs text-muted-foreground shrink-0">Approvals</Label>
            <Badge variant="outline" className="text-[10px] font-normal shrink-0">
              {approverIds.length === 0 ? 'Optional' : `${approverIds.length} assigned`}
            </Badge>
          </div>
        </div>
        {assignableMembers.length === 0 ? (
          <p className="text-sm text-muted-foreground">No workspace members available.</p>
        ) : (
          <div className="max-h-40 space-y-1 overflow-y-auto rounded-md border border-border bg-muted/20 p-2">
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
    </div>
  );

  const optionalPanelOverlay = (variant: 'parts' | 'billing') => (
    <div className="absolute bottom-full left-0 right-0 z-30 mb-2 flex max-h-[min(55vh,34rem)] flex-col overflow-hidden rounded-md border border-border/80 bg-card shadow-lg">
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border/60 px-3 py-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm text-foreground">
            <span className="font-medium">
              {variant === 'parts' ? 'Parts / consumables' : 'Billing & approvals'}
            </span>
            <span className="text-muted-foreground">
              {' '}
              ·{' '}
              {variant === 'parts'
                ? partsIsEmpty
                  ? 'None added'
                  : partsSummary
                : isBillingDefault
                  ? 'Defaults'
                  : moreSummary}
            </span>
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" className="h-8 shrink-0" onClick={closeOptionalOverlays}>
          Done
        </Button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        {variant === 'parts' ? templatePartsEditorContent : templateMoreEditorContent}
      </div>
    </div>
  );

  const optionalPanelsBar = (
    <div ref={optionalPanelsRef} className="shrink-0 border-t border-border/60 px-5 py-2">
      <div className="flex items-stretch gap-2">
        <div className="relative min-w-0 flex-1">
          {partsOverlayOpen && optionalPanelOverlay('parts')}
          <OptionalPanelSummaryButton
            title="Parts / consumables (optional)"
            summary={partsSummary}
            emptyLabel="Optional — click to add"
            isEmpty={partsIsEmpty}
            open={partsOverlayOpen}
            onClick={togglePartsOverlay}
            icon={Package}
            ariaLabel={
              partsIsEmpty
                ? 'Add or edit parts and consumables. Currently optional, none added.'
                : `Add or edit parts and consumables. Currently: ${partsSummary}.`
            }
          />
        </div>
        <div className="relative min-w-0 flex-1">
          {moreOverlayOpen && optionalPanelOverlay('billing')}
          <OptionalPanelSummaryButton
            title="Billing & approvals"
            summary={moreSummary}
            emptyLabel="Click to set billing & approvals"
            isEmpty={isBillingDefault}
            open={moreOverlayOpen}
            onClick={toggleMoreOverlay}
            icon={Receipt}
            ariaLabel={
              isBillingDefault
                ? 'Set billing and approvals. Currently using defaults.'
                : `Edit billing and approvals. Currently: ${moreSummary}.`
            }
          />
        </div>
      </div>
    </div>
  );

  const descriptionSection = (
    <div className="grid gap-1 p-0.5">
      <Label className="text-xs text-muted-foreground">Description (optional)</Label>
      <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="resize-none" />
    </div>
  );

  const scheduleFieldsBlock = (
    <div className="space-y-3 rounded-md border border-border bg-muted/20 p-3">
      <div className="grid gap-1">
        <Label className="text-xs text-muted-foreground">Frequency</Label>
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

      <p className="rounded-md border border-border/60 bg-muted/20 px-3 py-2 text-sm leading-snug text-muted-foreground">
        Set frequency here. On a sheet row, pick this template and set start + end dates (up to 6 months).
        Saving the first row schedules all draft work orders in that range.
      </p>
    </div>
  );

  const dialogBody = (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="grid min-h-0 flex-1 gap-4 overflow-hidden px-5 py-3 md:grid-cols-2">
        <div className="flex min-h-0 min-w-0 flex-col gap-3 overflow-y-auto pr-1">
          {basicsSection}
          <Separator />
          {descriptionSection}
        </div>
        <div className="flex min-h-0 min-w-0 flex-col gap-3 overflow-y-auto pr-1">
          <div className="flex items-center justify-between rounded-md border border-border p-3">
            <div>
              <p className="text-sm font-medium text-foreground">Recurring schedule</p>
              <p className="text-xs text-muted-foreground">First sheet save auto-schedules drafts in the date range.</p>
            </div>
            <Switch checked={isRecurring} onCheckedChange={setIsRecurring} />
          </div>
          {isRecurring ? (
            scheduleFieldsBlock
          ) : (
            <p className="rounded-md border border-dashed border-border/60 bg-muted/15 px-3 py-4 text-xs leading-relaxed text-muted-foreground">
              Optional parts, billing, and approvals — use the panels below, same as Add work footer.
            </p>
          )}
        </div>
      </div>
      {optionalPanelsBar}
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
        <DialogContent className="flex h-[min(80vh,52rem)] max-h-[80vh] w-[min(56rem,94vw)] max-w-none flex-col gap-0 overflow-hidden p-0 sm:max-w-none">
          <DialogHeader className="shrink-0 border-b border-border px-5 py-3">
            <DialogTitle>{isEdit ? 'Edit template' : 'New template'}</DialogTitle>
            <DialogDescription>
              {isEdit
                ? `Update saved defaults for "${template?.template_name}". Turn on recurrence for Plan-day drafts.`
                : 'Reusable work order defaults — name and type required; turn on recurrence for Plan-day drafts.'}
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
