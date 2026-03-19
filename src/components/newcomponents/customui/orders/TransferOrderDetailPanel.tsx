import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { ArrowLeft, ArrowRight, Package, Warehouse, Cpu, AlertTriangle, FolderKanban } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import toast from 'react-hot-toast';
import OrderStatusActions from './OrderStatusActions';
import { API_LIMITS } from '@/constants/apiLimits';

interface TransferOrderDetailPanelProps {
  order: TransferOrder;
  onClose: () => void;
  onDelete: () => void;
  onUpdated?: () => void;
}

function getLocationLabel(
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
  if (type === 'storage' || type === 'damaged') {
    const f = factories.find((x) => x.id === id);
    return { label: f ? `${f.name}${type === 'damaged' ? ' (Damaged)' : ''}` : `${type} #${id}`, icon };
  }
  if (type === 'machine') {
    const m = machines.find((x) => x.id === id);
    return { label: m?.name ?? `Machine #${id}`, icon };
  }
  if (type === 'project') {
    const p = projects.find((x) => x.id === id);
    return { label: p?.name ?? `Project #${id}`, icon };
  }
  return { label: `${type} #${id}`, icon };
}

const TransferOrderDetailPanel: React.FC<TransferOrderDetailPanelProps> = ({
  order,
  onClose,
  onDelete,
  onUpdated,
}) => {
  const { data: items = [], isLoading: itemsLoading } = useGetTransferOrderItemsQuery(order.id);
  const { data: statuses = [] } = useGetStatusesQuery({ skip: 0, limit: API_LIMITS.STRICT_100 });
  const { data: factories = [] } = useGetFactoriesQuery({ skip: 0, limit: API_LIMITS.STRICT_100 });
  const { data: machines = [] } = useGetMachinesQuery({ skip: 0, limit: API_LIMITS.FLEXIBLE_1000 });
  const { data: projects = [] } = useGetProjectsQuery({ skip: 0, limit: API_LIMITS.STRICT_100 });
  const [updateOrder, { isLoading: isUpdating }] = useUpdateTransferOrderMutation();

  const formatDate = (d: string | null | undefined) => (d ? new Date(d).toLocaleDateString() : '—');
  const formatDateTime = (d: string | null | undefined) => (d ? new Date(d).toLocaleString() : '—');
  const itemDisplayName = (it: { item_name: string | null; item_id: number }) =>
    it.item_name ?? `Item #${it.item_id}`;
  const qtyWithUnit = (qty: number, unit: string | null) =>
    unit ? `${qty} ${unit}` : String(qty);

  const statusLabel = statuses.find((s) => s.id === order.current_status_id)?.name ?? `#${order.current_status_id}`;

  const source = getLocationLabel(
    order.source_location_type,
    order.source_location_id,
    factories,
    machines,
    projects
  );
  const dest = getLocationLabel(
    order.destination_location_type,
    order.destination_location_id,
    factories,
    machines,
    projects
  );

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

  return (
    <div className="p-6 flex flex-col gap-6 min-h-0 overflow-y-auto">
      <div className="flex items-center gap-3 shrink-0">
        <Button variant="ghost" size="sm" onClick={onClose}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
      </div>

      <div className="shrink-0 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl font-semibold text-card-foreground">{order.transfer_number}</h2>
          <Badge variant="secondary">{statusLabel}</Badge>
        </div>

        {/* Source → Destination - prominent transfer path */}
        <div className="flex items-center gap-4 p-4 rounded-lg border border-border bg-muted/30">
          <div className="flex-1 flex flex-col gap-1 min-w-0">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">From</span>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground shrink-0">{source.icon}</span>
              <span className="font-semibold text-card-foreground truncate">{source.label}</span>
            </div>
            <span className="text-xs text-muted-foreground capitalize">{order.source_location_type}</span>
          </div>
          <ArrowRight className="h-6 w-6 text-brand-primary shrink-0" aria-hidden />
          <div className="flex-1 flex flex-col gap-1 min-w-0">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">To</span>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground shrink-0">{dest.icon}</span>
              <span className="font-semibold text-card-foreground truncate">{dest.label}</span>
            </div>
            <span className="text-xs text-muted-foreground capitalize">{order.destination_location_type}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
          <span><span className="text-muted-foreground">Order date:</span> {formatDate(order.order_date)}</span>
          <span><span className="text-muted-foreground">Created:</span> {formatDate(order.created_at)}</span>
        </div>

        {order.description && <p className="text-sm text-muted-foreground">{order.description}</p>}
      </div>

      <div className="flex-1 min-h-0 flex flex-col shrink-0">
        <div className="flex items-center gap-2 mb-3">
          <Package className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-base font-semibold text-card-foreground">Items ({items.length})</h3>
        </div>
        {itemsLoading ? (
          <p className="text-sm text-muted-foreground py-4">Loading...</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">No items</p>
        ) : (
          <div className="border border-border rounded-lg overflow-auto flex-1 min-h-0">
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
      </div>

      {/* Actions - after items */}
      <div className="shrink-0 pt-2">
        <OrderStatusActions
          currentStatusId={order.current_status_id}
          onStatusChange={handleStatusChange}
          isLoading={isUpdating}
          statuses={statuses}
          onDelete={onDelete}
        />
      </div>
    </div>
  );
};

export default TransferOrderDetailPanel;
