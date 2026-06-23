import React, { useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Building2,
  Package,
  Truck,
  FileText,
  CheckCircle2,
  CircleDashed,
  History,
  Clock,
  Loader2,
  MessageSquare,
  Send,
  Check,
  X,
  Pencil,
} from 'lucide-react';
import { SectionConfirmActions } from './PoSectionConfirmButton';
import { scrollToHighlightTarget } from '@/utils/poScrollHighlight';
import PoLinkedInvoiceCard from './PoLinkedInvoiceCard';
import PoInvoiceWorkflowChecklist from './PoInvoiceWorkflowChecklist';
import PoApprovalsTopBar from './PoApprovalsTopBar';
import ManagePoApprovalsDialog from './ManagePoApprovalsDialog';
import PoEditOrderItemsButton from './PoEditOrderItemsButton';
import EditPurchaseOrderItemsDialog from './EditPurchaseOrderItemsDialog';
import PoEventLogRow from './PoEventLogRow';
import BlockedActionButton from '@/components/newcomponents/customui/BlockedActionButton';
import DiscussionThread from '@/components/newcomponents/customui/DiscussionThread';
import {
  canConfirmPurchaseOrderSection,
  canConfirmPoInvoice,
  canRecordPoReceiving,
  getPurchaseOrderConfirmationsStatus,
  getPurchaseOrderApprovalSectionsStatus,
  isPoFinanciallyLocked,
  type PoLinkedInvoiceStatus,
  type PoSectionConfirmKey,
} from './purchaseOrderMilestones';
import AccountInvoiceDialog from '@/components/newcomponents/customui/accounts/AccountInvoiceDialog';
import {
  InvoiceConfirmDialog,
  InvoiceVoidDialog,
} from '@/components/newcomponents/customui/accounts/InvoiceLifecycleDialogs';
import {
  useGetAccountInvoiceByIdQuery,
  useConfirmAccountInvoiceMutation,
  useVoidAccountInvoiceMutation,
} from '@/features/accountInvoices/accountInvoicesApi';
import AccountSelectorDialog from '@/components/newcomponents/customui/AccountSelectorDialog';
import { AccountSelectSummaryButton } from '@/components/newcomponents/customui/AccountSelectSummaryButton';
import MachineSelectorDialog from '@/components/newcomponents/customui/MachineSelectorDialog';
import { MachineSelectSummaryButton } from '@/components/newcomponents/customui/MachineSelectSummaryButton';
import type { PurchaseOrder, UpdatePurchaseOrder } from '@/types/purchaseOrder';
import {
  useUpdatePurchaseOrderMutation,
  useSetPurchaseOrderSectionConfirmMutation,
  useGetPurchaseOrderByIdQuery,
  useGetPurchaseOrderItemsQuery,
  useUpdatePurchaseOrderItemMutation,
  useGetPurchaseOrderApproversQuery,
  useAddPurchaseOrderApproverMutation,
  useRemovePurchaseOrderApproverMutation,
  useApprovePurchaseOrderMutation,
  useUnapprovePurchaseOrderMutation,
  useGetPurchaseOrderEventsQuery,
  useCreateInvoiceFromPurchaseOrderMutation,
  useMarkPurchaseOrderCompleteMutation,
} from '@/features/purchaseOrders/purchaseOrdersApi';
import { useGetAccountsQuery } from '@/features/accounts/accountsApi';
import { useGetFactoriesQuery } from '@/features/factories/factoriesApi';
import { useGetMachinesQuery } from '@/features/machines/machinesApi';
import { useGetProjectsQuery } from '@/features/projects/projectsApi';
import { useGetWorkspaceMembersQuery } from '@/features/workspaces/workspaceApi';
import { useAppSelector } from '@/app/hooks';
import { API_LIMITS } from '@/constants/apiLimits';

const AVATAR_COLORS = [
  'bg-brand-primary',
  'bg-green-600',
  'bg-amber-600',
  'bg-sky-600',
  'bg-rose-600',
  'bg-violet-600',
  'bg-teal-600',
];

