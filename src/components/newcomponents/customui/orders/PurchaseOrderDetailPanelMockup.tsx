import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ArrowLeft,
  Trash2,
  Building2,
  Calendar,
  Package,
  Truck,
  FileText,
  StickyNote,
  Plus,
  CheckCircle2,
  Edit3,
  Lock,
  Unlock,
  History,
  UserCircle,
  AlertCircle,
  CheckCircle,
  Clock,
} from 'lucide-react';
import OrderStatusStepper, { type OrderStatusStep } from './OrderStatusStepper';

const MOCK_STEPS: OrderStatusStep[] = [
  { id: 1, label: 'Draft', shortLabel: 'Draft' },
  { id: 2, label: 'Quotation Requested', shortLabel: 'Quote' },
  { id: 3, label: 'Budget Approved', shortLabel: 'Budget' },
  { id: 4, label: 'Order Placed', shortLabel: 'Ordered' },
  { id: 5, label: 'Goods Received', shortLabel: 'Received' },
  { id: 6, label: 'Completed', shortLabel: 'Complete' },
];

const MOCK_ITEMS = [
  {
    id: 1,
    lineNumber: 1,
    name: 'Industrial Bearings 6205-2RS',
    ordered: 10,
    received: 6,
    unit: 'pcs',
    unitPrice: 12.5,
  },
  {
    id: 2,
    lineNumber: 2,
    name: 'Hydraulic Oil ISO 46',
    ordered: 20,
    received: 20,
    unit: 'L',
    unitPrice: 8.75,
  },
  {
    id: 3,
    lineNumber: 3,
    name: 'V-Belt A68',
    ordered: 5,
    received: 0,
    unit: 'pcs',
    unitPrice: 24.0,
  },
];

