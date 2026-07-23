import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
  useAddWorkOrderApproverMutation,
  useApproveWorkOrderMutation,
  useCompleteWorkOrderMutation,
  useCreateInvoiceFromWorkOrderMutation,
  useGetWorkOrderApproversQuery,
  useGetWorkOrderByIdQuery,
  useGetWorkOrderEventsQuery,
  useGetWorkOrderItemsQuery,
  useRemoveWorkOrderApproverMutation,
  useStartWorkOrderMutation,
  useUnapproveWorkOrderMutation,
  useUpdateWorkOrderMutation,
  useVoidWorkOrderMutation,
} from '@/features/workOrders/workOrdersApi';
import { useGetFactoriesQuery } from '@/features/factories/factoriesApi';
import { useGetMachinesQuery } from '@/features/machines/machinesApi';
import { useGetProjectComponentsQuery } from '@/features/projectComponents/projectComponentsApi';
import { useGetAccountsQuery } from '@/features/accounts/accountsApi';
import { useGetAccountInvoiceByIdQuery } from '@/features/accountInvoices/accountInvoicesApi';
import { useGetWorkspaceMembersQuery } from '@/features/workspaces/workspaceApi';
import { useAppSelector } from '@/app/hooks';
import type {
  UpdateWorkOrderRequest,
  WorkOrder,
  WorkOrderApprover,
  WorkOrderItemSourceType,
  WorkOrderCompleteRequest,
  WorkOrderPriority,
  WorkOrderItem,
} from '@/types/workOrder';
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  CircleDashed,
  Loader2,
  Package,
  Wrench,
  StickyNote,
  History,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { API_LIMITS } from '@/constants/apiLimits';
import {
  WORK_ORDER_PRIORITIES,
  priorityLabel,
  workOrderDisplayLabel,
  workOrderStatusBadgeClass,
  workOrderStatusLabel,
  workOrderItemActionLabel,
} from '@/pages/newpages/orders/workOrderConstants';
import WoApprovalsTopBar from './WoApprovalsTopBar';
import ManageWoApprovalsDialog from './ManageWoApprovalsDialog';
import WoWorkflowChecklist from './WoWorkflowChecklist';
import WoLinkedInvoiceCard from './WoLinkedInvoiceCard';
import EditWorkOrderItemsDialog from './EditWorkOrderItemsDialog';
import VoidWorkOrderDialog from './VoidWorkOrderDialog';
import CompleteWorkOrderDialog from './CompleteWorkOrderDialog';
import WoEventLogRow from './WoEventLogRow';
import DiscussionThread from '@/components/newcomponents/customui/DiscussionThread';

const WO_NOISY_EVENT_TYPES = new Set(['updated']);
const detailNestedTableShellClass = 'border border-border rounded-lg overflow-hidden';

function toDateInputValue(d: string | null | undefined): string {
  if (!d) return '';
  return d.slice(0, 10);
}

const fieldLabelClass = 'text-xs text-muted-foreground uppercase tracking-wide';

function partInventoryStatus(item: WorkOrderItem, orderCompleted: boolean): string {
  if (!item.uses_inventory) return 'Not tracked';
  if (orderCompleted) return 'Applied on complete';
  if (item.consumed_at) return 'Consumed';
  return 'Pending until start';
}

interface WorkOrderDetailPanelProps {
  order: WorkOrder;
  onClose: () => void;
  onDelete: () => void;
  /** 'page' (default) shows a back button in the header for the full-page split view.
   * 'modal' hides it — used when this panel is embedded in a Dialog, which already
   * provides its own close affordance. */
  variant?: 'page' | 'modal';
  /** If set, auto-opens the item editor on mount with this source type preselected —
   * used right after a quick action creates an order that involves parts. */
  autoOpenItemsSourceHint?: WorkOrderItemSourceType | null;
}

