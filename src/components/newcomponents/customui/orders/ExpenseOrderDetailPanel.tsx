import React, { useEffect, useMemo, useRef, useState } from 'react';
import DiscussionThread from '@/components/newcomponents/customui/DiscussionThread';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  useGetExpenseOrderByIdQuery,
  useGetExpenseOrderItemsQuery,
  useGetExpenseOrderApproversQuery,
  useGetExpenseOrderEventsQuery,
  useUpdateExpenseOrderMutation,
  useSetExpenseOrderSectionConfirmMutation,
  useMarkExpenseOrderCompleteMutation,
  useAddExpenseOrderApproverMutation,
  useRemoveExpenseOrderApproverMutation,
  useApproveExpenseOrderMutation,
  useUnapproveExpenseOrderMutation,
  useCreateInvoiceFromExpenseOrderMutation,
} from '@/features/expenseOrders/expenseOrdersApi';
import {
  useConfirmAccountInvoiceMutation,
  useGetAccountInvoiceByIdQuery,
} from '@/features/accountInvoices/accountInvoicesApi';
import { useGetAccountsQuery } from '@/features/accounts/accountsApi';
import { useGetWorkspaceMembersQuery } from '@/features/workspaces/workspaceApi';
import { useAppSelector } from '@/app/hooks';
import type { ExpenseOrder } from '@/types/expenseOrder';
import type { ExpenseOrderApprover } from '@/types/expenseOrder';
import {
  Receipt,
  Loader2,
  MessageSquare,
  Send,
  History,
  Check,
  CheckCircle2,
  Clock,
  CircleDashed,
  Pencil,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';
import { API_LIMITS } from '@/constants/apiLimits';
import AccountSelectorDialog from '@/components/newcomponents/customui/AccountSelectorDialog';
import { AccountSelectSummaryButton } from '@/components/newcomponents/customui/AccountSelectSummaryButton';
import { SectionConfirmActions } from './PoSectionConfirmButton';
import EoApprovalsTopBar from './EoApprovalsTopBar';
import ManageEoApprovalsDialog from './ManageEoApprovalsDialog';
import EoWorkflowChecklist from './EoWorkflowChecklist';
import EoLinkedInvoiceCard from './EoLinkedInvoiceCard';
import EditExpenseOrderItemsDialog from './EditExpenseOrderItemsDialog';
import EoEventLogRow from './EoEventLogRow';
import {
  deriveExpenseOrderStage,
  eoStageBadgeClassName,
  isExpenseOrderCompleted,
  type EoScrollSection,
} from './expenseOrderMilestones';
import {
  getEoSectionConfirmReadiness,
  eoSectionConfirmLabel,
  type EoSectionConfirmKey,
} from './expenseOrderSectionConfirms';
import { EO_CONFIRM_EVENT_TYPES } from './expenseOrderEventVisuals';
import {
  EXPENSE_CATEGORIES,
  expenseCategoryLabel,
} from '@/components/newcomponents/customui/orders/expenseOrderConstants';

const confirmedSectionCardClass = 'border-muted-foreground/15 bg-muted/20';
const confirmedSectionContentClass = 'opacity-[0.88] saturate-[0.92]';

interface ExpenseOrderDetailPanelProps {
  order: ExpenseOrder;
  onClose: () => void;
  showCompleteOrders?: boolean;
}

interface EoDraft {
  account_id: number | null;
  expense_category: string;
  expense_date: string;
  due_date: string;
  description: string;
}

function draftFromOrder(order: ExpenseOrder): EoDraft {
  return {
    account_id: order.account_id,
    expense_category: order.expense_category,
    expense_date: order.expense_date ?? '',
    due_date: order.due_date ?? '',
    description: order.description ?? '',
  };
}

const ExpenseOrderDetailPanel: React.FC<ExpenseOrderDetailPanelProps> = ({
  order: orderProp,
  showCompleteOrders = false,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [manageApprovalsOpen, setManageApprovalsOpen] = useState(false);
  const [editItemsOpen, setEditItemsOpen] = useState(false);
  const [accountPickerOpen, setAccountPickerOpen] = useState(false);
  const [showConfirmEvents, setShowConfirmEvents] = useState(false);
  const [scrollHighlightTarget, setScrollHighlightTarget] = useState<EoScrollSection | null>(null);
  const [confirmingSection, setConfirmingSection] = useState<EoSectionConfirmKey | null>(null);
  const [unconfirmWarningOpen, setUnconfirmWarningOpen] = useState(false);
  const [pendingUnconfirmSection, setPendingUnconfirmSection] = useState<EoSectionConfirmKey | null>(
    null
  );

  const { workspace, user } = useAppSelector((s) => s.auth);
  const currentUserId = user?.id ?? null;

  const { data: orderFresh } = useGetExpenseOrderByIdQuery(orderProp.id);
  const order = orderFresh ?? orderProp;

  const { data: items = [], isLoading: itemsLoading, refetch: refetchItems } =
    useGetExpenseOrderItemsQuery(order.id);
  const { data: approversData, refetch: refetchApprovers } = useGetExpenseOrderApproversQuery(order.id);
  const { data: apiEvents = [] } = useGetExpenseOrderEventsQuery(order.id);
  const { data: accounts = [] } = useGetAccountsQuery({
    skip: 0,
    limit: API_LIMITS.ACCOUNTS_LIST_MAX,
  });
  const { data: members = [] } = useGetWorkspaceMembersQuery(workspace?.id ?? 0, {
    skip: !workspace?.id,
  });
  const { data: linkedInvoiceQuery } = useGetAccountInvoiceByIdQuery(order.invoice_id!, {
    skip: order.invoice_id == null,
  });
  const linkedInvoice =
    order.invoice_id != null && linkedInvoiceQuery?.id === order.invoice_id
      ? linkedInvoiceQuery
      : undefined;

  const [updateOrder, { isLoading: isUpdating }] = useUpdateExpenseOrderMutation();
  const [setSectionConfirm] = useSetExpenseOrderSectionConfirmMutation();
  const [markComplete, { isLoading: isMarkingComplete }] = useMarkExpenseOrderCompleteMutation();
  const [addApprover] = useAddExpenseOrderApproverMutation();
  const [removeApprover] = useRemoveExpenseOrderApproverMutation();
  const [approveOrder] = useApproveExpenseOrderMutation();
  const [unapproveOrder] = useUnapproveExpenseOrderMutation();
  const [createInvoice, { isLoading: isCreatingInvoice }] = useCreateInvoiceFromExpenseOrderMutation();
  const [confirmInvoice, { isLoading: isConfirmingInvoice }] = useConfirmAccountInvoiceMutation();

  const approvers: ExpenseOrderApprover[] = approversData?.approvers ?? [];
  const approvalSummary = approversData?.summary ?? { approved_count: 0, required: 0, met: true };
  const requiredApprovals =
    order.required_approvals != null ? String(order.required_approvals) : '';

  const detailsConfirmed = order.details_confirmed;
  const itemsConfirmed = order.items_confirmed;
  const invoiceConfirmed = order.invoice_confirmed;
  const orderComplete = isExpenseOrderCompleted(order);

  const [draft, setDraft] = useState<EoDraft>(() => draftFromOrder(order));
  useEffect(() => {
    setDraft(draftFromOrder(order));
  }, [order.id, order.updated_at]); // eslint-disable-line react-hooks/exhaustive-deps

  const isDirty =
    draft.account_id !== order.account_id ||
    draft.expense_category !== order.expense_category ||
    draft.expense_date !== (order.expense_date ?? '') ||
    draft.due_date !== (order.due_date ?? '') ||
    draft.description !== (order.description ?? '');

  const stageName = deriveExpenseOrderStage(order, approvalSummary);

  const filteredEvents = useMemo(
    () =>
      showConfirmEvents ? apiEvents : apiEvents.filter((e) => !EO_CONFIRM_EVENT_TYPES.has(e.event_type)),
    [apiEvents, showConfirmEvents]
  );

  const myApproval =
    currentUserId != null ? approvers.find((a) => a.user_id === currentUserId) : undefined;
  const assignedUserIds = new Set(approvers.map((a) => a.user_id));
  const assignableMembers = members.filter(
    (m) => m.status === 'active' && !assignedUserIds.has(m.user_id)
  );

  const accountName = order.account_id
    ? accounts.find((a) => a.id === order.account_id)?.name ?? `#${order.account_id}`
    : null;

  const formatCurrency = (v: number | null | undefined) =>
    v != null
      ? new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 2,
        }).format(v)
      : '—';

  const formatDate = (d: string | null | undefined) =>
    d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

  const qtyWithUnit = (qty: number, unit: string | null) => (unit ? `${qty} ${unit}` : String(qty));

  const scrollToSection = (section: EoScrollSection) => {
    const id =
      section === 'details'
        ? 'eo-section-details'
        : section === 'items'
          ? 'eo-section-items'
          : section === 'invoice'
            ? 'eo-section-invoice'
            : 'eo-section-approvals';
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setScrollHighlightTarget(section);
  };

  const dismissScrollHighlight = () => setScrollHighlightTarget(null);

  const saveDraftIfDirty = async () => {
    if (!isDirty) return;
    await updateOrder({
      id: order.id,
      data: {
        account_id: draft.account_id,
        expense_category: draft.expense_category,
        expense_date: draft.expense_date || null,
        due_date: draft.due_date || null,
        description: draft.description.trim() || null,
      },
    }).unwrap();
  };

  const requestSectionConfirmToggle = (
    section: EoSectionConfirmKey,
    currentlyConfirmed: boolean
  ) => {
    if (!currentlyConfirmed) {
      const readiness = getEoSectionConfirmReadiness(section, order, items, linkedInvoice);
      if (!readiness.ok) {
        toast.error(readiness.reason ?? 'Section not ready to confirm');
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
    section: EoSectionConfirmKey,
    nextConfirmed: boolean
  ) => {
    setConfirmingSection(section);
    try {
      if (nextConfirmed && section === 'details' && isDirty) {
        await saveDraftIfDirty();
      }
      await setSectionConfirm({
        id: order.id,
        data: { section, confirmed: nextConfirmed },
      }).unwrap();
      toast.success(
        nextConfirmed
          ? `${eoSectionConfirmLabel(section)} confirmed`
          : `${eoSectionConfirmLabel(section)} unconfirmed`
      );
      if (!nextConfirmed) {
        void refetchApprovers();
      }
    } catch (err: unknown) {
      const e = err as { data?: { detail?: string } };
      toast.error(e?.data?.detail || 'Failed to update section');
    } finally {
      setConfirmingSection(null);
    }
  };

  const handleMarkComplete = async () => {
    try {
      await markComplete(order.id).unwrap();
      const hint = showCompleteOrders
        ? ''
        : ' Hidden from open orders list — enable Complete in the sidebar to see it there.';
      toast.success(`Expense order marked complete${hint}`);
    } catch (err: unknown) {
      const e = err as { data?: { detail?: string } };
      toast.error(e?.data?.detail || 'Failed to mark complete');
    }
  };

  const handleSave = async () => {
    try {
      await saveDraftIfDirty();
      toast.success('Changes saved');
    } catch (err: unknown) {
      const e = err as { data?: { detail?: string } };
      toast.error(e?.data?.detail || 'Failed to save');
    }
  };

  const handleDiscard = () => setDraft(draftFromOrder(order));

  const handleAddApprover = async (userId: number) => {
    try {
      await addApprover({ eoId: order.id, user_id: userId }).unwrap();
    } catch (err: unknown) {
      const e = err as { data?: { detail?: string } };
      toast.error(e?.data?.detail || 'Failed to add approver');
    }
  };

  const handleRemoveApprover = async (userId: number) => {
    try {
      await removeApprover({ eoId: order.id, userId }).unwrap();
    } catch (err: unknown) {
      const e = err as { data?: { detail?: string } };
      toast.error(e?.data?.detail || 'Failed to remove approver');
    }
  };

  const handleRequiredApprovalsChange = async (value: string) => {
    const trimmed = value.trim();
    const parsed = trimmed === '' ? null : Number(trimmed);
    if (parsed != null && (Number.isNaN(parsed) || parsed < 0)) return;
    try {
      await updateOrder({
        id: order.id,
        data: { required_approvals: parsed },
      }).unwrap();
    } catch (err: unknown) {
      const e = err as { data?: { detail?: string } };
      toast.error(e?.data?.detail || 'Failed to update required approvals');
    }
  };

  const handleToggleMyApproval = async () => {
    if (currentUserId == null || !myApproval) return;
    try {
      if (myApproval.approved) {
        await unapproveOrder(order.id).unwrap();
      } else {
        await approveOrder(order.id).unwrap();
      }
    } catch (err: unknown) {
      const e = err as { data?: { detail?: string } };
      toast.error(e?.data?.detail || 'Failed to update approval');
    }
  };

  const handleCreateInvoice = async () => {
    try {
      await createInvoice(order.id).unwrap();
      toast.success('Draft invoice created');
    } catch (err: unknown) {
      const e = err as { data?: { detail?: string } };
      toast.error(e?.data?.detail || 'Failed to create invoice');
    }
  };

  const handleFinalizeInvoice = async () => {
    if (!order.invoice_id) return;
    try {
      await confirmInvoice(order.invoice_id).unwrap();
      toast.success('Invoice finalized');
    } catch (err: unknown) {
      const e = err as { data?: { detail?: string } };
      toast.error(e?.data?.detail || 'Failed to finalize invoice');
    }
  };

  const invoiceSectionReadiness = getEoSectionConfirmReadiness('invoice', order, items, linkedInvoice);
  const finalizeReadiness = order.invoice_id
    ? { ok: linkedInvoice?.invoice_status === 'draft', reason: 'Invoice is already finalized' }
    : { ok: false, reason: 'Create a draft invoice first' };

  const detailsSectionLocked = detailsConfirmed || orderComplete;
  const itemsSectionLocked = itemsConfirmed || orderComplete;

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden">
      <div ref={scrollContainerRef} className="flex-1 min-h-0 overflow-y-auto">
        <div className="mx-auto max-w-5xl px-6 py-6 space-y-4">
          <EoApprovalsTopBar
            approvers={approvers}
            approvalSummary={approvalSummary}
            currentUserId={currentUserId}
            myApproval={myApproval}
            highlighted={scrollHighlightTarget === 'approvals'}
            onHighlightDismiss={dismissScrollHighlight}
            onManage={() => setManageApprovalsOpen(true)}
            onToggleMyApproval={handleToggleMyApproval}
          />

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_min(280px,32%)] gap-4 items-start">
            <Card
              id="eo-section-details"
              className={cn('scroll-mt-6', detailsSectionLocked && confirmedSectionCardClass)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Receipt className="h-4 w-4 text-muted-foreground" />
                      Order details
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {expenseCategoryLabel(order.expense_category)} · {order.expense_number}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge
                      variant="secondary"
                      className={cn('text-xs', eoStageBadgeClassName(stageName))}
                    >
                      {stageName}
                    </Badge>
                    <SectionConfirmActions
                      id="eo-confirm-details"
                      confirmed={detailsConfirmed}
                      onToggle={() => requestSectionConfirmToggle('details', detailsConfirmed)}
                      isLoading={confirmingSection === 'details'}
                      label="order details"
                      highlighted={scrollHighlightTarget === 'details'}
                      onHighlightDismiss={dismissScrollHighlight}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent
                className={cn('space-y-4', detailsSectionLocked && confirmedSectionContentClass)}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wide">Account</Label>
                    <AccountSelectSummaryButton
                      onClick={() => {
                        if (!detailsSectionLocked) setAccountPickerOpen(true);
                      }}
                      ariaLabel="Select account"
                      selectedLine={accountName}
                      staleNumericId={draft.account_id != null ? String(draft.account_id) : null}
                      compactLabel
                      className={detailsSectionLocked ? 'pointer-events-none opacity-60' : undefined}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wide">Category</Label>
                    <Select
                      value={draft.expense_category}
                      onValueChange={(v) => setDraft((d) => ({ ...d, expense_category: v }))}
                      disabled={detailsSectionLocked}
                    >
                      <SelectTrigger className="bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {EXPENSE_CATEGORIES.map((c) => (
                          <SelectItem key={c.value} value={c.value}>
                            {c.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wide">Created</Label>
                    <div className="flex items-center gap-2 h-9 px-3 rounded-md border border-dashed border-border bg-muted/30 text-sm">
                      {formatDate(order.created_at)}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                      {orderComplete ? 'Completed' : 'Expense date'}
                    </Label>
                    {orderComplete ? (
                      <div className="flex items-center gap-2 h-9 px-3 rounded-md border border-dashed border-border bg-muted/30 text-sm">
                        {formatDate(order.completed_at)}
                      </div>
                    ) : (
                      <Input
                        type="date"
                        value={draft.expense_date}
                        onChange={(e) => setDraft((d) => ({ ...d, expense_date: e.target.value }))}
                        disabled={detailsSectionLocked}
                      />
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wide">Due date</Label>
                    <Input
                      type="date"
                      value={draft.due_date}
                      onChange={(e) => setDraft((d) => ({ ...d, due_date: e.target.value }))}
                      disabled={detailsSectionLocked}
                    />
                  </div>
                </div>

                <div className="space-y-3 pt-2 border-t border-border">
                  <div className="space-y-1.5">
                    <label htmlFor="eo-description" className="text-xs font-medium text-muted-foreground">
                      Description
                    </label>
                    <Input
                      id="eo-description"
                      value={draft.description}
                      onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
                      placeholder="Expense description..."
                      className="bg-background"
                      disabled={detailsSectionLocked}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <EoWorkflowChecklist
              className="max-lg:h-auto max-lg:w-full scroll-mt-6"
              order={order}
              itemCount={items.length}
              approvalSummary={approvalSummary}
              detailsConfirmed={detailsConfirmed}
              itemsConfirmed={itemsConfirmed}
              invoiceConfirmed={invoiceConfirmed}
              onScrollToSection={scrollToSection}
              onMarkComplete={handleMarkComplete}
              isMarkingComplete={isMarkingComplete}
            />
          </div>

          <Card
            id="eo-section-items"
            className={cn('scroll-mt-6', itemsSectionLocked && confirmedSectionCardClass)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle
                    className={cn(
                      'text-base flex items-center gap-2',
                      itemsSectionLocked && confirmedSectionContentClass
                    )}
                  >
                    <Receipt className="h-4 w-4 text-muted-foreground" />
                    Expenses ({items.length})
                  </CardTitle>
                  {items.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Total {formatCurrency(order.total_amount)}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8"
                    onClick={() => setEditItemsOpen(true)}
                    disabled={itemsSectionLocked}
                  >
                    <Pencil className="h-3.5 w-3.5 mr-1" />
                    Edit expenses
                  </Button>
                  <SectionConfirmActions
                    id="eo-confirm-items"
                    confirmed={itemsConfirmed}
                    onToggle={() => requestSectionConfirmToggle('items', itemsConfirmed)}
                    isLoading={confirmingSection === 'items'}
                    label="expenses"
                    highlighted={scrollHighlightTarget === 'items'}
                    onHighlightDismiss={dismissScrollHighlight}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className={cn('p-0', itemsSectionLocked && confirmedSectionContentClass)}>
              {itemsLoading ? (
                <p className="text-sm text-muted-foreground py-8 px-6">Loading expenses…</p>
              ) : items.length === 0 ? (
                <div className="px-6 py-8 text-center">
                  <p className="text-sm text-muted-foreground">No expense lines</p>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="mt-3"
                    onClick={() => setEditItemsOpen(true)}
                    disabled={itemsSectionLocked}
                  >
                    Add expenses
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="py-2 w-10">#</TableHead>
                        <TableHead className="py-2">Description</TableHead>
                        <TableHead className="py-2">Qty</TableHead>
                        <TableHead className="py-2">Unit price</TableHead>
                        <TableHead className="py-2">Line total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((it) => (
                        <TableRow key={it.id} className="border-b border-border">
                          <TableCell className="py-2 text-muted-foreground">{it.line_number}</TableCell>
                          <TableCell className="py-2 font-medium text-sm">{it.description ?? '—'}</TableCell>
                          <TableCell className="py-2">{qtyWithUnit(it.quantity, it.unit)}</TableCell>
                          <TableCell className="py-2">{formatCurrency(it.unit_price)}</TableCell>
                          <TableCell className="py-2">{formatCurrency(it.line_subtotal)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          <EoLinkedInvoiceCard
            order={order}
            invoice={linkedInvoice}
            events={apiEvents}
            accountName={accountName}
            invoiceConfirmed={invoiceConfirmed}
            confirmReadiness={invoiceSectionReadiness}
            finalizeReadiness={finalizeReadiness}
            isCreatingInvoice={isCreatingInvoice}
            isConfirmingInvoice={isConfirmingInvoice}
            isConfirmingSection={confirmingSection === 'invoice'}
            onCreateInvoice={handleCreateInvoice}
            onFinalizeInvoice={handleFinalizeInvoice}
            onToggleInvoiceConfirm={() =>
              requestSectionConfirmToggle('invoice', invoiceConfirmed)
            }
            highlighted={scrollHighlightTarget === 'invoice'}
            onHighlightDismiss={dismissScrollHighlight}
          />

          <DiscussionThread entityType="expense_order" entityId={order.id} />

          <Card className="flex flex-col max-h-[min(32rem,50vh)] overflow-hidden">
            <CardHeader className="p-4 pb-3 shrink-0">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                <div className="flex items-center gap-3 flex-wrap min-w-0">
                  <CardTitle className="text-base flex items-center gap-2">
                    <History className="h-4 w-4 text-muted-foreground" />
                    Event Log
                    <Badge variant="outline" className="ml-1 font-normal">
                      {filteredEvents.length}
                    </Badge>
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
              {apiEvents.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border bg-muted/20 px-4 py-8 text-center">
                  <History className="h-6 w-6 text-muted-foreground/50 mx-auto mb-1" />
                  <p className="text-sm font-medium text-muted-foreground">No activity yet</p>
                </div>
              ) : filteredEvents.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border bg-muted/20 px-4 py-8 text-center">
                  <CircleDashed className="h-6 w-6 text-muted-foreground/50 mx-auto mb-1" />
                  <p className="text-sm font-medium text-muted-foreground">No events to show</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredEvents.map((event, idx) => (
                    <EoEventLogRow
                      key={event.id}
                      event={{
                        id: event.id,
                        event_type: event.event_type,
                        description: event.description,
                        created_at: event.created_at,
                        performer_name: event.performer_name,
                        metadata: event.metadata,
                      }}
                      isLast={idx === filteredEvents.length - 1}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {isDirty && !detailsSectionLocked && (
        <div className="shrink-0 border-t border-border bg-card px-6 py-3 flex items-center justify-end gap-3">
          <span className="mr-auto text-sm text-muted-foreground flex items-center gap-1.5">
            <Clock className="h-4 w-4" />
            Unsaved changes
          </span>
          <Button variant="outline" size="sm" onClick={handleDiscard} disabled={isUpdating}>
            Discard
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isUpdating}
            className="bg-brand-primary hover:bg-brand-primary-hover"
          >
            {isUpdating ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4 mr-1" />
            )}
            Save Changes
          </Button>
        </div>
      )}

      <ManageEoApprovalsDialog
        open={manageApprovalsOpen}
        onOpenChange={setManageApprovalsOpen}
        approvers={approvers}
        assignableMembers={assignableMembers}
        requiredApprovals={requiredApprovals}
        onRequiredApprovalsChange={(v) => void handleRequiredApprovalsChange(v)}
        onAddApprover={handleAddApprover}
        onRemoveApprover={(userId) => void handleRemoveApprover(userId)}
      />

      <EditExpenseOrderItemsDialog
        open={editItemsOpen}
        onOpenChange={setEditItemsOpen}
        eoId={order.id}
        items={items}
        onSaved={() => void refetchItems()}
      />

      <AccountSelectorDialog
        open={accountPickerOpen}
        onOpenChange={setAccountPickerOpen}
        title="Select account"
        description="Optional header account for this expense order."
        selectedAccountId={draft.account_id ?? undefined}
        allowClear
        onSelect={(account) =>
          setDraft((d) => ({ ...d, account_id: account?.id ?? null }))
        }
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
            All current expense approvals will be withdrawn. Approvers must approve the order again
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

export default ExpenseOrderDetailPanel;
