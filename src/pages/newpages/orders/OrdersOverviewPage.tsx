import React, { useState, useMemo } from 'react';
import DashboardNavbar from '@/components/newcomponents/customui/DashboardNavbar';
import { Link } from 'react-router-dom';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import AppShellHeader, {
  appShellHeaderControlClass,
  appShellHeaderLoweredSelectorClass,
} from '@/components/newcomponents/customui/AppShellHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
  ShoppingCart,
  LayoutDashboard,
  ArrowLeftRight,
  CreditCard,
  Receipt,
  Wrench,
  CalendarIcon,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import { useGetPurchaseOrdersQuery } from '@/features/purchaseOrders/purchaseOrdersApi';
import { useGetTransferOrdersQuery } from '@/features/transferOrders/transferOrdersApi';
import { useGetExpenseOrdersQuery } from '@/features/expenseOrders/expenseOrdersApi';
import { useGetWorkOrdersQuery } from '@/features/workOrders/workOrdersApi';
import { useGetFactoriesQuery } from '@/features/factories/factoriesApi';
import { useGetStatusesQuery } from '@/features/statuses/statusesApi';
import { useGetMachinesQuery } from '@/features/machines/machinesApi';
import { useGetFactorySectionsQuery } from '@/features/factorySections/factorySectionsApi';
import { useGetProjectsQuery } from '@/features/projects/projectsApi';
import { API_LIMITS } from '@/constants/apiLimits';
import {
  normalizeOrders,
  filterOverviewOrders,
  aggregateCountsByType,
  aggregateStatusBreakdown,
  aggregateFactoryBreakdown,
  bucketOrdersOverTime,
  summaryStats,
  recentOrders,
  buildMachineIdToFactoryId,
  buildProjectIdToFactoryId,
  type OverviewOrder,
} from './ordersOverviewData';
import { useSalesOrdersForOverview } from './useSalesOrdersForOverview';

const ORDER_TYPES = [
  { id: 'purchase', label: 'Purchase', path: '/orders/purchase', icon: ShoppingCart },
  { id: 'transfer', label: 'Transfer', path: '/orders/transfer', icon: ArrowLeftRight },
  { id: 'expense', label: 'Expense', path: '/orders/expense', icon: CreditCard },
  { id: 'sales', label: 'Sales', path: '/orders/sales', icon: Receipt },
  { id: 'work', label: 'Work', path: '/orders/work', icon: Wrench },
] as const;

/** Status pie + orders-over-time bars — `index.css` --pastel-1 … --pastel-5 (+ HSL fallbacks) */
const PASTEL_CHART_FILLS = [
  'var(--pastel-1, hsla(257, 43%, 70%, 1))',
  'var(--pastel-2, hsla(192, 95%, 76%, 1))',
  'var(--pastel-3, hsla(83, 46%, 75%, 1))',
  'var(--pastel-4, hsla(57, 75%, 84%, 1))',
  'var(--pastel-5, hsla(15, 77%, 90%, 1))',
] as const;

