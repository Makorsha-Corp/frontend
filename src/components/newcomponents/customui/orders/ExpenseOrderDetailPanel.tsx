import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  useGetExpenseOrderItemsQuery,
  useCreateInvoiceFromExpenseOrderMutation,
  useUpdateExpenseOrderMutation,
} from '@/features/expenseOrders/expenseOrdersApi';
import { useGetStatusesQuery } from '@/features/statuses/statusesApi';
import type { ExpenseOrder } from '@/types/expenseOrder';
import type { Account } from '@/types/account';
import { expenseCategoryLabel } from '@/components/newcomponents/customui/orders/expenseOrderConstants';
import {
  ArrowLeft,
  Loader2,
  Receipt,
  FileText,
  Calendar,
  ChevronRight,
  Trash2,
  Clock,
  StickyNote,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { ORDER_STATUS_WORKFLOW, getNextStatusId } from './orderStatusConstants';
import { API_LIMITS } from '@/constants/apiLimits';

interface ExpenseOrderDetailPanelProps {
  order: ExpenseOrder;
  accounts: Account[];
  onClose: () => void;
  onDelete: () => void;
  onUpdated?: () => void;
}

const ExpenseOrderDetailPanel: React.FC<ExpenseOrderDetailPanelProps> = ({
  order,
  accounts,
  onClose,
  onDelete,
  onUpdated,
}) => {
  const { data: items = [], isLoading: itemsLoading } = useGetExpenseOrderItemsQuery(order.id);
  const { data: statuses = [] } = useGetStatusesQuery({ skip: 0, limit: API_LIMITS.STRICT_100 });
  const [updateOrder, { isLoading: isUpdating }] = useUpdateExpenseOrderMutation();
  const [createInvoiceFromOrder, { isLoading: isCreatingInvoice }] =
    useCreateInvoiceFromExpenseOrderMutation();

  const accountName = order.account_id
    ? accounts.find((a) => a.id === order.account_id)?.name ?? `#${order.account_id}`
    : '—';

  const statusLabel =
    statuses.find((s) => s.id === order.current_status_id)?.name ?? `#${order.current_status_id}`;

  const formatCurrency = (v: number | null | undefined) =>
    v != null
      ? new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 2,
        }).format(v)
      : '—';

  const formatDate = (d: string | null | undefined) =>
    d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

  const qtyWithUnit = (qty: number, unit: string | null) => (unit ? `${qty} ${unit}` : String(qty));

  const nextStatusId = getNextStatusId(order.current_status_id);
  const nextStatusLabel = nextStatusId
    ? (statuses.length > 0 ? statuses : ORDER_STATUS_WORKFLOW).find((s) => s.id === nextStatusId)?.name ??
      `#${nextStatusId}`
    : null;

  const handleStatusChange = async (statusId: number) => {
    try {
      await updateOrder({ id: order.id, data: { current_status_id: statusId } }).unwrap();
      toast.success('Status updated');
      onUpdated?.();
    } catch (err: unknown) {
      const e = err as { data?: { detail?: string } };
      toast.error(e?.data?.detail || 'Failed to update status');
    }
  };

  const handleCreateInvoice = async () => {
    try {
      await createInvoiceFromOrder(order.id).unwrap();
      toast.success('Invoice created from expense order');
      onUpdated?.();
    } catch (err: unknown) {
      const e = err as { data?: { detail?: string } };
      toast.error(e?.data?.detail || 'Failed to create invoice');
    }
  };

  const hasNotes = order.description || order.expense_note || order.internal_note;
  const subtitle = accountName !== '—' ? accountName : expenseCategoryLabel(order.expense_category);

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden">
      <div className="shrink-0 border-b border-border bg-card px-6 py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <Button variant="ghost" size="icon" onClick={onClose} className="mt-0.5 h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back</span>
            </Button>
            <div>
              <h1 className="text-xl font-semibold text-card-foreground">{order.expense_number}</h1>
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge variant="secondary">{statusLabel}</Badge>
            <Button
              variant="outline"
              size="sm"
              className="text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
              onClick={onDelete}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete Order
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Receipt className="h-4 w-4 text-muted-foreground" />
                Order Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <div>
                  <dt className="text-muted-foreground text-xs uppercase tracking-wide">Category</dt>
                  <dd className="font-medium mt-0.5">{expenseCategoryLabel(order.expense_category)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground text-xs uppercase tracking-wide">Account</dt>
                  <dd className="font-medium mt-0.5">{accountName}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground text-xs uppercase tracking-wide">Expense date</dt>
                  <dd className="font-medium mt-0.5">{formatDate(order.expense_date)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground text-xs uppercase tracking-wide">Due date</dt>
                  <dd className="font-medium mt-0.5">{formatDate(order.due_date)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground text-xs uppercase tracking-wide">Subtotal</dt>
                  <dd className="font-medium mt-0.5">{formatCurrency(Number(order.subtotal))}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground text-xs uppercase tracking-wide">Total</dt>
                  <dd className="font-semibold mt-0.5 text-card-foreground">
                    {formatCurrency(Number(order.total_amount))}
                  </dd>
                </div>
              </div>

              <div className="pt-2 border-t border-border space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Invoice</span>
                  </div>
                  {order.invoice_id ? (
                    <Badge variant="outline" className="text-green-600 border-green-600/30">
                      Linked #{order.invoice_id}
                    </Badge>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCreateInvoice}
                      disabled={isCreatingInvoice}
                      className="h-7 text-xs"
                    >
                      {isCreatingInvoice ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        'Create Invoice'
                      )}
                    </Button>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-sm">
                    <span className="text-muted-foreground">Status: </span>
                    <Badge variant="secondary" className="ml-1">
                      {statusLabel}
                    </Badge>
                  </div>
                  {nextStatusId && (
                    <Button
                      size="sm"
                      onClick={() => handleStatusChange(nextStatusId)}
                      disabled={isUpdating}
                      className="h-7 text-xs bg-brand-primary hover:bg-brand-primary-hover"
                    >
                      {isUpdating ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <>
                          {nextStatusLabel}
                          <ChevronRight className="h-3 w-3 ml-1" />
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <StickyNote className="h-4 w-4 text-muted-foreground" />
                Notes
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              {hasNotes ? (
                <div className="space-y-3">
                  {order.description && (
                    <div>
                      <dt className="text-muted-foreground text-xs uppercase tracking-wide mb-1">
                        Description
                      </dt>
                      <dd className="text-card-foreground">{order.description}</dd>
                    </div>
                  )}
                  {order.expense_note && (
                    <div>
                      <dt className="text-muted-foreground text-xs uppercase tracking-wide mb-1">
                        Expense note
                      </dt>
                      <dd className="text-card-foreground">{order.expense_note}</dd>
                    </div>
                  )}
                  {order.internal_note && (
                    <div>
                      <dt className="text-muted-foreground text-xs uppercase tracking-wide mb-1">
                        Internal note
                      </dt>
                      <dd className="text-card-foreground">{order.internal_note}</dd>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground">No notes for this order.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Receipt className="h-4 w-4 text-muted-foreground" />
              Expenses
              <Badge variant="outline" className="ml-1 font-normal">
                {items.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {itemsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : items.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No expenses in this order</p>
            ) : (
              <div className="border border-border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="py-2 w-12 text-center">#</TableHead>
                      <TableHead className="py-2">Description</TableHead>
                      <TableHead className="py-2 text-right">Qty</TableHead>
                      <TableHead className="py-2 text-right">Unit price</TableHead>
                      <TableHead className="py-2 text-right">Subtotal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((it) => (
                      <TableRow key={it.id}>
                        <TableCell className="py-2 text-center text-muted-foreground text-sm">
                          {it.line_number}
                        </TableCell>
                        <TableCell className="py-2">
                          <span className="font-medium text-sm">{it.description ?? '—'}</span>
                        </TableCell>
                        <TableCell className="py-2 text-right text-sm">
                          {qtyWithUnit(it.quantity, it.unit)}
                        </TableCell>
                        <TableCell className="py-2 text-right text-sm">
                          {formatCurrency(it.unit_price)}
                        </TableCell>
                        <TableCell className="py-2 text-right text-sm font-medium">
                          {formatCurrency(it.line_subtotal)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6 text-sm flex-wrap">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Created</span>
                <span className="font-medium">{formatDate(order.created_at)}</span>
              </div>
              <div className="h-4 w-px bg-border hidden sm:block" />
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Current status</span>
                <Badge variant="secondary">{statusLabel}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ExpenseOrderDetailPanel;
