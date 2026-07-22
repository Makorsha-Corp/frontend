import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useAppDispatch } from '@/app/hooks';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { StepNumberInput } from '@/components/ui/step-number-input';
import {
  useAddWorkOrderApproverMutation,
  useAddWorkOrderItemMutation,
  useCreateWorkOrderSheetEntryMutation,
  useGetWorkOrderApproversQuery,
  useGetWorkOrderByIdQuery,
  useGetWorkOrderItemsQuery,
  useRemoveWorkOrderApproverMutation,
  useRemoveWorkOrderItemMutation,
  useUpdateWorkOrderMutation,
  useUpdateWorkOrderItemMutation,
} from '@/features/workOrders/workOrdersApi';
import {
  useGenerateWorkOrderDraftsMutation,
  useCreateWorkOrderTemplateMutation,
  workOrderTemplatesApi,
} from '@/features/workOrderTemplates/workOrderTemplatesApi';
import type { Machine } from '@/types/machine';
import type { WorkOrderType } from '@/types/workOrderType';
import type { Item } from '@/types/item';
import type { WorkOrderTemplate, WorkOrderTemplateItem, WorkOrderTemplateApprover } from '@/types/workOrderTemplate';
import type { Account } from '@/types/account';
import type { WorkspaceMember } from '@/types/workspace';
import type {
  WorkOrderItemActionType,
  WorkOrderItemSourceType,
  WorkOrderPriority,
} from '@/types/workOrder';
import {
  WORK_ORDER_ITEM_ACTION_OPTIONS,
  WORK_ORDER_ITEM_ACTION_EXPLAINER,
  WORK_ORDER_PRIORITIES,
  priorityLabel,
  workOrderItemActionLabel,
} from '@/pages/newpages/orders/workOrderConstants';
import { ChevronDown, ChevronRight, Loader2, Plus, Sparkles, Trash2, Wrench } from 'lucide-react';
import { format, parseISO, startOfDay } from 'date-fns';
import toast from 'react-hot-toast';
import MachineSelectorDialog from '@/components/newcomponents/customui/MachineSelectorDialog';
import { MachineSelectSummaryButton } from '@/components/newcomponents/customui/MachineSelectSummaryButton';
import ItemSelectorDialog, { type ItemSelection } from '@/components/newcomponents/customui/ItemSelectorDialog';
import { ItemSelectSummaryButton } from '@/components/newcomponents/customui/ItemSelectSummaryButton';
import WorkOrderTemplateSelector from './WorkOrderTemplateSelector';
import ManageWoApprovalsDialog from './ManageWoApprovalsDialog';
import { draftApproversFromUserIds } from './transferOrderApprovals';
import { cn } from '@/lib/utils';
import DatePickerField from '@/components/newcomponents/customui/DatePickerField';
import { HoverCard, HoverCardContent, HoverCardPortal, HoverCardTrigger } from '@/components/ui/hover-card';

const FOOTER_TEMPLATE_HINT =
  'Loads machine, works, parts, and billing from a preset. Choose No template to fill manually.';
interface PartLineDraft {
  key: string;
  woItemId?: number;
  itemId: string;
  quantity: string;
  actionType: WorkOrderItemActionType;
  sourceType: WorkOrderItemSourceType;
  sourceMachineId?: number;
  replacedItemId: string;
}

const makeKey = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;

const emptyPartLine = (): PartLineDraft => ({
  key: makeKey(),
  itemId: '',
  quantity: '1',
  actionType: 'CONSUME',
  sourceType: 'storage',
  replacedItemId: '',
});

const emptyFooterPartDraft = () => ({
  itemId: '',
  quantity: '1',
  replacedItemId: '',
  sourceType: 'storage' as WorkOrderItemSourceType,
  sourceMachineId: undefined as number | undefined,
});

function formatItemDisplayLabel(selection: ItemSelection): string {
  const base = selection.itemUnit
    ? `${selection.itemName} (${selection.itemUnit})`
    : selection.itemName;
  if (
    (selection.selectionSource === 'storage' || selection.selectionSource === 'machine') &&
    selection.availableQty != null
  ) {
    return `${base} · ${selection.availableQty} on hand`;
  }
  return base;
}

function partSourceLabel(sourceType: WorkOrderItemSourceType): string {
  return sourceType === 'machine' ? 'machine stock' : 'storage';
}

