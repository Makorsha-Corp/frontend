import React, { useState, useMemo } from 'react';
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
import DashboardNavbar, { SIDEBAR_COLLAPSED_KEY } from '@/components/newcomponents/customui/DashboardNavbar';
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
} from 'lucide-react';

/** Mock data for Orders Overview */
const MOCK_FACTORIES = [
  { id: 1, name: 'Factory A' },
  { id: 2, name: 'Factory B' },
  { id: 3, name: 'Factory C' },
];

const MOCK_STATUSES = [
  { id: 1, name: 'Pending' },
  { id: 2, name: 'Working' },
  { id: 3, name: 'Completed' },
];

const ORDER_TYPES = [
  { id: 'purchase', label: 'Purchase', path: '/orders/purchase', icon: ShoppingCart },
  { id: 'transfer', label: 'Transfer', path: '/orders/transfer', icon: ArrowLeftRight },
  { id: 'expense', label: 'Expense', path: '/orders/expense', icon: CreditCard },
  { id: 'sales', label: 'Sales', path: '/orders/sales', icon: Receipt },
  { id: 'work', label: 'Work', path: '/orders/work', icon: Wrench },
] as const;

const MOCK_COUNTS_BY_TYPE = [
  { type: 'Purchase', count: 24, value: 125000 },
  { type: 'Transfer', count: 18, value: 0 },
  { type: 'Expense', count: 12, value: 45000 },
  { type: 'Sales', count: 32, value: 280000 },
  { type: 'Work', count: 8, value: 0 },
];

const MOCK_STATUS_BREAKDOWN = [
  { status: 'Pending', count: 12 },
  { status: 'Working', count: 28 },
  { status: 'Completed', count: 54 },
];

const MOCK_FACTORY_BREAKDOWN = [
  { factoryId: 1, factoryName: 'Factory A', count: 35, pendingValue: 85000 },
  { factoryId: 2, factoryName: 'Factory B', count: 28, pendingValue: 62000 },
  { factoryId: 3, factoryName: 'Factory C', count: 31, pendingValue: 122000 },
];

const MOCK_ORDERS_OVER_TIME = [
  { date: 'Mar 10', count: 5 },
  { date: 'Mar 11', count: 8 },
  { date: 'Mar 12', count: 4 },
  { date: 'Mar 13', count: 12 },
  { date: 'Mar 14', count: 7 },
  { date: 'Mar 15', count: 9 },
  { date: 'Mar 16', count: 6 },
];

const MOCK_RECENT_ORDERS = [
  { id: 1, type: 'purchase', ref: 'PO-2025-001', amount: 12500, date: '2025-03-16', status: 'Pending', factoryId: 1 },
  { id: 2, type: 'sales', ref: 'SO-2025-042', amount: 28000, date: '2025-03-16', status: 'Working', factoryId: 2 },
  { id: 3, type: 'transfer', ref: 'TR-2025-018', amount: 0, date: '2025-03-15', status: 'Completed', factoryId: 1 },
  { id: 4, type: 'expense', ref: 'EXP-2025-012', amount: 4500, date: '2025-03-15', status: 'Pending', factoryId: 1 },
  { id: 5, type: 'purchase', ref: 'PO-2025-002', amount: 8200, date: '2025-03-14', status: 'Working', factoryId: 2 },
  { id: 6, type: 'sales', ref: 'SO-2025-041', amount: 15000, date: '2025-03-14', status: 'Completed', factoryId: 1 },
  { id: 7, type: 'work', ref: 'WO-2025-003', amount: 0, date: '2025-03-13', status: 'Pending', factoryId: 3 },
  { id: 8, type: 'transfer', ref: 'TR-2025-017', amount: 0, date: '2025-03-13', status: 'Working', factoryId: 2 },
  { id: 9, type: 'purchase', ref: 'PO-2025-003', amount: 32000, date: '2025-03-12', status: 'Completed', factoryId: 1 },
  { id: 10, type: 'expense', ref: 'EXP-2025-011', amount: 1200, date: '2025-03-12', status: 'Completed', factoryId: 2 },
];

const PendingApprovalsCount = 7;
const OverdueCount = 3;
const PendingValueThisMonth = 95000;
const CompletedValueThisMonth = 185000;

const PIE_COLORS = ['#9067c6', '#8d86c9', '#7c6bb8', '#6b5aa7', '#5a4996'];

