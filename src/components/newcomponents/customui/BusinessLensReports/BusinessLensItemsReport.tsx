import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { useReactToPrint } from 'react-to-print';
import DashboardNavbar, { SIDEBAR_COLLAPSED_KEY } from '@/components/newcomponents/customui/DashboardNavbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useGetItemByIdQuery } from '@/features/items/itemsApi';
import { CalendarIcon, BarChart3, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

type BusinessLensItemsReportProps = {
  itemId: string;
  start?: string;
  end?: string;
};

interface OrderRow {
  purchase_date: string;
  vendor: string;
  brand: string;
  qty: number;
  unit_cost: number;
  sub_total: number;
}

interface ItemsReportData {
  item_id: number;
  item_name: string;
  average_unit_cost: number;
  highest_unit_cost: number;
  lowest_unit_cost: number;
  total_expense: number;
  date_range: string;
  num_of_orders: number;
  orders: OrderRow[];
}

// Placeholder order data when no API available
const PLACEHOLDER_ORDERS: OrderRow[] = [
  { purchase_date: '2025-01-15', vendor: 'Vendor A', brand: 'Brand X', qty: 50, unit_cost: 12.5, sub_total: 625 },
  { purchase_date: '2025-01-20', vendor: 'Vendor B', brand: 'Brand Y', qty: 30, unit_cost: 14.0, sub_total: 420 },
  { purchase_date: '2025-02-01', vendor: 'Vendor A', brand: 'Brand X', qty: 25, unit_cost: 12.0, sub_total: 300 },
];

const BusinessLensItemsReport: React.FC<BusinessLensItemsReportProps> = ({
  itemId,
  start,
  end,
}) => {
  const [isNavCollapsed, setIsNavCollapsed] = useState(() =>
    localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true'
  );
  const [startDate, setStartDate] = useState<Date | undefined>(start ? parseISO(start) : undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(end ? parseISO(end) : undefined);
  const [reportData, setReportData] = useState<ItemsReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  const { data: item, isLoading: loadingItem } = useGetItemByIdQuery(Number(itemId), {
    skip: !itemId || isNaN(Number(itemId)),
  });

  const printPdf = useReactToPrint({
    contentRef: exportRef,
    documentTitle: `BusinessLens - ${reportData?.item_name ?? ''} - ${reportData?.date_range ?? ''}`,
  });

  const formatMoney = (n: number) =>
    n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const generateReport = async () => {
    if (!startDate) return toast.error('Please select a start date');
    if (!endDate) return toast.error('Please select an end date');
    if (startDate > endDate) return toast.error('Start date must be before end date');
    if (!itemId || isNaN(Number(itemId))) return toast.error('Please select an item');

    setLoading(true);
    try {
      // Use placeholder order data (API not implemented)
      const orders = PLACEHOLDER_ORDERS;
      let total_expense = 0;
      let total_qty = 0;
      let highest = Number.NEGATIVE_INFINITY;
      let lowest = Number.POSITIVE_INFINITY;

      orders.forEach((op) => {
        total_expense += op.sub_total;
        total_qty += op.qty;
        highest = Math.max(highest, op.unit_cost);
        lowest = Math.min(lowest, op.unit_cost);
      });

      const weightedAvg = total_qty > 0 ? total_expense / total_qty : 0;

      setReportData({
        item_id: Number(itemId),
        item_name: item?.name ?? `Item #${itemId}`,
        average_unit_cost: Number(weightedAvg.toFixed(2)),
        highest_unit_cost: Number((isFinite(highest) ? highest : 0).toFixed(2)),
        lowest_unit_cost: Number((isFinite(lowest) ? lowest : 0).toFixed(2)),
        total_expense: Number(total_expense.toFixed(2)),
        date_range: `${startDate.toDateString()} - ${endDate.toDateString()}`,
        num_of_orders: orders.length,
        orders,
      });
      toast.success('Report generated successfully!');
    } catch {
      toast.error('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (itemId && startDate && endDate) {
      generateReport();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemId, startDate, endDate, item?.name]);

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
              BusinessLens — Items
            </h1>
          </div>
        </div>

        <div className="p-8">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Item expense report</CardTitle>
              <p className="text-sm text-muted-foreground">
                Get instant insights on costs, orders, and spending patterns.
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
                    disabled={!startDate || !endDate || loadingItem}
                    className="bg-brand-primary hover:bg-brand-primary-hover"
                    onClick={generateReport}
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Generate report
                  </Button>
                  <Button disabled={!reportData} variant="outline" onClick={() => printPdf()}>
                    Print
                  </Button>
                  <Button
                    disabled={!reportData}
                    variant="outline"
                    className="text-destructive hover:bg-destructive/10"
                    onClick={() => {
                      setStartDate(undefined);
                      setEndDate(undefined);
                      setReportData(null);
                    }}
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
            reportData && (
              <div className="p-4" ref={exportRef}>
                <div className="text-2xl font-bold mb-4 text-brand-primary">
                  BusinessLens on Items
                </div>
                <Separator className="mb-6" />
                <div className="space-y-6">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                    <div>
                      <p className="text-sm text-muted-foreground">Date range</p>
                      <p className="font-medium text-foreground">{reportData.date_range}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Item ID</p>
                      <p className="font-medium text-foreground">{reportData.item_id}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Item name</p>
                      <p className="font-medium text-foreground">{reportData.item_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Avg. unit cost (weighted)</p>
                      <p className="font-medium text-foreground">
                        ${formatMoney(reportData.average_unit_cost)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Highest unit cost</p>
                      <p className="font-medium text-foreground">
                        ${formatMoney(reportData.highest_unit_cost)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Lowest unit cost</p>
                      <p className="font-medium text-foreground">
                        ${formatMoney(reportData.lowest_unit_cost)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total expense</p>
                      <p className="font-medium text-lg text-foreground">
                        ${formatMoney(reportData.total_expense)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Number of orders</p>
                      <p className="font-medium text-foreground">{reportData.num_of_orders}</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium mb-2 text-foreground">Order history</h3>
                    <div className="border border-border rounded-lg overflow-x-auto">
                      <table className="min-w-full">
                        <thead className="bg-muted">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                              Date
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                              Vendor
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                              Brand
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                              Qty
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                              Unit cost
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                              Subtotal
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {reportData.orders.map((row, i) => (
                            <tr key={i} className="hover:bg-muted/50">
                              <td className="px-6 py-4 text-sm text-foreground">{row.purchase_date}</td>
                              <td className="px-6 py-4 text-sm text-foreground">{row.vendor}</td>
                              <td className="px-6 py-4 text-sm text-foreground">{row.brand}</td>
                              <td className="px-6 py-4 text-sm text-foreground">{row.qty}</td>
                              <td className="px-6 py-4 text-sm text-foreground">
                                {formatMoney(row.unit_cost)}
                              </td>
                              <td className="px-6 py-4 text-sm text-foreground">
                                ${formatMoney(row.sub_total)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default BusinessLensItemsReport;
