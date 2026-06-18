import React, { useEffect, useRef, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  useGetTransferOrderItemsQuery,
  useUpdateTransferOrderMutation,
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
  Warehouse,
  Cpu,
  AlertTriangle,
  FolderKanban,
  Loader2,
  Calendar,
  MessageSquare,
  Send,
  History,
  Check,
  CheckCircle2,
  Clock,
  CircleDashed,
  Pencil,
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
import { transferLocationLabel } from '@/pages/newpages/orders/transferOrderLocationLabels';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { SectionConfirmActions } from './PoSectionConfirmButton';
import ToApprovalsTopBar from './ToApprovalsTopBar';
import ManageToApprovalsDialog from './ManageToApprovalsDialog';
import TrWorkflowChecklist from './TrWorkflowChecklist';
import EditTransferOrderItemsDialog from './EditTransferOrderItemsDialog';
import ToEventLogRow from './ToEventLogRow';
import { useTransferOrderEvents } from './TransferOrderEventFeed';
import { useTransferOrderApprovals } from './transferOrderApprovals';
import {
  deriveTransferOrderStage,
  trStageBadgeClassName,
  useTransferOrderLocalComplete,
  type TrScrollSection,
} from './transferOrderMilestones';
import {
  getTrSectionConfirmReadiness,
  trSectionConfirmLabel,
  useTransferOrderSectionConfirms,
  type TrSectionConfirmKey,
} from './transferOrderSectionConfirms';

const confirmedSectionCardClass = 'border-muted-foreground/15 bg-muted/20';
const confirmedSectionContentClass = 'opacity-[0.88] saturate-[0.92]';

interface TransferOrderDetailPanelProps {
  order: TransferOrder;
  onClose: () => void;
  showCompleteOrders?: boolean;
}

interface TrDraft {
  description: string;
  note: string;
}

function draftFromOrder(order: TransferOrder): TrDraft {
  return {
    description: order.description ?? '',
    note: order.note ?? '',
  };
}

function getLocationDisplay(
  type: string,
  id: number,
  factories: { id: number; name: string }[],
  machines: { id: number; name: string }[],
  projects: { id: number; name: string }[]
): { label: string; icon: React.ReactNode } {
  const iconMap = {
    storage: <Warehouse className="h-4 w-4" />,
    machine: <Cpu className="h-4 w-4" />,
    damaged: <AlertTriangle className="h-4 w-4" />,
    project: <FolderKanban className="h-4 w-4" />,
  };
  const icon = iconMap[type as keyof typeof iconMap] ?? <Warehouse className="h-4 w-4" />;
  const label = transferLocationLabel(type, id, { factories, machines, projects });
  return { label, icon };
}

const TransferOrderDetailPanel: React.FC<TransferOrderDetailPanelProps> = ({
  order,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [manageApprovalsOpen, setManageApprovalsOpen] = useState(false);
  const [editItemsOpen, setEditItemsOpen] = useState(false);
  const [showConfirmEvents, setShowConfirmEvents] = useState(true);
  const [scrollHighlightTarget, setScrollHighlightTarget] = useState<TrScrollSection | null>(null);
  const [isMarkingComplete, setIsMarkingComplete] = useState(false);
  const [confirmingSection, setConfirmingSection] = useState<TrSectionConfirmKey | null>(null);
  const [unconfirmWarningOpen, setUnconfirmWarningOpen] = useState(false);
  const [pendingUnconfirmSection, setPendingUnconfirmSection] =
    useState<TrSectionConfirmKey | null>(null);

  const { workspace, user } = useAppSelector((s) => s.auth);
  const currentUserId = user?.id ?? null;

  const { data: items = [], isLoading: itemsLoading, refetch: refetchItems } =
    useGetTransferOrderItemsQuery(order.id);
  const { data: factories = [] } = useGetFactoriesQuery({ skip: 0, limit: API_LIMITS.FLEXIBLE_1000 });
  const { data: machines = [] } = useGetMachinesQuery({ skip: 0, limit: API_LIMITS.FLEXIBLE_1000 });
  const { data: projects = [] } = useGetProjectsQuery({ skip: 0, limit: API_LIMITS.FLEXIBLE_1000 });
  const { data: members = [] } = useGetWorkspaceMembersQuery(workspace?.id ?? 0, {
    skip: !workspace?.id,
  });
  const [updateOrder, { isLoading: isUpdating }] = useUpdateTransferOrderMutation();

  const {
    approvers,
    requiredApprovals,
    approvalSummary,
    localEvents,
    addApprover,
    removeApprover,
    setRequired,
    toggleApproval,
    withdrawAllApprovals,
  } = useTransferOrderApprovals(order.id);

  const {
    routeConfirmed,
    itemsConfirmed,
    setSectionConfirmed,
    localEvents: sectionConfirmEvents,
  } = useTransferOrderSectionConfirms(order.id);

  const { locallyComplete, markComplete } = useTransferOrderLocalComplete(order.id);

  const [draft, setDraft] = useState<TrDraft>(() => draftFromOrder(order));
  useEffect(() => {
    setDraft(draftFromOrder(order));
  }, [order.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const isDirty =
    draft.description !== (order.description ?? '') || draft.note !== (order.note ?? '');
  const isSaving = isUpdating;

  const stageName = deriveTransferOrderStage(
    order,
    items,
    approvalSummary,
    locallyComplete,
    { route_confirmed: routeConfirmed, items_confirmed: itemsConfirmed }
  );

  const routeSectionLocked = routeConfirmed;
  const itemsSectionLocked = itemsConfirmed;

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

  const { allEvents, filteredEvents } = useTransferOrderEvents(
    order,
    items,
    localEvents,
    showConfirmEvents,
    sectionConfirmEvents
  );

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

  const approvedCount = items.filter((i) => i.approved).length;
  const transferredCount = items.filter((i) => i.transferred_at).length;

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

  const requestSectionConfirmToggle = (
    section: TrSectionConfirmKey,
    currentlyConfirmed: boolean
  ) => {
    if (!currentlyConfirmed) {
      const readiness = getTrSectionConfirmReadiness(section, order, items);
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
    withdrawAllApprovals();
    void handleToggleSectionConfirm(section, false);
  };

  const handleToggleSectionConfirm = async (
    section: TrSectionConfirmKey,
    nextConfirmed: boolean
  ) => {
    setConfirmingSection(section);
    try {
      if (nextConfirmed && section === 'route' && isDirty) {
        await updateOrder({
          id: order.id,
          data: {
            description: draft.description.trim() || null,
            note: draft.note.trim() || null,
          },
        }).unwrap();
      }
      setSectionConfirmed(section, nextConfirmed);
      const label = trSectionConfirmLabel(section);
      toast.success(nextConfirmed ? `${label} confirmed` : `${label} unconfirmed`);
    } catch (err: unknown) {
      const e = err as { data?: { detail?: string } };
      toast.error(e?.data?.detail || 'Failed to update section');
    } finally {
      setConfirmingSection(null);
    }
  };

  const handleMarkComplete = () => {
    setIsMarkingComplete(true);
    markComplete();
    toast.success('Transfer marked complete (preview — backend pending)');
    setIsMarkingComplete(false);
  };

  const handleSave = async () => {
    try {
      await updateOrder({
        id: order.id,
        data: {
          description: draft.description.trim() || null,
          note: draft.note.trim() || null,
        },
      }).unwrap();
      toast.success('Changes saved');
    } catch (err: unknown) {
      const e = err as { data?: { detail?: string } };
      toast.error(e?.data?.detail || 'Failed to save');
    }
  };

  const handleDiscard = () => setDraft(draftFromOrder(order));

  const handleAddApprover = (userId: number) => {
    const member = members.find((m) => m.user_id === userId);
    if (member) addApprover(member);
  };

  const handleToggleMyApproval = () => {
    if (currentUserId == null || !myApproval) return;
    toggleApproval(currentUserId, myApproval.user_name);
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
          />

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_min(280px,32%)] gap-4 items-start">
            <Card
              id="tr-section-route"
              className={cn('scroll-mt-6', routeSectionLocked && confirmedSectionCardClass)}
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
                    <SectionConfirmActions
                      id="tr-confirm-route"
                      confirmed={routeConfirmed}
                      onToggle={() => requestSectionConfirmToggle('route', routeConfirmed)}
                      isLoading={confirmingSection === 'route'}
                      label="order details"
                      highlighted={scrollHighlightTarget === 'route'}
                      onHighlightDismiss={dismissScrollHighlight}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent
                className={cn('space-y-4', routeSectionLocked && confirmedSectionContentClass)}
              >
                <div className="flex items-center gap-4 p-4 rounded-lg border border-border bg-muted/30">
                  <div className="flex-1 flex flex-col gap-1 min-w-0">
                    <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      From
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground shrink-0">{source.icon}</span>
                      <span className="font-semibold text-card-foreground truncate">{source.label}</span>
                    </div>
                  </div>
                  <ArrowRight className="h-6 w-6 text-brand-primary shrink-0" aria-hidden />
                  <div className="flex-1 flex flex-col gap-1 min-w-0">
                    <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      To
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground shrink-0">{dest.icon}</span>
                      <span className="font-semibold text-card-foreground truncate">{dest.label}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <div>
                    <dt className="text-muted-foreground text-xs uppercase tracking-wide">Order date</dt>
                    <dd className="font-medium mt-0.5 flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                      {formatDate(order.order_date)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground text-xs uppercase tracking-wide">Created</dt>
                    <dd className="font-medium mt-0.5">{formatDate(order.created_at)}</dd>
                  </div>
                  {order.completed_at && (
                    <div>
                      <dt className="text-muted-foreground text-xs uppercase tracking-wide">Completed</dt>
                      <dd className="font-medium mt-0.5">{formatDate(order.completed_at)}</dd>
                    </div>
                  )}
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
                      disabled={routeSectionLocked}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="tr-note" className="text-xs font-medium text-muted-foreground">
                      Note
                    </label>
                    <Textarea
                      id="tr-note"
                      value={draft.note}
                      onChange={(e) => setDraft((d) => ({ ...d, note: e.target.value }))}
                      placeholder="Internal note..."
                      rows={3}
                      className="bg-background resize-none"
                      disabled={routeSectionLocked}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <TrWorkflowChecklist
              order={order}
              items={items}
              approvalSummary={approvalSummary}
              routeConfirmed={routeConfirmed}
              itemsConfirmed={itemsConfirmed}
              locallyMarkedComplete={locallyComplete}
              onScrollToSection={scrollToSection}
              onMarkComplete={handleMarkComplete}
              isMarkingComplete={isMarkingComplete}
            />
          </div>

          <Card
            id="tr-section-items"
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
                    <Package className="h-4 w-4 text-muted-foreground" />
                    Transfer items ({items.length})
                  </CardTitle>
                  {items.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {approvedCount} approved · {transferredCount} transferred
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
                    Edit items
                  </Button>
                  <SectionConfirmActions
                    id="tr-confirm-items"
                    confirmed={itemsConfirmed}
                    onToggle={() => requestSectionConfirmToggle('items', itemsConfirmed)}
                    isLoading={confirmingSection === 'items'}
                    label="transfer items"
                    highlighted={scrollHighlightTarget === 'items'}
                    onHighlightDismiss={dismissScrollHighlight}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent
              className={cn('p-0', itemsSectionLocked && confirmedSectionContentClass)}
            >
              {itemsLoading ? (
                <p className="text-sm text-muted-foreground py-8 px-6">Loading items…</p>
              ) : items.length === 0 ? (
                <div className="px-6 py-8 text-center">
                  <p className="text-sm text-muted-foreground">No transfer items</p>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="mt-3"
                    onClick={() => setEditItemsOpen(true)}
                    disabled={itemsSectionLocked}
                  >
                    Add items
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="py-2 w-10">#</TableHead>
                        <TableHead className="py-2">Item name</TableHead>
                        <TableHead className="py-2">Qty</TableHead>
                        <TableHead className="py-2">Approved</TableHead>
                        <TableHead className="py-2">Transferred at</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((it) => (
                        <TableRow key={it.id} className="border-b border-border">
                          <TableCell className="py-2 text-muted-foreground">{it.line_number}</TableCell>
                          <TableCell className="py-2">
                            <span className="font-medium text-sm">{itemDisplayName(it)}</span>
                          </TableCell>
                          <TableCell className="py-2">{qtyWithUnit(it.quantity, it.item_unit)}</TableCell>
                          <TableCell className="py-2">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="cursor-help underline decoration-dotted">
                                    {it.approved ? 'Yes' : 'No'}
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  {it.approved
                                    ? `Approved on ${formatDateTime(it.approved_at)}${it.approved_by ? ` by user #${it.approved_by}` : ''}`
                                    : 'Pending approval'}
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </TableCell>
                          <TableCell className="py-2">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="cursor-help underline decoration-dotted">
                                    {it.transferred_at ? formatDate(it.transferred_at) : '—'}
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  {it.transferred_at
                                    ? `Transferred by ${it.transferred_by ?? '—'} on ${formatDateTime(it.transferred_at)}`
                                    : 'Not yet transferred'}
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-4 shrink-0">
              <CardTitle className="text-base flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                Comments
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 pt-0">
              <div className="rounded-lg border border-dashed border-border bg-muted/20 flex flex-col items-center justify-center gap-1 px-4 py-8 text-center">
                <MessageSquare className="h-6 w-6 text-muted-foreground/50" />
                <p className="text-sm font-medium text-muted-foreground">No comments yet</p>
                <p className="text-xs text-muted-foreground">Comments coming soon</p>
              </div>
              <div className="flex items-center gap-2">
                <Input placeholder="Write a comment..." disabled className="flex-1" />
                <Button size="icon" disabled className="shrink-0">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

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

      {isDirty && !routeSectionLocked && (
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
        onRequiredApprovalsChange={setRequired}
        onAddApprover={handleAddApprover}
        onRemoveApprover={removeApprover}
      />

      <EditTransferOrderItemsDialog
        open={editItemsOpen}
        onOpenChange={setEditItemsOpen}
        toId={order.id}
        items={items}
        onSaved={() => refetchItems()}
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
            All current transfer approvals will be withdrawn. Approvers must approve the order again
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

export default TransferOrderDetailPanel;
