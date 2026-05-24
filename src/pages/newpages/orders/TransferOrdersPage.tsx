import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';
import DashboardNavbar from '@/components/newcomponents/customui/DashboardNavbar';
import AppShellHeader, { appShellHeaderControlClass } from '@/components/newcomponents/customui/AppShellHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  useGetTransferOrdersQuery,
  useDeleteTransferOrderMutation,
} from '@/features/transferOrders/transferOrdersApi';
import { useGetStatusesQuery } from '@/features/statuses/statusesApi';
import { useGetFactoriesQuery } from '@/features/factories/factoriesApi';
import { useGetMachinesQuery } from '@/features/machines/machinesApi';
import { useGetFactorySectionsQuery } from '@/features/factorySections/factorySectionsApi';
import { useGetProjectsQuery } from '@/features/projects/projectsApi';
import type { TransferOrder } from '@/types/transferOrder';
import { ArrowLeftRight, Plus, Loader2, Search, CalendarIcon, PanelLeft } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import TransferOrderDetailPanel from '@/components/newcomponents/customui/orders/TransferOrderDetailPanel';
import TransferOrdersOverviewPanel from '@/components/newcomponents/customui/orders/TransferOrdersOverviewPanel';
import TransferOrderNavigatorPanel from '@/components/newcomponents/customui/orders/TransferOrderNavigatorPanel';
import AddTransferOrderDialog from '@/components/newcomponents/customui/orders/AddTransferOrderDialog';
import { API_LIMITS } from '@/constants/apiLimits';
import {
  buildMachineIdToFactoryId,
  buildProjectIdToFactoryId,
} from './ordersOverviewData';
import {
  filterTransferOrders,
  transferOrderSummaryStats,
  type TransferLocationTypeFilter,
} from './transferOrdersOverviewData';
import {
  transferRouteLabel,
  transferRouteTypeLabel,
  type TransferLocationLabelContext,
} from './transferOrderLocationLabels';

const TR_LIST_LIMIT = API_LIMITS.FLEXIBLE_1000;

const LOCATION_TYPE_OPTIONS: { value: TransferLocationTypeFilter; label: string }[] = [
  { value: 'all', label: 'All types' },
  { value: 'storage', label: 'Storage' },
  { value: 'machine', label: 'Machine' },
  { value: 'project', label: 'Project' },
  { value: 'damaged', label: 'Damaged' },
];

const TransferOrdersPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [navigatorOpen, setNavigatorOpen] = useState(false);

  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [factoryFilter, setFactoryFilter] = useState<string>('all');
  const [sourceTypeFilter, setSourceTypeFilter] = useState<TransferLocationTypeFilter>('all');
  const [destinationTypeFilter, setDestinationTypeFilter] =
    useState<TransferLocationTypeFilter>('all');

  const { data: orders = [], isLoading } = useGetTransferOrdersQuery({
    skip: 0,
    limit: TR_LIST_LIMIT,
  });
  const { data: statuses = [] } = useGetStatusesQuery({
    skip: 0,
    limit: API_LIMITS.STRICT_100,
  });
  const { data: factories = [] } = useGetFactoriesQuery({
    skip: 0,
    limit: API_LIMITS.FLEXIBLE_1000,
  });
  const { data: machines = [] } = useGetMachinesQuery({
    skip: 0,
    limit: API_LIMITS.FLEXIBLE_1000,
  });
  const { data: factorySections = [] } = useGetFactorySectionsQuery({
    skip: 0,
    limit: API_LIMITS.FLEXIBLE_1000,
  });
  const { data: projects = [] } = useGetProjectsQuery({
    skip: 0,
    limit: API_LIMITS.FLEXIBLE_1000,
  });
  const [deleteOrder] = useDeleteTransferOrderMutation();

  const statusMap = useMemo(() => new Map(statuses.map((s) => [s.id, s.name])), [statuses]);

  const resolutionMaps = useMemo(
    () => ({
      machineIdToFactoryId: buildMachineIdToFactoryId(machines, factorySections),
      projectIdToFactoryId: buildProjectIdToFactoryId(projects),
    }),
    [machines, factorySections, projects]
  );

  const labelCtx: TransferLocationLabelContext = useMemo(
    () => ({ factories, machines, projects }),
    [factories, machines, projects]
  );

  const filterOpts = useMemo(
    () => ({
      from: dateRange.from,
      to: dateRange.to,
      statusId: statusFilter,
      factoryId: factoryFilter,
      sourceType: sourceTypeFilter,
      destinationType: destinationTypeFilter,
      searchQuery,
    }),
    [
      dateRange.from,
      dateRange.to,
      statusFilter,
      factoryFilter,
      sourceTypeFilter,
      destinationTypeFilter,
      searchQuery,
    ]
  );

  const filteredOrders = useMemo(
    () => filterTransferOrders(orders, filterOpts, resolutionMaps, labelCtx),
    [orders, filterOpts, resolutionMaps, labelCtx]
  );

  const overviewStats = useMemo(
    () => transferOrderSummaryStats(filteredOrders, statusMap),
    [filteredOrders, statusMap]
  );

  const mayTruncate = orders.length >= TR_LIST_LIMIT;

  const selectedOrder =
    filteredOrders.find((o) => o.id === selectedOrderId) ??
    orders.find((o) => o.id === selectedOrderId) ??
    null;
  const selectedOrderFromUrl = searchParams.get('orderId');

  useEffect(() => {
    if (!selectedOrderFromUrl) return;
    const parsed = Number(selectedOrderFromUrl);
    if (Number.isNaN(parsed)) return;
    setSelectedOrderId(parsed);
  }, [selectedOrderFromUrl]);

  const setSelectedOrder = (orderId: number | null) => {
    setSelectedOrderId(orderId);
    if (orderId == null) {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.delete('orderId');
        return next;
      });
      return;
    }
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('orderId', String(orderId));
      return next;
    });
  };

  const routeLabel = (order: TransferOrder) => transferRouteLabel(order, labelCtx);
  const statusLabel = (id: number) => statusMap.get(id) ?? `#${id}`;
  const formatDate = (d: string | null | undefined) =>
    d ? new Date(d).toLocaleDateString() : '—';

  const hasActiveFilters =
    dateRange.from != null ||
    dateRange.to != null ||
    statusFilter !== 'all' ||
    factoryFilter !== 'all' ||
    sourceTypeFilter !== 'all' ||
    destinationTypeFilter !== 'all' ||
    searchQuery.trim().length > 0;

  const handleDelete = async (o: TransferOrder) => {
    if (!window.confirm(`Delete transfer order ${o.transfer_number}?`)) return;
    try {
      await deleteOrder(o.id).unwrap();
      toast.success('Transfer order deleted');
      if (selectedOrderId === o.id) setSelectedOrder(null);
    } catch (err: unknown) {
      const e = err as { data?: { detail?: string } };
      toast.error(e?.data?.detail || 'Failed to delete');
    }
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Toaster position="top-right" />
      <DashboardNavbar />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <AppShellHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-primary/10 dark:bg-brand-primary/20 ring-1 ring-brand-primary/25 dark:ring-brand-primary/35">
                <ArrowLeftRight className="h-5 w-5 text-brand-primary" />
              </div>
              <h1 className="text-2xl font-semibold tracking-tight text-card-foreground dark:text-foreground">
                Transfer Orders
              </h1>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative w-[220px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Search by TR# or route..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`pl-9 ${appShellHeaderControlClass} bg-background`}
                />
              </div>
              <Button
                type="button"
                onClick={() => setIsAddOpen(true)}
                className={`${appShellHeaderControlClass} bg-brand-primary hover:bg-brand-primary-hover`}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Transfer Order
              </Button>
            </div>
          </div>
        </AppShellHeader>

        <div className="shrink-0 border-b border-border bg-card/50 px-4 py-3 flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant={navigatorOpen ? 'secondary' : 'outline'}
            size="sm"
            onClick={() => setNavigatorOpen((prev) => !prev)}
            className={`shrink-0 max-w-[280px] justify-start border-border bg-background ${appShellHeaderControlClass}`}
          >
            <PanelLeft className="mr-2 h-4 w-4 shrink-0" />
            {selectedOrder ? (
              <span className="truncate text-left">
                <span className="font-medium">{selectedOrder.transfer_number}</span>
                <span className="text-muted-foreground font-normal">
                  {' '}
                  · {transferRouteTypeLabel(selectedOrder)}
                </span>
              </span>
            ) : (
              <span className="truncate">
                Browse orders
                <span className="text-muted-foreground font-normal"> · {filteredOrders.length}</span>
              </span>
            )}
          </Button>

          <div className="hidden sm:block h-6 w-px bg-border shrink-0" aria-hidden />

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={`min-w-[200px] justify-start border-border bg-background ${appShellHeaderControlClass}`}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange.from ? (
                  dateRange.to ? (
                    `${format(dateRange.from, 'MMM d')} – ${format(dateRange.to, 'MMM d')}`
                  ) : (
                    format(dateRange.from, 'MMM d')
                  )
                ) : (
                  'All dates'
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="range"
                selected={{ from: dateRange.from, to: dateRange.to }}
                onSelect={(r) => setDateRange({ from: r?.from, to: r?.to })}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px] h-9 border-border bg-background text-sm">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {statuses.map((s) => (
                <SelectItem key={s.id} value={String(s.id)}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={factoryFilter} onValueChange={setFactoryFilter}>
            <SelectTrigger className="w-[140px] h-9 border-border bg-background text-sm">
              <SelectValue placeholder="Factory" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All factories</SelectItem>
              {factories.map((f) => (
                <SelectItem key={f.id} value={String(f.id)}>
                  {f.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={sourceTypeFilter}
            onValueChange={(v) => setSourceTypeFilter(v as TransferLocationTypeFilter)}
          >
            <SelectTrigger className="w-[130px] h-9 border-border bg-background text-sm">
              <SelectValue placeholder="Source" />
            </SelectTrigger>
            <SelectContent>
              {LOCATION_TYPE_OPTIONS.map((opt) => (
                <SelectItem key={`src-${opt.value}`} value={opt.value}>
                  {opt.value === 'all' ? 'All sources' : opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={destinationTypeFilter}
            onValueChange={(v) => setDestinationTypeFilter(v as TransferLocationTypeFilter)}
          >
            <SelectTrigger className="w-[130px] h-9 border-border bg-background text-sm">
              <SelectValue placeholder="Destination" />
            </SelectTrigger>
            <SelectContent>
              {LOCATION_TYPE_OPTIONS.map((opt) => (
                <SelectItem key={`dst-${opt.value}`} value={opt.value}>
                  {opt.value === 'all' ? 'All destinations' : opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 min-h-0 flex overflow-hidden bg-background">
          {navigatorOpen && (
            <TransferOrderNavigatorPanel
              onClose={() => setNavigatorOpen(false)}
              filteredOrders={filteredOrders}
              selectedOrderId={selectedOrderId}
              isLoading={isLoading}
              hasActiveFilters={hasActiveFilters}
              onSelectOrder={(id) => setSelectedOrder(id)}
              onAddOrder={() => setIsAddOpen(true)}
              statusLabel={statusLabel}
              formatDate={formatDate}
            />
          )}

          <div className="flex-1 min-w-0 min-h-0 overflow-hidden">
            {selectedOrder ? (
              <TransferOrderDetailPanel
                order={selectedOrder}
                onClose={() => setSelectedOrder(null)}
                onDelete={() => handleDelete(selectedOrder)}
                onUpdated={() => setSelectedOrder(selectedOrder.id)}
              />
            ) : (
              <TransferOrdersOverviewPanel
                orders={filteredOrders}
                stats={overviewStats}
                isLoading={isLoading}
                mayTruncate={mayTruncate}
                routeLabel={routeLabel}
                statusLabel={statusLabel}
                formatDate={formatDate}
                onSelectOrder={(id) => setSelectedOrder(id)}
              />
            )}
          </div>
        </div>
      </div>

      <AddTransferOrderDialog
        open={isAddOpen}
        onOpenChange={setIsAddOpen}
        onSuccess={(createdOrder) => {
          setSelectedOrder((createdOrder as TransferOrder).id);
          setIsAddOpen(false);
        }}
      />
    </div>
  );
};

export default TransferOrdersPage;
