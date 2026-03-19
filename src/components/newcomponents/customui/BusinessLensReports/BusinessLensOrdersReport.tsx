import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { useReactToPrint } from 'react-to-print';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from 'recharts';
import DashboardNavbar, { SIDEBAR_COLLAPSED_KEY } from '@/components/newcomponents/customui/DashboardNavbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, BarChart3, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

type BusinessLensOrdersReportProps = {
  start?: string;
  end?: string;
};

const PIE_COLORS = [
  '#9067c6',
  '#8d86c9',
  '#7c6bb8',
  '#6b5aa7',
  '#5a4996',
  '#493885',
  '#382774',
  '#271663',
  '#160552',
  '#050441',
];

// Placeholder data when Orders API not implemented
const PLACEHOLDER_TYPE_COUNTS = [
  { label: 'PFM', total: 12 },
  { label: 'PFS', total: 8 },
  { label: 'PFP', total: 5 },
];
const PLACEHOLDER_EXPENSE_BY_FACTORY = [
  { id: 1, label: 'Factory A (FA)', total: 45000 },
  { id: 2, label: 'Factory B (FB)', total: 32000 },
  { id: 3, label: 'Factory C (FC)', total: 18000 },
];
const PLACEHOLDER_TOTAL_ORDERS = 25;
const PLACEHOLDER_OPEN = 5;
const PLACEHOLDER_COMPLETED = 20;
const PLACEHOLDER_PURCHASE_TOTAL = 95000;

