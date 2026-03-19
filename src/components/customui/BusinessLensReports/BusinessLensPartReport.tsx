// src/pages/businesslens/BusinessLensPartReport.tsx
import React, { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { format, parseISO } from "date-fns";
import { CalendarIcon } from "lucide-react";

import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { getOrdersByPartIDAndDateRange } from "@/services/OrderedPartsService";
import { fetchPartByID } from "@/services/PartsService";
import { OrderedPart, Part } from "@/types";
import { useReactToPrint } from "react-to-print";
import { Separator } from "@/components/ui/separator";
import { convertUtcToBDTime } from "@/services/helper";
import NavigationBar from "@/components/customui/NavigationBar";

type BusinessLensPartReportProps = { partId: string; start?: string; end?: string };

interface ExpenseReportOrderData {
  purchase_date: string;
  vendor: string;
  brand: string;
  qty: number;
  unit_cost: number;
  sub_total: number;
}

interface PartExpenseReportGeneralData {
  part_id: number;
  part_name: string;
  average_unit_cost: number; // number (weighted)
  highest_unit_cost: number;
  lowest_unit_cost: number;
  total_expense: number;
  date_range: string;
  num_of_orders: number;
  orders: ExpenseReportOrderData[];
}

const BusinessLensPartReport: React.FC<BusinessLensPartReportProps> = ({ partId, start, end }) => {
    const [startDate, setStartDate] = useState<Date | undefined>(start ? parseISO(start) : undefined);
    const [endDate, setEndDate] = useState<Date | undefined>(end ? parseISO(end) : undefined);
    const [reportData, setReportData] = useState<PartExpenseReportGeneralData | null>(null);
    const [reportDataLoading, setReportDataLoading] = useState<boolean>(false);
    const exportRef = useRef<HTMLDivElement>(null);

    const printPdf = useReactToPrint({
    contentRef: exportRef,
    documentTitle: `BusinessLens - ${reportData?.part_name ?? ""} - ${reportData?.date_range ?? ""}`,
    });


    const handlePrint: React.MouseEventHandler<HTMLButtonElement> = () => {
            printPdf();
    };


    const formatMoney = (n: number) =>
        n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const generateReport = async () => {
        if (!startDate) return toast.error("Please select a start date");
        if (!endDate) return toast.error("Please select an end date");
        if (startDate > endDate) return toast.error("Start date needs to be less than end date");
        if (!partId || isNaN(Number(partId))) return toast.error("Invalid partId");

    const pid = Number(partId);
    setReportDataLoading(true);
    try {
      const orders: OrderedPart[] = await getOrdersByPartIDAndDateRange(pid, startDate, endDate);
      const part_info: Part = await fetchPartByID(pid);

      let total_expense = 0;
      let total_qty = 0;
      let highest = Number.NEGATIVE_INFINITY;
      let lowest = Number.POSITIVE_INFINITY;

      const rows: ExpenseReportOrderData[] = [];
      orders.forEach((op) => {
        const qty = op.qty ?? 0;
        const cost = op.unit_cost ?? 0;
        const subtotal = qty * cost;

        total_expense += subtotal;
        total_qty += qty;
        highest = Math.max(highest, cost);
        lowest = Math.min(lowest, cost);

        rows.push({
          purchase_date: op.part_purchased_date
            ? convertUtcToBDTime(op.part_purchased_date).split(",")[0]
            : "-",
          vendor: op.vendor ?? "-",
          brand: op.brand ?? "-",
          qty,
          unit_cost: cost,
          sub_total: subtotal,
        });
      });

      // Sort by date desc (unknown dates last)
      rows.sort((a, b) => {
        const da = a.purchase_date === "-" ? 0 : Date.parse(a.purchase_date);
        const db = b.purchase_date === "-" ? 0 : Date.parse(b.purchase_date);
        return db - da;
      });

      const weightedAvg = total_qty > 0 ? total_expense / total_qty : 0;
      const safeHighest = isFinite(highest) ? highest : 0;
      const safeLowest = isFinite(lowest) ? lowest : 0;

      const data: PartExpenseReportGeneralData = {
        part_id: pid,
        part_name: part_info.name,
        average_unit_cost: Number(weightedAvg.toFixed(2)),
        highest_unit_cost: Number(safeHighest.toFixed(2)),
        lowest_unit_cost: Number(safeLowest.toFixed(2)),
        total_expense: Number(total_expense.toFixed(2)),
        date_range: `${startDate.toDateString()} - ${endDate.toDateString()}`,
        num_of_orders: orders.length,
        orders: rows,
      };

      setReportData(data);
      toast.success("Report generated successfully!");
    } catch (error) {
      toast.error("Failed to load orders");
    } finally {
      setReportDataLoading(false);
    }
  };

  // Auto-run if all query params are present
  useEffect(() => {
    if (partId && startDate && endDate) generateReport();
  }, [partId, startDate, endDate]);

  return (
    <>
      <NavigationBar />
      <div className="container py-6">
        <Card>
          <CardHeader>
            <CardTitle>
              <h1 className="text-4xl font-bold mb-3 text-cyan-600">BusinessLens</h1>
            </CardTitle>
            <div>Get instant insights on costs, orders, and spending patterns.</div>
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
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !startDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate ? format(startDate, "PPP") : <span>Pick the start date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" onClick={(e) => e.stopPropagation()}>
                      <Calendar
                        mode="single"
                        selected={startDate}
                        defaultMonth={startDate}
                        onSelect={setStartDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="flex items-center mx-2">-</div>
                <div>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !endDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endDate ? format(endDate, "PPP") : <span>Pick the end date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" onClick={(e) => e.stopPropagation()}>
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={setEndDate}
                        defaultMonth={endDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  disabled={!startDate || !endDate}
                  className="bg-cyan-600"
                  onClick={generateReport}
                >
                  generate report
                </Button>
                <Button disabled={!reportData} onClick={handlePrint}>
                Print
                </Button>
                <Button
                  disabled={!reportData}
                  className="bg-red-600"
                  onClick={() => {
                    setStartDate(undefined);
                    setEndDate(undefined);
                    setReportData(null);
                  }}
                >
                  Reset range
                </Button>

                <Link to={`/viewpart/${partId}`}>
                  <Button>Back</Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        <Separator className="my-4" />

        {reportDataLoading ? (
          <div className="flex justify-center items-center mt-4">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-green-500 border-solid"></div>
          </div>
        ) : (
          reportData && (
            <div className="p-4" ref={exportRef}>
              <div className="text-4xl mb-3 text-cyan-600">BusinessLens on Parts</div>
              <Separator className="mb-6" />
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-y-6">
                  <div>
                    <p className="text-sm text-muted-foreground">Date Range</p>
                    <p className="font-medium">{reportData.date_range}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Part ID</p>
                    <p className="font-medium">{reportData.part_id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Part Name</p>
                    <p className="font-medium">{reportData.part_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Avg. Unit Cost (Weighted)</p>
                    <p className="font-medium">${formatMoney(reportData.average_unit_cost)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Highest Unit Cost</p>
                    <p className="font-medium">${formatMoney(reportData.highest_unit_cost)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Lowest Unit Cost</p>
                    <p className="font-medium">${formatMoney(reportData.lowest_unit_cost)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Expense</p>
                    <p className="font-medium text-lg">${formatMoney(reportData.total_expense)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Number of Orders</p>
                    <p className="font-medium">{reportData.num_of_orders}</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium mb-2">Order History</h3>
                  <div className="border rounded-md overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Vendor
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Brand
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Quantity
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Unit Cost
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Subtotal
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {reportData.orders.map((t, i) => (
                          <tr key={i}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">{t.purchase_date}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">{t.vendor}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">{t.brand}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">{t.qty}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              {formatMoney(t.unit_cost)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              ${formatMoney(t.sub_total)}
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
    </>
  );
};

export default BusinessLensPartReport;
