import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  useGetTransferOrderItemsQuery,
  useUpdateTransferOrderMutation,
} from '@/features/transferOrders/transferOrdersApi';
import { useGetStatusesQuery } from '@/features/statuses/statusesApi';
import { useGetFactoriesQuery } from '@/features/factories/factoriesApi';
import { useGetMachinesQuery } from '@/features/machines/machinesApi';
import { useGetProjectsQuery } from '@/features/projects/projectsApi';
import type { TransferOrder } from '@/types/transferOrder';
import {
  ArrowLeft,
  ArrowLeftRight,
  ArrowRight,
  Package,
  Warehouse,
  Cpu,
  AlertTriangle,
  FolderKanban,
  ChevronRight,
  Trash2,
  Loader2,
  StickyNote,
  Calendar,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import toast from 'react-hot-toast';
import { ORDER_STATUS_WORKFLOW, getNextStatusId } from './orderStatusConstants';
import { API_LIMITS } from '@/constants/apiLimits';
import { transferLocationLabel } from '@/pages/newpages/orders/transferOrderLocationLabels';

interface TransferOrderDetailPanelProps {
  order: TransferOrder;
  onClose: () => void;
  onDelete: () => void;
  onUpdated?: () => void;
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
  onClose,
  onDelete,
  onUpdated,
}) => {
  const { data: items = [], isLoading: itemsLoading } = useGetTransferOrderItemsQuery(order.id);
  const { data: statuses = [] } = useGetStatusesQuery({ skip: 0, limit: API_LIMITS.STRICT_100 });
  const { data: factories = [] } = useGetFactoriesQuery({ skip: 0, limit: API_LIMITS.FLEXIBLE_1000 });
  const { data: machines = [] } = useGetMachinesQuery({ skip: 0, limit: API_LIMITS.FLEXIBLE_1000 });
  const { data: projects = [] } = useGetProjectsQuery({ skip: 0, limit: API_LIMITS.FLEXIBLE_1000 });
  const [updateOrder, { isLoading: isUpdating }] = useUpdateTransferOrderMutation();

  const formatDate = (d: string | null | undefined) =>
    d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
  const formatDateTime = (d: string | null | undefined) => (d ? new Date(d).toLocaleString() : '—');
  const itemDisplayName = (it: { item_name: string | null; item_id: number }) =>
    it.item_name ?? `Item #${it.item_id}`;
  const qtyWithUnit = (qty: number, unit: string | null) => (unit ? `${qty} ${unit}` : String(qty));

  const statusLabel =
    statuses.find((s) => s.id === order.current_status_id)?.name ?? `#${order.current_status_id}`;

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

  const nextStatusId = getNextStatusId(order.current_status_id);
  const nextStatusLabel = nextStatusId
    ? (statuses.length > 0 ? statuses : ORDER_STATUS_WORKFLOW).find((s) => s.id === nextStatusId)?.name ??
      `#${nextStatusId}`
    : null;

  const handleStatusChange = async (statusId: number) => {
    try {
      await updateOrder({ id: order.id, data: { current_status_id: statusId } }).unwrap();
      toast.success('Status updated');
      onUpdated?.();
    } catch (err: unknown) {
      const e = err as { data?: { detail?: string } };
      toast.error(e?.data?.detail || 'Failed to update status');
    }
  };

  const hasNotes = order.description || order.note;
  const subtitle = `${order.source_location_type} → ${order.destination_location_type}`;

  const approvedCount = items.filter((i) => i.approved).length;
  const transferredCount = items.filter((i) => i.transferred_at).length;

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden">
      <div className="shrink-0 border-b border-border bg-card px-6 py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <Button variant="ghost" size="icon" onClick={onClose} className="mt-0.5 h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back</span>
            </Button>
            <div>
              <h1 className="text-xl font-semibold text-card-foreground">{order.transfer_number}</h1>
              <p className="text-sm text-muted-foreground capitalize">{subtitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge variant="secondary">{statusLabel}</Badge>
            <Button
              variant="outline"
              size="sm"
              className="text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
              onClick={onDelete}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete Order
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />
                Transfer path
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 p-4 rounded-lg border border-border bg-muted/30">
                <div className="flex-1 flex flex-col gap-1 min-w-0">
                  <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    From
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground shrink-0">{source.icon}</span>
                    <span className="font-semibold text-card-foreground truncate">{source.label}</span>
                  </div>
                  <span className="text-xs text-muted-foreground capitalize">
                    {order.source_location_type}
                  </span>
                </div>
                <ArrowRight className="h-6 w-6 text-brand-primary shrink-0" aria-hidden />
                <div className="flex-1 flex flex-col gap-1 min-w-0">
                  <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">To</span>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground shrink-0">{dest.icon}</span>
                    <span className="font-semibold text-card-foreground truncate">{dest.label}</span>
                  </div>
                  <span className="text-xs text-muted-foreground capitalize">
                    {order.destination_location_type}
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-border mt-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm">
                    <span className="text-muted-foreground">Status: </span>
                    <Badge variant="secondary" className="ml-1">
                      {statusLabel}
                    </Badge>
                  </div>
                  {nextStatusId && (
                    <Button
                      size="sm"
                      disabled={isUpdating}
                      onClick={() => handleStatusChange(nextStatusId)}
                      className="bg-brand-primary hover:bg-brand-primary-hover h-8"
                    >
                      {isUpdating ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <>
                          Advance to {nextStatusLabel}
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </>
                      )}
                    </Button>
                  )}
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
            <CardContent className="space-y-3">
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
              {hasNotes ? (
                <div className="text-sm space-y-2 pt-2 border-t border-border">
                  {order.description && (
                    <p>
                      <span className="text-muted-foreground">Description: </span>
                      {order.description}
                    </p>
                  )}
                  {order.note && (
                    <p>
                      <span className="text-muted-foreground">Note: </span>
                      {order.note}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No notes for this order.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              Transfer items ({items.length})
            </CardTitle>
            {items.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {approvedCount} approved · {transferredCount} transferred
              </p>
            )}
          </CardHeader>
          <CardContent className="p-0">
            {itemsLoading ? (
              <p className="text-sm text-muted-foreground py-8 px-6">Loading items…</p>
            ) : items.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 px-6">No transfer items</p>
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
      </div>
    </div>
  );
};

export default TransferOrderDetailPanel;
