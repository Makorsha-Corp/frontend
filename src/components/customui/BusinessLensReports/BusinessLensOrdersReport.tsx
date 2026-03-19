// src/pages/businesslens/BusinessLensOrdersReport.tsx
import React, { useEffect, useRef, useState } from "react";
import NavigationBar from "@/components/customui/NavigationBar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import toast from "react-hot-toast";
import { useReactToPrint } from "react-to-print";
import { Link } from "react-router-dom";

// Services
import {
  getOrdersByDateRange,
  getOrdersTotalInRange,
  getOrdersTypeCountsClient,
  getOpenClosedCountsSmart,
} from "@/services/OrdersService";
import { fetchOrderedPartsForBusinessLensByOrderIds } from "@/services/OrderedPartsService";
import type { OrdersTypeCount } from "@/types";

// Charts
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";

type Props = { start?: string; end?: string };

const PIE_COLORS = [
  "#1f77b4",
  "#ff7f0e",
  "#2ca02c",
  "#d62728",
  "#9467bd",
  "#8c564b",
  "#e377c2",
  "#7f7f7f",
  "#bcbd22",
  "#17becf",
];

const PURCHASE_TYPES = new Set(["PFM", "PFP", "PFS"]);

type OrderRow = {
  id: number;
  order_date: string;
  vendor: string; // factory name
  status: string;
  total: number;
};

