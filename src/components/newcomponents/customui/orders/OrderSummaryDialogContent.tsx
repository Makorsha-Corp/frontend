import React, { useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  useGetPurchaseOrderItemsQuery,
  useGetPurchaseOrderApproversQuery,
} from '@/features/purchaseOrders/purchaseOrdersApi';
import { useGetExpenseOrderItemsQuery } from '@/features/expenseOrders/expenseOrdersApi';
import { useGetAccountsQuery } from '@/features/accounts/accountsApi';
import { useGetStatusesQuery } from '@/features/statuses/statusesApi';
import { useGetFactoriesQuery } from '@/features/factories/factoriesApi';
import { useGetMachinesQuery } from '@/features/machines/machinesApi';
import { useGetProjectsQuery } from '@/features/projects/projectsApi';
import type { PurchaseOrder } from '@/types/purchaseOrder';
import type { ExpenseOrder } from '@/types/expenseOrder';
import { API_LIMITS } from '@/constants/apiLimits';
import { FileSearch, Loader2, Package, Receipt } from 'lucide-react';

const formatCurrency = (value: number | null | undefined) =>
  value != null
    ? new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
      }).format(value)
    : '—';

const formatDate = (value: string | null | undefined) =>
  value
    ? new Date(value).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : '—';

const DetailField: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div>
    <p className="text-xs font-medium text-muted-foreground">{label}</p>
    <p className="mt-0.5 text-sm font-medium text-card-foreground">{value}</p>
  </div>
);

export interface OrderSummaryDialogContentProps {
  purchaseOrder: PurchaseOrder | null;
  expenseOrder: ExpenseOrder | null;
  open: boolean;
  isLoading: boolean;
}

