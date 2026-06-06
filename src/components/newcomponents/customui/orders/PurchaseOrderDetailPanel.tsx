import React, { useEffect, useMemo, useState } from 'react';
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
  Trash2,
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
  ShieldCheck,
  UserPlus,
  Check,
  X,
  ChevronDown,
} from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import PurchaseOrderMilestoneTracker from './PurchaseOrderMilestoneTracker';
import PoSectionConfirmButton from './PoSectionConfirmButton';
import PoInvoicePaymentSection from './PoInvoicePaymentSection';
import PoEventLogRow from './PoEventLogRow';
import {
  canConfirmPurchaseOrderSection,
  canCreatePurchaseOrderInvoice,
  getPurchaseOrderConfirmationsStatus,
  type PoSectionConfirmKey,
} from './purchaseOrderMilestones';
import AccountInvoiceDialog from '@/components/newcomponents/customui/accounts/AccountInvoiceDialog';
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
  onDelete: () => void;
  onUpdated?: () => void;
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
]);

const SECTION_CONFIRM_LABELS: Record<'supplier' | 'details' | 'notes' | 'items', string> = {
  supplier: 'Supplier',
  details: 'Order details',
  notes: 'Order notes',
  items: 'Order items',
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
  onDelete,
  onUpdated,
}) => {
  const { data: orderDetail } = useGetPurchaseOrderByIdQuery(orderFromList.id);
  const order = orderDetail ?? orderFromList;

  const [updatePurchaseOrder, { isLoading: isSaving }] = useUpdatePurchaseOrderMutation();
  const [setSectionConfirm] = useSetPurchaseOrderSectionConfirmMutation();
  const [createInvoice, { isLoading: isCreatingInvoice }] = useCreateInvoiceFromPurchaseOrderMutation();
  const [confirmingSection, setConfirmingSection] = useState<
    'supplier' | 'details' | 'notes' | 'items' | null
  >(null);
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [approvalsOpen, setApprovalsOpen] = useState(false);
  const [accountPickerOpen, setAccountPickerOpen] = useState(false);
  const [machinePickerOpen, setMachinePickerOpen] = useState(false);
  const [machineDisplayLine, setMachineDisplayLine] = useState('');

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
  const headerApprovers = [...approvers].sort((a, b) => Number(b.approved) - Number(a.approved));

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
        await unapproveOrder(order.id).unwrap();
        toast.success('Approval withdrawn');
      } else {
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
  const invoiceLocked = order.invoice_id != null;
  const supplierConfirmed = order.supplier_confirmed ?? false;
  const detailsConfirmed = order.details_confirmed ?? false;
  const itemsConfirmed = order.items_confirmed ?? false;
  const supplierDisabled = invoiceLocked || supplierConfirmed;
  const coreDetailsDisabled = invoiceLocked || detailsConfirmed;
  const itemsSectionConfirmed = itemsConfirmed || invoiceLocked;

  const invoiceReadiness = canCreatePurchaseOrderInvoice(
    order,
    items,
    approvalSummary.met
  );
  const confirmationsStatus = getPurchaseOrderConfirmationsStatus(order);

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
    }),
    [effectiveOrderFields, items]
  );

  const scrollToPoSection = (section: PoSectionConfirmKey) => {
    const id =
      section === 'supplier'
        ? 'po-section-supplier'
        : section === 'details'
          ? 'po-section-details'
          : 'po-section-items';
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

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

  const handleCreateInvoice = async () => {
    if (!invoiceReadiness.ok) return;
    try {
      await createInvoice(order.id).unwrap();
      toast.success('Invoice created');
      onUpdated?.();
    } catch (err: unknown) {
      const e = err as { data?: { detail?: string } };
      toast.error(e?.data?.detail || 'Failed to create invoice');
    }
  };

  const sectionSaveKeys: Record<PoSectionConfirmKey, (keyof UpdatePurchaseOrder)[]> = {
    supplier: ['account_id'],
    details: ['destination_type', 'destination_id', 'order_date', 'description'],
    items: [],
  };

  const sectionHasUnsavedChanges = (section: PoSectionConfirmKey): boolean =>
    sectionSaveKeys[section].some((key) => key in changedFields);

  const requestSectionConfirmToggle = (
    section: PoSectionConfirmKey,
    confirmed: boolean
  ) => {
    if (!confirmed) {
      if (sectionHasUnsavedChanges(section)) {
        toast.error('Save changes before confirming this section');
        return;
      }
      if (!sectionConfirmReadiness[section].ok) {
        toast.error(sectionConfirmReadiness[section].reason ?? 'Section not ready to confirm');
        return;
      }
    }
    void handleToggleSectionConfirm(section, !confirmed);
  };

  const handleToggleSectionConfirm = async (
    section: 'supplier' | 'details' | 'notes' | 'items',
    nextConfirmed: boolean
  ) => {
    setConfirmingSection(section);
    try {
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
      {/* Detail toolbar — title lives in AppShellHeader breadcrumb */}
      <div className="shrink-0 border-b border-border bg-card px-6 py-3">
        <div className="flex items-center justify-between gap-4 flex-nowrap">
          <div className="min-w-0 flex-1 pr-2">
            <PurchaseOrderMilestoneTracker order={order} items={items} />
          </div>
          <div className="flex items-center gap-4 shrink-0 ml-auto">
            <Popover open={approvalsOpen} onOpenChange={setApprovalsOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <ShieldCheck
                    className={`h-4 w-4 ${
                      approvalSummary.met ? 'text-green-600' : 'text-muted-foreground'
                    }`}
                  />
                  {approvers.length > 0 && (
                    <div className="flex -space-x-2">
                      {headerApprovers.map((a) => (
                        <div
                          key={a.id}
                          className={`relative h-6 w-6 rounded-full flex items-center justify-center text-white text-[10px] font-semibold ring-2 ring-card ${avatarColor(a.user_id)} ${
                            a.approved ? '' : 'opacity-50'
                          }`}
                          title={`${a.user_name ?? `User #${a.user_id}`}${a.approved ? ' (approved)' : ' (pending)'}`}
                        >
                          {initialsOf(a.user_name)}
                          {a.approved && (
                            <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-card flex items-center justify-center">
                              <Check className="h-1.5 w-1.5 text-white" />
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {approvalSummary.approved_count} of {approvalSummary.required} approved
                  </span>
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80 p-4 space-y-4">
                {/* Title + summary + required */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-sm font-semibold text-card-foreground">
                      <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                      Approvals
                    </div>
                    <Badge
                      variant="outline"
                      className={`font-normal ${
                        approvalSummary.met
                          ? 'text-green-600 border-green-600/30'
                          : 'text-amber-600 border-amber-600/30'
                      }`}
                    >
                      {approvalSummary.approved_count} / {approvalSummary.required} approved
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                      Required
                    </Label>
                    <Input
                      type="number"
                      min={0}
                      max={approvers.length || undefined}
                      placeholder="All"
                      value={draft.required_approvals}
                      onChange={(e) => patch({ required_approvals: e.target.value })}
                      className="w-20 h-8"
                    />
                  </div>
                </div>

                {/* Approver list */}
                {approvers.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border bg-muted/20 px-4 py-5 text-center">
                    <ShieldCheck className="h-6 w-6 text-muted-foreground/50 mx-auto mb-1" />
                    <p className="text-sm font-medium text-muted-foreground">No approvers assigned</p>
                    <p className="text-xs text-muted-foreground">Add members below to require their approval</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {approvers.map((a) => (
                      <div
                        key={a.id}
                        className="flex items-center justify-between gap-2 rounded-lg border border-border px-2.5 py-2"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div
                            className={`h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0 ${
                              a.approved ? avatarColor(a.user_id) : 'bg-muted-foreground/40'
                            }`}
                          >
                            {initialsOf(a.user_name)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-card-foreground truncate">
                              {a.user_name ?? `User #${a.user_id}`}
                              {a.user_id === currentUserId && (
                                <span className="text-muted-foreground font-normal"> (you)</span>
                              )}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {a.user_position || a.user_email || ''}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {a.approved ? (
                            <Badge variant="outline" className="text-green-600 border-green-600/30 gap-1">
                              <Check className="h-3 w-3" />
                              Approved
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-muted-foreground gap-1">
                              <Clock className="h-3 w-3" />
                              Pending
                            </Badge>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            onClick={() => handleRemoveApprover(a.user_id)}
                            title="Remove approver"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add approver */}
                {assignableMembers.length > 0 && (
                  <div className="flex items-center gap-2 pt-2 border-t border-border">
                    <UserPlus className="h-4 w-4 text-muted-foreground shrink-0" />
                    <Select value="" onValueChange={(v) => handleAddApprover(Number(v))}>
                      <SelectTrigger className="h-9 flex-1">
                        <SelectValue placeholder="Add approver..." />
                      </SelectTrigger>
                      <SelectContent>
                        {assignableMembers.map((m) => (
                          <SelectItem key={m.user_id} value={String(m.user_id)}>
                            {m.user_name ?? `User #${m.user_id}`}
                            {m.user_position ? ` · ${m.user_position}` : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* My approval action */}
                {myApproval && (
                  <Button
                    size="sm"
                    variant={myApproval.approved ? 'outline' : 'default'}
                    onClick={handleToggleMyApproval}
                    disabled={isApproving || isUnapproving}
                    className={`w-full ${
                      myApproval.approved ? '' : 'bg-brand-primary hover:bg-brand-primary-hover'
                    }`}
                  >
                    {isApproving || isUnapproving ? (
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    ) : myApproval.approved ? (
                      <X className="h-4 w-4 mr-1" />
                    ) : (
                      <Check className="h-4 w-4 mr-1" />
                    )}
                    {myApproval.approved ? 'Withdraw approval' : 'Approve'}
                  </Button>
                )}
              </PopoverContent>
            </Popover>

            <div className="h-6 w-px bg-border" />

            <Button
              variant="outline"
              size="sm"
              onClick={onDelete}
              className="text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-6">
        {/* Top grid: Order Details 2/3 + Supplier / Comments 1/3 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 lg:grid-rows-[auto_minmax(0,1fr)] gap-6 lg:min-h-[min(36rem,42vh)] lg:items-stretch">
          {/* Supplier — mobile first */}
          <Card
            id="po-section-supplier"
            className={cn(
              'order-1 lg:order-none lg:col-start-3 lg:row-start-1 scroll-mt-6',
              supplierDisabled && confirmedSectionCardClass
            )}
          >
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  Supplier
                  {invoiceLocked && (
                    <Badge variant="outline" className="ml-1 font-normal text-green-600 border-green-600/30">
                      Confirmed
                    </Badge>
                  )}
                  {!invoiceLocked && supplierConfirmed && (
                    <Badge variant="outline" className="ml-1 font-normal text-green-600 border-green-600/30">
                      Confirmed
                    </Badge>
                  )}
                </CardTitle>
                {invoiceLocked ? (
                  <PoSectionConfirmButton confirmed label="supplier" variant="system" />
                ) : (
                  <PoSectionConfirmButton
                    confirmed={supplierConfirmed}
                    onToggle={() => requestSectionConfirmToggle('supplier', supplierConfirmed)}
                    isLoading={confirmingSection === 'supplier'}
                    label="supplier"
                  />
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
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

          {/* Order Details — spans left column on desktop */}
          <Card
            id="po-section-details"
            className={cn(
              'order-2 lg:order-none lg:col-span-2 lg:row-span-2 lg:col-start-1 lg:row-start-1 flex flex-col min-h-0 h-full scroll-mt-6',
              coreDetailsDisabled && confirmedSectionCardClass
            )}
          >
            <CardHeader className="pb-4 shrink-0">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  Order Details
                  {invoiceLocked && (
                    <Badge variant="outline" className="ml-1 font-normal text-green-600 border-green-600/30">
                      Confirmed
                    </Badge>
                  )}
                  {!invoiceLocked && detailsConfirmed && (
                    <Badge variant="outline" className="ml-1 font-normal text-green-600 border-green-600/30">
                      Confirmed
                    </Badge>
                  )}
                </CardTitle>
                {invoiceLocked ? (
                  <PoSectionConfirmButton confirmed label="order details" variant="system" />
                ) : (
                  <PoSectionConfirmButton
                    confirmed={detailsConfirmed}
                    onToggle={() => requestSectionConfirmToggle('details', detailsConfirmed)}
                    isLoading={confirmingSection === 'details'}
                    label="order details"
                  />
                )}
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col min-h-0 space-y-4">
              <div
                className={cn(
                  'space-y-4',
                  coreDetailsDisabled && confirmedSectionContentClass
                )}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                    className="min-h-[80px] resize-none"
                    disabled={coreDetailsDisabled}
                  />
                </div>
              </div>
              <div className="shrink-0 pt-2 border-t border-border">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>Created: {formatDate(order.created_at)}</span>
                  <span>•</span>
                  <span>Last updated: {formatDate(order.updated_at ?? order.created_at)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Comments — placeholder */}
          <Card className="order-3 lg:order-none lg:col-start-3 lg:row-start-2 flex flex-col min-h-0 h-full">
            <CardHeader className="pb-4 shrink-0">
              <CardTitle className="text-base flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                Comments
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 min-h-0 flex flex-col gap-4">
              <div className="flex-1 min-h-0 rounded-lg border border-dashed border-border bg-muted/20 flex flex-col items-center justify-center gap-1 px-4 py-6 text-center">
                <MessageSquare className="h-6 w-6 text-muted-foreground/50" />
                <p className="text-sm font-medium text-muted-foreground">No comments yet</p>
                <p className="text-xs text-muted-foreground">Comment thread coming soon</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Input placeholder="Write a comment..." disabled className="flex-1" />
                <Button size="icon" disabled className="shrink-0">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
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
                Order Items
                <Badge variant="outline" className="ml-1 font-normal">{items.length}</Badge>
                {invoiceLocked && (
                  <Badge variant="outline" className="font-normal text-green-600 border-green-600/30">
                    Confirmed
                  </Badge>
                )}
                {!invoiceLocked && itemsConfirmed && (
                  <Badge variant="outline" className="font-normal text-green-600 border-green-600/30">
                    Confirmed
                  </Badge>
                )}
              </CardTitle>
              <div className="flex items-center gap-3">
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
                <Button
                  size="sm"
                  className="h-8 bg-brand-primary hover:bg-brand-primary-hover text-primary-foreground"
                  onClick={openReceiving}
                  disabled={items.length === 0}
                >
                  <Truck className="h-4 w-4 mr-1" />
                  Manage receiving
                </Button>
                {invoiceLocked ? (
                  <PoSectionConfirmButton confirmed label="order items" variant="system" />
                ) : (
                  <PoSectionConfirmButton
                    confirmed={itemsConfirmed}
                    onToggle={() => requestSectionConfirmToggle('items', itemsConfirmed)}
                    isLoading={confirmingSection === 'items'}
                    label="order items"
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
              <>
                <div className="border border-border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="py-2 w-12 text-center">#</TableHead>
                        <TableHead className="py-2">Item</TableHead>
                        <TableHead className="py-2 text-right w-24">Ordered</TableHead>
                        <TableHead className="py-2 text-right w-28">Received</TableHead>
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
                          <TableRow key={item.id} className={isComplete ? 'bg-green-50/50 dark:bg-green-950/20' : ''}>
                            <TableCell className="py-2 text-center text-muted-foreground text-sm">{item.line_number}</TableCell>
                            <TableCell className="py-2">
                              <span className="font-medium text-sm">{item.item_name ?? `Item #${item.item_id}`}</span>
                            </TableCell>
                            <TableCell className="py-2 text-right text-sm">
                              {ordered} {item.item_unit ?? ''}
                            </TableCell>
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
                            <TableCell className="py-2 text-right text-sm">{formatCurrency(Number(item.unit_price))}</TableCell>
                            <TableCell className="py-2 text-right text-sm font-medium">{formatCurrency(Number(item.line_subtotal))}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
                <div className="flex justify-end mt-4 pr-2">
                  <div className="text-right space-y-1">
                    <div className="flex items-center justify-between gap-8 text-sm">
                      <span className="text-muted-foreground">Subtotal:</span>
                      <span className="font-medium">{formatCurrency(subtotal)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-8 text-base pt-2 border-t border-border">
                      <span className="font-semibold">Total:</span>
                      <span className="font-bold text-card-foreground">{formatCurrency(Number(order.total_amount ?? subtotal))}</span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Invoice & Payment */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              Invoice & Payment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PoInvoicePaymentSection
              invoiceId={order.invoice_id ?? null}
              confirmationsStatus={confirmationsStatus}
              sections={[
                {
                  section: 'supplier',
                  label: 'Supplier',
                  confirmed: supplierConfirmed,
                  readinessHint: sectionConfirmReadiness.supplier.ok
                    ? undefined
                    : sectionConfirmReadiness.supplier.reason,
                },
                {
                  section: 'details',
                  label: 'Order details',
                  confirmed: detailsConfirmed,
                  readinessHint: sectionConfirmReadiness.details.ok
                    ? undefined
                    : sectionConfirmReadiness.details.reason,
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
              headerApprovers={headerApprovers}
              myApproval={myApproval}
              isApproving={isApproving}
              isUnapproving={isUnapproving}
              onToggleMyApproval={handleToggleMyApproval}
              onManageApprovals={() => setApprovalsOpen(true)}
              invoiceReadiness={invoiceReadiness}
              isCreatingInvoice={isCreatingInvoice}
              onCreateInvoice={handleCreateInvoice}
              onViewInvoice={() => setInvoiceDialogOpen(true)}
              onScrollToSection={scrollToPoSection}
              initialsOf={initialsOf}
              avatarColor={avatarColor}
            />
          </CardContent>
        </Card>

        {/* Event Log (WIRED) */}
        <Card className="flex flex-col max-h-[min(32rem,50vh)] overflow-hidden">
          <CardHeader className="pb-4 shrink-0">
            <div className="flex items-center gap-3 flex-wrap">
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
        <DialogContent
          className="w-[min(42rem,94vw)] max-w-none"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
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
                  <div className="flex items-center gap-0.5 shrink-0 text-xs text-muted-foreground whitespace-nowrap">
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
                      <button
                        type="button"
                        className="tabular-nums rounded px-0.5 -mx-0.5 hover:bg-muted/50 cursor-text"
                        onClick={() =>
                          setDirectEditOpen((prev) => ({ ...prev, [item.id]: true }))
                        }
                        title="Adjust received total"
                      >
                        {received}
                      </button>
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
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 text-xs"
                      onClick={() => setAdd(String(remainingToAdd))}
                      disabled={directMode || remainingToAdd <= 0}
                    >
                      all
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
    </div>
  );
};

export default PurchaseOrderDetailPanel;
