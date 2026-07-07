import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { useGetWorkOrderTypesQuery } from '@/features/workOrderTypes/workOrderTypesApi';
import { useGetAccountsQuery } from '@/features/accounts/accountsApi';
import { useGetAccountInvoiceByIdQuery } from '@/features/accountInvoices/accountInvoicesApi';
import { useGetWorkspaceMembersQuery } from '@/features/workspaces/workspaceApi';
import { useAppSelector } from '@/app/hooks';
import type { UpdateWorkOrderRequest, WorkOrder, WorkOrderApprover, WorkOrderItemSourceType, WorkOrderCompleteRequest } from '@/types/workOrder';
import {
  ArrowLeft,
  Loader2,
  Package,
  Wrench,
  StickyNote,
  Trash2,
  Calendar,
  History,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { API_LIMITS } from '@/constants/apiLimits';
import {
  priorityLabel,
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
  onDelete,
  variant = 'page',
  autoOpenItemsSourceHint,
}) => {
  const [manageApprovalsOpen, setManageApprovalsOpen] = useState(false);
  const [editItemsOpen, setEditItemsOpen] = useState(Boolean(autoOpenItemsSourceHint));
  const [voidOpen, setVoidOpen] = useState(false);
  const [completeOpen, setCompleteOpen] = useState(false);

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
  const { data: workOrderTypes = [] } = useGetWorkOrderTypesQuery({ skip: 0, limit: API_LIMITS.FLEXIBLE_1000 });
  const { data: accounts = [] } = useGetAccountsQuery({ skip: 0, limit: API_LIMITS.ACCOUNTS_LIST_MAX });
  const { data: members = [] } = useGetWorkspaceMembersQuery(workspace?.id ?? 0, { skip: !workspace?.id });
  const { data: linkedInvoiceQuery } = useGetAccountInvoiceByIdQuery(order.invoice_id!, {
    skip: order.invoice_id == null,
  });
  const linkedInvoice =
    order.invoice_id != null && linkedInvoiceQuery?.id === order.invoice_id ? linkedInvoiceQuery : undefined;

  const [updateOrder, { isLoading: isUpdating }] = useUpdateWorkOrderMutation();
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
  const isVoided = order.status === 'VOIDED';

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

  const handleFieldUpdate = async (data: UpdateWorkOrderRequest) => {
    try {
      await updateOrder({ id: order.id, data }).unwrap();
    } catch (err: unknown) {
      const e = err as { data?: { detail?: string } };
      toast.error(e?.data?.detail || 'Failed to update work order');
    }
  };

  const handleTargetChange = async (kind: 'machine' | 'component' | 'none', id?: number) => {
    if (kind === 'machine') {
      await handleFieldUpdate({ machine_id: id, project_component_id: null });
    } else if (kind === 'component') {
      await handleFieldUpdate({ project_component_id: id, machine_id: null });
    } else {
      await handleFieldUpdate({ machine_id: null, project_component_id: null });
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

  const displayEvents = apiEvents.map((e) => ({
    id: e.id,
    event_type: e.event_type,
    description: e.description,
    created_at: e.created_at,
    performer_name: e.user_name,
    metadata: e.metadata,
  }));

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden">
      <div className="shrink-0 border-b border-border bg-card px-6 py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            {variant === 'page' && (
              <Button variant="ghost" size="icon" onClick={onClose} className="mt-0.5 h-8 w-8">
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Back</span>
              </Button>
            )}
            <div>
              <h1 className="text-xl font-semibold text-card-foreground">{order.work_order_number}</h1>
              <p className="text-sm text-muted-foreground">{order.title}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge variant="outline" className={workOrderStatusBadgeClass(order.status)}>
              {workOrderStatusLabel(order.status)}
            </Badge>
            {order.status === 'DRAFT' && (
              <Button
                variant="outline"
                size="sm"
                className="text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
                onClick={onDelete}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete Order
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-4">
        <WoApprovalsTopBar
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Wrench className="h-4 w-4 text-muted-foreground" />
                  Work order details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                  <div>
                    <dt className="text-muted-foreground text-xs uppercase tracking-wide">Work type</dt>
                    <dd className="mt-0.5">
                      {isLocked ? (
                        <span className="font-medium">{order.work_order_type_name ?? '—'}</span>
                      ) : (
                        <Select
                          value={String(order.work_order_type_id)}
                          onValueChange={(v) => handleFieldUpdate({ work_order_type_id: Number(v) })}
                          disabled={isUpdating}
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {workOrderTypes.map((t) => (
                              <SelectItem key={t.id} value={String(t.id)}>
                                {t.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground text-xs uppercase tracking-wide">Priority</dt>
                    <dd className="font-medium mt-0.5">{priorityLabel(order.priority)}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground text-xs uppercase tracking-wide">Factory</dt>
                    <dd className="font-medium mt-0.5">{factoryName}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground text-xs uppercase tracking-wide">Target</dt>
                    <dd className="mt-0.5">
                      {isLocked ? (
                        <span className="font-medium">{machineName || componentName || 'None'}</span>
                      ) : (
                        <Select
                          value={order.machine_id ? `machine:${order.machine_id}` : order.project_component_id ? `component:${order.project_component_id}` : 'none'}
                          onValueChange={(v) => {
                            if (v === 'none') return handleTargetChange('none');
                            const [kind, id] = v.split(':');
                            return handleTargetChange(kind as 'machine' | 'component', Number(id));
                          }}
                          disabled={isUpdating}
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">No target (general work)</SelectItem>
                            {machines.map((m) => (
                              <SelectItem key={`machine:${m.id}`} value={`machine:${m.id}`}>
                                Machine: {m.name}
                              </SelectItem>
                            ))}
                            {projectComponents.map((c) => (
                              <SelectItem key={`component:${c.id}`} value={`component:${c.id}`}>
                                Component: {c.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground text-xs uppercase tracking-wide">Cost (internal)</dt>
                    <dd className="font-semibold mt-0.5">{formatCurrency(order.cost)}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground text-xs uppercase tracking-wide">Billed account</dt>
                    <dd className="mt-0.5">
                      {isLocked ? (
                        <span className="font-medium">{accountName ?? 'Internal / free'}</span>
                      ) : (
                        <Select
                          value={order.account_id ? String(order.account_id) : 'none'}
                          onValueChange={(v) => handleFieldUpdate({ account_id: v === 'none' ? null : Number(v) })}
                          disabled={isUpdating}
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Internal / free</SelectItem>
                            {accounts.map((a) => (
                              <SelectItem key={a.id} value={String(a.id)}>
                                {a.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground text-xs uppercase tracking-wide">Assigned to</dt>
                    <dd className="font-medium mt-0.5">{order.assigned_to ?? '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground text-xs uppercase tracking-wide">Start / End</dt>
                    <dd className="font-medium mt-0.5 flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                      {formatDate(order.start_date)} – {formatDate(order.end_date)}
                    </dd>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <StickyNote className="h-4 w-4 text-muted-foreground" />
                  Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                {order.description || order.completion_notes ? (
                  <div className="text-sm space-y-2">
                    {order.description && (
                      <p>
                        <span className="text-muted-foreground">Description: </span>
                        {order.description}
                      </p>
                    )}
                    {order.completion_notes && (
                      <p>
                        <span className="text-muted-foreground">Completion: </span>
                        {order.completion_notes}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No notes for this order.</p>
                )}
                {!isLocked && (
                  <Textarea
                    className="mt-3 resize-none"
                    rows={2}
                    placeholder="Add completion notes..."
                    defaultValue={order.completion_notes ?? ''}
                    onBlur={(e) => {
                      if (e.target.value !== (order.completion_notes ?? '')) {
                        handleFieldUpdate({ completion_notes: e.target.value });
                      }
                    }}
                  />
                )}
              </CardContent>
            </Card>

            {order.uses_inventory && (
            <Card>
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  Items ({items.length})
                  {consumedItems.length > 0 && (
                    <Badge variant="outline" className="ml-1 font-normal text-green-600 border-green-600/30">
                      {consumedItems.length} consumed
                    </Badge>
                  )}
                </CardTitle>
                {!isLocked && (
                  <Button variant="outline" size="sm" onClick={() => setEditItemsOpen(true)}>
                    Edit items
                  </Button>
                )}
              </CardHeader>
              <CardContent className="p-0">
                {itemsLoading ? (
                  <div className="flex items-center gap-2 py-8 px-6">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Loading items…</span>
                  </div>
                ) : items.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-8 px-6">No items</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead className="py-2 w-10">#</TableHead>
                          <TableHead className="py-2">Item name</TableHead>
                          <TableHead className="py-2">Qty</TableHead>
                          <TableHead className="py-2">Inventory</TableHead>
                          <TableHead className="py-2">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {items.map((it, idx) => (
                          <TableRow key={it.id} className="border-b border-border">
                            <TableCell className="py-2 text-muted-foreground">{idx + 1}</TableCell>
                            <TableCell className="py-2">
                              <span className="font-medium text-sm">{itemDisplayName(it)}</span>
                            </TableCell>
                            <TableCell className="py-2">{qtyWithUnit(it.quantity, it.item_unit)}</TableCell>
                            <TableCell className="py-2 text-sm text-muted-foreground">
                              {it.uses_inventory
                                ? it.consumed_at
                                  ? 'Consumed'
                                  : 'Pending on start'
                                : 'Not tracked'}
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
                        ))}
                      </TableBody>
                    </Table>
                  </div>
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

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <History className="h-4 w-4 text-muted-foreground" />
                  Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                {displayEvents.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No activity yet.</p>
                ) : (
                  <div className="space-y-0">
                    {displayEvents.map((event, idx) => (
                      <WoEventLogRow key={event.id} event={event} isLast={idx === displayEvents.length - 1} />
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
            />
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
        machineId={order.machine_id}
        items={items}
        defaultSourceType={autoOpenItemsSourceHint ?? undefined}
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
