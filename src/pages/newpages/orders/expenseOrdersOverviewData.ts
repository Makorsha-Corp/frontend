import { endOfDay, isWithinInterval, parseISO, startOfDay } from 'date-fns';
import type { Account } from '@/types/account';
import type { ExpenseOrder } from '@/types/expenseOrder';
import type { InvoiceFilter } from './purchaseOrdersOverviewData';
import { expenseCategoryLabel } from '@/components/newcomponents/customui/orders/expenseOrderConstants';
import {
  deriveExpenseOrderStageFromOrder,
  EO_STAGE_FILTER_OPTIONS,
} from '@/components/newcomponents/customui/orders/expenseOrderMilestones';

export type { InvoiceFilter };

export type ExpenseCategoryFilter = 'all' | string;

export interface ExpenseOrderFilters {
  from?: Date;
  to?: Date;
  statusIds: string[];
  accountId: string;
  categoryFilter: ExpenseCategoryFilter;
  invoice: InvoiceFilter;
  searchQuery: string;
  showCompleteOrders: boolean;
}

/** Manually closed expense order or legacy completed-style status. */
export function isExpenseOrderComplete(order: ExpenseOrder): boolean {
  if (order.order_completed) return true;
  if (order.completed_at) return true;
  return false;
}

export interface ExpenseOrderSummaryStats {
  totalCount: number;
  totalValue: number;
  openCount: number;
  openValue: number;
  notInvoicedCount: number;
}

export function filterExpenseOrders(
  orders: ExpenseOrder[],
  filters: ExpenseOrderFilters,
  accounts: Account[]
): ExpenseOrder[] {
  let rows = [...orders];

  if (filters.from && filters.to) {
    const interval = { start: startOfDay(filters.from), end: endOfDay(filters.to) };
    rows = rows.filter((o) => {
      const expenseDate = parseISO(o.expense_date);
      return isWithinInterval(expenseDate, interval);
    });
  }

  if (filters.statusIds.length > 0) {
    const ids = new Set(filters.statusIds.map((id) => Number(id)));
    rows = rows.filter((o) => {
      const stage = deriveExpenseOrderStageFromOrder(o);
      const option = EO_STAGE_FILTER_OPTIONS.find((s) => s.name === stage);
      return option != null && ids.has(option.id);
    });
  }

  if (filters.accountId !== 'all') {
    const aid = Number(filters.accountId);
    rows = rows.filter((o) => o.account_id === aid);
  }

  if (filters.categoryFilter !== 'all') {
    rows = rows.filter((o) => o.expense_category === filters.categoryFilter);
  }

  if (filters.invoice === 'invoiced') {
    rows = rows.filter((o) => o.invoice_id != null);
  } else if (filters.invoice === 'not_invoiced') {
    rows = rows.filter((o) => o.invoice_id == null);
  }

  if (!filters.showCompleteOrders) {
    rows = rows.filter((o) => !isExpenseOrderComplete(o));
  }

  const q = filters.searchQuery.trim().toLowerCase();
  if (q) {
    rows = rows.filter((o) => {
      const account = o.account_id
        ? accounts.find((a) => a.id === o.account_id)?.name ?? ''
        : '';
      return (
        o.expense_number?.toLowerCase().includes(q) ||
        o.expense_category?.toLowerCase().includes(q) ||
        expenseCategoryLabel(o.expense_category).toLowerCase().includes(q) ||
        account.toLowerCase().includes(q)
      );
    });
  }

  return rows;
}

export function expenseOrderSummaryStats(orders: ExpenseOrder[]): ExpenseOrderSummaryStats {
  let totalValue = 0;
  let openCount = 0;
  let openValue = 0;
  let notInvoicedCount = 0;

  for (const o of orders) {
    const amount = Number(o.total_amount ?? 0);
    totalValue += amount;

    if (!isExpenseOrderComplete(o)) {
      openCount += 1;
      openValue += amount;
    }

    if (o.invoice_id == null) {
      notInvoicedCount += 1;
    }
  }

  return {
    totalCount: orders.length,
    totalValue,
    openCount,
    openValue,
    notInvoicedCount,
  };
}