const BusinessLensOrdersReport: React.FC<Props> = ({ start, end }) => {
  const [startDate, setStartDate] = useState<Date | undefined>(start ? parseISO(start) : undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(end ? parseISO(end) : undefined);

  const [rows, setRows] = useState<OrderRow[]>([]);
  const [totalOrdersCount, setTotalOrdersCount] = useState<number>(0);
  const [typeCounts, setTypeCounts] = useState<OrdersTypeCount[]>([]);
  const [openCount, setOpenCount] = useState<number>(0);
  const [completedCount, setCompletedCount] = useState<number>(0);

  // Expense profiling (purchase-only)
  const [purchaseExpenseTotal, setPurchaseExpenseTotal] = useState<number>(0);
  const [expenseByFactory, setExpenseByFactory] = useState<Array<{ id: number; label: string; total: number }>>([]);

  const [loading, setLoading] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  const printPdf = useReactToPrint({
    contentRef: exportRef,
    documentTitle: `BusinessLens - Orders - ${startDate?.toDateString() ?? ""} - ${endDate?.toDateString() ?? ""}`,
  });

  const handlePrint: React.MouseEventHandler<HTMLButtonElement> = () => printPdf();

  const formatMoney = (n: number) =>
    Number.isFinite(n)
      ? n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : "0.00";

  const generateReport = async () => {
    if (!startDate) return toast.error("Please select a start date");
    if (!endDate) return toast.error("Please select an end date");
    if (startDate > endDate) return toast.error("Start date needs to be less than end date");

    setLoading(true);
    try {
      // Orders & headline stats (+ open/closed)
      const [orders, count, typeBuckets, oc] = await Promise.all([
        getOrdersByDateRange(startDate, endDate),
        getOrdersTotalInRange(startDate, endDate),
        getOrdersTypeCountsClient(startDate, endDate),
        getOpenClosedCountsSmart(startDate, endDate),
      ]);

      // Table rows (we're not rendering this table now, but keeping data if needed later)
      const mapped: OrderRow[] = (orders as any[]).map((o) => ({
        id: o.id,
        order_date: o.created_at ? new Date(o.created_at).toLocaleDateString() : "-",
        vendor: o.factories?.name ?? "-",
        status: o.statuses?.name ?? "-",
        total: Number((o as any).total_amount ?? 0),
      }));
      mapped.sort((a, b) => {
        const da = a.order_date === "-" ? 0 : Date.parse(a.order_date);
        const db = b.order_date === "-" ? 0 : Date.parse(b.order_date);
        return db - da;
      });

      setRows(mapped);
      setTotalOrdersCount(count);
      setTypeCounts(typeBuckets);
      setOpenCount(oc.open);
      setCompletedCount(oc.completed);

      // Purchase-only expense profiling (NO unassigned)
      const purchaseOrders = (orders as any[]).filter((o) =>
        PURCHASE_TYPES.has(String(o.order_type ?? "").toUpperCase())
      );
      const orderIds = purchaseOrders.map((o) => o.id);

      // If your service supports date filters, call:
      // const parts = await fetchOrderedPartsForBusinessLensByOrderIds(orderIds, startDate, endDate);
      const parts = await fetchOrderedPartsForBusinessLensByOrderIds(orderIds);

      const orderById = new Map<number, any>(purchaseOrders.map((o) => [o.id, o]));
      let grandTotal = 0;
      const byFactory = new Map<number, { label: string; total: number }>();

      for (const p of parts) {
        const o = orderById.get(p.order_id);
        if (!o) continue;

        const qty = Number(p.qty ?? 0);
        const cost = Number(p.unit_cost ?? 0);
        const sub = qty * cost;
        if (sub <= 0) continue;

        grandTotal += sub;

        if (o.factory_id != null) {
          const fid: number = o.factory_id;
          const flabel =
            (o.factories?.abbreviation
              ? `${o.factories.abbreviation} - ${o.factories?.name ?? ""}`
              : o.factories?.name) ?? `Factory #${fid}`;
          const cur = byFactory.get(fid) ?? { label: flabel, total: 0 };
          cur.total += sub;
          byFactory.set(fid, cur);
        }
      }

      setPurchaseExpenseTotal(grandTotal);

      const factoryArr = Array.from(byFactory.entries())
        .map(([id, v]) => ({ id, label: v.label, total: v.total }))
        .sort((a, b) => b.total - a.total);

      setExpenseByFactory(factoryArr);

      toast.success("Report generated successfully!");
    } catch (e) {
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  // Auto-run if all query params are present
  const didAutoRun = useRef(false);
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
    <>
      <NavigationBar />
      <div className="container py-6">
        <Card>
          <CardHeader>
            <CardTitle>
              <h1 className="text-4xl font-bold mb-3 text-cyan-600">BusinessLens</h1>
            </CardTitle>
            <div>Get instant insights on orders and spending patterns.</div>
          </CardHeader>
          <CardContent>
            <div className="flex lg:flex-row flex-col gap-2 items-center mb-2 justify-between">
              <div className="flex">
                <div className="text-sm flex items-center mr-2">Date range:</div>
                <div>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn("w-full justify-start text-left font-normal", !startDate && "text-muted-foreground")}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate ? format(startDate, "PPP") : <span>Pick the start date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" onClick={(e) => e.stopPropagation()}>
                      <Calendar mode="single" selected={startDate} defaultMonth={startDate} onSelect={setStartDate} initialFocus />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="flex items-center mx-2">-</div>
                <div>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn("w-full justify-start text-left font-normal", !endDate && "text-muted-foreground")}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endDate ? format(endDate, "PPP") : <span>Pick the end date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" onClick={(e) => e.stopPropagation()}>
                      <Calendar mode="single" selected={endDate} onSelect={setEndDate} defaultMonth={endDate} initialFocus />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="flex gap-2">
                <Button disabled={!startDate || !endDate} className="bg-cyan-600" onClick={generateReport}>
                  generate report
                </Button>
                <Button disabled={totalOrdersCount === 0 && purchaseExpenseTotal === 0} onClick={handlePrint}>
                  Print
                </Button>
                <Button
                  disabled={totalOrdersCount === 0 && purchaseExpenseTotal === 0 && !startDate && !endDate}
                  className="bg-red-600"
                  onClick={() => {
                    setStartDate(undefined);
                    setEndDate(undefined);
                    setRows([]);
                    setTotalOrdersCount(0);
                    setTypeCounts([]);
                    setPurchaseExpenseTotal(0);
                    setExpenseByFactory([]);
                    setOpenCount(0);
                    setCompletedCount(0);
                  }}
                >
                  Reset range
                </Button>

                <Link to="/businesslens">
                  <Button>Back</Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        <Separator className="my-4" />

        {loading ? (
          <div className="flex justify-center items-center mt-4">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-green-500 border-solid" />
          </div>
        ) : (
          (totalOrdersCount > 0 || purchaseExpenseTotal > 0) && (
            <div className="p-4" ref={exportRef}>
              <div className="text-4xl mb-3 text-cyan-600">BusinessLens on Orders</div>
              <Separator className="mb-6" />

              {/* SECTION 1: Orders overview (counts + pie) */}
              <div className="space-y-4 mb-6">
                    <div>
                        <p className="text-sm text-muted-foreground">Date Range</p>
                        <p className="font-medium">
                        {startDate?.toDateString()} - {endDate?.toDateString()}
                        </p>
                    </div>
                <div className="grid grid-cols-3 gap-y-6">
  
                  <div>
                    <p className="text-sm text-muted-foreground">Total Orders</p>
                    <p className="font-medium">{totalOrdersCount}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Open</p>
                    <p className="font-medium">{openCount}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Completed</p>
                    <p className="font-medium">{completedCount}</p>
                  </div>
                </div>

                <div>
                  {/* Chart card */}
                  <Card>
                        <CardHeader>
                        <CardTitle className="text-base">Orders by Type</CardTitle>
                        </CardHeader>            
                    <CardContent style={{ height: 320 }}>
                      <div className="flex justify-between">
                        
                      </div>
                      {pieData.length === 0 ? (
                        <div className="text-sm text-muted-foreground">No data for this range.</div>
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={130} label>
                              {pieData.map((_, idx) => (
                                <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      )}
                    
                    </CardContent>
                        <div className="border rounded-md p-3 bg-white max-h-72 overflow-auto">
                            <div className="text-xs font-medium mb-2">Legend</div>
                            <ul className="space-y-2 pr-1">
                                {pieData.map((it, i) => (
                                <li key={i} className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2">
                                    <span
                                        className="inline-block w-3 h-3 rounded-sm"
                                        style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
                                    />
                                    <span className="whitespace-nowrap">{it.name}</span>
                                    </div>
                                    <span className="tabular-nums">{it.value}</span>
                                </li>
                                ))}
                            </ul>
                        </div>
                  </Card>

                </div>
              </div>

              {/* SECTION 2: Total cost (large, centered) */}
              <Card className="w-full mb-6">
                <CardHeader>
                  <CardTitle className="text-base">Total Purchase Expense (Parts)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-semibold">
                    ${formatMoney(purchaseExpenseTotal)}
                  </div>
                </CardContent>
              </Card>

              {/* SECTION 3: Breakdown (by Factory) */}
              <Card className="w-full mb-6">
                <CardHeader>
                  <CardTitle className="text-base">Expense by Factory</CardTitle>
                </CardHeader>
                <CardContent>
                  {expenseByFactory.length === 0 ? (
                    <div className="text-sm text-muted-foreground">No purchase expense in this range.</div>
                  ) : (
                    <div className="border rounded-md overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Factory
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Expense
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {expenseByFactory.map((r) => (
                            <tr key={r.id}>
                              <td className="px-6 py-3 text-sm">{r.label}</td>
                              <td className="px-6 py-3 text-sm text-right">${formatMoney(r.total)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )
        )}
      </div>
    </>
  );
};

export default BusinessLensOrdersReport;