const BusinessLensOrdersReport: React.FC<BusinessLensOrdersReportProps> = ({ start, end }) => {
  const [isNavCollapsed, setIsNavCollapsed] = useState(() =>
    localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true'
  );
  const [startDate, setStartDate] = useState<Date | undefined>(start ? parseISO(start) : undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(end ? parseISO(end) : undefined);
  const [loading, setLoading] = useState(false);
  const [hasData, setHasData] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);
  const didAutoRun = useRef(false);

  const typeCounts = PLACEHOLDER_TYPE_COUNTS;
  const expenseByFactory = PLACEHOLDER_EXPENSE_BY_FACTORY;
  const totalOrdersCount = PLACEHOLDER_TOTAL_ORDERS;
  const openCount = PLACEHOLDER_OPEN;
  const completedCount = PLACEHOLDER_COMPLETED;
  const purchaseExpenseTotal = PLACEHOLDER_PURCHASE_TOTAL;

  const printPdf = useReactToPrint({
    contentRef: exportRef,
    documentTitle: `BusinessLens - Orders - ${startDate?.toDateString() ?? ''} - ${endDate?.toDateString() ?? ''}`,
  });

  const formatMoney = (n: number) =>
    Number.isFinite(n)
      ? n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : '0.00';

  const generateReport = async () => {
    if (!startDate) return toast.error('Please select a start date');
    if (!endDate) return toast.error('Please select an end date');
    if (startDate > endDate) return toast.error('Start date must be before end date');

    setLoading(true);
    try {
      // Placeholder: simulate API call
      await new Promise((r) => setTimeout(r, 500));
      setHasData(true);
      toast.success('Report generated successfully!');
    } catch {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const resetReport = () => {
    setStartDate(undefined);
    setEndDate(undefined);
    setHasData(false);
  };

  useEffect(() => {
    if (didAutoRun.current) return;
    if (startDate && endDate) {
      didAutoRun.current = true;
      generateReport();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate]);

  const pieData = typeCounts
    .slice()
    .sort((a, b) => b.total - a.total)
    .map((t) => ({ name: t.label, value: t.total }));

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardNavbar onCollapsedChange={setIsNavCollapsed} />
      <div className={`flex-1 transition-all duration-300 ${isNavCollapsed ? 'ml-20' : 'ml-64'}`}>
        <div className="bg-card dark:bg-[hsl(var(--nav-background))] border-b border-border px-8 py-5 sticky top-0 z-10 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-primary/10 dark:bg-brand-primary/20 rounded-lg flex items-center justify-center">
              <BarChart3 className="h-5 w-5 text-brand-primary" />
            </div>
            <h1 className="text-2xl font-bold text-card-foreground dark:text-foreground">
              BusinessLens — Orders
            </h1>
          </div>
        </div>

        <div className="p-8">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Orders report</CardTitle>
              <p className="text-sm text-muted-foreground">
                Get instant insights on orders and spending patterns.
              </p>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between mb-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm text-muted-foreground">Date range:</span>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'justify-start text-left font-normal border-input',
                          !startDate && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate ? format(startDate, 'PPP') : 'Pick start date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-card border-border">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        defaultMonth={startDate}
                        onSelect={setStartDate}
                      />
                    </PopoverContent>
                  </Popover>
                  <span className="text-muted-foreground">–</span>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'justify-start text-left font-normal border-input',
                          !endDate && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endDate ? format(endDate, 'PPP') : 'Pick end date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-card border-border">
                      <Calendar
                        mode="single"
                        selected={endDate}
                        defaultMonth={endDate}
                        onSelect={setEndDate}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    disabled={!startDate || !endDate}
                    className="bg-brand-primary hover:bg-brand-primary-hover"
                    onClick={generateReport}
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Generate report
                  </Button>
                  <Button
                    disabled={!hasData}
                    variant="outline"
                    onClick={() => printPdf()}
                    className="border-border"
                  >
                    Print
                  </Button>
                  <Button
                    variant="outline"
                    className="text-destructive hover:bg-destructive/10"
                    onClick={resetReport}
                  >
                    Reset
                  </Button>
                  <Link to="/businesslens">
                    <Button variant="outline" className="border-border">Back</Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>

          <Separator className="my-6" />

          {loading ? (
            <div className="flex justify-center items-center py-16">
              <Loader2 className="h-12 w-12 animate-spin text-brand-primary" />
            </div>
          ) : (
            hasData && (
              <div className="p-4" ref={exportRef}>
                <div className="text-2xl font-bold mb-4 text-brand-primary">
                  BusinessLens on Orders
                </div>
                <Separator className="mb-6" />

                <div className="space-y-6">
                  <div>
                    <p className="text-sm text-muted-foreground">Date range</p>
                    <p className="font-medium text-foreground">
                      {startDate?.toDateString()} – {endDate?.toDateString()}
                    </p>
                  </div>
                  <div className="grid grid-cols-3 gap-6">
                    <div>
                      <p className="text-sm text-muted-foreground">Total orders</p>
                      <p className="font-medium text-foreground">{totalOrdersCount}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Open</p>
                      <p className="font-medium text-foreground">{openCount}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Completed</p>
                      <p className="font-medium text-foreground">{completedCount}</p>
                    </div>
                  </div>

                  <Card className="bg-card border-border">
                    <CardHeader>
                      <CardTitle className="text-base text-foreground">Orders by type</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-col lg:flex-row gap-6">
                        <div className="flex-1" style={{ height: 320 }}>
                          {pieData.length === 0 ? (
                            <div className="text-sm text-muted-foreground">No data for this range.</div>
                          ) : (
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={pieData}
                                  dataKey="value"
                                  nameKey="name"
                                  outerRadius={130}
                                  label
                                >
                                  {pieData.map((_, idx) => (
                                    <Cell
                                      key={idx}
                                      fill={PIE_COLORS[idx % PIE_COLORS.length]}
                                    />
                                  ))}
                                </Pie>
                                <Tooltip />
                              </PieChart>
                            </ResponsiveContainer>
                          )}
                        </div>
                        <div className="border border-border rounded-lg p-4 bg-muted/30 max-h-72 overflow-auto min-w-[180px]">
                          <div className="text-xs font-medium mb-2 text-muted-foreground">Legend</div>
                          <ul className="space-y-2">
                            {pieData.map((it, i) => (
                              <li
                                key={i}
                                className="flex items-center justify-between text-sm"
                              >
                                <div className="flex items-center gap-2">
                                  <span
                                    className="inline-block w-3 h-3 rounded-sm"
                                    style={{
                                      background: PIE_COLORS[i % PIE_COLORS.length],
                                    }}
                                  />
                                  <span className="text-foreground">{it.name}</span>
                                </div>
                                <span className="tabular-nums text-foreground">{it.value}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-card border-border">
                    <CardHeader>
                      <CardTitle className="text-base text-foreground">
                        Total purchase expense (parts)
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-semibold text-foreground">
                        ${formatMoney(purchaseExpenseTotal)}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-card border-border">
                    <CardHeader>
                      <CardTitle className="text-base text-foreground">
                        Expense by factory
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {expenseByFactory.length === 0 ? (
                        <div className="text-sm text-muted-foreground">
                          No purchase expense in this range.
                        </div>
                      ) : (
                        <div className="border border-border rounded-lg overflow-x-auto">
                          <table className="min-w-full">
                            <thead className="bg-muted">
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                                  Factory
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase">
                                  Expense
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                              {expenseByFactory.map((r) => (
                                <tr key={r.id} className="hover:bg-muted/50">
                                  <td className="px-6 py-3 text-sm text-foreground">{r.label}</td>
                                  <td className="px-6 py-3 text-sm text-right text-foreground">
                                    ${formatMoney(r.total)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default BusinessLensOrdersReport;
