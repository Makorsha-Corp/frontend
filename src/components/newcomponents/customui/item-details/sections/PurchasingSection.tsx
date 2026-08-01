import React, { useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useGetItemOrdersQuery } from '@/features/items/itemsApi';
import type { ItemOrderRow, ItemOrderType } from '@/types/itemOrders';
import type { ItemSummary } from '@/types/itemSummary';
import { buildAccountHref, buildOrderHref } from '@/lib/entityLinks';
import { cn } from '@/lib/utils';
import { ClipboardList, Loader2 } from 'lucide-react';
import {
  formatMoney,
  formatOrderDate,
  formatQty,
  num,
} from '../itemDetailsFormatters';
import {
  placementTableBodyRow,
  placementTableHeadCell,
  placementTableHeadRow,
  placementTableShell,
} from '../itemDetailsStyles';
import {
  EntityLink,
  SupplierHighlightCard,
} from '../itemDetailsShared';
import {
  hasPurchasingStatsCard,
  orderStatsHasActivity,
  PURCHASING_PERIODS,
  purchasingPeriodToDateRange,
  supplierPeriodHasData,
  type PurchasingPeriod,
} from '../itemDetailsPurchasing';

type OrderFilter = 'all' | ItemOrderType;

const ORDER_FILTER_OPTIONS: { id: OrderFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'purchase_order', label: 'Purchase' },
  { id: 'transfer_order', label: 'Transfer' },
  { id: 'sales_order', label: 'Sales' },
  { id: 'work_order', label: 'Work' },
];

function orderTypeShort(type: ItemOrderType): string {
  switch (type) {
    case 'purchase_order':
      return 'PO';
    case 'transfer_order':
      return 'TR';
    case 'sales_order':
      return 'SO';
    case 'work_order':
      return 'WO';
    default:
      return type;
  }
}

function orderTypeBadgeClass(type: ItemOrderType): string {
  switch (type) {
    case 'purchase_order':
      return 'bg-blue-500/10 text-blue-700 ring-1 ring-blue-500/20 dark:text-blue-300';
    case 'transfer_order':
      return 'bg-amber-500/10 text-amber-700 ring-1 ring-amber-500/20 dark:text-amber-300';
    case 'sales_order':
      return 'bg-emerald-500/10 text-emerald-700 ring-1 ring-emerald-500/20 dark:text-emerald-300';
    case 'work_order':
      return 'bg-violet-500/10 text-violet-700 ring-1 ring-violet-500/20 dark:text-violet-300';
    default:
      return 'bg-muted text-muted-foreground ring-1 ring-border';
  }
}

function ItemOrderTableRow({
  row,
  unit,
  onNavigate,
}: {
  row: ItemOrderRow;
  unit: string;
  onNavigate: () => void;
}) {
  const amount =
    row.line_total != null && row.line_total !== ''
      ? `$${formatMoney(row.line_total)}`
      : '—';

  return (
    <tr className={placementTableBodyRow}>
      <td className="px-3 py-2.5">
        <span
          className={cn(
            'inline-flex h-7 w-7 items-center justify-center rounded-md text-[10px] font-bold uppercase tracking-wide',
            orderTypeBadgeClass(row.order_type)
          )}
          title={row.order_type.replace(/_/g, ' ')}
        >
          {orderTypeShort(row.order_type)}
        </span>
      </td>
      <td className="px-3 py-2.5">
        <EntityLink
          to={buildOrderHref(row.order_type, row.order_id)}
          onNavigate={onNavigate}
          className="block truncate text-sm"
        >
          {row.order_number}
        </EntityLink>
        {row.account_name ? (
          <p className="truncate text-xs text-muted-foreground">{row.account_name}</p>
        ) : null}
      </td>
      <td className="px-3 py-2.5 text-muted-foreground">{formatOrderDate(row.order_date)}</td>
      <td className="px-3 py-2.5 text-right tabular-nums">{formatQty(row.quantity, unit)}</td>
      <td className="px-3 py-2.5">
        {row.status_name ? (
          <Badge variant="secondary" className="max-w-[120px] truncate text-[10px] font-medium">
            {row.status_name.replace(/_/g, ' ')}
          </Badge>
        ) : (
          '—'
        )}
      </td>
      <td className="px-3 py-2.5 text-right tabular-nums">{amount}</td>
    </tr>
  );
}