const PurchaseOrderDetailPanelMockup: React.FC = () => {
  const currentStepId = 3;
  const totalOrdered = MOCK_ITEMS.reduce((sum, i) => sum + i.ordered, 0);
  const totalReceived = MOCK_ITEMS.reduce((sum, i) => sum + i.received, 0);
  const receivedPct = Math.round((totalReceived / totalOrdered) * 100);
  const subtotal = MOCK_ITEMS.reduce(
    (sum, i) => sum + i.ordered * i.unitPrice,
    0
  );

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(v);

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden bg-background">
      {/* Header */}
      <div className="shrink-0 border-b border-border bg-card px-6 py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <Button variant="ghost" size="icon" className="mt-0.5 h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back</span>
            </Button>
            <div>
              <h1 className="text-xl font-semibold text-card-foreground">
                PO-2026-002
              </h1>
              <p className="text-sm text-muted-foreground">
                Guy who buys everything
              </p>
            </div>
          </div>

          {/* Approvals */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Approved by</span>
              <div className="flex -space-x-2">
                <div
                  className="h-7 w-7 rounded-full bg-brand-primary flex items-center justify-center text-white text-xs font-semibold ring-2 ring-card"
                  title="John Doe"
                >
                  JD
                </div>
                <div
                  className="h-7 w-7 rounded-full bg-green-600 flex items-center justify-center text-white text-xs font-semibold ring-2 ring-card"
                  title="Sarah Smith"
                >
                  SS
                </div>
                <div
                  className="h-7 w-7 rounded-full bg-amber-600 flex items-center justify-center text-white text-xs font-semibold ring-2 ring-card"
                  title="Mike Chen"
                >
                  MC
                </div>
              </div>
              <span className="text-xs text-muted-foreground">3 users</span>
            </div>

            <div className="h-6 w-px bg-border" />

            <Button
              variant="outline"
              size="sm"
              className="text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>
          </div>
        </div>
      </div>

      {/* Status Stepper */}
      <div className="shrink-0 border-b border-border bg-card/50 px-6 py-4">
        <OrderStatusStepper steps={MOCK_STEPS} currentStepId={currentStepId} />
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-6">
        {/* Row 1: Supplier & Destination + Dates */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Supplier & Destination */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  Supplier & Destination
                </CardTitle>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground">
                  <Lock className="h-3.5 w-3.5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                  Supplier
                </Label>
                <Select defaultValue="1">
                  <SelectTrigger>
                    <SelectValue placeholder="Select supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Guy who buys everything</SelectItem>
                    <SelectItem value="2">Industrial Supplies Co.</SelectItem>
                    <SelectItem value="3">Premium Parts Ltd.</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                    Destination Type
                  </Label>
                  <Select defaultValue="storage">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="storage">Storage</SelectItem>
                      <SelectItem value="machine">Machine</SelectItem>
                      <SelectItem value="project">Project</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                    Location
                  </Label>
                  <Select defaultValue="1">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Cool Factory</SelectItem>
                      <SelectItem value="2">Main Warehouse</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dates */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  Dates
                </CardTitle>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground">
                  <Unlock className="h-3.5 w-3.5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                    Order Date
                  </Label>
                  <Input type="date" defaultValue="2026-04-28" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                    Expected Delivery
                  </Label>
                  <Input type="date" defaultValue="2026-05-05" />
                </div>
              </div>
              <div className="pt-2 border-t border-border">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>Created: Apr 28, 2026</span>
                  <span>•</span>
                  <span>Last updated: Apr 29, 2026</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Line Items */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                Line Items
                <Badge variant="outline" className="ml-1 font-normal">
                  {MOCK_ITEMS.length}
                </Badge>
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" className="h-8">
                  <Plus className="h-4 w-4 mr-1" />
                  Add Item
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground">
                  <Unlock className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="border border-border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="py-2 w-12 text-center">#</TableHead>
                    <TableHead className="py-2">Item</TableHead>
                    <TableHead className="py-2 text-right w-24">
                      Ordered
                    </TableHead>
                    <TableHead className="py-2 text-right w-28">
                      Received
                    </TableHead>
                    <TableHead className="py-2 text-right w-24">
                      Unit Price
                    </TableHead>
                    <TableHead className="py-2 text-right w-28">
                      Subtotal
                    </TableHead>
                    <TableHead className="py-2 w-16"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {MOCK_ITEMS.map((item) => {
                    const isComplete = item.received >= item.ordered;
                    const lineTotal = item.ordered * item.unitPrice;
                    return (
                      <TableRow
                        key={item.id}
                        className={
                          isComplete ? 'bg-green-50/50 dark:bg-green-950/20' : ''
                        }
                      >
                        <TableCell className="py-2 text-center text-muted-foreground text-sm">
                          {item.lineNumber}
                        </TableCell>
                        <TableCell className="py-2">
                          <span className="font-medium text-sm">{item.name}</span>
                        </TableCell>
                        <TableCell className="py-2 text-right text-sm">
                          {item.ordered} {item.unit}
                        </TableCell>
                        <TableCell className="py-2 text-right">
                          <Input
                            type="number"
                            defaultValue={item.received}
                            className="w-20 h-7 text-sm text-right ml-auto"
                          />
                        </TableCell>
                        <TableCell className="py-2 text-right text-sm">
                          {formatCurrency(item.unitPrice)}
                        </TableCell>
                        <TableCell className="py-2 text-right text-sm font-medium">
                          {formatCurrency(lineTotal)}
                        </TableCell>
                        <TableCell className="py-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            <div className="flex justify-end mt-4 pr-2">
              <div className="text-right space-y-1">
                <div className="flex items-center justify-between gap-8 text-sm">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span className="font-medium">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex items-center justify-between gap-8 text-sm">
                  <span className="text-muted-foreground">Tax (0%):</span>
                  <span className="font-medium">{formatCurrency(0)}</span>
                </div>
                <div className="flex items-center justify-between gap-8 text-base pt-2 border-t border-border">
                  <span className="font-semibold">Total:</span>
                  <span className="font-bold text-card-foreground">
                    {formatCurrency(subtotal)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Receiving Progress */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Truck className="h-4 w-4 text-muted-foreground" />
                Receiving Progress
              </CardTitle>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground">
                <Unlock className="h-3.5 w-3.5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {totalReceived} of {totalOrdered} items received
                </span>
                <span
                  className={`font-semibold ${
                    receivedPct >= 100
                      ? 'text-green-600 dark:text-green-400'
                      : receivedPct > 0
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-muted-foreground'
                  }`}
                >
                  {receivedPct}%
                </span>
              </div>
              <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    receivedPct >= 100
                      ? 'bg-green-500'
                      : receivedPct > 0
                        ? 'bg-amber-500'
                        : 'bg-muted-foreground/30'
                  }`}
                  style={{ width: `${Math.min(receivedPct, 100)}%` }}
                />
              </div>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <Button size="sm" className="bg-brand-primary hover:bg-brand-primary-hover">
                <CheckCircle2 className="h-4 w-4 mr-1" />
                Mark All Received
              </Button>
              <Button size="sm" variant="outline">
                Save Partial Receiving
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Invoice & Payment */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                Invoice & Payment
              </CardTitle>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground">
                <Lock className="h-3.5 w-3.5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Mock: No invoice yet */}
            <div className="flex items-center justify-between p-4 rounded-lg border border-dashed border-border bg-muted/30">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium text-card-foreground">
                    No invoice created yet
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Create an invoice to track payment
                  </p>
                </div>
              </div>
              <Button size="sm" className="bg-brand-primary hover:bg-brand-primary-hover">
                Create Invoice
              </Button>
            </div>

            {/* Mock: Invoice exists (commented out for mockup - uncomment to see) */}
            {/* 
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="text-green-600 border-green-600/30">
                    INV-2026-001
                  </Badge>
                  <span className="text-sm text-muted-foreground">•</span>
                  <Badge variant="secondary">Unpaid</Badge>
                </div>
                <span className="text-sm font-medium">{formatCurrency(subtotal)}</span>
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <dt className="text-xs text-muted-foreground uppercase">Invoice Date</dt>
                  <dd className="font-medium mt-0.5">Apr 30, 2026</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground uppercase">Due Date</dt>
                  <dd className="font-medium mt-0.5">May 15, 2026</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground uppercase">Amount Paid</dt>
                  <dd className="font-medium mt-0.5">{formatCurrency(0)}</dd>
                </div>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <Button size="sm" className="bg-brand-primary hover:bg-brand-primary-hover">
                  <CreditCard className="h-4 w-4 mr-1" />
                  Record Payment
                </Button>
                <Button size="sm" variant="outline">
                  View Invoice
                </Button>
              </div>
            </div>
            */}
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <StickyNote className="h-4 w-4 text-muted-foreground" />
                Notes
              </CardTitle>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground">
                <Unlock className="h-3.5 w-3.5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                Description
              </Label>
              <Textarea
                placeholder="Add a description for this order..."
                defaultValue="Monthly restock of machine maintenance supplies"
                className="min-h-[80px] resize-none"
              />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                  Order Note (visible to supplier)
                </Label>
                <Textarea
                  placeholder="Add notes for the supplier..."
                  defaultValue="Please deliver to loading dock B"
                  className="min-h-[60px] resize-none"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                  Internal Note (private)
                </Label>
                <Textarea
                  placeholder="Add internal notes..."
                  className="min-h-[60px] resize-none"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Event Log */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <History className="h-4 w-4 text-muted-foreground" />
              Event Log
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Event items */}
              <div className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="w-px flex-1 bg-border mt-2" />
                </div>
                <div className="flex-1 pb-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-card-foreground">
                      Status changed to Budget Approved
                    </p>
                    <span className="text-xs text-muted-foreground">2 hours ago</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="h-5 w-5 rounded-full bg-brand-primary flex items-center justify-center text-white text-[10px] font-semibold">
                      JD
                    </div>
                    <span className="text-xs text-muted-foreground">John Doe</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="w-px flex-1 bg-border mt-2" />
                </div>
                <div className="flex-1 pb-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-card-foreground">
                      Item added: Industrial Bearings 6205-2RS (10 pcs)
                    </p>
                    <span className="text-xs text-muted-foreground">5 hours ago</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="h-5 w-5 rounded-full bg-green-600 flex items-center justify-center text-white text-[10px] font-semibold">
                      SS
                    </div>
                    <span className="text-xs text-muted-foreground">Sarah Smith</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="h-8 w-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                    <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="w-px flex-1 bg-border mt-2" />
                </div>
                <div className="flex-1 pb-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-card-foreground">
                      Status changed to Quotation Requested
                    </p>
                    <span className="text-xs text-muted-foreground">1 day ago</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="h-5 w-5 rounded-full bg-brand-primary flex items-center justify-center text-white text-[10px] font-semibold">
                      JD
                    </div>
                    <span className="text-xs text-muted-foreground">John Doe</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="h-8 w-8 rounded-full bg-brand-primary/10 flex items-center justify-center">
                    <Plus className="h-4 w-4 text-brand-primary" />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-card-foreground">
                      Order created
                    </p>
                    <span className="text-xs text-muted-foreground">Apr 28, 2026</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="h-5 w-5 rounded-full bg-amber-600 flex items-center justify-center text-white text-[10px] font-semibold">
                      MC
                    </div>
                    <span className="text-xs text-muted-foreground">Mike Chen</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PurchaseOrderDetailPanelMockup;