const initialsOf = (name: string | null | undefined): string => {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const avatarColor = (userId: number): string => AVATAR_COLORS[userId % AVATAR_COLORS.length];

interface PurchaseOrderDetailPanelProps {
  order: PurchaseOrder;
  onClose: () => void;
  onUpdated?: () => void;
  /** When false, completed orders are hidden from the sidebar list. */
  showCompleteOrders?: boolean;
}

/** Editable draft of the fields wired in this pass. */
interface PoDraft {
  account_id: number | null;
  destination_type: string;
  destination_id: number | null;
  order_date: string; // YYYY-MM-DD or ''
  expected_delivery_date: string; // YYYY-MM-DD or ''
  description: string;
  required_approvals: string; // '' = auto (all assigned)
}

const confirmedSectionCardClass = 'border-muted-foreground/15 bg-muted/20';
const confirmedSectionContentClass = 'opacity-[0.88] saturate-[0.92]';

const CONFIRM_EVENT_TYPES = new Set([
  'supplier_confirmed',
  'supplier_unconfirmed',
  'details_confirmed',
  'details_unconfirmed',
  'notes_confirmed',
  'notes_unconfirmed',
  'items_confirmed',
  'items_unconfirmed',
  'invoice_confirmed',
  'invoice_unconfirmed',
]);

const SECTION_CONFIRM_LABELS: Record<
  'supplier' | 'details' | 'items' | 'invoice',
  string
> = {
  supplier: 'Supplier',
  details: 'Order details',
  items: 'Order items',
  invoice: 'Draft invoice',
};

const draftFromOrder = (o: PurchaseOrder): PoDraft => ({
  account_id: o.account_id ?? null,
  destination_type: o.destination_type ?? 'storage',
  destination_id: o.destination_id ?? null,
  order_date: o.order_date ?? '',
  expected_delivery_date: o.expected_delivery_date ?? '',
  description: o.description ?? '',
  required_approvals: o.required_approvals != null ? String(o.required_approvals) : '',
});

const PurchaseOrderDetailPanel: React.FC<PurchaseOrderDetailPanelProps> = ({
  order: orderFromList,
  onUpdated,
  showCompleteOrders = false,
}) => {
  const { data: orderDetail } = useGetPurchaseOrderByIdQuery(orderFromList.id);
  const order = orderDetail ?? orderFromList;

  const [updatePurchaseOrder, { isLoading: isSaving }] = useUpdatePurchaseOrderMutation();
  const [setSectionConfirm] = useSetPurchaseOrderSectionConfirmMutation();
  const [ensureDraftInvoice, { isLoading: isEnsuringDraft }] =
    useCreateInvoiceFromPurchaseOrderMutation();
  const [markOrderComplete, { isLoading: isMarkingOrderComplete }] =
    useMarkPurchaseOrderCompleteMutation();
  const [confirmInvoice, { isLoading: isConfirmingInvoice }] = useConfirmAccountInvoiceMutation();
  const [voidInvoice, { isLoading: isVoidingInvoice }] = useVoidAccountInvoiceMutation();

  const { data: linkedInvoiceQuery } = useGetAccountInvoiceByIdQuery(order.invoice_id!, {
    skip: order.invoice_id == null,
  });
  const linkedInvoice =
    order.invoice_id != null && linkedInvoiceQuery?.id === order.invoice_id
      ? linkedInvoiceQuery
      : undefined;
  const linkedInvoiceStatus: PoLinkedInvoiceStatus = linkedInvoice?.invoice_status ?? null;
  const [confirmingSection, setConfirmingSection] = useState<
    'supplier' | 'details' | 'items' | 'invoice' | null
  >(null);
  const [editItemsOpen, setEditItemsOpen] = useState(false);
  const [unconfirmWarningOpen, setUnconfirmWarningOpen] = useState(false);
  const [pendingUnconfirmSection, setPendingUnconfirmSection] =
    useState<PoSectionConfirmKey | null>(null);
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [confirmInvoiceOpen, setConfirmInvoiceOpen] = useState(false);
  const [voidInvoiceOpen, setVoidInvoiceOpen] = useState(false);
  const [accountPickerOpen, setAccountPickerOpen] = useState(false);
  const [machinePickerOpen, setMachinePickerOpen] = useState(false);
  const [machineDisplayLine, setMachineDisplayLine] = useState('');
  const [manageApprovalsOpen, setManageApprovalsOpen] = useState(false);
  const [scrollHighlightTarget, setScrollHighlightTarget] = useState<
    PoSectionConfirmKey | 'approvals' | 'finalize' | 'receiving' | null
  >(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollHighlightGenerationRef = useRef(0);
  const ensureDraftInvoiceRef = useRef(false);

  const { workspace, user } = useAppSelector((s) => s.auth);
  const currentUserId = user?.id ?? null;

  const { data: accounts = [] } = useGetAccountsQuery({ skip: 0, limit: API_LIMITS.ACCOUNTS_LIST_MAX });
  const { data: factories = [] } = useGetFactoriesQuery({ skip: 0, limit: API_LIMITS.FLEXIBLE_1000 });
  const { data: machines = [] } = useGetMachinesQuery({ skip: 0, limit: API_LIMITS.FLEXIBLE_1000 });
  const { data: projects = [] } = useGetProjectsQuery({ skip: 0, limit: API_LIMITS.FLEXIBLE_1000 });
  const { data: members = [] } = useGetWorkspaceMembersQuery(workspace?.id ?? 0, {
    skip: !workspace?.id,
  });
  const { data: approversData } = useGetPurchaseOrderApproversQuery(order.id);
  const approvers = approversData?.approvers ?? [];
  const approvalSummary = approversData?.summary ?? { approved_count: 0, required: 0, met: true };

  const { data: items = [] } = useGetPurchaseOrderItemsQuery(order.id);
  const { data: events = [] } = useGetPurchaseOrderEventsQuery(order.id);
  const [showConfirmEvents, setShowConfirmEvents] = useState(true);

  const filteredEvents = useMemo(
    () =>
      showConfirmEvents ? events : events.filter((e) => !CONFIRM_EVENT_TYPES.has(e.event_type)),
    [events, showConfirmEvents]
  );
  const [updateItem] = useUpdatePurchaseOrderItemMutation();

  const [addApprover] = useAddPurchaseOrderApproverMutation();
  const [removeApprover] = useRemovePurchaseOrderApproverMutation();
  const [approveOrder, { isLoading: isApproving }] = useApprovePurchaseOrderMutation();
  const [unapproveOrder, { isLoading: isUnapproving }] = useUnapprovePurchaseOrderMutation();

  // Show all assigned approvers in the header, approved first.
  const myApproval = currentUserId != null ? approvers.find((a) => a.user_id === currentUserId) : undefined;
  const assignedUserIds = new Set(approvers.map((a) => a.user_id));
  const assignableMembers = members.filter(
    (m) => m.status === 'active' && !assignedUserIds.has(m.user_id)
  );

  const handleAddApprover = async (userId: number) => {
    try {
      await addApprover({ poId: order.id, user_id: userId }).unwrap();
      toast.success('Approver added');
    } catch (err: unknown) {
      const e = err as { data?: { detail?: string } };
      toast.error(e?.data?.detail || 'Failed to add approver');
    }
  };

  const handleRemoveApprover = async (userId: number) => {
    try {
      await removeApprover({ poId: order.id, userId }).unwrap();
      toast.success('Approver removed');
    } catch (err: unknown) {
      const e = err as { data?: { detail?: string } };
      toast.error(e?.data?.detail || 'Failed to remove approver');
    }
  };

  const handleToggleMyApproval = async () => {
    try {
      if (myApproval?.approved) {
        if (linkedInvoiceStatus === 'locked') {
          toast.error('Cannot withdraw approval — invoice is locked');
          return;
        }
        await unapproveOrder(order.id).unwrap();
        toast.success('Approval withdrawn');
      } else {
        const approvalSections = getPurchaseOrderApprovalSectionsStatus(order);
        if (!approvalSections.allConfirmed) {
          toast.error(approvalSections.reason ?? 'Confirm all sections before approving');
          return;
        }
        await approveOrder(order.id).unwrap();
        toast.success('Approved');
      }
    } catch (err: unknown) {
      const e = err as { data?: { detail?: string } };
      toast.error(e?.data?.detail || 'Failed to update approval');
    }
  };

  // Page-wide edit draft. Reset whenever a different order is opened.
  const [draft, setDraft] = useState<PoDraft>(() => draftFromOrder(order));
  useEffect(() => {
    setDraft(draftFromOrder(order));
    setMachineDisplayLine('');
  }, [order.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (draft.destination_type !== 'machine' || draft.destination_id == null) {
      return;
    }
    const machine = machines.find((m) => m.id === draft.destination_id);
    if (machine) {
      setMachineDisplayLine((prev) => prev || machine.name);
    }
  }, [draft.destination_type, draft.destination_id, machines]);

  const patch = (changes: Partial<PoDraft>) => setDraft((d) => ({ ...d, ...changes }));

  // Build a payload of only the fields that differ from the saved order.
  const invoiceLocked = isPoFinanciallyLocked(linkedInvoiceStatus);
  const supplierConfirmed = order.supplier_confirmed ?? false;
  const detailsConfirmed = order.details_confirmed ?? false;
  const itemsConfirmed = order.items_confirmed ?? false;
  const supplierDisabled = invoiceLocked || supplierConfirmed;
  const coreDetailsDisabled = invoiceLocked || detailsConfirmed;
  const itemsSectionConfirmed = itemsConfirmed || invoiceLocked;

  const confirmReadiness = canConfirmPoInvoice(order, approvalSummary.met, linkedInvoiceStatus);
  const receivingReadiness = canRecordPoReceiving(linkedInvoiceStatus);
  const effectiveAccountId = draft.account_id ?? order.account_id ?? null;
  const hasSupplier = effectiveAccountId != null;
  const hasSavedSupplier = order.account_id != null;
  const hasUnsavedSupplier =
    draft.account_id != null && draft.account_id !== order.account_id;
  const confirmationsStatus = getPurchaseOrderConfirmationsStatus(order);
  const approvalSectionsStatus = getPurchaseOrderApprovalSectionsStatus(order);

  const effectiveOrderFields = useMemo(
    () => ({
      account_id: draft.account_id ?? order.account_id ?? null,
      destination_type: draft.destination_type ?? order.destination_type ?? null,
      destination_id: draft.destination_id ?? order.destination_id ?? null,
      order_date: draft.order_date || order.order_date || null,
    }),
    [draft, order]
  );

  const sectionConfirmReadiness = useMemo(
    () => ({
      supplier: canConfirmPurchaseOrderSection('supplier', effectiveOrderFields, items),
      details: canConfirmPurchaseOrderSection('details', effectiveOrderFields, items),
      items: canConfirmPurchaseOrderSection('items', effectiveOrderFields, items),
      invoice: canConfirmPurchaseOrderSection(
        'invoice',
        order,
        items,
        linkedInvoiceStatus,
        order.invoice_id
      ),
    }),
    [effectiveOrderFields, items, order, linkedInvoiceStatus]
  );

  useEffect(() => {
    if (!scrollHighlightTarget) return;
    const timer = window.setTimeout(() => setScrollHighlightTarget(null), 3500);
    return () => window.clearTimeout(timer);
  }, [scrollHighlightTarget]);

  const clearScrollHighlights = () => {
    setScrollHighlightTarget(null);
  };

  const dismissScrollHighlight = clearScrollHighlights;

  const scrollToPoSection = (section: PoSectionConfirmKey) => {
    const generation = ++scrollHighlightGenerationRef.current;
    const cardId =
      section === 'supplier'
        ? 'po-section-supplier'
        : section === 'details'
          ? 'po-section-details'
          : section === 'invoice'
            ? 'po-section-invoice'
            : 'po-section-items';
    const confirmEl = document.getElementById(`po-confirm-${section}`);
    const element = confirmEl ?? document.getElementById(cardId);

    clearScrollHighlights();

    void scrollToHighlightTarget({
      container: scrollContainerRef.current,
      element,
      onScrollStart: () => {},
      onScrollEnd: () => {
        if (generation !== scrollHighlightGenerationRef.current) return;
        setScrollHighlightTarget(section);
      },
    });
  };

  const scrollToFinalizeInvoice = () => {
    const generation = ++scrollHighlightGenerationRef.current;
    const element = document.getElementById('po-finalize-invoice-btn');

    clearScrollHighlights();

    void scrollToHighlightTarget({
      container: scrollContainerRef.current,
      element,
      onScrollStart: () => {},
      onScrollEnd: () => {
        if (generation !== scrollHighlightGenerationRef.current) return;
        setScrollHighlightTarget('finalize');
      },
    });
  };

  const scrollToManageApprovalsCard = () => {
    const generation = ++scrollHighlightGenerationRef.current;
    const element = document.getElementById('po-section-approvals');

    clearScrollHighlights();

    void scrollToHighlightTarget({
      container: scrollContainerRef.current,
      element,
      onScrollStart: () => {},
      onScrollEnd: () => {
        if (generation !== scrollHighlightGenerationRef.current) return;
        setScrollHighlightTarget('approvals');
      },
    });
  };

  const scrollToManageReceiving = () => {
    const generation = ++scrollHighlightGenerationRef.current;
    const element = document.getElementById('po-manage-receiving-btn');

    clearScrollHighlights();

    void scrollToHighlightTarget({
      container: scrollContainerRef.current,
      element,
      onScrollStart: () => {},
      onScrollEnd: () => {
        if (generation !== scrollHighlightGenerationRef.current) return;
        setScrollHighlightTarget('receiving');
      },
    });
  };

  const openManageApprovals = () => setManageApprovalsOpen(true);

  const changedFields = useMemo<UpdatePurchaseOrder>(() => {
    const payload: UpdatePurchaseOrder = {};
    if (!supplierDisabled) {
      if (draft.account_id != null && draft.account_id !== order.account_id) {
        payload.account_id = draft.account_id;
      }
    }
    if (!coreDetailsDisabled) {
      if (draft.destination_type !== order.destination_type) {
        payload.destination_type = draft.destination_type;
      }
      if (draft.destination_id != null && draft.destination_id !== order.destination_id) {
        payload.destination_id = draft.destination_id;
      }
      const orderDate = draft.order_date || null;
      if (orderDate !== (order.order_date ?? null)) payload.order_date = orderDate;
      const desc = draft.description.trim() ? draft.description : null;
      if (desc !== (order.description ?? null)) payload.description = desc;
    }
    const expDate = draft.expected_delivery_date || null;
    if (expDate !== (order.expected_delivery_date ?? null)) payload.expected_delivery_date = expDate;
    const required = draft.required_approvals.trim() === '' ? null : Number(draft.required_approvals);
    if (required !== (order.required_approvals ?? null)) payload.required_approvals = required;
    return payload;
  }, [draft, order, supplierDisabled, coreDetailsDisabled]);

  useEffect(() => {
    if (!hasSavedSupplier || order.invoice_id != null || invoiceLocked || isSaving) return;
    if (ensureDraftInvoiceRef.current) return;
    ensureDraftInvoiceRef.current = true;
    void ensureDraftInvoice(order.id)
      .unwrap()
      .then(() => onUpdated?.())
      .catch((err: unknown) => {
        const status = (err as { status?: number })?.status;
        if (status === 409) {
          onUpdated?.();
          return;
        }
        const detail = (err as { data?: { detail?: unknown } })?.data?.detail;
        if (
          status === 422 &&
          typeof detail === 'string' &&
          detail.includes('Assign a supplier')
        ) {
          onUpdated?.();
          return;
        }
        const message =
          typeof detail === 'string'
            ? detail
            : 'Could not create a draft invoice for this order. Item edits may fail until this is resolved.';
        toast.error(message);
      })
      .finally(() => {
        ensureDraftInvoiceRef.current = false;
      });
  }, [
    order.id,
    order.invoice_id,
    hasSavedSupplier,
    invoiceLocked,
    isSaving,
    ensureDraftInvoice,
    onUpdated,
  ]);

  const handleConfirmInvoice = async () => {
    if (!order.invoice_id || !confirmReadiness.ok) return;
    try {
      await confirmInvoice(order.invoice_id).unwrap();
      toast.success('Invoice confirmed — order is now locked');
      setConfirmInvoiceOpen(false);
      onUpdated?.();
    } catch (err: unknown) {
      const e = err as { data?: { detail?: string } };
      toast.error(e?.data?.detail || 'Failed to confirm invoice');
    }
  };

  const storageFactoryName =
    order.destination_type === 'storage'
      ? factories.find((f) => f.id === order.destination_id)?.name
      : undefined;

  const handleMarkOrderComplete = async () => {
    try {
      await markOrderComplete(order.id).unwrap();
      const baseMessage =
        order.destination_type === 'storage'
          ? storageFactoryName
            ? `Purchase order complete — items added to ${storageFactoryName} storage`
            : 'Purchase order complete — items added to factory storage'
          : 'Purchase order marked complete';
      const listHint = showCompleteOrders
        ? ''
        : ' Hidden from open orders list — enable Complete in the sidebar to see it there.';
      toast.success(`${baseMessage}${listHint}`);
      onUpdated?.();
    } catch (err: unknown) {
      const e = err as { data?: { detail?: string } };
      toast.error(e?.data?.detail || 'Failed to mark order complete');
    }
  };

  const handleVoidInvoice = async (voidNote: string) => {
    if (!order.invoice_id) return;
    try {
      await voidInvoice({ id: order.invoice_id, void_note: voidNote }).unwrap();
      toast.success('Invoice voided — order approvals cleared and order is editable again');
      setVoidInvoiceOpen(false);
      if (order.account_id != null) {
        try {
          await ensureDraftInvoice(order.id).unwrap();
        } catch {
          /* backend void handler may have already synced the draft */
        }
      }
      onUpdated?.();
    } catch (err: unknown) {
      const e = err as { data?: { detail?: string } };
      toast.error(e?.data?.detail || 'Failed to void invoice');
    }
  };

  const sectionSaveKeys: Record<PoSectionConfirmKey, (keyof UpdatePurchaseOrder)[]> = {
    supplier: ['account_id'],
    details: ['destination_type', 'destination_id', 'order_date', 'description'],
    items: [],
    invoice: [],
  };

  const sectionHasUnsavedChanges = (section: PoSectionConfirmKey): boolean =>
    sectionSaveKeys[section].some((key) => key in changedFields);

  const saveSectionFields = async (section: PoSectionConfirmKey): Promise<boolean> => {
    const payload: UpdatePurchaseOrder = {};
    for (const key of sectionSaveKeys[section]) {
      if (key in changedFields) {
        (payload as Record<string, unknown>)[key] = changedFields[key];
      }
    }
    if (Object.keys(payload).length === 0) return true;
    try {
      await updatePurchaseOrder({ id: order.id, data: payload }).unwrap();
      return true;
    } catch (err: unknown) {
      const e = err as { data?: { detail?: string } };
      toast.error(e?.data?.detail || 'Failed to save section changes');
      return false;
    }
  };

  const requestSectionConfirmToggle = (
    section: PoSectionConfirmKey,
    currentlyConfirmed: boolean
  ) => {
    if (!currentlyConfirmed) {
      if (!sectionConfirmReadiness[section].ok) {
        toast.error(sectionConfirmReadiness[section].reason ?? 'Section not ready to confirm');
        return;
      }
      void handleToggleSectionConfirm(section, true);
      return;
    }
    setPendingUnconfirmSection(section);
    setUnconfirmWarningOpen(true);
  };

  const handleConfirmSectionUnconfirm = () => {
    if (!pendingUnconfirmSection) return;
    const section = pendingUnconfirmSection;
    setUnconfirmWarningOpen(false);
    setPendingUnconfirmSection(null);
    void handleToggleSectionConfirm(section, false);
  };

  const handleToggleSectionConfirm = async (
    section: 'supplier' | 'details' | 'items' | 'invoice',
    nextConfirmed: boolean
  ) => {
    setConfirmingSection(section);
    try {
      if (
        nextConfirmed &&
        section !== 'invoice' &&
        sectionHasUnsavedChanges(section as PoSectionConfirmKey)
      ) {
        const saved = await saveSectionFields(section as PoSectionConfirmKey);
        if (!saved) return;
      }
      await setSectionConfirm({ poId: order.id, section, confirmed: nextConfirmed }).unwrap();
      const label = SECTION_CONFIRM_LABELS[section];
      toast.success(nextConfirmed ? `${label} confirmed` : `${label} unconfirmed`);
      onUpdated?.();
    } catch (err: unknown) {
      const e = err as { data?: { detail?: string } };
      toast.error(e?.data?.detail || 'Failed to update confirm');
    } finally {
      setConfirmingSection(null);
    }
  };

  const isDirty = Object.keys(changedFields).length > 0;

  const handleSave = async () => {
    if (!isDirty) return;
    try {
      await updatePurchaseOrder({ id: order.id, data: changedFields }).unwrap();
      toast.success('Purchase order updated');
      onUpdated?.();
    } catch (err: unknown) {
      const e = err as { data?: { detail?: string } };
      toast.error(e?.data?.detail || 'Failed to save changes');
    }
  };

  const handleDiscard = () => setDraft(draftFromOrder(order));

  const locationOptions =
    draft.destination_type === 'storage'
      ? factories.map((f) => ({ id: f.id, name: f.name }))
      : projects.map((p) => ({ id: p.id, name: p.name }));

  // --- order items (wired) ---
  const totalOrdered = items.reduce((sum, i) => sum + Number(i.quantity_ordered), 0);
  const totalReceived = items.reduce((sum, i) => sum + Number(i.quantity_received), 0);
  const fullyReceivedCount = items.filter(
    (i) => Number(i.quantity_received) >= Number(i.quantity_ordered)
  ).length;
  const subtotal = Number(order.subtotal ?? 0);

  // Receiving dialog: stagedReceived = local totals; receivingDraft = incremental qty applied on save.
  const [receivingOpen, setReceivingOpen] = useState(false);
  const [stagedReceived, setStagedReceived] = useState<Record<number, number>>({});
  const [receivingDraft, setReceivingDraft] = useState<Record<number, string>>({});
  const [usingDirectReceive, setUsingDirectReceive] = useState<Record<number, boolean>>({});
  const [directEditOpen, setDirectEditOpen] = useState<Record<number, boolean>>({});
  const [savingReceiving, setSavingReceiving] = useState(false);

  const stagedReceivedFor = (item: { id: number; quantity_received: number }) =>
    stagedReceived[item.id] ?? Number(item.quantity_received);

  const openReceiving = () => {
    const staged: Record<number, number> = {};
    const draft: Record<number, string> = {};
    for (const it of items) {
      staged[it.id] = Number(it.quantity_received);
      draft[it.id] = '';
    }
    setStagedReceived(staged);
    setReceivingDraft(draft);
    setUsingDirectReceive({});
    setDirectEditOpen({});
    setReceivingOpen(true);
  };

  const closeReceiving = () => {
    if (savingReceiving) return;
    setReceivingOpen(false);
    setStagedReceived({});
    setReceivingDraft({});
    setUsingDirectReceive({});
    setDirectEditOpen({});
  };

  const setDirectReceived = (
    itemId: number,
    ordered: number,
    raw: string,
    currentReceived: number
  ) => {
    setReceivingDraft((d) => ({ ...d, [itemId]: '' }));
    if (raw === '') return;
    let n = Number(raw);
    if (!Number.isFinite(n)) return;
    n = Math.max(0, Math.min(ordered, n));
    if (n !== currentReceived) {
      setUsingDirectReceive((prev) => ({ ...prev, [itemId]: true }));
    }
    setStagedReceived((prev) => ({ ...prev, [itemId]: n }));
  };

  const addNowFor = (item: { id: number; quantity_ordered: number; quantity_received: number }) => {
    const raw = Number(receivingDraft[item.id] ?? '');
    if (!Number.isFinite(raw) || raw <= 0) return 0;
    return Math.floor(raw);
  };

  const effectiveReceivedFor = (item: {
    id: number;
    quantity_ordered: number;
    quantity_received: number;
  }) =>
    Math.min(
      Number(item.quantity_ordered),
      stagedReceivedFor(item) + addNowFor(item)
    );

  const receivingTotalRemaining = items.reduce(
    (sum, it) => sum + Math.max(0, Number(it.quantity_ordered) - effectiveReceivedFor(it)),
    0
  );
  const hasReceivingChanges = items.some(
    (it) => effectiveReceivedFor(it) !== Number(it.quantity_received)
  );
  const receivingChangeUnits = items.reduce(
    (sum, it) => sum + Math.abs(effectiveReceivedFor(it) - Number(it.quantity_received)),
    0
  );

  const handleSaveReceiving = async () => {
    const toUpdate = items
      .map((it) => ({
        it,
        newReceived: effectiveReceivedFor(it),
      }))
      .filter(({ it, newReceived }) => newReceived !== Number(it.quantity_received));
    if (toUpdate.length === 0) {
      closeReceiving();
      return;
    }
    setSavingReceiving(true);
    try {
      for (const { it, newReceived } of toUpdate) {
        await updateItem({
          itemId: it.id,
          poId: order.id,
          data: { quantity_received: newReceived },
        }).unwrap();
      }
      toast.success('Receiving saved');
      closeReceiving();
      onUpdated?.();
    } catch (err: unknown) {
      const e = err as { data?: { detail?: string } };
      toast.error(e?.data?.detail || 'Failed to save receiving');
    } finally {
      setSavingReceiving(false);
    }
  };

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v);
  const formatDate = (d: string | null | undefined) =>
    d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden bg-background">
      <div className="flex flex-1 min-h-0">
        <div
          ref={scrollContainerRef}
          className="flex-1 min-h-0 overflow-y-auto p-6 space-y-6"
        >
        <PoApprovalsTopBar
          approvers={approvers}
          approvalSummary={approvalSummary}
          currentUserId={currentUserId}
          myApproval={myApproval}
          approvalSectionsStatus={approvalSectionsStatus}
          approvalWithdrawBlocked={linkedInvoiceStatus === 'locked'}
          isApproving={isApproving}
          isUnapproving={isUnapproving}
          highlighted={scrollHighlightTarget === 'approvals'}
          onHighlightDismiss={dismissScrollHighlight}
          onManage={openManageApprovals}
          onToggleMyApproval={handleToggleMyApproval}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 lg:grid-rows-[auto_auto] gap-4 lg:items-stretch">
          {/* Order Details */}
          <Card
            id="po-section-details"
            className={cn(
              'order-1 lg:col-span-2 lg:row-start-1 flex flex-col scroll-mt-6',
              coreDetailsDisabled && confirmedSectionCardClass
            )}
          >
            <CardHeader className="p-4 pb-2 shrink-0">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  Order Details
                </CardTitle>
                {invoiceLocked ? (
                  <SectionConfirmActions
                    confirmed
                    invoiceLocked
                    label="order details"
                    variant="system"
                  />
                ) : (
                  <SectionConfirmActions
                    id="po-confirm-details"
                    confirmed={detailsConfirmed}
                    invoiceLocked={invoiceLocked}
                    onToggle={() => requestSectionConfirmToggle('details', detailsConfirmed)}
                    isLoading={confirmingSection === 'details'}
                    label="order details"
                    highlighted={scrollHighlightTarget === 'details'}
                    onHighlightDismiss={dismissScrollHighlight}
                  />
                )}
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-3">
              <div
                className={cn(
                  'space-y-3',
                  coreDetailsDisabled && confirmedSectionContentClass
                )}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wide">Destination Type</Label>
                    <Select
                      value={draft.destination_type}
                      onValueChange={(v) => {
                        patch({ destination_type: v, destination_id: null });
                        setMachineDisplayLine('');
                      }}
                      disabled={coreDetailsDisabled}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="storage">Storage</SelectItem>
                        <SelectItem value="machine">Machine</SelectItem>
                        <SelectItem value="project">Project</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wide">Location</Label>
                    {draft.destination_type === 'machine' ? (
                      <>
                        <MachineSelectSummaryButton
                          onClick={() => {
                            if (!coreDetailsDisabled) setMachinePickerOpen(true);
                          }}
                          ariaLabel={
                            machineDisplayLine
                              ? `Change machine. Current: ${machineDisplayLine}`
                              : 'Select machine'
                          }
                          selectedLine={machineDisplayLine || null}
                          staleNumericId={
                            machineDisplayLine || draft.destination_id == null
                              ? null
                              : String(draft.destination_id)
                          }
                          className={cn('mt-0', coreDetailsDisabled && 'pointer-events-none')}
                        />
                        <MachineSelectorDialog
                          open={machinePickerOpen}
                          onOpenChange={setMachinePickerOpen}
                          title="Select destination machine"
                          description="Pick factory and section, highlight a machine, then confirm."
                          onSelect={(m, ctx) => {
                            patch({ destination_id: m.id });
                            setMachineDisplayLine(
                              `${ctx.factoryAbbreviation} · ${ctx.sectionAbbreviation} · ${ctx.machineName}`
                            );
                          }}
                        />
                      </>
                    ) : (
                      <Select
                        value={draft.destination_id != null ? String(draft.destination_id) : undefined}
                        onValueChange={(v) => patch({ destination_id: Number(v) })}
                        disabled={coreDetailsDisabled}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select location" />
                        </SelectTrigger>
                        <SelectContent>
                          {locationOptions.map((opt) => (
                            <SelectItem key={opt.id} value={String(opt.id)}>
                              {opt.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wide">Order Date</Label>
                    <Input
                      type="date"
                      value={draft.order_date}
                      onChange={(e) => patch({ order_date: e.target.value })}
                      disabled={coreDetailsDisabled}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label
                      className={cn(
                        'text-xs uppercase tracking-wide',
                        coreDetailsDisabled
                          ? 'font-medium text-card-foreground dark:text-foreground'
                          : 'text-muted-foreground'
                      )}
                    >
                      Expected Delivery
                    </Label>
                    <Input
                      type="date"
                      value={draft.expected_delivery_date}
                      onChange={(e) => patch({ expected_delivery_date: e.target.value })}
                      className={coreDetailsDisabled ? 'bg-background' : undefined}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wide">Completed</Label>
                    <div className="flex items-center gap-2 h-9 px-3 rounded-md border border-dashed border-border bg-muted/30 text-sm">
                      {order.actual_delivery_date ? (
                        <span className="text-card-foreground">{formatDate(order.actual_delivery_date)}</span>
                      ) : (
                        <span className="text-muted-foreground text-xs leading-tight">
                          Set when all items received
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide">Description</Label>
                  <Textarea
                    placeholder="Add a description for this order..."
                    value={draft.description}
                    onChange={(e) => patch({ description: e.target.value })}
                    className="min-h-[56px] resize-none"
                    disabled={coreDetailsDisabled}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Supplier */}
          <Card
            id="po-section-supplier"
            className={cn(
              'order-2 lg:col-span-2 lg:row-start-2 scroll-mt-6',
              supplierDisabled && confirmedSectionCardClass
            )}
          >
            <CardHeader className="p-4 pb-2">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  Supplier
                </CardTitle>
                {invoiceLocked ? (
                  <SectionConfirmActions
                    confirmed
                    invoiceLocked
                    label="supplier"
                    variant="system"
                  />
                ) : (
                  <SectionConfirmActions
                    id="po-confirm-supplier"
                    confirmed={supplierConfirmed}
                    invoiceLocked={invoiceLocked}
                    onToggle={() => requestSectionConfirmToggle('supplier', supplierConfirmed)}
                    isLoading={confirmingSection === 'supplier'}
                    label="supplier"
                    highlighted={scrollHighlightTarget === 'supplier'}
                    onHighlightDismiss={dismissScrollHighlight}
                  />
                )}
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className={supplierDisabled ? confirmedSectionContentClass : undefined}>
                <AccountSelectSummaryButton
                  onClick={() => {
                    if (!supplierDisabled) setAccountPickerOpen(true);
                  }}
                  ariaLabel={
                    draft.account_id != null
                      ? `Change supplier. Current account ID ${draft.account_id}`
                      : 'Select supplier'
                  }
                  selectedLine={accounts.find((a) => a.id === draft.account_id)?.name ?? null}
                  staleNumericId={draft.account_id != null ? String(draft.account_id) : null}
                  className={cn('mt-0', supplierDisabled && 'pointer-events-none')}
                />
                <AccountSelectorDialog
                  open={accountPickerOpen}
                  onOpenChange={setAccountPickerOpen}
                  title="Select supplier"
                  description="Search and pick the supplier account for this purchase order."
                  selectedAccountId={draft.account_id ?? undefined}
                  onSelect={(account) => {
                    if (!account) return;
                    patch({ account_id: account.id });
                  }}
                />
              </div>
            </CardContent>
          </Card>

          <PoInvoiceWorkflowChecklist
            className="order-3 lg:col-start-3 lg:row-start-1 lg:row-span-2 h-full scroll-mt-6"
            invoiceId={order.invoice_id ?? null}
            invoiceStatus={linkedInvoiceStatus}
            hasSupplier={hasSupplier}
            confirmationsStatus={confirmationsStatus}
            sections={[
              {
                section: 'details',
                label: 'Order details',
                confirmed: detailsConfirmed,
                readinessHint: sectionConfirmReadiness.details.ok
                  ? undefined
                  : sectionConfirmReadiness.details.reason,
              },
              {
                section: 'supplier',
                label: 'Supplier',
                confirmed: supplierConfirmed,
                readinessHint: sectionConfirmReadiness.supplier.ok
                  ? undefined
                  : sectionConfirmReadiness.supplier.reason,
              },
              {
                section: 'items',
                label: 'Items',
                confirmed: itemsConfirmed,
                readinessHint: sectionConfirmReadiness.items.ok
                  ? undefined
                  : sectionConfirmReadiness.items.reason,
              },
            ]}
            approvalSummary={approvalSummary}
            items={items}
            orderCompleted={
              order.order_completed || order.current_status_name === 'Complete'
            }
            onMarkOrderComplete={handleMarkOrderComplete}
            isMarkingOrderComplete={isMarkingOrderComplete}
            destinationType={order.destination_type}
            storageFactoryName={storageFactoryName}
            onScrollToSection={scrollToPoSection}
            onScrollToFinalize={scrollToFinalizeInvoice}
            onScrollToManageApprovals={scrollToManageApprovalsCard}
            onScrollToReceiving={scrollToManageReceiving}
          />
        </div>

        {/* Order Items (WIRED) */}
        <Card
          id="po-section-items"
          className={cn('scroll-mt-6', itemsSectionConfirmed && confirmedSectionCardClass)}
        >
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <CardTitle
                className={`text-base flex items-center gap-2 ${itemsSectionConfirmed ? confirmedSectionContentClass : ''}`}
              >
                <Package className="h-4 w-4 text-muted-foreground" />
                Order Items and Prices
                <Badge variant="outline" className="ml-1 font-normal">{items.length}</Badge>
              </CardTitle>
              <div className="flex items-center gap-2 shrink-0">
                {invoiceLocked ? (
                  <SectionConfirmActions
                    confirmed
                    invoiceLocked
                    label="order items and prices"
                    variant="system"
                  />
                ) : (
                  <SectionConfirmActions
                    id="po-confirm-items"
                    confirmed={itemsConfirmed}
                    invoiceLocked={invoiceLocked}
                    onToggle={() => requestSectionConfirmToggle('items', itemsConfirmed)}
                    isLoading={confirmingSection === 'items'}
                    label="order items and prices"
                    highlighted={scrollHighlightTarget === 'items'}
                    onHighlightDismiss={dismissScrollHighlight}
                  />
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className={`pt-0 ${itemsSectionConfirmed ? confirmedSectionContentClass : ''}`}>
            {items.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border bg-muted/20 px-4 py-8 text-center">
                <Package className="h-6 w-6 text-muted-foreground/50 mx-auto mb-1" />
                <p className="text-sm font-medium text-muted-foreground">No items on this order</p>
              </div>
            ) : (
              <div className="border border-border rounded-lg overflow-hidden">
                <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="py-2 w-12 text-center">#</TableHead>
                        <TableHead className="py-2">Item</TableHead>
                        <TableHead className="py-2 text-right w-24">Ordered</TableHead>
                        {receivingReadiness.ok ? (
                          <TableHead className="py-2 text-right w-28">Received</TableHead>
                        ) : null}
                        <TableHead className="py-2 text-right w-24">Unit Price</TableHead>
                        <TableHead className="py-2 text-right w-28">Subtotal</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((item) => {
                        const ordered = Number(item.quantity_ordered);
                        const received = Number(item.quantity_received);
                        const isComplete = received >= ordered;
                        return (
                          <TableRow
                            key={item.id}
                            className={
                              receivingReadiness.ok && isComplete
                                ? 'bg-green-50/50 dark:bg-green-950/20'
                                : ''
                            }
                          >
                            <TableCell className="py-2 text-center text-muted-foreground text-sm">{item.line_number}</TableCell>
                            <TableCell className="py-2">
                              <span className="font-medium text-sm">{item.item_name ?? `Item #${item.item_id}`}</span>
                            </TableCell>
                            <TableCell className="py-2 text-right text-sm">
                              {ordered} {item.item_unit ?? ''}
                            </TableCell>
                            {receivingReadiness.ok ? (
                              <TableCell className="py-2 text-right text-sm">
                                <span
                                  className={
                                    isComplete
                                      ? 'text-green-600 dark:text-green-400 font-medium'
                                      : received > 0
                                        ? 'text-amber-600 dark:text-amber-400 font-medium'
                                        : 'text-muted-foreground'
                                  }
                                >
                                  {received} / {ordered}
                                </span>
                              </TableCell>
                            ) : null}
                            <TableCell className="py-2 text-right text-sm">{formatCurrency(Number(item.unit_price))}</TableCell>
                            <TableCell className="py-2 text-right text-sm font-medium">{formatCurrency(Number(item.line_subtotal))}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
            )}
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                {receivingReadiness.ok ? (
                  <BlockedActionButton
                    id="po-manage-receiving-btn"
                    size="sm"
                    className={cn(
                      'h-8 w-fit bg-brand-primary hover:bg-brand-primary-hover text-primary-foreground',
                      scrollHighlightTarget === 'receiving' && 'po-scroll-target-highlight'
                    )}
                    onMouseEnter={dismissScrollHighlight}
                    onAction={openReceiving}
                    blocked={items.length === 0}
                    blockedHint={
                      items.length === 0
                        ? { title: 'No items', reason: 'Add line items before recording receiving' }
                        : undefined
                    }
                  >
                    <Truck className="h-4 w-4 mr-1" />
                    Manage receiving
                  </BlockedActionButton>
                ) : !invoiceLocked ? (
                  <PoEditOrderItemsButton
                    itemsConfirmed={itemsConfirmed}
                    onEdit={() => setEditItemsOpen(true)}
                    className="h-8 w-fit"
                  />
                ) : null}
                {receivingReadiness.ok ? (
                  <span
                    className={`text-xs font-medium ${
                      totalOrdered > 0 && totalReceived >= totalOrdered
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-muted-foreground'
                    }`}
                  >
                    {totalReceived} / {totalOrdered} received
                    {items.length > 0 && ` · ${fullyReceivedCount}/${items.length} items complete`}
                  </span>
                ) : null}
              </div>
              {items.length > 0 ? (
                <div className="text-right space-y-1 sm:pr-2">
                  <div className="flex items-center justify-between gap-8 text-sm">
                    <span className="text-muted-foreground">Subtotal:</span>
                    <span className="font-medium">{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-8 text-base pt-2 border-t border-border">
                    <span className="font-semibold">Total:</span>
                    <span className="font-bold text-card-foreground">{formatCurrency(Number(order.total_amount ?? subtotal))}</span>
                  </div>
                </div>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <PoLinkedInvoiceCard
          invoiceId={order.invoice_id ?? null}
          invoice={linkedInvoice}
          invoiceStatus={linkedInvoiceStatus}
          invoiceLocked={invoiceLocked}
          hasSupplier={hasSupplier}
          hasUnsavedSupplier={hasUnsavedSupplier}
          isSyncingDraft={isEnsuringDraft}
          accountName={
            accounts.find((a) => a.id === effectiveAccountId)?.name ?? null
          }
          accountId={effectiveAccountId}
          linkedOrderNumber={order.po_number}
          poNumber={order.po_number}
          events={events}
          confirmReadiness={confirmReadiness}
          poItems={items}
          isConfirming={isConfirmingInvoice}
          isVoiding={isVoidingInvoice}
          onConfirmInvoice={() => setConfirmInvoiceOpen(true)}
          onVoidInvoice={() => setVoidInvoiceOpen(true)}
          onOpenFullView={() => setInvoiceDialogOpen(true)}
          highlightedTarget={scrollHighlightTarget}
          onHighlightDismiss={dismissScrollHighlight}
        />

        <DiscussionThread entityType="purchase_order" entityId={order.id} />

        {/* Event Log (WIRED) */}
        <Card className="flex flex-col max-h-[min(32rem,50vh)] overflow-hidden">
          <CardHeader className="p-4 pb-3 shrink-0">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
              <div className="flex items-center gap-3 flex-wrap min-w-0">
                <CardTitle className="text-base flex items-center gap-2">
                  <History className="h-4 w-4 text-muted-foreground" />
                  Event Log
                  <Badge variant="outline" className="ml-1 font-normal">{filteredEvents.length}</Badge>
                </CardTitle>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className={cn(
                    'h-7 gap-1.5 px-2 text-xs font-normal text-muted-foreground hover:text-foreground',
                    showConfirmEvents &&
                      'text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300'
                  )}
                  onClick={() => setShowConfirmEvents((v) => !v)}
                  aria-pressed={showConfirmEvents}
                  aria-label={showConfirmEvents ? 'Hide confirm events' : 'Show confirm events'}
                >
                  {showConfirmEvents ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    <CircleDashed className="h-3.5 w-3.5" />
                  )}
                  Show confirms
                </Button>
              </div>
              <p className="text-xs text-muted-foreground shrink-0">
                Created {formatDate(order.created_at)} · Updated{' '}
                {formatDate(order.updated_at ?? order.created_at)}
              </p>
            </div>
          </CardHeader>
          <CardContent className="flex-1 min-h-0 overflow-y-auto pt-0">
            {events.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border bg-muted/20 px-4 py-8 text-center">
                <History className="h-6 w-6 text-muted-foreground/50 mx-auto mb-1" />
                <p className="text-sm font-medium text-muted-foreground">No activity yet</p>
              </div>
            ) : filteredEvents.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border bg-muted/20 px-4 py-8 text-center">
                <CircleDashed className="h-6 w-6 text-muted-foreground/50 mx-auto mb-1" />
                <p className="text-sm font-medium text-muted-foreground">No events to show</p>
                <p className="text-xs text-muted-foreground mt-1">Turn on Show confirms to see section confirm activity</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredEvents.map((event, idx) => (
                  <PoEventLogRow
                    key={event.id}
                    event={event}
                    isLast={idx === filteredEvents.length - 1}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        </div>
      </div>

      {/* Page-wide Save bar */}
      {isDirty && (
        <div className="shrink-0 border-t border-border bg-card px-6 py-3 flex items-center justify-end gap-3">
          <span className="mr-auto text-sm text-muted-foreground flex items-center gap-1.5">
            <Clock className="h-4 w-4" />
            Unsaved changes
          </span>
          <Button variant="outline" size="sm" onClick={handleDiscard} disabled={isSaving}>
            Discard
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isSaving}
            className="bg-brand-primary hover:bg-brand-primary-hover"
          >
            {isSaving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-1" />}
            Save Changes
          </Button>
        </div>
      )}

      {/* Manage receiving dialog */}
      <Dialog open={receivingOpen} onOpenChange={(o) => { if (!o) closeReceiving(); }}>
        <DialogContent className="w-[min(42rem,94vw)] max-w-none">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-muted-foreground" />
              Receive items
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              {receivingTotalRemaining > 0
                ? `Enter how many arrived now. ${receivingTotalRemaining} unit(s) still outstanding across this order.`
                : 'Everything on this order has been received.'}
            </p>
          </DialogHeader>
          <div className="space-y-3 max-h-[55vh] overflow-y-auto pr-1">
            {items.map((item) => {
              const ordered = Number(item.quantity_ordered);
              const staged = stagedReceivedFor(item);
              const received = effectiveReceivedFor(item);
              const savedReceived = Number(item.quantity_received);
              const remainingToAdd = Math.max(0, ordered - staged);
              const isComplete = received >= ordered;
              const hasUnsaved = received !== savedReceived;

              const directMode = usingDirectReceive[item.id] ?? false;
              const editingTotal = directEditOpen[item.id] ?? false;
              const unsavedDelta = received - savedReceived;

              const setAdd = (raw: string) => {
                setUsingDirectReceive((prev) => ({ ...prev, [item.id]: false }));
                if (raw === '') {
                  setReceivingDraft((d) => ({ ...d, [item.id]: '' }));
                  return;
                }
                let n = Number(raw);
                if (!Number.isFinite(n)) return;
                n = Math.max(0, Math.floor(n));
                setReceivingDraft((d) => ({ ...d, [item.id]: n === 0 ? '' : String(n) }));
              };

              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <p className="text-sm font-medium text-card-foreground truncate">
                        {item.item_name ?? `Item #${item.item_id}`}
                      </p>
                      {isComplete && (
                        <Badge className="shrink-0 bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-900/40 dark:text-green-300">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Fully received
                        </Badge>
                      )}
                    </div>
                    {hasUnsaved && (
                      <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                        {unsavedDelta > 0 ? '+' : ''}
                        {unsavedDelta} unsaved
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 text-xs text-muted-foreground whitespace-nowrap">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 shrink-0 text-muted-foreground hover:text-foreground"
                      onClick={() =>
                        setDirectEditOpen((prev) => ({ ...prev, [item.id]: !editingTotal }))
                      }
                      title="Adjust received total"
                      aria-label={`Adjust received total for ${item.item_name ?? 'item'}`}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    {editingTotal ? (
                      <Input
                        type="number"
                        inputMode="numeric"
                        min={0}
                        max={ordered}
                        autoFocus
                        value={staged}
                        onChange={(e) =>
                          setDirectReceived(item.id, ordered, e.target.value, staged)
                        }
                        onBlur={() =>
                          setDirectEditOpen((prev) => ({ ...prev, [item.id]: false }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === 'Escape') {
                            e.currentTarget.blur();
                          }
                        }}
                        className="h-6 w-10 px-0.5 py-0 text-xs text-right border-0 bg-transparent shadow-none focus-visible:ring-1 focus-visible:ring-ring/40 rounded-sm"
                        aria-label={`Received quantity for ${item.item_name ?? 'item'}`}
                      />
                    ) : (
                      <span className="tabular-nums">{received}</span>
                    )}
                    <span>/ {ordered} {item.item_unit ?? ''} received</span>
                  </div>
                  <div
                    className={cn(
                      'flex items-center gap-1.5 shrink-0',
                      directMode && 'pointer-events-none opacity-40'
                    )}
                  >
                    <span className="text-xs text-muted-foreground whitespace-nowrap">Receiving</span>
                    <Input
                      type="number"
                      inputMode="numeric"
                      min={0}
                      placeholder="0"
                      value={receivingDraft[item.id] ?? ''}
                      onChange={(e) => setAdd(e.target.value)}
                      disabled={directMode}
                      className="w-20 h-8 text-sm text-right"
                    />
                    <span className="text-xs text-muted-foreground">/</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 shrink-0 px-2.5 text-xs"
                      onClick={() => setAdd(String(remainingToAdd))}
                      disabled={directMode || remainingToAdd <= 0}
                    >
                      All
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
          <DialogFooter className="items-center sm:justify-between gap-2 flex-wrap">
            <span className="text-xs text-muted-foreground mr-auto">
              {hasReceivingChanges
                ? `${receivingChangeUnits} unit(s) to save`
                : receivingTotalRemaining > 0
                  ? 'Enter quantities, then save changes'
                  : 'All items received'}
            </span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={closeReceiving} disabled={savingReceiving}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSaveReceiving}
                disabled={savingReceiving || !hasReceivingChanges}
                className="bg-brand-primary hover:bg-brand-primary-hover"
              >
                {savingReceiving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-1" />}
                Save changes
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {order.invoice_id ? (
        <AccountInvoiceDialog
          invoiceId={order.invoice_id}
          accountId={order.account_id}
          accountName={accounts.find((a) => a.id === order.account_id)?.name ?? null}
          linkedOrderNumber={order.po_number}
          open={invoiceDialogOpen}
          onOpenChange={setInvoiceDialogOpen}
          showOrderSummary={false}
        />
      ) : null}

      {order.invoice_id ? (
        <>
          <InvoiceConfirmDialog
            open={confirmInvoiceOpen}
            onOpenChange={setConfirmInvoiceOpen}
            onConfirm={handleConfirmInvoice}
            isConfirming={isConfirmingInvoice}
            extraDescription="Confirming will lock this purchase order and post the payable to the supplier account."
          />
          <InvoiceVoidDialog
            open={voidInvoiceOpen}
            onOpenChange={setVoidInvoiceOpen}
            onVoid={handleVoidInvoice}
            isVoiding={isVoidingInvoice}
            extraWarning="The linked purchase order will become editable again and all order approvals will be cleared."
          />
        </>
      ) : null}

      <EditPurchaseOrderItemsDialog
        open={editItemsOpen}
        onOpenChange={setEditItemsOpen}
        poId={order.id}
        items={items}
        onSaved={onUpdated}
      />

      <ManagePoApprovalsDialog
        open={manageApprovalsOpen}
        onOpenChange={setManageApprovalsOpen}
        approvers={approvers}
        assignableMembers={assignableMembers}
        requiredApprovals={draft.required_approvals}
        onRequiredApprovalsChange={(value) => patch({ required_approvals: value })}
        onAddApprover={handleAddApprover}
        onRemoveApprover={handleRemoveApprover}
        initialsOf={initialsOf}
        avatarColor={avatarColor}
      />

      <Dialog
        open={unconfirmWarningOpen}
        onOpenChange={(open) => {
          setUnconfirmWarningOpen(open);
          if (!open) setPendingUnconfirmSection(null);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Unconfirm section?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            All current order approvals will be withdrawn. Approvers must approve the order again
            after sections are re-confirmed.
          </p>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setUnconfirmWarningOpen(false);
                setPendingUnconfirmSection(null);
              }}
            >
              Cancel
            </Button>
            <Button type="button" onClick={handleConfirmSectionUnconfirm}>
              Unconfirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PurchaseOrderDetailPanel;