const OrdersOverviewPage: React.FC = () => {
  const [isNavCollapsed, setIsNavCollapsed] = useState(() =>
    localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true'
  );
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });
  const [factoryFilter, setFactoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const formatCurrency = (v: number) =>
    v > 0
      ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v)
      : '—';

  const getOrderTypePath = (type: string) => ORDER_TYPES.find((t) => t.id === type)?.path ?? '/orders/purchase';

  const filteredRecentOrders = useMemo(() => {
    let result = [...MOCK_RECENT_ORDERS];
    if (factoryFilter !== 'all') {
      const fid = Number(factoryFilter);
      result = result.filter((o) => o.factoryId === fid);
    }
    if (statusFilter !== 'all') {
      result = result.filter((o) => o.status.toLowerCase() === statusFilter.toLowerCase());
    }
    return result;
  }, [factoryFilter, statusFilter]);

  const filteredFactoryBreakdown = useMemo(() => {
    if (factoryFilter === 'all') return MOCK_FACTORY_BREAKDOWN;
    const fid = Number(factoryFilter);
    return MOCK_FACTORY_BREAKDOWN.filter((f) => f.factoryId === fid);
  }, [factoryFilter]);

  const totalOrdersCount = MOCK_COUNTS_BY_TYPE.reduce((s, t) => s + t.count, 0);

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardNavbar onCollapsedChange={setIsNavCollapsed} />
      <div className={`flex-1 transition-all duration-300 ${isNavCollapsed ? 'ml-20' : 'ml-64'}`}>
        {/* Header */}
        <div className="bg-card dark:bg-[hsl(var(--nav-background))] border-b border-border px-8 py-5 sticky top-0 z-10 shadow-sm">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-primary/10 dark:bg-brand-primary/20 rounded-lg flex items-center justify-center">
                <LayoutDashboard className="h-5 w-5 text-brand-primary" />
              </div>
              <h1 className="text-2xl font-bold text-card-foreground dark:text-foreground">
                Orders Overview
              </h1>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="min-w-[200px] justify-start h-9">
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
              <Select value={factoryFilter} onValueChange={setFactoryFilter}>
                <SelectTrigger className="w-[130px] h-9">
                  <SelectValue placeholder="Factory" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All factories</SelectItem>
                  {MOCK_FACTORIES.map((f) => (
                    <SelectItem key={f.id} value={String(f.id)}>
                      {f.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[130px] h-9">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  {MOCK_STATUSES.map((s) => (
                    <SelectItem key={s.id} value={s.name.toLowerCase()}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Summary stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-foreground">{totalOrdersCount}</p>
              </CardContent>
            </Card>
            <Card className="border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Pending Approvals</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-foreground">{PendingApprovalsCount}</p>
              </CardContent>
            </Card>
            <Card className="border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Overdue</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-destructive">{OverdueCount}</p>
              </CardContent>
            </Card>
            <Card className="border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Pending Value (This Month)</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-foreground">{formatCurrency(PendingValueThisMonth)}</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Counts by type */}
            <Card className="border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Orders by Type</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {MOCK_COUNTS_BY_TYPE.map((t) => (
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

            {/* Status breakdown */}
            <Card className="border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Status Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[180px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={MOCK_STATUS_BREAKDOWN}
                        dataKey="count"
                        nameKey="status"
                        cx="50%"
                        cy="50%"
                        outerRadius={60}
                        label={({ status, count }) => `${status}: ${count}`}
                      >
                        {MOCK_STATUS_BREAKDOWN.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Order value totals & Factory breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Order Value (This Month)</CardTitle>
                <CardDescription>Pending vs completed</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Pending</span>
                    <span className="font-semibold">{formatCurrency(PendingValueThisMonth)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Completed</span>
                    <span className="font-semibold text-green-600 dark:text-green-500">
                      {formatCurrency(CompletedValueThisMonth)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Factory Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
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
                          <span className="text-sm font-medium">{formatCurrency(f.pendingValue)}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Orders over time chart */}
          <Card className="border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Orders Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={MOCK_ORDERS_OVER_TIME}>
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="hsl(var(--brand-primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Recent activity */}
          <Card className="border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Recent Activity</CardTitle>
              <CardDescription>Latest orders across all types</CardDescription>
            </CardHeader>
            <CardContent>
              {filteredRecentOrders.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">No orders match your filters.</p>
              ) : (
                <div className="space-y-3">
                  {filteredRecentOrders.map((o) => (() => {
                    const typeConfig = ORDER_TYPES.find((t) => t.id === o.type);
                    const Icon = typeConfig?.icon ?? ShoppingCart;
                    return (
                      <Link
                        key={o.id}
                        to={getOrderTypePath(o.type)}
                        className="flex items-center justify-between py-3 px-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                          <div>
                            <p className="font-medium">{o.ref}</p>
                            <p className="text-sm text-muted-foreground">
                              {o.date} · {o.status}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {o.amount > 0 && (
                            <span className="font-medium">{formatCurrency(o.amount)}</span>
                          )}
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </Link>
                    );
                  })())}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default OrdersOverviewPage;
