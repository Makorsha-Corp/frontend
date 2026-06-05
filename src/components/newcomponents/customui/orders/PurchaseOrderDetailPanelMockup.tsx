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
  StickyNote,
  Plus,
  CheckCircle2,
  Edit3,
  Lock,
  Unlock,
  History,
  CheckCircle,
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
import { formatDistanceToNow } from 'date-fns';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import PurchaseOrderMilestoneTracker from './PurchaseOrderMilestoneTracker';
import PoSectionLockButton from './PoSectionLockButton';
import { canCreatePurchaseOrderInvoice } from './purchaseOrderMilestones';
import AccountInvoiceDialog from '@/components/newcomponents/customui/accounts/AccountInvoiceDialog';
import type { PurchaseOrder, UpdatePurchaseOrder, PurchaseOrderEvent } from '@/types/purchaseOrder';
import {
  useUpdatePurchaseOrderMutation,
  useSetPurchaseOrderSectionLockMutation,
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

const EVENT_VISUALS: Record<
  string,
  { icon: typeof Plus; wrap: string; color: string }
> = {
  created: { icon: Plus, wrap: 'bg-brand-primary/10', color: 'text-brand-primary' },
  received: { icon: Truck, wrap: 'bg-amber-100 dark:bg-amber-900/30', color: 'text-amber-600 dark:text-amber-400' },
  all_received: { icon: CheckCircle2, wrap: 'bg-green-100 dark:bg-green-900/30', color: 'text-green-600 dark:text-green-400' },
  approved: { icon: Check, wrap: 'bg-green-100 dark:bg-green-900/30', color: 'text-green-600 dark:text-green-400' },
  approval_withdrawn: { icon: X, wrap: 'bg-muted', color: 'text-muted-foreground' },
  details_locked: { icon: Lock, wrap: 'bg-amber-100 dark:bg-amber-900/30', color: 'text-amber-600 dark:text-amber-400' },
  details_unlocked: { icon: Unlock, wrap: 'bg-muted', color: 'text-muted-foreground' },
  notes_locked: { icon: Lock, wrap: 'bg-amber-100 dark:bg-amber-900/30', color: 'text-amber-600 dark:text-amber-400' },
  notes_unlocked: { icon: Unlock, wrap: 'bg-muted', color: 'text-muted-foreground' },
  items_locked: { icon: Lock, wrap: 'bg-amber-100 dark:bg-amber-900/30', color: 'text-amber-600 dark:text-amber-400' },
  items_unlocked: { icon: Unlock, wrap: 'bg-muted', color: 'text-muted-foreground' },
  invoice_created: {
    icon: FileText,
    wrap: 'bg-green-100 dark:bg-green-900/30',
    color: 'text-green-600 dark:text-green-400',
  },
  details_updated: {
    icon: Edit3,
    wrap: 'bg-sky-100 dark:bg-sky-900/30',
    color: 'text-sky-600 dark:text-sky-400',
  },
  notes_updated: {
    icon: StickyNote,
    wrap: 'bg-violet-100 dark:bg-violet-900/30',
    color: 'text-violet-600 dark:text-violet-400',
  },
  default: { icon: CheckCircle, wrap: 'bg-muted', color: 'text-muted-foreground' },
};

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

const lockedSectionCardClass = 'border-muted-foreground/15 bg-muted/20';
const lockedSectionContentClass = 'opacity-[0.88] saturate-[0.92]';

const LOCK_EVENT_TYPES = new Set([
  'details_locked',
  'details_unlocked',
  'notes_locked',
  'notes_unlocked',
  'items_locked',
  'items_unlocked',
]);

const draftFromOrder = (o: PurchaseOrder): PoDraft => ({
  account_id: o.account_id ?? null,
  destination_type: o.destination_type ?? 'storage',
  destination_id: o.destination_id ?? null,
  order_date: o.order_date ?? '',
  expected_delivery_date: o.expected_delivery_date ?? '',
  description: o.description ?? '',
  required_approvals: o.required_approvals != null ? String(o.required_approvals) : '',
});

const PurchaseOrderDetailPanelMockup: React.FC<PurchaseOrderDetailPanelProps> = ({
  order: orderFromList,
  onDelete,
  onUpdated,
}) => {
  const { data: orderDetail } = useGetPurchaseOrderByIdQuery(orderFromList.id);
  const order = orderDetail ?? orderFromList;

  const [updatePurchaseOrder, { isLoading: isSaving }] = useUpdatePurchaseOrderMutation();
  const [setSectionLock] = useSetPurchaseOrderSectionLockMutation();
  const [createInvoice, { isLoading: isCreatingInvoice }] = useCreateInvoiceFromPurchaseOrderMutation();
  const [lockingSection, setLockingSection] = useState<
    'details' | 'notes' | 'items' | null
  >(null);
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);

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
  const [showLockEvents, setShowLockEvents] = useState(false);

  const filteredEvents = useMemo(
    () =>
      showLockEvents ? events : events.filter((e) => !LOCK_EVENT_TYPES.has(e.event_type)),
    [events, showLockEvents]
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
  }, [order.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const patch = (changes: Partial<PoDraft>) => setDraft((d) => ({ ...d, ...changes }));

  // Build a payload of only the fields that differ from the saved order.
  const invoiceLocked = order.invoice_id != null;
  const detailsLocked = order.details_locked ?? false;
  const notesLocked = order.notes_locked ?? false;
  const itemsLocked = order.items_locked ?? false;
  const coreDetailsDisabled = invoiceLocked || detailsLocked;
  const itemsSectionLocked = itemsLocked || invoiceLocked;

  const invoiceReadiness = canCreatePurchaseOrderInvoice(
    order,
    items,
    approvalSummary.met
  );

  const changedFields = useMemo<UpdatePurchaseOrder>(() => {
    const payload: UpdatePurchaseOrder = {};
    if (!invoiceLocked && !detailsLocked) {
      if (draft.account_id != null && draft.account_id !== order.account_id) {
        payload.account_id = draft.account_id;
      }
      if (draft.destination_type !== order.destination_type) {
        payload.destination_type = draft.destination_type;
      }
      if (draft.destination_id != null && draft.destination_id !== order.destination_id) {
        payload.destination_id = draft.destination_id;
      }
      const orderDate = draft.order_date || null;
      if (orderDate !== (order.order_date ?? null)) payload.order_date = orderDate;
      const expDate = draft.expected_delivery_date || null;
      if (expDate !== (order.expected_delivery_date ?? null)) payload.expected_delivery_date = expDate;
    } else {
      const expDate = draft.expected_delivery_date || null;
      if (expDate !== (order.expected_delivery_date ?? null)) payload.expected_delivery_date = expDate;
    }
    const required = draft.required_approvals.trim() === '' ? null : Number(draft.required_approvals);
    if (required !== (order.required_approvals ?? null)) payload.required_approvals = required;
    if (!notesLocked) {
      const desc = draft.description.trim() ? draft.description : null;
      if (desc !== (order.description ?? null)) payload.description = desc;
    }
    return payload;
  }, [draft, order, detailsLocked, notesLocked, invoiceLocked]);

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

  const handleToggleSectionLock = async (
    section: 'details' | 'notes' | 'items',
    nextLocked: boolean
  ) => {
    setLockingSection(section);
    try {
      await setSectionLock({ poId: order.id, section, locked: nextLocked }).unwrap();
      toast.success(nextLocked ? 'Section locked' : 'Section unlocked');
      onUpdated?.();
    } catch (err: unknown) {
      const e = err as { data?: { detail?: string } };
      toast.error(e?.data?.detail || 'Failed to update lock');
    } finally {
      setLockingSection(null);
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
      : draft.destination_type === 'machine'
        ? machines.map((m) => ({ id: m.id, name: m.name }))
        : projects.map((p) => ({ id: p.id, name: p.name }));

  // --- order items (wired) ---
  const totalOrdered = items.reduce((sum, i) => sum + Number(i.quantity_ordered), 0);
  const totalReceived = items.reduce((sum, i) => sum + Number(i.quantity_received), 0);
  const fullyReceivedCount = items.filter(
    (i) => Number(i.quantity_received) >= Number(i.quantity_ordered)
  ).length;
  const subtotal = Number(order.subtotal ?? 0);

  // Receiving dialog: stagedReceived = local totals; receivingDraft = qty to add before "Store changes".
  const [receivingOpen, setReceivingOpen] = useState(false);
  const [stagedReceived, setStagedReceived] = useState<Record<number, number>>({});
  const [receivingDraft, setReceivingDraft] = useState<Record<number, string>>({});
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
    setReceivingOpen(true);
  };

  const closeReceiving = () => {
    if (savingReceiving) return;
    setReceivingOpen(false);
    setStagedReceived({});
    setReceivingDraft({});
  };

  const addNowFor = (item: { id: number; quantity_ordered: number; quantity_received: number }) => {
    const remaining = Math.max(0, Number(item.quantity_ordered) - stagedReceivedFor(item));
    const raw = Number(receivingDraft[item.id] ?? '');
    if (!Number.isFinite(raw) || raw <= 0) return 0;
    return Math.min(remaining, raw);
  };

  const totalToReceive = items.reduce((sum, it) => sum + addNowFor(it), 0);
  const receivingTotalRemaining = items.reduce(
    (sum, it) => sum + Math.max(0, Number(it.quantity_ordered) - stagedReceivedFor(it)),
    0
  );
  const receivingPendingSave = items.some(
    (it) => stagedReceivedFor(it) !== Number(it.quantity_received)
  );
  const receivingPendingUnits = items.reduce(
    (sum, it) => sum + Math.max(0, stagedReceivedFor(it) - Number(it.quantity_received)),
    0
  );

  const handleStoreReceiving = () => {
    if (totalToReceive <= 0) return;
    setStagedReceived((prev) => {
      const next = { ...prev };
      for (const it of items) {
        const add = addNowFor(it);
        if (add <= 0) continue;
        const base = next[it.id] ?? Number(it.quantity_received);
        next[it.id] = Math.min(Number(it.quantity_ordered), base + add);
      }
      return next;
    });
    setReceivingDraft((prev) => {
      const next = { ...prev };
      for (const it of items) next[it.id] = '';
      return next;
    });
    toast.success('Receiving stored locally');
  };

  const handleSaveReceiving = async () => {
    const toUpdate = items
      .map((it) => ({
        it,
        newReceived: stagedReceivedFor(it),
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
  const formatRelative = (d: string) => {
    try {
      return formatDistanceToNow(new Date(d), { addSuffix: true });
    } catch {
      return formatDate(d);
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden bg-background">
      {/* Detail toolbar — title lives in AppShellHeader breadcrumb */}
      <div className="shrink-0 border-b border-border bg-card px-6 py-3">
        <div className="flex items-center justify-between gap-4 flex-nowrap">
          <div className="min-w-0 flex-1 pr-2">
            <PurchaseOrderMilestoneTracker order={order} items={items} />
          </div>
          <div className="flex items-center gap-4 shrink-0 ml-auto">
            <Popover>
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
        {/* Row 1: Order Details + Order Notes (WIRED) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Order Details */}
          <Card className={coreDetailsDisabled ? lockedSectionCardClass : undefined}>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  Order Details
                  {invoiceLocked && (
                    <Badge variant="outline" className="ml-1 font-normal text-green-600 border-green-600/30">
                      Locked
                    </Badge>
                  )}
                  {!invoiceLocked && detailsLocked && (
                    <Badge variant="outline" className="ml-1 font-normal text-amber-600 border-amber-600/30">
                      Locked
                    </Badge>
                  )}
                </CardTitle>
                {invoiceLocked ? (
                  <PoSectionLockButton locked label="order details" variant="system" />
                ) : (
                  <PoSectionLockButton
                    locked={detailsLocked}
                    onToggle={() => handleToggleSectionLock('details', !detailsLocked)}
                    isLoading={lockingSection === 'details'}
                    label="order details"
                  />
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className={`space-y-4 ${coreDetailsDisabled ? lockedSectionContentClass : ''}`}>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">Supplier</Label>
                <Select
                  value={draft.account_id != null ? String(draft.account_id) : undefined}
                  onValueChange={(v) => patch({ account_id: Number(v) })}
                  disabled={coreDetailsDisabled}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select supplier" />
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
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide">Destination Type</Label>
                  <Select
                    value={draft.destination_type}
                    onValueChange={(v) => patch({ destination_type: v, destination_id: null })}
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
                </div>
              </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className={`space-y-2 ${coreDetailsDisabled ? lockedSectionContentClass : ''}`}>
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
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">Completed</Label>
                <div className="flex items-center gap-2 h-9 px-3 rounded-md border border-dashed border-border bg-muted/30 text-sm">
                  {order.actual_delivery_date ? (
                    <span className="text-card-foreground">{formatDate(order.actual_delivery_date)}</span>
                  ) : (
                    <span className="text-muted-foreground">Set automatically when all items are received</span>
                  )}
                </div>
              </div>
              <div className="pt-2 border-t border-border">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>Created: {formatDate(order.created_at)}</span>
                  <span>•</span>
                  <span>Last updated: {formatDate(order.updated_at ?? order.created_at)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Order Notes */}
          <Card className={`flex flex-col ${notesLocked ? lockedSectionCardClass : ''}`}>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <StickyNote className="h-4 w-4 text-muted-foreground" />
                  Order Notes
                  {notesLocked && (
                    <Badge variant="outline" className="ml-1 font-normal text-amber-600 border-amber-600/30">
                      Locked
                    </Badge>
                  )}
                </CardTitle>
                <PoSectionLockButton
                  locked={notesLocked}
                  onToggle={() => handleToggleSectionLock('notes', !notesLocked)}
                  isLoading={lockingSection === 'notes'}
                  label="order notes"
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-4 flex-1 flex flex-col">
              <div className={`space-y-2 ${notesLocked ? lockedSectionContentClass : ''}`}>
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">Description</Label>
                <Textarea
                  placeholder="Add a description for this order..."
                  value={draft.description}
                  onChange={(e) => patch({ description: e.target.value })}
                  className="min-h-[80px] resize-none"
                  disabled={notesLocked}
                />
              </div>

              {/* Comments / chat log — UI placeholder (no API yet) */}
              <div className="space-y-2 flex-1 flex flex-col min-h-0">
                <Label className="text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                  <MessageSquare className="h-3.5 w-3.5" />
                  Comments
                </Label>
                <div className="flex-1 min-h-[120px] rounded-lg border border-dashed border-border bg-muted/20 flex flex-col items-center justify-center gap-1 px-4 py-6 text-center">
                  <MessageSquare className="h-6 w-6 text-muted-foreground/50" />
                  <p className="text-sm font-medium text-muted-foreground">No comments yet</p>
                  <p className="text-xs text-muted-foreground">Comment thread coming soon</p>
                </div>
                <div className="flex items-center gap-2">
                  <Input placeholder="Write a comment..." disabled className="flex-1" />
                  <Button size="icon" disabled className="shrink-0">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Order Items (WIRED) */}
        <Card className={itemsSectionLocked ? lockedSectionCardClass : undefined}>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <CardTitle
                className={`text-base flex items-center gap-2 ${itemsSectionLocked ? lockedSectionContentClass : ''}`}
              >
                <Package className="h-4 w-4 text-muted-foreground" />
                Order Items
                <Badge variant="outline" className="ml-1 font-normal">{items.length}</Badge>
                {invoiceLocked && (
                  <Badge variant="outline" className="font-normal text-green-600 border-green-600/30">
                    Locked
                  </Badge>
                )}
                {!invoiceLocked && itemsLocked && (
                  <Badge variant="outline" className="font-normal text-amber-600 border-amber-600/30">
                    Locked
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
                  <PoSectionLockButton locked label="order items" variant="system" />
                ) : (
                  <PoSectionLockButton
                    locked={itemsLocked}
                    onToggle={() => handleToggleSectionLock('items', !itemsLocked)}
                    isLoading={lockingSection === 'items'}
                    label="order items"
                  />
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className={`pt-0 ${itemsSectionLocked ? lockedSectionContentClass : ''}`}>
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
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg border border-dashed border-border bg-muted/30">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  {order.invoice_id ? (
                    <>
                      <p className="text-sm font-medium text-card-foreground">Invoice linked</p>
                      <p className="text-xs text-muted-foreground">
                        Invoice #{order.invoice_id} — order details and items are now locked
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-medium text-card-foreground">No invoice created yet</p>
                      <p className="text-xs text-muted-foreground">
                        {invoiceReadiness.ok
                          ? 'Create an invoice to track payment'
                          : invoiceReadiness.reason}
                      </p>
                    </>
                  )}
                </div>
              </div>
              {order.invoice_id ? (
                <button
                  type="button"
                  onClick={() => setInvoiceDialogOpen(true)}
                  className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  aria-label={`View linked invoice #${order.invoice_id}`}
                >
                  <Badge className="bg-green-600 hover:bg-green-700 text-white border-transparent cursor-pointer">
                    Linked #{order.invoice_id}
                  </Badge>
                </button>
              ) : (
                <Button
                  size="sm"
                  disabled={!invoiceReadiness.ok || isCreatingInvoice}
                  onClick={handleCreateInvoice}
                  className="bg-brand-primary hover:bg-brand-primary-hover"
                >
                  {isCreatingInvoice ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Create Invoice'
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Event Log (WIRED) */}
        <Card>
          <CardHeader className="pb-4">
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
                  showLockEvents &&
                    'text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300'
                )}
                onClick={() => setShowLockEvents((v) => !v)}
                aria-pressed={showLockEvents}
                aria-label={showLockEvents ? 'Hide lock events' : 'Show lock events'}
              >
                {showLockEvents ? (
                  <Lock className="h-3.5 w-3.5" />
                ) : (
                  <Unlock className="h-3.5 w-3.5" />
                )}
                Show locks
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {events.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border bg-muted/20 px-4 py-8 text-center">
                <History className="h-6 w-6 text-muted-foreground/50 mx-auto mb-1" />
                <p className="text-sm font-medium text-muted-foreground">No activity yet</p>
              </div>
            ) : filteredEvents.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border bg-muted/20 px-4 py-8 text-center">
                <Lock className="h-6 w-6 text-muted-foreground/50 mx-auto mb-1" />
                <p className="text-sm font-medium text-muted-foreground">No events to show</p>
                <p className="text-xs text-muted-foreground mt-1">Turn on Show locks to see section lock activity</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredEvents.map((event, idx) => {
                  const ev = EVENT_VISUALS[event.event_type] ?? EVENT_VISUALS.default;
                  const Icon = ev.icon;
                  const isLast = idx === filteredEvents.length - 1;
                  return (
                    <div key={event.id} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center ${ev.wrap}`}>
                          <Icon className={`h-4 w-4 ${ev.color}`} />
                        </div>
                        {!isLast && <div className="w-px flex-1 bg-border mt-2" />}
                      </div>
                      <div className={`flex-1 ${isLast ? '' : 'pb-4'}`}>
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium text-card-foreground">{event.description}</p>
                          <span className="text-xs text-muted-foreground shrink-0">{formatRelative(event.created_at)}</span>
                        </div>
                        {event.user_name && (
                          <div className="flex items-center gap-2 mt-1">
                            <div className="h-5 w-5 rounded-full bg-brand-primary flex items-center justify-center text-white text-[10px] font-semibold">
                              {initialsOf(event.user_name)}
                            </div>
                            <span className="text-xs text-muted-foreground">{event.user_name}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
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
              const received = stagedReceivedFor(item);
              const savedReceived = Number(item.quantity_received);
              const remaining = Math.max(0, ordered - received);
              const isComplete = remaining === 0;
              const hasUnsaved = received !== savedReceived;

              const setAdd = (raw: string) => {
                if (raw === '') {
                  setReceivingDraft((d) => ({ ...d, [item.id]: '' }));
                  return;
                }
                let n = Number(raw);
                if (!Number.isFinite(n)) return;
                n = Math.max(0, Math.min(remaining, Math.floor(n)));
                setReceivingDraft((d) => ({ ...d, [item.id]: n === 0 ? '' : String(n) }));
              };

              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-4 rounded-lg border border-border px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-card-foreground truncate">
                      {item.item_name ?? `Item #${item.item_id}`}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {received} / {ordered} {item.item_unit ?? ''} received
                      {hasUnsaved && (
                        <span className="ml-1.5 text-amber-600 dark:text-amber-400">
                          (+{received - savedReceived} unsaved)
                        </span>
                      )}
                    </p>
                  </div>
                  {isComplete ? (
                    <Badge className="shrink-0 bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-900/40 dark:text-green-300">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Fully received
                    </Badge>
                  ) : (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-xs text-muted-foreground whitespace-nowrap">Receiving</span>
                      <Input
                        type="number"
                        inputMode="numeric"
                        min={0}
                        max={remaining}
                        placeholder="0"
                        value={receivingDraft[item.id] ?? ''}
                        onChange={(e) => setAdd(e.target.value)}
                        className="w-20 h-8 text-sm text-right"
                      />
                      <span className="text-xs text-muted-foreground">/</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 text-xs"
                        onClick={() => setAdd(String(remaining))}
                      >
                        all
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <DialogFooter className="items-center sm:justify-between gap-2 flex-wrap">
            <span className="text-xs text-muted-foreground mr-auto">
              {totalToReceive > 0
                ? `Receiving ${totalToReceive} unit(s) — store to apply`
                : receivingPendingSave
                  ? `${receivingPendingUnits} unit(s) staged, not saved`
                  : receivingTotalRemaining > 0
                    ? 'Enter quantities, then store changes'
                    : 'All items received'}
            </span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={closeReceiving} disabled={savingReceiving}>
                Cancel
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleStoreReceiving}
                disabled={savingReceiving || totalToReceive <= 0}
              >
                Store changes
              </Button>
              <Button
                size="sm"
                onClick={handleSaveReceiving}
                disabled={savingReceiving || !receivingPendingSave}
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

export default PurchaseOrderDetailPanelMockup;