const WorkOrderDetailPanel: React.FC<WorkOrderDetailPanelProps> = ({
  order: orderProp,
  onClose,
  onDelete: _onDelete,
  variant = 'page',
  autoOpenItemsSourceHint,
}) => {
  const [manageApprovalsOpen, setManageApprovalsOpen] = useState(false);
  const [editItemsOpen, setEditItemsOpen] = useState(Boolean(autoOpenItemsSourceHint));
  const [voidOpen, setVoidOpen] = useState(false);
  const [completeOpen, setCompleteOpen] = useState(false);
  const [showUpdateEvents, setShowUpdateEvents] = useState(false);

  const { workspace, user } = useAppSelector((s) => s.auth);
  const currentUserId = user?.id ?? null;

  const { data: orderFresh } = useGetWorkOrderByIdQuery(orderProp.id);
  const order = orderFresh ?? orderProp;

  const { data: items = [], isLoading: itemsLoading } = useGetWorkOrderItemsQuery(order.id);
  const { data: approversData } = useGetWorkOrderApproversQuery(order.id);
  const { data: apiEvents = [] } = useGetWorkOrderEventsQuery(order.id);
  const { data: factories = [] } = useGetFactoriesQuery({ skip: 0, limit: API_LIMITS.FLEXIBLE_1000 });
  const { data: machines = [] } = useGetMachinesQuery({ skip: 0, limit: API_LIMITS.FLEXIBLE_1000 });
  const { data: projectComponents = [] } = useGetProjectComponentsQuery({ skip: 0, limit: API_LIMITS.FLEXIBLE_1000 });
  const { data: accounts = [] } = useGetAccountsQuery({ skip: 0, limit: API_LIMITS.ACCOUNTS_LIST_MAX });
  const { data: members = [] } = useGetWorkspaceMembersQuery(workspace?.id ?? 0, { skip: !workspace?.id });
  const { data: linkedInvoiceQuery } = useGetAccountInvoiceByIdQuery(order.invoice_id!, {
    skip: order.invoice_id == null,
  });
  const linkedInvoice =
    order.invoice_id != null && linkedInvoiceQuery?.id === order.invoice_id ? linkedInvoiceQuery : undefined;

  const [updateOrder] = useUpdateWorkOrderMutation();
  const [startOrder, { isLoading: isStarting }] = useStartWorkOrderMutation();
  const [completeOrder, { isLoading: isCompleting }] = useCompleteWorkOrderMutation();
  const [voidOrder, { isLoading: isVoiding }] = useVoidWorkOrderMutation();
  const [addApprover] = useAddWorkOrderApproverMutation();
  const [removeApprover] = useRemoveWorkOrderApproverMutation();
  const [approveOrder] = useApproveWorkOrderMutation();
  const [unapproveOrder] = useUnapproveWorkOrderMutation();
  const [createInvoice, { isLoading: isCreatingInvoice }] = useCreateInvoiceFromWorkOrderMutation();

  const approvers: WorkOrderApprover[] = approversData?.approvers ?? [];
  const approvalSummary = approversData?.summary ?? { approved_count: 0, required: 0, met: true };
  const requiredApprovals = order.required_approvals != null ? String(order.required_approvals) : '';

  const isLocked = order.status === 'COMPLETED' || order.status === 'VOIDED';
  const isInProgress = order.status === 'IN_PROGRESS';
  const isVoided = order.status === 'VOIDED';
  const canEditDraftFields = !isLocked && !isInProgress;
  const canEditScheduleFields = !isLocked;
  const showCompletionNotesCard = order.status === 'COMPLETED';
  const isOrderCompleted = order.status === 'COMPLETED';
  const hasRecordedApprovals = approvers.some((a) => a.approved);

  const myApproval = currentUserId != null ? approvers.find((a) => a.user_id === currentUserId) : undefined;
  const assignedUserIds = new Set(approvers.map((a) => a.user_id));
  const assignableMembers = members.filter((m) => m.status === 'active' && !assignedUserIds.has(m.user_id));

  const formatDate = (d: string | null | undefined) =>
    d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
  const itemDisplayName = (it: { item_name: string | null; item_id: number }) =>
    it.item_name ?? `Item #${it.item_id}`;
  const qtyWithUnit = (qty: number, unit: string | null) => (unit ? `${qty} ${unit}` : String(qty));
  const formatCurrency = (v: number | null | undefined) =>
    v != null
      ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(v)
      : '—';

  const factoryName = factories.find((f) => f.id === order.factory_id)?.name ?? `Factory #${order.factory_id}`;
  const machineName = order.machine_id
    ? machines.find((m) => m.id === order.machine_id)?.name ?? `Machine #${order.machine_id}`
    : null;
  const componentName = order.project_component_id
    ? projectComponents.find((c) => c.id === order.project_component_id)?.name ?? `Component #${order.project_component_id}`
    : null;
  const accountName = order.account_id
    ? accounts.find((a) => a.id === order.account_id)?.name ?? `#${order.account_id}`
    : null;

  const scrollToApprovals = () => {
    document.getElementById('wo-section-approvals')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const confirmStructuralEdit = (): boolean => {
    if (order.status !== 'DRAFT' || !hasRecordedApprovals) return true;
    return window.confirm('Editing details will reset approvals. Continue?');
  };

  const handleFieldUpdate = async (data: UpdateWorkOrderRequest, structural = false) => {
    if (structural && !confirmStructuralEdit()) return;
    try {
      await updateOrder({ id: order.id, data }).unwrap();
    } catch (err: unknown) {
      const e = err as { data?: { detail?: string } };
      toast.error(e?.data?.detail || 'Failed to update work order');
    }
  };

  const handleStart = async () => {
    try {
      await startOrder(order.id).unwrap();
      toast.success('Work started');
    } catch (err: unknown) {
      const e = err as { data?: { detail?: string } };
      toast.error(e?.data?.detail || 'Failed to start work order');
    }
  };

  const handleComplete = async (data: WorkOrderCompleteRequest) => {
    try {
      await completeOrder({ id: order.id, data }).unwrap();
      toast.success('Work order completed');
      setCompleteOpen(false);
    } catch (err: unknown) {
      const e = err as { data?: { detail?: string } };
      toast.error(e?.data?.detail || 'Failed to complete work order');
    }
  };

  const handleVoid = async (voidNote: string) => {
    try {
      await voidOrder({ id: order.id, void_note: voidNote }).unwrap();
      toast.success('Work order voided');
      setVoidOpen(false);
    } catch (err: unknown) {
      const e = err as { data?: { detail?: string } };
      toast.error(e?.data?.detail || 'Failed to void work order');
    }
  };

  const handleCreateInvoice = async () => {
    try {
      await createInvoice(order.id).unwrap();
      toast.success('Invoice created');
    } catch (err: unknown) {
      const e = err as { data?: { detail?: string } };
      toast.error(e?.data?.detail || 'Failed to create invoice');
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

  const handleAddApprover = async (userId: number) => {
    try {
      await addApprover({ woId: order.id, user_id: userId }).unwrap();
    } catch (err: unknown) {
      const e = err as { data?: { detail?: string } };
      toast.error(e?.data?.detail || 'Failed to add approver');
    }
  };

  const handleRemoveApprover = async (userId: number) => {
    try {
      await removeApprover({ woId: order.id, userId }).unwrap();
    } catch (err: unknown) {
      const e = err as { data?: { detail?: string } };
      toast.error(e?.data?.detail || 'Failed to remove approver');
    }
  };

  const consumedItems = items.filter((i) => i.consumed_at != null);

  const filteredEvents = useMemo(() => {
    const events = apiEvents.map((e) => ({
      id: e.id,
      event_type: e.event_type,
      description: e.description,
      created_at: e.created_at,
      performer_name: e.user_name,
      metadata: e.metadata,
    }));
    return showUpdateEvents
      ? events
      : events.filter((e) => !WO_NOISY_EVENT_TYPES.has(e.event_type));
  }, [apiEvents, showUpdateEvents]);

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden">
      <div className="shrink-0 border-b border-border bg-card">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-6 py-3 lg:flex-nowrap">
          <div className="flex items-center gap-3 min-w-0 shrink-0">
            {variant === 'page' && (
              <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 shrink-0">
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Back</span>
              </Button>
            )}
            <div className="min-w-0">
              <h1 className="text-lg font-semibold text-card-foreground leading-tight">{order.work_order_number}</h1>
              <p className="text-sm text-muted-foreground truncate">{workOrderDisplayLabel(order)}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Badge variant="outline" className={workOrderStatusBadgeClass(order.status)}>
              {workOrderStatusLabel(order.status)}
            </Badge>
          </div>

          <div className="hidden lg:block h-8 w-px shrink-0 bg-border" aria-hidden />

          <WoApprovalsTopBar
            layout="inline"
            approvers={approvers}
            approvalSummary={approvalSummary}
            currentUserId={currentUserId}
            myApproval={myApproval}
            onManage={() => setManageApprovalsOpen(true)}
            onToggleMyApproval={handleToggleMyApproval}
            isVoided={isVoided}
            isLocked={isLocked}
            onVoidOrder={() => setVoidOpen(true)}
          />
        </div>

        {isVoided && (
          <div className="border-t border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/40 px-6 py-3 space-y-1">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
              <p className="text-sm font-semibold text-red-700 dark:text-red-300">
                This work order has been voided
              </p>
            </div>
            {order.void_note && (
              <p className="text-xs text-red-600 dark:text-red-400 pl-6">Reason: {order.void_note}</p>
            )}
          </div>
        )}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-6">
        <div className={cn('space-y-6', isVoided && 'opacity-40 pointer-events-none select-none')}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader className="p-4 pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Wrench className="h-4 w-4 text-muted-foreground" />
                  Work order details
                </CardTitle>
                {isLocked && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {isVoided
                      ? 'This order is voided and cannot be edited.'
                      : 'This order is completed and cannot be edited.'}
                  </p>
                )}
              </CardHeader>
              <CardContent className="p-4 pt-0 space-y-3">
                <div className="border-b border-border pb-3">
                  <p className="text-sm flex flex-wrap items-center gap-x-3 gap-y-1 leading-snug">
                    <span>
                      <span className="text-muted-foreground">Type: </span>
                      <span className="font-medium text-foreground">{order.work_order_type_name ?? '—'}</span>
                    </span>
                    <span>
                      <span className="text-muted-foreground">Factory: </span>
                      <span className="font-medium text-foreground">{factoryName}</span>
                    </span>
                    <span>
                      <span className="text-muted-foreground">Target: </span>
                      <span className="font-medium text-foreground">{machineName || componentName || 'None'}</span>
                    </span>
                    <span>
                      <span className="text-muted-foreground">Cost: </span>
                      <span className="font-medium text-foreground">{formatCurrency(order.cost)}</span>
                    </span>
                    <span>
                      <span className="text-muted-foreground">Account: </span>
                      <span className="font-medium text-foreground">{accountName ?? 'Internal / free'}</span>
                    </span>
                  </p>
                </div>

                <div className="space-y-3">
                  <p className="text-sm font-medium text-foreground">Planning</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className={fieldLabelClass}>Priority</Label>
                      {canEditDraftFields ? (
                        <Select
                          value={order.priority}
                          onValueChange={(v) => handleFieldUpdate({ priority: v as WorkOrderPriority }, true)}
                        >
                          <SelectTrigger className="h-8">
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
                      ) : (
                        <p className="text-sm font-medium">{priorityLabel(order.priority)}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label className={fieldLabelClass}>Assigned to</Label>
                      {canEditScheduleFields ? (
                        <Input
                          className="h-8"
                          defaultValue={order.assigned_to ?? ''}
                          placeholder="Optional"
                          onBlur={(e) => {
                            const v = e.target.value.trim();
                            if (v !== (order.assigned_to ?? '')) {
                              handleFieldUpdate({ assigned_to: v || undefined });
                            }
                          }}
                        />
                      ) : (
                        <p className="text-sm font-medium">{order.assigned_to ?? '—'}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label className={fieldLabelClass}>Planned start date</Label>
                      {canEditScheduleFields ? (
                        <Input
                          type="date"
                          className="h-8"
                          defaultValue={toDateInputValue(order.planned_date)}
                          onBlur={(e) => {
                            const v = e.target.value;
                            const orig = toDateInputValue(order.planned_date);
                            if (v !== orig) handleFieldUpdate({ planned_date: v || undefined });
                          }}
                        />
                      ) : (
                        <p className="text-sm font-medium">{formatDate(order.planned_date)}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label className={fieldLabelClass}>End date</Label>
                      {canEditScheduleFields ? (
                        <Input
                          type="date"
                          className="h-8"
                          defaultValue={toDateInputValue(order.end_date)}
                          onBlur={(e) => {
                            const v = e.target.value;
                            const orig = toDateInputValue(order.end_date);
                            if (v !== orig) handleFieldUpdate({ end_date: v || undefined });
                          }}
                        />
                      ) : (
                        <p className="text-sm font-medium">{formatDate(order.end_date)}</p>
                      )}
                    </div>
                    <div className="sm:col-span-2 space-y-2">
                      <Label className={fieldLabelClass}>Description</Label>
                      {canEditDraftFields ? (
                        <Textarea
                          className="resize-none min-h-[60px]"
                          rows={2}
                          defaultValue={order.description ?? ''}
                          placeholder="What is this work order about? (optional)"
                          onBlur={(e) => {
                            const v = e.target.value.trim();
                            if (v !== (order.description ?? '')) {
                              handleFieldUpdate({ description: v || undefined }, true);
                            }
                          }}
                        />
                      ) : (
                        <p className="text-sm font-medium">{order.description?.trim() || '—'}</p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="p-4 pb-3 flex flex-row items-start justify-between gap-3">
                <div className="min-w-0">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    Parts ({items.length})
                    {consumedItems.length > 0 && (
                      <Badge variant="outline" className="ml-1 font-normal text-green-600 border-green-600/30">
                        {consumedItems.length} consumed
                      </Badge>
                    )}
                  </CardTitle>
                  {!order.uses_inventory && (
                    <p className="text-xs text-muted-foreground mt-1">This order does not track parts</p>
                  )}
                </div>
                {!isLocked && order.uses_inventory && (
                  <div className="shrink-0 text-right space-y-0.5">
                    <Button variant="outline" size="sm" onClick={() => setEditItemsOpen(true)}>
                      Edit parts
                    </Button>
                    {isInProgress && (
                      <p className="text-xs text-muted-foreground max-w-[10rem]">Consumed lines cannot be changed</p>
                    )}
                  </div>
                )}
              </CardHeader>
              <CardContent className="pt-0">
                {itemsLoading ? (
                  <div className="flex items-center gap-2 py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Loading parts…</span>
                  </div>
                ) : (
                  <div className={detailNestedTableShellClass}>
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead className="py-2 w-10">#</TableHead>
                          <TableHead className="py-2">Part name</TableHead>
                          <TableHead className="py-2">Qty</TableHead>
                          <TableHead className="py-2">Inventory</TableHead>
                          <TableHead className="py-2">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {items.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="py-6 text-center text-sm text-muted-foreground">
                              No parts on this order
                            </TableCell>
                          </TableRow>
                        ) : (
                          items.map((it, idx) => (
                            <TableRow key={it.id} className="border-b border-border bg-background hover:bg-muted/40">
                              <TableCell className="py-2 text-muted-foreground">{idx + 1}</TableCell>
                              <TableCell className="py-2">
                                <span className="font-medium text-sm">{itemDisplayName(it)}</span>
                              </TableCell>
                              <TableCell className="py-2">{qtyWithUnit(it.quantity, it.item_unit)}</TableCell>
                              <TableCell className="py-2 text-sm text-muted-foreground">
                                {partInventoryStatus(it, isOrderCompleted)}
                              </TableCell>
                              <TableCell className="py-2 text-sm text-muted-foreground">
                                {it.uses_inventory ? (
                                  <>
                                    {workOrderItemActionLabel(it.action_type)}
                                    {it.action_type === 'REPLACE' && it.replaced_item_name && (
                                      <span className="block text-xs">Replaces: {it.replaced_item_name}</span>
                                    )}
                                  </>
                                ) : (
                                  '—'
                                )}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            {showCompletionNotesCard && (
              <Card>
                <CardHeader className="p-4 pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <StickyNote className="h-4 w-4 text-muted-foreground" />
                    Completion notes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {order.completion_notes ? (
                    <p className="text-sm whitespace-pre-wrap">{order.completion_notes}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground">No completion notes were added.</p>
                  )}
                </CardContent>
              </Card>
            )}

            <WoLinkedInvoiceCard
              order={order}
              invoice={linkedInvoice}
              accountName={accountName}
              isCreatingInvoice={isCreatingInvoice}
              onCreateInvoice={handleCreateInvoice}
            />

            <DiscussionThread entityType="work_order" entityId={order.id} />

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
                        showUpdateEvents &&
                          'text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300',
                      )}
                      onClick={() => setShowUpdateEvents((v) => !v)}
                      aria-pressed={showUpdateEvents}
                      aria-label={showUpdateEvents ? 'Hide field edit events' : 'Show field edit events'}
                      title="Toggle field-level edit history (hidden by default to reduce noise)"
                    >
                      {showUpdateEvents ? (
                        <Check className="h-3.5 w-3.5" />
                      ) : (
                        <CircleDashed className="h-3.5 w-3.5" />
                      )}
                      Show updates
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
                    <p className="text-xs text-muted-foreground mt-1">Turn on Show updates to see field edit activity</p>
                  </div>
                ) : (
                  <div className="space-y-0">
                    {filteredEvents.map((event, idx) => (
                      <WoEventLogRow
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

          <div className="lg:col-span-1">
            <WoWorkflowChecklist
              order={order}
              approvalSummary={approvalSummary}
              onScrollToApprovals={scrollToApprovals}
              onStart={handleStart}
              isStarting={isStarting}
              onComplete={() => setCompleteOpen(true)}
              isCompleting={isCompleting}
              className="lg:sticky lg:top-0 lg:self-start"
            />
          </div>
        </div>
        </div>
      </div>

      <ManageWoApprovalsDialog
        open={manageApprovalsOpen}
        onOpenChange={setManageApprovalsOpen}
        approvers={approvers}
        assignableMembers={assignableMembers}
        requiredApprovals={requiredApprovals}
        onRequiredApprovalsChange={(v) => handleFieldUpdate({ required_approvals: v === '' ? null : Number(v) })}
        onAddApprover={handleAddApprover}
        onRemoveApprover={handleRemoveApprover}
      />

      <EditWorkOrderItemsDialog
        open={editItemsOpen}
        onOpenChange={setEditItemsOpen}
        woId={order.id}
        factoryId={order.factory_id}
        sectionId={
          order.machine_id
            ? machines.find((m) => m.id === order.machine_id)?.factory_section_id ?? null
            : null
        }
        machineId={order.machine_id}
        items={items}
      />

      <VoidWorkOrderDialog
        open={voidOpen}
        onOpenChange={setVoidOpen}
        onVoid={handleVoid}
        isVoiding={isVoiding}
        woNumber={order.work_order_number}
        hasConsumedInventory={consumedItems.length > 0 && order.status === 'IN_PROGRESS'}
        hasDraftInvoice={linkedInvoice?.invoice_status === 'draft'}
      />

      <CompleteWorkOrderDialog
        open={completeOpen}
        onOpenChange={setCompleteOpen}
        onComplete={handleComplete}
        isCompleting={isCompleting}
        hasMachineTarget={order.machine_id != null}
      />
    </div>
  );
};

export default WorkOrderDetailPanel;