export interface SheetMaintenanceEntryFormProps {
  sheetDate: string;
  factoryId: number | null;
  sectionId: number | null;
  machines: Machine[];
  workOrderTypes: WorkOrderType[];
  partItems: Item[];
  templates: WorkOrderTemplate[];
  accounts: Account[];
  members: WorkspaceMember[];
  defaultMachineId?: number | null;
  mode?: 'create' | 'edit';
  workOrderId?: number;
  embedded?: boolean;
  layout?: 'dialog' | 'footer';
  showFooterHeader?: boolean;
  disabled?: boolean;
  showGenerateDay?: boolean;
  showWorkDate?: boolean;
  submitLabel?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const SheetMaintenanceEntryForm: React.FC<SheetMaintenanceEntryFormProps> = ({
  sheetDate,
  factoryId,
  sectionId,
  machines,
  workOrderTypes,
  partItems,
  templates,
  accounts,
  members,
  defaultMachineId,
  mode = 'create',
  workOrderId,
  embedded = false,
  layout = 'dialog',
  showFooterHeader = true,
  disabled = false,
  showGenerateDay = true,
  showWorkDate = false,
  submitLabel,
  onSuccess,
  onCancel,
}) => {
  const dispatch = useAppDispatch();
  const [machineId, setMachineId] = useState('');
  const [workDate, setWorkDate] = useState(sheetDate);
  const [machinePickerOpen, setMachinePickerOpen] = useState(false);
  const [worksTypeId, setWorksTypeId] = useState('');
  const [workers, setWorkers] = useState('');
  const [remarks, setRemarks] = useState('');
  const [partsOpen, setPartsOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [partsOverlayOpen, setPartsOverlayOpen] = useState(false);
  const [moreOverlayOpen, setMoreOverlayOpen] = useState(false);
  const [lines, setLines] = useState<PartLineDraft[]>(() =>
    layout === 'footer' ? [] : [emptyPartLine()],
  );
  const [partsActionType, setPartsActionType] = useState<WorkOrderItemActionType>('CONSUME');
  /** Footer-only: explicit "no parts this visit" vs picking an action before adding lines. */
  const [footerPartsIntent, setFooterPartsIntent] = useState<'none' | WorkOrderItemActionType>('none');
  const [partDraft, setPartDraft] = useState(emptyFooterPartDraft);
  const [itemPickerOpen, setItemPickerOpen] = useState(false);
  const [itemPickerTarget, setItemPickerTarget] = useState<'item' | 'replaced'>('item');
  const [itemLabels, setItemLabels] = useState<Record<string, string>>({});

  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [priority, setPriority] = useState<WorkOrderPriority>('MEDIUM');
  const [billTo, setBillTo] = useState<'internal' | 'external'>('internal');
  const [accountId, setAccountId] = useState('');
  const [hasMiscCost, setHasMiscCost] = useState<'no' | 'yes'>('no');
  const [cost, setCost] = useState('');
  const [approverUserIds, setApproverUserIds] = useState<number[]>([]);
  const [manageApprovalsOpen, setManageApprovalsOpen] = useState(false);

  const isEdit = mode === 'edit' && workOrderId != null;
  const templateLocked = Boolean(selectedTemplateId) && !isEdit;

  const { data: editOrder } = useGetWorkOrderByIdQuery(workOrderId!, { skip: !isEdit });
  const { data: editItems = [] } = useGetWorkOrderItemsQuery(workOrderId!, { skip: !isEdit });
  const { data: editApproversData } = useGetWorkOrderApproversQuery(workOrderId!, { skip: !isEdit });

  const [submitEntry, { isLoading: isCreating }] = useCreateWorkOrderSheetEntryMutation();
  const [updateOrder, { isLoading: isUpdating }] = useUpdateWorkOrderMutation();
  const [addItem] = useAddWorkOrderItemMutation();
  const [updateItem] = useUpdateWorkOrderItemMutation();
  const [removeItem] = useRemoveWorkOrderItemMutation();
  const [addApprover] = useAddWorkOrderApproverMutation();
  const [removeApprover] = useRemoveWorkOrderApproverMutation();
  const [generateDrafts, { isLoading: generating }] = useGenerateWorkOrderDraftsMutation();
  const [createTemplate] = useCreateWorkOrderTemplateMutation();
  const [loadingTemplateId, setLoadingTemplateId] = useState<number | null>(null);
  const [prefilled, setPrefilled] = useState(false);
  const footerActionBarRef = useRef<HTMLDivElement>(null);

  const isLoading = isCreating || isUpdating;

  const machinesInScope = useMemo(() => {
    if (sectionId) return machines.filter((m) => m.factory_section_id === sectionId);
    return machines;
  }, [machines, sectionId]);

  const activeMembers = useMemo(
    () => members.filter((m) => m.status === 'active'),
    [members],
  );

  const assignableApproverMembers = useMemo(
    () => activeMembers.filter((m) => !approverUserIds.includes(m.user_id)),
    [activeMembers, approverUserIds],
  );

  const draftApprovers = useMemo(
    () => draftApproversFromUserIds(approverUserIds, activeMembers),
    [approverUserIds, activeMembers],
  );

  const resolvedMachineId = machineId ? Number(machineId) : null;

  const selectedMachine = useMemo(
    () => machinesInScope.find((m) => String(m.id) === machineId) ?? machines.find((m) => String(m.id) === machineId),
    [machines, machinesInScope, machineId],
  );

  useEffect(() => {
    if (defaultMachineId) setMachineId(String(defaultMachineId));
  }, [defaultMachineId]);

  useEffect(() => {
    if (!isEdit) setWorkDate(sheetDate);
  }, [sheetDate, isEdit]);

  useEffect(() => {
    if (!isEdit || !editOrder || prefilled) return;
    setMachineId(editOrder.machine_id ? String(editOrder.machine_id) : '');
    setWorksTypeId(String(editOrder.work_order_type_id));
    setWorkers(editOrder.assigned_to ?? '');
    setRemarks(editOrder.description ?? '');
    setPriority(editOrder.priority);
    if (editOrder.account_id) {
      setBillTo('external');
      setAccountId(String(editOrder.account_id));
      setHasMiscCost('no');
      setCost('');
    } else if (editOrder.cost != null && Number(editOrder.cost) > 0) {
      setBillTo('internal');
      setAccountId('');
      setHasMiscCost('yes');
      setCost(String(editOrder.cost));
    } else {
      setBillTo('internal');
      setAccountId('');
      setHasMiscCost('no');
      setCost('');
    }
    if (editOrder.work_order_template_id) {
      setSelectedTemplateId(String(editOrder.work_order_template_id));
    }
    if (editItems.length > 0) {
      setPartsOpen(true);
      setPartsActionType(editItems[0].action_type);
      setLines(
        editItems.map((item) => ({
          key: makeKey(),
          woItemId: item.id,
          itemId: String(item.item_id),
          quantity: String(item.quantity),
          actionType: item.action_type,
          sourceType: item.source_location_type ?? 'storage',
          sourceMachineId:
            item.source_location_type === 'machine' ? item.source_location_id ?? undefined : undefined,
          replacedItemId: item.replaced_item_id ? String(item.replaced_item_id) : '',
        })),
      );
    }
    const approverIds = editApproversData?.approvers.map((a) => a.user_id) ?? [];
    setApproverUserIds(approverIds);
    if (
      editOrder.priority !== 'MEDIUM' ||
      editOrder.account_id ||
      (editOrder.cost != null && Number(editOrder.cost) > 0) ||
      approverIds.length > 0
    ) {
      setMoreOpen(true);
    }
    setPrefilled(true);
  }, [isEdit, editOrder, editItems, editApproversData, prefilled]);

  useEffect(() => {
    if (!isEdit) setPrefilled(false);
  }, [isEdit, workOrderId]);

  useEffect(() => {
    if (!worksTypeId && workOrderTypes.length > 0) {
      setWorksTypeId(String(workOrderTypes[0].id));
    }
  }, [workOrderTypes, worksTypeId]);

  const isFooterLayout = layout === 'footer';

  const entryStartDate = showWorkDate && !isEdit ? workDate : sheetDate;

  const workDateHelper = useMemo(() => {
    if (!showWorkDate || isEdit) return null;
    try {
      const picked = startOfDay(parseISO(workDate));
      const today = startOfDay(new Date());
      if (picked > today) return 'Plan work — creates a draft order on this date';
      return 'Record work for this day';
    } catch {
      return null;
    }
  }, [showWorkDate, isEdit, workDate]);

  const addLine = () => setLines((prev) => [...prev, emptyPartLine()]);
  const removeLine = (key: string) => {
    if (isFooterLayout) {
      setLines((prev) => prev.filter((l) => l.key !== key));
      return;
    }
    setLines((prev) => (prev.length <= 1 ? prev : prev.filter((l) => l.key !== key)));
  };

  const resetParts = () => {
    setPartsOpen(false);
    if (isFooterLayout) {
      setLines([]);
      setPartsActionType('CONSUME');
      setFooterPartsIntent('none');
      setPartDraft(emptyFooterPartDraft());
      setItemLabels({});
    } else {
      setLines([emptyPartLine()]);
    }
  };

  const itemName = (id: string) =>
    itemLabels[id] ??
    (() => {
      const item = partItems.find((i) => String(i.id) === id);
      return item ? (item.unit ? `${item.name} (${item.unit})` : item.name) : `Item #${id}`;
    })();

  const openItemPicker = (target: 'item' | 'replaced') => {
    setItemPickerTarget(target);
    setItemPickerOpen(true);
  };

  const handleItemSelect = (selection: ItemSelection) => {
    const label = formatItemDisplayLabel(selection);
    const id = String(selection.itemId);
    setItemLabels((prev) => ({ ...prev, [id]: label }));
    if (itemPickerTarget === 'replaced') {
      setPartDraft((d) => ({ ...d, replacedItemId: id }));
    } else {
      const sourceType: WorkOrderItemSourceType =
        selection.selectionSource === 'machine' ? 'machine' : 'storage';
      setPartDraft((d) => ({
        ...d,
        itemId: id,
        sourceType,
        sourceMachineId: selection.machineId,
      }));
    }
  };

  const footerPartDraftValid =
    Boolean(partDraft.itemId) &&
    Number(partDraft.quantity) > 0 &&
    (partsActionType !== 'REPLACE' || Boolean(partDraft.replacedItemId));

  const handleCommitFooterPart = () => {
    if (!footerPartDraftValid) {
      toast.error(
        partsActionType === 'REPLACE'
          ? 'Pick item, quantity, and part being replaced'
          : 'Pick an item and quantity',
      );
      return;
    }
    setLines((prev) => [
      ...prev,
      {
        key: makeKey(),
        itemId: partDraft.itemId,
        quantity: partDraft.quantity,
        actionType: partsActionType,
        sourceType: partDraft.sourceType,
        sourceMachineId: partDraft.sourceMachineId,
        replacedItemId: partDraft.replacedItemId,
      },
    ]);
    setPartDraft(emptyFooterPartDraft());
  };

  const mapPartLineToApi = (line: PartLineDraft, mid: number) => {
    const actionType = isFooterLayout ? partsActionType : line.actionType;
    const sourceType = line.sourceType;
    return {
      item_id: Number(line.itemId),
      quantity: Number(line.quantity),
      action_type: actionType,
      source_location_type: sourceType,
      source_location_id:
        sourceType === 'machine' ? (line.sourceMachineId ?? mid) : factoryId ?? undefined,
      replaced_item_id: actionType === 'REPLACE' ? Number(line.replacedItemId) : undefined,
    };
  };

  const syncEditItems = async (woId: number, mid: number) => {
    const hasPartsToSync = partsOpen || (isFooterLayout && lines.some((l) => l.itemId));
    if (!hasPartsToSync) return;

    const validLines = lines.filter((l) => {
      const actionType = isFooterLayout ? partsActionType : l.actionType;
      return (
        l.itemId &&
        Number(l.quantity) > 0 &&
        (actionType !== 'REPLACE' || l.replacedItemId)
      );
    });
    const keptWoItemIds = new Set(
      validLines.map((l) => l.woItemId).filter((id): id is number => id != null),
    );
    for (const existing of editItems) {
      if (!keptWoItemIds.has(existing.id)) {
        await removeItem({ woId, itemId: existing.id }).unwrap();
      }
    }
    for (const line of validLines) {
      const api = mapPartLineToApi(line, mid);
      const payload = { ...api, uses_inventory: true };
      if (line.woItemId) {
        await updateItem({
          woId,
          itemId: line.woItemId,
          data: {
            quantity: Number(line.quantity),
            source_location_type: api.source_location_type,
            source_location_id: api.source_location_id,
          },
        }).unwrap();
      } else {
        await addItem({ woId, data: payload }).unwrap();
      }
    }
  };

  const buildApprovers = () => {
    if (approverUserIds.length === 0) return undefined;
    return approverUserIds.map((user_id) => ({ user_id }));
  };

  const handleAddApprover = (userId: number) => {
    setApproverUserIds((prev) => (prev.includes(userId) ? prev : [...prev, userId]));
  };

  const handleRemoveApprover = (userId: number) => {
    setApproverUserIds((prev) => prev.filter((id) => id !== userId));
  };

  const syncEditApprovers = async (woId: number) => {
    const existingIds = new Set(editApproversData?.approvers.map((a) => a.user_id) ?? []);
    const desiredIds = new Set(approverUserIds);
    for (const userId of approverUserIds) {
      if (!existingIds.has(userId)) {
        await addApprover({ woId, user_id: userId }).unwrap();
      }
    }
    for (const userId of existingIds) {
      if (!desiredIds.has(userId)) {
        await removeApprover({ woId, userId }).unwrap();
      }
    }
  };

  const validPartLines = useMemo(
    () =>
      lines.filter((l) => {
        const actionType = isFooterLayout ? partsActionType : l.actionType;
        return (
          l.itemId &&
          Number(l.quantity) > 0 &&
          (actionType !== 'REPLACE' || l.replacedItemId)
        );
      }),
    [lines, isFooterLayout, partsActionType],
  );

  const shouldSyncParts = partsOpen || (isFooterLayout && validPartLines.length > 0);

  const partsSummary = useMemo(() => {
    if (validPartLines.length === 0) return 'None';
    const names = validPartLines.map(
      (l) => partItems.find((i) => String(i.id) === l.itemId)?.name ?? 'Item',
    );
    const preview = names.slice(0, 2).join(', ');
    return names.length > 2 ? `${preview} +${names.length - 2}` : preview;
  }, [validPartLines, partItems]);

  const partsChipSummary = useMemo(() => {
    if (isFooterLayout && footerPartsIntent === 'none') return 'No parts';
    const action = workOrderItemActionLabel(partsActionType);
    if (validPartLines.length === 0) return action;
    return `${action} · ${partsSummary}`;
  }, [isFooterLayout, footerPartsIntent, partsActionType, validPartLines.length, partsSummary]);

  const moreSummary = useMemo(() => {
    const bits: string[] = [];
    if (priority !== 'MEDIUM') bits.push(priorityLabel(priority));
    if (billTo === 'external') {
      const acct = accounts.find((a) => String(a.id) === accountId);
      bits.push(acct ? acct.name : 'External vendor');
    } else if (hasMiscCost === 'yes' && Number(cost) > 0) {
      bits.push(`Misc ${cost}`);
    }
    if (approverUserIds.length > 0) {
      bits.push(`${approverUserIds.length} approver${approverUserIds.length === 1 ? '' : 's'}`);
    }
    return bits.length > 0 ? bits.join(' · ') : 'Medium · Internal';
  }, [priority, billTo, accountId, accounts, hasMiscCost, cost, approverUserIds]);

  const manualFieldsTouched = useMemo(() => {
    if (selectedTemplateId || isEdit) return false;
    const hasParts = isFooterLayout
      ? footerPartsIntent !== 'none' || validPartLines.length > 0
      : partsOpen && validPartLines.length > 0;
    const hasBilling =
      priority !== 'MEDIUM' ||
      billTo !== 'internal' ||
      hasMiscCost === 'yes' ||
      Boolean(accountId) ||
      Boolean(cost.trim()) ||
      approverUserIds.length > 0;
    return Boolean(workers.trim() || hasParts || hasBilling);
  }, [
    selectedTemplateId,
    isEdit,
    isFooterLayout,
    footerPartsIntent,
    validPartLines.length,
    partsOpen,
    workers,
    priority,
    billTo,
    hasMiscCost,
    accountId,
    cost,
    approverUserIds.length,
  ]);
  const templatePickerDisabled = manualFieldsTouched && !selectedTemplateId;

  useEffect(() => {
    if (!templateLocked) return;
    setMachinePickerOpen(false);
    setPartsOverlayOpen(false);
    setMoreOverlayOpen(false);
  }, [templateLocked]);

  const closeFooterOverlays = () => {
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

  useEffect(() => {
    if (!isFooterLayout || (!partsOverlayOpen && !moreOverlayOpen)) return;

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (footerActionBarRef.current?.contains(target)) return;
      if (itemPickerOpen || manageApprovalsOpen || machinePickerOpen) return;
      closeFooterOverlays();
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [
    isFooterLayout,
    partsOverlayOpen,
    moreOverlayOpen,
    itemPickerOpen,
    manageApprovalsOpen,
    machinePickerOpen,
  ]);

  const handleSubmit = async () => {
    const mid = Number(machineId);
    const typeId = Number(worksTypeId);
    if (!mid || !typeId) {
      toast.error('Pick machine and works type');
      return;
    }
    if (billTo === 'external' && !accountId) {
      toast.error('Pick a vendor account for external billing');
      return;
    }
    if (billTo === 'internal' && hasMiscCost === 'yes' && !(Number(cost) > 0)) {
      toast.error('Enter a misc cost amount');
      return;
    }

    const validLines = isFooterLayout
      ? validPartLines
      : partsOpen
        ? validPartLines
        : [];
    if (!isFooterLayout && partsOpen && validLines.length === 0) {
      toast.error('Add at least one valid part line or collapse parts section');
      return;
    }

    try {
      if (isEdit && workOrderId) {
        await updateOrder({
          id: workOrderId,
          data: {
            work_order_type_id: typeId,
            description: remarks.trim() || undefined,
            assigned_to: workers.trim() || undefined,
            priority,
            account_id: billTo === 'external' ? Number(accountId) : null,
            cost: billTo === 'internal' && hasMiscCost === 'yes' ? Number(cost) : undefined,
            machine_id: mid,
            start_date: sheetDate,
          },
        }).unwrap();
        if (shouldSyncParts) {
          await syncEditItems(workOrderId, mid);
        }
        await syncEditApprovers(workOrderId);
        toast.success('Entry updated');
      } else {
        await submitEntry({
          machine_id: mid,
          work_order_type_id: typeId,
          start_date: entryStartDate,
          assigned_to: workers.trim() || undefined,
          description: remarks.trim() || undefined,
          priority,
          account_id: billTo === 'external' ? Number(accountId) : undefined,
          cost: billTo === 'internal' && hasMiscCost === 'yes' ? Number(cost) : undefined,
          template_id: selectedTemplateId ? Number(selectedTemplateId) : undefined,
          approvers: buildApprovers(),
          items:
            validLines.length > 0
              ? validLines.map((l) => mapPartLineToApi(l, mid))
              : undefined,
        }).unwrap();
        toast.success('Entry saved');
        setWorkers('');
        setRemarks('');
        resetParts();
        closeFooterOverlays();
      }
      onSuccess?.();
    } catch (err: unknown) {
      const e = err as { data?: { detail?: string } };
      toast.error(e?.data?.detail || (isEdit ? 'Failed to update entry' : 'Failed to save entry'));
    }
  };

  const applyTemplateData = async (template: WorkOrderTemplate) => {
    setSelectedTemplateId(String(template.id));
    setWorksTypeId(String(template.work_order_type_id));
    if (template.assigned_to) setWorkers(template.assigned_to);
    if (template.default_machine_id) setMachineId(String(template.default_machine_id));

    setPriority(template.priority);
    if (template.account_id) {
      setBillTo('external');
      setAccountId(String(template.account_id));
      setHasMiscCost('no');
      setCost('');
      setMoreOpen(true);
    } else if (template.cost != null && Number(template.cost) > 0) {
      setBillTo('internal');
      setAccountId('');
      setHasMiscCost('yes');
      setCost(String(template.cost));
      setMoreOpen(true);
    } else {
      setBillTo('internal');
      setAccountId('');
      setHasMiscCost('no');
      setCost('');
    }

    if (template.priority !== 'MEDIUM' || template.requires_approval) {
      setMoreOpen(true);
    }

    const [templateItems, templateApprovers]: [WorkOrderTemplateItem[], WorkOrderTemplateApprover[]] =
      await Promise.all([
      dispatch(workOrderTemplatesApi.endpoints.getWorkOrderTemplateItems.initiate(template.id)).unwrap(),
      template.requires_approval
        ? dispatch(workOrderTemplatesApi.endpoints.getWorkOrderTemplateApprovers.initiate(template.id)).unwrap()
        : Promise.resolve([] as WorkOrderTemplateApprover[]),
    ]);

    if (templateItems.length > 0 || template.uses_inventory) {
      setPartsOpen(true);
      if (templateItems.length > 0) {
        setPartsActionType(templateItems[0].action_type);
        if (templateItems.some((item) => item.action_type !== templateItems[0].action_type)) {
          toast('Template had mixed part actions — using first line\'s action for all', { icon: 'ℹ️' });
        }
        setLines(
          templateItems.map((item) => ({
            key: makeKey(),
            itemId: String(item.item_id),
            quantity: String(item.quantity),
            actionType: templateItems[0].action_type,
            sourceType: 'storage',
            replacedItemId: item.replaced_item_id ? String(item.replaced_item_id) : '',
          })),
        );
        if (isFooterLayout) {
          setFooterPartsIntent(templateItems[0].action_type);
        }
      } else if (isFooterLayout) {
        setLines([]);
        setFooterPartsIntent('none');
      } else {
        setLines([emptyPartLine()]);
      }
    } else {
      resetParts();
      if (isFooterLayout) {
        setFooterPartsIntent('none');
      }
    }

    if (templateApprovers.length > 0) {
      setMoreOpen(true);
      setApproverUserIds(templateApprovers.map((a) => a.user_id));
    } else {
      setApproverUserIds([]);
    }
  };

  const handleTemplateSelect = async (value: string) => {
    if (value === '__none__') {
      setSelectedTemplateId('');
      return;
    }
    setSelectedTemplateId(value);
    const template = templates.find((t) => String(t.id) === value);
    if (!template) return;
    setLoadingTemplateId(template.id);
    try {
      await applyTemplateData(template);
      toast.success('Template applied — remarks and date still editable');
    } catch (err: unknown) {
      const e = err as { data?: { detail?: string } };
      toast.error(e?.data?.detail || 'Failed to load template');
    } finally {
      setLoadingTemplateId(null);
    }
  };

  const handleBulkGenerate = async () => {
    try {
      const result = await generateDrafts({
        target_date: sheetDate,
        factory_section_id: sectionId ?? undefined,
        factory_id: factoryId ?? undefined,
      }).unwrap();
      toast.success(`Generated ${result.length} draft order(s)`);
      onSuccess?.();
    } catch (err: unknown) {
      const e = err as { data?: { detail?: string } };
      toast.error(e?.data?.detail || 'Failed to generate drafts');
    }
  };

  const handleSaveTemplate = async (name: string) => {
    const typeId = Number(worksTypeId);
    if (!typeId) {
      toast.error('Pick works type first');
      throw new Error('missing type');
    }

    const validLines = isFooterLayout
      ? validPartLines
      : partsOpen
        ? lines.filter(
            (l) =>
              l.itemId &&
              Number(l.quantity) > 0 &&
              (l.actionType !== 'REPLACE' || l.replacedItemId),
          )
        : [];
    const approvers = buildApprovers();
    const approverIds = approvers?.map((a) => a.user_id) ?? [];

    await createTemplate({
      template_name: name.trim(),
      work_order_type_id: typeId,
      priority,
      assigned_to: workers.trim() || undefined,
      uses_inventory: validLines.length > 0,
      account_id: billTo === 'external' ? Number(accountId) : undefined,
      cost: billTo === 'internal' && hasMiscCost === 'yes' ? Number(cost) : undefined,
      requires_approval: approverUserIds.length > 0,
      approver_user_ids: approverIds.length > 0 ? approverIds : undefined,
      description: remarks.trim() || undefined,
      default_factory_section_id: sectionId ?? undefined,
      default_machine_id: machineId ? Number(machineId) : undefined,
      items:
        validLines.length > 0
          ? validLines.map((l) => ({
              item_id: Number(l.itemId),
              quantity: Number(l.quantity),
              action_type: isFooterLayout ? partsActionType : l.actionType,
              replaced_item_id:
                (isFooterLayout ? partsActionType : l.actionType) === 'REPLACE'
                  ? Number(l.replacedItemId)
                  : undefined,
            }))
          : undefined,
    }).unwrap();
    toast.success('Template saved');
  };

  const isFooter = layout === 'footer';
  const dateLabel = format(parseISO(sheetDate), 'dd.MM.yyyy (EEE)');
  const partsActionLocked = isFooter && lines.length > 0;

  const footerPartsEditorContent = (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">What happens with parts on this visit?</Label>
        <div className="flex flex-wrap gap-1.5">
          <Button
            type="button"
            variant={footerPartsIntent === 'none' ? 'default' : 'outline'}
            size="sm"
            className="h-8"
            disabled={partsActionLocked}
            onClick={() => {
              setFooterPartsIntent('none');
              setLines([]);
              setPartDraft(emptyFooterPartDraft());
            }}
          >
            No parts
          </Button>
          {WORK_ORDER_ITEM_ACTION_OPTIONS.map((opt) => (
            <HoverCard key={opt.value} openDelay={120} closeDelay={80}>
              <HoverCardTrigger asChild>
                <Button
                  type="button"
                  variant={footerPartsIntent === opt.value ? 'default' : 'outline'}
                  size="sm"
                  className="h-8"
                  disabled={partsActionLocked}
                  onClick={() => {
                    setFooterPartsIntent(opt.value);
                    setPartsActionType(opt.value);
                  }}
                >
                  {opt.label}
                </Button>
              </HoverCardTrigger>
              <HoverCardPortal>
                <HoverCardContent
                  side="top"
                  align="center"
                  sideOffset={6}
                  collisionPadding={12}
                  className="z-[200] w-auto max-w-[min(18rem,calc(100vw-2rem))] p-3 text-xs leading-snug text-muted-foreground"
                >
                  {WORK_ORDER_ITEM_ACTION_EXPLAINER[opt.value]}
                </HoverCardContent>
              </HoverCardPortal>
            </HoverCard>
          ))}
        </div>
        {partsActionLocked ? (
          <p className="text-[10px] text-muted-foreground">
            Action locked for this visit. Remove all parts to change.
          </p>
        ) : null}
      </div>

      {lines.length > 0 ? (
        <div className="space-y-1 rounded-md border border-border/60">
          {lines.map((line) => (
            <div
              key={line.key}
              className="flex items-center justify-between gap-2 border-b border-border/60 px-3 py-2 last:border-b-0"
            >
              <div className="min-w-0 text-sm">
                <span className="font-medium text-foreground">{itemName(line.itemId)}</span>
                <span className="text-muted-foreground">
                  {' '}
                  · {line.quantity} · {partSourceLabel(line.sourceType)}
                  {partsActionType === 'REPLACE' && line.replacedItemId && (
                    <span> · replaces {itemName(line.replacedItemId)}</span>
                  )}
                </span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0"
                onClick={() => removeLine(line.key)}
              >
                <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
            </div>
          ))}
        </div>
      ) : footerPartsIntent === 'none' ? (
        <p className="text-xs text-muted-foreground">
          No parts used on this visit — close or save the entry when ready.
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">Add at least one part below, or choose No parts.</p>
      )}

      {footerPartsIntent !== 'none' ? (
      <div className="space-y-3 rounded-md border border-dashed border-border/60 bg-muted/20 p-3">
        <div className="grid grid-cols-2 gap-2">
          <div className="grid gap-1">
            <Label className="text-xs text-muted-foreground">
              {partsActionType === 'REPLACE' ? 'New item' : 'Item'}
            </Label>
            <ItemSelectSummaryButton
              ariaLabel={partsActionType === 'REPLACE' ? 'Select new item' : 'Select item'}
              selectedLabel={partDraft.itemId ? itemName(partDraft.itemId) : null}
              staleNumericId={partDraft.itemId || null}
              compactLabel
              className="h-9 min-h-9 py-0 text-sm"
              onClick={() => openItemPicker('item')}
            />
          </div>
          <div className="grid gap-1">
            <Label className="text-xs text-muted-foreground">Quantity</Label>
            <StepNumberInput
              min={0.01}
              step={1}
              value={partDraft.quantity}
              onChange={(e) => setPartDraft((d) => ({ ...d, quantity: e.target.value }))}
              className="h-9"
            />
          </div>
        </div>

        {partsActionType === 'REPLACE' && (
          <div className="grid gap-1">
            <Label className="text-xs text-muted-foreground">Part being replaced on machine</Label>
            <ItemSelectSummaryButton
              ariaLabel="Select part being replaced"
              selectedLabel={partDraft.replacedItemId ? itemName(partDraft.replacedItemId) : null}
              staleNumericId={partDraft.replacedItemId || null}
              compactLabel
              className="h-9 min-h-9 py-0 text-sm"
              onClick={() => openItemPicker('replaced')}
            />
          </div>
        )}

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full bg-background"
          disabled={!footerPartDraftValid}
          onClick={handleCommitFooterPart}
        >
          <Plus className="mr-1 h-3.5 w-3.5" />
          Add part
        </Button>
      </div>
      ) : null}
    </div>
  );

  const partsEditorContent = (
    <div className="space-y-2">
      {lines.map((line) => (
        <div key={line.key} className="flex flex-wrap items-end gap-2">
          <Select
            value={line.actionType}
            onValueChange={(v) =>
              setLines((prev) =>
                prev.map((l) => (l.key === line.key ? { ...l, actionType: v as WorkOrderItemActionType } : l)),
              )
            }
          >
            <SelectTrigger className="h-9 w-[110px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {WORK_ORDER_ITEM_ACTION_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={line.sourceType}
            onValueChange={(v) =>
              setLines((prev) =>
                prev.map((l) =>
                  l.key === line.key ? { ...l, sourceType: v as WorkOrderItemSourceType } : l,
                ),
              )
            }
          >
            <SelectTrigger className="h-9 w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="storage">Storage</SelectItem>
              <SelectItem value="machine">Machine</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={line.itemId}
            onValueChange={(v) =>
              setLines((prev) => prev.map((l) => (l.key === line.key ? { ...l, itemId: v } : l)))
            }
          >
            <SelectTrigger className="h-9 min-w-[140px] flex-1">
              <SelectValue placeholder="Item..." />
            </SelectTrigger>
            <SelectContent>
              {partItems.map((i) => (
                <SelectItem key={i.id} value={String(i.id)}>
                  {i.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {line.actionType === 'REPLACE' && (
            <Select
              value={line.replacedItemId || '__none__'}
              onValueChange={(v) =>
                setLines((prev) =>
                  prev.map((l) =>
                    l.key === line.key ? { ...l, replacedItemId: v === '__none__' ? '' : v } : l,
                  ),
                )
              }
            >
              <SelectTrigger className="h-9 min-w-[120px]">
                <SelectValue placeholder="Old part" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Old part...</SelectItem>
                {partItems.map((i) => (
                  <SelectItem key={i.id} value={String(i.id)}>
                    {i.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <StepNumberInput
            min={0.01}
            step={1}
            value={line.quantity}
            onChange={(e) =>
              setLines((prev) =>
                prev.map((l) => (l.key === line.key ? { ...l, quantity: e.target.value } : l)),
              )
            }
            className="h-9 w-20"
          />
          <Button type="button" variant="ghost" size="icon" className="h-9 w-9" onClick={() => removeLine(line.key)}>
            <Trash2 className="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={addLine}>
        <Plus className="h-3.5 w-3.5 mr-1" />
        Add part line
      </Button>
    </div>
  );

  const moreEditorContent = (
    <div className="space-y-3">
      <div className="grid gap-2 sm:grid-cols-2">
        <div className="grid gap-1">
          <Label className="text-xs text-muted-foreground">Priority</Label>
          <Select value={priority} onValueChange={(v) => setPriority(v as WorkOrderPriority)}>
            <SelectTrigger className="h-9">
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
      </div>

      {billTo === 'external' && (
        <div className="grid gap-1">
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
            <StepNumberInput
              min={0.01}
              step={1}
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              className="h-9 w-32"
              placeholder="Amount"
            />
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <Label className="text-xs text-muted-foreground shrink-0">Approvals</Label>
          <Badge variant="outline" className="text-[10px] font-normal shrink-0">
            {approverUserIds.length === 0
              ? 'Optional'
              : `${approverUserIds.length} assigned`}
          </Badge>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 shrink-0"
          onClick={() => setManageApprovalsOpen(true)}
        >
          <Wrench className="mr-1 h-3.5 w-3.5" />
          Manage
        </Button>
      </div>
    </div>
  );

  const submitButton = (
    <Button
      type="button"
      className="bg-brand-primary hover:bg-brand-primary-hover"
      disabled={isLoading || disabled}
      onClick={handleSubmit}
    >
      {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
      {submitLabel ?? (isEdit ? 'Save changes' : 'Save entry')}
    </Button>
  );

  const submitBar = !isFooter ? (
    <div className="flex justify-end gap-2">
      {onCancel && (
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      )}
      {submitButton}
    </div>
  ) : null;

  const workDateField =
    showWorkDate && !isEdit ? (
      <div className="space-y-1 pb-2">
        <div className="grid max-w-[11rem] gap-1">
          <Label className="text-xs text-muted-foreground">Work date</Label>
          <DatePickerField
            value={workDate}
            onChange={setWorkDate}
            triggerClassName="h-9 w-full px-3 text-sm"
            aria-label="Work date"
          />
        </div>
        {workDateHelper ? <p className="text-xs text-muted-foreground">{workDateHelper}</p> : null}
      </div>
    ) : null;

  const footerCoreFields = (
    <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
        <WorkOrderTemplateSelector
          compact
          value={selectedTemplateId}
          onValueChange={handleTemplateSelect}
          templates={templates}
          loading={loadingTemplateId != null}
          disabled={templatePickerDisabled}
          showHint={templateLocked}
          labelHint={FOOTER_TEMPLATE_HINT}
          helperText={
            templatePickerDisabled ? 'Clear manual entries to use a template.' : undefined
          }
          onSaveFromForm={handleSaveTemplate}
          canSaveFromForm={Boolean(worksTypeId)}
          defaultSectionId={sectionId}
          defaultMachineId={resolvedMachineId}
          machines={machinesInScope}
        />
        <div className={cn('grid gap-1', templateLocked && 'opacity-60')}>
          <Label className="text-xs text-muted-foreground">Machine</Label>
          <MachineSelectSummaryButton
            onClick={() => setMachinePickerOpen(true)}
            ariaLabel={
              selectedMachine
                ? `Change machine. Current: ${selectedMachine.name}`
                : 'Select machine'
            }
            selectedLine={selectedMachine?.name ?? null}
            staleNumericId={selectedMachine ? null : machineId || null}
            compactLabel
            disabled={templateLocked}
            className="mt-0 h-9 min-h-9 py-0 text-sm"
          />
          <MachineSelectorDialog
            open={machinePickerOpen}
            onOpenChange={setMachinePickerOpen}
            initialFactoryId={factoryId ?? undefined}
            initialSectionId={sectionId ?? undefined}
            title="Select machine"
            description="Pick factory and section, highlight a machine, then confirm."
            onSelect={(m) => setMachineId(String(m.id))}
          />
        </div>
        <div className={cn('grid gap-1', templateLocked && 'opacity-60')}>
          <Label className="text-xs text-muted-foreground">Works</Label>
          <Select value={worksTypeId} onValueChange={setWorksTypeId} disabled={templateLocked}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Type..." />
            </SelectTrigger>
            <SelectContent>
              {workOrderTypes.map((t) => (
                <SelectItem key={t.id} value={String(t.id)}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className={cn('grid gap-1', templateLocked && 'opacity-60')}>
          <Label className="text-xs text-muted-foreground">Who worked</Label>
          <Input
            value={workers}
            onChange={(e) => setWorkers(e.target.value)}
            placeholder="Ali, Rahim"
            className="h-9"
            disabled={templateLocked}
          />
        </div>
        <div className="grid gap-1 md:col-span-1 col-span-2">
          <Label className="text-xs text-muted-foreground">Remarks</Label>
          <Input value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Optional notes" className="h-9" />
        </div>
    </div>
  );

  const formBody = (
    <>
      {workDateField}
      {footerCoreFields}

      <div className="grid min-w-0 items-start gap-2 sm:grid-cols-2">
      <div className="min-w-0 rounded-md border border-border/60">
        <button
          type="button"
          className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium text-muted-foreground hover:bg-muted/40"
          onClick={() => setPartsOpen((open) => !open)}
        >
          {partsOpen ? <ChevronDown className="h-3.5 w-3.5 shrink-0" /> : <ChevronRight className="h-3.5 w-3.5 shrink-0" />}
          <span className="min-w-0 flex-1 truncate">Parts / consumables (optional)</span>
        </button>
        {partsOpen && (
          <div className="space-y-2 border-t border-border/60 px-3 pb-3 pt-2">
            {partsEditorContent}
          </div>
        )}
      </div>

      <div className="min-w-0 rounded-md border border-border/60">
        <button
          type="button"
          className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium text-muted-foreground hover:bg-muted/40"
          onClick={() => setMoreOpen((open) => !open)}
        >
          {moreOpen ? <ChevronDown className="h-3.5 w-3.5 shrink-0" /> : <ChevronRight className="h-3.5 w-3.5 shrink-0" />}
          <span className="min-w-0 flex-1 truncate">More options (billing, approval, priority)</span>
        </button>
        {moreOpen && (
          <div className="space-y-3 border-t border-border/60 px-3 pb-3 pt-2">
            {moreEditorContent}
          </div>
        )}
      </div>
      </div>
    </>
  );

  const footerChipOverlay = (variant: 'parts' | 'billing') => (
    <div className="absolute bottom-full left-0 right-0 z-30 flex max-h-[min(55vh,34rem)] flex-col overflow-hidden rounded-t-md border border-border/80 bg-card shadow-lg">
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border/60 px-3 py-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm text-foreground">
            <span className="font-medium">
              {variant === 'parts' ? 'Parts / consumables' : 'Billing & approvals'}
            </span>
            <span className="text-muted-foreground">
              {' '}
              · {variant === 'parts' ? partsChipSummary : moreSummary}
            </span>
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" className="h-8 shrink-0" onClick={closeFooterOverlays}>
          Done
        </Button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        {variant === 'parts' ? footerPartsEditorContent : moreEditorContent}
      </div>
    </div>
  );

  const footerActionBar = (
    <div className="shrink-0 border-t border-border/60 px-4 py-2">
      <div ref={footerActionBarRef} className="flex items-stretch gap-2">
        <div className="relative min-w-0 flex-1">
          {partsOverlayOpen && footerChipOverlay('parts')}
          <button
            type="button"
            className={cn(
              'flex h-full min-h-[3.5rem] w-full min-w-0 items-center justify-between gap-3 rounded-md border px-3 py-2.5 text-left hover:bg-muted/40',
              partsOverlayOpen
                ? 'border-brand-primary/40 bg-brand-primary/5'
                : 'border-border/60',
              templateLocked && 'cursor-not-allowed opacity-60 hover:bg-transparent',
            )}
            disabled={templateLocked}
            onClick={togglePartsOverlay}
          >
            <span className="shrink-0 text-sm font-medium text-foreground">Parts / consumables</span>
            <span className="min-w-0 truncate text-right text-xs text-muted-foreground">
              {partsChipSummary}
            </span>
          </button>
        </div>
        <div className="relative min-w-0 flex-1">
          {moreOverlayOpen && footerChipOverlay('billing')}
          <button
            type="button"
            className={cn(
              'flex h-full min-h-[3.5rem] w-full min-w-0 items-center justify-between gap-3 rounded-md border px-3 py-2.5 text-left hover:bg-muted/40',
              moreOverlayOpen
                ? 'border-brand-primary/40 bg-brand-primary/5'
                : 'border-border/60',
              templateLocked && 'cursor-not-allowed opacity-60 hover:bg-transparent',
            )}
            disabled={templateLocked}
            onClick={toggleMoreOverlay}
          >
            <span className="shrink-0 text-sm font-medium text-foreground">Billing & approvals</span>
            <span className="min-w-0 truncate text-right text-xs text-muted-foreground">
              {moreSummary}
            </span>
          </button>
        </div>
        <div className="shrink-0 self-center">{submitButton}</div>
      </div>
    </div>
  );

  return (
    <div
      className={
        isFooter
          ? 'flex h-full min-h-0 flex-col'
          : embedded
            ? 'space-y-3'
            : 'space-y-3 p-4'
      }
    >
      {isFooter && showFooterHeader && (
        <div className="shrink-0 px-4 pt-3 pb-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Add work · <span className="font-normal normal-case">{dateLabel}</span>
          </p>
        </div>
      )}

      {!embedded && !isFooter && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {isEdit ? 'Edit entry' : 'Add work'}
          </p>
          {showGenerateDay && factoryId != null && !isEdit && (
            <Button type="button" variant="outline" size="sm" disabled={generating} onClick={handleBulkGenerate}>
              {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5 mr-1" />}
              Generate day
            </Button>
          )}
        </div>
      )}

      {isFooter ? (
        <>
          <div
            className={cn(
              'max-h-[12rem] min-h-0 overflow-y-auto overscroll-contain px-4 pt-3 pb-2',
              disabled && 'pointer-events-none opacity-60',
            )}
          >
            {workDateField}
            {footerCoreFields}
          </div>
          {footerActionBar}
        </>
      ) : (
        <fieldset disabled={disabled} className="contents">
          {formBody}
        </fieldset>
      )}

      {submitBar}

      <ItemSelectorDialog
        open={itemPickerOpen}
        onOpenChange={setItemPickerOpen}
        onSelect={handleItemSelect}
        selectedItemId={
          itemPickerTarget === 'replaced'
            ? partDraft.replacedItemId
              ? Number(partDraft.replacedItemId)
              : undefined
            : partDraft.itemId
              ? Number(partDraft.itemId)
              : undefined
        }
        factoryId={isFooterLayout ? undefined : (factoryId ?? undefined)}
        defaultFactoryId={isFooterLayout ? (factoryId ?? undefined) : undefined}
        defaultSectionId={isFooterLayout ? (sectionId ?? undefined) : undefined}
        inventoryOnly={isFooterLayout}
        includeMachineStock={isFooterLayout}
        defaultMachineId={isFooterLayout ? (resolvedMachineId ?? undefined) : undefined}
        initialTab={itemPickerTarget === 'replaced' ? 'machine' : 'storage'}
        title={itemPickerTarget === 'replaced' ? 'Select part being replaced' : 'Select part'}
        description="Pick from factory storage or machine stock on hand."
      />

      <ManageWoApprovalsDialog
        draftMode
        open={manageApprovalsOpen}
        onOpenChange={setManageApprovalsOpen}
        approvers={draftApprovers}
        assignableMembers={assignableApproverMembers}
        onAddApprover={handleAddApprover}
        onRemoveApprover={handleRemoveApprover}
      />
    </div>
  );
};

export default SheetMaintenanceEntryForm;
