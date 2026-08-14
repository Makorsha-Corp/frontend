import React, { useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Package,
  Truck,
  FileText,
  CheckCircle2,
  History,
  Clock,
  Loader2,
  Check,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';
import { SectionConfirmActions } from './PoSectionConfirmButton';
import { scrollToHighlightTarget } from '@/utils/poScrollHighlight';
import SoInvoiceWorkflowChecklist from './SoInvoiceWorkflowChecklist';
import SoApprovalsTopBar from './SoApprovalsTopBar';
import ManageSoApprovalsDialog from './ManageSoApprovalsDialog';
import SalesOrderEventRow from './SalesOrderEventRow';
import BlockedActionButton from '@/components/newcomponents/customui/BlockedActionButton';
import DiscussionThread from '@/components/newcomponents/customui/DiscussionThread';
import {
  canConfirmSalesOrderSection,
  canFinalizeSalesOrderInvoice,
  canMarkSalesOrderComplete,
  isSalesOrderMarkedComplete,
  isSalesOrderInvoiceFinalized,
  getSalesOrderConfirmationsStatus,
  type SoLinkedInvoiceStatus,
  type SoSectionConfirmKey,
} from './salesOrderMilestones';
import AccountInvoiceDialog from '@/components/newcomponents/customui/accounts/AccountInvoiceDialog';
import AccountInvoiceOverviewPanel from '@/components/newcomponents/customui/accounts/AccountInvoiceOverviewPanel';
import AccountViewDialog from '@/components/newcomponents/customui/accounts/AccountViewDialog';
import SalesDeliveryDialog from './SalesDeliveryDialog';
import { useGetAccountInvoiceByIdQuery } from '@/features/accountInvoices/accountInvoicesApi';
import type { SalesOrder, UpdateSalesOrderDTO } from '@/types/salesOrder';
import {
  useGetSalesOrderByIdQuery,
  useGetSalesOrderItemsQuery,
  useGetSalesOrderDeliveriesQuery,
  useUpdateSalesOrderMutation,
  useFulfillSalesOrderItemMutation,
  useFinalizeSalesOrderInvoiceMutation,
  useMarkSalesOrderCompleteMutation,
  useSetSalesOrderSectionConfirmMutation,
  useGetSalesOrderApproversQuery,
  useAddSalesOrderApproverMutation,
  useRemoveSalesOrderApproverMutation,
  useApproveSalesOrderMutation,
  useUnapproveSalesOrderMutation,
  useGetSalesOrderEventsQuery,
} from '@/features/salesOrders/salesOrdersApi';
import { useGetAccountsQuery } from '@/features/accounts/accountsApi';
import { useGetFactoriesQuery } from '@/features/factories/factoriesApi';
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

interface SalesOrderDetailPanelProps {
  order: SalesOrder;
  onUpdated?: () => void;
  /** When true, use the list row only (hub navigator already loaded this order). */
  skipOrderRefetch?: boolean;
}

interface SoDraft {
  expected_delivery_date: string;
  contact_name: string;
  contact_phone: string;
  description: string;
}

const confirmedSectionCardClass = 'border-muted-foreground/15 bg-muted/20';
const confirmedSectionContentClass = 'opacity-[0.88] saturate-[0.92]';

const SECTION_CONFIRM_LABELS: Record<SoSectionConfirmKey, string> = {
  order_info: 'Order details',
  items: 'Order items',
};

const draftFromOrder = (o: SalesOrder): SoDraft => ({
  expected_delivery_date: o.expected_delivery_date ?? '',
  contact_name: o.contact_name ?? '',
  contact_phone: o.contact_phone ?? '',
  description: o.description ?? '',
});

const SalesOrderDetailPanel: React.FC<SalesOrderDetailPanelProps> = ({
  order: orderFromList,
  onUpdated,
  skipOrderRefetch = false,
}) => {
  const { data: orderDetail } = useGetSalesOrderByIdQuery(orderFromList.id, {
    skip: skipOrderRefetch,
  });
  const order = skipOrderRefetch ? orderFromList : (orderDetail ?? orderFromList);
  const navigate = useNavigate();

  const [updateSalesOrder, { isLoading: isSaving }] = useUpdateSalesOrderMutation();
  const [setSectionConfirm] = useSetSalesOrderSectionConfirmMutation();
  const [finalizeInvoice, { isLoading: isFinalizing }] = useFinalizeSalesOrderInvoiceMutation();
  const [markOrderComplete, { isLoading: isMarkingOrderComplete }] = useMarkSalesOrderCompleteMutation();
  const [fulfillItem, { isLoading: isFulfilling }] = useFulfillSalesOrderItemMutation();
  const [fulfillingItemId, setFulfillingItemId] = useState<number | null>(null);

  const { data: linkedInvoiceQuery } = useGetAccountInvoiceByIdQuery(order.invoice_id!, {
    skip: order.invoice_id == null,
  });
  const linkedInvoice =
    order.invoice_id != null && linkedInvoiceQuery?.id === order.invoice_id
      ? linkedInvoiceQuery
      : undefined;
  const linkedInvoiceStatus: SoLinkedInvoiceStatus = linkedInvoice?.invoice_status ?? null;

  const [confirmingSection, setConfirmingSection] = useState<SoSectionConfirmKey | null>(null);
  const [unconfirmWarningOpen, setUnconfirmWarningOpen] = useState(false);
  const [pendingUnconfirmSection, setPendingUnconfirmSection] = useState<SoSectionConfirmKey | null>(null);
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [manageApprovalsOpen, setManageApprovalsOpen] = useState(false);
  const [deliveryDialogOpen, setDeliveryDialogOpen] = useState(false);
  const [accountViewOpen, setAccountViewOpen] = useState(false);
  const [scrollHighlightTarget, setScrollHighlightTarget] = useState<
    SoSectionConfirmKey | 'approvals' | 'approve' | 'finalize' | 'fulfillment' | null
  >(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollHighlightGenerationRef = useRef(0);

  const { workspace, user } = useAppSelector((s) => s.auth);
  const currentUserId = user?.id ?? null;

  const { data: accounts = [] } = useGetAccountsQuery({ skip: 0, limit: API_LIMITS.ACCOUNTS_LIST_MAX });
  const { data: factories = [] } = useGetFactoriesQuery({ skip: 0, limit: API_LIMITS.FLEXIBLE_1000 });
  const { data: members = [] } = useGetWorkspaceMembersQuery(workspace?.id ?? 0, {
    skip: !workspace?.id,
  });
  const { data: approversData } = useGetSalesOrderApproversQuery(order.id);
  const approvers = approversData?.approvers ?? [];
  const approvalSummary = approversData?.summary ?? { approved_count: 0, required: 0, met: true };

  const { data: items = [], isLoading: itemsLoading } = useGetSalesOrderItemsQuery(order.id);
  const { data: deliveries = [] } = useGetSalesOrderDeliveriesQuery(order.id);
  const { data: events = [] } = useGetSalesOrderEventsQuery(order.id);
  const [showAbsoluteEventTimes, setShowAbsoluteEventTimes] = useState(false);

  const [addApprover] = useAddSalesOrderApproverMutation();
  const [removeApprover] = useRemoveSalesOrderApproverMutation();
  const [approveOrder, { isLoading: isApproving }] = useApproveSalesOrderMutation();
  const [unapproveOrder, { isLoading: isUnapproving }] = useUnapproveSalesOrderMutation();

  const myApproval = currentUserId != null ? approvers.find((a) => a.user_id === currentUserId) : undefined;
  const assignedUserIds = new Set(approvers.map((a) => a.user_id));
  const assignableMembers = members.filter((m) => m.status === 'active' && !assignedUserIds.has(m.user_id));

  const accountName = accounts.find((a) => a.id === order.account_id)?.name ?? `#${order.account_id}`;
  const factoryName = factories.find((f) => f.id === order.factory_id)?.name ?? `#${order.factory_id}`;

  const invoiceLocked = isSalesOrderInvoiceFinalized(linkedInvoiceStatus) || order.invoice_confirmed;
  const isSoCompleted = isSalesOrderMarkedComplete(order);
  const orderInfoConfirmed = order.order_info_confirmed;
  const itemsConfirmed = order.items_confirmed;
  const orderInfoDisabled = invoiceLocked || orderInfoConfirmed;
  const itemsSectionConfirmed = itemsConfirmed || invoiceLocked;

  const confirmationsStatus = getSalesOrderConfirmationsStatus(order);
  const finalizeReadiness = canFinalizeSalesOrderInvoice(order, approvalSummary.met, linkedInvoiceStatus);
  const markCompleteReadiness = useMemo(() => canMarkSalesOrderComplete(order, items), [order, items]);

  const sectionConfirmReadiness = useMemo(
    () => ({
      order_info: canConfirmSalesOrderSection('order_info', order, items),
      items: canConfirmSalesOrderSection('items', order, items),
    }),
    [order, items]
  );

  const [draft, setDraft] = useState<SoDraft>(() => draftFromOrder(order));
  useEffect(() => {
    setDraft(draftFromOrder(order));
  }, [order.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const patch = (changes: Partial<SoDraft>) => setDraft((d) => ({ ...d, ...changes }));

  const changedFields = useMemo<UpdateSalesOrderDTO>(() => {
    const payload: UpdateSalesOrderDTO = {};
    if (!orderInfoDisabled) {
      const expDate = draft.expected_delivery_date || undefined;
      if ((expDate ?? null) !== (order.expected_delivery_date ?? null)) payload.expected_delivery_date = expDate;
      const contactName = draft.contact_name.trim() ? draft.contact_name : undefined;
      if ((contactName ?? null) !== (order.contact_name ?? null)) payload.contact_name = contactName;
      const contactPhone = draft.contact_phone.trim() ? draft.contact_phone : undefined;
      if ((contactPhone ?? null) !== (order.contact_phone ?? null)) payload.contact_phone = contactPhone;
      const desc = draft.description.trim() ? draft.description : undefined;
      if ((desc ?? null) !== (order.description ?? null)) payload.description = desc;
    }
    return payload;
  }, [draft, order, orderInfoDisabled]);

  const isDirty = Object.keys(changedFields).length > 0;

  useEffect(() => {
    if (!scrollHighlightTarget) return;
    const timer = window.setTimeout(() => setScrollHighlightTarget(null), 3500);
    return () => window.clearTimeout(timer);
  }, [scrollHighlightTarget]);

  const clearScrollHighlights = () => setScrollHighlightTarget(null);
  const dismissScrollHighlight = clearScrollHighlights;

  const scrollToElement = (id: string, target: typeof scrollHighlightTarget) => {
    const generation = ++scrollHighlightGenerationRef.current;
    const element = document.getElementById(id);
    clearScrollHighlights();
    void scrollToHighlightTarget({
      container: scrollContainerRef.current,
      element,
      onScrollStart: () => {},
      onScrollEnd: () => {
        if (generation !== scrollHighlightGenerationRef.current) return;
        setScrollHighlightTarget(target);
      },
    });
  };

  const scrollToSoSection = (section: SoSectionConfirmKey) => {
    const confirmEl = document.getElementById(`so-confirm-${section}`);
    const cardId = `so-section-${section}`;
    const generation = ++scrollHighlightGenerationRef.current;
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

  const pendingLabelToSection = (label: string): SoSectionConfirmKey | null => {
    switch (label) {
      case 'Order info':
        return 'order_info';
      case 'Items':
        return 'items';
      default:
        return null;
    }
  };

  const handleFinalizeBlocked = () => {
    if (!approvalSummary.met) {
      scrollToElement('so-approve-order-btn', 'approve');
      return;
    }
    if (!confirmationsStatus.allConfirmed) {
      const firstPending = confirmationsStatus.pendingLabels[0];
      const section = firstPending ? pendingLabelToSection(firstPending) : null;
      if (section) scrollToSoSection(section);
    }
  };

  const openManageApprovals = () => setManageApprovalsOpen(true);

  const handleAddApprover = async (userId: number) => {
    try {
      await addApprover({ orderId: order.id, user_id: userId }).unwrap();
      toast.success('Approver added');
    } catch (err: unknown) {
      const e = err as { data?: { detail?: string } };
      toast.error(e?.data?.detail || 'Failed to add approver');
    }
  };

  const handleRemoveApprover = async (userId: number) => {
    try {
      await removeApprover({ orderId: order.id, userId }).unwrap();
      toast.success('Approver removed');
    } catch (err: unknown) {
      const e = err as { data?: { detail?: string } };
      toast.error(e?.data?.detail || 'Failed to remove approver');
    }
  };

  const approvalWithdrawBlocked = invoiceLocked || isSoCompleted;

  const handleToggleMyApproval = async () => {
    try {
      if (myApproval?.approved) {
        if (approvalWithdrawBlocked) {
          toast.error(
            isSoCompleted
              ? 'Order is complete — approval cannot be withdrawn'
              : 'Cannot withdraw approval — invoice is finalized'
          );
          return;
        }
        await unapproveOrder(order.id).unwrap();
        toast.success('Approval withdrawn');
      } else {
        if (!confirmationsStatus.allConfirmed) {
          toast.error(confirmationsStatus.reason ?? 'Confirm all sections before approving');
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

  const saveDetailsFields = async (): Promise<boolean> => {
    if (Object.keys(changedFields).length === 0) return true;
    try {
      await updateSalesOrder({ id: order.id, data: changedFields }).unwrap();
      return true;
    } catch (err: unknown) {
      const e = err as { data?: { detail?: string } };
      toast.error(e?.data?.detail || 'Failed to save section changes');
      return false;
    }
  };

  const requestSectionConfirmToggle = (section: SoSectionConfirmKey, currentlyConfirmed: boolean) => {
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

  const handleToggleSectionConfirm = async (section: SoSectionConfirmKey, nextConfirmed: boolean) => {
    setConfirmingSection(section);
    try {
      if (nextConfirmed && section === 'order_info' && Object.keys(changedFields).length > 0) {
        const saved = await saveDetailsFields();
        if (!saved) return;
      }
      await setSectionConfirm({ orderId: order.id, section, confirmed: nextConfirmed }).unwrap();
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

  const handleSave = async () => {
    if (!isDirty) return;
    try {
      await updateSalesOrder({ id: order.id, data: changedFields }).unwrap();
      toast.success('Sales order updated');
      onUpdated?.();
    } catch (err: unknown) {
      const e = err as { data?: { detail?: string } };
      toast.error(e?.data?.detail || 'Failed to save changes');
    }
  };

  const handleDiscard = () => setDraft(draftFromOrder(order));

  const handleFinalizeInvoice = async () => {
    if (!finalizeReadiness.ok) return;
    try {
      await finalizeInvoice(order.id).unwrap();
      toast.success('Invoice finalized — delivery and fulfilment are now unlocked.');
      onUpdated?.();
    } catch (err: unknown) {
      const e = err as { data?: { detail?: string } };
      toast.error(e?.data?.detail || 'Failed to finalize invoice');
    }
  };

  const handleMarkOrderComplete = async () => {
    if (!markCompleteReadiness.ok) {
      toast.error(markCompleteReadiness.reason ?? 'Cannot mark order complete yet');
      return;
    }
    try {
      await markOrderComplete(order.id).unwrap();
      toast.success('Sales order marked complete');
      onUpdated?.();
    } catch (err: unknown) {
      const e = err as { data?: { detail?: string } };
      toast.error(e?.data?.detail || 'Failed to mark order complete');
    }
  };

  const handleFulfill = async (itemId: number) => {
    setFulfillingItemId(itemId);
    try {
      const result = await fulfillItem({ orderId: order.id, itemId }).unwrap();
      for (const msg of result.messages ?? []) {
        toast.success(msg.message);
      }
      onUpdated?.();
    } catch (err: unknown) {
      const e = err as { data?: { detail?: string } };
      toast.error(e?.data?.detail || 'Failed to fulfill line item');
    } finally {
      setFulfillingItemId(null);
    }
  };

  const handleViewInAccounts = () => {
    if (!order.account_id || order.invoice_id == null) return;
    navigate(`/accounts/${order.account_id}?invoiceId=${order.invoice_id}`);
  };

  const formatCurrency = (v: number | null | undefined) =>
    v != null
      ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(v)
      : '—';
  const formatDate = (d: string | null | undefined) =>
    d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
  const qtyWithUnit = (qty: number, unit: string | null) => (unit ? `${qty} ${unit}` : String(qty));

  const deliverableItems = items.filter((it) => it.requires_delivery);
  const totalOrdered = items.reduce((sum, i) => sum + Number(i.quantity_ordered), 0);
  const totalDelivered = items.reduce((sum, i) => sum + Number(i.quantity_delivered), 0);
  const subtotal = items.reduce((sum, i) => sum + Number(i.line_total), 0);

  const manageDeliveriesBlocked = isSoCompleted || !order.invoice_confirmed || deliverableItems.length === 0;
  const manageDeliveriesHint = isSoCompleted
    ? { title: 'Order complete', reason: 'Deliveries cannot be changed after this order is marked complete.' }
    : !order.invoice_confirmed
      ? { title: 'Invoice not finalized', reason: 'Finalize the invoice before planning a delivery' }
      : deliverableItems.length === 0
        ? { title: 'No deliverable items', reason: 'No items on this order require delivery' }
        : undefined;

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden bg-background">
      <div className="flex flex-1 min-h-0">
        <div ref={scrollContainerRef} className="flex-1 min-h-0 overflow-y-auto p-6 space-y-6">
          <SoApprovalsTopBar
            approvers={approvers}
            approvalSummary={approvalSummary}
            currentUserId={currentUserId}
            myApproval={myApproval}
            approvalSectionsStatus={confirmationsStatus}
            approvalWithdrawBlocked={approvalWithdrawBlocked}
            approvalWithdrawBlockedReason={
              isSoCompleted ? 'Order is complete — approval cannot be withdrawn' : undefined
            }
            isApproving={isApproving}
            isUnapproving={isUnapproving}
            onManage={openManageApprovals}
            onToggleMyApproval={handleToggleMyApproval}
          />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:items-start">
            {/* Order Details — factory, customer, contact, dates, description; one confirm for the whole card */}
            <Card
              id="so-section-order_info"
              className={cn('lg:col-span-2 flex flex-col scroll-mt-6', orderInfoDisabled && confirmedSectionCardClass)}
            >
              <CardHeader className="p-4 pb-2 shrink-0">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    Order Details
                  </CardTitle>
                  {invoiceLocked ? (
                    <SectionConfirmActions confirmed invoiceLocked label="order details" variant="system" />
                  ) : (
                    <SectionConfirmActions
                      id="so-confirm-order_info"
                      confirmed={orderInfoConfirmed}
                      invoiceLocked={invoiceLocked}
                      onToggle={() => requestSectionConfirmToggle('order_info', orderInfoConfirmed)}
                      isLoading={confirmingSection === 'order_info'}
                      label="order details"
                      highlighted={scrollHighlightTarget === 'order_info'}
                      onHighlightDismiss={dismissScrollHighlight}
                    />
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0 space-y-3">
                <div className={cn('space-y-3', orderInfoDisabled && confirmedSectionContentClass)}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground uppercase tracking-wide">Factory</Label>
                      <div className="flex items-center h-9 px-3 rounded-md border border-dashed border-border bg-muted/30 text-sm">
                        <span className="text-card-foreground">{factoryName}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground uppercase tracking-wide">Customer</Label>
                      <div className="flex items-center justify-between h-9 rounded-md border border-border pl-3 pr-1">
                        <span className="truncate text-sm text-card-foreground">{accountName}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 shrink-0"
                          onClick={() => setAccountViewOpen(true)}
                        >
                          View
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground uppercase tracking-wide">Customer Name</Label>
                      <Input
                        placeholder="Point of contact"
                        value={draft.contact_name}
                        onChange={(e) => patch({ contact_name: e.target.value })}
                        disabled={orderInfoDisabled}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground uppercase tracking-wide">Phone Number</Label>
                      <Input
                        placeholder="Contact phone number"
                        value={draft.contact_phone}
                        onChange={(e) => patch({ contact_phone: e.target.value })}
                        disabled={orderInfoDisabled}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground uppercase tracking-wide">Order Date</Label>
                      <div className="flex items-center h-9 px-3 rounded-md border border-dashed border-border bg-muted/30 text-sm">
                        <span className="text-card-foreground">{formatDate(order.order_date)}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground uppercase tracking-wide">Expected Delivery</Label>
                      <Input
                        type="date"
                        value={draft.expected_delivery_date}
                        onChange={(e) => patch({ expected_delivery_date: e.target.value })}
                        disabled={orderInfoDisabled}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wide">Description</Label>
                    <Textarea
                      placeholder="Add a description for this order..."
                      value={draft.description}
                      onChange={(e) => patch({ description: e.target.value })}
                      className="min-h-[56px] resize-none"
                      disabled={orderInfoDisabled}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <SoInvoiceWorkflowChecklist
              className="max-lg:h-auto max-lg:w-full lg:col-start-3 scroll-mt-6"
              invoiceId={order.invoice_id ?? null}
              invoiceStatus={linkedInvoiceStatus}
              confirmationsStatus={confirmationsStatus}
              sections={[
                {
                  section: 'order_info',
                  label: 'Order info',
                  confirmed: orderInfoConfirmed,
                  readinessHint: sectionConfirmReadiness.order_info.ok ? undefined : sectionConfirmReadiness.order_info.reason,
                },
                {
                  section: 'items',
                  label: 'Items',
                  confirmed: itemsConfirmed,
                  readinessHint: sectionConfirmReadiness.items.ok ? undefined : sectionConfirmReadiness.items.reason,
                },
              ]}
              approvalSummary={approvalSummary}
              items={items}
              invoicePaymentStatus={order.invoice_payment_status}
              orderCompleted={isSoCompleted}
              markCompleteReadiness={markCompleteReadiness}
              onMarkOrderComplete={handleMarkOrderComplete}
              isMarkingOrderComplete={isMarkingOrderComplete}
              onScrollToSection={scrollToSoSection}
              onScrollToFinalize={() => scrollToElement('so-finalize-invoice-btn', 'finalize')}
              onScrollToManageApprovals={() => scrollToElement('so-section-approvals', 'approvals')}
              onScrollToFulfillment={() => scrollToElement('so-section-fulfillment', 'fulfillment')}
              onScrollToPayments={() => scrollToElement('so-section-invoice', null)}
            />
          </div>

          {/* Order Items */}
          <Card
            id="so-section-items"
            className={cn('scroll-mt-6', itemsSectionConfirmed && confirmedSectionCardClass)}
          >
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <CardTitle className={cn('text-base flex items-center gap-2', itemsSectionConfirmed && confirmedSectionContentClass)}>
                  <Package className="h-4 w-4 text-muted-foreground" />
                  Sales Items
                  <Badge variant="outline" className="ml-1 font-normal">{items.length}</Badge>
                </CardTitle>
                {invoiceLocked ? (
                  <SectionConfirmActions confirmed invoiceLocked label="order items" variant="system" />
                ) : (
                  <SectionConfirmActions
                    id="so-confirm-items"
                    confirmed={itemsConfirmed}
                    invoiceLocked={invoiceLocked}
                    onToggle={() => requestSectionConfirmToggle('items', itemsConfirmed)}
                    isLoading={confirmingSection === 'items'}
                    label="order items"
                    highlighted={scrollHighlightTarget === 'items'}
                    onHighlightDismiss={dismissScrollHighlight}
                  />
                )}
              </div>
            </CardHeader>
            <CardContent className={cn('pt-0', itemsSectionConfirmed && confirmedSectionContentClass)}>
              {items.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border bg-muted/20 px-4 py-8 text-center">
                  <Package className="h-6 w-6 text-muted-foreground/50 mx-auto mb-1" />
                  <p className="text-sm font-medium text-muted-foreground">No items on this order</p>
                </div>
              ) : (
                <div id="so-section-fulfillment" className="scroll-mt-6 border border-border rounded-lg overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="py-2 w-10">#</TableHead>
                        <TableHead className="py-2">Item name</TableHead>
                        <TableHead className="py-2">Kind</TableHead>
                        <TableHead className="py-2">Qty ordered</TableHead>
                        <TableHead className="py-2">Qty delivered</TableHead>
                        <TableHead className="py-2">Unit price</TableHead>
                        <TableHead className="py-2">Total</TableHead>
                        <TableHead className="py-2 text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {itemsLoading ? (
                        <TableRow>
                          <TableCell colSpan={8} className="py-6 text-center text-sm text-muted-foreground">
                            Loading...
                          </TableCell>
                        </TableRow>
                      ) : (
                        items.map((it, idx) => {
                          const isFulfilled = it.quantity_delivered >= it.quantity_ordered;
                          return (
                            <TableRow key={it.id} className="border-b border-border">
                              <TableCell className="py-2 text-muted-foreground">{idx + 1}</TableCell>
                              <TableCell className="py-2">
                                <span className="font-medium text-sm">{it.item_name ?? `Item #${it.item_id}`}</span>
                              </TableCell>
                              <TableCell className="py-2">
                                <div className="flex flex-wrap items-center gap-1">
                                  <Badge variant="outline" className="text-xs">
                                    {it.item_id == null ? 'Misc' : 'Product'}
                                  </Badge>
                                  <Badge variant="outline" className="text-xs">
                                    {it.requires_delivery ? 'Delivery' : 'No delivery'}
                                  </Badge>
                                </div>
                              </TableCell>
                              <TableCell className="py-2">{qtyWithUnit(it.quantity_ordered, it.item_unit)}</TableCell>
                              <TableCell className="py-2">{qtyWithUnit(it.quantity_delivered, it.item_unit)}</TableCell>
                              <TableCell className="py-2">{formatCurrency(it.unit_price)}</TableCell>
                              <TableCell className="py-2">{formatCurrency(it.line_total)}</TableCell>
                              <TableCell className="py-2 text-right">
                                {!it.requires_delivery &&
                                  (isFulfilled ? (
                                    <span className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                                      <CheckCircle2 className="h-3.5 w-3.5" />
                                      Fulfilled
                                    </span>
                                  ) : (
                                    <BlockedActionButton
                                      size="sm"
                                      variant="outline"
                                      className="h-7 px-2 text-xs"
                                      blocked={!order.invoice_confirmed}
                                      blockedHint={
                                        !order.invoice_confirmed
                                          ? { title: 'Invoice not finalized', reason: 'Finalize the invoice before fulfilling this line' }
                                          : undefined
                                      }
                                      isBusy={isFulfilling && fulfillingItemId === it.id}
                                      onAction={() => handleFulfill(it.id)}
                                    >
                                      <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                                      Fulfill
                                    </BlockedActionButton>
                                  ))}
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}

              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <BlockedActionButton
                    size="sm"
                    className="h-8 w-fit bg-brand-primary hover:bg-brand-primary-hover text-primary-foreground"
                    onAction={() => setDeliveryDialogOpen(true)}
                    blocked={manageDeliveriesBlocked}
                    blockedHint={manageDeliveriesHint}
                    blockedClassName="opacity-60 cursor-not-allowed"
                    popoverSide="bottom"
                    popoverAlign="start"
                  >
                    <Truck className="h-4 w-4 mr-1" />
                    Manage deliveries
                  </BlockedActionButton>
                  {order.invoice_confirmed ? (
                    <span
                      className={cn(
                        'text-xs font-medium',
                        totalOrdered > 0 && totalDelivered >= totalOrdered ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'
                      )}
                    >
                      {totalDelivered} / {totalOrdered} delivered · {deliveries.length} deliveries
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

          {/* Linked Invoice */}
          <Card id="so-section-invoice" className="scroll-mt-6">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-base flex items-center gap-2 min-w-0">
                  <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="truncate">Linked Invoice</span>
                </CardTitle>
                {order.invoice_confirmed && (
                  <Badge variant="outline" className="status-badge status-badge--confirmed">
                    Finalized
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {!order.invoice_confirmed ? (
                <div className="rounded-lg border border-dashed border-border bg-muted/20 px-4 py-8 text-center space-y-3">
                  <RefreshCw className="h-5 w-5 mx-auto text-muted-foreground/60" aria-hidden />
                  <p className="text-sm text-muted-foreground">
                    {!confirmationsStatus.allConfirmed
                      ? 'Confirm order details and items first'
                      : !approvalSummary.met
                        ? 'Approvals required before finalizing the invoice'
                        : 'Ready to finalize — this creates and confirms the invoice in one step'}
                  </p>
                  <div className="flex justify-center pt-1">
                    <BlockedActionButton
                      id="so-finalize-invoice-btn"
                      size="sm"
                      className={cn(
                        'bg-green-600 hover:bg-green-700 text-white shrink-0 scroll-mt-24',
                        scrollHighlightTarget === 'finalize' && 'po-scroll-target-highlight'
                      )}
                      onMouseEnter={() => {
                        if (scrollHighlightTarget === 'finalize') dismissScrollHighlight();
                      }}
                      blocked={!finalizeReadiness.ok}
                      blockedHint={
                        !finalizeReadiness.ok
                          ? { title: 'Cannot finalize yet', reason: finalizeReadiness.reason ?? 'Complete the required steps first' }
                          : undefined
                      }
                      isBusy={isFinalizing}
                      onAction={handleFinalizeInvoice}
                      onBlockedClick={handleFinalizeBlocked}
                    >
                      <Check className="h-3.5 w-3.5 mr-1.5" />
                      Finalize Invoice
                    </BlockedActionButton>
                  </div>
                </div>
              ) : (
                <>
                  <AccountInvoiceOverviewPanel
                    invoiceId={order.invoice_id!}
                    invoice={linkedInvoice}
                    accountName={accountName}
                    linkedOrderNumber={order.sales_order_number}
                    showOrderSummary={false}
                    dueDateReadOnly
                    showEventLog={false}
                  />
                  <div className="flex flex-wrap items-center justify-end gap-3 pt-1">
                    <Button type="button" variant="outline" size="sm" className="shrink-0" onClick={() => setInvoiceDialogOpen(true)}>
                      Open full view
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="shrink-0"
                      onClick={handleViewInAccounts}
                      disabled={!order.account_id || order.invoice_id == null}
                    >
                      <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                      View on Account
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <DiscussionThread entityType="sales_order" entityId={order.id} />

          {/* Event Log */}
          <Card className="flex flex-col max-h-[min(32rem,50vh)] overflow-hidden">
            <CardHeader className="p-4 pb-3 shrink-0">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                <CardTitle className="text-base flex items-center gap-2">
                  <History className="h-4 w-4 text-muted-foreground" />
                  Event Log
                  <Badge variant="outline" className="ml-1 font-normal">{events.length}</Badge>
                </CardTitle>
                <p className="text-xs text-muted-foreground shrink-0">
                  Created {formatDate(order.created_at)} · Updated {formatDate(order.updated_at ?? order.created_at)}
                </p>
              </div>
            </CardHeader>
            <CardContent className="flex-1 min-h-0 overflow-y-auto pt-0">
              {events.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border bg-muted/20 px-4 py-8 text-center">
                  <History className="h-6 w-6 text-muted-foreground/50 mx-auto mb-1" />
                  <p className="text-sm font-medium text-muted-foreground">No activity yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {events.map((event, idx) => (
                    <SalesOrderEventRow
                      key={event.id}
                      event={event}
                      isLast={idx === events.length - 1}
                      showAbsoluteTimes={showAbsoluteEventTimes}
                      onToggleTimestampDisplay={() => setShowAbsoluteEventTimes((v) => !v)}
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
          <Button size="sm" onClick={handleSave} disabled={isSaving} className="bg-brand-primary hover:bg-brand-primary-hover">
            {isSaving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-1" />}
            Save Changes
          </Button>
        </div>
      )}

      <SalesDeliveryDialog
        open={deliveryDialogOpen}
        onOpenChange={setDeliveryDialogOpen}
        orderId={order.id}
        items={deliverableItems}
        onSaved={() => onUpdated?.()}
      />

      {order.invoice_id ? (
        <AccountInvoiceDialog
          invoiceId={order.invoice_id}
          accountId={order.account_id}
          accountName={accountName}
          linkedOrderNumber={order.sales_order_number}
          open={invoiceDialogOpen}
          onOpenChange={setInvoiceDialogOpen}
          showOrderSummary={false}
        />
      ) : null}

      <ManageSoApprovalsDialog
        open={manageApprovalsOpen}
        onOpenChange={setManageApprovalsOpen}
        approvers={approvers}
        assignableMembers={assignableMembers}
        requiredApprovals={order.required_approvals != null ? String(order.required_approvals) : ''}
        onRequiredApprovalsChange={(value) => {
          const required = value.trim() === '' ? null : Number(value);
          void updateSalesOrder({ id: order.id, data: { required_approvals: required } as UpdateSalesOrderDTO }).catch(() => {});
        }}
        onAddApprover={handleAddApprover}
        onRemoveApprover={handleRemoveApprover}
        initialsOf={initialsOf}
        avatarColor={avatarColor}
      />

      <AccountViewDialog accountId={order.account_id} open={accountViewOpen} onOpenChange={setAccountViewOpen} accountName={accountName} />

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
            All current order approvals will be withdrawn. Approvers must approve the order again after sections are re-confirmed.
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

export default SalesOrderDetailPanel;
