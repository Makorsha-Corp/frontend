import React, { useEffect, useRef, useState } from 'react';
import DiscussionThread from '@/components/newcomponents/customui/DiscussionThread';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  useGetTransferOrderItemsQuery,
  useGetTransferOrderByIdQuery,
  useGetTransferOrderApproversQuery,
  useGetTransferOrderEventsQuery,
  useUpdateTransferOrderMutation,
  useMarkTransferOrderCompleteMutation,
  useAddTransferOrderApproverMutation,
  useRemoveTransferOrderApproverMutation,
  useApproveTransferOrderMutation,
  useUnapproveTransferOrderMutation,
} from '@/features/transferOrders/transferOrdersApi';
import { useGetFactoriesQuery } from '@/features/factories/factoriesApi';
import { useGetMachinesQuery } from '@/features/machines/machinesApi';
import { useGetProjectsQuery } from '@/features/projects/projectsApi';
import { useGetWorkspaceMembersQuery } from '@/features/workspaces/workspaceApi';
import { useAppSelector } from '@/app/hooks';
import type { TransferOrder } from '@/types/transferOrder';
import {
  ArrowLeftRight,
  ArrowRight,
  Package,
  Loader2,
  MessageSquare,
  Send,
  History,
  Check,
  CheckCircle2,
  Clock,
  CircleDashed,
  Pencil,
  ArrowRightLeft,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';
import { API_LIMITS } from '@/constants/apiLimits';
import { transferLocationName, transferLocationTypeLabel } from '@/pages/newpages/orders/transferOrderLocationLabels';
import { transferLocationIcon } from './TransferRouteDisplay';
import ToApprovalsTopBar from './ToApprovalsTopBar';
import ManageToApprovalsDialog from './ManageToApprovalsDialog';
import TrWorkflowChecklist from './TrWorkflowChecklist';
import EditTransferOrderItemsDialog from './EditTransferOrderItemsDialog';
import EditTransferOrderRouteDialog from './EditTransferOrderRouteDialog';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import ManageTransferOrderTransfersDialog from './ManageTransferOrderTransfersDialog';
import ToEventLogRow from './ToEventLogRow';
import { useTransferOrderEvents } from './TransferOrderEventFeed';
import type { TransferOrderApprover } from '@/types/transferOrder';
import {
  deriveTransferOrderStage,
  getPendingTransferCount,
  isTransferReadyForApproval,
  trStageBadgeClassName,
  type TrScrollSection,
} from './transferOrderMilestones';

const confirmedSectionCardClass = 'border-muted-foreground/15 bg-muted/20';
const confirmedSectionContentClass = 'opacity-[0.88] saturate-[0.92]';

interface TransferOrderDetailPanelProps {
  order: TransferOrder;
  onClose: () => void;
  showCompleteOrders?: boolean;
}

interface TrDraft {
  description: string;
}

function draftFromOrder(order: TransferOrder): TrDraft {
  return {
    description: order.description ?? '',
  };
}

function getLocationDisplay(
  type: string,
  id: number,
  factories: { id: number; name: string }[],
  machines: { id: number; name: string }[],
  projects: { id: number; name: string }[]
): { label: string; icon: React.ReactNode; title: string } {
  const ctx = { factories, machines, projects };
  const label = transferLocationName(type, id, ctx);
  const typeLabel = transferLocationTypeLabel(type);
  return {
    label,
    icon: transferLocationIcon(type, 'h-4 w-4 shrink-0 text-muted-foreground'),
    title: `${typeLabel} · ${label}`,
  };
}

const TransferOrderDetailPanel: React.FC<TransferOrderDetailPanelProps> = ({
  order: orderProp,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [manageApprovalsOpen, setManageApprovalsOpen] = useState(false);
  const [manageTransfersOpen, setManageTransfersOpen] = useState(false);
  const [editItemsOpen, setEditItemsOpen] = useState(false);
  const [editRouteOpen, setEditRouteOpen] = useState(false);
  const [showConfirmEvents, setShowConfirmEvents] = useState(false);
  const [scrollHighlightTarget, setScrollHighlightTarget] = useState<TrScrollSection | null>(null);
  const [completeConfirmOpen, setCompleteConfirmOpen] = useState(false);

  const { workspace, user } = useAppSelector((s) => s.auth);
  const currentUserId = user?.id ?? null;

  const { data: orderFresh } = useGetTransferOrderByIdQuery(orderProp.id);
  const order = orderFresh ?? orderProp;

  const { data: items = [], isLoading: itemsLoading } =
    useGetTransferOrderItemsQuery(order.id);
  const { data: approversData } = useGetTransferOrderApproversQuery(order.id);
  const { data: apiEvents = [] } = useGetTransferOrderEventsQuery(order.id);
  const { data: factories = [] } = useGetFactoriesQuery({ skip: 0, limit: API_LIMITS.FLEXIBLE_1000 });
  const { data: machines = [] } = useGetMachinesQuery({ skip: 0, limit: API_LIMITS.FLEXIBLE_1000 });
  const { data: projects = [] } = useGetProjectsQuery({ skip: 0, limit: API_LIMITS.FLEXIBLE_1000 });
  const { data: members = [] } = useGetWorkspaceMembersQuery(workspace?.id ?? 0, {
    skip: !workspace?.id,
  });
  const [updateOrder, { isLoading: isUpdating }] = useUpdateTransferOrderMutation();
  const [markComplete, { isLoading: isMarkingComplete }] = useMarkTransferOrderCompleteMutation();
  const [addApprover] = useAddTransferOrderApproverMutation();
  const [removeApprover] = useRemoveTransferOrderApproverMutation();
  const [approveOrder] = useApproveTransferOrderMutation();
  const [unapproveOrder] = useUnapproveTransferOrderMutation();

  const approvers: TransferOrderApprover[] = approversData?.approvers ?? [];
  const approvalSummary = approversData?.summary ?? { approved_count: 0, required: 0, met: true };
  const requiredApprovals =
    order.required_approvals != null ? String(order.required_approvals) : '';

  const [draft, setDraft] = useState<TrDraft>(() => draftFromOrder(order));
  useEffect(() => {
    setDraft(draftFromOrder(order));
  }, [order.id, order.updated_at]); // eslint-disable-line react-hooks/exhaustive-deps

  const isDirty = draft.description !== (order.description ?? '');
  const isSaving = isUpdating;
  const orderComplete = Boolean(order.completed_at);

  const stageName = deriveTransferOrderStage(order, items);
  const readyForApproval = isTransferReadyForApproval(order, items);
  const editsLocked = approvalSummary.approved_count > 0;

  const source = getLocationDisplay(
    order.source_location_type,
    order.source_location_id,
    factories,
    machines,
    projects
  );
  const dest = getLocationDisplay(
    order.destination_location_type,
    order.destination_location_id,
    factories,
    machines,
    projects
  );

  const { allEvents, filteredEvents } = useTransferOrderEvents(apiEvents, showConfirmEvents);

  const myApproval =
    currentUserId != null ? approvers.find((a) => a.user_id === currentUserId) : undefined;
  const assignedUserIds = new Set(approvers.map((a) => a.user_id));
  const assignableMembers = members.filter(
    (m) => m.status === 'active' && !assignedUserIds.has(m.user_id)
  );

  const formatDate = (d: string | null | undefined) =>
    d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
  const formatDateTime = (d: string | null | undefined) => (d ? new Date(d).toLocaleString() : '—');
  const itemDisplayName = (it: { item_name: string | null; item_id: number }) =>
    it.item_name ?? `Item #${it.item_id}`;
  const qtyWithUnit = (qty: number, unit: string | null) => (unit ? `${qty} ${unit}` : String(qty));

  const approveBlockedReason = !readyForApproval
    ? !items.length
      ? 'Add at least one transfer item before approving'
      : 'Set source and destination before approving'
    : undefined;

  const scrollToSection = (section: TrScrollSection) => {
    const id =
      section === 'route'
        ? 'tr-section-route'
        : section === 'items'
          ? 'tr-section-items'
          : 'tr-section-approvals';
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      if (section === 'approvals' || section === 'route' || section === 'items') {
        setScrollHighlightTarget(section);
      }
    }
  };

  const dismissScrollHighlight = () => setScrollHighlightTarget(null);

  const pendingTransferCount = getPendingTransferCount(items);
  const transferredCount = items.filter((i) => i.transferred_at).length;
  const transfersComplete = items.length > 0 && transferredCount === items.length;

  const handleMarkComplete = async () => {
    try {
      await markComplete(order.id).unwrap();
      setCompleteConfirmOpen(false);
      toast.success('Transfer order marked complete');
    } catch (err: unknown) {
      const e = err as { data?: { detail?: string } };
      toast.error(e?.data?.detail || 'Failed to mark complete');
    }
  };

  const handleSave = async () => {
    try {
      await updateOrder({
        id: order.id,
        data: {
          description: draft.description.trim() || null,
        },
      }).unwrap();
      toast.success('Changes saved');
    } catch (err: unknown) {
      const e = err as { data?: { detail?: string } };
      toast.error(e?.data?.detail || 'Failed to save');
    }
  };

  const handleDiscard = () => setDraft(draftFromOrder(order));

  const handleAddApprover = async (userId: number) => {
    try {
      await addApprover({ toId: order.id, user_id: userId }).unwrap();
    } catch (err: unknown) {
      const e = err as { data?: { detail?: string } };
      toast.error(e?.data?.detail || 'Failed to add approver');
    }
  };

  const handleRemoveApprover = async (userId: number) => {
    try {
      await removeApprover({ toId: order.id, userId }).unwrap();
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


  const openEditRoute = () => {
    if (editsLocked) return;
    setEditRouteOpen(true);
  };

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden">
      <div ref={scrollContainerRef} className="flex-1 min-h-0 overflow-y-auto">
        <div className="mx-auto max-w-5xl px-6 py-6 space-y-4">
          <ToApprovalsTopBar
            approvers={approvers}
            approvalSummary={approvalSummary}
            currentUserId={currentUserId}
            myApproval={myApproval}
            highlighted={scrollHighlightTarget === 'approvals'}
            onHighlightDismiss={dismissScrollHighlight}
            onManage={() => setManageApprovalsOpen(true)}
            onToggleMyApproval={handleToggleMyApproval}
            canApprove={readyForApproval}
            approveBlockedReason={approveBlockedReason}
          />

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_min(280px,32%)] gap-4 lg:items-stretch">
            <Card
              id="tr-section-route"
              className={cn(
                'scroll-mt-6 flex flex-col h-full',
                editsLocked && confirmedSectionCardClass,
                scrollHighlightTarget === 'route' && 'po-scroll-target-highlight'
              )}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />
                      Order details
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1 capitalize">
                      {order.source_location_type} → {order.destination_location_type}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge
                      variant="secondary"
                      className={cn('text-xs', trStageBadgeClassName(stageName))}
                    >
                      {stageName}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent
                className={cn('flex flex-1 flex-col space-y-4', editsLocked && confirmedSectionContentClass)}
              >
                <div
                  className={cn(
                    'relative rounded-lg border border-border bg-muted/30',
                    !editsLocked && 'group hover:border-muted-foreground/30 hover:bg-muted/40 transition-colors'
                  )}
                >
                  {!editsLocked && (
                    <TooltipProvider delayDuration={300}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute top-2 right-2 z-10 h-6 w-6 text-muted-foreground hover:text-foreground"
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditRoute();
                            }}
                            aria-label="Edit route"
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="left">Edit route</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                  <button
                    type="button"
                    onClick={openEditRoute}
                    disabled={editsLocked}
                    className={cn(
                      'flex w-full items-center gap-4 p-4 text-left',
                      editsLocked
                        ? 'cursor-default'
                        : 'cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg'
                    )}
                    aria-label={
                      editsLocked
                        ? `Route from ${source.title} to ${dest.title}`
                        : `Edit route from ${source.title} to ${dest.title}`
                    }
                  >
                    <div className="flex-1 flex flex-col gap-1 min-w-0">
                      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        From
                      </span>
                      <div className="flex items-center gap-2" title={source.title}>
                        <span className="text-muted-foreground shrink-0">{source.icon}</span>
                        <span className="font-semibold text-card-foreground truncate">{source.label}</span>
                      </div>
                    </div>
                    <ArrowRight className="h-6 w-6 text-brand-primary shrink-0" aria-hidden />
                    <div className="flex-1 flex flex-col gap-1 min-w-0 pr-6">
                      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        To
                      </span>
                      <div className="flex items-center gap-2" title={dest.title}>
                        <span className="text-muted-foreground shrink-0">{dest.icon}</span>
                        <span className="font-semibold text-card-foreground truncate">{dest.label}</span>
                      </div>
                    </div>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wide">Created</Label>
                    <div className="flex items-center gap-2 h-9 px-3 rounded-md border border-dashed border-border bg-muted/30 text-sm">
                      {formatDate(order.created_at)}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wide">Completed</Label>
                    <div className="flex items-center gap-2 h-9 px-3 rounded-md border border-dashed border-border bg-muted/30 text-sm">
                      {formatDate(order.completed_at)}
                    </div>
                  </div>
                </div>

                <div className="space-y-3 pt-2 border-t border-border">
                  <div className="space-y-1.5">
                    <label htmlFor="tr-description" className="text-xs font-medium text-muted-foreground">
                      Description
                    </label>
                    <Input
                      id="tr-description"
                      value={draft.description}
                      onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
                      placeholder="Transfer description..."
                      className="bg-background"
                      disabled={editsLocked}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <TrWorkflowChecklist
              className="max-lg:h-auto max-lg:w-full lg:h-full scroll-mt-6"
              order={order}
              items={items}
              approvalSummary={approvalSummary}
              onScrollToManageApprovals={() => scrollToSection('approvals')}
              onMarkComplete={() => setCompleteConfirmOpen(true)}
              isMarkingComplete={isMarkingComplete}
            />
          </div>

          <Card
            id="tr-section-items"
            className={cn(
              'scroll-mt-6',
              editsLocked && confirmedSectionCardClass,
              scrollHighlightTarget === 'items' && 'po-scroll-target-highlight'
            )}
          >
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <CardTitle
                  className={cn(
                    'text-base flex items-center gap-2',
                    editsLocked && confirmedSectionContentClass
                  )}
                >
                  <Package className="h-4 w-4 text-muted-foreground" />
                  Transfer items
                  <Badge variant="outline" className="ml-1 font-normal">
                    {items.length}
                  </Badge>
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent
              className={cn('pt-0', editsLocked && confirmedSectionContentClass)}
            >
              {itemsLoading ? (
                <p className="text-sm text-muted-foreground py-8 text-center">Loading items…</p>
              ) : items.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border bg-muted/20 px-4 py-8 text-center">
                  <Package className="h-6 w-6 text-muted-foreground/50 mx-auto mb-1" />
                  <p className="text-sm font-medium text-muted-foreground">No items on this transfer</p>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="mt-3"
                    onClick={() => setEditItemsOpen(true)}
                    disabled={editsLocked}
                  >
                    Add items
                  </Button>
                </div>
              ) : (
                <div className="border border-border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="py-2 w-12 text-center">#</TableHead>
                        <TableHead className="py-2">Item</TableHead>
                        <TableHead className="py-2 text-right w-24">Quantity</TableHead>
                        <TableHead className="py-2 text-right w-28">Transferred</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((it) => {
                        const isTransferred = Boolean(it.transferred_at);
                        return (
                          <TableRow
                            key={it.id}
                            className={
                              isTransferred ? 'bg-green-50/50 dark:bg-green-950/20' : ''
                            }
                          >
                            <TableCell className="py-2 text-center text-muted-foreground text-sm">
                              {it.line_number}
                            </TableCell>
                            <TableCell className="py-2">
                              <span className="font-medium text-sm">{itemDisplayName(it)}</span>
                            </TableCell>
                            <TableCell className="py-2 text-right text-sm">
                              {qtyWithUnit(it.quantity, it.item_unit)}
                            </TableCell>
                            <TableCell className="py-2 text-right text-sm">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span
                                      className={cn(
                                        'cursor-help',
                                        isTransferred
                                          ? 'text-green-600 dark:text-green-400 font-medium'
                                          : 'text-muted-foreground'
                                      )}
                                    >
                                      {isTransferred ? formatDate(it.transferred_at) : 'Pending'}
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    {isTransferred
                                      ? `Transferred by ${it.transferred_by ?? '—'} on ${formatDateTime(it.transferred_at)}`
                                      : 'Not yet transferred'}
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
              {items.length > 0 && !itemsLoading ? (
                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <Button
                      type="button"
                      size="sm"
                      id="tr-manage-transfers-btn"
                      className="h-8 w-fit bg-brand-primary hover:bg-brand-primary-hover text-primary-foreground"
                      onClick={() => setManageTransfersOpen(true)}
                      disabled={orderComplete || !approvalSummary.met}
                    >
                      <ArrowRightLeft className="h-4 w-4 mr-1" />
                      Manage transfers
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 w-fit"
                      onClick={() => setEditItemsOpen(true)}
                      disabled={editsLocked}
                    >
                      <Pencil className="h-3.5 w-3.5 mr-1" />
                      Edit items
                    </Button>
                    <span
                      className={cn(
                        'text-xs font-medium',
                        transfersComplete
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-muted-foreground'
                      )}
                    >
                      {transferredCount} / {items.length} transferred
                    </span>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <DiscussionThread entityType="transfer_order" entityId={order.id} />

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
              {allEvents.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border bg-muted/20 px-4 py-8 text-center">
                  <History className="h-6 w-6 text-muted-foreground/50 mx-auto mb-1" />
                  <p className="text-sm font-medium text-muted-foreground">No activity yet</p>
                </div>
              ) : filteredEvents.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border bg-muted/20 px-4 py-8 text-center">
                  <CircleDashed className="h-6 w-6 text-muted-foreground/50 mx-auto mb-1" />
                  <p className="text-sm font-medium text-muted-foreground">No events to show</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Turn on Show confirms to see item approval activity
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredEvents.map((event, idx) => (
                    <ToEventLogRow
                      key={event.id}
                      event={{
                        id: event.id,
                        event_type: event.event_type,
                        description: event.description,
                        created_at: event.created_at,
                        user_name: event.user_name,
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

      {isDirty && !editsLocked && (
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
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4 mr-1" />
            )}
            Save Changes
          </Button>
        </div>
      )}

      <ManageToApprovalsDialog
        open={manageApprovalsOpen}
        onOpenChange={setManageApprovalsOpen}
        approvers={approvers}
        assignableMembers={assignableMembers}
        requiredApprovals={requiredApprovals}
        onRequiredApprovalsChange={(v) => void handleRequiredApprovalsChange(v)}
        onAddApprover={handleAddApprover}
        onRemoveApprover={(userId) => void handleRemoveApprover(userId)}
      />

      <ManageTransferOrderTransfersDialog
        open={manageTransfersOpen}
        onOpenChange={setManageTransfersOpen}
        toId={order.id}
        items={items}
      />

      <EditTransferOrderItemsDialog
        open={editItemsOpen}
        onOpenChange={setEditItemsOpen}
        toId={order.id}
        items={items}
      />

      <EditTransferOrderRouteDialog
        open={editRouteOpen}
        onOpenChange={setEditRouteOpen}
        order={order}
        factories={factories}
        machines={machines}
        projects={projects}
      />

      <Dialog open={completeConfirmOpen} onOpenChange={setCompleteConfirmOpen}>
        <DialogContent className="w-[min(28rem,94vw)] max-w-none">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-brand-primary" />
              Complete transfer order?
            </DialogTitle>
            <DialogDescription className="space-y-2 pt-1 text-left">
              <span className="block">
                Completing this order will mark any remaining line items as transferred and post
                inventory from {source.label} to {dest.label}. The order will be locked and cannot
                be edited afterward.
              </span>
              {pendingTransferCount > 0 ? (
                <span className="block text-muted-foreground">
                  {pendingTransferCount} of {items.length} line item
                  {items.length !== 1 ? 's have' : ' has'} not been recorded yet — they will be
                  marked as transferred when you confirm.
                </span>
              ) : null}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCompleteConfirmOpen(false)}
              disabled={isMarkingComplete}
            >
              Cancel
            </Button>
            <Button
              className="bg-brand-primary hover:bg-brand-primary-hover"
              onClick={() => void handleMarkComplete()}
              disabled={isMarkingComplete}
            >
              {isMarkingComplete ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Completing…
                </>
              ) : (
                'Mark order complete'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default TransferOrderDetailPanel;