const OrderSummaryDialogContent: React.FC<OrderSummaryDialogContentProps> = ({
  purchaseOrder,
  expenseOrder,
  open,
  isLoading,
}) => {
  const poId = purchaseOrder?.id;
  const eoId = expenseOrder?.id;

  const { data: poItems = [], isLoading: poItemsLoading } = useGetPurchaseOrderItemsQuery(poId!, {
    skip: !open || !poId,
  });
  const { data: approversData, isLoading: approversLoading } = useGetPurchaseOrderApproversQuery(
    poId!,
    { skip: !open || !poId }
  );
  const { data: expenseItems = [], isLoading: expenseItemsLoading } = useGetExpenseOrderItemsQuery(
    eoId!,
    { skip: !open || !eoId }
  );

  const { data: accounts = [] } = useGetAccountsQuery({
    skip: 0,
    limit: API_LIMITS.ACCOUNTS_LIST_MAX,
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
  const { data: projects = [] } = useGetProjectsQuery({
    skip: 0,
    limit: API_LIMITS.FLEXIBLE_1000,
  });

  const accountName = (accountId: number | null | undefined) => {
    if (accountId == null) return '—';
    return accounts.find((a) => a.id === accountId)?.name ?? `Account #${accountId}`;
  };

  const statusLabel = (statusId: number) =>
    statuses.find((s) => s.id === statusId)?.name ?? `Status #${statusId}`;

  const destinationLabel = (order: PurchaseOrder) => {
    if (order.destination_type === 'storage') {
      const factory = factories.find((f) => f.id === order.destination_id);
      return factory ? `Storage · ${factory.name}` : 'Storage';
    }
    if (order.destination_type === 'machine') {
      const machine = machines.find((m) => m.id === order.destination_id);
      return machine ? `Machine · ${machine.name}` : `Machine #${order.destination_id}`;
    }
    if (order.destination_type === 'project') {
      const project = projects.find((p) => p.id === order.destination_id);
      return project ? `Project · ${project.name}` : `Project #${order.destination_id}`;
    }
    return `${order.destination_type} #${order.destination_id}`;
  };

  const poReceiving = useMemo(() => {
    const totalOrdered = poItems.reduce((sum, i) => sum + Number(i.quantity_ordered), 0);
    const totalReceived = poItems.reduce((sum, i) => sum + Number(i.quantity_received), 0);
    const fullyReceivedCount = poItems.filter(
      (i) => Number(i.quantity_received) >= Number(i.quantity_ordered)
    ).length;
    return { totalOrdered, totalReceived, fullyReceivedCount };
  }, [poItems]);

  const poSubtotal = useMemo(
    () => poItems.reduce((sum, i) => sum + Number(i.line_subtotal), 0),
    [poItems]
  );

  const expenseSubtotal = useMemo(
    () => expenseItems.reduce((sum, i) => sum + Number(i.line_subtotal ?? 0), 0),
    [expenseItems]
  );

  const approvalSummary = approversData?.summary;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading order…
      </div>
    );
  }

  if (!purchaseOrder && !expenseOrder) {
    return (
      <div className="inline-flex items-center gap-2 rounded-md border border-border bg-muted/20 px-3 py-3 text-sm text-muted-foreground">
        <FileSearch className="h-4 w-4 shrink-0" />
        Source order is not linked for this invoice.
      </div>
    );
  }

  if (purchaseOrder) {
    return (
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Purchase Order
            </p>
            <p className="text-lg font-semibold text-card-foreground">{purchaseOrder.po_number}</p>
          </div>
          <Badge variant="outline" className="shrink-0 capitalize">
            {statusLabel(purchaseOrder.current_status_id)}
          </Badge>
        </div>

        <div className="grid gap-x-4 gap-y-3 sm:grid-cols-2">
          <DetailField label="Supplier" value={accountName(purchaseOrder.account_id)} />
          <DetailField label="Destination" value={destinationLabel(purchaseOrder)} />
          <DetailField label="Order date" value={formatDate(purchaseOrder.order_date)} />
          <DetailField
            label="Expected delivery"
            value={formatDate(purchaseOrder.expected_delivery_date)}
          />
          <DetailField label="Created" value={formatDate(purchaseOrder.created_at)} />
          <DetailField
            label="Approvals"
            value={
              approversLoading
                ? '…'
                : approvalSummary
                  ? `${approvalSummary.approved_count} / ${approvalSummary.required} met`
                  : purchaseOrder.required_approvals != null
                    ? `Requires ${purchaseOrder.required_approvals}`
                    : '—'
            }
          />
        </div>

        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                Order Items
                {!poItemsLoading && (
                  <Badge variant="outline" className="ml-1 font-normal">
                    {poItems.length}
                  </Badge>
                )}
              </CardTitle>
              {!poItemsLoading && poItems.length > 0 && (
                <span
                  className={`text-xs font-medium ${
                    poReceiving.totalOrdered > 0 &&
                    poReceiving.totalReceived >= poReceiving.totalOrdered
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-muted-foreground'
                  }`}
                >
                  {poReceiving.totalReceived} / {poReceiving.totalOrdered} received
                  {` · ${poReceiving.fullyReceivedCount}/${poItems.length} items complete`}
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {poItemsLoading ? (
              <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading items…
              </div>
            ) : poItems.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border bg-muted/20 px-4 py-8 text-center">
                <Package className="h-6 w-6 text-muted-foreground/50 mx-auto mb-1" />
                <p className="text-sm font-medium text-muted-foreground">No items on this order</p>
              </div>
            ) : (
              <>
                <div className="border border-border rounded-lg overflow-hidden max-h-56 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="py-2 w-12 text-center">#</TableHead>
                        <TableHead className="py-2">Item</TableHead>
                        <TableHead className="py-2 text-right w-24">Ordered</TableHead>
                        <TableHead className="py-2 text-right w-28">Received</TableHead>
                        <TableHead className="py-2 text-right w-24">Unit Price</TableHead>
                        <TableHead className="py-2 text-right w-28">Subtotal</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {poItems.map((item) => {
                        const ordered = Number(item.quantity_ordered);
                        const received = Number(item.quantity_received);
                        const isComplete = received >= ordered;
                        return (
                          <TableRow
                            key={item.id}
                            className={isComplete ? 'bg-green-50/50 dark:bg-green-950/20' : ''}
                          >
                            <TableCell className="py-2 text-center text-muted-foreground text-sm">
                              {item.line_number}
                            </TableCell>
                            <TableCell className="py-2">
                              <span className="font-medium text-sm">
                                {item.item_name ?? `Item #${item.item_id}`}
                              </span>
                            </TableCell>
                            <TableCell className="py-2 text-right text-sm">
                              {ordered} {item.item_unit ?? ''}
                            </TableCell>
                            <TableCell className="py-2 text-right text-sm">
                              <span
                                className={
                                  isComplete
                                    ? 'text-green-600 dark:text-green-400 font-medium'
                                    : received > 0
                                      ? 'text-amber-600 dark:text-amber-400 font-medium'
                                      : 'text-muted-foreground'
                                }
                              >
                                {received} / {ordered}
                              </span>
                            </TableCell>
                            <TableCell className="py-2 text-right text-sm">
                              {formatCurrency(item.unit_price)}
                            </TableCell>
                            <TableCell className="py-2 text-right text-sm font-medium">
                              {formatCurrency(item.line_subtotal)}
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
                      <span className="font-medium">{formatCurrency(poSubtotal)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-8 text-base pt-2 border-t border-border">
                      <span className="font-semibold">Total:</span>
                      <span className="font-bold text-card-foreground">
                        {formatCurrency(purchaseOrder.total_amount ?? poSubtotal)}
                      </span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {purchaseOrder.description ? (
          <div className="rounded-md border border-border bg-muted/10 p-3">
            <p className="text-xs font-medium text-muted-foreground">Description</p>
            <p className="mt-1 text-sm text-card-foreground whitespace-pre-wrap">
              {purchaseOrder.description}
            </p>
          </div>
        ) : null}
      </div>
    );
  }

  if (expenseOrder) {
    return (
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Expense Order
            </p>
            <p className="text-lg font-semibold text-card-foreground">
              {expenseOrder.expense_number}
            </p>
          </div>
          <Badge variant="outline" className="shrink-0 capitalize">
            {statusLabel(expenseOrder.current_status_id)}
          </Badge>
        </div>

        <div className="grid gap-x-4 gap-y-3 sm:grid-cols-2">
          <DetailField label="Category" value={expenseOrder.expense_category} />
          <DetailField label="Supplier" value={accountName(expenseOrder.account_id)} />
          <DetailField label="Expense date" value={formatDate(expenseOrder.expense_date)} />
          <DetailField label="Due date" value={formatDate(expenseOrder.due_date)} />
          <DetailField label="Created" value={formatDate(expenseOrder.created_at)} />
        </div>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <Receipt className="h-4 w-4 text-muted-foreground" />
              Expenses
              {!expenseItemsLoading && (
                <Badge variant="outline" className="ml-1 font-normal">
                  {expenseItems.length}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {expenseItemsLoading ? (
              <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading items…
              </div>
            ) : expenseItems.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border bg-muted/20 px-4 py-8 text-center">
                <Receipt className="h-6 w-6 text-muted-foreground/50 mx-auto mb-1" />
                <p className="text-sm font-medium text-muted-foreground">No expenses on this order</p>
              </div>
            ) : (
              <>
                <div className="border border-border rounded-lg overflow-hidden max-h-56 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="py-2 w-12 text-center">#</TableHead>
                        <TableHead className="py-2">Description</TableHead>
                        <TableHead className="py-2 text-right w-24">Qty</TableHead>
                        <TableHead className="py-2 text-right w-24">Unit Price</TableHead>
                        <TableHead className="py-2 text-right w-28">Subtotal</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {expenseItems.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="py-2 text-center text-muted-foreground text-sm">
                            {item.line_number}
                          </TableCell>
                          <TableCell className="py-2 font-medium text-sm">
                            {item.description ?? `Item #${item.line_number}`}
                          </TableCell>
                          <TableCell className="py-2 text-right text-sm">
                            {item.quantity}
                            {item.unit ? ` ${item.unit}` : ''}
                          </TableCell>
                          <TableCell className="py-2 text-right text-sm">
                            {formatCurrency(item.unit_price)}
                          </TableCell>
                          <TableCell className="py-2 text-right text-sm font-medium">
                            {formatCurrency(item.line_subtotal)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div className="flex justify-end mt-4 pr-2">
                  <div className="text-right space-y-1">
                    <div className="flex items-center justify-between gap-8 text-sm">
                      <span className="text-muted-foreground">Subtotal:</span>
                      <span className="font-medium">{formatCurrency(expenseSubtotal)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-8 text-base pt-2 border-t border-border">
                      <span className="font-semibold">Total:</span>
                      <span className="font-bold text-card-foreground">
                        {formatCurrency(expenseOrder.total_amount ?? expenseSubtotal)}
                      </span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {expenseOrder.description ? (
          <div className="rounded-md border border-border bg-muted/10 p-3">
            <p className="text-xs font-medium text-muted-foreground">Description</p>
            <p className="mt-1 text-sm text-card-foreground whitespace-pre-wrap">
              {expenseOrder.description}
            </p>
          </div>
        ) : null}
      </div>
    );
  }

  return null;
};

export default OrderSummaryDialogContent;
