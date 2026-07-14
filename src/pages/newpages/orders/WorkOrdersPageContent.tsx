import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';
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
  useGetWorkOrdersQuery,
  useDeleteWorkOrderMutation,
} from '@/features/workOrders/workOrdersApi';
import { useGetWorkOrderTypesQuery } from '@/features/workOrderTypes/workOrderTypesApi';
import { useGetFactoriesQuery } from '@/features/factories/factoriesApi';
import { useGetMachinesQuery } from '@/features/machines/machinesApi';
import type { WorkOrder } from '@/types/workOrder';
import { Wrench, Plus, Search, CalendarIcon, PanelLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import WorkOrderDetailPanel from '@/components/newcomponents/customui/orders/WorkOrderDetailPanel';
import WorkOrdersOverviewPanel from '@/components/newcomponents/customui/orders/WorkOrdersOverviewPanel';
import WorkOrderNavigatorPanel from '@/components/newcomponents/customui/orders/WorkOrderNavigatorPanel';
import AddWorkOrderDialog from '@/components/newcomponents/customui/orders/AddWorkOrderDialog';
import { API_LIMITS } from '@/constants/apiLimits';
import {
  WORK_ORDER_PRIORITIES,
  WORK_ORDER_STATUS_OPTIONS,
  priorityLabel,
  workOrderStatusLabel,
} from './workOrderConstants';
import {
  filterWorkOrders,
  workOrderSummaryStats,
  type WorkOrderLabelContext,
  type WorkOrderPriorityFilter,
  type WorkOrderStatusFilter,
  type WorkTypeFilter,
} from './workOrdersOverviewData';
import { buildMachineIdToFactoryId } from './ordersOverviewData';

const WO_LIST_LIMIT = API_LIMITS.FLEXIBLE_1000;

/**
 * The full Work Orders browsing experience (header, filters, navigator, detail panel).
 * Extracted from the standalone page so it can also be embedded as a tab inside the
 * Machines page — work orders live on machines, so this is its natural home.
 */
const WorkOrdersPageContent: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [navigatorOpen, setNavigatorOpen] = useState(false);

  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [statusFilter, setStatusFilter] = useState<WorkOrderStatusFilter>('all');
  const [hubStatusScope, setHubStatusScope] = useState<string[] | null>(null);
  const [workTypeFilter, setWorkTypeFilter] = useState<WorkTypeFilter>('all');
  const [priorityFilter, setPriorityFilter] = useState<WorkOrderPriorityFilter>('all');
  const [factoryFilter, setFactoryFilter] = useState<string>('all');
  const [machineFilter, setMachineFilter] = useState<string>('all');

  const { data: orders = [], isLoading } = useGetWorkOrdersQuery({
    skip: 0,
    limit: WO_LIST_LIMIT,
  });
  const { data: factories = [] } = useGetFactoriesQuery({
    skip: 0,
    limit: API_LIMITS.FLEXIBLE_1000,
  });
  const { data: machines = [] } = useGetMachinesQuery({
    skip: 0,
    limit: API_LIMITS.FLEXIBLE_1000,
  });
  const { data: workOrderTypes = [] } = useGetWorkOrderTypesQuery({ skip: 0, limit: API_LIMITS.FLEXIBLE_1000 });
  const [deleteOrder] = useDeleteWorkOrderMutation();

  const machineIdToFactoryId = useMemo(
    () => buildMachineIdToFactoryId(machines),
    [machines]
  );

  const machinesForFactory = useMemo(() => {
    if (factoryFilter === 'all') return machines;
    const fid = Number(factoryFilter);
    return machines.filter((m) => machineIdToFactoryId.get(m.id) === fid);
  }, [machines, factoryFilter, machineIdToFactoryId]);

  const labelCtx: WorkOrderLabelContext = useMemo(
    () => ({
      factoryName: (id) => factories.find((f) => f.id === id)?.name ?? `Factory #${id}`,
      machineName: (id) =>
        id ? machines.find((m) => m.id === id)?.name ?? `Machine #${id}` : '—',
    }),
    [factories, machines]
  );

  const filterOpts = useMemo(
    () => ({
      from: dateRange.from,
      to: dateRange.to,
      status: statusFilter,
      workType: workTypeFilter,
      priority: priorityFilter,
      factoryId: factoryFilter,
      machineId: machineFilter,
      searchQuery,
    }),
    [
      dateRange.from,
      dateRange.to,
      statusFilter,
      workTypeFilter,
      priorityFilter,
      factoryFilter,
      machineFilter,
      searchQuery,
    ]
  );

  const filteredOrders = useMemo(() => {
    const base = filterWorkOrders(orders, filterOpts, labelCtx);
    if (!hubStatusScope) return base;
    return base.filter((o) => hubStatusScope.includes(o.status));
  }, [orders, filterOpts, labelCtx, hubStatusScope]);

  const overviewStats = useMemo(() => workOrderSummaryStats(filteredOrders), [filteredOrders]);

  const mayTruncate = orders.length >= WO_LIST_LIMIT;

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

  // One-time consumption of a hub deep link, e.g. `?status=DRAFT` or `?status=IN_PROGRESS`.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const raw = searchParams.get('status');
    if (!raw) return;
    const names = raw.split(',').map((s) => s.trim()).filter(Boolean);
    if (names.length === 1 && WORK_ORDER_STATUS_OPTIONS.some((o) => o.value === names[0])) {
      setStatusFilter(names[0] as WorkOrderStatusFilter);
    } else if (names.length > 0) {
      setHubStatusScope(names);
    }
  }, []);

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

  const factoryName = (id: number) => labelCtx.factoryName(id);
  const machineName = (id: number | null) => labelCtx.machineName(id);
  const formatDate = (d: string | null | undefined) =>
    d ? new Date(d).toLocaleDateString() : '—';
  const formatCurrency = (v: number | null | undefined) =>
    v != null
      ? new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 2,
        }).format(v)
      : '—';

  const hasActiveFilters =
    dateRange.from != null ||
    dateRange.to != null ||
    statusFilter !== 'all' ||
    workTypeFilter !== 'all' ||
    priorityFilter !== 'all' ||
    factoryFilter !== 'all' ||
    machineFilter !== 'all' ||
    hubStatusScope != null ||
    searchQuery.trim().length > 0;

  const handleDelete = async (o: WorkOrder) => {
    if (!window.confirm(`Delete work order ${o.work_order_number}?`)) return;
    try {
      await deleteOrder(o.id).unwrap();
      toast.success('Work order deleted');
      if (selectedOrderId === o.id) setSelectedOrder(null);
    } catch (err: unknown) {
      const e = err as { data?: { detail?: string } };
      toast.error(e?.data?.detail || 'Failed to delete');
    }
  };

  const handleFactoryChange = (value: string) => {
    setFactoryFilter(value);
    setMachineFilter('all');
  };

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <AppShellHeader>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-primary/10 dark:bg-brand-primary/20 ring-1 ring-brand-primary/25 dark:ring-brand-primary/35">
              <Wrench className="h-5 w-5 text-brand-primary" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-card-foreground dark:text-foreground">
              Work Orders
            </h1>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative w-[220px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                type="text"
                placeholder="Search by WO# or title..."
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
              Add Work Order
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
              <span className="font-medium">{selectedOrder.work_order_number}</span>
              <span className="text-muted-foreground font-normal"> · {selectedOrder.title}</span>
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

        <Select
          value={statusFilter}
          onValueChange={(v) => {
            setStatusFilter(v as WorkOrderStatusFilter);
            setHubStatusScope(null);
          }}
        >
          <SelectTrigger className="w-[150px] h-9 border-border bg-background text-sm">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {WORK_ORDER_STATUS_OPTIONS.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={workTypeFilter === 'all' ? 'all' : String(workTypeFilter)}
          onValueChange={(v) => setWorkTypeFilter(v === 'all' ? 'all' : Number(v))}
        >
          <SelectTrigger className="w-[130px] h-9 border-border bg-background text-sm">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {workOrderTypes.map((t) => (
              <SelectItem key={t.id} value={String(t.id)}>
                {t.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={priorityFilter}
          onValueChange={(v) => setPriorityFilter(v as WorkOrderPriorityFilter)}
        >
          <SelectTrigger className="w-[120px] h-9 border-border bg-background text-sm">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All priorities</SelectItem>
            {WORK_ORDER_PRIORITIES.map((p) => (
              <SelectItem key={p} value={p}>
                {priorityLabel(p)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={factoryFilter} onValueChange={handleFactoryChange}>
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

        <Select value={machineFilter} onValueChange={setMachineFilter}>
          <SelectTrigger className="w-[140px] h-9 border-border bg-background text-sm">
            <SelectValue placeholder="Machine" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All machines</SelectItem>
            {machinesForFactory.map((m) => (
              <SelectItem key={m.id} value={String(m.id)}>
                {m.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex-1 min-h-0 flex overflow-hidden bg-background">
        {navigatorOpen && (
          <WorkOrderNavigatorPanel
            onClose={() => setNavigatorOpen(false)}
            filteredOrders={filteredOrders}
            selectedOrderId={selectedOrderId}
            isLoading={isLoading}
            hasActiveFilters={hasActiveFilters}
            onSelectOrder={(id) => setSelectedOrder(id)}
            onAddOrder={() => setIsAddOpen(true)}
            formatDate={formatDate}
          />
        )}

        <div className="flex-1 min-w-0 min-h-0 overflow-hidden">
          {selectedOrder ? (
            <WorkOrderDetailPanel
              order={selectedOrder}
              onClose={() => setSelectedOrder(null)}
              onDelete={() => handleDelete(selectedOrder)}
            />
          ) : (
            <WorkOrdersOverviewPanel
              orders={filteredOrders}
              stats={overviewStats}
              isLoading={isLoading}
              mayTruncate={mayTruncate}
              statusLabel={workOrderStatusLabel}
              priorityLabel={priorityLabel}
              factoryName={factoryName}
              machineName={machineName}
              formatDate={formatDate}
              formatCurrency={formatCurrency}
              onSelectOrder={(id) => setSelectedOrder(id)}
            />
          )}
        </div>
      </div>

      <AddWorkOrderDialog
        open={isAddOpen}
        onOpenChange={setIsAddOpen}
        onSuccess={(order) => {
          setSelectedOrder(order.id);
          setIsAddOpen(false);
        }}
      />
    </div>
  );
};

export default WorkOrdersPageContent;