const OrdersOverviewPage: React.FC = () => {
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });
  const [factoryFilter, setFactoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data: purchaseOrders = [], isLoading: loadPo, isError: errPo } = useGetPurchaseOrdersQuery({
    skip: 0,
    limit: API_LIMITS.FLEXIBLE_1000,
  });
  const { data: transferOrders = [], isLoading: loadTo, isError: errTo } = useGetTransferOrdersQuery({
    skip: 0,
    limit: API_LIMITS.FLEXIBLE_1000,
  });
  const { data: expenseOrders = [], isLoading: loadEo, isError: errEo } = useGetExpenseOrdersQuery({
    skip: 0,
    limit: API_LIMITS.FLEXIBLE_1000,
  });
  const {
    salesOrders,
    isLoading: loadSo,
    isError: errSo,
    mayTruncate: salesMayTruncate,
  } = useSalesOrdersForOverview();
  const { data: workOrders = [], isLoading: loadWo, isError: errWo } = useGetWorkOrdersQuery({
    skip: 0,
    limit: API_LIMITS.FLEXIBLE_1000,
  });
  const { data: factories = [], isLoading: loadFa, isError: errFa } = useGetFactoriesQuery({
    skip: 0,
    limit: API_LIMITS.FLEXIBLE_1000,
  });
  const { data: statuses = [], isLoading: loadSt, isError: errSt } = useGetStatusesQuery({
    skip: 0,
    limit: API_LIMITS.STRICT_100,
  });
  const { data: machines = [], isLoading: loadMa, isError: errMa } = useGetMachinesQuery({
    skip: 0,
    limit: API_LIMITS.FLEXIBLE_1000,
  });
  const { data: factorySections = [], isLoading: loadSec, isError: errSec } = useGetFactorySectionsQuery({
    skip: 0,
    limit: API_LIMITS.FLEXIBLE_1000,
  });
  const { data: projects = [], isLoading: loadPr, isError: errPr } = useGetProjectsQuery({
    skip: 0,
    limit: API_LIMITS.FLEXIBLE_1000,
  });

  const isLoading =
    loadPo ||
    loadTo ||
    loadEo ||
    loadSo ||
    loadWo ||
    loadFa ||
    loadSt ||
    loadMa ||
    loadSec ||
    loadPr;
  const loadError =
    errPo ||
    errTo ||
    errEo ||
    errSo ||
    errWo ||
    errFa ||
    errSt ||
    errMa ||
    errSec ||
    errPr;

  const statusById = useMemo(() => new Map(statuses.map((s) => [s.id, s.name])), [statuses]);
  const factoryNames = useMemo(() => new Map(factories.map((f) => [f.id, f.name])), [factories]);

  const resolutionMaps = useMemo(
    () => ({
      machineIdToFactoryId: buildMachineIdToFactoryId(machines, factorySections),
      projectIdToFactoryId: buildProjectIdToFactoryId(projects),
    }),
    [machines, factorySections, projects]
  );

  const allNormalized = useMemo(
    () =>
      normalizeOrders(
        purchaseOrders,
        transferOrders,
        expenseOrders,
        salesOrders,
        workOrders,
        statusById,
        resolutionMaps
      ),
    [
      purchaseOrders,
      transferOrders,
      expenseOrders,
      salesOrders,
      workOrders,
      statusById,
      resolutionMaps,
    ]
  );

  const scopeOpts = useMemo(
    () => ({
      from: dateRange.from,
      to: dateRange.to,
      factoryId: factoryFilter,
      statusFilter: 'all' as const,
    }),
    [dateRange.from, dateRange.to, factoryFilter]
  );

  const scopedOrders = useMemo(
    () => filterOverviewOrders(allNormalized, scopeOpts),
    [allNormalized, scopeOpts]
  );

  const statusOptions = useMemo(() => {
    const labels = [...new Set(scopedOrders.map((o) => o.statusLabel))];
    return labels.sort((a, b) => a.localeCompare(b));
  }, [scopedOrders]);

  const countsByType = useMemo(() => aggregateCountsByType(scopedOrders), [scopedOrders]);
  const statusBreakdown = useMemo(() => aggregateStatusBreakdown(scopedOrders), [scopedOrders]);
  const factoryBreakdown = useMemo(
    () => aggregateFactoryBreakdown(scopedOrders, factoryNames),
    [scopedOrders, factoryNames]
  );
  const ordersOverTime = useMemo(
    () => bucketOrdersOverTime(scopedOrders, dateRange.from, dateRange.to),
    [scopedOrders, dateRange.from, dateRange.to]
  );

  const { pendingApprovalsCount, overdueCount, pendingValue, completedValue } = useMemo(
    () => summaryStats(scopedOrders, new Date()),
    [scopedOrders]
  );

  const totalOrdersCount = scopedOrders.length;

  const filteredFactoryBreakdown = useMemo(() => {
    if (factoryFilter === 'all') return factoryBreakdown;
    const fid = Number(factoryFilter);
    return factoryBreakdown.filter((f) => f.factoryId === fid);
  }, [factoryBreakdown, factoryFilter]);

  const filteredRecentOrders = useMemo(() => {
    const filtered = filterOverviewOrders(allNormalized, {
      from: dateRange.from,
      to: dateRange.to,
      factoryId: factoryFilter,
      statusFilter,
    });
    return recentOrders(filtered, 25);
  }, [allNormalized, dateRange.from, dateRange.to, factoryFilter, statusFilter]);

  const formatCurrency = (v: number) =>
    v > 0
      ? new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(v)
      : '—';

  const getOrderTypePath = (type: string) =>
    ORDER_TYPES.find((t) => t.id === type)?.path ?? '/orders/purchase';

  const renderRecentRow = (o: OverviewOrder) => {
    const typeConfig = ORDER_TYPES.find((t) => t.id === o.kind);
    const Icon = typeConfig?.icon ?? ShoppingCart;
    return (
      <Link
        key={`${o.kind}-${o.id}`}
        to={getOrderTypePath(o.kind)}
        className="flex items-center justify-between py-3 px-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
          <div>
            <p className="font-medium">{o.ref}</p>
            <p className="text-sm text-muted-foreground">
              {o.displayDate} · {o.statusLabel}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {o.amount > 0 && <span className="font-medium">{formatCurrency(o.amount)}</span>}
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </div>
      </Link>
    );
  };

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardNavbar />
      <div className="flex-1 min-w-0">
        <AppShellHeader sticky>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex min-w-0 flex-1 flex-wrap items-end gap-3">
              <div className="flex min-w-0 items-center gap-3 shrink-0">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-primary/10 dark:bg-brand-primary/20 ring-1 ring-brand-primary/25 dark:ring-brand-primary/35">
                  <LayoutDashboard className="h-5 w-5 text-brand-primary" />
                </div>
                <h1 className="text-2xl font-semibold tracking-tight text-card-foreground dark:text-foreground">
                  Orders Overview
                </h1>
              </div>
              <div className="hidden h-6 w-px bg-border sm:block" />
              <div className="flex min-w-0 items-end gap-2 flex-wrap">
                <Select value={factoryFilter} onValueChange={setFactoryFilter}>
                  <SelectTrigger className={`w-[130px] ${appShellHeaderLoweredSelectorClass}`}>
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
              </div>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
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
                      'Date range'
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="range"
                    selected={{ from: dateRange.from, to: dateRange.to }}
                    onSelect={(r) => setDateRange({ from: r?.from, to: r?.to })}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className={`w-[160px] border-border bg-background ${appShellHeaderControlClass}`}>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  {statusOptions.map((name) => (
                    <SelectItem key={name} value={name}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </AppShellHeader>

        <div className="p-6 space-y-6 overflow-y-auto">
          {loadError && (
            <p className="text-sm text-destructive">
              Some order data could not be loaded. Check your connection and workspace access.
            </p>
          )}

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
              <Loader2 className="h-10 w-10 animate-spin text-brand-primary mb-3" />
              <p className="text-sm">Loading orders overview…</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Total Orders
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-foreground">{totalOrdersCount}</p>
                    <p className="text-xs text-muted-foreground mt-1">In selected range & factory</p>
                  </CardContent>
                </Card>
                <Card className="border-border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Pending Approvals
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-foreground">{pendingApprovalsCount}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      WIP: work orders in PENDING_APPROVAL; other types only if status name is Pending or Draft
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Overdue</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-destructive">{overdueCount}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      WIP heuristic: past expense due, sales expected delivery, or work end date (still “open”)
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Pending Value (in range)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-foreground">{formatCurrency(pendingValue)}</p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border-border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Orders by Type</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {countsByType.map((t) => (
                        <div
                          key={t.type}
                          className="flex items-center justify-between py-2 border-b border-border last:border-0"
                        >
                          <span className="font-medium">{t.type}</span>
                          <div className="flex items-center gap-4">
                            <span className="text-muted-foreground">{t.count} orders</span>
                            {t.value > 0 && (
                              <span className="text-sm font-medium">{formatCurrency(t.value)}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Status Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {statusBreakdown.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-8 text-center">No orders in scope.</p>
                    ) : (
                      <div className="h-[180px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={statusBreakdown}
                              dataKey="count"
                              nameKey="status"
                              cx="50%"
                              cy="50%"
                              outerRadius={60}
                              label={({ status, count }) => `${status}: ${count}`}
                            >
                                {statusBreakdown.map((_, i) => (
                                  <Cell
                                    key={i}
                                    fill={PASTEL_CHART_FILLS[i % PASTEL_CHART_FILLS.length]}
                                  />
                                ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border-border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Order Value (in range)</CardTitle>
                    <CardDescription>Non-completed vs completed (by status name heuristics)</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Pending / open</span>
                        <span className="font-semibold">{formatCurrency(pendingValue)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Completed</span>
                        <span className="font-semibold text-green-600 dark:text-green-500">
                          {formatCurrency(completedValue)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Factory Breakdown</CardTitle>
                    <CardDescription>
                      Storage/damaged IDs = factory; machine → factory via section; project → project.factory_id
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {filteredFactoryBreakdown.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-4">
                        No orders attributed to a factory in this scope (e.g. expenses have no factory field).
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {filteredFactoryBreakdown.map((f) => (
                          <div
                            key={f.factoryId}
                            className="flex items-center justify-between py-2 border-b border-border last:border-0"
                          >
                            <span className="font-medium">{f.factoryName}</span>
                            <div className="flex items-center gap-4">
                              <span className="text-muted-foreground">{f.count} orders</span>
                              {f.pendingValue > 0 && (
                                <span className="text-sm font-medium">
                                  {formatCurrency(f.pendingValue)}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <Card className="border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Orders Over Time</CardTitle>
                  <CardDescription>
                    Per day by business date (transfer: order date, expense: expense date, sales: order date;
                    others: created date)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {ordersOverTime.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-8 text-center">
                      Pick a date range to see the chart.
                    </p>
                  ) : (
                    <div className="h-[180px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={ordersOverTime}>
                          <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                          <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                          <Tooltip />
                          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                            {ordersOverTime.map((row, index) => (
                              <Cell
                                key={`${index}-${row.date}`}
                                fill={PASTEL_CHART_FILLS[index % PASTEL_CHART_FILLS.length]}
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Recent Activity</CardTitle>
                  <CardDescription>Latest by created time · status filter applies here only</CardDescription>
                </CardHeader>
                <CardContent>
                  {filteredRecentOrders.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4">No orders match your filters.</p>
                  ) : (
                    <div className="space-y-3">{filteredRecentOrders.map(renderRecentRow)}</div>
                  )}
                </CardContent>
              </Card>

              <p className="text-xs text-muted-foreground max-w-3xl">
                APIs use skip/limit pagination. Sales orders are merged from pages of {API_LIMITS.STRICT_100}{' '}
                (up to {10 * API_LIMITS.STRICT_100} rows).
                {salesMayTruncate
                  ? ' The last sales page was full — you may have more than 1000 sales orders; this view can undercount.'
                  : ''}{' '}
                Purchase, transfer, expense, and work lists load up to {API_LIMITS.FLEXIBLE_1000} each.
                Machines, factory sections, and projects load up to {API_LIMITS.FLEXIBLE_1000} for resolving
                machine/project legs to a factory.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrdersOverviewPage;