function ItemOrdersTableBlock({
  itemId,
  unit,
  open,
  period,
  onNavigate,
}: {
  itemId: number;
  unit: string;
  open: boolean;
  period: PurchasingPeriod;
  onNavigate: () => void;
}) {
  const [filter, setFilter] = useState<OrderFilter>('all');
  const dateRange = useMemo(() => purchasingPeriodToDateRange(period), [period]);

  const { data, isLoading, isError } = useGetItemOrdersQuery(
    {
      itemId,
      limit: 100,
      ...dateRange,
      ...(filter !== 'all' ? { order_type: filter } : {}),
    },
    { skip: !open || !itemId }
  );

  useEffect(() => {
    if (!open) setFilter('all');
  }, [open]);

  const rows = data?.items ?? [];
  const total = data?.total ?? 0;

  return (
    <div className="space-y-3 border-t border-border/60 pt-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Order history
        </p>
        {total > 0 ? (
          <p className="text-xs text-muted-foreground">
            {rows.length < total
              ? `Showing ${rows.length} of ${total}`
              : `${total} order${total === 1 ? '' : 's'}`}
          </p>
        ) : null}
      </div>

      <Tabs value={filter} onValueChange={(value) => setFilter(value as OrderFilter)}>
        <TabsList className="h-8 flex-wrap">
          {ORDER_FILTER_OPTIONS.map(({ id, label }) => (
            <TabsTrigger key={id} value={id} className="px-3 text-xs">
              {label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading orders…
        </div>
      ) : isError ? (
        <p className="py-6 text-center text-sm text-destructive">Failed to load orders.</p>
      ) : rows.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <ClipboardList className="h-8 w-8 text-muted-foreground/50" />
          <p className="text-sm font-medium text-card-foreground">No orders</p>
          <p className="max-w-xs text-xs text-muted-foreground">
            {filter === 'all'
              ? 'No orders for this item in the selected period.'
              : `No ${ORDER_FILTER_OPTIONS.find((o) => o.id === filter)?.label?.toLowerCase() ?? ''} orders in this period.`}
          </p>
        </div>
      ) : (
        <div className={placementTableShell}>
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr className={placementTableHeadRow}>
                <th className={cn(placementTableHeadCell, 'w-12')}>Type</th>
                <th className={placementTableHeadCell}>Order</th>
                <th className={placementTableHeadCell}>Date</th>
                <th className={cn(placementTableHeadCell, 'text-right')}>Qty</th>
                <th className={placementTableHeadCell}>Status</th>
                <th className={cn(placementTableHeadCell, 'text-right')}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <ItemOrderTableRow
                  key={`${row.order_type}-${row.order_id}`}
                  row={row}
                  unit={unit}
                  onNavigate={onNavigate}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export function PurchasingSection({
  summary,
  unit,
  period,
  onPeriodChange,
  onNavigate,
  itemId,
  dialogOpen,
}: {
  summary: ItemSummary;
  unit: string;
  period: PurchasingPeriod;
  onPeriodChange: (period: PurchasingPeriod) => void;
  onNavigate: () => void;
  itemId: number;
  dialogOpen: boolean;
}) {
  const showPurchasingStats = hasPurchasingStatsCard(summary);
  const periodPricing = summary.pricing.period[period];
  const orderRow = summary.order_stats[period];
  const supplierPeriod = summary.supplier_stats.period[period];
  const showOrderTotals = orderStatsHasActivity(orderRow);
  const showSuppliers = supplierPeriodHasData(supplierPeriod);
  const { cheapest, most_frequent: mostUsed } = supplierPeriod.highlights;

  return (
    <div className="space-y-4 rounded-lg border border-border bg-muted/20 p-4">
      <Tabs value={period} onValueChange={(value) => onPeriodChange(value as PurchasingPeriod)}>
        <TabsList className="h-8">
          {PURCHASING_PERIODS.map(({ value, label }) => (
            <TabsTrigger key={value} value={value} className="px-3 text-xs">
              {label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {showPurchasingStats ? (
        <>
          <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            <div>
              <p className="text-xs text-muted-foreground">Last PO price</p>
              <p className="font-medium tabular-nums">
                {summary.pricing.last_unit_price != null
                  ? `$${formatMoney(summary.pricing.last_unit_price)}`
                  : '—'}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Avg price</p>
              <p className="font-medium tabular-nums">
                {periodPricing.avg_unit_price_weighted != null
                  ? `$${formatMoney(periodPricing.avg_unit_price_weighted)}`
                  : '—'}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Range</p>
              <p className="text-xs font-medium tabular-nums">
                {periodPricing.min_unit_price != null && periodPricing.max_unit_price != null
                  ? `$${formatMoney(periodPricing.min_unit_price)} – $${formatMoney(periodPricing.max_unit_price)}`
                  : '—'}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Open PO lines</p>
              <p className="font-medium tabular-nums">
                {summary.pricing.open_po_line_count}
                {num(summary.pricing.open_qty_outstanding) > 0
                  ? ` · ${formatQty(summary.pricing.open_qty_outstanding, unit)} outstanding`
                  : ''}
              </p>
            </div>
          </div>

          {showOrderTotals ? (
            <div className="space-y-2 border-t border-border/60 pt-3">
              <p className="text-xs text-muted-foreground">Order totals</p>
              <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                <div>
                  <p className="text-xs text-muted-foreground">Purchase qty</p>
                  <p className="font-medium tabular-nums">{formatQty(orderRow.purchase_qty, unit)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Transfer qty</p>
                  <p className="font-medium tabular-nums">{formatQty(orderRow.transfer_qty, unit)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Sales qty</p>
                  <p className="font-medium tabular-nums">{formatQty(orderRow.sales_qty, unit)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Orders</p>
                  <p className="font-medium tabular-nums">{orderRow.line_count}</p>
                </div>
              </div>
            </div>
          ) : null}

          {showSuppliers ? (
            <div className="space-y-3 border-t border-border/60 pt-3">
              {(cheapest || mostUsed) && (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {cheapest ? (
                    <SupplierHighlightCard
                      label="Cheapest"
                      row={cheapest}
                      primary={
                        cheapest.avg_unit_price_weighted != null
                          ? `$${formatMoney(cheapest.avg_unit_price_weighted)}`
                          : '—'
                      }
                      secondary={`${cheapest.order_count} order${cheapest.order_count === 1 ? '' : 's'} · ${formatQty(cheapest.total_qty, unit)}`}
                      onNavigate={onNavigate}
                    />
                  ) : null}
                  {mostUsed ? (
                    <SupplierHighlightCard
                      label="Most used"
                      row={mostUsed}
                      primary={String(mostUsed.order_count)}
                      secondary={
                        mostUsed.avg_unit_price_weighted != null
                          ? `$${formatMoney(mostUsed.avg_unit_price_weighted)} avg · ${formatQty(mostUsed.total_qty, unit)}`
                          : `${formatQty(mostUsed.total_qty, unit)} total`
                      }
                      onNavigate={onNavigate}
                    />
                  ) : null}
                </div>
              )}
              {supplierPeriod.suppliers.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Suppliers</p>
                  <div className="overflow-x-auto rounded-lg border border-border bg-background/50">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border bg-muted/30 text-left text-xs text-muted-foreground">
                          <th className="px-3 py-2 font-medium">Supplier</th>
                          <th className="px-3 py-2 font-medium text-right">Orders</th>
                          <th className="px-3 py-2 font-medium text-right">Qty</th>
                          <th className="px-3 py-2 font-medium text-right">Avg price</th>
                          <th className="px-3 py-2 font-medium text-right">Spend</th>
                        </tr>
                      </thead>
                      <tbody>
                        {supplierPeriod.suppliers.map((row) => {
                          const isCheapest = cheapest?.account_id === row.account_id;
                          const isMostUsed = mostUsed?.account_id === row.account_id;
                          return (
                            <tr
                              key={row.account_id}
                              className={cn(
                                'border-b border-border/60 last:border-0',
                                (isCheapest || isMostUsed) && 'bg-muted/30'
                              )}
                            >
                              <td className="px-3 py-2">
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <EntityLink
                                    to={buildAccountHref(row.account_id)}
                                    onNavigate={onNavigate}
                                  >
                                    {row.account_name}
                                  </EntityLink>
                                  {isCheapest ? (
                                    <Badge
                                      variant="secondary"
                                      className="h-5 px-1.5 text-[10px] font-normal"
                                    >
                                      Cheapest
                                    </Badge>
                                  ) : null}
                                  {isMostUsed ? (
                                    <Badge
                                      variant="outline"
                                      className="h-5 px-1.5 text-[10px] font-normal"
                                    >
                                      Most used
                                    </Badge>
                                  ) : null}
                                </div>
                              </td>
                              <td className="px-3 py-2 text-right tabular-nums">{row.order_count}</td>
                              <td className="px-3 py-2 text-right tabular-nums">
                                {formatQty(row.total_qty, unit)}
                              </td>
                              <td
                                className={cn(
                                  'px-3 py-2 text-right tabular-nums',
                                  isCheapest && 'font-semibold text-emerald-700 dark:text-emerald-400'
                                )}
                              >
                                {row.avg_unit_price_weighted != null
                                  ? `$${formatMoney(row.avg_unit_price_weighted)}`
                                  : '—'}
                              </td>
                              <td className="px-3 py-2 text-right tabular-nums">
                                ${formatMoney(row.total_spend)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
        </>
      ) : null}

      <ItemOrdersTableBlock
        itemId={itemId}
        unit={unit}
        open={dialogOpen}
        period={period}
        onNavigate={onNavigate}
      />
    </div>
  );
}
